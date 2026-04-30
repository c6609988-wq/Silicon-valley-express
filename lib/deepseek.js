// lib/deepseek.js — AI 分析模块（DeepSeek 原生接口）
// 正确 baseURL: https://api.deepseek.com（无 /v1 后缀）
const axios = require('axios');

const BASE_URL = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').trim().replace(/\/v1\/?$/, '');
// 兜底用 v4-flash（deepseek-chat 已废弃）
const RAW_MODEL = (process.env.DEEPSEEK_MODEL || '').trim();
const DEPRECATED_MODELS = new Set(['deepseek-chat', 'deepseek-coder']);
const MODEL = (RAW_MODEL && !DEPRECATED_MODELS.has(RAW_MODEL)) ? RAW_MODEL : 'deepseek-v4-flash';

function getApiKey() {
  return process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY || '';
}

async function analyzeContent(systemPrompt, userContent) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('[AI] API key 未配置');

  try {
    const res = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userContent  },
        ],
        max_tokens: 4096,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 90000,
      }
    );
    return res.data?.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error('[AI] 分析失败:', err.response?.data || err.message);
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
