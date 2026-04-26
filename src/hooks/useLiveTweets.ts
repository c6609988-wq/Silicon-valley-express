import { useState, useEffect } from 'react';
import { Article } from '@/types';

const CACHE_KEY = 'home_articles_cache';

function saveCache(articles: Article[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(articles));
  } catch {}
}

function loadCache(): Article[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function fetchArticles(): Promise<Article[]> {
  const url = import.meta.env.DEV
    ? 'http://localhost:3001/api/tweets/latest?count=100'
    : '/api/content?format=articles&limit=100';

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.articles || data.tweets || [];
}

export function useLiveTweets(_count = 6) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const items = await fetchArticles();
        if (items.length > 0) {
          saveCache(items);
          setArticles(items);
        } else {
          // API 成功但无数据，用缓存兜底
          const cached = loadCache();
          setArticles(cached);
        }
      } catch (e: any) {
        // API 失败，静默降级到本地缓存，不显示错误
        const cached = loadCache();
        setArticles(cached);
        if (cached.length === 0) {
          setError(e.message);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { articles, loading, error };
}
