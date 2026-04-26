// lib/prompts.js
// 从数据库读取提示词，支持运行时修改，5分钟缓存
// 版本号变更时自动覆盖数据库旧提示词
const { supabase } = require('./supabase');

const PROMPT_VERSION = 'v4'; // ← 每次修改提示词内容时递增，触发自动更新

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getPrompts() {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) return cache;

  const { data } = await supabase.from('settings').select('key, value');
  const map = {};
  (data || []).forEach(row => { map[row.key] = row.value; });

  // 版本号不同 → 强制用最新默认值覆盖数据库
  if (map['PROMPT_VERSION'] !== PROMPT_VERSION) {
    console.log(`[Prompts] 版本更新 ${map['PROMPT_VERSION'] || 'none'} → ${PROMPT_VERSION}，写入新提示词`);
    await resetToDefaults();
    cache = getDefaults();
    cacheTime = now;
    return cache;
  }

  cache = {
    SHORT_CONTENT_PROMPT:      map.SHORT_CONTENT_PROMPT      || getDefaults().SHORT_CONTENT_PROMPT,
    LONG_CONTENT_PROMPT:       map.LONG_CONTENT_PROMPT       || getDefaults().LONG_CONTENT_PROMPT,
    CONTENT_LENGTH_THRESHOLD:  parseInt(map.CONTENT_LENGTH_THRESHOLD) || 1000,
  };
  cacheTime = now;
  return cache;
}

async function resetToDefaults() {
  const d = getDefaults();
  const rows = [
    { key: 'PROMPT_VERSION',           value: PROMPT_VERSION },
    { key: 'SHORT_CONTENT_PROMPT',     value: d.SHORT_CONTENT_PROMPT },
    { key: 'LONG_CONTENT_PROMPT',      value: d.LONG_CONTENT_PROMPT },
    { key: 'CONTENT_LENGTH_THRESHOLD', value: String(d.CONTENT_LENGTH_THRESHOLD) },
  ];
  await supabase.from('settings').upsert(rows, { onConflict: 'key' });
  cache = null;
}

async function updatePrompt(key, value) {
  await supabase.from('settings').upsert({ key, value, updated_at: new Date() }, { onConflict: 'key' });
  cache = null;
}

function getDefaults() {
  return {
    // ────────────────────────────────────────────────────────────
    // 短内容提示词（推文 / 总字数 < 1000）
    // ────────────────────────────────────────────────────────────
    SHORT_CONTENT_PROMPT: `你是硅谷科技圈的信息分析师，帮助中文用户快速理解海外博主的推文动态。

## 格式规则（必须严格执行）
- 禁止使用任何 Markdown 格式，包括 ** * # 等所有特殊符号
- 禁止使用加粗、斜体、标题、列表符号等任何富文本格式
- 严格使用以下三个标题，一字不差

## 输出格式（严格按此输出，不得增减任何标题或格式）

核心要点
一句话概括今日最重要的信息，不超过40字，直接说结论。

深度解读
100字到300字之间的一段话，像懂行的朋友帮你分析"这件事意味着什么、为什么重要、背后逻辑是什么"。不分段，不分点，连贯自然地写完。如果内容平淡无重要信息，直接写：今天主要是日常互动，无重大进展。

原文翻译
[时间] [原创/转发/回复@xxx/引用@xxx]
原文：xxx
翻译：xxx
---
（每条推文一个块，用 --- 分隔，遇到梗或缩写请括号注释）`,

    // ────────────────────────────────────────────────────────────
    // 长内容提示词（视频转录 / 总字数 >= 1000）
    // ────────────────────────────────────────────────────────────
    LONG_CONTENT_PROMPT: `你是AI领域的深度内容提炼专家，同时是资深AI产品经理。任务是把海外视频转录、播客对话中的高价值信息系统性提炼，输出结构清晰、信息密度高的解读。

## 格式规则（必须严格执行）
- 禁止使用任何 Markdown 格式，包括 ** * # 等所有特殊符号
- 严格使用以下三个标题，一字不差

## 输出格式

核心要点
一句话概括内容最核心的价值点，不超过40字。

深度解读
100字到300字之间的一段话。包含：核心观点是什么、支撑逻辑是什么、对AI行业意味着什么。以资深AI产品经理视角写，偶尔可以引用原文精彩表达。不分段，不分点，连贯自然地写完。

原文翻译
对原文内容进行完整中文翻译，保留原文结构和逻辑顺序，遇到专业术语或梗请括号注释。

## 禁止出现
套话（关键启示、值得注意的是）、成语堆砌、小红书体（宝子们、家人们）`,

    CONTENT_LENGTH_THRESHOLD: 1000,
  };
}

module.exports = { getPrompts, updatePrompt, resetToDefaults };
