module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const checks = {
    SUPABASE_URL:     !!process.env.SUPABASE_URL,
    SUPABASE_KEY:     !!(process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY),
    TIKHUB_API_KEY:   !!process.env.TIKHUB_API_KEY,
    DEEPSEEK_API_KEY: !!process.env.DEEPSEEK_API_KEY,
  };
  const missing = Object.keys(checks).filter(k => !checks[k]);
  let db = 'skipped';
  if (checks.SUPABASE_URL && checks.SUPABASE_KEY) {
    try {
      const { supabase } = require('../lib/supabase');
      const { count, error } = await supabase.from('articles').select('*', { count: 'exact', head: true });
      db = error ? 'error:' + error.message : 'ok count=' + count;
    } catch(e) { db = 'exception:' + e.message; }
  }
  res.json({ env: checks, missing, db, allOk: missing.length === 0 });
};
