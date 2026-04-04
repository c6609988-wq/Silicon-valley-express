import { useState, useEffect } from 'react';
import { Article } from '@/types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useLiveTweets(count = 6) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch_() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${SERVER_URL}/api/tweets/latest?count=${count}`);
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
