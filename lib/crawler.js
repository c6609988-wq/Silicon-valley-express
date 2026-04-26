// lib/crawler.js — 采集核心逻辑（Vercel 版）
// 新工作流：TikHub 抓取 → 标准化 → 规则预过滤 → DeepSeek 价值评分 → 阈值判断 → 翻译/分析 → 入库
const { supabase }            = require('./supabase');
const tikhub                  = require('./tikhub');
const deepseek                = require('./deepseek');
const { getPrompts }          = require('./prompts');
const { presets: presetSources } = require('./presets');
const { getSourceProfile }    = require('./sourceProfiles');
const { rulePreFilter }       = require('./prefilter');
const { evaluateContentValue } = require('./evaluator');
const { shouldKeepContent, resolvePriority } = require('./retention');

const FETCH_COUNT = parseInt(process.env.DAILY_FETCH_COUNT) || 6;

// ─── 工具函数 ─────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * 将 TikHub 推文原始数据标准化为统一内容对象
 */
function normalizeXItem(rawTweet, source) {
  const rawText   = rawTweet.text || rawTweet.full_text || '';
  const isRetweet = !!(rawTweet.is_retweet || rawTweet.retweeted || rawText.startsWith('RT @'));
  const isReply   = !!(rawTweet.is_reply || rawTweet.in_reply_to_status_id);
  const isQuote   = !!(rawTweet.is_quote_status || rawTweet.quoted_status);
  const mediaList = rawTweet.entities?.media || rawTweet.extended_entities?.media || [];
  const urlList   = rawTweet.entities?.urls || [];

  const quotedText = rawTweet.quoted_status?.full_text
    || rawTweet.quoted_status?.text
    || rawTweet.quoted_tweet?.text
    || '';

  let itemType = 'original';
  if (isRetweet) itemType = 'retweet';
  else if (isReply) itemType = 'reply';
  else if (isQuote) itemType = 'quote';

  return {
    source_id:      source.id,
    source_name:    source.name,
    platform:       'x',
    external_id:    rawTweet.tweet_id || rawTweet.id_str || rawTweet.id,
    author_name:    source.name,
    author_handle:  source.handle,
    title:          '',
    content:        rawText,
    link:           `https://x.com/${source.handle.replace('@', '')}/status/${rawTweet.tweet_id || rawTweet.id_str || rawTweet.id}`,
    published_at:   new Date(rawTweet.created_at),
    item_type:      itemType,
    has_media:      mediaList.length > 0,
    has_link:       urlList.length > 0,
    quoted_content: quotedText,
    parent_context: '',
    raw_data:       rawTweet,
  };
}

/**
 * 将 RSS 条目标准化
 */
function normalizeRSSItem(rssItem, source) {
  return {
    source_id:      source.id,
    source_name:    source.name,
    platform:       'rss',
    external_id:    rssItem.guid || rssItem.link,
    author_name:    source.name,
    author_handle:  source.handle || '',
    title:          rssItem.title || '',
    content:        rssItem.contentSnippet || rssItem.content || rssItem.summary || '',
    link:           rssItem.link || '',
    published_at:   new Date(rssItem.pubDate || rssItem.isoDate || Date.now()),
    item_type:      'article',
    has_media:      false,
    has_link:       true,
    quoted_content: '',
    parent_context: '',
    raw_data:       rssItem,
  };
}

/**
 * 将 YouTube 视频标准化
 */
function normalizeYouTubeItem(video, transcript, source) {
  return {
    source_id:      source.id,
    source_name:    source.name,
    platform:       'youtube',
    external_id:    video.video_id,
    author_name:    source.name,
    author_handle:  source.handle || '',
    title:          video.title || '',
    content:        transcript || video.description || '',
    link:           video.url || `https://youtube.com/watch?v=${video.video_id}`,
    published_at:   new Date(video.published_at || Date.now()),
    item_type:      'video',
    has_media:      true,
    has_link:       true,
    quoted_content: '',
    parent_context: '',
    raw_data:       video,
  };
}

/**
 * 将丢弃的内容写入 discarded_items 表（异步，失败不阻塞主流程）
 */
async function saveDiscardedItem(item, { stage, reason, evaluation = null }) {
  try {
    const row = {
      source_id:       item.source_id,
      platform:        item.platform,
      external_id:     item.external_id,
      author_name:     item.author_name,
      author_handle:   item.author_handle,
      title:           item.title || '',
      original_content: item.content || '',
      link:            item.link || '',
      stage,
      filter_reason:   reason,
      published_at:    item.published_at,
      raw_data:        item.raw_data || {},
    };

    if (evaluation) {
      row.total_score      = evaluation.total_score;
      row.ai_relevance     = evaluation.ai_relevance;
      row.information_gain = evaluation.information_gain;
      row.decision_value   = evaluation.decision_value;
      row.completeness     = evaluation.completeness;
      row.readability      = evaluation.readability;
      row.content_category = evaluation.content_type;
      row.priority         = evaluation.suggested_priority;
      row.raw_evaluation   = evaluation;
    }

    const { error } = await supabase.from('discarded_items').insert(row);
    if (error) {
      // discarded_items 表尚未建立时静默忽略（迁移前的兼容处理）
      if (!error.message?.includes('does not exist') && !error.message?.includes('未配置')) {
        console.warn(`[Crawler] saveDiscardedItem 写入失败:`, error.message);
      }
    }
  } catch (err) {
    console.warn(`[Crawler] saveDiscardedItem 异常:`, err.message);
  }
}

// ─── 每日精选推文主流程 ────────────────────────────────────────────────────
async function fetchDailyTopTweets(followedIds = null) {
  console.log('[Crawler] 开始采集每日精选推文（新过滤流水线）...');

  let xSources = presetSources.filter(s => s.enabled && s.platform === 'x');

  if (followedIds && followedIds.length > 0) {
    const idSet = new Set(followedIds);
    xSources = xSources.filter(s => idSet.has(s.id));
    console.log(`[Crawler] 按关注列表过滤，采集 ${xSources.length} 个信源`);
  }
  if (!xSources.length) {
    console.log('[Crawler] 没有启用的 X 信息源');
    return { processed: 0 };
  }

  // ── 1. 抓取原始推文 ──────────────────────────────────────────
  const allRaw = [];
  for (const source of xSources) {
    try {
      const username = source.handle.replace('@', '');
      const tweets   = await tikhub.getUserTweets(username, 20);  // 多抓一些，过滤后剩余
      const items    = tweets.map(t => normalizeXItem(t, source));
      allRaw.push(...items);
      console.log(`[Crawler] @${username} 抓取 ${items.length} 条原始推文`);
    } catch (err) {
      console.error(`[Crawler] ${source.name} 抓取失败:`, err.message);
    }
    await sleep(1500);
  }

  if (!allRaw.length) {
    console.log('[Crawler] 今日无可用推文');
    return { processed: 0 };
  }

  // ── 2. 去重（DB 已存在的） ──────────────────────────────────
  const ids = allRaw.map(t => t.external_id).filter(Boolean);
  const { data: existing } = await supabase.from('articles').select('external_id').in('external_id', ids);
  // 同时检查 discarded_items（表不存在时静默忽略）
  let discardedIds = [];
  try {
    const { data: discarded } = await supabase.from('discarded_items').select('external_id').in('external_id', ids);
    discardedIds = (discarded || []).map(e => e.external_id);
  } catch (_) {}
  const existingSet = new Set([
    ...(existing  || []).map(e => e.external_id),
    ...discardedIds,
  ]);
  const newItems = allRaw.filter(t => !existingSet.has(t.external_id));

  if (!newItems.length) {
    console.log('[Crawler] 今日无新推文（全部已采集）');
    return { processed: 0 };
  }
  console.log(`[Crawler] ${newItems.length} 条新推文进入过滤流水线`);

  // ── 3. 过滤流水线：规则预过滤 → 价值评分 → 阈值判断 ──────────
  const toTranslate = [];

  for (const item of newItems) {
    const profile = getSourceProfile(item.source_id);

    // 3a. 规则预过滤
    const prefilter = rulePreFilter(item, profile);
    if (!prefilter.pass) {
      console.log(`[Filter] ✗ 规则丢弃 [${item.author_handle}] ${prefilter.reason}: ${item.content?.slice(0, 60)}`);
      await saveDiscardedItem(item, { stage: 'rule_prefilter', reason: prefilter.reason });
      continue;
    }

    // 3b. DeepSeek 价值评分
    let evaluation;
    try {
      evaluation = await evaluateContentValue(item, profile);
    } catch (err) {
      console.error(`[Filter] 评分异常 (${item.external_id}):`, err.message);
      await saveDiscardedItem(item, { stage: 'ai_value_scoring', reason: `评分异常: ${err.message}` });
      continue;
    }
    await sleep(500);  // 避免 DeepSeek 速率限制

    // 3c. 阈值判断
    if (!shouldKeepContent(evaluation, profile)) {
      console.log(`[Filter] ✗ AI 评分丢弃 [${item.author_handle}] 总分${evaluation.total_score} - ${evaluation.reason?.slice(0, 60)}`);
      await saveDiscardedItem(item, { stage: 'ai_value_scoring', reason: evaluation.reason, evaluation });
      continue;
    }

    console.log(`[Filter] ✓ 通过 [${item.author_handle}] 总分${evaluation.total_score} ${evaluation.content_type} - ${evaluation.reason?.slice(0, 60)}`);
    toTranslate.push({ item, evaluation, profile });
  }

  if (!toTranslate.length) {
    console.log('[Crawler] 今日所有推文均被过滤');
    return { processed: 0 };
  }
  console.log(`[Crawler] ${toTranslate.length} 条内容通过过滤，进入翻译分析`);

  // ── 4. 翻译 + 分析 + 入库 ───────────────────────────────────
  const prompts  = await getPrompts();
  let processed  = 0;

  for (const { item, evaluation } of toTranslate) {
    try {
      const todayStr = item.published_at?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
      const priority = resolvePriority(evaluation);

      // 翻译
      let translated = '';
      try {
        translated = item.content ? await deepseek.translateToZh(item.content) : '';
      } catch (aiErr) {
        console.warn(`[Crawler] 翻译失败: ${aiErr.message}`);
        translated = item.content || '';
      }

      // AI 分析（使用 content_type 判断长短 prompt）
      let analysis = '';
      try {
        const isLong = ['deep_analysis', 'investment_signal'].includes(evaluation.content_type)
          || (item.content || '').length >= (prompts.CONTENT_LENGTH_THRESHOLD || 500);
        const prompt = isLong ? prompts.LONG_CONTENT_PROMPT : prompts.SHORT_CONTENT_PROMPT;
        const inputText = [
          `博主：${item.author_name} ${item.author_handle || ''}`,
          `日期：${todayStr}`,
          item.title ? `标题：${item.title}` : '',
          `内容类型：${evaluation.content_type}`,
          `优先级：${priority}`,
          `评分原因：${evaluation.reason}`,
          `原文：\n${item.content}`,
          `\n翻译：\n${translated}`,
        ].filter(Boolean).join('\n');
        analysis = await deepseek.analyzeContent(prompt, inputText);
      } catch (aiErr) {
        console.warn(`[Crawler] AI 分析失败，跳过分析直接入库: ${aiErr.message}`);
      }

      const { error: upsertErr } = await supabase.from('articles').upsert({
        source_id:          item.source_id,
        platform:           item.platform,
        external_id:        item.external_id,
        author_name:        item.author_name,
        author_handle:      item.author_handle,
        original_content:   item.content,
        translated_content: translated,
        ai_analysis:        analysis,
        content_type:       item.item_type === 'video' ? 'long' : 'short',
        title:              item.title || `${item.author_name} · ${todayStr}`,
        link:               item.link,
        published_at:       item.published_at,
        fetched_at:         new Date(),
        raw_data:           item.raw_data,
        // 评分字段
        quality_score:      evaluation.total_score,
        ai_relevance:       evaluation.ai_relevance,
        information_gain:   evaluation.information_gain,
        decision_value:     evaluation.decision_value,
        completeness:       evaluation.completeness,
        readability:        evaluation.readability,
        content_category:   evaluation.content_type,
        priority,
        filter_reason:      evaluation.reason,
        is_visible:         true,
        evaluation:         evaluation,
      }, { onConflict: 'external_id' });

      if (upsertErr) {
        console.error(`[Crawler] Supabase 入库失败 ${item.external_id}:`, upsertErr.message);
      } else {
        processed++;
        console.log(`[Crawler] ✓ 入库: ${item.author_name} [${evaluation.content_type}/${priority}] - ${item.external_id}`);
      }
    } catch (err) {
      console.error(`[Crawler] 处理失败 ${item.external_id}:`, err.message);
    }
    await sleep(2000);
  }

  console.log(`[Crawler] 完成，今日精选 ${processed} 条（过滤掉 ${newItems.length - toTranslate.length} 条）`);

  if (processed === 0) return { processed: 0, articles: [] };

  const externalIds = toTranslate.map(({ item }) => item.external_id).filter(Boolean);
  const { data: savedArticles } = await supabase
    .from('articles')
    .select('*')
    .in('external_id', externalIds)
    .order('fetched_at', { ascending: false });

  return { processed, articles: savedArticles || [] };
}

// ─── 全量采集（兼容旧逻辑，供手动触发使用） ──────────────────────────────
async function fetchAllSources() {
  console.log('[Crawler] 开始全量采集（新过滤流水线）...');

  let { data: sources } = await supabase
    .from('sources')
    .select('*')
    .eq('enabled', true);

  if (!sources?.length) {
    console.log('[Crawler] DB sources 为空，使用内置预设信息源');
    sources = presetSources
      .filter(s => s.enabled)
      .map(s => ({
        id: s.id, name: s.name, handle: s.handle,
        platform: s.platform,
        url: s.platform === 'x' ? `https://x.com/${s.handle.replace('@', '')}` : '',
        enabled: true,
      }));
  }

  if (!sources?.length) {
    console.log('[Crawler] 没有启用的信息源');
    return { processed: 0 };
  }

  let processed = 0;
  for (const source of sources) {
    try {
      const count = await fetchSource(source);
      processed += count;
      await supabase.from('sources').update({ last_fetched_at: new Date() }).eq('id', source.id);
    } catch (err) {
      console.error(`[Crawler] ${source.name} 失败:`, err.message);
    }
    await sleep(2000);
  }

  console.log(`[Crawler] 完成，共处理 ${processed} 条内容`);
  return { processed };
}

async function fetchSource(source) {
  const profile = getSourceProfile(source.id);
  let rawItems  = [];

  if (source.platform === 'x') {
    const username = (source.handle || '').replace('@', '') || tikhub.extractHandle?.(source.url)?.replace('@', '');
    if (!username) return 0;
    const tweets = await tikhub.getUserTweets(username, 20);
    rawItems = tweets.map(t => normalizeXItem(t, source));

  } else if (source.platform === 'youtube') {
    const videos = await tikhub.getYouTubeVideos(source.url, 5);
    for (const v of videos) {
      let transcript = await tikhub.getVideoTranscript(v.video_id, 'en');
      if (!transcript) transcript = await tikhub.getVideoTranscript(v.video_id, 'auto');
      rawItems.push(normalizeYouTubeItem(v, transcript, source));
      await sleep(1000);
    }

  } else if (source.platform === 'rss') {
    const Parser = require('rss-parser');
    const parser = new Parser();
    const feed   = await parser.parseURL(source.url);
    rawItems = feed.items.slice(0, 10).map(item => normalizeRSSItem(item, source));
  }

  // 去重
  const ids = rawItems.map(i => i.external_id).filter(Boolean);
  if (!ids.length) return 0;

  const { data: existing } = await supabase.from('articles').select('external_id').in('external_id', ids);
  let discardedIds2 = [];
  try {
    const { data: discarded } = await supabase.from('discarded_items').select('external_id').in('external_id', ids);
    discardedIds2 = (discarded || []).map(e => e.external_id);
  } catch (_) {}
  const existingSet = new Set([
    ...(existing || []).map(e => e.external_id),
    ...discardedIds2,
  ]);
  const newItems = rawItems.filter(i => !existingSet.has(i.external_id)).slice(0, FETCH_COUNT * 3);

  if (!newItems.length) {
    console.log(`[Crawler] ${source.name} 无新内容`);
    return 0;
  }

  const prompts = await getPrompts();
  let saved     = 0;

  for (const item of newItems) {
    // 规则预过滤
    const prefilter = rulePreFilter(item, profile);
    if (!prefilter.pass) {
      console.log(`[Filter] ✗ 规则丢弃 [${source.name}] ${prefilter.reason}`);
      await saveDiscardedItem(item, { stage: 'rule_prefilter', reason: prefilter.reason });
      continue;
    }

    // AI 价值评分
    let evaluation;
    try {
      evaluation = await evaluateContentValue(item, profile);
      await sleep(500);
    } catch (err) {
      await saveDiscardedItem(item, { stage: 'ai_value_scoring', reason: `评分异常: ${err.message}` });
      continue;
    }

    if (!shouldKeepContent(evaluation, profile)) {
      console.log(`[Filter] ✗ AI 丢弃 [${source.name}] 总分${evaluation.total_score}`);
      await saveDiscardedItem(item, { stage: 'ai_value_scoring', reason: evaluation.reason, evaluation });
      continue;
    }

    // 翻译 + 分析
    try {
      const translated  = item.content ? await deepseek.translateToZh(item.content) : '';
      const totalLen    = (item.content || '').length + (item.title || '').length;
      const isLong      = ['deep_analysis', 'investment_signal'].includes(evaluation.content_type) || totalLen >= (prompts.CONTENT_LENGTH_THRESHOLD || 500);
      const prompt      = isLong ? prompts.LONG_CONTENT_PROMPT : prompts.SHORT_CONTENT_PROMPT;
      const inputText   = [
        `博主：${item.author_name} ${item.author_handle || ''}`,
        `日期：${item.published_at?.toISOString().split('T')[0]}`,
        item.title ? `标题：${item.title}` : '',
        `原文：\n${item.content}`,
        `\n翻译：\n${translated}`,
      ].filter(Boolean).join('\n');
      const analysis = await deepseek.analyzeContent(prompt, inputText);
      const priority = resolvePriority(evaluation);

      await supabase.from('articles').upsert({
        ...item,
        original_content:   item.content,
        translated_content: translated,
        ai_analysis:        analysis,
        content_type:       isLong ? 'long' : 'short',
        title:              item.title || `${item.author_name} · ${item.published_at?.toISOString().split('T')[0]}`,
        fetched_at:         new Date(),
        raw_data:           item.raw_data,
        quality_score:      evaluation.total_score,
        ai_relevance:       evaluation.ai_relevance,
        information_gain:   evaluation.information_gain,
        decision_value:     evaluation.decision_value,
        completeness:       evaluation.completeness,
        readability:        evaluation.readability,
        content_category:   evaluation.content_type,
        priority,
        filter_reason:      evaluation.reason,
        is_visible:         true,
        evaluation,
      }, { onConflict: 'external_id' });

      saved++;
      console.log(`[Crawler] ✓ ${item.author_name} [${evaluation.content_type}/${priority}] - ${item.external_id}`);
    } catch (err) {
      console.error(`[Crawler] 处理失败 ${item.external_id}:`, err.message);
    }
    await sleep(1500);
  }

  return saved;
}

module.exports = { fetchDailyTopTweets, fetchAllSources, fetchSource };
