// server/routes/tweets.js
const express = require('express');
const router = express.Router();
const { getUserTweets } = require('../api/tikhub');
const { analyzeContent } = require('../api/openrouter');
const { SHORT_CONTENT_PROMPT } = require('../config/prompts');
const presets = require('../config/presets');
const { setCachedArticles, getCachedArticles } = require('../services/articleCache');

// GET /api/tweets/latest?count=6
// 从预设 X 博主名单各取最新推文，AI 分析后按 score 排序返回
router.get('/latest', async (req, res) => {
  const count = parseInt(req.query.count) || 6;

  // 有缓存直接返回（TTL 30 分钟）
  const cached = getCachedArticles();
  if (cached) {
    console.log('[Tweets] 命中缓存，直接返回');
    return res.json({ tweets: cached.slice(0, count) });
  }

  console.log('[Tweets] 开始实时抓取 + AI 分析...');
  const xSources = presets.presets.filter(s => s.platform === 'x' && s.enabled);
  const today = new Date().toISOString().split('T')[0];

  const results = await Promise.allSettled(
    xSources.map(async (source) => {
      try {
        const username = source.handle.replace('@', '');
        const timeline = await getUserTweets(username, 10);

        // 只保留原创推文（非转发、非回复、非纯图片）
        const originals = timeline.filter(t =>
          !t.is_retweet && !t.retweeted && !t.is_reply && !isImageOnly(t)
        );

        if (originals.length === 0) {
          console.log(`[Tweets] ${source.name} 无有效原创推文`);
          return null;
        }

        // 拼合推文文本
        const tweetLines = originals
          .map((t, i) => `[${i + 1}] ${t.text || t.full_text || ''}`)
          .join('\n\n');
        const aiInput = `博主名称：${source.name} ${source.handle}\n平台：X/Twitter\n日期：${today}\n当日所有推文（原文）：\n\n${tweetLines}`;

        console.log(`[Tweets] 正在分析 ${source.name}（${tweetLines.length} 字，${originals.length} 条）...`);
        const aiAnalysis = await analyzeContent(SHORT_CONTENT_PROMPT, aiInput);

        // Twitter 固定使用短信息格式解析
        const parsed = parseShortAnalysis(aiAnalysis, source);

        const article = {
          id: `${source.id}-${today}`,
          title: parsed.title,
          summary: parsed.summary,
          content: parsed.chineseContent,
          originalContent: tweetLines,
          sourceType: 'twitter',
          sourceName: source.name,
          sourceHandle: source.handle,
          sourceIcon: '𝕏',
          publishTime: originals[0]?.created_at || new Date().toISOString(),
          readTime: Math.max(1, Math.ceil(aiAnalysis.length / 400)),
          isBookmarked: false,
          url: `https://x.com/${username}`,
          score: source.score,
          aiSummary: parsed.aiSummary,
          aiComment: parsed.aiComment,
          chapters: parsed.chapters,
        };

        console.log(`[Tweets] ✓ ${source.name} 分析完成：${article.title}`);
        return article;
      } catch (err) {
        console.error(`[Tweets] ${source.name} 处理失败:`, err.message);
        return null;
      }
    })
  );

  const articles = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value)
    .sort((a, b) => b.score - a.score);

  setCachedArticles(articles);
  res.json({ tweets: articles.slice(0, count) });
});

// GET /api/tweets/:username — 按用户名获取原始推文（调试用）
router.get('/:username', async (req, res) => {
  const { username } = req.params;
  const count = parseInt(req.query.count) || 20;
  try {
    const timeline = await getUserTweets(username, count);
    const tweets = timeline.map(t => ({
      id: t.tweet_id || t.id_str || t.id,
      text: t.text || t.full_text,
      createdAt: t.created_at,
      author: {
        userName: t.author?.screen_name || username,
        name: t.author?.name || username,
      },
      views: t.views,
      favorites: t.favorites,
      retweets: t.retweets,
    }));
    res.json({ tweets });
  } catch (e) {
    console.error(`[Tweets] 获取 @${username} 失败:`, e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── 工具函数 ──────────────────────────────────────────

function isImageOnly(tweet) {
  const text = (tweet.text || tweet.full_text || '').trim();
  return (
    text === '' ||
    (tweet.entities?.media?.length > 0 &&
      text.replace(/https:\/\/t\.co\/\S+/g, '').trim() === '')
  );
}

// 解析短信息 AI 输出（推文聚合格式）
function parseShortAnalysis(aiText, source) {
  // 提取「一、今日核心要点」
  const keypointsMatch = aiText.match(/一[、.]\s*今日核心要点[\s\S]*?\n([\s\S]*?)(?=###\s*二|二[、.])/);
  const keypointsText = keypointsMatch ? keypointsMatch[1].trim() : '';
  const keyPoints = keypointsText
    .split('\n')
    .filter(l => /^\d+[.)、]/.test(l.trim()))
    .map(l => l.replace(/^\d+[.)、]\s*/, '').trim())
    .filter(Boolean);

  // 提取「二、划重点」
  const commentMatch = aiText.match(/二[、.]\s*划重点[\s\S]*?\n([\s\S]*?)(?=###\s*三|三[、.]|$)/);
  const aiComment = commentMatch ? commentMatch[1].trim() : '';

  // 提取「三、原文翻译」作为中文内容区
  const translationMatch = aiText.match(/三[、.]\s*原文翻译[\s\S]*?\n([\s\S]*?)$/);
  const chineseContent = translationMatch ? translationMatch[1].trim() : aiText;

  // 生成卡片标题：取第一个要点去掉标签后的内容
  const firstPoint = keyPoints[0] || '';
  const titleContent = firstPoint.replace(/\[.*?\][：:]\s*/, '').slice(0, 40);
  const title = titleContent
    ? `${source.name}：${titleContent}`
    : `${source.name} 今日动态`;

  // 摘要：划重点前两句
  const summary = aiComment.split(/(?<=[。！？])\s*/).slice(0, 2).join('').trim() || title;

  return {
    title,
    summary,
    aiSummary: aiComment,
    aiComment,
    chineseContent,
    chapters: keyPoints.length > 0
      ? [{ id: '1', title: '今日核心要点', content: keypointsText, keyPoints }]
      : [],
  };
}

// 解析长信息 AI 输出（结构化文章格式）
function parseLongAnalysis(aiText, source) {
  // 标题：找第一行有意义的文本
  let title = `${source.name} 深度解析`;
  const lines = aiText.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 15)) {
    const cleaned = line.replace(/^[#*\s【】一二三四五六七八九十、.]+/, '').trim();
    if (cleaned.length > 8 && cleaned.length < 80) {
      title = cleaned;
      break;
    }
  }

  // 引言/摘要：第一个非标题段落
  const introMatch = aiText.match(/二[、.]\s*引言[\s\S]*?\n([\s\S]*?)(?=###\s*三|三[、.])/);
  const firstPara = aiText.split('\n\n').find(p => p.trim().length > 30 && !p.trim().startsWith('#'));
  const rawSummary = introMatch ? introMatch[1].trim() : (firstPara || title);
  const summary = rawSummary.replace(/[#*]/g, '').slice(0, 120);

  // 朋克张思考
  const punkMatch = aiText.match(/四[、.]\s*(?:朋克张[^#\n]*思考|智能点评)([\s\S]*?)(?=###\s*五|五[、.]|信息来源|📎|$)/);
  const aiComment = punkMatch ? punkMatch[1].trim().slice(0, 500) : '';

  return {
    title,
    summary,
    aiSummary: summary,
    aiComment,
    chineseContent: aiText,
    chapters: [],
  };
}

module.exports = router;
