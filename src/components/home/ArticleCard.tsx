import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Article } from '@/types';
import { PlatformIcon, platformLabel } from '@/components/common/PlatformIcon';
import { extractHeadline } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
  index?: number;
}

// content_type → 徽章样式
const CATEGORY_BADGE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  deep_analysis:     { label: '深度分析', bg: '#FFF3E0', color: '#E65100', border: '#FFCC80' },
  investment_signal: { label: '投资信号', bg: '#E8F5E9', color: '#1B5E20', border: '#A5D6A7' },
  product_signal:    { label: '产品信号', bg: '#E3F2FD', color: '#0D47A1', border: '#90CAF9' },
  technical_insight: { label: '技术洞察', bg: '#F3E5F5', color: '#4A148C', border: '#CE93D8' },
  news:              { label: '快讯',   bg: '#F5F5F5', color: '#616161', border: '#E0E0E0' },
  founder_note:      { label: '创始人',  bg: '#FFF9C4', color: '#F57F17', border: '#FFF176' },
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
            <PlatformIcon type={article.sourceType} size={12} color="#1A73E8" />
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
