// server/routes/articles.js
// 供前端详情页根据 ID 加载文章：优先内存缓存，回退 Supabase

const express = require('express');
const router = express.Router();
const { getCachedArticleById } = require('../services/articleCache');
const { supabase } = require('../db');

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  // 1. 先查内存缓存（命中率高，零延迟）
  const cached = getCachedArticleById(id);
  if (cached) return res.json(cached);

  // 2. 回退查 Supabase（飞书跳转场景：服务器已重启，缓存为空）
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('external_id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: '文章未找到' });
    }

    // 转换为前端 Article 格式
    const raw = data.raw_data || {};
    const article = {
      id: data.external_id || data.id,
      title: data.title || data.author_name || '',
      summary: raw.summary || '',
      content: data.translated_content || data.original_content || '',
      originalContent: data.original_content || '',
      sourceName: data.author_name,
      sourceHandle: data.author_handle,
      sourceIcon: '𝕏',
      sourceType: data.platform || 'twitter',
      publishTime: data.fetched_at || data.published_at,
      readTime: Math.max(1, Math.ceil((data.ai_analysis || '').length / 400)),
      isBookmarked: false,
      url: data.link || `https://x.com/${(data.author_handle || '').replace('@', '')}`,
      score: raw.score || 0,
      aiSummary: data.ai_analysis || '',
      aiComment: raw.aiComment || data.ai_analysis || '',
      chapters: raw.chapters || [],
    };

    return res.json(article);
  } catch (e) {
    console.error('[Articles] Supabase 查询失败:', e.message);
    return res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
