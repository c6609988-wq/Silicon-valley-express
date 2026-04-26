// api/sources/follow.js
// GET  /api/sources/follow        → 返回已关注的 source ID 列表
// POST /api/sources/follow        → 更新关注列表 { followedIds: string[] }

const { supabase } = require('../../lib/supabase');

const SETTINGS_KEY = 'followed_sources';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET：返回当前关注列表
  if (req.method === 'GET') {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single();

    const followedIds = data?.value ? JSON.parse(data.value) : null;
    return res.json({ followedIds });
  }

  // POST：保存关注列表
  if (req.method === 'POST') {
    const { followedIds } = req.body;
    if (!Array.isArray(followedIds)) {
      return res.status(400).json({ error: 'followedIds 必须是数组' });
    }

    const { error } = await supabase
      .from('settings')
      .upsert({ key: SETTINGS_KEY, value: JSON.stringify(followedIds) }, { onConflict: 'key' });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, count: followedIds.length });
  }

  return res.status(405).end();
};
