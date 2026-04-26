import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Article } from '@/types';

interface ArticleCardProps {
  article: Article;
  index?: number;
}

// 平台图标（黑色纯文字/SVG，14×14 区域内显示）
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
  // rss / blog / default
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#1A73E8" style={{ borderRadius: 2, flexShrink: 0 }}>
      <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
    </svg>
  );
};

// 平台标签名
const platformLabel: Record<string, string> = {
  twitter: 'Twitter',
  x: 'Twitter',
  youtube: 'YouTube',
  rss: 'RSS',
  blog: 'Blog',
  wechat: '微信',
  website: 'Web',
  podcast: 'Podcast',
};

const ArticleCard = ({ article, index = 0 }: ArticleCardProps) => {
  const navigate = useNavigate();

  const label = platformLabel[article.sourceType] || article.sourceType || 'Web';
  const dateStr = article.publishTime
    ? new Date(article.publishTime).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }).replace('/', '月') + '日'
    : '';

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
        background: '#FFFFFF',
        border: '1px solid #EAEAEA',
        borderRadius: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        padding: '18px 20px',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Meta 行 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        {/* 左侧：平台标签 + 作者名 + handle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {/* 平台来源标签 */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: '#EBF3FF',
            border: '1px solid #C7DEFF',
            borderRadius: 8,
            padding: '3px 8px',
            height: 26,
            flexShrink: 0,
          }}>
            <PlatformIcon type={article.sourceType} />
            <span style={{ fontSize: 12, color: '#1A73E8', fontWeight: 500, lineHeight: 1 }}>{label}</span>
          </div>
          {/* 作者名 */}
          <span style={{ fontSize: 13, color: '#333', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
            {article.sourceName}
          </span>
          {/* handle */}
          {article.sourceHandle && (
            <span style={{ fontSize: 12, color: '#999', fontWeight: 400, whiteSpace: 'nowrap' }}>
              @{article.sourceHandle.replace('@', '')}
            </span>
          )}
        </div>
        {/* 右侧：日期 */}
        <span style={{ fontSize: 12, color: '#999', fontWeight: 400, flexShrink: 0, marginLeft: 8 }}>
          {dateStr}
        </span>
      </div>

      {/* 标题 */}
      <h3 style={{
        fontSize: 16,
        fontWeight: 700,
        color: '#111',
        lineHeight: 1.4,
        margin: '0 0 8px',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {article.title}
      </h3>

      {/* 摘要 */}
      <p style={{
        fontSize: 13,
        fontWeight: 400,
        color: '#666',
        lineHeight: 1.65,
        margin: '0 0 0',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {article.summary}
      </p>

      {/* 底部分隔栏 */}
      <div style={{ borderTop: '1px solid #F0F0F0', marginTop: 14, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>⏱</span>
          {article.readTime} 分钟阅读
        </span>
        <span style={{ fontSize: 13, color: '#4A90E2', fontWeight: 500, textDecoration: 'none' }}>
          阅读详情 ›
        </span>
      </div>
    </motion.div>
  );
};

export default ArticleCard;
