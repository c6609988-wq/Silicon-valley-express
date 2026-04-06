// api/cron/fetch.js → GET /api/cron/fetch
// Vercel Cron Job 每天 UTC 23:00（北京时间早上 7:00）自动调用
// 采集所有 X/Twitter 信息源，AI 评分后只保存最有价值的 3 条
const { fetchDailyTopTweets } = require('../../lib/crawler');

module.exports = async (req, res) => {
  // 验证是 Vercel 内部调用（安全保护）
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const bjTime = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    console.log(`[Cron] 开始每日 Top3 精选采集 (北京时间 ${bjTime})`);
    const result = await fetchDailyTopTweets();
    console.log('[Cron] 采集完成:', result);
    res.json({ success: true, ...result, bjTime, utcTime: new Date().toISOString() });
  } catch (err) {
    console.error('[Cron] 采集失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
