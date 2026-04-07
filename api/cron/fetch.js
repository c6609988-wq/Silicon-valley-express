// api/cron/fetch.js → GET /api/cron/fetch
// Vercel Cron Job 每天 UTC 23:00（北京时间早上 7:00）自动调用
// 流程：采集 X/Twitter Top3 → 存入 Supabase → 推送飞书机器人
const { fetchDailyTopTweets } = require('../../lib/crawler');
const { pushDailyDigest } = require('../../lib/feishu');
const { supabase } = require('../../lib/supabase');

module.exports = async (req, res) => {
  // 验证是 Vercel 内部调用（安全保护）
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const bjTime = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19);
  const todayBJ = bjTime.slice(0, 10); // YYYY-MM-DD

  try {
    console.log(`[Cron] ── 开始每日精选采集 (北京时间 ${bjTime}) ──`);

    // Step 1: 采集 Top3 推文并存入 Supabase
    const result = await fetchDailyTopTweets();
    console.log(`[Cron] 采集完成，新增 ${result.processed} 条`);

    // Step 2: 从 Supabase 读取今日文章准备推送飞书
    // 取今天（北京时间）已入库的文章，最多3条
    const startUTC = new Date(todayBJ + 'T00:00:00+08:00').toISOString();
    const endUTC = new Date(todayBJ + 'T23:59:59+08:00').toISOString();

    const { data: todayArticles } = await supabase
      .from('articles')
      .select('*')
      .gte('fetched_at', startUTC)
      .lte('fetched_at', endUTC)
      .order('fetched_at', { ascending: false })
      .limit(3);

    // Step 3: 推送飞书（有新文章用新文章，否则取最近3条历史文章兜底）
    let articlesToPush = todayArticles && todayArticles.length > 0 ? todayArticles : null;
    if (!articlesToPush) {
      const { data: latestArticles } = await supabase
        .from('articles')
        .select('*')
        .order('fetched_at', { ascending: false })
        .limit(3);
      articlesToPush = latestArticles && latestArticles.length > 0 ? latestArticles : null;
    }

    if (articlesToPush) {
      console.log(`[Cron] 推送 ${articlesToPush.length} 条文章到飞书...`);
      await pushDailyDigest(articlesToPush);
    } else {
      console.log('[Cron] 数据库无文章，跳过飞书推送');
    }

    res.json({
      success: true,
      processed: result.processed,
      feishu_pushed: (todayArticles || []).length,
      bjTime,
      utcTime: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron] 执行失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
