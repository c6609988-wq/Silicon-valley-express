// api/health.js → GET /api/health
// 诊断环境变量配置状态
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const checks = {
    SUPABASE_URL:       !!process.env.SUPABASE_URL,
    SUPABASE_KEY:       !!(process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY),
    TIKHUB_API_KEY:     !!process.env.TIKHUB_API_KEY,
    DEEPSEEK_API_KEY:   !!process.env.DEEPSEEK_API_KEY,
    FEISHU_WEBHOOK_URL: !!process.env.FEISHU_WEBHOOK_URL,
    CRON_SECRET:        !!process.env.CRON_SECRET,
  };

  const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  const allOk = missing.length === 0;

  let dbStatus = 'skipped';
  if (checks.SUPABASE_URL && checks.SUPABASE_KEY) {
    try {
      const { supabase } = require('../lib/supabase');
      const { count, error } = await supabase.from('articles').select('*', { count: 'exact', head: true });
      dbStatus = error ? 'error: ' + error.message : 'ok, articles count: ' + count;
    } catch (e) {
      dbStatus = 'exception: ' + e.message;
    }
  }

  res.json({
    ok: allOk,
    env: checks,
    missing,
    db: dbStatus,
    tip: missing.length > 0
      ? '请在 Vercel 后台 Settings → Environment Variables 添加: ' + missing.join(', ')
      : '所有环境变量已配置',
  });
};
