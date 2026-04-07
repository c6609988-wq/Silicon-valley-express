// api/cron/fetch.js → GET /api/cron/fetch
// Vercel Cron Job：每天 UTC 23:00 = 北京时间 07:00
//
// 逻辑：
//   1. 采集 X/Twitter 所有源，AI 评分入库 Top3
//   2. 若有新文章 → 推送今日 Top3 到飞书
//   3. 若无新文章（博主还没发推） → 推送昨天 Top3-6 到飞书
const { fetchDailyTopTweets } = require('../../lib/crawler');
const { pushDailyDigest } = require('../../lib/feishu');
const { supabase } = require('../../lib/supabase');

module.exports = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const bjNow = new Date(Date.now() + 8 * 3600 * 1000);
  const bjTime = bjNow.toISOString().replace('T', ' ').slice(0, 19);
  const todayBJ = bjNow.toISOString().slice(0, 10);
  const yesterdayBJ = new Date(bjNow - 86400000).toISOString().slice(0, 10);

  try {
    console.log(`[Cron-Morning] ── 早间精选采集 (北京时间 ${bjTime}) ──`);

    // Step 1: 采集今日新推文
    const result = await fetchDailyTopTweets();
    console.log(`[Cron-Morning] 采集完成，新增 ${result.processed} 条`);

    let articlesToPush = result.articles || [];
    let pushSource = 'today';

    // Step 2: 没有今日新文章 → 取昨天 top3-6 兜底
    if (articlesToPush.length === 0) {
      console.log('[Cron-Morning] 今日无新文章，读取昨天精选...');
      const yStart = new Date(yesterdayBJ + 'T00:00:00+08:00').toISOString();
      const yEnd   = new Date(yesterdayBJ + 'T23:59:59+08:00').toISOString();

      const { data: yesterday } = await supabase
        .from('articles')
        .select('*')
        .gte('fetched_at', yStart)
        .lte('fetched_at', yEnd)
        .order('fetched_at', { ascending: false })
        .limit(6);

      if (yesterday && yesterday.length > 0) {
        articlesToPush = yesterday;
        pushSource = 'yesterday';
        console.log(`[Cron-Morning] 找到昨天 ${yesterday.length} 条精选文章`);
      } else {
        // 昨天也没有 → 取数据库最新若干条
        const { data: latest } = await supabase
          .from('articles')
          .select('*')
          .order('fetched_at', { ascending: false })
          .limit(6);
        articlesToPush = latest || [];
        pushSource = 'latest';
        console.log(`[Cron-Morning] 取最近 ${articlesToPush.length} 条历史文章`);
      }
    }

    // Step 3: 推送飞书
    if (articlesToPush.length > 0) {
      await pushDailyDigest(articlesToPush, pushSource);
      console.log(`[Cron-Morning] ✓ 飞书推送完成 (来源: ${pushSource}, ${articlesToPush.length} 条)`);
    } else {
      console.log('[Cron-Morning] 数据库暂无文章，跳过飞书推送');
    }

    res.json({
      success: true,
      processed: result.processed,
      feishu_pushed: articlesToPush.length,
      push_source: pushSource,
      bjTime,
    });
  } catch (err) {
    console.error('[Cron-Morning] 执行失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
