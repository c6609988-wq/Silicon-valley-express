// api/debug-crawler.js → GET /api/debug-crawler?username=sama
// 诊断爬虫原始数据结构，查看 TikHub 返回的推文字段
const tikhub = require('../lib/tikhub');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const username = req.query.username || 'sama';

  try {
    console.log(`[DebugCrawler] 开始拉取 @${username} 的推文...`);
    const rawTweets = await tikhub.getUserTweets(username, 5);

    if (!rawTweets.length) {
      return res.json({ ok: false, username, count: 0, message: 'TikHub 返回空数组', raw: [] });
    }

    // 分析每条推文的字段和过滤结果
    const analyzed = rawTweets.slice(0, 5).map((t, i) => {
      const text = t.text || t.full_text || '';
      const filterResult = {
        is_retweet: t.is_retweet,
        retweeted: t.retweeted,
        is_reply: t.is_reply,
        text_length: text.length,
        pass_retweet_filter: !t.is_retweet && !t.retweeted && !t.is_reply,
        pass_length_filter: text.length > 30,
        pass_all: !t.is_retweet && !t.retweeted && !t.is_reply && text.length > 30,
      };
      return {
        index: i,
        tweet_id: t.tweet_id || t.id_str || t.id,
        text_preview: text.slice(0, 100),
        created_at: t.created_at,
        top_level_keys: Object.keys(t),
        filter: filterResult,
      };
    });

    const passingCount = analyzed.filter(a => a.filter.pass_all).length;

    res.json({
      ok: true,
      username,
      total_returned: rawTweets.length,
      passing_filters: passingCount,
      analyzed,
      // 返回第一条推文的完整原始数据，方便排查
      first_tweet_raw: rawTweets[0],
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, stack: err.stack });
  }
};
