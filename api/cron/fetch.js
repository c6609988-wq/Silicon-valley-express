// api/cron/fetch.js → GET /api/cron/fetch
// Vercel Cron Job：每天 UTC 00:00 = 北京时间 08:00
//
// 逻辑：
//   1. 读取用户已关注的 source ID 列表
//   2. 只采集已关注博主的内容，AI 评分入库 Top3
//   3. 去重：跳过已推送过的文章（对比 last_pushed_ids）
//   4. 若有新文章 → 推送今日 Top3 到飞书，记录已推送 ID
//   5. 若无新文章 → 推送昨天 Top3-6 到飞书

const { fetchDailyTopTweets } = require('../../lib/crawler');
const { pushDailyDigest } = require('../../lib/feishu');
const { supabase } = require('../../lib/supabase');

// 从 settings 表读取关注列表
async function getFollowedSourceIds() {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'followed_sources')
    .single();
  if (data?.value) {
    try { return JSON.parse(data.value); } catch {}
  }
  return null; // null = 未设置，取全部
}

// 读取上次已推送的文章 ID
async function getLastPushedIds() {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'last_pushed_ids')
    .single();
  if (data?.value) {
    try { return new Set(JSON.parse(data.value)); } catch {}
  }
  return new Set();
}

// 保存本次已推送的文章 ID
async function saveLastPushedIds(ids) {
  await supabase
    .from('settings')
    .upsert({ key: 'last_pushed_ids', value: JSON.stringify(ids) }, { onConflict: 'key' });
}

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

    // Step 1: 读取关注列表
    const followedIds = await getFollowedSourceIds();
    if (followedIds) {
      console.log(`[Cron-Morning] 关注列表: ${followedIds.join(', ')}`);
    } else {
      console.log('[Cron-Morning] 未设置关注列表，采集全部信源');
    }

    // Step 2: 采集今日新推文（传入关注列表过滤）
    const result = await fetchDailyTopTweets(followedIds);
    console.log(`[Cron-Morning] 采集完成，新增 ${result.processed} 条`);

    let articlesToPush = result.articles || [];
    let pushSource = 'today';

    // Step 3: 去重 — 过滤掉已推送的文章
    const lastPushedIds = await getLastPushedIds();
    if (articlesToPush.length > 0) {
      const before = articlesToPush.length;
      articlesToPush = articlesToPush.filter(a => {
        const id = a.external_id || a.id;
        return !lastPushedIds.has(id);
      });
      console.log(`[Cron-Morning] 去重后剩余 ${articlesToPush.length} 条（过滤了 ${before - articlesToPush.length} 条已推）`);
    }

    // Step 4: 无新文章 → 取昨天精选兜底
    if (articlesToPush.length === 0) {
      console.log('[Cron-Morning] 今日无新文章，读取昨天精选...');
      const yStart = new Date(yesterdayBJ + 'T00:00:00+08:00').toISOString();
      const yEnd   = new Date(yesterdayBJ + 'T23:59:59+08:00').toISOString();

      let query = supabase
        .from('articles')
        .select('*')
        .gte('fetched_at', yStart)
        .lte('fetched_at', yEnd)
        .order('fetched_at', { ascending: false })
        .limit(6);

      // 若有关注列表，限定来源
      if (followedIds && followedIds.length > 0) {
        query = query.in('source_id', followedIds);
      }

      const { data: yesterday } = await query;

      if (yesterday && yesterday.length > 0) {
        // 昨天的也去重
        articlesToPush = yesterday.filter(a => !lastPushedIds.has(a.external_id || a.id));
        pushSource = 'yesterday';
        console.log(`[Cron-Morning] 昨天精选 ${articlesToPush.length} 条（去重后）`);
      } else {
        const { data: latest } = await supabase
          .from('articles')
          .select('*')
          .order('fetched_at', { ascending: false })
          .limit(6);
        articlesToPush = (latest || []).filter(a => !lastPushedIds.has(a.external_id || a.id));
        pushSource = 'latest';
        console.log(`[Cron-Morning] 取最近历史 ${articlesToPush.length} 条`);
      }
    }

    // Step 5: 推送飞书 + 记录已推送 ID
    if (articlesToPush.length > 0) {
      await pushDailyDigest(articlesToPush, pushSource);
      const pushedIds = articlesToPush.map(a => a.external_id || a.id).filter(Boolean);
      await saveLastPushedIds(pushedIds);
      console.log(`[Cron-Morning] ✓ 飞书推送完成 (来源: ${pushSource}, ${articlesToPush.length} 条)`);
    } else {
      console.log('[Cron-Morning] 数据库暂无未推送文章，跳过');
    }

    res.json({
      success: true,
      processed: result.processed,
      feishu_pushed: articlesToPush.length,
      push_source: pushSource,
      followed_sources: followedIds?.length ?? 'all',
      bjTime,
    });
  } catch (err) {
    console.error('[Cron-Morning] 执行失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
