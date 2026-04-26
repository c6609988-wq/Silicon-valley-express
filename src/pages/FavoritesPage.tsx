import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '@/components/common/SearchBar';
import MobileLayout from '@/components/layout/MobileLayout';
import { mockArticles } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

// 平台图标 SVG（与 ArticleCard 一致）
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#1A73E8">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const YoutubeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#1A73E8">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const RssIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#1A73E8">
    <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
  </svg>
);

const platformLabel: Record<string, string> = {
  twitter: 'Twitter', x: 'Twitter',
  youtube: 'YouTube',
  rss: 'RSS', blog: 'Blog',
  wechat: '微信', website: 'Web', podcast: 'Podcast',
};

function PlatformTag({ type }: { type: string }) {
  const Icon = type === 'youtube' ? YoutubeIcon : (type === 'twitter' || type === 'x') ? XIcon : RssIcon;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: '#EBF3FF', border: '1px solid #C7DEFF',
      borderRadius: 8, padding: '3px 8px', height: 26, flexShrink: 0,
    }}>
      <Icon />
      <span style={{ fontSize: 12, color: '#1A73E8', fontWeight: 500 }}>
        {platformLabel[type] || 'Web'}
      </span>
    </div>
  );
}

const formatSavedTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return '刚刚收藏';
  if (h < 24) return `${h} 小时前收藏`;
  return `${d} 天前收藏`;
};

const initialFavorites = mockArticles.slice(0, 3).map(article => ({
  ...article,
  savedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
}));

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(initialFavorites);

  const filteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) return favorites;
    const q = searchQuery.toLowerCase();
    return favorites.filter(
      a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.sourceName.toLowerCase().includes(q)
    );
  }, [searchQuery, favorites]);

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => prev.filter(a => a.id !== id));
    toast({ title: '已取消收藏', duration: 1000 });
  };

  return (
    <MobileLayout showNav={false}>
      {/* 顶部导航 */}
      <div
        className="sticky top-0 z-10"
        style={{ background: 'rgba(245,247,250,0.96)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #EAEAEA' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
          <motion.button
            onClick={() => navigate('/profile')}
            whileTap={{ scale: 0.92 }}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#fff', border: '1px solid #EAEAEA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ArrowLeft style={{ width: 18, height: 18, color: '#333' }} />
          </motion.button>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#111', flex: 1 }}>我的收藏</span>
          <span style={{ fontSize: 13, color: '#999' }}>{filteredFavorites.length} 篇</span>
        </div>
      </div>

      <div style={{ padding: '12px 16px 4px' }}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="搜索收藏内容..." />
      </div>

      <div style={{ padding: '12px 16px 80px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredFavorites.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F3F3F3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Bookmark style={{ width: 32, height: 32, color: '#CCC' }} />
            </div>
            <p style={{ fontSize: 15, color: '#999' }}>{searchQuery ? '未找到匹配的收藏' : '暂无收藏内容'}</p>
            <p style={{ fontSize: 13, color: '#BBB', marginTop: 4 }}>
              {searchQuery ? '试试其他关键词' : '浏览文章时点击收藏按钮添加'}
            </p>
          </div>
        ) : (
          filteredFavorites.map((article, index) => {
            const dateStr = article.publishTime
              ? new Date(article.publishTime).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }).replace('/', '月') + '日'
              : '';
            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 16 }}
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
                }}
              >
                {/* Meta 行 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <PlatformTag type={article.sourceType} />
                    <span style={{ fontSize: 13, color: '#333', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                      {article.sourceName}
                    </span>
                    {article.sourceHandle && (
                      <span style={{ fontSize: 12, color: '#999' }}>
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
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {article.title}
                </h3>

                {/* 摘要 */}
                <p style={{
                  fontSize: 13, color: '#666', lineHeight: 1.65, margin: 0,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {article.summary}
                </p>

                {/* 底部栏 */}
                <div style={{ borderTop: '1px solid #F0F0F0', marginTop: 14, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>⏱</span>{article.readTime} 分钟阅读
                    <span style={{ marginLeft: 8, color: '#BBB' }}>· {formatSavedTime(article.savedAt)}</span>
                  </span>
                  <button
                    onClick={(e) => handleRemove(e, article.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, color: '#F87171', fontWeight: 500,
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    }}
                  >
                    <Trash2 style={{ width: 13, height: 13 }} />
                    取消收藏
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </MobileLayout>
  );
};

export default FavoritesPage;
