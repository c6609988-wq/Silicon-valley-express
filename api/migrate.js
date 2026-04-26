// api/migrate.js — 执行数据库迁移（AI Filter Pipeline 新字段 + discarded_items 表）
//
// 用法：
//   GET  /api/migrate?dry_run=1           → 返回待执行的 SQL（不执行）
//   POST /api/migrate                     → 执行迁移（需要 CRON_SECRET 鉴权）
//
// 执行方式（按优先级尝试）：
//   1. Supabase Management API（需要 SUPABASE_PROJECT_REF + SUPABASE_ACCESS_TOKEN）
//   2. 返回 SQL，提示用户手动在 Supabase Console 执行
//
// 幂等设计：使用 ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS，可安全多次调用
const axios = require('axios');

const MIGRATIONS = [
  // ── articles 新增评分字段 ────────────────────────────────
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS quality_score     INTEGER`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS ai_relevance      INTEGER`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS information_gain  INTEGER`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS decision_value    INTEGER`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS completeness      INTEGER`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS readability       INTEGER`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_category  TEXT`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS priority          TEXT DEFAULT 'medium'`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS filter_reason     TEXT`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_visible        BOOLEAN DEFAULT true`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS evaluation        JSONB`,
  // ── articles 索引 ────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_articles_priority         ON articles(priority)`,
  `CREATE INDEX IF NOT EXISTS idx_articles_content_category ON articles(content_category)`,
  `CREATE INDEX IF NOT EXISTS idx_articles_quality_score    ON articles(quality_score DESC NULLS LAST)`,
  `CREATE INDEX IF NOT EXISTS idx_articles_is_visible       ON articles(is_visible)`,
  // ── discarded_items 表 ───────────────────────────────────
  `CREATE TABLE IF NOT EXISTS discarded_items (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id        TEXT,
    platform         TEXT,
    external_id      TEXT,
    author_name      TEXT,
    author_handle    TEXT,
    title            TEXT,
    original_content TEXT,
    link             TEXT,
    stage            TEXT,
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
  )`,
  `CREATE INDEX IF NOT EXISTS idx_discarded_items_source_id    ON discarded_items(source_id)`,
  `CREATE INDEX IF NOT EXISTS idx_discarded_items_discarded_at ON discarded_items(discarded_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_discarded_items_total_score  ON discarded_items(total_score DESC NULLS LAST)`,
  `CREATE INDEX IF NOT EXISTS idx_discarded_items_external_id  ON discarded_items(external_id)`,
  `CREATE INDEX IF NOT EXISTS idx_discarded_items_stage        ON discarded_items(stage)`,
  // ── sources 扩展（可选） ─────────────────────────────────
  `ALTER TABLE sources ADD COLUMN IF NOT EXISTS source_profile       TEXT DEFAULT 'default'`,
  `ALTER TABLE sources ADD COLUMN IF NOT EXISTS noise_level          TEXT DEFAULT 'medium'`,
  `ALTER TABLE sources ADD COLUMN IF NOT EXISTS min_total_score      INTEGER`,
];

/**
 * 通过 Supabase Management API 执行单条 SQL
 * 需要环境变量：
 *   SUPABASE_PROJECT_REF   — 项目 ID（如 abcdefghijklmnop）
 *   SUPABASE_ACCESS_TOKEN  — 个人 Access Token（从 supabase.com/account/tokens 获取）
 */
async function execViaManagementAPI(sql) {
  const projectRef  = process.env.SUPABASE_PROJECT_REF;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!projectRef || !accessToken) throw new Error('缺少 SUPABASE_PROJECT_REF 或 SUPABASE_ACCESS_TOKEN');

  const res = await axios.post(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    { query: sql },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );
  return res.data;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 鉴权
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized — 请在 Authorization 头传入 Bearer <CRON_SECRET>' });
  }

  // dry_run=1 → 只返回 SQL，不执行
  if (req.query.dry_run === '1' || req.method === 'GET') {
    return res.json({
      mode: 'dry_run',
      total: MIGRATIONS.length,
      sql_to_run: MIGRATIONS.join(';\n\n') + ';',
      instructions: [
        '1. 登录 Supabase 控制台: https://supabase.com/dashboard',
        '2. 进入你的项目 → SQL Editor',
        '3. 粘贴上面的 sql_to_run 内容并执行',
        '4. 或者设置 SUPABASE_PROJECT_REF + SUPABASE_ACCESS_TOKEN 环境变量后，POST /api/migrate 自动执行',
      ],
    });
  }

  // POST → 执行迁移
  const canUseAPI = !!(process.env.SUPABASE_PROJECT_REF && process.env.SUPABASE_ACCESS_TOKEN);

  if (!canUseAPI) {
    // 无法自动执行，返回 SQL 供手动粘贴
    return res.json({
      success: false,
      mode: 'manual_required',
      message: '未配置 SUPABASE_PROJECT_REF + SUPABASE_ACCESS_TOKEN，无法自动执行迁移。请手动在 Supabase Console SQL Editor 中执行以下 SQL：',
      sql_to_run: MIGRATIONS.join(';\n\n') + ';',
      instructions: [
        '1. 登录 https://supabase.com/dashboard → 你的项目 → SQL Editor',
        '2. 粘贴 sql_to_run 内容并点击 Run',
        '3. 无报错即完成迁移',
        '（可选）设置以下 Vercel 环境变量后可自动化执行：',
        '  SUPABASE_PROJECT_REF  → 项目设置 → General → Reference ID',
        '  SUPABASE_ACCESS_TOKEN → supabase.com/account/tokens → Generate new token',
      ],
    });
  }

  console.log('[Migrate] 开始通过 Management API 执行迁移...');
  const results = [];
  let success = 0, failed = 0;

  for (const sql of MIGRATIONS) {
    const shortLabel = sql.trim().slice(0, 70).replace(/\s+/g, ' ');
    try {
      await execViaManagementAPI(sql);
      results.push({ ok: true, sql: shortLabel });
      success++;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || String(err);
      // sources 表不存在时视为正常（可选表）
      if (msg.toLowerCase().includes('sources') && msg.includes('does not exist')) {
        results.push({ ok: true, sql: shortLabel, note: 'sources 表不存在，已跳过' });
        success++;
        continue;
      }
      // "already exists" 类错误视为成功（已迁移）
      if (msg.includes('already exists')) {
        results.push({ ok: true, sql: shortLabel, note: '已存在，跳过' });
        success++;
        continue;
      }
      console.error(`[Migrate] 失败: ${shortLabel} — ${msg}`);
      results.push({ ok: false, sql: shortLabel, error: msg });
      failed++;
    }
  }

  console.log(`[Migrate] 完成: ${success} 成功, ${failed} 失败`);
  res.json({
    success: failed === 0,
    total: MIGRATIONS.length,
    ok: success,
    failed,
    results,
    note: failed === 0
      ? '✅ 迁移完成！discarded_items 表和 articles 评分字段均已就绪。'
      : `⚠️ ${failed} 条迁移失败，请检查 results 中的错误信息，或手动在 Supabase Console 执行 sql_to_run。`,
    sql_to_run: failed > 0 ? (MIGRATIONS.join(';\n\n') + ';') : undefined,
  });
};
