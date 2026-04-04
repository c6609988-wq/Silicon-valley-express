// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { startScheduler, runDailyDigest } = require('./services/scheduler');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/sources', require('./routes/sources'));
app.use('/api/content', require('./routes/content'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/tweets', require('./routes/tweets'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/ai', require('./routes/ai'));

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// 手动触发飞书推送（测试用）
app.post('/api/push-now', async (req, res) => {
  res.json({ message: '推送任务已启动，请查看服务器日志' });
  runDailyDigest(); // 异步执行，不阻塞响应
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[Server] 运行在 http://localhost:${PORT}`);
  startScheduler();
});
