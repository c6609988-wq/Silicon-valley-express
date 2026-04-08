// api/trigger.js → GET /api/trigger
// 无需鉴权的手动触发入口
// ?mode=simple     → 跳过 AI，直接把推文存库
// ?mode=full       → 完整 AI 流程（默认）
// ?mode=reprocess  → 对无 AI 分析的历史数据补跑 DeepSeek
const { fetchDailyTopTweets } = require('../lib/crawler');
const { pushDailyDigest } = require('../lib/feishu');
const { supabase } = require('../lib/supabase');
const tikhub = require('../lib/tikhub');
const { presets: presetSources } = require('../lib/presets');
const deepseek = require('../lib/deepseek');
const { getPrompts } = require('../lib/prompts');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const mode = req.query.mode || 'full';
  const bjNow = new Date(Date.now() + 8 * 3600 * 1000);
  const bjTime = bjNow.toISOString().replace('T', ' ').slice(0, 19);
  const yesterdayBJ = new Date(bjNow - 86400000).toISOString().slice(0, 10);

  // ── reprocess 模式：对无 AI 分析的历史数据补跑 DeepSeek ───────────────────
  if (mode === 'reprocess') {
    try {
      const prompts = await getPrompts();
      // 查找 ai_analysis 为空的文章（最多处理 10 条）
      const { data: emptyArticles } = await supabase
        .from('articles')
        .select('*')
        .or('ai_analysis.is.null,ai_analysis.eq.')
        .order('fetched_at', { ascending: false })
        .limit(10);

      if (!emptyArticles || emptyArticles.length === 0) {
        return res.json({ mode: 'reprocess', success: true, updated: 0, message: '没有需要补处理的文章' });
      }

      let updated = 0;
      const log = [];
      for (const article of emptyArticles) {
        try {
          const content = article.original_content || '';
          if (!content) { log.push(`跳过 ${article.external_id}：无原文`); continue; }

          // 翻译
          let translated = content;
          try { translated = await deepseek.translateToZh(content); } catch (e) { log.push(`翻译失败: ${e.message}`); }

          // AI 分析
          let analysis = '';
          const todayStr = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
          const inputText = `博主：${article.author_name} ${article.author_handle || ''}\n日期：${todayStr}\n原文：\n${content}\n\n翻译：\n${translated}`;
          try { analysis = await deepseek.analyzeContent(prompts.SHORT_CONTENT_PROMPT, inputText); } catch (e) { log.push(`分析失败: ${e.message}`); }

          const { error } = await supabase.from('articles').update({
            translated_content: translated,
            ai_analysis: analysis,
          }).eq('id', article.id);

          if (error) { log.push(`入库失败 ${article.external_id}: ${error.message}`); }
          else { updated++; log.push(`✓ 补处理完成: ${article.author_name} - ${article.external_id}`); }

          await sleep(2000);
        } catch (e) {
          log.push(`处理异常 ${article.external_id}: ${e.message}`);
        }
      }
      return res.json({ mode: 'reprocess', success: true, updated, total: emptyArticles.length, log, bjTime });
    } catch (err) {
      return res.status(500).json({ mode: 'reprocess', success: false, error: err.message });
    }
  }

  // ── simple 模式：跳过 AI，直接把推文写入数据库 ─────────────────────────────
  if (mode === 'simple') {
    try {
      const log = [];
      const xSources = presetSources.filter(s => s.enabled && s.platform === 'x');
      let saved = 0;
      const errors = [];

      for (const source of xSources) {
        try {
          const username = source.handle.replace('@', '');
          const tweets = await tikhub.getUserTweets(username, 10);
          log.push(`@${username}: TikHub 返回 ${tweets.length} 条`);

          const filtered = tweets.filter(t => {
            const text = (t.text || t.full_text || '').trim();
            return !t.is_retweet && !t.retweeted && !t.is_reply && text.length > 30;
          }).slice(0, 3);

          log.push(`  → 过滤后 ${filtered.length} 条有效`);

          for (const t of filtered) {
            const text = t.text || t.full_text || '';
            const extId = String(t.tweet_id || t.id_str || t.id || '');
            if (!extId) { log.push(`  ⚠ 无 external_id，跳过`); continue; }

            const todayStr = bjNow.toISOString().slice(0, 10);
            const pubAt = t.created_at ? new Date(t.created_at) : new Date();

            const { error: uErr } = await supabase.from('articles').upsert({
              source_id: source.id,
              platform: 'x',
              external_id: extId,
              author_name: source.name,
              author_handle: source.handle,
              original_content: text,
              translated_content: text, // simple 模式直接用原文
              ai_analysis: '',
              content_type: 'short',
              title: `${source.name} · ${todayStr}`,
              published_at: pubAt,
              fetched_at: new Date(),
              raw_data: t,
            }, { onConflict: 'external_id' });

            if (uErr) {
              log.push(`  ✗ 入库失败 ${extId}: ${uErr.message}`);
              errors.push(uErr.message);
            } else {
              log.push(`  ✓ 入库成功 ${extId}`);
              saved++;
            }
          }
        } catch (err) {
          log.push(`@${source.handle} 出错: ${err.message}`);
          errors.push(err.message);
        }
        await sleep(1000);
      }

      // 尝试推送飞书
      let feishuPushed = 0;
      if (saved > 0) {
        try {
          const { data: articles } = await supabase
            .from('articles').select('*')
            .order('fetched_at', { ascending: false }).limit(6);
          if (articles?.length > 0) {
            await pushDailyDigest(articles, 'simple');
            feishuPushed = articles.length;
          }
        } catch (fErr) {
          log.push(`飞书推送失败: ${fErr.message}`);
        }
      }

      return res.json({
        mode: 'simple',
        success: true,
        saved,
        feishu_pushed: feishuPushed,
        bjTime,
        log,
        errors,
      });
    } catch (err) {
      return res.status(500).json({ mode: 'simple', success: false, error: err.message });
    }
  }

  // ── full 模式：完整 AI 流程 ─────────────────────────────────────────────────
  try {
    console.log(`[Trigger] 手动触发采集 (北京时间 ${bjTime})`);

    const result = await fetchDailyTopTweets();
    console.log(`[Trigger] 采集完成，新增 ${result.processed} 条`);

    let articlesToPush = result.articles || [];
    let pushSource = 'today';

    if (articlesToPush.length === 0) {
      const yStart = new Date(yesterdayBJ + 'T00:00:00+08:00').toISOString();
      const yEnd   = new Date(yesterdayBJ + 'T23:59:59+08:00').toISOString();
      const { data: yesterday } = await supabase
        .from('articles').select('*')
        .gte('fetched_at', yStart).lte('fetched_at', yEnd)
        .order('fetched_at', { ascending: false }).limit(6);

      if (yesterday?.length > 0) {
        articlesToPush = yesterday;
        pushSource = 'yesterday';
      } else {
        const { data: latest } = await supabase
          .from('articles').select('*')
          .order('fetched_at', { ascending: false }).limit(6);
        articlesToPush = latest || [];
        pushSource = 'latest';
      }
    }

    if (articlesToPush.length > 0) {
      await pushDailyDigest(articlesToPush, pushSource);
    }

    res.json({
      mode: 'full',
      success: true,
      processed: result.processed,
      feishu_pushed: articlesToPush.length,
      push_source: pushSource,
      bjTime,
      message: result.processed > 0
        ? `成功采集并存入 ${result.processed} 条文章`
        : '今日无新推文，已推送历史文章到飞书',
    });
  } catch (err) {
    console.error('[Trigger] 执行失败:', err);
    res.status(500).json({ mode: 'full', success: false, error: err.message, stack: err.stack });
  }
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
