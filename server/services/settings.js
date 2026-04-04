// server/services/settings.js
const { supabase } = require('../db');
const defaultPrompts = require('../config/prompts');

let promptsCache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getPrompts() {
  const now = Date.now();
  if (promptsCache && now - cacheTime < CACHE_TTL) return promptsCache;

  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['SHORT_CONTENT_PROMPT', 'LONG_CONTENT_PROMPT', 'CONTENT_LENGTH_THRESHOLD']);

  if (!data || data.length === 0) {
    await initDefaultPrompts();
    return defaultPrompts;
  }

  const settings = {};
  data.forEach(row => { settings[row.key] = row.value; });

  promptsCache = {
    SHORT_CONTENT_PROMPT: settings.SHORT_CONTENT_PROMPT || defaultPrompts.SHORT_CONTENT_PROMPT,
    LONG_CONTENT_PROMPT: settings.LONG_CONTENT_PROMPT || defaultPrompts.LONG_CONTENT_PROMPT,
    CONTENT_LENGTH_THRESHOLD: parseInt(settings.CONTENT_LENGTH_THRESHOLD) || defaultPrompts.CONTENT_LENGTH_THRESHOLD
  };
  cacheTime = now;
  return promptsCache;
}

async function updatePrompt(key, value) {
  await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date() }, { onConflict: 'key' });
  promptsCache = null;
  console.log(`[Settings] 提示词 ${key} 已更新`);
}

async function initDefaultPrompts() {
  const rows = Object.entries(defaultPrompts).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date()
  }));
  await supabase.from('settings').upsert(rows, { onConflict: 'key' });
}

module.exports = { getPrompts, updatePrompt };
