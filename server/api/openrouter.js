// server/api/openrouter.js
const axios = require('axios');

const client = axios.create({
  baseURL: (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1').trim(),
  headers: {
    'Authorization': `Bearer ${(process.env.DEEPSEEK_API_KEY || '').trim()}`,
    'Content-Type': 'application/json',
  },
  timeout: 60000
});

// 兜底用 v4-flash（deepseek-chat 已废弃）
const RAW_MODEL = (process.env.DEEPSEEK_MODEL || '').trim();
const DEPRECATED_MODELS = new Set(['deepseek-chat', 'deepseek-coder']);
const MODEL = (RAW_MODEL && !DEPRECATED_MODELS.has(RAW_MODEL)) ? RAW_MODEL : 'deepseek-v4-flash';

async function callAI(systemPrompt, userContent) {
  const response = await client.post('/chat/completions', {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    max_tokens: 4096
  });
  return response.data?.choices?.[0]?.message?.content || '';
}

async function translateToZh(text) {
  const systemPrompt = `你是一个专业翻译，将英文科技内容翻译为简体中文。
要求：
- 准确传达原意，保留语气和情绪
- 保留英文专有名词（如 GPT-4、LLM、RAG 等）
- 如果有俚语、梗或缩写，翻译后括号注释原意
- 只输出翻译结果，不要解释`;
  return callAI(systemPrompt, text);
}

async function analyzeContent(prompt, content) {
  return callAI(prompt, content);
}

module.exports = { translateToZh, analyzeContent, callAI };

