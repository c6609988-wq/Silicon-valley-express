// lib/feishu.js — 飞书机器人 Webhook 推送（Vercel 版）
const axios = require('axios');

// 优先读环境变量，回退使用默认 webhook
const DEFAULT_WEBHOOK = 'https://open.feishu.cn/open-apis/bot/v2/hook/da4766ec-c1a7-4f50-b7d1-bf1b7681db94';
const WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL || DEFAULT_WEBHOOK;

/**
 * 推送当日精选文章到飞书群机器人
 * @param {Array} articles - 文章数组（Supabase DB 行格式）
 * @param {string} source - 来源标识：'today' | 'afternoon' | 'yesterday' | 'latest'
 */
async function pushDailyDigest(articles, source = 'today') {
  if (!articles || articles.length === 0) {
    console.log('[Feishu] 无文章可推送');
    return;
  }

  const top3 = articles.slice(0, 3);

  const bjDate = new Date(Date.now() + 8 * 3600 * 1000);
  const dateStr = bjDate.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const sourceLabels = {
    today:     `📰 今日精选 · ${dateStr}`,
    afternoon: `🔄 下午更新 · ${dateStr}`,
    yesterday: `📅 昨日精选 · ${dateStr}（今日暂无新内容）`,
    latest:    `📚 近期精选 · ${dateStr}`,
  };
  const headerLabel = sourceLabels[source] || sourceLabels.today;
  const subLabel = source === 'afternoon'
    ? '下午 15:00 补充更新，今日新增内容'
    : '每日 7:00 自动更新，从硅谷博主推文中 AI 精选最有价值的内容';

  const elements = [];

  // 日期标题
  elements.push({
    tag: 'div',
    text: { tag: 'lark_md', content: `**${headerLabel}**\n${subLabel}` },
  });
  elements.push({ tag: 'hr' });

  // 每篇文章
  top3.forEach((article, i) => {
    const platform = article.platform || 'x';
    const icon = platform === 'x' ? '𝕏' : platform === 'youtube' ? '▶️' : '📰';
    const author = article.author_name || '';
    const handle = article.author_handle || '';
    const title = article.title || `${author} 今日动态`;

    // 提取摘要：ai_analysis 前两句话
    const analysis = article.ai_analysis || '';
    const summary = extractSummary(analysis);

    elements.push({
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: `**${i + 1}. ${title}**`,
      },
    });

    elements.push({
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: `${icon} ${author} ${handle}`,
      },
    });

    if (summary) {
      elements.push({
        tag: 'div',
        text: { tag: 'lark_md', content: summary },
      });
    }

    if (article.link) {
      elements.push({
        tag: 'action',
        actions: [{
          tag: 'button',
          text: { tag: 'plain_text', content: '查看原文' },
          type: 'default',
          url: article.link,
        }],
      });
    }

    if (i < top3.length - 1) elements.push({ tag: 'hr' });
  });

  // 底部签名
  elements.push({ tag: 'hr' });
  elements.push({
    tag: 'div',
    text: {
      tag: 'lark_md',
      content: `_由 硅谷速递 AI 自动生成 · [打开 App 查看全部历史](https://silicon-valley-express.vercel.app)_`,
    },
  });

  const body = {
    msg_type: 'interactive',
    card: {
      elements,
      header: {
        title: { tag: 'plain_text', content: '🤖 硅谷速递 · AI 信息日报' },
        template: 'blue',
      },
    },
  };

  try {
    const res = await axios.post(WEBHOOK_URL, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    // 飞书 webhook 成功时返回 {"StatusCode":0} 或 {"code":0}
    if (res.data?.StatusCode === 0 || res.data?.code === 0) {
      console.log('[Feishu] ✓ 推送成功');
    } else {
      console.warn('[Feishu] 推送返回异常:', JSON.stringify(res.data));
    }
  } catch (e) {
    console.error('[Feishu] 推送失败:', e.message);
  }
}

// 从 ai_analysis 文本中提取"划重点"部分作为摘要
function extractSummary(text) {
  // 优先取"二、划重点"段落
  const commentMatch = text.match(/二[、.]\s*划重点[\s\S]*?\n([\s\S]*?)(?=###\s*三|三[、.]|$)/);
  if (commentMatch) {
    return commentMatch[1].trim().replace(/\*\*/g, '').slice(0, 200);
  }
  // 回退：取前两句
  return text.replace(/#{1,3}\s.+\n/g, '').trim().split(/(?<=[。！？])\s*/).slice(0, 2).join('').slice(0, 150);
}

module.exports = { pushDailyDigest };
