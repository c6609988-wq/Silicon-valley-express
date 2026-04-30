// api/content.js → GET /api/content
// ?format=articles  → 返回前端 Article 对象数组（供首页使用）
// ?source_id=xxx    → 按来源过滤（供详情页回退使用）
const { supabase } = require('../lib/supabase');

/** 提取价值等级（[VALUE: high|medium|low|skip]），默认 medium */
function extractValueLevel(aiText = '') {
  const m = aiText.match(/^\s*\[VALUE:\s*(high|medium|low|skip)\]/i);
  return m ? m[1].toLowerCase() : 'medium';
}

/** 从 ai_analysis 提取摘要一句话（兼容 v5 / v4 / 生产格式） */
function extractOneliner(aiText = '') {
  // v5 格式：一、摘要
  const v5 = aiText.match(/一[、.]\s*摘要\s*\n([\s\S]*?)(?=\n\s*二[、.]|\n\s*###|$)/);
  if (v5) {
    const lines = v5[1].trim().split('\n').filter(l => l.trim() && !/^写法要求|^- /.test(l.trim()));
    if (lines[0]) return lines[0].trim().replace(/\*\*/g, '').replace(/^[\[【]|[\]】]$/g, '');
  }
  // 生产格式：核心要点
  const m = aiText.match(/核心要点\s*\n([\s\S]*?)(?=\n\n?深度解读|\n\n?智能点评|\n\n?原文翻译|\n\n?原文内容|$)/);
  if (m) return m[1].trim().split('\n')[0].trim().replace(/\*\*/g, '');
  // 兜底：去掉标题行取第一句
  return aiText
    .replace(/^\s*\[VALUE:[^\]]+\][^\n]*/g, '')
    .replace(/核心要点|深度解读|智能点评|原文翻译|原文内容|#{1,3}\s.+/g, '')
    .trim().split('\n').find(l => l.trim().length > 5) || '';
}

/** 从 ai_analysis 提取智能点评/深度解读段 */
function extractComment(aiText = '') {
  // v5 格式：三、智能点评
  const v5 = aiText.match(/三[、.]\s*智能点评\s*\n([\s\S]*?)(?=\n\s*四[、.]|\n\s*###|$)/);
  if (v5) return v5[1].trim().replace(/\*\*/g, '');
  // 生产格式：智能点评 / 深度解读
  const m = aiText.match(/(智能点评|深度解读)\s*\n([\s\S]*?)(?=\n\n?原文翻译|\n\n?原文内容|$)/);
  return m ? m[2].trim().replace(/\*\*/g, '') : '';
}

/** content_type → 展示标签映射 */
const CONTENT_TYPE_LABELS = {
  deep_analysis:     '深度分析',
  investment_signal: '投资信号',
  product_signal:    '产品信号',
  technical_insight: '技术洞察',
  news:              '快讯',
  founder_note:      '创始人',
  low_value:         '',
  irrelevant:        '',
};

/** priority 数字权重（用于前端排序） */
const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1, discard: 0 };

function stripValueTag(text = '') {
  return text.replace(/^\s*\[VALUE:\s*(high|medium|low|skip)\][^\n]*\n*/i, '').trim();
}

function dbRowToArticle(item) {
  const raw        = item.raw_data || {};
  const aiText     = stripValueTag(item.ai_analysis || '');
  const aiOneliner = raw.aiOneliner || extractOneliner(aiText);
  const aiComment  = raw.aiComment  || extractComment(aiText);

  const contentCategory = item.content_category || raw.content_type || '';
  const priority        = item.priority || 'medium';
  const qualityScore    = item.quality_score || raw.score || 0;

  // 标题：优先用 AI 摘要主干（主体+事件+结果）；DB 中文标题次之；英文 DB 标题不直接显示
  const aiHeadline = (aiOneliner && /[一-鿿]/.test(aiOneliner))
    ? aiOneliner.replace(/[（(，,。！？；].*/s, '').trim().slice(0, 35)
    : '';
  const dbTitle = item.title || '';
  const dbTitleIsChinese = /[一-鿿]/.test(dbTitle);
  const finalTitle = (aiHeadline && aiHeadline.length >= 6)
    ? aiHeadline
    : (dbTitleIsChinese ? dbTitle : (item.author_name || dbTitle || ''));

  return {
    id:             item.external_id || item.id,
    title:          finalTitle,
    summary:        aiOneliner || raw.summary || aiText.slice(0, 100) || '',
    content:        item.translated_content || aiText || '',
    originalContent: item.original_content || '',
    sourceName:     item.author_name,
    sourceHandle:   item.author_handle,
    sourceIcon:     item.platform === 'x' ? '𝕏' : item.platform === 'youtube' ? '▶️' : '📰',
    sourceType:     item.platform === 'x' ? 'twitter' : item.platform,
    publishTime:    item.fetched_at || item.published_at,
    readTime:       Math.max(1, Math.ceil(aiText.length / 400)),
    isBookmarked:   false,
    url:            item.link || '#',
    score:          qualityScore,
    aiSummary:      aiOneliner,
    aiComment:      aiComment,
    chapters:       raw.chapters || [],
    // 新增：内容分类 & 优先级展示字段
    contentCategory,
    contentTypeLabel: CONTENT_TYPE_LABELS[contentCategory] || '',
    priority,
    priorityWeight:   PRIORITY_WEIGHT[priority] ?? 1,
    isHighlight:      priority === 'high' && ['deep_analysis', 'investment_signal'].includes(contentCategory),
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const { source_id, platform, page = '1', limit = '50', format } = req.query;
  const p = parseInt(page), l = Math.min(parseInt(limit), 100);
  const offset = (p - 1) * l;

  let query = supabase
    .from('articles')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(offset, offset + l - 1);

  if (source_id) query = query.eq('external_id', source_id);
  if (platform) query = query.eq('platform', platform);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // 过滤掉 [VALUE: low/skip] 标记的低价值文章（不展示在前端）
  const visibleData = (data || []).filter(item => {
    const level = extractValueLevel(item.ai_analysis || '');
    return level !== 'low' && level !== 'skip';
  });

  // format=articles → 返回前端格式（供首页使用）
  // 策略：优先今天，无数据则兜底返回最近 50 条历史
  if (format === 'articles') {
    if (visibleData.length > 0) {
      let articles = visibleData.map(dbRowToArticle);
      // 按优先级降序 → 质量分降序 → 时间降序
      articles.sort((a, b) =>
        (b.priorityWeight - a.priorityWeight) ||
        (b.score - a.score) ||
        (new Date(b.publishTime) - new Date(a.publishTime))
      );
      return res.json({ articles, total: count || 0 });
    }
    // 今天无数据，取全库最新 50 条
    const { data: fallback } = await supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(50);
    const visibleFallback = (fallback || []).filter(item => {
      const level = extractValueLevel(item.ai_analysis || '');
      return level !== 'low' && level !== 'skip';
    });
    let articles = visibleFallback.map(dbRowToArticle);
    articles.sort((a, b) =>
      (b.priorityWeight - a.priorityWeight) ||
      (b.score - a.score) ||
      (new Date(b.publishTime) - new Date(a.publishTime))
    );
    return res.json({ articles, total: articles.length, fallback: true });
  }

  // 默认返回原始 DB 行（供详情页使用）
  res.json({ items: data || [], total: count || 0, page: p, limit: l });
};
