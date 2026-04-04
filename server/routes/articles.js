// server/routes/articles.js
// 供前端详情页根据 ID 加载已缓存的 AI 分析文章

const express = require('express');
const router = express.Router();
const { getCachedArticleById } = require('../services/articleCache');

router.get('/:id', (req, res) => {
  const article = getCachedArticleById(req.params.id);
  if (!article) {
    return res.status(404).json({ error: '文章未找到，请返回首页刷新后重试' });
  }
  res.json(article);
});

module.exports = router;
