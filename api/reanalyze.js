// api/reanalyze.js — 对缺少中文 AI 分析的历史文章补跑 DeepSeek
// GET /api/reanalyze?days=3
// Authorization: Bearer <CRON_SECRET>
const { supabase } = require('../lib/supabase');
const { analyzeContent, translateToZh } = require('../lib/deepseek');
const { getPrompts } = require('../lib/prompts');

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

  const days  = Math.min(parseInt(req.query.days) || 3, 7);
  const limit = Math.min(parseInt(req.query.limit) || 5, 10);
  const start = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  console.log(`[Reanalyze] 查找最近 ${days} 天缺少中文分析的文章...`);

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .gte('fetched_at', start)
    .order('fetched_at', { ascending: false });

  if (error || !data) {
    return res.status(500).json({ error: error?.message || 'DB error' });
  }

  // 过滤：ai_analysis 为空或不含中文
  const needsWork = data.filter(a =>
    !hasChinese(a.ai_analysis || '')
  );

  console.log(`[Reanalyze] 共 ${data.length} 篇，需重新分析 ${needsWork.length} 篇`);

  if (needsWork.length === 0) {
    return res.json({ message: '所有文章均已有中文分析', processed: 0, total: data.length });
  }

  const prompts = await getPrompts();
  let processed = 0;
  const results = [];

  for (const article of needsWork.slice(0, limit)) {
    const content = article.original_content || '';
    if (!content || content.length < 10) continue;

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
      const analysis = await analyzeContent(prompts.SHORT_CONTENT_PROMPT, inputText);

      if (!hasChinese(analysis)) {
        console.warn(`[Reanalyze] DeepSeek 返回了非中文内容，跳过 ${article.external_id}`);
        continue;
      }

      await supabase.from('articles').update({
        ai_analysis: analysis,
        translated_content: translated,
      }).eq('id', article.id);

      processed++;
      results.push({
        id: article.external_id,
        author: article.author_name,
        oneliner: analysis.match(/核心要点\s*\n(.+)/)?.[1]?.trim().slice(0, 50) || '(已更新)',
      });
      console.log(`[Reanalyze] ✓ ${article.author_name} 更新完成`);
    } catch (err) {
      console.error(`[Reanalyze] 失败 ${article.external_id}:`, err.message);
    }
  }

  res.json({
    success: true,
    processed,
    skipped: needsWork.length - processed,
    total_needing: needsWork.length,
    results,
  });
};
