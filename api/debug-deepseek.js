// api/debug-deepseek.js → GET /api/debug-deepseek
// 诊断 DeepSeek API 是否可用
const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const key = process.env.DEEPSEEK_API_KEY;
  const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  if (!key) {
    return res.json({ ok: false, error: 'DEEPSEEK_API_KEY 未配置' });
  }

  try {
    const start = Date.now();
    const result = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model,
        messages: [{ role: 'user', content: '请用中文回复：你好' }],
        max_tokens: 50,
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    const elapsed = Date.now() - start;
    const reply = result.data?.choices?.[0]?.message?.content || '';
    res.json({
      ok: true,
      model,
      baseURL,
      key_prefix: key.slice(0, 8) + '...',
      elapsed_ms: elapsed,
      reply,
    });
  } catch (err) {
    res.json({
      ok: false,
      error: err.message,
      status: err.response?.status,
      data: err.response?.data,
      key_prefix: key ? key.slice(0, 8) + '...' : 'null',
      baseURL,
    });
  }
};
