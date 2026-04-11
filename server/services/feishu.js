// server/services/feishu.js
// 飞书机器人 Webhook 推送服务

const axios = require('axios');

const WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL;

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 推送今日3篇精选文章到飞书
 * @param {Array}  articles - 文章数组，取前3篇
 * @param {string} userName - 收件人昵称，默认"同学"
 */
async function pushDailyDigest(articles, userName = '同学') {
  if (!WEBHOOK_URL) {
    console.warn('[Feishu] 未配置 FEISHU_WEBHOOK_URL，跳过推送');
    return;
  }

  const top3 = articles.slice(0, 3);
  const dateStr = formatDate(new Date());

  // ── elements 数组 ──────────────────────────────────────────
  const elements = [];

  // 问候语
  elements.push({
    tag: 'div',
    text: {
      tag: 'lark_md',
      content: `Hi，**${userName}** 同学，根据你可能感兴趣的内容为你推荐：`,
    },
  });

  // 内置子卡片：今日精选标题
  const innerElements = [];

  innerElements.push({
    tag: 'div',
    text: {
      tag: 'lark_md',
      content: '<font color="blue">**✨ 今日精选**</font>',
    },
  });
  innerElements.push({ tag: 'hr' });

  // 每条新闻：左侧文字列 + 右侧缩略图列
  top3.forEach((article, i) => {
    const summary = article.aiSummary || article.summary || '';
    // 优先跳转硅谷速递详情页，回退原文链接
    const articleId = article.id || article.external_id;
    const detailUrl = articleId
      ? `https://silicon-valley-express.vercel.app/article/${articleId}`
      : (article.url || '');
    const link = detailUrl
      ? `\n<font color="blue">[查看详情 ›](${detailUrl})</font>`
      : '';

    innerElements.push({
      tag: 'column_set',
      flex_mode: 'none',
      background_style: 'default',
      columns: [
        {
          tag: 'column',
          width: 'weighted',
          weight: 4,
          elements: [{
            tag: 'div',
            text: {
              tag: 'lark_md',
              content: `**${i + 1}. ${article.title}**\n<font color="grey">${summary}</font>${link}`,
            },
          }],
        },
        {
          tag: 'column',
          width: 'weighted',
          weight: 1,
          elements: [{
            tag: 'div',
            text: {
              tag: 'lark_md',
              content: '<font color="wathet">▬▬▬\n▬▬▬▬\n▬▬▬</font>',
            },
          }],
        },
      ],
    });

    if (i < top3.length - 1) {
      innerElements.push({ tag: 'hr' });
    }
  });

  elements.push({
    tag: 'column_set',
    flex_mode: 'none',
    background_style: 'grey',
    columns: [{
      tag: 'column',
      width: 'weighted',
      weight: 1,
      elements: innerElements,
    }],
  });

  // ── 完整卡片 body ──────────────────────────────────────────
  const body = {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: {
          tag: 'plain_text',
          content: `📌 你的专属新闻速递 | ${dateStr}`,
        },
        template: 'wathet',
      },
      elements,
    },
  };

  try {
    const res = await axios.post(WEBHOOK_URL, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    if (res.data?.StatusCode === 0 || res.data?.code === 0) {
      console.log('[Feishu] 推送成功');
    } else {
      console.warn('[Feishu] 推送返回异常:', JSON.stringify(res.data));
    }
  } catch (e) {
    console.error('[Feishu] 推送失败:', e.message);
  }
}

module.exports = { pushDailyDigest };
