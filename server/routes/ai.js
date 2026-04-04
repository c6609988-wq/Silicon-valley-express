// server/routes/ai.js
const express = require('express');
const router = express.Router();
const { callAI } = require('../api/openrouter');
const { pushDailyDigest } = require('../services/feishu');
const { supabase } = require('../db');

// POST /api/ai/analyze
router.post('/analyze', async (req, res) => {
  const { systemPrompt, content } = req.body;
  if (!content) return res.status(400).json({ error: 'content 不能为空' });

  try {
    const result = await callAI(systemPrompt || '', content);
    res.json({ result });
  } catch (e) {
    console.error('[AI] 分析失败:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ai/push-feishu  手动触发飞书推送（测试用）
router.post('/push-feishu', async (req, res) => {
  try {
    const { data: articles } = await supabase
      .from('articles')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(3);

    if (!articles || articles.length === 0) {
      return res.status(404).json({ error: '数据库暂无文章，请先采集' });
    }

    await pushDailyDigest(articles);
    res.json({ success: true, pushed: articles.length });
  } catch (e) {
    console.error('[Feishu] 手动推送失败:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
