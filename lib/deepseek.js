// lib/deepseek.js — AI 分析模块
// 路由逻辑（全自动，无需用户改环境变量）：
//   1. OPENROUTER_API_KEY 存在 → OpenRouter 端点
//   2. DEEPSEEK_API_KEY 存在 且 DEEPSEEK_BASE_URL 明确指向 deepseek.com → 原生 DeepSeek
//   3. DEEPSEEK_API_KEY 存在 但无 BASE_URL → 视为 OpenRouter key（兼容历史配置）
const axios = require('axios');

const OPENROUTER_KEY  = process.env.OPENROUTER_API_KEY;
const DEEPSEEK_KEY    = process.env.DEEPSEEK_API_KEY;
const EXPLICIT_BASE   = process.env.DEEPSEEK_BASE_URL || '';

const isNativeDeepSeek = EXPLICIT_BASE.includes('deepseek.com');

// 决定端点和 key
let BASE_URL, API_KEY, MODEL;

if (OPENROUTER_KEY) {
  // 明确配置了 OpenRouter key
  BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  API_KEY  = OPENROUTER_KEY;
  MODEL    = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';
} else if (DEEPSEEK_KEY && isNativeDeepSeek) {
  // 明确指向原生 DeepSeek
  BASE_URL = EXPLICIT_BASE;
  API_KEY  = DEEPSEEK_KEY;
  MODEL    = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
} else {
  // DEEPSEEK_API_KEY 未指定 BASE_URL → 当作 OpenRouter key 使用
  BASE_URL = 'https://openrouter.ai/api/v1';
  API_KEY  = DEEPSEEK_KEY;
  MODEL    = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';
}

console.log(`[AI] 使用后端: ${BASE_URL}, 模型: ${MODEL}`);

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://silicon-valley-express.vercel.app',
  },
  timeout: 90000
});

async function analyzeContent(systemPrompt, userContent) {
  try {
    const res = await client.post('/chat/completions', {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      max_tokens: 4096
    });
    return res.data?.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error(`[DeepSeek] 分析失败:`, err.message);
    throw err;
  }
}

async function translateToZh(text) {
  const systemPrompt = `你是一个专业翻译，将英文科技内容翻译为简体中文。
要求：
- 准确传达原意，保留语气和情绪
- 保留英文专有名词（如 GPT-4、LLM、RAG 等）
- 如果有俚语、梗或缩写，翻译后括号注释原意
- 只输出翻译结果，不要解释`;
  return analyzeContent(systemPrompt, text);
}

module.exports = { analyzeContent, translateToZh };
