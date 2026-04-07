module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // 1. 环境变量检查
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  const checks = {
    SUPABASE_URL:     !!process.env.SUPABASE_URL,
    SUPABASE_KEY:     !!supabaseKey,
    SUPABASE_KEY_NAME: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY'
                     : process.env.SUPABASE_KEY ? 'SUPABASE_KEY'
                     : process.env.SUPABASE_ANON_KEY ? 'ANON_KEY' : 'NONE',
    TIKHUB_API_KEY:   !!process.env.TIKHUB_API_KEY,
    DEEPSEEK_API_KEY: !!process.env.DEEPSEEK_API_KEY,
  };
  const missing = Object.keys(checks).filter(k => !checks[k] && k !== 'SUPABASE_KEY_NAME');

  // 2. Supabase 真实连接测试
  let db = 'skipped';
  if (checks.SUPABASE_URL && checks.SUPABASE_KEY) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const client = createClient(process.env.SUPABASE_URL, supabaseKey);
      const { count, error } = await client.from('articles').select('*', { count: 'exact', head: true });
      db = error ? 'error: ' + error.message : 'connected, count=' + count;
    } catch(e) { db = 'exception: ' + e.message; }
  }

  // 3. TikHub 快速测试
  let tikhub = 'skipped';
  if (checks.TIKHUB_API_KEY) {
    try {
      const axios = require('axios');
      const r = await axios.get('https://api.tikhub.io/api/v1/twitter/web/fetch_user_post_tweet', {
        params: { screen_name: 'sama' },
        headers: { Authorization: `Bearer ${process.env.TIKHUB_API_KEY}` },
        timeout: 10000
      });
      const list = r.data?.data?.tweet_list || r.data?.data?.timeline || [];
      tikhub = `ok, tweets=${list.length}, keys=${Object.keys(r.data?.data||{}).join(',')}`;
    } catch(e) {
      tikhub = `error ${e.response?.status||''}: ${e.message}`;
    }
  }

  res.json({ env: checks, missing, db, tikhub, allOk: missing.length === 0 });
};
