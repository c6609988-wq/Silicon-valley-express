// lib/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// 兼容多种命名：SERVICE_ROLE_KEY > SUPABASE_KEY > ANON_KEY
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY;

let supabase;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[Supabase] 未配置环境变量，使用 stub 模式');
  // stub 模式：本地无 Supabase 时不报错
  const noopChain = () => {
    const chain = {
      select: () => chain,
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase 未配置' } }),
      upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase 未配置' } }),
      update: () => chain,
      delete: () => chain,
      eq: () => chain,
      in: () => chain,
      order: () => chain,
      range: () => chain,
      single: () => Promise.resolve({ data: null, error: null }),
      limit: () => Promise.resolve({ data: [], error: null }),
      then: (resolve) => resolve({ data: [], error: null, count: 0 }),
    };
    return chain;
  };
  supabase = { from: noopChain };
} else {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

module.exports = { supabase };
