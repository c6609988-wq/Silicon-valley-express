import { useState, useEffect } from 'react';
import { Article } from '@/types';

const API_BASE = import.meta.env.VITE_SERVER_URL
  || (import.meta.env.DEV ? 'http://localhost:3001' : '');

// 每页100条，最多加载5页（500条），满足长期历史积累需求
const MAX_PAGES = 5;

async function fetchAllArticles(): Promise<Article[]> {
  const allArticles: Article[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = import.meta.env.DEV
      ? `${API_BASE}/api/tweets/latest?count=100&page=${page}`
      : `/api/content?format=articles&limit=100&page=${page}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const items: Article[] = data.articles || data.tweets || [];
    allArticles.push(...items);

    // 如果这页不满100条，说明已经到底了
    if (items.length < 100) break;
  }

  return allArticles;
}

export function useLiveTweets(_count = 6) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch_() {
      setLoading(true);
      setError(null);
      try {
        const items = await fetchAllArticles();
        setArticles(items);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetch_();
  }, []);

  return { articles, loading, error };
}
