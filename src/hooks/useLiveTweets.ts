import { useState, useEffect, useCallback } from 'react';
import { Article } from '@/types';
import { getSeedArticles } from '@/data/seedArticles';

const CACHE_KEY = 'home_articles_cache';
const CACHE_TTL_MS = 5 * 60 * 1000;

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

function parseCache(raw: string | null): CacheEntry | null {
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return { articles: parsed, timestamp: 0 };
  if (Array.isArray(parsed?.articles)) return parsed;
  return null;
}

function loadCache(): Article[] {
  try {
    const entry = parseCache(localStorage.getItem(CACHE_KEY));
    if (!entry) return [];
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return [];
    return entry.articles;
  } catch {
    return [];
  }
}

function loadCacheStale(): Article[] {
  try {
    const entry = parseCache(localStorage.getItem(CACHE_KEY));
    return entry?.articles ?? [];
  } catch {
    return [];
  }
}

function articleKey(article: Article) {
  return article.id || article.url || `${article.title}-${article.sourceHandle || article.sourceName}`;
}

function mergeSeedArticles(articles: Article[]): Article[] {
  if (!import.meta.env.DEV) return articles;

  const merged = new Map<string, Article>();

  getSeedArticles().forEach(article => {
    merged.set(articleKey(article), article);
  });

  articles.forEach(article => {
    const key = articleKey(article);
    if (!merged.has(key)) merged.set(key, article);
  });

  return Array.from(merged.values()).sort((a, b) =>
    ((b.priorityWeight ?? 1) - (a.priorityWeight ?? 1)) ||
    ((b.score ?? 0) - (a.score ?? 0)) ||
    (new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime())
  );
}

async function fetchArticles(count: number): Promise<Article[]> {
  const limit = Math.max(count, 100);
  const urls = import.meta.env.DEV
    ? [
        `http://localhost:3001/api/content?format=articles&limit=${limit}`,
        `http://localhost:3001/api/tweets/latest?count=${limit}`,
      ]
    : [`/api/content?format=articles&limit=${limit}`];

  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const articles = data.articles || data.tweets || [];
      if (articles.length > 0) return articles;
    } catch (error: any) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return [];
}

export function useLiveTweets(count = 100) {
  const [articles, setArticles] = useState<Article[]>(() => mergeSeedArticles(loadCacheStale()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchArticles(count);
      if (items.length > 0) {
        const merged = mergeSeedArticles(items);
        saveCache(merged);
        setArticles(merged);
      } else {
        setArticles(mergeSeedArticles(loadCacheStale()));
      }
    } catch (e: any) {
      const cached = mergeSeedArticles(loadCacheStale());
      setArticles(cached);
      if (cached.length === 0) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    const fresh = mergeSeedArticles(loadCache());
    if (fresh.length > 0) {
      setArticles(fresh);
      setLoading(false);
      return;
    }
    load();
  }, [load]);

  return { articles, loading, error, refetch: load };
}
