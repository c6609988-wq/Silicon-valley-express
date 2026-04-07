// api/trigger.js → GET /api/trigger
// 无需鉴权的手动触发入口，供首次初始化数据库使用
const { fetchDailyTopTweets } = require('../lib/crawler');
const { pushDailyDigest } = require('../lib/feishu');
const { supabase } = require('../lib/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const bjNow = new Date(Date.now() + 8 * 3600 * 1000);
  const bjTime = bjNow.toISOString().replace('T', ' ').slice(0, 19);
  const yesterdayBJ = new Date(bjNow - 86400000).toISOString().slice(0, 10);

  try {
    console.log(`[Trigger] 手动触发采集 (北京时间 ${bjTime})`);

    const result = await fetchDailyTopTweets();
    console.log(`[Trigger] 采集完成，新增 ${result.processed} 条`);

    let articlesToPush = result.articles || [];
    let pushSource = 'today';

    if (articlesToPush.length === 0) {
      const yStart = new Date(yesterdayBJ + 'T00:00:00+08:00').toISOString();
      const yEnd   = new Date(yesterdayBJ + 'T23:59:59+08:00').toISOString();
      const { data: yesterday } = await supabase
        .from('articles').select('*')
        .gte('fetched_at', yStart).lte('fetched_at', yEnd)
        .order('fetched_at', { ascending: false }).limit(6);

      if (yesterday?.length > 0) {
        articlesToPush = yesterday;
        pushSource = 'yesterday';
      } else {
        const { data: latest } = await supabase
          .from('articles').select('*')
          .order('fetched_at', { ascending: false }).limit(6);
        articlesToPush = latest || [];
        pushSource = 'latest';
      }
    }

    if (articlesToPush.length > 0) {
      await pushDailyDigest(articlesToPush, pushSource);
    }

    res.json({
      success: true,
      processed: result.processed,
      feishu_pushed: articlesToPush.length,
      push_source: pushSource,
      bjTime,
      message: result.processed > 0
        ? `成功采集并存入 ${result.processed} 条文章`
        : '今日无新推文，已推送历史文章到飞书',
    });
  } catch (err) {
    console.error('[Trigger] 执行失败:', err);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
};
