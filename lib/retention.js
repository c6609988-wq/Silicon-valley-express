// lib/retention.js — 阈值判断：决定是否将内容放入 articles 表
// 在 evaluateContentValue 之后调用

/**
 * 根据 DeepSeek 评分结果和 sourceProfile 判断是否保留内容
 *
 * @param {Object} evaluation   - evaluator.js 返回的评分对象
 * @param {Object} sourceProfile - sourceProfiles.js 中的来源策略
 * @returns {boolean}
 */
function shouldKeepContent(evaluation, sourceProfile) {
  // ── 强制丢弃门槛（任何来源类型都适用）─────────────────────────
  if (!evaluation.keep)                                        return false;
  if (evaluation.suggested_priority === 'discard')             return false;
  if (['irrelevant', 'low_value'].includes(evaluation.content_type)) return false;
  if (evaluation.ai_relevance    < 10)                         return false;
  if (evaluation.information_gain < 8)                         return false;

  // ── 高噪音个人账号：更严格 ──────────────────────────────────
  if (sourceProfile.noise_level === 'high') {
    return (
      evaluation.total_score      >= 75 &&
      evaluation.ai_relevance     >= 18 &&
      evaluation.information_gain >= 15
    );
  }

  // ── 机构/长文来源：适当放宽 ──────────────────────────────────
  if (sourceProfile.type === 'institution_longform') {
    return (
      evaluation.total_score      >= 60 &&
      evaluation.information_gain >= 12 &&
      evaluation.completeness     >= 10
    );
  }

  // ── 官方 AI 来源：重视 AI 相关度 ─────────────────────────────
  if (sourceProfile.type === 'official_ai_source') {
    return (
      evaluation.ai_relevance >= 20 &&
      ['news', 'product_signal', 'technical_insight', 'deep_analysis', 'investment_signal']
        .includes(evaluation.content_type)
    );
  }

  // ── 默认规则 ──────────────────────────────────────────────
  return (
    evaluation.total_score      >= 65 &&
    evaluation.ai_relevance     >= 15 &&
    evaluation.information_gain >= 12 &&
    evaluation.decision_value   >= 10 &&
    evaluation.completeness     >= 8
  );
}

/**
 * 根据评分确定前端展示优先级
 * high   → 首页重点卡片
 * medium → 普通信息流
 * low    → 补充信息/存档
 */
function resolvePriority(evaluation) {
  if (evaluation.suggested_priority === 'high' && evaluation.total_score >= 85) return 'high';
  if (evaluation.total_score >= 85) return 'high';
  if (evaluation.total_score >= 65) return 'medium';
  if (evaluation.total_score >= 45) return 'low';
  return 'discard';
}

module.exports = { shouldKeepContent, resolvePriority };
