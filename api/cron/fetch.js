// api/cron/fetch.js → GET /api/cron/fetch
// Vercel Cron Job 每天 UTC 23:00（北京时间早上 7:00）自动调用
const { fetchAllSources } = require('../../lib/crawler');

module.exports = async (req, res) => {
  // 验证是 Vercel 内部调用（安全保护）
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[Cron] 开始定时采集:', new Date().toISOString());
    const result = await fetchAllSources();
    console.log('[Cron] 采集完成:', result);
    res.json({ success: true, ...result, time: new Date().toISOString() });
  } catch (err) {
    console.error('[Cron] 采集失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
