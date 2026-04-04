// server/routes/settings.js
const express = require('express');
const router = express.Router();
const { getPrompts, updatePrompt } = require('../services/settings');

router.get('/prompts', async (req, res) => {
  try {
    const prompts = await getPrompts();
    res.json(prompts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/prompts/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  const allowedKeys = ['SHORT_CONTENT_PROMPT', 'LONG_CONTENT_PROMPT', 'CONTENT_LENGTH_THRESHOLD'];
  if (!allowedKeys.includes(key)) {
    return res.status(400).json({ error: '不支持的配置项' });
  }

  try {
    await updatePrompt(key, value);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
