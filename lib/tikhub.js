// lib/tikhub.js — TikHub API 采集模块（Vercel 版）
const axios = require('axios');

const client = axios.create({
  baseURL: process.env.TIKHUB_BASE_URL || 'https://api.tikhub.io',
  headers: {
    'Authorization': `Bearer ${process.env.TIKHUB_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

async function getUserTweets(username, count = 20) {
  try {
    const res = await client.get('/api/v1/twitter/web/fetch_user_post_tweet', {
      params: { screen_name: username }
    });
    const data = res.data?.data || {};
    const timeline = data.tweet_list || data.timeline || [];
    return timeline.slice(0, count);
  } catch (err) {
    console.error(`[TikHub] 获取 @${username} 失败:`, err.message);
    return [];
  }
}

async function getYouTubeVideos(channelUrl, count = 5) {
  try {
    const channelId = await resolveChannelId(channelUrl);
    const res = await client.get('/api/v1/youtube/web/get_channel_videos', {
      params: { channel_id: channelId }
    });
    const videos = res.data?.data?.videos || [];
    return videos.slice(0, count);
  } catch (err) {
    console.error(`[TikHub] YouTube 采集失败:`, err.message);
    return [];
  }
}

async function resolveChannelId(channelUrl) {
  const directMatch = channelUrl.match(/youtube\.com\/channel\/(UC[^/]+)/);
  if (directMatch) return directMatch[1];
  const res = await client.get('/api/v1/youtube/web/get_channel_id_v2', {
    params: { channel_url: channelUrl }
  });
  const channelId = res.data?.data?.channel_id;
  if (!channelId) throw new Error(`无法解析频道 ID: ${channelUrl}`);
  return channelId;
}

async function getVideoTranscript(videoId, lang = 'en') {
  try {
    const infoRes = await client.get('/api/v1/youtube/web/get_video_info', {
      params: { video_id: videoId }
    });
    const subtitles = infoRes.data?.data?.subtitles || [];
    const sub = subtitles.find(s => s.language_code === lang)
      || subtitles.find(s => s.language_code?.startsWith('en'))
      || subtitles[0];
    if (!sub?.url) return '';
    const subRes = await client.get('/api/v1/youtube/web/get_video_subtitles', {
      params: { subtitle_url: sub.url, format: 'txt' }
    });
    return subRes.data?.data?.subtitle || '';
  } catch (err) {
    console.error(`[TikHub] 字幕获取失败 (${videoId}):`, err.message);
    return '';
  }
}

function detectPlatform(url) {
  if (!url) return 'rss';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'x';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'rss';
}

function extractHandle(url) {
  const match = url?.match(/(?:twitter|x)\.com\/([^/?]+)|youtube\.com\/@([^/?]+)/);
  if (!match) return null;
  return `@${match[1] || match[2]}`;
}

module.exports = { getUserTweets, getYouTubeVideos, getVideoTranscript, detectPlatform, extractHandle, resolveChannelId };
