// api/reanalyze.js — 对缺少中文 AI 分析的历史文章补跑 DeepSeek
// GET /api/reanalyze?days=3&limit=5
// Authorization: Bearer <CRON_SECRET>
const { supabase }             = require('../lib/supabase');
const { analyzeContent, translateToZh } = require('../lib/deepseek');
const { getPrompts }           = require('../lib/prompts');
const { evaluateContentValue } = require('../lib/evaluator');
const { resolvePriority }      = require('../lib/retention');
const { getSourceProfile }     = require('../lib/sourceProfiles');

function hasChinese(text = '') {
  return /[一-鿿]/.test(text);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const days  = Math.min(parseInt(req.query.days)  || 3, 7);
  const limit = Math.min(parseInt(req.query.limit) || 5, 10);
  // score=1 → 同时补跑 AI 价值评分（写入 quality_score 等字段）
  const doScore = req.query.score === '1';
  const start   = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  console.log(`[Reanalyze] 查找最近 ${days} 天缺少中文分析的文章... (score=${doScore})`);

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .gte('fetched_at', start)
    .order('fetched_at', { ascending: false });

  if (error || !data) {
    return res.status(500).json({ error: error?.message || 'DB error' });
  }

  // 过滤：ai_analysis 为空或不含中文
  const needsWork = data.filter(a => !hasChinese(a.ai_analysis || ''));
  // 同时：已有中文分析但缺少评分字段的（当 doScore=1 时补充）
  const needsScore = doScore
    ? data.filter(a => hasChinese(a.ai_analysis || '') && !a.quality_score)
    : [];

  console.log(`[Reanalyze] 共 ${data.length} 篇，需重新分析 ${needsWork.length} 篇，待补评分 ${needsScore.length} 篇`);

  if (needsWork.length === 0 && needsScore.length === 0) {
    return res.json({ message: '所有文章均已有中文分析和评分', processed: 0, total: data.length });
  }

  const prompts  = await getPrompts();
  let processed  = 0;
  let scored     = 0;
  const results  = [];
  const debugInfo = [];

  // ── 第一部分：补充中文分析 ──────────────────────────────────
  for (const article of needsWork.slice(0, limit)) {
    const content = article.original_content || '';
    debugInfo.push({
      id: article.external_id,
      author: article.author_name,
      content_len: content.length,
      has_translated: !!(article.translated_content),
    });
    if (!content || content.length < 10) {
      console.log(`[Reanalyze] 跳过 ${article.author_name} - original_content 太短(${content.length})`);
      continue;
    }

    const todayStr = (article.published_at || article.fetched_at || new Date().toISOString()).slice(0, 10);

    try {
      // 翻译
      let translated = article.translated_content || '';
      if (!hasChinese(translated) || translated === content) {
        console.log(`[Reanalyze] 翻译 ${article.author_name}...`);
        translated = await translateToZh(content);
      }

      // AI 分析
      console.log(`[Reanalyze] 分析 ${article.author_name} - ${article.external_id}...`);
      const inputText = `博主：${article.author_name} ${article.author_handle || ''}\n日期：${todayStr}\n原文：\n${content}\n\n翻译：\n${translated}`;
      const analysis  = await analyzeContent(prompts.SHORT_CONTENT_PROMPT, inputText);

      if (!hasChinese(analysis)) {
        console.warn(`[Reanalyze] DeepSeek 返回非中文，跳过 ${article.external_id}`);
        continue;
      }

      const updatePayload = {
        ai_analysis:        analysis,
        translated_content: translated,
      };

      // 若同时需要评分
      if (doScore) {
        try {
          const profile    = getSourceProfile(article.source_id || '');
          const fakeItem   = {
            source_id: article.source_id, author_name: article.author_name,
            author_handle: article.author_handle, platform: article.platform,
            content: article.original_content, title: article.title,
            published_at: article.published_at, item_type: 'original',
            has_media: false, has_link: !!(article.link), quoted_content: '', parent_context: '', link: article.link,
          };
          const evaluation = await evaluateContentValue(fakeItem, profile);
          const priority   = resolvePriority(evaluation);
          Object.assign(updatePayload, {
            quality_score:    evaluation.total_score,
            ai_relevance:     evaluation.ai_relevance,
            information_gain: evaluation.information_gain,
            decision_value:   evaluation.decision_value,
            completeness:     evaluation.completeness,
            readability:      evaluation.readability,
            content_category: evaluation.content_type,
            priority,
            filter_reason:    evaluation.reason,
            is_visible:       !['irrelevant', 'low_value'].includes(evaluation.content_type),
            evaluation,
          });
          scored++;
        } catch (scoreErr) {
          console.warn(`[Reanalyze] 评分失败，仅更新分析: ${scoreErr.message}`);
        }
      }

      await supabase.from('articles').update(updatePayload).eq('id', article.id);

      processed++;
      results.push({
        id: article.external_id,
        author: article.author_name,
        oneliner: analysis.match(/核心要点\s*\n(.+)/)?.[1]?.trim().slice(0, 50) || '(已更新)',
        quality_score: updatePayload.quality_score,
      });
      console.log(`[Reanalyze] ✓ ${article.author_name} 更新完成`);
    } catch (err) {
      console.error(`[Reanalyze] 失败 ${article.external_id}:`, err.message);
      results.push({ id: article.external_id, author: article.author_name, error: err.message });
    }
  }

  // ── 第二部分：仅补充评分字段（已有中文分析但缺少评分） ─────────
  for (const article of needsScore.slice(0, Math.max(0, limit - needsWork.length))) {
    try {
      const profile  = getSourceProfile(article.source_id || '');
      const fakeItem = {
        source_id: article.source_id, author_name: article.author_name,
        author_handle: article.author_handle, platform: article.platform,
        content: article.original_content, title: article.title,
        published_at: article.published_at, item_type: 'original',
        has_media: false, has_link: !!(article.link), quoted_content: '', parent_context: '', link: article.link,
      };
      const evaluation = await evaluateContentValue(fakeItem, profile);
      const priority   = resolvePriority(evaluation);

      await supabase.from('articles').update({
        quality_score:    evaluation.total_score,
        ai_relevance:     evaluation.ai_relevance,
        information_gain: evaluation.information_gain,
        decision_value:   evaluation.decision_value,
        completeness:     evaluation.completeness,
        readability:      evaluation.readability,
        content_category: evaluation.content_type,
        priority,
        filter_reason:    evaluation.reason,
        is_visible:       !['irrelevant', 'low_value'].includes(evaluation.content_type),
        evaluation,
      }).eq('id', article.id);

      scored++;
      results.push({
        id: article.external_id, author: article.author_name,
        quality_score: evaluation.total_score, content_type: evaluation.content_type,
        action: 'score_only',
      });
      console.log(`[Reanalyze] ✓ 评分补充 ${article.author_name}: ${evaluation.total_score}分`);
    } catch (err) {
      console.error(`[Reanalyze] 评分补充失败 ${article.external_id}:`, err.message);
    }
  }

  res.json({
    success: true,
    processed,
    scored,
    skipped: needsWork.length - processed,
    total_needing: needsWork.length,
    total_needing_score: needsScore.length,
    results,
    debug: debugInfo,
  });
};
