// api/test-tikhub.js → GET /api/test-tikhub?user=sama
// 直接测试 TikHub 原始响应
const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const username = req.query.user || 'sama';

  const client = axios.create({
    baseURL: process.env.TIKHUB_BASE_URL || 'https://api.tikhub.io',
    headers: {
      'Authorization': `Bearer ${process.env.TIKHUB_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 20000
  });

  try {
    const resp = await client.get('/api/v1/twitter/web/fetch_user_post_tweet', {
      params: { screen_name: username }
    });
    const data = resp.data?.data || {};
    const timeline = data.tweet_list || data.timeline || [];
    res.json({
      ok: true,
      username,
      http_status: resp.status,
      tweet_count: timeline.length,
      first_tweet: timeline[0] || null,
      data_keys: Object.keys(data),
    });
  } catch (err) {
    res.json({
      ok: false,
      username,
      error: err.message,
      status: err.response?.status,
      response_data: err.response?.data,
    });
  }
};
