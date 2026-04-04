import { useState, useEffect } from 'react';

const SYSTEM_PROMPT = `## 角色
你是硅谷科技圈的信息分析师，帮助中文用户快速理解海外博主的每日推文动态。

## 输入
- 博主名称
- 日期
- 当日所有推文（原文、时间、类型）

## 输出
严格按以下结构输出：

### 一、今日核心要点
把当天所有推文的信息提炼成3-7个要点。

要求：
- 每个要点一句话说清楚，不超过30字
- 按重要性排序，最重要的放前面
- 合并同一话题的多条推文
- 如果多条推文都是无实质内容的日常互动，合并成一条"与网友进行了X次日常互动"
- 如果有明确的态度/立场，要体现出来（支持/反对/嘲讽/期待）
格式：
1. [话题关键词]：[一句话概括]
2. [话题关键词]：[一句话概括]

### 二、划重点
2-4句话的简短分析，帮助用户理解这些信息的价值。

要求：
- 如果今天确实没什么重要内容，就直接说"今天主要是日常互动，没有重大信息"
- 不要硬凑分析，没料就说没料
- 语气像一个懂行的朋友在告诉你"今天这人说了啥"

### 三、原文翻译
逐条翻译当天所有推文。

格式：
[时间] 「原创」
原文：xxx
翻译：xxx
---

翻译要求：
- 准确传达原意，保留语气和情绪
- 遇到梗、俚语、缩写，翻译后括号注释原意`;

export interface AuthorDigest {
  author: string;
  content: string;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useAIDigest(tweets: any[]) {
  const [digests, setDigests] = useState<AuthorDigest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tweets.length) return;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        // 按作者分组
        const byAuthor: Record<string, any[]> = {};
        for (const t of tweets) {
          const name = t.author?.userName ?? 'unknown';
          if (!byAuthor[name]) byAuthor[name] = [];
          byAuthor[name].push(t);
        }

        const results: AuthorDigest[] = [];
        for (const [author, authorTweets] of Object.entries(byAuthor)) {
          const tweetsText = authorTweets
            .map(t => `[${t.createdAt ?? ''}] 「原创」\n${t.text}`)
            .join('\n---\n');

          const userContent = `博主名称：@${author}\n日期：${new Date().toLocaleDateString('zh-CN')}\n当日所有推文：\n\n${tweetsText}`;

          const res = await fetch(`${SERVER_URL}/api/ai/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt: SYSTEM_PROMPT, content: userContent }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || `HTTP ${res.status}`);
          }

          const data = await res.json();
          results.push({ author, content: data.result });
        }

        setDigests(results);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [tweets]);

  return { digests, loading, error };
}
