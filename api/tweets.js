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
      ai_analysis: a._aiAnalysisRaw || a.aiSummary || '',
      link: a.url,
      published_at: a.publishTime || new Date().toISOString(),
      raw_data: {
        chapters: a.chapters || [],
        aiComment: a.aiComment || '',
        aiOneliner: a.aiSummary || '',   // 保存核心要点一句话，供 dbRowToArticle 回读
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
  const originalContent = item.original_content || '';
  const translatedRaw = item.translated_content || '';

  // ai_analysis 若为空，尝试从 translated_content 中恢复（旧版保存逻辑导致 DeepSeek 输出存在 translated_content 里）
  const aiText = item.ai_analysis || '';
  const looksLikeAI = (t) => t.length > 50 && (t.includes('核心要点') || t.includes('深度解读') || t.includes('一、'));
  const analysisText = looksLikeAI(aiText) ? aiText
    : (looksLikeAI(translatedRaw) ? translatedRaw : aiText);

  // 解析 ai_analysis（或 translated_content 兜底）文本为结构化数据
  const parsed = analysisText.length > 50
    ? parseShortAnalysis(analysisText, { name: item.author_name, handle: item.author_handle })
    : null;

  // 从 aiOneliner 提取主干子句（主体+事件+结果）
  const aiHeadline = (aiOneliner && /[一-鿿]/.test(aiOneliner))
    ? aiOneliner.replace(/[（(，,。！？；].*/s, '').trim().slice(0, 35)
    : '';
  // DB title：中文直接用；英文（无汉字）则被 AI 主干覆盖
  const dbTitle = item.title || '';
  const dbTitleIsChinese = /[一-鿿]/.test(dbTitle);
  const title = (aiHeadline && aiHeadline.length >= 6)
    ? aiHeadline
    : (dbTitleIsChinese ? dbTitle : (dbTitle || item.author_name || ''));

  // 中文内容：若 translated_content 已经是 DeepSeek AI 输出（不是纯翻译），则取 parsed.chineseContent
  const hasRealTranslation = translatedRaw && translatedRaw !== originalContent
    && translatedRaw.length > 10 && !looksLikeAI(translatedRaw);
  const content = hasRealTranslation
    ? translatedRaw
    : (parsed?.chineseContent || translatedRaw || originalContent);

  // 一句话摘要（核心要点）：优先 parsed.aiOneliner，其次 raw 中存的 aiOneliner
  const aiOneliner = parsed?.aiOneliner || raw.aiOneliner || '';

  // 深度解读（深度解读段）：优先 parsed.aiComment，其次 raw.aiComment，最后截取全文
  const aiComment = parsed?.aiComment || raw.aiComment
    || (aiText.length > 50
        ? aiText.replace(/核心要点|深度解读|原文翻译|###\s*[一二三四五][、.][^\n]*/g, '').trim().slice(0, 300)
        : '');

  // 摘要：优先展示一句话概括（中文），其次深度解读前两句，最后用标题兜底
  const summary = (aiOneliner && /[一-鿿]/.test(aiOneliner) ? aiOneliner : '')
    || parsed?.summary || raw.summary
    || aiComment.split(/(?<=[。！？])\s*/).slice(0, 2).join('').slice(0, 150)
    || title;

  // 章节：优先 parsed.chapters，其次 raw.chapters
  const chapters = parsed?.chapters?.length ? parsed.chapters : (raw.chapters || []);

  return {
    id: item.external_id || item.id,
    title,
    summary,
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
    aiSummary: aiOneliner || aiComment,   // 蓝色加粗摘要：优先一句话概括
    aiComment,                             // 深度解读全文
    chapters,
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const count = Math.min(parseInt(req.query.count) || 6, 20);
  const todayStr = getBeijingDateStr();

  // 命中内存缓存（?refresh=1 强制跳过缓存）
  if (cache && cache.length > 0 && Date.now() - cacheTime < CACHE_TTL && !req.query.refresh) {
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
          aiSummary: parsed.aiOneliner || parsed.aiComment,   // 核心要点一句话
          aiComment: parsed.aiComment,
          chapters: parsed.chapters,
          _aiAnalysisRaw: aiAnalysis,   // 保存完整 DeepSeek 输出到 ai_analysis 列
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
  // ── 生产环境格式（lib/prompts.js v4）: 无序号纯文本标题 ──
  // 核心要点\n[一句话]\n\n深度解读\n[100-300字]\n\n原文翻译\n[翻译]
  const keypointsMatch  = aiText.match(/核心要点\s*\n([\s\S]*?)(?=\n\n?深度解读|\n\n?原文翻译|$)/);
  const commentMatch    = aiText.match(/深度解读\s*\n([\s\S]*?)(?=\n\n?原文翻译|$)/);
  const translationMatch = aiText.match(/原文翻译\s*\n([\s\S]*?)$/);

  // ── 旧本地格式（server/config/prompts.js）: 带序号 ──
  const oldKeypointsMatch   = aiText.match(/一[、.]\s*[今日]*核心要点[\s\S]*?\n([\s\S]*?)(?=###\s*二|二[、.])/);
  const oldCommentMatch     = aiText.match(/[二三][、.]\s*划重点[\s\S]*?\n([\s\S]*?)(?=###\s*[三四]|[三四][、.]|$)/);
  const oldTranslationMatch = aiText.match(/[三四][、.]\s*原文翻译[\s\S]*?\n([\s\S]*?)$/);

  const keypointsText = (keypointsMatch?.[1] || oldKeypointsMatch?.[1] || '').trim();
  const aiComment     = (commentMatch?.[1]    || oldCommentMatch?.[1]    || '').trim();
  const chineseContent = (translationMatch?.[1] || oldTranslationMatch?.[1] || aiText).trim();

  // 生产格式：核心要点 = 单行一句话概括
  const aiOneliner = keypointsText.split('\n')[0].trim();
  const hasChineseOneliner = aiOneliner && /[一-鿿]/.test(aiOneliner);

  // 旧格式：解析编号要点列表
  const keyPoints = keypointsText
    .split('\n').filter(l => /^\d+[.)、]/.test(l.trim()))
    .map(l => l.replace(/^\d+[.)、]\s*/, '').replace(/\[.*?\][：:]\s*/, '').trim())
    .filter(Boolean);

  // 标题：从 aiOneliner 提取主干子句（主体+事件+结果），截到第一个括号/逗号前
  const headlineClause = hasChineseOneliner
    ? aiOneliner.replace(/[（(，,。！？；].*/s, '').trim().slice(0, 35)
    : '';
  const firstPointClean = (keyPoints[0] || '').replace(/\[.*?\][：:]\s*/, '').replace(/[（(，,。].*/s, '').trim().slice(0, 35);
  const title = (headlineClause && headlineClause.length >= 6)
    ? headlineClause
    : (firstPointClean || `${source.name} 今日动态`);

  // 卡片摘要：优先显示 aiOneliner（核心要点一句话），其次 aiComment 前两句
  const summary = (hasChineseOneliner ? aiOneliner : '')
    || aiComment.split(/(?<=[。！？])\s*/).slice(0, 2).join('').trim().slice(0, 150)
    || title;

  return {
    title,
    summary,
    aiComment: aiComment || (hasChineseOneliner ? aiOneliner : ''),
    aiOneliner: hasChineseOneliner ? aiOneliner : '',
    chineseContent,
    chapters: keyPoints.length > 0
      ? [{ id: '1', title: '今日核心要点', content: keypointsText, keyPoints }]
      : [],
  };
}
