// api/tweets.js → GET /api/tweets?count=6
// 从预设博主名单实时抓取 + DeepSeek 分析，返回最新 N 篇
const { getUserTweets } = require('../lib/tikhub');
const { analyzeContent } = require('../lib/deepseek');
const { getPrompts } = require('../lib/prompts');
const presets = require('../lib/presets');

// 内存缓存（Vercel 函数冷启动间不持久，热运行期间有效）
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30分钟

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const count = Math.min(parseInt(req.query.count) || 6, 20);

  // 命中缓存
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return res.json({ tweets: cache.slice(0, count) });
  }

  const prompts = await getPrompts();
  const xSources = presets.presets.filter(s => s.platform === 'x' && s.enabled);
  const today = new Date().toISOString().split('T')[0];

  const results = await Promise.allSettled(
    xSources.map(async (source) => {
      try {
        const username = source.handle.replace('@', '');
        const timeline = await getUserTweets(username, 10);
        const originals = timeline.filter(t =>
          !t.is_retweet && !t.retweeted && !t.is_reply
        );
        if (originals.length === 0) return null;

        const tweetLines = originals
          .map((t, i) => `[${i + 1}] ${t.text || t.full_text || ''}`)
          .join('\n\n');
        const aiInput = `博主名称：${source.name} ${source.handle}\n平台：X/Twitter\n日期：${today}\n当日所有推文（原文）：\n\n${tweetLines}`;
        const aiAnalysis = await analyzeContent(prompts.SHORT_CONTENT_PROMPT, aiInput);

        const parsed = parseShortAnalysis(aiAnalysis, source);
        return {
          id: `${source.id}-${today}`,
          title: parsed.title,
          summary: parsed.summary,
          content: parsed.chineseContent,
          sourceName: source.name,
          sourceHandle: source.handle,
          sourceIcon: '𝕏',
          sourceType: 'twitter',
          publishTime: originals[0]?.created_at || new Date().toISOString(),
          readTime: Math.max(1, Math.ceil(aiAnalysis.length / 400)),
          isBookmarked: false,
          url: `https://x.com/${username}`,
          score: source.score,
          aiSummary: parsed.aiSummary,
          chapters: parsed.chapters,
        };
      } catch (err) {
        console.error(`[Tweets] ${source.name} 失败:`, err.message);
        return null;
      }
    })
  );

  const articles = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value)
    .sort((a, b) => b.score - a.score);

  cache = articles;
  cacheTime = Date.now();

  res.json({ tweets: articles.slice(0, count) });
};

function parseShortAnalysis(aiText, source) {
  const keypointsMatch = aiText.match(/一[、.]\s*今日核心要点[\s\S]*?\n([\s\S]*?)(?=###\s*二|二[、.])/);
  const keypointsText = keypointsMatch ? keypointsMatch[1].trim() : '';
  const keyPoints = keypointsText
    .split('\n').filter(l => /^\d+[.)、]/.test(l.trim()))
    .map(l => l.replace(/^\d+[.)、]\s*/, '').trim()).filter(Boolean);

  const commentMatch = aiText.match(/二[、.]\s*划重点[\s\S]*?\n([\s\S]*?)(?=###\s*三|三[、.]|$)/);
  const aiComment = commentMatch ? commentMatch[1].trim() : '';

  const translationMatch = aiText.match(/三[、.]\s*原文翻译[\s\S]*?\n([\s\S]*?)$/);
  const chineseContent = translationMatch ? translationMatch[1].trim() : aiText;

  const firstPoint = keyPoints[0] || '';
  const titleContent = firstPoint.replace(/\[.*?\][：:]\s*/, '').slice(0, 40);
  const title = titleContent ? `${source.name}：${titleContent}` : `${source.name} 今日动态`;
  const summary = aiComment.split(/(?<=[。！？])\s*/).slice(0, 2).join('').trim() || title;

  return {
    title, summary,
    aiSummary: aiComment,
    chineseContent,
    chapters: keyPoints.length > 0
      ? [{ id: '1', title: '今日核心要点', content: keypointsText, keyPoints }]
      : [],
  };
}
