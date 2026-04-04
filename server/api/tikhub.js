// server/api/tikhub.js
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
    const response = await client.get('/api/v1/twitter/web/fetch_user_post_tweet', {
      params: { screen_name: username }
    });
    // TikHub 返回字段为 tweet_list，兼容旧版 timeline
    const data = response.data?.data || {};
    const timeline = data.tweet_list || data.timeline || [];
    // 每条 timeline 条目包含 tweet 对象，取前 count 条
    return timeline.slice(0, count);
  } catch (error) {
    console.error(`[TikHub] 获取 @${username} 推文失败:`, error.message);
    throw error;
  }
}

async function getTweetsByProfileUrl(profileUrl) {
  const match = profileUrl.match(/twitter\.com\/([^/]+)|x\.com\/([^/]+)/);
  if (!match) throw new Error('无法解析 Twitter/X 用户名');
  const username = match[1] || match[2];
  return getUserTweets(username);
}

async function getYouTubeVideos(channelUrl, count = 5) {
  try {
    const channelId = await resolveChannelId(channelUrl);
    const response = await client.get('/api/v1/youtube/web/get_channel_videos', {
      params: { channel_id: channelId }
    });
    const videos = response.data?.data?.videos || [];
    return videos.slice(0, count);
  } catch (error) {
    console.error(`[TikHub] 获取 YouTube 视频失败 (${channelUrl}):`, error.message);
    throw error;
  }
}

async function resolveChannelId(channelUrl) {
  const directMatch = channelUrl.match(/youtube\.com\/channel\/(UC[^/]+)/);
  if (directMatch) return directMatch[1];

  const response = await client.get('/api/v1/youtube/web/get_channel_id_v2', {
    params: { channel_url: channelUrl }
  });
  const channelId = response.data?.data?.channel_id;
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
  } catch (error) {
    console.error(`[TikHub] 获取字幕失败 (${videoId}):`, error.message);
    return '';
  }
}

module.exports = { getUserTweets, getTweetsByProfileUrl, getYouTubeVideos, getVideoTranscript, resolveChannelId };
