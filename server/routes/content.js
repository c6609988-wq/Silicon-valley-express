// server/routes/content.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../db');

const CONTENT_TYPE_LABELS = {
  deep_analysis: '深度分析',
  investment_signal: '投资信号',
  product_signal: '产品信号',
  technical_insight: '技术洞察',
  news: '快讯',
  founder_note: '创始人观点',
  low_value: '',
  irrelevant: '',
};

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1, discard: 0 };

const SECTION_LABELS = [
  '核心内容提炼',
  '核心要点',
  '智能点评',
  '独家批注',
  '深度解读',
  '原文内容',
  '原文翻译',
  '中文翻译',
];

function cleanText(value = '') {
  return String(value)
    .replace(/\r\n/g, '\n')
    .replace(/\*\*/g, '')
    .replace(/^[-*]\s+/gm, '')
    .trim();
}

function isSectionHeading(line = '') {
  const heading = line
    .trim()
    .replace(/^#{1,6}\s*/, '')
    .replace(/^[一二三四五六七八九十\d]+[、.．]\s*/, '')
    .trim();

  return SECTION_LABELS.some(label => heading === label || heading.startsWith(`${label}：`) || heading.startsWith(`${label}:`));
}

function findSection(aiText = '', labels = []) {
  const lines = cleanText(aiText).split('\n');
  const start = lines.findIndex(line => {
    const normalized = line
      .trim()
      .replace(/^#{1,6}\s*/, '')
      .replace(/^[一二三四五六七八九十\d]+[、.．]\s*/, '')
      .trim();
    return labels.some(label => normalized === label || normalized.startsWith(`${label}：`) || normalized.startsWith(`${label}:`));
  });

  if (start < 0) return '';

  const body = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (isSectionHeading(lines[i])) break;
    body.push(lines[i]);
  }
  return cleanText(body.join('\n'));
}

function splitMeaningfulLines(text = '') {
  return cleanText(text)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

function parseChapters(aiText = '', raw = {}) {
  if (Array.isArray(raw.chapters) && raw.chapters.length > 0) return raw.chapters;

  const core = findSection(aiText, ['核心内容提炼', '核心要点']);
  const lines = splitMeaningfulLines(core);
  if (lines.length === 0) return [];

  const chapters = [];
  let current = null;

  lines.forEach((line) => {
    const normalized = line.replace(/^[-*\d.、\s]+/, '').trim();
    const explanation = normalized.match(/^说明[：:]\s*(.+)$/);
    if (explanation) {
      if (!current) {
        current = { id: String(chapters.length + 1), title: '核心要点', content: '', keyPoints: [] };
        chapters.push(current);
      }
      current.keyPoints.push(explanation[1].trim());
      return;
    }

    const titled = normalized.match(/^(.{2,48}?)[：:]\s*(.+)$/);
    if (titled) {
      current = {
        id: String(chapters.length + 1),
        title: titled[1].trim(),
        content: titled[2].trim(),
        keyPoints: [titled[2].trim()],
      };
      chapters.push(current);
      return;
    }

    if (!current) {
      current = { id: String(chapters.length + 1), title: '核心要点', content: '', keyPoints: [] };
      chapters.push(current);
    }
    current.keyPoints.push(normalized);
  });

  return chapters.map(chapter => ({
    ...chapter,
    content: chapter.content || chapter.keyPoints?.[0] || '',
  }));
}

function extractOneliner(aiText = '', raw = {}) {
  if (raw.aiOneliner) return cleanText(raw.aiOneliner);
  if (raw.summary) return cleanText(raw.summary);

  const core = findSection(aiText, ['核心内容提炼', '核心要点']);
  const firstLine = splitMeaningfulLines(core)[0] || splitMeaningfulLines(aiText)[0] || '';
  return cleanText(firstLine.replace(/^[-*\d.、\s]+/, ''));
}

function extractComment(aiText = '', raw = {}) {
  if (raw.aiComment) return cleanText(raw.aiComment);
  return findSection(aiText, ['智能点评', '独家批注', '深度解读']);
}

function extractChineseContent(item, aiText = '') {
  const translated = cleanText(item.translated_content || '');
  if (translated) return translated;

  const originalSection = findSection(aiText, ['原文内容', '原文翻译', '中文翻译']);
  if (originalSection) return originalSection;

  return cleanText(aiText || item.original_content || '');
}

function normalizePlatform(platform = '') {
  if (platform === 'x') return 'twitter';
  if (platform === 'rss') return 'blog';
  return platform || 'twitter';
}

function platformIcon(platform = '') {
  if (platform === 'youtube') return 'YouTube';
  if (platform === 'blog' || platform === 'rss' || platform === 'website') return 'Blog';
  return 'X';
}

function dbRowToArticle(item) {
  const raw = item.raw_data || {};
  const aiText = item.ai_analysis || '';
  const platform = normalizePlatform(item.platform);
  const contentCategory = item.content_category || raw.content_type || '';
  const priority = item.priority || 'medium';
  const qualityScore = item.quality_score || raw.score || 0;
  const chapters = parseChapters(aiText, raw);
  const aiSummary = extractOneliner(aiText, raw);
  const aiComment = extractComment(aiText, raw);
  const bodyText = extractChineseContent(item, aiText);

  return {
    id: item.external_id || String(item.id),
    title: cleanText(item.title || raw.title || item.author_name || ''),
    summary: aiSummary || bodyText.slice(0, 120) || '',
    content: bodyText,
    originalContent: cleanText(item.original_content || raw.originalContent || ''),
    sourceName: cleanText(item.author_name || raw.sourceName || ''),
    sourceHandle: cleanText(item.author_handle || raw.sourceHandle || ''),
    sourceIcon: platformIcon(platform),
    sourceType: platform,
    publishTime: item.published_at || item.fetched_at,
    readTime: Math.max(1, Math.ceil((bodyText || aiText).length / 400)),
    isBookmarked: false,
    url: item.link || raw.url || '#',
    score: qualityScore,
    aiSummary,
    aiComment,
    chapters,
    contentCategory,
    contentTypeLabel: CONTENT_TYPE_LABELS[contentCategory] || '',
    priority,
    priorityWeight: PRIORITY_WEIGHT[priority] ?? 1,
    isHighlight: priority === 'high' && ['deep_analysis', 'investment_signal', 'product_signal'].includes(contentCategory),
  };
}

router.get('/', async (req, res) => {
  const { source_id, platform, page = 1, limit = 100, format } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));
  const offset = (pageNum - 1) * limitNum;

  let query = supabase
    .from('articles')
    .select('*', { count: 'exact' })
    .or('is_visible.is.null,is_visible.eq.true')
    .order('published_at', { ascending: false })
    .range(offset, offset + limitNum - 1);

  if (source_id) query = query.eq('source_id', source_id);
  if (platform) query = query.eq('platform', platform);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  if (format === 'articles') {
    const articles = (data || [])
      .map(dbRowToArticle)
      .sort((a, b) =>
        ((b.priorityWeight ?? 1) - (a.priorityWeight ?? 1)) ||
        ((b.score ?? 0) - (a.score ?? 0)) ||
        (new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime())
      );

    return res.json({ articles, total: count || articles.length });
  }

  res.json({ items: data || [], total: count, page: pageNum, limit: limitNum });
});

module.exports = router;
