import { useState, useEffect } from 'react';
import { Article } from '@/types';

// 生产环境（Vercel）用相对路径，本地开发用 localhost:3001
const API_BASE = import.meta.env.VITE_SERVER_URL
  || (import.meta.env.DEV ? 'http://localhost:3001' : '');

export function useLiveTweets(count = 6) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch_() {
      setLoading(true);
      setError(null);
      try {
        // 本地：/api/tweets/latest（Express server）
        // 生产：/api/tweets（Vercel Serverless）
        const endpoint = import.meta.env.DEV
          ? `${API_BASE}/api/tweets/latest?count=${count}`
          : `/api/tweets?count=${count}`;
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setArticles(data.tweets || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetch_();
  }, [count]);

  return { articles, loading, error };
}
