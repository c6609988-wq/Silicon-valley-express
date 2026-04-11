// server/test-feishu-push.js
// 用后台现有样例数据测试飞书卡片推送样式
// 用法：FEISHU_WEBHOOK_URL=https://... node server/test-feishu-push.js

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { pushDailyDigest } = require('./services/feishu');

const mockArticles = [
  {
    title: 'Google DeepMind 宣布 Gemma 4 模型开放使用',
    aiSummary:
      'Google DeepMind 正式开放 Gemma 4 系列模型，支持多模态输入，最小版本仅 1B 参数，可在消费级设备本地运行，开发者可通过 Hugging Face 直接下载。',
    url: 'https://x.com/GoogleDeepMind',
    sourceName: 'Google DeepMind',
    score: 95,
  },
  {
    title: 'OpenAI 内部文件：GPT-5 训练成本超 5 亿美元',
    aiSummary:
      'OpenAI GPT-5 单次预训练成本已突破 5 亿美元，推理能力在 MATH 和 GPQA 基准上较 GPT-4o 提升超 30%，预计 Q2 向付费用户推送。',
    url: 'https://x.com/OpenAI',
    sourceName: 'OpenAI',
    score: 92,
  },
  {
    title: 'Anthropic 完成 35 亿美元新一轮融资，估值达 615 亿美元',
    aiSummary:
      'Anthropic 宣布完成由 Amazon 领投的 35 亿美元 D 轮融资，估值升至 615 亿美元，资金将主要用于扩大 Claude 模型算力基础设施及企业级 API 服务。',
    url: 'https://x.com/AnthropicAI',
    sourceName: 'Anthropic',
    score: 90,
  },
];

(async () => {
  if (!process.env.FEISHU_WEBHOOK_URL) {
    console.error('[Test] 请先设置环境变量 FEISHU_WEBHOOK_URL');
    console.error('示例：FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxx node server/test-feishu-push.js');
    process.exit(1);
  }

  console.log('[Test] 开始推送测试卡片...');
  await pushDailyDigest(mockArticles, 'Cloe');
  console.log('[Test] 完成，请查看飞书。');
})();
