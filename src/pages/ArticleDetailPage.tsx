import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  Bookmark,
  Share2,
  FileText,
  AlignLeft,
  Sparkles,
  Languages,
  Loader2,
} from 'lucide-react';
import { Article } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/apiBase';
import { PlatformIcon as PlatformIconShared, platformLabel } from '@/components/common/PlatformIcon';
import { extractHeadline } from '@/lib/utils';

const SERVER_URL = API_BASE;

function PlatformIconEl({ type, size = 14, color = '#111' }: { type: string; size?: number; color?: string }) {
  return <PlatformIconShared type={type} size={size} color={color} />;
}

// ── 区块标题行 ─────────────────────────────────────────────
function SectionHeader({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{label}</span>
    </div>
  );
}

// ── 编号徽章 ──────────────────────────────────────────────
function NumBadge({ n }: { n: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 20, height: 20, borderRadius: '50%',
      background: '#1A73E8', color: '#fff',
      fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
    }}>{n}</span>
  );
}

// ══════════════════════════════════════════════════════════
// 解析器 v5 — 兼容新旧两种 ai_analysis 格式
//
// 新格式（prompt v2，### 一/二/三/四 结构）：
//   ### 一、摘要
//   ### 二、核心内容提炼  → 事件行 + 说明：行 → 合并为一条 keyPoint
//   ### 三、智能点评
//   ### 四、原文内容       → 📎 中文翻译：... / 📎 原文：...
//
// 旧格式（prompt v1，无 ### 标题）：
//   核心要点 / 深度解读 / 原文翻译
// ══════════════════════════════════════════════════════════

/** 判断是否为新格式（含 ### 一、摘要） */
function isNewFormat(text: string): boolean {
  return /###\s*[一二三四]/.test(text);
}

/** ── 新格式：短推文解析器 ──────────────────────────────────
 *  提取 ### 二、核心内容提炼 中的"事件行 + 说明：行"，
 *  合并为一条 keyPoint："事件行\n说明：..."
 */
function parseShortAnalysis(aiText: string) {
  // ① 摘要
  const summaryMatch = aiText.match(/###\s*一[、.]\s*摘要\s*\n([\s\S]*?)(?=\n###\s*[二三四]|$)/);
  const aiOneliner   = summaryMatch?.[1]?.trim().replace(/\*\*/g, '') || '';

  // ② 核心内容提炼 → 合并事件行 + 说明行
  const pointsMatch  = aiText.match(/###\s*二[、.]\s*核心内容提炼\s*\n([\s\S]*?)(?=\n###\s*[三四]|$)/);
  const keyPoints: string[] = [];
  if (pointsMatch?.[1]) {
    const lines = pointsMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].replace(/\*\*/g, '');
      // 跳过纯说明行（以"说明："开头，前面没有事件行时孤立出现，直接跳过）
      if (/^说明[：:]/.test(line)) { i++; continue; }
      // 事件行：下一行可能是说明行
      const nextLine = lines[i + 1]?.replace(/\*\*/g, '') || '';
      if (/^说明[：:]/.test(nextLine)) {
        // 合并：事件行 + 说明内容（去掉"说明："前缀）
        const explanation = nextLine.replace(/^说明[：:]\s*/, '');
        keyPoints.push(`${line}\n说明：${explanation}`);
        i += 2;
      } else {
        keyPoints.push(line);
        i++;
      }
    }
  }

  // ③ 智能点评
  const commentMatch = aiText.match(/###\s*三[、.]\s*智能点评\s*\n([\s\S]*?)(?=\n###\s*四|$)/);
  const aiComment    = commentMatch?.[1]?.trim().replace(/\*\*/g, '') || '';

  // ④ 原文内容 → 提取中文翻译作为 chineseContent
  const rawSection   = aiText.match(/###\s*四[、.]\s*原文内容\s*\n([\s\S]*?)$/)?.[1]?.trim() || '';
  const cnMatch      = rawSection.match(/📎\s*中文翻译[：:]\s*([\s\S]*?)(?=\n📎\s*原文[：:]|$)/);
  const chineseContent = cnMatch?.[1]?.trim().replace(/\/\//g, '\n\n') || rawSection;

  if (!aiOneliner && !aiComment && keyPoints.length === 0) return null;

  const keyPointChapters = keyPoints.length > 0
    ? [{ id: '1', title: '核心内容提炼', content: '', keyPoints }]
    : [];

  return { aiOneliner, aiComment, chineseContent, keyPointChapters };
}

/** ── 新格式：长文章解析器 ─────────────────────────────────
 *  ### 二、核心内容提炼 内按 #### N. 切章节，
 *  每章节内按 **标题**\n内容 提取子要点
 */
function parseLongAnalysis(aiText: string) {
  // ① 摘要
  const summaryMatch = aiText.match(/###\s*一[、.]\s*摘要\s*\n([\s\S]*?)(?=\n###\s*[二三四]|$)/);
  const aiOneliner   = summaryMatch?.[1]?.trim().replace(/\*\*/g, '') || '';

  // ② 核心内容提炼 → 按 #### N. 切章节
  const pointsBlock  = aiText.match(/###\s*二[、.]\s*核心内容提炼\s*\n([\s\S]*?)(?=\n###\s*[三四]|$)/)?.[1] || '';
  const chapters: Array<{ id: string; title: string; content: string; keyPoints: string[] }> = [];

  if (pointsBlock) {
    // 按 #### 分割各章节
    const chapterBlocks = pointsBlock.split(/\n(?=####\s)/);
    chapterBlocks.forEach((block, idx) => {
      const titleMatch = block.match(/^####\s*\d+[.、]?\s*(.+)/);
      const title = titleMatch?.[1]?.replace(/\*\*/g, '').trim() || `要点 ${idx + 1}`;
      // 从章节内容中提取 **子标题** + 正文 对
      const subPoints: string[] = [];
      const subBlocks = block.replace(/^####[^\n]+\n/, '').split(/\n(?=\*\*)/);
      subBlocks.forEach(sub => {
        const subTitle = sub.match(/^\*\*(.+?)\*\*/)?.[1]?.trim() || '';
        const subBody  = sub.replace(/^\*\*.+?\*\*\n?/, '').trim().replace(/\*\*/g, '');
        if (subTitle && subBody) subPoints.push(`${subTitle}：${subBody}`);
        else if (subBody) subPoints.push(subBody);
      });
      if (subPoints.length > 0 || title) {
        chapters.push({ id: String(idx + 1), title, content: '', keyPoints: subPoints });
      }
    });
  }

  // 没有 #### 章节时退回 parseShortAnalysis 逻辑
  if (chapters.length === 0) return parseShortAnalysis(aiText);

  // ③ 智能点评
  const commentMatch = aiText.match(/###\s*三[、.]\s*智能点评\s*\n([\s\S]*?)(?=\n###\s*四|$)/);
  const aiComment    = commentMatch?.[1]?.trim().replace(/\*\*/g, '') || '';

  // ④ 原文内容
  const rawSection     = aiText.match(/###\s*四[、.]\s*原文内容\s*\n([\s\S]*?)$/)?.[1]?.trim() || '';
  const cnMatch        = rawSection.match(/📎\s*中文翻译[：:]\s*([\s\S]*?)(?=\n📎\s*原文[：:]|$)/);
  const chineseContent = cnMatch?.[1]?.trim().replace(/\/\//g, '\n\n') || rawSection;

  return { aiOneliner, aiComment, chineseContent, keyPointChapters: chapters };
}

/** ── 旧格式兜底解析器（核心要点/深度解读/原文翻译）─────── */
function parseLegacyAnalysis(aiText: string) {
  const keypointsMatch   = aiText.match(/核心要点\s*\n([\s\S]*?)(?=\n\n?深度解读|\n\n?原文翻译|$)/);
  const commentMatch     = aiText.match(/深度解读\s*\n([\s\S]*?)(?=\n\n?原文翻译|$)/);
  const translationMatch = aiText.match(/原文翻译\s*\n([\s\S]*?)$/);

  if (!keypointsMatch && !commentMatch) return null;

  const rawOneliner = keypointsMatch?.[1]?.trim().split('\n')[0]?.trim().replace(/\*\*/g, '') || '';
  const aiOneliner  = rawOneliner && /[一-鿿]/.test(rawOneliner) ? rawOneliner : '';
  const aiComment   = commentMatch?.[1]?.trim().replace(/\*\*/g, '') || '';
  const translationSection = translationMatch?.[1]?.trim() || '';

  const keyPointLines: string[] = [];
  if (translationSection) {
    translationSection.split(/\n---+\n?/).forEach(block => {
      const m = block.match(/翻译[：:]\s*([\s\S]+?)(?=\n原文:|$)/);
      if (m && m[1].trim().length > 5) keyPointLines.push(m[1].trim());
    });
  }

  const chineseContent = keyPointLines.length > 0 ? keyPointLines.join('\n\n') : translationSection;
  const keyPointChapters = keyPointLines.length > 0
    ? [{ id: '1', title: '核心内容提炼', content: '', keyPoints: keyPointLines }]
    : [];

  return { aiOneliner, aiComment, chineseContent, keyPointChapters };
}

/** ── 统一入口：自动判断格式并分发 ──────────────────────── */
function parseAiAnalysis(aiText: string, contentType?: string) {
  if (!aiText || aiText.length < 30) return null;
  if (!isNewFormat(aiText)) return parseLegacyAnalysis(aiText);
  // 新格式：content_type='long' 用长文解析，其余用短推文解析
  return contentType === 'long' ? parseLongAnalysis(aiText) : parseShortAnalysis(aiText);
}

// ── 主页面 ────────────────────────────────────────────────
const ArticleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showChinese, setShowChinese] = useState(true);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const cached = sessionStorage.getItem(`article_${id}`);
    if (cached) {
      try { setArticle(JSON.parse(cached)); setLoading(false); return; }
      catch (e) { /* fall through */ }
    }
    fetch(`${SERVER_URL}/api/content?source_id=${id}&limit=1`)
      .then(r => { if (!r.ok) throw new Error('文章未找到'); return r.json(); })
      .then(data => {
        const item = data.items?.[0];
        if (!item) throw new Error('文章未找到');
        const parsed = parseAiAnalysis(item.ai_analysis || '', item.content_type);
        const aiOneliner = parsed?.aiOneliner || '';
        const aiComment  = parsed?.aiComment  || '';
        // 中文展示内容：优先解析翻译段，其次 translated_content，最后原文
        const chineseContent = parsed?.chineseContent
          || (item.translated_content && item.translated_content !== item.original_content
              ? item.translated_content
              : '')
          || item.original_content || '';
        setArticle({
          id: item.external_id || item.id,
          title: item.title || item.author_name,
          summary: aiOneliner || '',
          content: chineseContent,
          originalContent: item.original_content || '',
          sourceName: item.author_name,
          sourceHandle: item.author_handle,
          sourceType: item.platform,
          sourceIcon: '',
          publishTime: item.published_at,
          readTime: Math.max(1, Math.ceil((item.ai_analysis || '').length / 400)),
          isBookmarked: false,
          url: item.link || '#',
          aiSummary: aiOneliner,    // 蓝色加粗：核心要点一句话
          aiComment:  aiComment,    // 智能点评：深度解读段
          chapters: parsed?.keyPointChapters || [],
        });
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({ title: isBookmarked ? '已取消收藏' : '已收藏', duration: 1000 });
  };
  const handleShare = () => {
    if (navigator.share && article) {
      navigator.share({ title: article.title, url: article.url });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: '链接已复制' });
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 430, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: 32, height: 32, color: '#1A73E8', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: '#999' }}>加载中…</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 430, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#999' }}>{error || '文章未找到'}</p>
          <Button variant="ghost" onClick={() => navigate('/')} style={{ marginTop: 16 }}>返回首页</Button>
        </div>
      </div>
    );
  }

  const publishDate = new Date(article.publishTime);
  const dateStr = `${publishDate.getMonth() + 1}月${publishDate.getDate()}日`;
  const label = platformLabel[article.sourceType] || article.sourceType || 'Web';
  const handle = article.sourceHandle
    ? (article.sourceHandle.startsWith('@') ? article.sourceHandle : `@${article.sourceHandle}`)
    : `@${article.sourceName?.toLowerCase().replace(/\s/g, '')}`;

  // 结构化数据
  let keyPoints = article.chapters?.flatMap(ch => ch.keyPoints || []) || [];
  const rawBody = article.content || article.originalContent || '';

  // 当无 AI 要点时，从原文段落自动提取（每段非空行作为一个要点）
  if (keyPoints.length === 0 && rawBody) {
    keyPoints = rawBody
      .split(/\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 15 && !s.startsWith('http'))
      .slice(0, 5);
  }

  const summaryText = article.aiSummary || article.summary || rawBody.slice(0, 120);
  const hasSummary = !!summaryText;
  const hasKeyPoints = keyPoints.length > 0;
  const hasComment = !!article.aiComment;

  // 智能点评：优先用 aiComment（深度解读段），其次从正文兜底
  const smartCommentText = article.aiComment && article.aiComment.length > 20
    ? article.aiComment
    : (() => {
        const paras = rawBody.split(/\n+/).map((s: string) => s.trim()).filter((s: string) => s.length > 20);
        if (paras.length > 1) return paras[paras.length - 1];
        if (paras.length === 1 && paras[0] !== summaryText) return paras[0];
        return '';
      })();
  const hasSmartComment = !!smartCommentText;

  const displayContent = showChinese ? article.content : (article.originalContent || article.content);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', background: '#F5F7FA', maxWidth: 430, margin: '0 auto' }}
    >
      {/* ── 顶部导航栏 ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,247,250,0.95)',
        backdropFilter: 'blur(8px)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <motion.button onClick={() => navigate('/')} whileTap={{ scale: 0.9 }}
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #EAEAEA', borderRadius: '50%' }}>
          <ArrowLeft style={{ width: 18, height: 18, color: '#333' }} />
        </motion.button>
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button onClick={handleBookmark} whileTap={{ scale: 0.9 }}
            style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #EAEAEA', borderRadius: '50%' }}>
            <Bookmark style={{ width: 18, height: 18, color: isBookmarked ? '#F59E0B' : '#333', fill: isBookmarked ? '#F59E0B' : 'none' }} />
          </motion.button>
          <motion.button onClick={handleShare} whileTap={{ scale: 0.9 }}
            style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #EAEAEA', borderRadius: '50%' }}>
            <Share2 style={{ width: 18, height: 18, color: '#333' }} />
          </motion.button>
        </div>
      </div>

      <div style={{ padding: '4px 16px 32px' }}>

        {/* ── 来源标签 + 日期 ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 8 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#EBF3FF', border: '1px solid #C7DEFF',
            borderRadius: 8, padding: '3px 8px', height: 26,
          }}>
            <PlatformIconEl type={article.sourceType} size={12} color="#1A73E8" />
            <span style={{ fontSize: 12, color: '#1A73E8', fontWeight: 500 }}>{label}</span>
          </div>
          <span style={{ fontSize: 13, color: '#999' }}>{dateStr}</span>
        </div>

        {/* ── 文章标题 ── */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', lineHeight: 1.35, margin: '0 0 20px' }}>
          {article.aiSummary
            ? extractHeadline(article.aiSummary)
            : article.summary
              ? extractHeadline(article.summary)
              : article.title}
        </h1>

        {/* ── 作者信息行 ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: '#EAEDF2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <PlatformIconEl type={article.sourceType} size={18} color="#555" />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111', margin: 0 }}>{article.sourceName}</p>
            <p style={{ fontSize: 13, color: '#999', margin: 0 }}>{handle}</p>
          </div>
        </div>

        <div style={{ height: 1, background: '#EBEBEB', marginBottom: 20 }} />

        {/* ══════════════════════════════════════════
            区块一：摘要
        ══════════════════════════════════════════ */}
        {hasSummary && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader
              icon={<FileText style={{ width: 15, height: 15, color: '#3B82F6' }} />}
              label="摘要"
              color="#3B82F6"
            />
            <p style={{ fontSize: 15, color: '#1A73E8', fontWeight: 700, lineHeight: 1.75, margin: 0 }}>
              {summaryText.replace(/\*\*/g, '')}
            </p>
          </div>
        )}

        {hasSummary && (hasKeyPoints || hasComment) && (
          <div style={{ height: 1, background: '#EBEBEB', marginBottom: 24 }} />
        )}

        {/* ══════════════════════════════════════════
            区块二：要点提炼
        ══════════════════════════════════════════ */}
        {hasKeyPoints && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader
              icon={<AlignLeft style={{ width: 15, height: 15, color: '#1A73E8' }} />}
              label="核心内容提炼"
              color="#1A73E8"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {keyPoints.map((point, i) => {
                const clean = point.replace(/\*\*/g, '');
                const colonIdx = clean.indexOf('：');
                const label_ = colonIdx !== -1 ? clean.slice(0, colonIdx + 1) : clean;
                const detail = colonIdx !== -1 ? clean.slice(colonIdx + 1) : '';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <NumBadge n={i + 1} />
                    <span style={{ fontSize: 14, color: '#333', lineHeight: 1.65 }}>
                      {colonIdx !== -1 ? (
                        <><span style={{ fontWeight: 600 }}>{label_}</span>{detail}</>
                      ) : clean}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            区块三：智能点评（紫色亮色卡片）
        ══════════════════════════════════════════ */}
        {hasSmartComment && (
          <>
            {hasKeyPoints && (
              <div style={{ height: 1, background: '#EBEBEB', marginBottom: 24 }} />
            )}
            <div style={{
              background: '#F5F3FF',
              border: '1px solid #DDD6FE',
              borderRadius: 16,
              padding: '16px 18px',
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <Sparkles style={{ width: 15, height: 15, color: '#7C3AED' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#7C3AED' }}>智能点评</span>
              </div>
              <p style={{ fontSize: 14, color: '#4C4464', lineHeight: 1.8, margin: 0 }}>
                {smartCommentText.replace(/\*\*/g, '')}
              </p>
            </div>
          </>
        )}

        {(hasSummary || hasKeyPoints || hasSmartComment) && (
          <div style={{ height: 1, background: '#EBEBEB', marginBottom: 24 }} />
        )}

        {/* ══════════════════════════════════════════
            区块四：原文内容
        ══════════════════════════════════════════ */}
        <div>
          {/* 标题行 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlatformIconEl type={article.sourceType} size={16} color="#111" />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>原文内容</span>
            </div>
            {article.url && article.url !== '#' && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open(article.url, '_blank')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', border: '1px solid #DDD',
                  borderRadius: 20, background: '#fff',
                  fontSize: 12, color: '#666', cursor: 'pointer',
                }}
              >
                <ExternalLink style={{ width: 12, height: 12 }} />
                查看原文
              </motion.button>
            )}
          </div>

          {/* 语言切换 Tab */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { key: true, label: '中文翻译', icon: true },
              { key: false, label: '原文', icon: false },
            ].map(({ key, label: tabLabel, icon }) => (
              <button
                key={String(key)}
                onClick={() => setShowChinese(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 20, border: 'none',
                  background: showChinese === key ? '#1A73E8' : '#EBEBEB',
                  color: showChinese === key ? '#fff' : '#666',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {icon && <Languages style={{ width: 14, height: 14 }} />}
                {tabLabel}
              </button>
            ))}
          </div>

          {/* 正文卡片 */}
          <div style={{
            background: '#EEF3FF',
            borderRadius: 16,
            padding: '18px 20px',
          }}>
            {/* 作者 + 时间行 */}
            <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
              {article.sourceName}
              {handle && <span style={{ marginLeft: 4 }}>{handle}</span>}
              {article.publishTime && (
                <span style={{ marginLeft: 8 }}>
                  · {new Date(article.publishTime).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }).replace('/', '月') + '日'}
                </span>
              )}
            </div>
            <p style={{ fontSize: 15, color: '#333', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
              {displayContent || '（暂无内容）'}
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default ArticleDetailPage;
