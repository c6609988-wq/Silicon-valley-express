# Twitter/X 推文爬取集成指南

## 任务目标
将 Apify Twitter Scraper 爬取的推文数据，集成到当前 React 项目的首页"AI 今日摘要"模块中，实现自动拉取指定账号推文并展示。

---

## 环境信息

- 项目框架：React + Vite + TypeScript + Tailwind
- 项目根目录已有 `.env` 文件，内容如下：
  ```
  VITE_APIFY_TOKEN=apify_api_oilCBZQtvpgDtTMoa1rJ7NM1U8lhDw01tTPL
  ```
- `src/hooks/useTwitterDigest.ts` 文件已创建完毕（见下方代码）

---

## 已完成的文件

### `src/hooks/useTwitterDigest.ts`（已存在，无需重建）

```typescript
import { useState, useEffect } from 'react';

const APIFY_TOKEN = import.meta.env.VITE_APIFY_TOKEN;
const ACTOR_ID = 'danek~twitter-scraper-ppr';

const WATCH_LIST = ['elonmusk', 'sama', 'AnthropicAI', 'karpathy'];

async function startScrape(): Promise<string> {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: WATCH_LIST,
        maxTweets: 20,
        addUserInfo: false,
      }),
    }
  );
  const data = await res.json();
  return data.data.id;
}

async function waitForResults(runId: string): Promise<any[]> {
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 4000));
    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
    );
    const { data } = await statusRes.json();
    if (data.status === 'SUCCEEDED') {
      const itemsRes = await fetch(
        `https://api.apify.com/v2/datasets/${data.defaultDatasetId}/items?token=${APIFY_TOKEN}`
      );
      return await itemsRes.json();
    }
    if (data.status === 'FAILED' || data.status === 'ABORTED') {
      throw new Error(`Apify run ${data.status}`);
    }
  }
  throw new Error('Timeout');
}

export function useTwitterDigest() {
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      setLoading(true);
      try {
        const runId = await startScrape();
        const results = await waitForResults(runId);
        setTweets(results);
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
```

---

## 需要 Claude Code 完成的任务

### 任务 1：找到首页组件

在 `src/pages/` 目录中找到首页对应的组件文件（可能叫 `Index.tsx` / `Home.tsx` / `Feed.tsx` 等）。

识别方式：找到渲染"AI 今日摘要"卡片的组件，该卡片目前包含硬编码的假数据，例如：
- "OpenAI GPT-5 预览版发布引发热议"
- "a16z 大手笔投资 AI 编程赛道"
- "Anthropic Claude 3.5 在多项测试中表现亮眼"

---

### 任务 2：接入真实数据

在找到的首页组件中：

1. 在文件顶部引入 hook：
   ```typescript
   import { useTwitterDigest } from '@/hooks/useTwitterDigest';
   ```

2. 在组件函数体内调用 hook：
   ```typescript
   const { tweets, loading, error } = useTwitterDigest();
   ```

3. 替换"AI 今日摘要"卡片中的硬编码内容：

   **加载中状态**（当 `loading === true`）：
   - 显示文字"正在从 X 拉取最新动态..."

   **错误状态**（当 `error !== null`）：
   - 显示文字 `获取失败：${error}`

   **正常状态**（有数据时）：
   - 将 `tweets` 数组的前 5 条渲染为列表
   - 每条显示：`@{tweet.author?.userName ?? ''}: {tweet.text}`
   - 文章数量显示 `tweets.length`
   - 来源数量显示固定值 `4`（对应 WATCH_LIST 的账号数）
   - AI 洞察数量显示 `tweets.length`

---

### 任务 3：验证

完成修改后，确认：
- 没有 TypeScript 类型错误
- 没有破坏其他现有功能
- 组件在 loading/error/success 三种状态下都有对应 UI

---

## Apify API 说明

| 参数 | 值 |
|------|-----|
| Actor ID | `danek~twitter-scraper-ppr` |
| 计费 | $0.30 / 1000 条结果 |
| 当前免费额度 | $5.00 |
| 响应时间 | 约 30-60 秒（异步轮询） |

返回数据结构示例：
```json
{
  "id": "1234567890",
  "text": "推文正文内容",
  "author": {
    "userName": "elonmusk",
    "name": "Elon Musk"
  },
  "createdAt": "2024-03-30T10:00:00.000Z",
  "likeCount": 1200,
  "retweetCount": 340
}
```

---

## 注意事项

- `.env` 文件已存在，不要覆盖或重建
- `useTwitterDigest.ts` 已存在，不要重建
- 只修改首页组件，不要动其他页面
- 保持原有 UI 样式不变，只替换数据部分
