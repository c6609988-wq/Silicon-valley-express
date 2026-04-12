import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { Article } from '@/types';
import { getSourceIcon, formatPublishTime } from '@/data/mockData';

interface ArticleCardProps {
  article: Article;
  index?: number;
}

// 去除 markdown 符号，提取第一句干净的摘要
function cleanSummary(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*|__|\*|_|`|#+\s*/g, '')   // 去掉 ** __ * _ ` ## 等
    .replace(/^[-•]\s*/gm, '')               // 去掉列表符号
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 保留链接文字
    .replace(/\n+/g, ' ')                    // 换行转空格
    .trim()
    .split(/(?<=[。！？.!?])\s*/)[0]          // 只取第一句
    .slice(0, 80);                           // 最多 80 字
}

const ArticleCard = ({ article, index = 0 }: ArticleCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="bg-card rounded-xl p-4 shadow-card cursor-pointer active:scale-[0.98] transition-transform"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => {
        // 将文章数据存入 sessionStorage，详情页读取（避免再次请求接口）
        sessionStorage.setItem(`article_${article.id}`, JSON.stringify(article));
        navigate(`/article/${article.id}`);
      }}
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
        {cleanSummary(article.summary || article.aiSummary || '')}
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
