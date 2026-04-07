// api/push-feishu.js → POST /api/push-feishu
// 手动触发飞书推送（也是 cron 失败时的兜底）
// 优先推今日 Supabase 文章，若为空则推内置精选文章
const { pushDailyDigest } = require('../lib/feishu');
const { supabase } = require('../lib/supabase');

// 内置精选文章（与首页 mock 数据保持一致，按日期倒序取最新3条）
const FALLBACK_ARTICLES = [
  {
    author_name: 'Andrej Karpathy',
    author_handle: '@karpathy',
    platform: 'x',
    title: 'Andrej Karpathy：氛围编程被低估，5年内写代码将不再是差异化竞争力',
    ai_analysis: `### 二、划重点\nKarpathy 敢说这句话很有分量——他本人是顶级工程师，这不是外行人的乌托邦幻想。"vibe coding 让谁能构建软件"这个问题是整个 AI 工具链最核心的变量。如果软件创作门槛真的坍塌，受益的不只是独立开发者，而是每一个有产品想法的人。对产品经理来说，这意味着你离"自己做出原型"只差一个正确的 AI 工具选择。\n### 三、原文翻译`,
    link: 'https://x.com/karpathy',
    published_at: new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10) + 'T13:42:00+08:00',
  },
  {
    author_name: 'Sam Altman',
    author_handle: '@sama',
    platform: 'x',
    title: 'Sam Altman：AI安全与能力互补而非对立，"安全vs速度"框架从来就是错的',
    ai_analysis: `### 二、划重点\n这条推文的背景很重要：Altman 对 AI 安全话题的主动回应。"safety vs. speed framing was always wrong"是一句很强的断言。真正有价值的是"互补"这个技术判断——如果成立，意味着未来更强的模型不需要在能力和安全之间做取舍，这对整个行业的研发路径是个重要信号。\n### 三、原文翻译`,
    link: 'https://x.com/sama',
    published_at: new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10) + 'T09:18:00+08:00',
  },
  {
    author_name: 'Anthropic',
    author_handle: '@AnthropicAI',
    platform: 'x',
    title: 'Claude 3.7 Sonnet 全面发布：编程能力+40%，更新价值宪法',
    ai_analysis: `### 二、划重点\nClaude 3.7 这个版本值得重点关注——Anthropic 一贯的策略是用安全性差异化对抗 OpenAI，"更新价值宪法"这个动作不只是 PR，背后是真实的技术迭代（Constitutional AI）。编程 +40% 意味着在代码场景 Claude 正在追平甚至超越 GPT-4o 级别。对用 Claude 做产品的开发者来说，API 性价比可能有明显提升，值得重新评估技术栈。\n### 三、原文翻译`,
    link: 'https://x.com/AnthropicAI',
    published_at: new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10) + 'T02:00:00+08:00',
  },
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 尝试从 Supabase 读取最近24小时的文章
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: recentArticles } = await supabase
      .from('articles')
      .select('*')
      .gte('fetched_at', since)
      .order('fetched_at', { ascending: false })
      .limit(3);

    let articlesToPush = recentArticles && recentArticles.length > 0
      ? recentArticles
      : FALLBACK_ARTICLES;

    const source = recentArticles && recentArticles.length > 0 ? 'supabase' : 'fallback';
    console.log(`[PushFeishu] 使用 ${source} 数据，推送 ${articlesToPush.length} 条`);

    await pushDailyDigest(articlesToPush);

    res.json({
      success: true,
      source,
      pushed: articlesToPush.length,
      titles: articlesToPush.map(a => a.title),
    });
  } catch (err) {
    console.error('[PushFeishu] 失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
