// api/tweets.js → GET /api/tweets?count=6
// 优先从 Supabase 读取当天数据；若无则实时抓取并保存
const { getUserTweets } = require('../lib/tikhub');
const { analyzeContent } = require('../lib/deepseek');
const { getPrompts } = require('../lib/prompts');
const presets = require('../lib/presets');
const { supabase } = require('../lib/supabase');

// 内存缓存（热运行期间有效）
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30分钟

// 北京时间当日日期字符串 YYYY-MM-DD
function getBeijingDateStr(date = new Date()) {
  const bj = new Date(date.getTime() + 8 * 3600 * 1000);
  return bj.toISOString().split('T')[0];
}

// 从 Supabase 读取某天的文章（用 fetched_at 筛选，避免推文发布日期不是今天的漏掉）
async function loadFromDB(dateStr) {
  try {
    const start = new Date(dateStr + 'T00:00:00+08:00').toISOString();
    const end   = new Date(dateStr + 'T23:59:59+08:00').toISOString();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .gte('fetched_at', start)
      .lte('fetched_at', end)
      .order('fetched_at', { ascending: false });
    if (error || !data || data.length === 0) return null;
    // 优先展示有 AI 分析的文章
    const sorted = [...data].sort((a, b) => {
      const aHasAI = (a.ai_analysis || '').length > 50 ? 1 : 0;
      const bHasAI = (b.ai_analysis || '').length > 50 ? 1 : 0;
      return bHasAI - aHasAI;
    });
    return sorted.map(dbRowToArticle);
  } catch (e) {
    console.error('[Tweets] loadFromDB error:', e.message);
    return null;
  }
}

// 保存到 Supabase
async function saveToDB(articles) {
  try {
    const rows = articles.map(a => ({
      source_id: a.sourceHandle || a.sourceName,
      platform: 'x',
      external_id: a.id,
      author_name: a.sourceName,
      author_handle: a.sourceHandle,
      title: a.title,
      original_content: a.originalContent || '',
      translated_content: a.content || '',
      ai_analysis: a.aiSummary || '',
      link: a.url,
      published_at: a.publishTime || new Date().toISOString(),
      raw_data: {
        chapters: a.chapters || [],
        aiComment: a.aiComment || a.aiSummary || '',
        score: a.score || 0,
        summary: a.summary || '',
      },
    }));
    const { error } = await supabase.from('articles').upsert(rows, { onConflict: 'external_id' });
    if (error) console.error('[Tweets] saveToDB error:', error.message);
    else console.log(`[Tweets] 已保存 ${rows.length} 篇文章到 Supabase`);
  } catch (e) {
    console.error('[Tweets] saveToDB exception:', e.message);
  }
}

// DB 行转换为前端 Article 格式
function dbRowToArticle(item) {
  const raw = item.raw_data || {};
  const aiText = item.ai_analysis || '';

  // 解析 ai_analysis 文本为结构化数据（兼容 crawler.js 存的格式）
  const parsed = aiText.length > 50
    ? parseShortAnalysis(aiText, { name: item.author_name, handle: item.author_handle })
    : null;

  // 标题：优先用 AI 解析出的标题，其次用 DB 里的 title
  const title = (parsed?.title && !parsed.title.endsWith('今日动态'))
    ? parsed.title
    : (item.title || item.author_name || '');

  // 中文翻译内容：优先用独立的 translated_content（不等于原文时），其次 AI 解析
  const originalContent = item.original_content || '';
  const translatedRaw = item.translated_content || '';
  const hasRealTranslation = translatedRaw && translatedRaw !== originalContent;
  const content = hasRealTranslation
    ? translatedRaw
    : (parsed?.chineseContent || translatedRaw || originalContent);

  return {
    id: item.external_id || item.id,
    title,
    summary: parsed?.summary || raw.summary || aiText.slice(0, 150) || '',
    content,
    originalContent,
    sourceName: item.author_name,
    sourceHandle: item.author_handle,
    sourceIcon: '𝕏',
    sourceType: 'twitter',
    publishTime: item.fetched_at || item.published_at,
    readTime: Math.max(1, Math.ceil(aiText.length / 400)),
    isBookmarked: false,
    url: item.link || (item.author_handle ? `https://x.com/${item.author_handle.replace('@', '')}` : '#'),
    score: raw.score || 0,
    aiSummary: parsed?.aiComment || raw.aiComment || '',
    aiComment: parsed?.aiComment || raw.aiComment || '',
    chapters: parsed?.chapters?.length ? parsed.chapters : (raw.chapters || []),
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const count = Math.min(parseInt(req.query.count) || 6, 20);
  const todayStr = getBeijingDateStr();

  // 命中内存缓存
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return res.json({ tweets: cache.slice(0, count), cached: true });
  }

  // 尝试从 Supabase 读取今天数据
  const dbArticles = await loadFromDB(todayStr);
  if (dbArticles && dbArticles.length > 0) {
    cache = dbArticles;
    cacheTime = Date.now();
    console.log(`[Tweets] 命中 Supabase 缓存，${dbArticles.length} 篇`);
    return res.json({ tweets: dbArticles.slice(0, count), source: 'db' });
  }

  // 实时抓取
  console.log('[Tweets] 开始实时抓取...');
  const prompts = await getPrompts();
  const xSources = presets.presets.filter(s => s.platform === 'x' && s.enabled);

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
        const aiInput = `博主名称：${source.name} ${source.handle}\n平台：X/Twitter\n日期：${todayStr}\n当日所有推文（原文）：\n\n${tweetLines}`;
        const aiAnalysis = await analyzeContent(prompts.SHORT_CONTENT_PROMPT, aiInput);

        const parsed = parseShortAnalysis(aiAnalysis, source);
        return {
          id: `${source.id}-${todayStr}`,
          title: parsed.title,
          summary: parsed.summary,
          content: parsed.chineseContent,
          originalContent: tweetLines,
          sourceName: source.name,
          sourceHandle: source.handle,
          sourceIcon: '𝕏',
          sourceType: 'twitter',
          publishTime: originals[0]?.created_at || new Date().toISOString(),
          readTime: Math.max(1, Math.ceil(aiAnalysis.length / 400)),
          isBookmarked: false,
          url: `https://x.com/${username}`,
          score: source.score,
          aiSummary: parsed.aiComment,
          aiComment: parsed.aiComment,
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

  // 保存到 Supabase（不等待，异步）
  if (articles.length > 0) {
    saveToDB(articles).catch(console.error);
  }

  cache = articles;
  cacheTime = Date.now();

  res.json({ tweets: articles.slice(0, count), source: 'live' });
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
    title, summary, aiComment,
    chineseContent,
    chapters: keyPoints.length > 0
      ? [{ id: '1', title: '今日核心要点', content: keypointsText, keyPoints }]
      : [],
  };
}
