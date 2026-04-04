import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { Article } from '@/types';
import { getSourceIcon, formatPublishTime } from '@/data/mockData';

interface ArticleCardProps {
  article: Article;
  index?: number;
}

const ArticleCard = ({ article, index = 0 }: ArticleCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="bg-card rounded-xl p-4 shadow-card cursor-pointer active:scale-[0.98] transition-transform"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/article/${article.id}`)}
    >
      {/* 来源信息 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-full">
            <span className="text-xs">{getSourceIcon(article.sourceType)}</span>
            <span className="text-xs text-muted-foreground">{article.sourceName}</span>
          </div>
          <span className="text-xs text-muted-foreground">{new Date(article.publishTime).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }).replace('/', '月') + '日'}</span>
        </div>
        {article.isBookmarked && (
          <Bookmark className="w-4 h-4 text-primary fill-primary" />
        )}
      </div>

      {/* 标题 */}
      <h3 className="text-[15px] font-semibold text-foreground leading-snug mb-1.5 line-clamp-2">
        {article.title}
      </h3>

      {/* 摘要 */}
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-2">
        {article.summary}
      </p>

      {/* 底部信息 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{article.readTime} 分钟阅读</span>
        <span className="text-xs text-primary font-medium">阅读详情</span>
      </div>
    </motion.div>
  );
};

export default ArticleCard;
