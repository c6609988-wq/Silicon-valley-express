import { useState, useEffect, useCallback } from 'react';
import { Article } from '@/types';

const CACHE_KEY = 'home_articles_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟

interface CacheEntry {
  articles: Article[];
  timestamp: number;
}

function saveCache(articles: Article[]) {
  try {
    const entry: CacheEntry = { articles, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {}
}

function loadCache(): Article[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return [];
    return entry.articles;
  } catch {
    return [];
  }
}

function loadCacheStale(): Article[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const entry: CacheEntry = JSON.parse(raw);
    return entry.articles;
  } catch {
    return [];
  }
}

async function fetchArticles(count: number): Promise<Article[]> {
  const url = import.meta.env.DEV
    ? `http://localhost:3001/api/tweets/latest?count=${count}`
    : `/api/content?format=articles&limit=${count}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.articles || data.tweets || [];
}

export function useLiveTweets(count = 6) {
  const [articles, setArticles] = useState<Article[]>(() => loadCacheStale());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchArticles(count);
      if (items.length > 0) {
        saveCache(items);
        setArticles(items);
      } else {
        const cached = loadCacheStale();
        setArticles(cached);
      }
    } catch (e: any) {
      const cached = loadCacheStale();
      setArticles(cached);
      if (cached.length === 0) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    // 缓存未过期时直接用缓存，跳过网络请求
    const fresh = loadCache();
    if (fresh.length > 0) {
      setArticles(fresh);
      setLoading(false);
      return;
    }
    load();
  }, [load]);

  return { articles, loading, error, refetch: load };
}
