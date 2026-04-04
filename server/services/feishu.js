// server/services/feishu.js
// 飞书机器人 Webhook 推送服务

const axios = require('axios');

const WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL;

/**
 * 推送今日3篇精选文章到飞书
 * @param {Array} articles - 文章数组，取前3篇
 */
async function pushDailyDigest(articles) {
  if (!WEBHOOK_URL) {
    console.warn('[Feishu] 未配置 FEISHU_WEBHOOK_URL，跳过推送');
    return;
  }
  const top3 = articles.slice(0, 3);

  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  // 构建飞书富文本消息
  const elements = [];

  // 标题
  elements.push({
    tag: 'div',
    text: { tag: 'lark_md', content: `**📰 今日精选 · ${today}**` },
  });
  elements.push({ tag: 'hr' });

  // 每篇文章
  top3.forEach((article, i) => {
    const sourceIcon = article.sourceIcon || '🌐';
    const readTime = article.readTime ? `${article.readTime} 分钟阅读` : '';

    elements.push({
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: `**${i + 1}. ${article.title}**`,
      },
    });
    elements.push({
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: `${sourceIcon} ${article.sourceName}${readTime ? '  ·  ' + readTime : ''}`,
      },
    });
    elements.push({
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: article.aiSummary || article.summary || '',
      },
    });

    if (article.url) {
      elements.push({
        tag: 'action',
        actions: [{
          tag: 'button',
          text: { tag: 'plain_text', content: '查看原文' },
          type: 'default',
          url: article.url,
        }],
      });
    }

    if (i < top3.length - 1) elements.push({ tag: 'hr' });
  });

  const body = {
    msg_type: 'interactive',
    card: {
      elements,
      header: {
        title: { tag: 'plain_text', content: '🤖 AI 信息日报' },
        template: 'blue',
      },
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
