// lib/deepseek.js — AI 分析模块
// key 统一走 OpenRouter 端点（deepseek/deepseek-chat 模型）
// 支持环境变量：OPENROUTER_API_KEY 或 DEEPSEEK_API_KEY 二选一皆可
const axios = require('axios');

const API_KEY = process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY;
const BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://silicon-valley-express.vercel.app',
    'X-Title': 'Silicon-Valley-Express',
  },
  timeout: 90000,
});

async function analyzeContent(systemPrompt, userContent) {
  try {
    const res = await client.post('/chat/completions', {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent  },
      ],
      max_tokens: 4096,
    });
    return res.data?.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error(`[AI] 分析失败 (${MODEL}):`, err.response?.data || err.message);
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
