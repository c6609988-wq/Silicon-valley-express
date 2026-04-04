// server/services/articleCache.js
// 简单内存缓存，TTL 30 分钟，避免每次请求都调用 AI

const CACHE_TTL = 30 * 60 * 1000;

const cache = {
  articles: [],
  byId: new Map(),
  fetchedAt: null,
};

function setCachedArticles(articles) {
  cache.articles = articles;
  cache.fetchedAt = Date.now();
  cache.byId.clear();
  for (const a of articles) cache.byId.set(a.id, a);
  console.log(`[Cache] 已缓存 ${articles.length} 篇文章`);
}

function getCachedArticles() {
  if (!cache.fetchedAt) return null;
  if (Date.now() - cache.fetchedAt > CACHE_TTL) return null;
  return cache.articles;
}

function getCachedArticleById(id) {
  return cache.byId.get(id) || null;
}

module.exports = { setCachedArticles, getCachedArticles, getCachedArticleById };
