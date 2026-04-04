import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '@/components/common/SearchBar';
import MobileLayout from '@/components/layout/MobileLayout';
import { mockArticles, getSourceIcon, formatPublishTime } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const formatSavedTime = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 1) return '刚刚收藏';
  if (diffHours < 24) return `收藏于 ${diffHours} 小时前`;
  return `收藏于 ${diffDays} 天前`;
};

const initialFavorites = mockArticles.slice(0, 3).map(article => ({
  ...article,
  savedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
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

  const handleRemoveFavorite = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation();
    setFavorites(prev => prev.filter(a => a.id !== articleId));
    toast({ title: '已取消收藏', duration: 1000 });
  };

  return (
    <MobileLayout showNav={false}>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold text-foreground">我的收藏</h1>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">{filteredFavorites.length} 篇</span>
        </div>
      </div>

      <div className="px-4 pt-3 pb-1">
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="搜索收藏内容..." />
      </div>

      <div className="px-4 py-3 space-y-3">
        {filteredFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Bookmark className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{searchQuery ? '未找到匹配的收藏' : '暂无收藏内容'}</p>
            <p className="text-sm text-muted-foreground mt-1">{searchQuery ? '试试其他关键词' : '浏览文章时点击收藏按钮添加'}</p>
          </div>
        ) : (
          filteredFavorites.map((article, index) => (
            <motion.div
              key={article.id}
              className="bg-transparent border border-border rounded-xl p-4 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/article/${article.id}`)}
            >
              {/* Source & saved time */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary rounded-full">
                    <span className="text-xs">{getSourceIcon(article.sourceType)}</span>
                    <span className="text-xs text-muted-foreground">{article.sourceName}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{formatSavedTime(article.savedAt)}</span>
              </div>

              {/* Title */}
              <h3 className="text-[15px] font-semibold text-foreground leading-snug mb-1.5 line-clamp-2">
                {article.title}
              </h3>

              {/* Summary */}
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                {article.summary}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{article.readTime} 分钟阅读</span>
                <button
                  onClick={(e) => handleRemoveFavorite(e, article.id)}
                  className="flex items-center gap-1 text-xs text-destructive font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  取消收藏
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </MobileLayout>
  );
};

export default FavoritesPage;
