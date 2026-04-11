// api/push-feishu.js → POST /api/push-feishu
// 两种触发方式：
//   1. Supabase Database Webhook（articles 表 INSERT 时自动触发）
//   2. 手动 POST 请求（测试/兜底）

const { pushDailyDigest } = require('../lib/feishu');
const { supabase } = require('../lib/supabase');

// 模块级变量：同一实例内防止批量 INSERT 重复推送（5分钟冷却）
let lastPushTime = 0;
const COOLDOWN_MS = 5 * 60 * 1000;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── 安全验证：校验 Supabase Webhook Secret ──────────────────
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (secret) {
    const incoming = req.headers['x-webhook-secret'] || req.headers['authorization']?.replace('Bearer ', '');
    if (incoming !== secret) {
      console.warn('[PushFeishu] 鉴权失败，拒绝请求');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // ── 冷却期检查：防止批量 INSERT 触发多次推送 ────────────────
  const now = Date.now();
  if (now - lastPushTime < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (now - lastPushTime)) / 1000);
    console.log(`[PushFeishu] 冷却中，剩余 ${remaining}s，跳过本次推送`);
    return res.json({ skipped: true, reason: 'cooldown', remainingSeconds: remaining });
  }

  try {
    // ── 取今日北京时间文章 ──────────────────────────────────────
    const bjNow = new Date(Date.now() + 8 * 3600 * 1000);
    const todayBJ = bjNow.toISOString().slice(0, 10);
    const start = new Date(todayBJ + 'T00:00:00+08:00').toISOString();
    const end   = new Date(todayBJ + 'T23:59:59+08:00').toISOString();

    let { data: articles } = await supabase
      .from('articles')
      .select('*')
      .gte('fetched_at', start)
      .lte('fetched_at', end)
      .order('fetched_at', { ascending: false })
      .limit(3);

    // 今日无内容 → 取最近3条兜底
    if (!articles || articles.length === 0) {
      const { data: latest } = await supabase
        .from('articles')
        .select('*')
        .order('fetched_at', { ascending: false })
        .limit(3);
      articles = latest || [];
      console.log(`[PushFeishu] 今日无文章，使用最近 ${articles.length} 条兜底`);
    }

    if (articles.length === 0) {
      return res.json({ success: false, reason: '数据库暂无文章' });
    }

    // ── 推送飞书 ───────────────────────────────────────────────
    lastPushTime = now; // 记录推送时间，开始冷却
    await pushDailyDigest(articles);

    console.log(`[PushFeishu] ✓ 推送完成，共 ${articles.length} 条，时间 ${new Date().toISOString()}`);
    return res.json({
      success: true,
      pushed: articles.length,
      titles: articles.map(a => a.title || a.author_name),
    });

  } catch (err) {
    console.error('[PushFeishu] 执行失败:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
