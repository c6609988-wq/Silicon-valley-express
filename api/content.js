// api/content.js → GET /api/content
const { supabase } = require('../lib/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const { source_id, platform, page = '1', limit = '20' } = req.query;
  const p = parseInt(page), l = Math.min(parseInt(limit), 50);
  const offset = (p - 1) * l;

  let query = supabase
    .from('articles')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(offset, offset + l - 1);

  if (source_id) query = query.eq('source_id', source_id);
  if (platform) query = query.eq('platform', platform);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json({ items: data || [], total: count || 0, page: p, limit: l });
};
