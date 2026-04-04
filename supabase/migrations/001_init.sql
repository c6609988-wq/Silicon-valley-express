-- ============================================================
-- 硅谷速递 App 数据库初始化
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================================

-- 1. 集合表（信息集合，如"OpenAI核心动向"）
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 信息源表（博主/频道/RSS）
CREATE TABLE IF NOT EXISTS sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT,
  url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('x', 'youtube', 'rss')),
  source_type TEXT DEFAULT 'user' CHECK (source_type IN ('user', 'preset')),
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  enabled BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 文章/推文内容表
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  external_id TEXT UNIQUE,
  author_name TEXT,
  author_handle TEXT,
  title TEXT,
  original_content TEXT,
  translated_content TEXT,
  ai_analysis TEXT,
  content_type TEXT DEFAULT 'short' CHECK (content_type IN ('short', 'long')),
  link TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  raw_data JSONB
);

-- 4. 系统设置表（提示词等运行时可修改配置）
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 默认提示词
INSERT INTO settings (key, value, description) VALUES
(
  'SHORT_CONTENT_PROMPT',
  '## 角色
你是硅谷科技圈的信息分析师，帮助中文用户快速理解海外博主的每日推文动态。

## 输入
- 博主名称
- 日期
- 当日所有推文（原文、时间、类型）

## 输出

### 一、今日核心要点
把当天所有推文的信息提炼成3-7个要点。
- 每个要点一句话，不超过30字
- 按重要性排序
- 合并同一话题的多条推文

格式：
1. [话题关键词]：[一句话概括]

### 二、划重点
2-4句话简短分析。语气像懂行的朋友在说"今天这人说了啥"。
没重要内容就直接说"今天主要是日常互动，没有重大信息"。

### 三、原文翻译
逐条翻译，格式：
[时间] [「原创」/「转发」/「回复@xxx」]
原文：xxx
翻译：xxx
---',
  '短信息分析提示词（推文等字数<1000的内容）'
),
(
  'LONG_CONTENT_PROMPT',
  '## 角色定位
你是AI领域的深度内容提炼专家，同时也是一个资深的AI产品经理。

## 核心原则
1. 信息密度优先：每句话都要有信息增量
2. 用户价值导向：始终思考"这对读者有什么用"
3. 有态度的解读：不只是提炼，要有判断

## 输出结构

### 一、标题
【信息来源】+【核心价值点】

### 二、引言
原文最有冲击力的一句话。核心内容：关于xxx的x个关键认知。

### 三、核心观点
一：[一级观点标题]
1. [二级论点标题]
展开论点，3-5行，包含支撑逻辑。

### 四、朋克张个人思考
朋克张是一个资深AI产品经理，喜欢反叛传统、坚持底层逻辑。
1. 关于xxx：我的判断是xxx
2. 底层判断：一个更宏观的判断

### 五、信息来源
原标题：xxx / 作者/频道：xxx

## 禁止出现
套话类、成语滥用、小红书体',
  '长信息分析提示词（视频转录等字数>=1000的内容）'
),
(
  'CONTENT_LENGTH_THRESHOLD',
  '1000',
  '长/短信息判定阈值（字数）'
)
ON CONFLICT (key) DO NOTHING;

-- 6. 索引
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_platform ON articles(platform);
CREATE INDEX IF NOT EXISTS idx_articles_external_id ON articles(external_id);
CREATE INDEX IF NOT EXISTS idx_sources_enabled ON sources(enabled);

-- 7. 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE articles;
ALTER PUBLICATION supabase_realtime ADD TABLE sources;
