// api/sources.js → GET/POST /api/sources
const { supabase } = require('../lib/supabase');
const { detectPlatform, extractHandle } = require('../lib/tikhub');
const { fetchSource } = require('../lib/crawler');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('sources')
      .select('*, collections(name, icon)')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  }

  if (req.method === 'POST') {
    const { name, url, platform, collection_id } = req.body;
    if (!name || !url) return res.status(400).json({ error: '名称和链接不能为空' });
    const detectedPlatform = platform || detectPlatform(url);
    if (detectedPlatform === 'wechat') {
      return res.status(400).json({ error: '微信公众号暂不支持，请使用 RSS 地址' });
    }
    const { data, error } = await supabase
      .from('sources')
      .insert({
        name, url,
        platform: detectedPlatform,
        handle: extractHandle(url),
        collection_id: collection_id || null,
        source_type: 'user',
        enabled: true
      })
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    // 异步触发一次采集
    fetchSource(data).catch(e => console.error('立即采集失败:', e.message));
    return res.json({ success: true, source: data });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
