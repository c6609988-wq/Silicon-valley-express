import { useState, useEffect } from 'react';

import { API_BASE } from '@/lib/apiBase';
const SERVER_URL = API_BASE;

export function useTwitterDigest() {
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${SERVER_URL}/api/tweets/OpenAI?count=5`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setTweets(data.tweets || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, []);

  return { tweets, loading, error };
}
