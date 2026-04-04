// server/services/crawler.js
const tikHub = require('../api/tikhub');
const openrouter = require('../api/openrouter');
const { getPrompts } = require('./settings');
const presets = require('../config/presets');
const { supabase } = require('../db');

const DAILY_FETCH_COUNT = parseInt(process.env.DAILY_FETCH_COUNT) || 6;

async function fetchAllSources() {
  console.log('[Crawler] 开始采集所有信息源...');
  const presetSources = presets.presets.filter(s => s.enabled);

  const { data: userSources } = await supabase
    .from('sources')
    .select('*')
    .eq('enabled', true)
    .eq('source_type', 'user');

  const allSources = [...presetSources, ...(userSources || [])];

  for (const source of allSources) {
    try {
      await fetchAndProcessSource(source);
      await sleep(2000);
    } catch (err) {
      console.error(`[Crawler] 处理 ${source.name} 失败:`, err.message);
    }
  }
  console.log('[Crawler] 采集完成');
}

async function fetchAndProcessSource(source) {
  let rawItems = [];

  if (source.platform === 'x') {
    rawItems = await fetchXTweets(source);
  } else if (source.platform === 'youtube') {
    rawItems = await fetchYouTubeVideos(source);
  } else if (source.platform === 'rss') {
    rawItems = await fetchRSS(source);
  } else if (source.platform === 'wechat') {
    throw new Error('微信公众号暂不支持，请使用 RSS 地址');
  }

  if (rawItems.length === 0) {
    console.log(`[Crawler] ${source.name} 无新内容`);
    return;
  }

  const newItems = await filterExistingItems(rawItems, source.id);
  const itemsToProcess = newItems.slice(0, DAILY_FETCH_COUNT);

  for (const item of itemsToProcess) {
    await translateAndAnalyze(item, source);
  }
}

async function fetchXTweets(source) {
  const username = source.handle?.replace('@', '') || extractUsername(source.url);
  const tweets = await tikHub.getUserTweets(username, 20);

  return tweets
    .filter(t => !t.is_retweet && !t.retweeted)
    .filter(t => !t.is_reply)
    .filter(t => !isImageOnly(t))
    .map(t => ({
      source_id: source.id,
      platform: 'x',
      // TikHub 使用 tweet_id，Twitter 原生 API 使用 id_str
      external_id: t.tweet_id || t.id_str || t.id,
      author_name: source.name,
      author_handle: source.handle,
      // TikHub 返回 text，Twitter 原生 API 返回 full_text
      content: t.text || t.full_text,
      published_at: new Date(t.created_at),
      raw_data: t
    }));
}

async function fetchYouTubeVideos(source) {
  const videos = await tikHub.getYouTubeVideos(source.url, 5);
  const items = [];
  for (const video of videos) {
    // 优先英文字幕，其次自动生成，都没有用描述
    let transcript = await tikHub.getVideoTranscript(video.video_id, 'en');
    if (!transcript) transcript = await tikHub.getVideoTranscript(video.video_id, 'auto');
    items.push({
      source_id: source.id,
      platform: 'youtube',
      external_id: video.video_id,
      author_name: source.name,
      content: transcript || video.description || '',
      title: video.title,
      video_url: video.url,
      published_at: new Date(video.published_at),
      raw_data: video
    });
    await sleep(1000);
  }
  return items;
}

async function fetchRSS(source) {
  const Parser = require('rss-parser');
  const parser = new Parser();
  const feed = await parser.parseURL(source.url);

  return feed.items.slice(0, 10).map(item => ({
    source_id: source.id,
    platform: 'rss',
    external_id: item.guid || item.link,
    author_name: source.name,
    content: item.contentSnippet || item.content || item.summary || '',
    title: item.title,
    link: item.link,
    published_at: new Date(item.pubDate || item.isoDate),
    raw_data: item
  }));
}

async function translateAndAnalyze(item, source) {
  const prompts = await getPrompts();

  const translatedContent = item.content
    ? await openrouter.translateToZh(item.content)
    : '';

  const totalLength = (item.content || '').length + (item.title || '').length;
  const isLong = totalLength >= prompts.CONTENT_LENGTH_THRESHOLD;

  const prompt = isLong ? prompts.LONG_CONTENT_PROMPT : prompts.SHORT_CONTENT_PROMPT;
  const analysisInput = buildAnalysisInput(item, translatedContent, source);
  const analysis = await openrouter.analyzeContent(prompt, analysisInput);

  await supabase.from('articles').upsert({
    source_id: source.id,
    platform: item.platform,
    external_id: item.external_id,
    author_name: item.author_name,
    original_content: item.content,
    translated_content: translatedContent,
    ai_analysis: analysis,
    content_type: isLong ? 'long' : 'short',
    title: item.title || '',
    link: item.link || item.video_url || '',
    published_at: item.published_at,
    fetched_at: new Date(),
    raw_data: item.raw_data
  }, { onConflict: 'external_id' });

  console.log(`[Crawler] ✓ 已处理: ${item.author_name} - ${item.external_id}`);
}

function buildAnalysisInput(item, translatedContent, source) {
  return `博主名称：${source.name} ${source.handle || ''}
平台：${item.platform}
日期：${item.published_at?.toISOString().split('T')[0]}
${item.title ? `标题：${item.title}` : ''}

原文内容：
${item.content}

中文翻译：
${translatedContent}`;
}

async function filterExistingItems(items, sourceId) {
  const ids = items.map(i => i.external_id).filter(Boolean);
  const { data: existing } = await supabase
    .from('articles')
    .select('external_id')
    .in('external_id', ids);

  const existingIds = new Set((existing || []).map(e => e.external_id));
  return items.filter(i => !existingIds.has(i.external_id));
}

function isImageOnly(tweet) {
  const text = tweet.full_text || tweet.text || '';
  return text.trim() === '' || (tweet.entities?.media?.length > 0 && text.replace(/https:\/\/t\.co\/\S+/g, '').trim() === '');
}

function extractUsername(url) {
  const match = url?.match(/twitter\.com\/([^/]+)|x\.com\/([^/]+)/);
  return match ? (match[1] || match[2]) : '';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { fetchAllSources, fetchAndProcessSource };
