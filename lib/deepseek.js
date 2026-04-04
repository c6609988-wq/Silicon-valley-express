// lib/deepseek.js — DeepSeek AI 分析模块（Vercel 版）
const axios = require('axios');

const client = axios.create({
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 90000
});

const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

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
