// server/services/scheduler.js
const cron = require('node-cron');
const axios = require('axios');
const { pushDailyDigest } = require('./feishu');

const SERVER_PORT = process.env.PORT || 3001;

async function runDailyDigest() {
  console.log(`[Scheduler] ${new Date().toISOString()} 开始定时抓取 + 飞书推送`);
  try {
    // 调用内部 /api/tweets/latest，触发 TikHub 抓取 + DeepSeek 分析（结果会写入缓存）
    const res = await axios.get(
      `http://localhost:${SERVER_PORT}/api/tweets/latest?count=3`,
      { timeout: 180000 } // 3 分钟超时，留足 AI 分析时间
    );
    const articles = res.data?.tweets || [];

    if (articles.length === 0) {
      console.warn('[Scheduler] 无文章可推送');
      return;
    }

    await pushDailyDigest(articles);
    console.log(`[Scheduler] ✓ 飞书推送完成，共 ${articles.length} 篇`);
  } catch (err) {
    console.error('[Scheduler] 定时任务出错:', err.message);
  }
}

function startScheduler() {
  // 默认每天北京时间早 8 点（UTC 0:00）执行
  const cronExpression = process.env.DAILY_FETCH_CRON || '0 0 * * *';
  console.log(`[Scheduler] 定时任务已启动，规则：${cronExpression}（Asia/Shanghai）`);

  cron.schedule(cronExpression, runDailyDigest, { timezone: 'Asia/Shanghai' });
}

module.exports = { startScheduler, runDailyDigest };
