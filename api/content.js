// api/content.js → GET /api/content
// ?format=articles  → 返回前端 Article 对象数组（供首页使用）
// ?source_id=xxx    → 按来源过滤（供详情页回退使用）
const { supabase } = require('../lib/supabase');

function dbRowToArticle(item) {
  const raw = item.raw_data || {};
  return {
    id: item.external_id || item.id,
    title: item.title || item.author_name,
    summary: raw.summary || item.ai_analysis?.slice(0, 150) || '',
    content: item.translated_content || item.ai_analysis || '',
    originalContent: item.original_content || '',
    sourceName: item.author_name,
    sourceHandle: item.author_handle,
    sourceIcon: item.platform === 'x' ? '𝕏' : item.platform === 'youtube' ? '▶️' : '📰',
    sourceType: item.platform === 'x' ? 'twitter' : item.platform,
    publishTime: item.published_at,
    readTime: Math.max(1, Math.ceil((item.ai_analysis || '').length / 400)),
    isBookmarked: false,
    url: item.link || '#',
    score: raw.score || 0,
    aiSummary: raw.aiComment || '',
    aiComment: raw.aiComment || '',
    chapters: raw.chapters || [],
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

  // format=articles → 返回前端格式（供首页使用）
  if (format === 'articles') {
    const articles = (data || []).map(dbRowToArticle);
    return res.json({ articles, total: count || 0 });
  }

  // 默认返回原始 DB 行（供详情页使用）
  res.json({ items: data || [], total: count || 0, page: p, limit: l });
};
