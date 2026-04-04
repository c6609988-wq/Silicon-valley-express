const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';
const isConfigured = url.startsWith('http') && key.length > 10;

let supabase = null;

if (isConfigured) {
  supabase = createClient(url, key);
} else {
  console.warn('[DB] 警告：未配置 Supabase 环境变量，数据库功能将不可用');
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
      limit: () => Promise.resolve({ data: [], error: null }),
      then: (resolve) => resolve({ data: [], error: null }),
    };
    return chain;
  };
  supabase = { from: noopChain };
}

module.exports = { supabase };
