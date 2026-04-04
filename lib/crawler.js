// lib/crawler.js — 采集核心逻辑（Vercel 版）
const { supabase } = require('./supabase');
const tikhub = require('./tikhub');
const deepseek = require('./deepseek');
const { getPrompts } = require('./prompts');
const { presets: presetSources } = require('./presets');

const FETCH_COUNT = parseInt(process.env.DAILY_FETCH_COUNT) || 6;

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

module.exports = { fetchAllSources, fetchSource };
