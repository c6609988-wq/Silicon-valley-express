// server/routes/sources.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { fetchAndProcessSource } = require('../services/crawler');
const presets = require('../config/presets');

router.get('/', async (req, res) => {
  const { data: userSources } = await supabase
    .from('sources')
    .select('*')
    .order('created_at', { ascending: false });

  res.json({ presets: presets.presets, userSources: userSources || [] });
});

router.post('/', async (req, res) => {
  const { name, url, platform, collection_id } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: '名称和链接地址不能为空' });
  }

  if (platform === 'wechat') {
    return res.status(400).json({ error: '微信公众号暂不支持，请使用 RSS 地址' });
  }

  const detectedPlatform = platform || detectPlatform(url);

  const { data, error } = await supabase
    .from('sources')
    .insert({
      name,
      url,
      platform: detectedPlatform,
      handle: extractHandle(url),
      collection_id: collection_id || null,
      source_type: 'user',
      enabled: true,
      created_at: new Date()
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  fetchAndProcessSource(data).catch(err =>
    console.error('[Routes] 立即采集失败:', err)
  );

  res.json({ success: true, source: data });
});

router.patch('/:id/toggle', async (req, res) => {
  const { enabled } = req.body;
  await supabase.from('sources').update({ enabled }).eq('id', req.params.id);
  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  await supabase.from('sources').delete().eq('id', req.params.id);
  res.json({ success: true });
});

router.post('/:id/fetch', async (req, res) => {
  const { data: source } = await supabase
    .from('sources')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (!source) return res.status(404).json({ error: '信息源不存在' });

  fetchAndProcessSource(source)
    .then(() => console.log(`[Routes] 手动采集 ${source.name} 完成`))
    .catch(err => console.error('[Routes] 手动采集失败:', err));

  res.json({ success: true, message: '采集任务已启动' });
});

function detectPlatform(url) {
  if (url.includes('twitter.com') || url.includes('x.com')) return 'x';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'rss';
}

function extractHandle(url) {
  const match = url.match(/twitter\.com\/([^/]+)|x\.com\/([^/]+)|youtube\.com\/@([^/]+)/);
  if (!match) return null;
  const username = match[1] || match[2] || match[3];
  return username ? `@${username}` : null;
}

module.exports = router;
