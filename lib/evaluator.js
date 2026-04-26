// lib/evaluator.js — DeepSeek AI 价值评分服务
// 仅在 rulePreFilter 通过后才调用，避免浪费 API 配额

const deepseek = require('./deepseek');

// ─── 价值评分 Prompt ────────────────────────────────────────────────────────
const VALUE_SCORING_PROMPT = `你是一个面向中文用户的海外 AI 信息聚合产品的信息筛选器。

你的任务不是总结内容，而是判断这条内容是否值得进入 AI 信息流。

产品定位：
- 聚合海外 AI、科技、投资、产品、创业领域的高价值信息
- 目标用户是 AI 创业者、产品经理、投资人、开发者、科技从业者
- 只保留有信息增量、行业价值、判断价值、产品启发的内容
- 过滤个人日常、低价值互动、纯项目流水账、无上下文短句、非 AI 相关内容

请从以下维度评分：

1. ai_relevance：AI 相关度，0-30 分（是否与 AI、科技、产品、投资、创业直接相关）
2. information_gain：信息增量，0-25 分（是否有新事实、新数据、新框架、新判断）
3. decision_value：决策价值，0-20 分（是否帮助用户形成判断、发现机会、调整行动）
4. completeness：内容完整度，0-15 分（是否有足够上下文，可独立理解）
5. readability：中文卡片可读性，0-10 分（是否适合改写成中文信息卡片）

应保留的内容：
- AI 公司、模型、产品、技术、投资、创业、商业模式相关内容
- 对行业趋势有判断的内容
- 有数据、案例、方法论、框架的内容
- 能帮助用户理解 AI 行业变化的内容
- 长文、深度访谈、投资分析、产品复盘、技术解读

应过滤的内容：
- 个人生活、情绪表达、玩笑、meme
- 与 AI 无关的游戏、旅游、收入炫耀、招聘、日常互动
- 只有一句话但没有信息量
- 单纯转发、回复、感谢、赞同
- 产品小更新但没有行业意义
- 没有上下文的截图或链接
- 只对作者粉丝有意义的内容

请结合来源类型判断：
- high_noise_personality（高噪音个人账号）要更严格，关注 AI 技术/产品/行业洞察
- official_ai_source（官方 AI 来源）的短公告也可能有事实价值
- institution_longform（机构/长文来源）应更重视完整度、信息增量和决策价值

content_type 只能是以下之一：
deep_analysis | news | product_signal | investment_signal | technical_insight | founder_note | low_value | irrelevant

suggested_priority 只能是以下之一：
high | medium | low | discard

输出必须是严格 JSON，不要输出任何解释文字，不要输出 markdown 代码块。

{
  "keep": true 或 false,
  "total_score": 0到100的整数,
  "ai_relevance": 0到30的整数,
  "information_gain": 0到25的整数,
  "decision_value": 0到20的整数,
  "completeness": 0到15的整数,
  "readability": 0到10的整数,
  "content_type": "其中一个枚举值",
  "reason": "一句话说明保留或过滤原因（中文）",
  "suggested_priority": "其中一个枚举值"
}`;

/**
 * 构建发给 DeepSeek 的评分输入文本
 */
function buildEvaluationInput(item, sourceProfile) {
  const lines = [
    `来源名称：${item.author_name || item.source_id || ''}`,
    `来源账号：${item.author_handle || ''}`,
    `来源类型：${sourceProfile.type}`,
    `噪音等级：${sourceProfile.noise_level}`,
    `平台：${item.platform}`,
    `发布时间：${item.published_at ? new Date(item.published_at).toISOString().split('T')[0] : ''}`,
    `内容类型：${item.item_type || 'original'}`,
    '',
    '标题：',
    item.title || '（无标题）',
    '',
    '正文：',
    item.content || '（无正文）',
  ];

  if (item.quoted_content) {
    lines.push('', '引用内容：', item.quoted_content);
  }
  if (item.parent_context) {
    lines.push('', '上下文：', item.parent_context);
  }
  if (item.link) {
    lines.push('', `链接：${item.link}`);
  }

  return lines.join('\n');
}

/**
 * 解析 DeepSeek 返回的 JSON 评分结果
 * 容错处理：去掉代码块、松散匹配 JSON
 */
function parseEvaluationJSON(text = '') {
  // 去掉 ```json ... ``` 包裹
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // 提取第一个 JSON 对象
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`DeepSeek 返回结果中未找到 JSON: ${text.slice(0, 200)}`);

  const parsed = JSON.parse(match[0]);

  const VALID_CONTENT_TYPES = [
    'deep_analysis', 'news', 'product_signal', 'investment_signal',
    'technical_insight', 'founder_note', 'low_value', 'irrelevant',
  ];
  const VALID_PRIORITIES = ['high', 'medium', 'low', 'discard'];

  return {
    keep:              Boolean(parsed.keep),
    total_score:       Math.min(100, Math.max(0, Number(parsed.total_score) || 0)),
    ai_relevance:      Math.min(30,  Math.max(0, Number(parsed.ai_relevance) || 0)),
    information_gain:  Math.min(25,  Math.max(0, Number(parsed.information_gain) || 0)),
    decision_value:    Math.min(20,  Math.max(0, Number(parsed.decision_value) || 0)),
    completeness:      Math.min(15,  Math.max(0, Number(parsed.completeness) || 0)),
    readability:       Math.min(10,  Math.max(0, Number(parsed.readability) || 0)),
    content_type:      VALID_CONTENT_TYPES.includes(parsed.content_type) ? parsed.content_type : 'low_value',
    reason:            String(parsed.reason || ''),
    suggested_priority: VALID_PRIORITIES.includes(parsed.suggested_priority) ? parsed.suggested_priority : 'discard',
  };
}

/**
 * 对单条内容进行 DeepSeek 价值评分
 *
 * @param {Object} item          - 标准化内容对象
 * @param {Object} sourceProfile - 来源策略
 * @returns {Promise<Object>}    - 评分结果
 */
async function evaluateContentValue(item, sourceProfile) {
  const input = buildEvaluationInput(item, sourceProfile);

  let resultText;
  try {
    resultText = await deepseek.analyzeContent(VALUE_SCORING_PROMPT, input);
  } catch (err) {
    console.error(`[Evaluator] DeepSeek 评分 API 失败 (${item.external_id}):`, err.message);
    // 降级：给一个保守的低分结果，不阻塞整体流程
    return {
      keep: false,
      total_score: 0,
      ai_relevance: 0,
      information_gain: 0,
      decision_value: 0,
      completeness: 0,
      readability: 0,
      content_type: 'low_value',
      reason: `评分服务异常: ${err.message}`,
      suggested_priority: 'discard',
      _error: err.message,
    };
  }

  try {
    return parseEvaluationJSON(resultText);
  } catch (parseErr) {
    console.error(`[Evaluator] JSON 解析失败 (${item.external_id}):`, parseErr.message, '\n原始返回:', resultText?.slice(0, 300));
    return {
      keep: false,
      total_score: 0,
      ai_relevance: 0,
      information_gain: 0,
      decision_value: 0,
      completeness: 0,
      readability: 0,
      content_type: 'low_value',
      reason: `JSON 解析失败: ${parseErr.message}`,
      suggested_priority: 'discard',
      _raw: resultText?.slice(0, 500),
    };
  }
}

module.exports = { evaluateContentValue, VALUE_SCORING_PROMPT };
