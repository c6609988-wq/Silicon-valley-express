// server/routes/content.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../db');

router.get('/', async (req, res) => {
  const { source_id, platform, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('articles')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (source_id) query = query.eq('source_id', source_id);
  if (platform) query = query.eq('platform', platform);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json({ items: data || [], total: count, page: parseInt(page), limit: parseInt(limit) });
});

module.exports = router;
