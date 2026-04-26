// lib/prefilter.js — 规则预过滤（第一道门，无需 AI 调用）
// 目标：在进入 DeepSeek 评分前，以低成本过滤掉明显低价值内容

// ─── AI / 科技 / 产品 / 投资 核心关键词 ─────────────────────────────────────
const AI_KEYWORDS = [
  // AI 核心
  'ai', 'artificial intelligence', 'machine learning', 'deep learning',
  'llm', 'gpt', 'claude', 'gemini', 'mistral', 'llama', 'qwen',
  'agent', 'agents', 'agentic', 'autonomous',
  'model', 'foundation model', 'language model',
  'inference', 'fine-tuning', 'fine tune', 'training',
  'benchmark', 'rlhf', 'transformer', 'diffusion',
  'multimodal', 'vision', 'embedding', 'rag', 'retrieval',
  'prompt', 'context window', 'token',

  // 技术/产品
  'coding', 'copilot', 'cursor', 'devin', 'cognition',
  'api', 'sdk', 'open source', 'github', 'huggingface',
  'automation', 'workflow', 'pipeline',

  // AI 公司
  'openai', 'anthropic', 'deepmind', 'google ai', 'meta ai',
  'xai', 'grok', 'perplexity', 'mistral', 'cohere',
  'stability', 'midjourney', 'runway', 'pika', 'sora',

  // 投资/商业
  'funding', 'raised', 'valuation', 'ipo', 'acquisition',
  'revenue', 'arr', 'mrr', 'growth', 'monetize',
  'venture', 'vc', 'a16z', 'sequoia', 'yc', 'y combinator',
  'startup', 'founder', 'series a', 'series b',
];

// 个人生活类关键词（中英双语）
const PERSONAL_LIFE_KEYWORDS = [
  // 英文
  'vacation', 'holiday', 'travel', 'hiking', 'camping',
  'dinner', 'lunch', 'breakfast', 'restaurant', 'food',
  'gym', 'workout', 'running', 'marathon',
  'birthday', 'anniversary', 'wedding', 'baby',
  'selfie', 'photo', 'family', 'kids', 'dog', 'cat',
  'coffee', 'wine', 'beer', 'party',
  // 中文
  '度假', '旅游', '打卡', '吃饭', '晚餐', '咖啡',
  '健身', '跑步', '家人', '孩子', '自拍', '生日',
];

// 低价值互动类（纯感谢/赞同/meme/GM）
const LOW_VALUE_PATTERNS = [
  /^gm\b/i,
  /^gn\b/i,
  /^lol\.?$/i,
  /^lmao\.?$/i,
  /^haha+\.?$/i,
  /^\+1\.?$/,
  /^agreed?\.?$/i,
  /^thanks?\.?!*$/i,
  /^thank you\.?!*$/i,
  /^congrats?\.?!*$/i,
  /^congratulations\.?!*$/i,
  /^nice\.?!*$/i,
  /^great\.?!*$/i,
  /^wow\.?!*$/i,
  /^🙏+$/,
  /^❤️+$/,
  /^🔥+$/,
  /^[\s🎉🙌👏💯🔥❤️✅🚀]+$/,  // pure emoji
];

// 招聘/giveaway/engagement bait
const SPAM_PATTERNS = [
  /\bhiring\b/i,
  /\bjob opening\b/i,
  /\bwe['']re hiring\b/i,
  /\bapply now\b/i,
  /\bgiveaway\b/i,
  /\bwin a\b/i,
  /\bfollow (me|us) (and|to)\b/i,
  /\bretweet to win\b/i,
  /\blike and (re)?share\b/i,
  /\bdrop your\b/i,
  /\bwho else\b/i,
  /\bhot take\b.*\bthoughts\??/i,
];

/**
 * 规范化文本：去链接、多余空白，转小写用于关键词检测
 */
function normalizeText(text = '') {
  return text
    .replace(/https?:\/\/\S+/g, ' ')  // 去掉 URL
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * 是否包含 AI/科技/投资 关键词信号
 */
function hasAISignal(normalizedText) {
  return AI_KEYWORDS.some(kw => normalizedText.includes(kw));
}

/**
 * 是否是低价值互动（纯感谢/纯 emoji/纯玩笑）
 */
function isLowValueInteraction(rawText = '') {
  const trimmed = rawText.trim();
  return LOW_VALUE_PATTERNS.some(p => p.test(trimmed));
}

/**
 * 是否是个人生活内容
 */
function isPersonalLife(normalizedText) {
  return PERSONAL_LIFE_KEYWORDS.some(kw => normalizedText.includes(kw));
}

/**
 * 是否是 spam / engagement bait
 */
function isSpamOrBait(rawText = '') {
  return SPAM_PATTERNS.some(p => p.test(rawText));
}

/**
 * 规则预过滤主函数
 *
 * @param {Object} item - 标准化后的内容对象
 *   item.external_id  string
 *   item.item_type    'original' | 'retweet' | 'reply' | 'quote' | 'video' | 'article'
 *   item.content      string  原始正文
 *   item.title        string  标题（RSS/YouTube）
 *   item.has_link     boolean
 *   item.quoted_content string
 *   item.parent_context string
 *   item.has_media    boolean
 *
 * @param {Object} sourceProfile - 来源策略（从 sourceProfiles.js 获取）
 *
 * @returns {{ pass: boolean, reason: string }}
 */
function rulePreFilter(item, sourceProfile) {
  const rawText = item.content || item.title || '';
  const normalized = normalizeText(rawText);
  const strippedLen = normalized.length;

  // 1. 纯转发无原创评论
  if (item.item_type === 'retweet' && !rawText.trim()) {
    return fail('pure_retweet');
  }

  // 2. 纯回复缺少上下文
  if (item.item_type === 'reply' && !item.parent_context && !item.quoted_content) {
    return fail('reply_without_context');
  }

  // 3. 文本极短且无上下文
  if (
    strippedLen < 20 &&
    !item.has_link &&
    !item.quoted_content &&
    !item.title &&
    !item.has_media
  ) {
    return fail('too_short_without_context');
  }

  // 4. 纯低价值互动
  if (isLowValueInteraction(rawText)) {
    return fail('low_value_interaction');
  }

  // 5. spam / giveaway / engagement bait
  if (isSpamOrBait(rawText)) {
    return fail('spam_or_engagement_bait');
  }

  // 6. 个人生活内容且无 AI 信号
  if (isPersonalLife(normalized) && !hasAISignal(normalized)) {
    return fail('personal_life_not_ai_related');
  }

  // 7. 高噪音信源：没有任何 AI 信号直接丢弃
  if (sourceProfile.noise_level === 'high' && !hasAISignal(normalized)) {
    // 有引用内容时，检查引用内容中是否有信号
    const quotedNorm = normalizeText(item.quoted_content || '');
    const titleNorm  = normalizeText(item.title || '');
    if (!hasAISignal(quotedNorm) && !hasAISignal(titleNorm)) {
      return fail('high_noise_source_no_ai_signal');
    }
  }

  return pass();
}

function pass() {
  return { pass: true, reason: 'ok' };
}

function fail(reason) {
  return { pass: false, reason };
}

module.exports = { rulePreFilter, hasAISignal, normalizeText };
