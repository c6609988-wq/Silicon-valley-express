// api/cron/fetch-afternoon.js → GET /api/cron/fetch-afternoon
// Vercel Cron Job：每天 UTC 07:00 = 北京时间 15:00
//
// 逻辑：
//   1. 采集 X/Twitter 所有源的当日新推文，AI 评分入库 Top3
//   2. 若有新文章（今天15点前尚未入库的） → 推送到飞书
//   3. 若无新推文 → 静默跳过，不推送
const { fetchDailyTopTweets } = require('../../lib/crawler');
const { pushDailyDigest } = require('../../lib/feishu');

module.exports = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const bjNow = new Date(Date.now() + 8 * 3600 * 1000);
  const bjTime = bjNow.toISOString().replace('T', ' ').slice(0, 19);

  try {
    console.log(`[Cron-Afternoon] ── 下午精选更新 (北京时间 ${bjTime}) ──`);

    // 采集今日新推文（已入库的会被去重跳过）
    const result = await fetchDailyTopTweets();
    console.log(`[Cron-Afternoon] 采集完成，新增 ${result.processed} 条`);

    if (result.processed > 0 && result.articles && result.articles.length > 0) {
      // 只有真正有新内容才推送
      await pushDailyDigest(result.articles, 'afternoon');
      console.log(`[Cron-Afternoon] ✓ 飞书推送完成，${result.articles.length} 条新内容`);
      res.json({
        success: true,
        processed: result.processed,
        feishu_pushed: result.articles.length,
        bjTime,
      });
    } else {
      // 无新推文，静默跳过
      console.log('[Cron-Afternoon] 今日无新推文，跳过推送');
      res.json({
        success: true,
        processed: 0,
        feishu_pushed: 0,
        skipped: true,
        reason: '今日暂无新推文',
        bjTime,
      });
    }
  } catch (err) {
    console.error('[Cron-Afternoon] 执行失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
