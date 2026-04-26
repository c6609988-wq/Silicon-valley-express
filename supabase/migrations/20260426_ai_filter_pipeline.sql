-- ============================================================
-- AI Info Filter Pipeline: 数据库改造
-- 执行方式：在 Supabase 控制台 SQL Editor 中直接运行
-- ============================================================

-- ── 1. articles 表新增评分字段 ─────────────────────────────────
-- 如果字段已存在，以下 ALTER 会报 "column already exists" 错误，可忽略

ALTER TABLE articles ADD COLUMN IF NOT EXISTS quality_score     INTEGER;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS ai_relevance      INTEGER;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS information_gain  INTEGER;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS decision_value    INTEGER;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS completeness      INTEGER;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS readability       INTEGER;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_category  TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS priority          TEXT DEFAULT 'medium';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS filter_reason     TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_visible        BOOLEAN DEFAULT true;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS evaluation        JSONB;

-- 为新字段建索引（提升前端按优先级/分类查询性能）
CREATE INDEX IF NOT EXISTS idx_articles_priority         ON articles(priority);
CREATE INDEX IF NOT EXISTS idx_articles_content_category ON articles(content_category);
CREATE INDEX IF NOT EXISTS idx_articles_quality_score    ON articles(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_articles_is_visible       ON articles(is_visible);

-- ── 2. 新建 discarded_items 表 ────────────────────────────────
CREATE TABLE IF NOT EXISTS discarded_items (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id        TEXT,
  platform         TEXT,
  external_id      TEXT,
  author_name      TEXT,
  author_handle    TEXT,
  title            TEXT,
  original_content TEXT,
  link             TEXT,
  stage            TEXT,          -- 'rule_prefilter' | 'ai_value_scoring'
  total_score      INTEGER,
  ai_relevance     INTEGER,
  information_gain INTEGER,
  decision_value   INTEGER,
  completeness     INTEGER,
  readability      INTEGER,
  content_category TEXT,
  priority         TEXT,
  filter_reason    TEXT,
  raw_evaluation   JSONB,
  raw_data         JSONB,
  published_at     TIMESTAMPTZ,
  discarded_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discarded_items_source_id    ON discarded_items(source_id);
CREATE INDEX IF NOT EXISTS idx_discarded_items_discarded_at ON discarded_items(discarded_at DESC);
CREATE INDEX IF NOT EXISTS idx_discarded_items_total_score  ON discarded_items(total_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_discarded_items_external_id  ON discarded_items(external_id);
CREATE INDEX IF NOT EXISTS idx_discarded_items_stage        ON discarded_items(stage);

-- ── 3. sources 表扩展（如果 sources 表存在）──────────────────
-- 用于未来在管理界面为每个 source 配置自定义过滤强度
ALTER TABLE sources ADD COLUMN IF NOT EXISTS source_profile    TEXT DEFAULT 'default';
ALTER TABLE sources ADD COLUMN IF NOT EXISTS noise_level       TEXT DEFAULT 'medium';
ALTER TABLE sources ADD COLUMN IF NOT EXISTS min_total_score   INTEGER;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS min_ai_relevance  INTEGER;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS min_information_gain INTEGER;
