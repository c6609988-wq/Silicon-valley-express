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
  MessageSquare,
  Sparkles,
  Languages,
  Loader2,
} from 'lucide-react';
import { Article } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/apiBase';

const SERVER_URL = API_BASE;

// ── 平台图标 SVG ──────────────────────────────────────────
const XIcon = ({ size = 14, color = '#111' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const YoutubeIcon = ({ size = 14, color = '#111' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const RssIcon = ({ size = 14, color = '#111' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
  </svg>
);

function PlatformIconEl({ type, size = 14, color = '#111' }: { type: string; size?: number; color?: string }) {
  if (type === 'twitter' || type === 'x') return <XIcon size={size} color={color} />;
  if (type === 'youtube') return <YoutubeIcon size={size} color={color} />;
  return <RssIcon size={size} color={color} />;
}

const platformLabel: Record<string, string> = {
  twitter: 'Twitter', x: 'Twitter',
  youtube: 'YouTube',
  rss: 'RSS', blog: 'Blog',
  wechat: '微信', website: 'Web', podcast: 'Podcast',
};

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
        setArticle({
          id: item.external_id || item.id,
          title: item.title || item.author_name,
          summary: item.ai_analysis?.slice(0, 100) || '',
          content: item.translated_content || item.ai_analysis || '',
          originalContent: item.original_content || '',
          sourceName: item.author_name,
          sourceHandle: item.author_handle,
          sourceType: item.platform,
          sourceIcon: '',
          publishTime: item.published_at,
          readTime: Math.max(1, Math.ceil((item.ai_analysis || '').length / 400)),
          isBookmarked: false,
          url: item.link || '#',
          aiSummary: item.ai_analysis?.slice(0, 200) || '',
          chapters: [],
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

  // 智能点评：优先用 aiSummary（若与 summary 不同），否则取正文最后一段作为 AI 视角
  const smartCommentText = (() => {
    if (article.aiSummary && article.aiSummary !== article.summary && article.aiSummary.length > 20) {
      return article.aiSummary;
    }
    // 从原文段落中取最后一段有内容的句子作为 AI 洞察
    const paras = rawBody.split(/\n+/).map(s => s.trim()).filter(s => s.length > 20);
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
          {article.title}
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
            <p style={{ fontSize: 15, color: '#444', lineHeight: 1.75, margin: 0 }}>
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

        {/* ══════════════════════════════════════════
            区块四：独家评论（橙色亮色卡片）
        ══════════════════════════════════════════ */}
        {hasComment && (
          <>
            {(hasKeyPoints || hasSmartComment) && (
              <div style={{ height: 1, background: '#EBEBEB', marginBottom: 24 }} />
            )}
            <div style={{
              background: '#FFF7ED',
              border: '1px solid #FED7AA',
              borderRadius: 16,
              padding: '16px 18px',
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <MessageSquare style={{ width: 15, height: 15, color: '#EA7316' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#EA7316' }}>独家评论</span>
              </div>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75, margin: 0 }}>
                {article.aiComment?.replace(/\*\*/g, '')}
              </p>
            </div>
          </>
        )}

        {(hasSummary || hasKeyPoints || hasSmartComment || hasComment) && (
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
