// api/settings.js → GET/PUT /api/settings
const { getPrompts, updatePrompt } = require('../lib/prompts');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const prompts = await getPrompts();
    return res.json(prompts);
  }

  if (req.method === 'PUT') {
    const { key, value } = req.body;
    const allowed = ['SHORT_CONTENT_PROMPT', 'LONG_CONTENT_PROMPT', 'CONTENT_LENGTH_THRESHOLD'];
    if (!allowed.includes(key)) return res.status(400).json({ error: '不支持的配置项' });
    await updatePrompt(key, value);
    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
