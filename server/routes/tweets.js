// server/routes/tweets.js
const express = require('express');
const router = express.Router();
const { getUserTweets } = require('../api/tikhub');
const { analyzeContent, callAI } = require('../api/openrouter');
const { SHORT_CONTENT_PROMPT } = require('../config/prompts');
const presets = require('../config/presets');
const { setCachedArticles, getCachedArticles } = require('../services/articleCache');
const { supabase } = require('../db');

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

  // 无缓存时先从 Supabase 读取历史数据，确保首页不为空
  try {
    const { data: dbRows, error: dbErr } = await supabase
      .from('articles')
      .select('*')
      .or('is_visible.is.null,is_visible.eq.true')
      .order('published_at', { ascending: false })
      .limit(count * 8);

    if (!dbErr && dbRows && dbRows.length > 0) {
      console.log(`[Tweets] 从 Supabase 加载 ${dbRows.length} 条历史数据`);

      // 按 author_name 分组，每个来源只保留最新一条（去重）
      const byAuthor = new Map();
      for (const row of dbRows) {
        const key = row.author_name || row.id;
        if (!byAuthor.has(key)) byAuthor.set(key, row);
      }

      const rows = Array.from(byAuthor.values()).slice(0, count);

      // 第一步：先构建基础字段（同步）
      const baseArticles = rows.map(row => {
        const platformIcon = row.platform === 'youtube' ? '▶' : row.platform === 'rss' ? '📰' : '𝕏';
        const sourceObj = { name: row.author_name || '未知来源', handle: '', score: 5 };

        let displayContent = '';
        let aiSummary = '';
        let aiComment = '';
        let chapters = [];
        let parsedTitle = '';

        if (row.ai_analysis) {
          const parsed = row.content_type === 'long'
            ? parseLongAnalysis(row.ai_analysis, sourceObj)
            : parseShortAnalysis(row.ai_analysis, sourceObj);
          displayContent = parsed.chineseContent;
          aiSummary = parsed.aiSummary;
          aiComment = parsed.aiComment;
          chapters = parsed.chapters;
          parsedTitle = parsed.title || '';
        } else {
          displayContent = row.translated_content || row.original_content || '';
        }

        const bodyText = displayContent || row.original_content || '';
        const summary = bodyText.replace(/\n+/g, ' ').slice(0, 100).trim();
        const rawTitle = row.title || '';
        const isDbPlaceholder = !rawTitle || /·\s*\d{4}-\d{2}-\d{2}/.test(rawTitle);
        const isParsedPlaceholder = !parsedTitle || /今日动态$/.test(parsedTitle);

        // 英文原文第一句（用于批量翻译降级）
        const firstLine = (row.original_content || '')
          .split(/[。！？\n.!?]/)[0]
          .replace(/https?:\/\/\S+/g, '')
          .trim()
          .slice(0, 120);

        // 标题优先级：AI 解析真实标题 > 数据库已有中文标题 > 英文首句
        const resolvedTitle = !isParsedPlaceholder
          ? parsedTitle
          : (!isDbPlaceholder ? rawTitle : (firstLine || rawTitle));

        // 判断 aiSummary 是否为英文（需要翻译）
        const summaryIsEnglish = !aiSummary || !/[一-鿿]/.test(aiSummary);
        // 摘要翻译素材：优先用 aiSummary（若英文），其次用 firstLine
        const summarySource = summaryIsEnglish && firstLine ? firstLine : '';

        return {
          id: row.external_id || String(row.id),
          title: resolvedTitle,
          _needsTranslation: isParsedPlaceholder && isDbPlaceholder && !!firstLine,
          _firstLine: firstLine,
          _needsSummaryTranslation: summaryIsEnglish && !!summarySource,
          _summarySource: summarySource,
          summary,
          content: bodyText,
          originalContent: row.original_content || '',
          sourceType: row.platform || 'twitter',
          sourceName: row.author_name || '',
          sourceHandle: '',
          sourceIcon: platformIcon,
          publishTime: row.published_at,
          readTime: Math.max(1, Math.ceil(bodyText.length / 400)),
          isBookmarked: false,
          url: row.link || '',
          score: row.quality_score || 5,
          aiSummary,
          aiComment,
          chapters,
          // AI 过滤流水线字段
          contentCategory:  row.content_category || '',
          contentTypeLabel: ({
            deep_analysis: '深度分析', investment_signal: '投资信号',
            product_signal: '产品信号', technical_insight: '技术洞察',
            news: '快讯', founder_note: '创始人',
          })[row.content_category] || '',
          priority:       row.priority || 'medium',
          priorityWeight: ({ high: 3, medium: 2, low: 1, discard: 0 })[row.priority] ?? 1,
          isHighlight:    row.priority === 'high' && ['deep_analysis', 'investment_signal'].includes(row.content_category),
        };
      });

      // 第二步：批量翻译需要中文标题的条目（一次 AI 调用）
      const toTranslate = baseArticles.filter(a => a._needsTranslation);
      if (toTranslate.length > 0) {
        try {
          const numbered = toTranslate
            .map((a, i) => `${i + 1}. ${a._firstLine}`)
            .join('\n');
          const raw = await callAI(
            '你是新闻标题翻译专家。将下列每条英文内容翻译为简洁的中文新闻标题，15字以内，保留专有名词（GPT、Claude等）。按原编号逐行输出，格式：1. 标题\n2. 标题，不要多余说明。',
            numbered
          );
          const lines = raw.split('\n').map(l => l.replace(/^\d+[.)、]\s*/, '').trim()).filter(Boolean);
          toTranslate.forEach((a, i) => {
            if (lines[i]) a.title = lines[i].slice(0, 40);
          });
          console.log('[Tweets] 批量标题翻译完成');
        } catch (e) {
          console.warn('[Tweets] 标题翻译失败，保留英文原句:', e.message);
        }
      }

      // 第三步：批量翻译英文摘要（aiSummary 为空或英文的条目）
      const toTranslateSummary = baseArticles.filter(a => a._needsSummaryTranslation);
      if (toTranslateSummary.length > 0) {
        try {
          const numbered = toTranslateSummary
            .map((a, i) => `${i + 1}. ${a._summarySource}`)
            .join('\n');
          const raw = await callAI(
            '你是内容摘要专家。将下列每条英文内容翻译为一句话中文摘要，20字以内，保留专有名词（GPT、Claude等），语气简洁直接。按原编号逐行输出，格式：1. 摘要\n2. 摘要，不要多余说明。',
            numbered
          );
          const lines = raw.split('\n').map(l => l.replace(/^\d+[.)、]\s*/, '').trim()).filter(Boolean);
          toTranslateSummary.forEach((a, i) => {
            if (lines[i]) a.aiSummary = lines[i].slice(0, 60);
          });
          console.log('[Tweets] 批量摘要翻译完成');
        } catch (e) {
          console.warn('[Tweets] 摘要翻译失败，保留空摘要:', e.message);
        }
      }

      // 清理临时字段
      const dbArticles = baseArticles.map(
        ({ _needsTranslation, _firstLine, _needsSummaryTranslation, _summarySource, ...a }) => a
      );

      setCachedArticles(dbArticles);
      return res.json({ tweets: dbArticles });
    }
  } catch (dbFetchErr) {
    console.warn('[Tweets] Supabase 回退查询失败:', dbFetchErr.message);
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
    .sort((a, b) =>
      ((b.priorityWeight ?? 1) - (a.priorityWeight ?? 1)) ||
      (b.score - a.score)
    );

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

// 解析短信息 AI 输出（V4 推文聚合格式，含「一、摘要」首节）
function parseShortAnalysis(aiText, source) {
  // ── 提取「一、摘要」（一句话中文概括）────────────────────────
  const onelinerMatch = aiText.match(/一[、.]\s*摘要\s*\n([\s\S]*?)(?=###\s*二|二[、.])/);
  const rawOneliner = onelinerMatch ? onelinerMatch[1].trim().split('\n')[0].replace(/^\[|\]$/g, '').trim() : '';
  // 过滤掉英文残留（防止模型未遵守指令）
  const aiOneliner = rawOneliner && /[一-鿿]/.test(rawOneliner) ? rawOneliner : '';

  // ── 提取「二、今日核心要点」────────────────────────────────
  const keypointsMatch = aiText.match(/二[、.]\s*今日核心要点[\s\S]*?\n([\s\S]*?)(?=###\s*三|三[、.])/);
  // 兼容旧格式「一、今日核心要点」
  const keypointsMatchLegacy = aiText.match(/一[、.]\s*今日核心要点[\s\S]*?\n([\s\S]*?)(?=###\s*二|二[、.])/);
  const keypointsText = (keypointsMatch || keypointsMatchLegacy)
    ? (keypointsMatch || keypointsMatchLegacy)[1].trim()
    : '';

  // V4 格式：每条要点由「编号行 + 说明：行」组成，合并为一个 keyPoint
  const keyPoints = [];
  const lines = keypointsText.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (/^\d+[.)、]/.test(line)) {
      const headline = line.replace(/^\d+[.)、]\s*/, '').trim();
      const nextLine = (lines[i + 1] || '').trim();
      const explain = nextLine.startsWith('说明：') || nextLine.startsWith('说明:')
        ? nextLine.replace(/^说明[：:]/, '').trim()
        : '';
      keyPoints.push(explain ? `${headline}（${explain}）` : headline);
      i += explain ? 2 : 1;
    } else {
      i++;
    }
  }

  // ── 提取「三、划重点」────────────────────────────────────
  const commentMatch = aiText.match(/三[、.]\s*划重点[\s\S]*?\n([\s\S]*?)(?=###\s*四|四[、.]|$)/);
  // 兼容旧格式「二、划重点」
  const commentMatchLegacy = aiText.match(/二[、.]\s*划重点[\s\S]*?\n([\s\S]*?)(?=###\s*三|三[、.]|$)/);
  const aiComment = (commentMatch || commentMatchLegacy)
    ? (commentMatch || commentMatchLegacy)[1].trim()
    : '';

  // ── 提取「四、原文翻译」作为中文内容区 ──────────────────────
  const translationMatch = aiText.match(/四[、.]\s*原文翻译[\s\S]*?\n([\s\S]*?)$/)
    || aiText.match(/三[、.]\s*原文翻译[\s\S]*?\n([\s\S]*?)$/);
  const chineseContent = translationMatch ? translationMatch[1].trim() : aiText;

  // ── 生成卡片标题 ─────────────────────────────────────────
  // 优先用「一、摘要」内容；其次取第一个要点去标签后的内容
  const firstPoint = keyPoints[0] || '';
  const titleFromPoint = firstPoint.replace(/\[.*?\][：:]\s*/, '').replace(/（.*?）$/, '').trim().slice(0, 40);
  const titleFromOneliner = aiOneliner.slice(0, 40);
  const titleContent = titleFromOneliner || titleFromPoint;
  const title = titleContent
    ? `${source.name}：${titleContent}`
    : `${source.name} 今日动态`;

  // 摘要：优先用一句话摘要；其次用划重点前两句
  const summaryFromComment = aiComment.split(/(?<=[。！？])\s*/).slice(0, 2).join('').trim();
  const summary = aiOneliner || summaryFromComment || title;

  return {
    title,
    summary,
    aiSummary: aiOneliner || summaryFromComment,   // 摘要区显示中文一句话
    aiComment,
    chineseContent,
    chapters: keyPoints.length > 0
      ? [{ id: '1', title: '今日核心要点', content: keypointsText, keyPoints }]
      : [],
  };
}

// 解析长信息 AI 输出（V3 结构化文章格式）
function parseLongAnalysis(aiText, source) {
  // ── 一、标题 ──────────────────────────────────────────────
  let title = `${source.name} 深度解析`;
  const titleSecMatch = aiText.match(/一[、.]\s*文章标题\s*\n+([\s\S]*?)(?=\n###|\n##|\n\n###)/);
  if (titleSecMatch) {
    const t = titleSecMatch[1].trim().replace(/^[#*>\s]+/, '').split('\n')[0].trim();
    if (t.length >= 6 && t.length <= 80) title = t;
  } else {
    // 降级：扫前15行找有意义标题
    const lines = aiText.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 15)) {
      const cleaned = line.replace(/^[#*\s【】一二三四五六七八九十、.]+/, '').trim();
      if (cleaned.length > 8 && cleaned.length < 80) { title = cleaned; break; }
    }
  }

  // ── 二、引言 ──────────────────────────────────────────────
  const introMatch = aiText.match(/二[、.]\s*引言\s*\n([\s\S]*?)(?=\n###\s*三|\n三[、.])/);
  const firstPara = aiText.split('\n\n').find(p => p.trim().length > 30 && !p.trim().startsWith('#'));
  const rawSummary = introMatch ? introMatch[1].trim() : (firstPara || title);
  const summary = rawSummary.replace(/[#*>]/g, '').replace(/\n+/g, ' ').slice(0, 200);

  // ── 三、核心内容提炼 → chapters ───────────────────────────
  const chaptersSectionMatch = aiText.match(/三[、.]\s*核心内容提炼([\s\S]*?)(?=\n###\s*四|\n四[、.])/);
  const chapters = [];
  if (chaptersSectionMatch) {
    // 按 #### N. 或 #### N、 切章节
    const blocks = chaptersSectionMatch[1].split(/\n####\s+/).filter(b => b.trim());
    blocks.forEach((block, idx) => {
      const blockLines = block.split('\n');
      // 章节标题：第一行去掉序号
      const rawChTitle = blockLines[0].replace(/^\d+[.、]\s*/, '').trim();
      if (!rawChTitle) return;

      // 提取子要点：**标题**\n内容段落
      const keyPoints = [];
      const subMatches = [...block.matchAll(/\*\*([^*\n]+)\*\*\s*\n([\s\S]*?)(?=\n\*\*|\n####|$)/g)];
      subMatches.forEach(m => {
        const ptTitle = m[1].trim();
        const ptBody = m[2].replace(/\n+/g, ' ').trim().slice(0, 120);
        if (ptTitle) keyPoints.push(ptBody ? `${ptTitle}：${ptBody}` : ptTitle);
      });

      // 章节正文（清理 markdown 标记）
      const content = block
        .split('\n').slice(1).join('\n')
        .replace(/\*\*/g, '')
        .trim();

      chapters.push({ id: String(idx + 1), title: rawChTitle, content, keyPoints });
    });
  }

  // ── 四、独家批注 ──────────────────────────────────────────
  const commentMatch = aiText.match(/四[、.]\s*独家批注\s*\n([\s\S]*?)(?=\n###\s*五|\n五[、.]|$)/);
  // 兼容旧版"朋克张"字段
  const punkMatch = aiText.match(/四[、.]\s*朋克张[^#\n]*思考([\s\S]*?)(?=\n###\s*五|\n五[、.]|信息来源|📎|$)/);
  const rawComment = commentMatch ? commentMatch[1] : (punkMatch ? punkMatch[1] : '');
  const aiComment = rawComment.trim().replace(/^[\n\s]+/, '').slice(0, 600);

  return {
    title,
    summary,
    aiSummary: summary,
    aiComment,
    chineseContent: aiText,
    chapters,
  };
}

module.exports = router;
