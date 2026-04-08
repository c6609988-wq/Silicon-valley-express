// lib/crawler.js — 采集核心逻辑（Vercel 版）
const { supabase } = require('./supabase');
const tikhub = require('./tikhub');
const deepseek = require('./deepseek');
const { getPrompts } = require('./prompts');
const { presets: presetSources } = require('./presets');

const FETCH_COUNT = parseInt(process.env.DAILY_FETCH_COUNT) || 6;

// ─── 每日 Top3 精选推文（主流程） ──────────────────────────────────────────
// 从所有 X/Twitter 信息源采集推文，AI 评分后只保存最有价值的 3 条
async function fetchDailyTopTweets() {
  console.log('[Crawler] 开始采集每日精选推文 (Top3)...');

  const xSources = presetSources.filter(s => s.enabled && s.platform === 'x');
  if (!xSources.length) {
    console.log('[Crawler] 没有启用的 X 信息源');
    return { processed: 0 };
  }

  // 1. 从所有 X 源收集原始推文
  const allTweets = [];
  for (const source of xSources) {
    try {
      const username = source.handle.replace('@', '');
      const tweets = await tikhub.getUserTweets(username, 10);
      const filtered = tweets
        .filter(t => !t.is_retweet && !t.retweeted && !t.is_reply)
        .filter(t => {
          const text = (t.text || t.full_text || '').trim();
          return text.length > 30 && !(t.entities?.media?.length > 0 && text.replace(/https:\/\/t\.co\/\S+/g, '').trim() === '');
        })
        .slice(0, 5)
        .map(t => ({
          source_id: source.id,
          platform: 'x',
          external_id: t.tweet_id || t.id_str || t.id,
          author_name: source.name,
          author_handle: source.handle,
          content: t.text || t.full_text || '',
          published_at: new Date(t.created_at),
          raw_data: t,
        }));
      allTweets.push(...filtered);
      console.log(`[Crawler] @${username} 采集到 ${filtered.length} 条有效推文`);
    } catch (err) {
      console.error(`[Crawler] ${source.name} 采集失败:`, err.message);
    }
    await sleep(1500);
  }

  if (!allTweets.length) {
    console.log('[Crawler] 今日无可用推文');
    return { processed: 0 };
  }

  // 2. 去除已存入 DB 的推文（去重）
  const ids = allTweets.map(t => t.external_id).filter(Boolean);
  const { data: existing } = await supabase.from('articles').select('external_id').in('external_id', ids);
  const existingSet = new Set((existing || []).map(e => e.external_id));
  const newTweets = allTweets.filter(t => !existingSet.has(t.external_id));

  if (!newTweets.length) {
    console.log('[Crawler] 今日无新推文（全部已采集）');
    return { processed: 0 };
  }

  // 3. AI 评分，选出 Top3 最有价值推文
  const top3 = await scoreAndPickTop3(newTweets);
  console.log(`[Crawler] AI 选出 ${top3.length} 条 Top 推文`);

  // 4. 对 Top3 进行翻译 + 全量分析 + 存储（AI 失败时仍保存原始推文）
  const prompts = await getPrompts();
  let processed = 0;
  for (const tweet of top3) {
    try {
      const todayStr = tweet.published_at?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];

      // 翻译（失败时降级使用原文）
      let translated = '';
      try {
        translated = tweet.content ? await deepseek.translateToZh(tweet.content) : '';
      } catch (aiErr) {
        console.warn(`[Crawler] 翻译失败，使用原文: ${aiErr.message}`);
        translated = tweet.content || '';
      }

      // AI 分析（失败时降级使用空字符串，仍然入库）
      let analysis = '';
      try {
        const inputText = `博主：${tweet.author_name} ${tweet.author_handle || ''}\n日期：${todayStr}\n原文：\n${tweet.content}\n\n翻译：\n${translated}`;
        analysis = await deepseek.analyzeContent(prompts.SHORT_CONTENT_PROMPT, inputText);
      } catch (aiErr) {
        console.warn(`[Crawler] AI 分析失败，跳过分析直接入库: ${aiErr.message}`);
      }

      const { error: upsertErr } = await supabase.from('articles').upsert({
        source_id: tweet.source_id,
        platform: tweet.platform,
        external_id: tweet.external_id,
        author_name: tweet.author_name,
        author_handle: tweet.author_handle,
        original_content: tweet.content,
        translated_content: translated,
        ai_analysis: analysis,
        content_type: 'short',
        title: `${tweet.author_name} · ${todayStr}`,
        published_at: tweet.published_at,
        fetched_at: new Date(),
        raw_data: tweet.raw_data,
      }, { onConflict: 'external_id' });

      if (upsertErr) {
        console.error(`[Crawler] Supabase 入库失败 ${tweet.external_id}:`, upsertErr.message);
      } else {
        processed++;
        console.log(`[Crawler] ✓ Top推文已入库: ${tweet.author_name} - ${tweet.external_id}`);
      }
    } catch (err) {
      console.error(`[Crawler] 处理失败 ${tweet.external_id}:`, err.message);
    }
    await sleep(2000);
  }

  console.log(`[Crawler] 完成，今日精选 ${processed} 条`);

  // 返回已入库的文章对象，供 cron 直接传给飞书推送
  if (processed === 0) return { processed: 0, articles: [] };

  const externalIds = top3.map(t => t.external_id).filter(Boolean);
  const { data: savedArticles } = await supabase
    .from('articles')
    .select('*')
    .in('external_id', externalIds)
    .order('fetched_at', { ascending: false });

  return { processed, articles: savedArticles || [] };
}

// AI 评分选 Top3，失败时回退取前 3 条
async function scoreAndPickTop3(tweets) {
  const listText = tweets.map((t, i) =>
    `[${i}] ${t.author_name} (${t.author_handle})\n${t.content}`
  ).join('\n\n---\n\n');

  const scoringPrompt = `你是硅谷科技圈信息筛选专家。

从以下推文中选出信息价值最高的3条。

评分维度：
1. 信息增量 - 是否包含新知识/新数据/产品发布
2. 行业影响力 - 是否影响 AI/科技行业走向
3. 洞见深度 - 是否有独特观点或前瞻判断
4. 实用性 - 是否对从业者有直接参考价值

只输出 JSON，不要其他文字：
{"top3": [{"index": 数字}, {"index": 数字}, {"index": 数字}]}

按价值从高到低排序。`;

  try {
    const result = await deepseek.analyzeContent(scoringPrompt, listText);
    const match = result.match(/\{[\s\S]*\}/);
    if (match) {
      const json = JSON.parse(match[0]);
      const indices = (json.top3 || []).map(item => item.index).filter(i => typeof i === 'number' && i < tweets.length);
      if (indices.length > 0) {
        return indices.slice(0, 3).map(i => tweets[i]);
      }
    }
  } catch (err) {
    console.error('[Crawler] AI 评分失败，回退取前3条:', err.message);
  }
  return tweets.slice(0, 3);
}

// ─── 全量采集（兼容旧逻辑，供手动触发使用） ──────────────────────────────
async function fetchAllSources() {
  console.log('[Crawler] 开始全量采集...');

  let { data: sources } = await supabase
    .from('sources')
    .select('*')
    .eq('enabled', true);

  // 若数据库 sources 表为空，回退使用代码内置预设信息源
  if (!sources?.length) {
    console.log('[Crawler] DB sources 为空，使用内置预设信息源');
    sources = presetSources
      .filter(s => s.enabled)
      .map(s => ({
        id: s.id,
        name: s.name,
        handle: s.handle,
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
  let items = [];

  if (source.platform === 'x') {
    const username = (source.handle || '').replace('@', '') || tikhub.extractHandle(source.url)?.replace('@', '');
    if (!username) return 0;
    const tweets = await tikhub.getUserTweets(username, 20);
    items = tweets
      .filter(t => !t.is_retweet && !t.retweeted && !t.is_reply)
      .filter(t => {
        const text = (t.text || t.full_text || '').trim();
        return text !== '' && !(t.entities?.media?.length > 0 && text.replace(/https:\/\/t\.co\/\S+/g, '').trim() === '');
      })
      .map(t => ({
        source_id: source.id,
        platform: 'x',
        external_id: t.tweet_id || t.id_str || t.id,
        author_name: source.name,
        author_handle: source.handle,
        content: t.text || t.full_text || '',
        published_at: new Date(t.created_at),
        raw_data: t
      }));
  } else if (source.platform === 'youtube') {
    const videos = await tikhub.getYouTubeVideos(source.url, 5);
    for (const v of videos) {
      let transcript = await tikhub.getVideoTranscript(v.video_id, 'en');
      if (!transcript) transcript = await tikhub.getVideoTranscript(v.video_id, 'auto');
      items.push({
        source_id: source.id,
        platform: 'youtube',
        external_id: v.video_id,
        author_name: source.name,
        title: v.title,
        content: transcript || v.description || '',
        link: v.url,
        published_at: new Date(v.published_at),
        raw_data: v
      });
      await sleep(1000);
    }
  } else if (source.platform === 'rss') {
    const Parser = require('rss-parser');
    const parser = new Parser();
    const feed = await parser.parseURL(source.url);
    items = feed.items.slice(0, 10).map(item => ({
      source_id: source.id,
      platform: 'rss',
      external_id: item.guid || item.link,
      author_name: source.name,
      title: item.title,
      content: item.contentSnippet || item.content || '',
      link: item.link,
      published_at: new Date(item.pubDate || item.isoDate),
      raw_data: item
    }));
  }

  // 去重
  const ids = items.map(i => i.external_id).filter(Boolean);
  if (ids.length === 0) return 0;

  const { data: existing } = await supabase.from('articles').select('external_id').in('external_id', ids);
  const existingSet = new Set((existing || []).map(e => e.external_id));
  const newItems = items.filter(i => !existingSet.has(i.external_id)).slice(0, FETCH_COUNT);

  if (newItems.length === 0) {
    console.log(`[Crawler] ${source.name} 无新内容`);
    return 0;
  }

  // 翻译 + 分析
  const prompts = await getPrompts();
  for (const item of newItems) {
    try {
      const translated = item.content ? await deepseek.translateToZh(item.content) : '';
      const totalLen = (item.content || '').length + (item.title || '').length;
      const isLong = totalLen >= prompts.CONTENT_LENGTH_THRESHOLD;
      const prompt = isLong ? prompts.LONG_CONTENT_PROMPT : prompts.SHORT_CONTENT_PROMPT;
      const inputText = `博主：${item.author_name} ${item.author_handle || ''}\n日期：${item.published_at?.toISOString().split('T')[0]}\n${item.title ? `标题：${item.title}\n` : ''}原文：\n${item.content}\n\n翻译：\n${translated}`;
      const analysis = await deepseek.analyzeContent(prompt, inputText);

      await supabase.from('articles').upsert({
        ...item,
        translated_content: translated,
        ai_analysis: analysis,
        content_type: isLong ? 'long' : 'short',
        fetched_at: new Date()
      }, { onConflict: 'external_id' });

      console.log(`[Crawler] ✓ ${item.author_name} - ${item.external_id}`);
    } catch (err) {
      console.error(`[Crawler] 处理失败 ${item.external_id}:`, err.message);
    }
    await sleep(1500);
  }

  return newItems.length;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { fetchDailyTopTweets, fetchAllSources, fetchSource };
