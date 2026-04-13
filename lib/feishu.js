// lib/feishu.js — 飞书机器人 Webhook 推送（Vercel 版）
const axios = require('axios');

const DEFAULT_WEBHOOK = 'https://open.feishu.cn/open-apis/bot/v2/hook/2a66936b-0f2b-4536-ab6d-ded9a2fc5c26';
const WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL || DEFAULT_WEBHOOK;
const APP_URL = 'https://silicon-valley-express.vercel.app';

/**
 * 格式化日期 YYYY-MM-DD（北京时间）
 */
function formatDate() {
  const bj = new Date(Date.now() + 8 * 3600 * 1000);
  return bj.toISOString().slice(0, 10);
}

/**
 * 从 ai_analysis 文本提取摘要（兼容 v4 / v3 / 旧格式）
 */
function extractSummary(text = '') {
  // v4 格式：核心要点\n内容\n\n深度解读\n内容
  const v4kp = text.match(/^核心要点\s*\n([\s\S]*?)(?=\n深度解读|$)/m);
  if (v4kp) {
    return v4kp[1].trim().replace(/\*\*/g, '').slice(0, 120);
  }

  // v3 格式：二、划重点
  const v3 = text.match(/二[、.]\s*划重点[\s\S]*?\n([\s\S]*?)(?=三[、.]|$)/);
  if (v3) {
    return v3[1].trim().replace(/\*\*/g, '').slice(0, 120);
  }

  // 旧格式兜底：去掉标题行，取前两句
  return text.replace(/\*\*/g, '').replace(/#{1,3}\s.+\n/g, '').trim()
    .split(/(?<=[。！？])\s*/)[0].slice(0, 100);
}

/**
 * 推送当日精选文章到飞书群机器人
 * @param {Array}  articles  - 文章数组（Supabase DB 行格式）
 * @param {string} userName  - 收件人昵称，默认"同学"
 */
async function pushDailyDigest(articles, userName = '同学') {
  if (!articles || articles.length === 0) {
    console.log('[Feishu] 无文章可推送');
    return;
  }

  const top3 = articles.slice(0, 3);
  const dateStr = formatDate();

  // ── elements ───────────────────────────────────────────────
  const elements = [];

  // 问候语
  elements.push({
    tag: 'div',
    text: {
      tag: 'lark_md',
      content: `Hi，**${userName}** 同学，根据你可能感兴趣的内容为你推荐：`,
    },
  });

  // 内置子卡片
  const innerElements = [];

  innerElements.push({
    tag: 'div',
    text: { tag: 'lark_md', content: '<font color="blue">**✨ 今日精选**</font>' },
  });
  innerElements.push({ tag: 'hr' });

  top3.forEach((article, i) => {
    const title   = article.title || `${article.author_name || ''} 今日动态`;
    const summary = extractSummary(article.ai_analysis || article.aiSummary || '');

    // 跳转硅谷速递详情页
    const articleId = article.external_id || article.id || '';
    const detailUrl = articleId
      ? `${APP_URL}/article/${articleId}`
      : (article.link || article.url || APP_URL);
    const linkLine = `\n<font color="blue">[查看详情 ›](${detailUrl})</font>`;

    innerElements.push({
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: `**${i + 1}. ${title}**\n<font color="grey">${summary}</font>${linkLine}`,
      },
    });

    if (i < top3.length - 1) innerElements.push({ tag: 'hr' });
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

  // ── 完整卡片 body ───────────────────────────────────────────
  const body = {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: `📌 你的专属新闻速递 | ${dateStr}` },
        template: 'wathet',
      },
      elements,
    },
  };

  try {
    const res = await axios.post(WEBHOOK_URL, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    if (res.data?.StatusCode === 0 || res.data?.code === 0) {
      console.log('[Feishu] ✓ 推送成功');
    } else {
      console.warn('[Feishu] 推送返回异常:', JSON.stringify(res.data));
    }
  } catch (e) {
    console.error('[Feishu] 推送失败:', e.message);
  }
}

module.exports = { pushDailyDigest };
