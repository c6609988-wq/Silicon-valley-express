import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Article } from '@/types';

interface ArticleCardProps {
  article: Article;
  index?: number;
}

// 平台图标
const PlatformIcon = ({ type }: { type: string }) => {
  if (type === 'twitter' || type === 'x') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="#1A73E8" style={{ borderRadius: 2, flexShrink: 0 }}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (type === 'youtube') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="#1A73E8" style={{ borderRadius: 2, flexShrink: 0 }}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#1A73E8" style={{ borderRadius: 2, flexShrink: 0 }}>
      <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
    </svg>
  );
};

const platformLabel: Record<string, string> = {
  twitter: 'Twitter', x: 'Twitter', youtube: 'YouTube',
  rss: 'RSS', blog: 'Blog', wechat: '微信', website: 'Web', podcast: 'Podcast',
};

// content_type → 徽章样式
const CATEGORY_BADGE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  deep_analysis:     { label: '深度分析', bg: '#FFF3E0', color: '#E65100', border: '#FFCC80' },
  investment_signal: { label: '投资信号', bg: '#E8F5E9', color: '#1B5E20', border: '#A5D6A7' },
  product_signal:    { label: '产品信号', bg: '#E3F2FD', color: '#0D47A1', border: '#90CAF9' },
  technical_insight: { label: '技术洞察', bg: '#F3E5F5', color: '#4A148C', border: '#CE93D8' },
  news:              { label: '快讯',   bg: '#F5F5F5', color: '#616161', border: '#E0E0E0' },
  founder_note:      { label: '创始人',  bg: '#FFF9C4', color: '#F57F17', border: '#FFF176' },
};

// summary ≤20字全部保留；>20字在15-20字范围内找自然标点断句，找不到则截取20字
const extractHeadline = (text: string): string => {
  if (!text) return '';
  if (text.length <= 20) return text;
  const match = text.match(/^[\s\S]{15,20}?[，。！？；、]/);
  if (match) return match[0];
  return text.slice(0, 20) + '…';
};

const getArticleHeadline = (article: Article): string => {
  if (article.aiSummary) return extractHeadline(article.aiSummary);
  if (article.summary) return extractHeadline(article.summary);
  return article.title;
};

const ArticleCard = ({ article, index = 0 }: ArticleCardProps) => {
  const navigate = useNavigate();

  const label  = platformLabel[article.sourceType] || article.sourceType || 'Web';
  const dateStr = article.publishTime
    ? new Date(article.publishTime).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }).replace('/', '月') + '日'
    : '';

  const badge      = article.contentCategory ? CATEGORY_BADGE[article.contentCategory] : null;
  const isHighlight = article.isHighlight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => {
        sessionStorage.setItem(`article_${article.id}`, JSON.stringify(article));
        navigate(`/article/${article.id}`);
      }}
      style={{
        background:  isHighlight ? 'linear-gradient(135deg, #FFFDF5 0%, #FFF8ED 100%)' : '#FFFFFF',
        border:      isHighlight ? '1.5px solid #FFD666' : '1px solid #EAEAEA',
        borderRadius: 16,
        boxShadow:   isHighlight
          ? '0 2px 12px rgba(255,180,0,0.15)'
          : '0 1px 4px rgba(0,0,0,0.05)',
        padding:  '18px 20px',
        cursor:   'pointer',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
      }}
    >
      {/* 高优先级角标 */}
      {isHighlight && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          fontSize: 10, color: '#E65100', fontWeight: 700,
          background: '#FFF3E0', border: '1px solid #FFCC80',
          borderRadius: 6, padding: '2px 6px', letterSpacing: 0.5,
        }}>
          ★ 重点
        </div>
      )}

      {/* Meta 行 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexWrap: 'wrap' }}>
          {/* 平台标签 */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#EBF3FF', border: '1px solid #C7DEFF',
            borderRadius: 8, padding: '3px 8px', height: 26, flexShrink: 0,
          }}>
            <PlatformIcon type={article.sourceType} />
            <span style={{ fontSize: 12, color: '#1A73E8', fontWeight: 500, lineHeight: 1 }}>{label}</span>
          </div>

          {/* 内容分类徽章 */}
          {badge && (
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              background: badge.bg, border: `1px solid ${badge.border}`,
              borderRadius: 8, padding: '3px 8px', height: 26, flexShrink: 0,
            }}>
              <span style={{ fontSize: 12, color: badge.color, fontWeight: 500, lineHeight: 1 }}>{badge.label}</span>
            </div>
          )}

          {/* 作者名 */}
          <span style={{ fontSize: 13, color: '#333', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>
            {article.sourceName}
          </span>
          {article.sourceHandle && (
            <span style={{ fontSize: 12, color: '#999', whiteSpace: 'nowrap' }}>
              @{article.sourceHandle.replace('@', '')}
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: '#999', flexShrink: 0, marginLeft: 8 }}>{dateStr}</span>
      </div>

      {/* 标题 */}
      <h3 style={{
        fontSize: 16, fontWeight: 700, color: '#111', lineHeight: 1.4,
        margin: '0 0 8px',
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {getArticleHeadline(article)}
      </h3>

      {/* 摘要 */}
      <p style={{
        fontSize: 13, color: '#666', lineHeight: 1.65, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {article.summary}
      </p>

      {/* 底栏 */}
      <div style={{ borderTop: '1px solid #F0F0F0', marginTop: 14, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⏱</span>{article.readTime} 分钟阅读
          </span>
          {/* 质量分（仅高分时显示） */}
          {(article.score ?? 0) >= 75 && (
            <span style={{ fontSize: 11, color: '#888', background: '#F5F5F5', borderRadius: 6, padding: '1px 6px' }}>
              {article.score}分
            </span>
          )}
        </div>
        <span style={{ fontSize: 13, color: '#4A90E2', fontWeight: 500 }}>
          阅读详情 ›
        </span>
      </div>
    </motion.div>
  );
};

export default ArticleCard;
