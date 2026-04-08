// lib/deepseek.js — AI 分析模块（OpenRouter 端点 + deepseek/deepseek-chat）
// 每次调用时动态读取 key，避免 Vercel 冷启动时 env 未就绪的问题
const axios = require('axios');

const BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

function getApiKey() {
  return process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY || '';
}

async function analyzeContent(systemPrompt, userContent) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('[AI] API key 未配置（OPENROUTER_API_KEY 或 DEEPSEEK_API_KEY）');

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
          'HTTP-Referer': 'https://silicon-valley-express.vercel.app',
          'X-Title': 'Silicon-Valley-Express',
        },
        timeout: 90000,
      }
    );
    return res.data?.choices?.[0]?.message?.content || '';
  } catch (err) {
    const errInfo = err.response?.data || err.message;
    console.error(`[AI] 分析失败 (${MODEL}):`, JSON.stringify(errInfo));
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
