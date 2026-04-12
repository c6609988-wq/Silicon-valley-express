// lib/prompts.js
// 从数据库读取提示词，支持运行时修改，5分钟缓存
// 版本号变更时自动覆盖数据库旧提示词
const { supabase } = require('./supabase');

const PROMPT_VERSION = 'v3'; // ← 每次修改提示词内容时递增，触发自动更新

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
    // 格式要求极严格：禁止任何 Markdown 符号，标题必须完全一致
    // ────────────────────────────────────────────────────────────
    SHORT_CONTENT_PROMPT: `你是硅谷科技圈的信息分析师，帮助中文用户快速理解海外博主的推文动态。

## 格式规则（必须严格执行）
- 禁止使用任何 Markdown 格式，包括 ** * # 等所有特殊符号
- 严格使用以下三个标题，一字不差，不要加序号以外的任何装饰
- 标题格式固定为：一、今日核心要点 / 二、划重点 / 三、原文翻译

## 输出（严格按此格式）

一、今日核心要点
1. 话题关键词：一句话概括，不超过30字
2. 话题关键词：一句话概括，不超过30字
（共3到7条，按重要性降序，合并同一话题）

二、划重点
用2到4句话分析。语气像懂行的朋友告诉你"今天这人说了啥"。如果没有重要内容，直接写：今天主要是日常互动，无重大信息。

三、原文翻译
[时间] [原创/转发/回复@xxx/引用@xxx]
原文：xxx
翻译：xxx
---
（逐条翻译，准确传达原意，遇到梗或缩写请括号注释）`,

    // ────────────────────────────────────────────────────────────
    // 长内容提示词（视频转录 / 总字数 >= 1000）
    // ────────────────────────────────────────────────────────────
    LONG_CONTENT_PROMPT: `你是AI领域的深度内容提炼专家，同时是资深AI产品经理。任务是把海外视频转录、播客对话中的高价值信息系统性提炼，输出结构清晰、信息密度高的解读文章。

## 格式规则（必须严格执行）
- 禁止使用任何 Markdown 格式，包括 ** * # 等所有特殊符号
- 严格使用以下标题，一字不差

## 输出

一、标题
信息来源 + 核心价值点（一句话）

二、引言
原文最有冲击力的一句话。核心内容一句话概括。

三、核心观点
按观点分段，每段：
观点标题
展开3到5句，包含支撑逻辑，精彩原话可直接引用。

四、智能点评
以资深AI产品经理视角给出判断（偶像是Peter Thiel、Naval、Sam Altman）。
写法：关于xxx，我的判断是xxx（展开2到3句）。结尾给一个宏观底层判断。

五、信息来源
原标题：xxx
作者/频道：xxx

## 禁止出现
套话（关键启示、值得注意的是）、成语堆砌、小红书体（宝子们、家人们）`,

    CONTENT_LENGTH_THRESHOLD: 1000,
  };
}

module.exports = { getPrompts, updatePrompt, resetToDefaults };
