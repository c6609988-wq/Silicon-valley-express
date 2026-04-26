// lib/sourceProfiles.js — 每个信息源的过滤策略配置
// noise_level: high | medium | low
// type: high_noise_personality | institution_longform | official_ai_source | default

const SOURCE_PROFILES = {
  // ── 官方 AI 来源 ─────────────────────────────────────
  openai_x: {
    type: 'official_ai_source',
    noise_level: 'low',
    description: 'OpenAI 官方账号，产品/模型/政策更新',
  },
  anthropic_x: {
    type: 'official_ai_source',
    noise_level: 'low',
    description: 'Anthropic 官方账号',
  },
  deepmind_x: {
    type: 'official_ai_source',
    noise_level: 'low',
    description: 'Google DeepMind 官方账号',
  },
  openai_yt: {
    type: 'official_ai_source',
    noise_level: 'low',
    description: 'OpenAI YouTube 频道',
  },

  // ── 高噪音个人账号 ────────────────────────────────────
  sama_x: {
    type: 'high_noise_personality',
    noise_level: 'high',
    description: 'Sam Altman，信噪比偏低，大量个人推文',
  },
  levelsio_x: {
    type: 'high_noise_personality',
    noise_level: 'high',
    description: 'Pieter Levels，大量个人项目/生活日常',
  },
  ylecun_x: {
    type: 'high_noise_personality',
    noise_level: 'medium',
    description: 'Yann LeCun，主要转发+学术/技术观点',
  },

  // ── 深度分析/机构来源 ─────────────────────────────────
  emollick_x: {
    type: 'institution_longform',
    noise_level: 'low',
    description: 'Ethan Mollick，AI 研究与教育，高信号',
  },
  karpathy_x: {
    type: 'institution_longform',
    noise_level: 'low',
    description: 'Andrej Karpathy，AI 技术深度',
  },
  karpathy_yt: {
    type: 'institution_longform',
    noise_level: 'low',
    description: 'Karpathy YouTube，深度技术视频',
  },
  aiexplained_yt: {
    type: 'institution_longform',
    noise_level: 'low',
    description: 'AI Explained YouTube，系统性 AI 解析',
  },
  a16z_web: {
    type: 'institution_longform',
    noise_level: 'low',
    description: 'a16z RSS，投资机构深度长文',
  },

  // ── 产品/社区来源 ─────────────────────────────────────
  producthunt_web: {
    type: 'default',
    noise_level: 'medium',
    description: 'Product Hunt，AI 产品发现，中等噪音',
  },
  huggingface_web: {
    type: 'official_ai_source',
    noise_level: 'low',
    description: 'Hugging Face Blog，AI/ML 技术与产品',
  },
};

/** 默认 profile（未知 source_id 时使用） */
const DEFAULT_PROFILE = {
  type: 'default',
  noise_level: 'medium',
  description: '默认信息源策略',
};

/**
 * 根据 source_id 获取 source profile
 * @param {string} sourceId
 * @returns {{ type: string, noise_level: string, description: string }}
 */
function getSourceProfile(sourceId) {
  return SOURCE_PROFILES[sourceId] || DEFAULT_PROFILE;
}

module.exports = { getSourceProfile, SOURCE_PROFILES, DEFAULT_PROFILE };
