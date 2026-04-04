import { useState, useEffect } from 'react';
import { Article } from '@/types';

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
        // 生产环境：从 Supabase 读取所有历史文章
        // 本地开发：从 Express server 的 /api/tweets/latest
        if (import.meta.env.DEV) {
          const res = await fetch(`${API_BASE}/api/tweets/latest?count=${count}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setArticles(data.tweets || []);
        } else {
          const res = await fetch(`/api/content?format=articles&limit=100`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          // 若数据库为空，回退到实时抓取
          if (data.articles && data.articles.length > 0) {
            setArticles(data.articles);
          } else {
            const res2 = await fetch(`/api/tweets?count=${count}`);
            if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
            const data2 = await res2.json();
            setArticles(data2.tweets || []);
          }
        }
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
