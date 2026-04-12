import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { Article } from '@/types';

interface ArticleCardProps {
  article: Article;
  index?: number;
}

// 从 AI 分析文本中提取摘要（清除 markdown 标记）
function cleanSummary(text: string): string {
  if (!text) return '';

  const stripped = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#{1,4}\s*/gm, '');

  // 尝试提取"一、今日核心要点"下第一条
  const pointMatch = stripped.match(/一[、.]\s*(?:今日)?核心要点[^\n]*\n[\s\S]*?(\d+[.、]\s*)([^\n]{6,})/);
  if (pointMatch) {
    return pointMatch[2]
      .replace(/^[\w\s]+[：:]\s*/, '') // 去掉"话题关键词："前缀
      .trim()
      .slice(0, 80);
  }

  // 回退：取第一句有意义的话
  return stripped
    .replace(/^\s*\d+[.、·]\s*/gm, '')
    .replace(/^[-•]\s*/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
    .split(/(?<=[。！？])/)[0]
    .trim()
    .slice(0, 80);
}

// 平台配置
const PLATFORM: Record<string, { color: string; icon: string }> = {
  twitter: { color: '#1d9bf0', icon: '𝕏' },
  x:       { color: '#1d9bf0', icon: '𝕏' },
  youtube: { color: '#ff0000', icon: '▶' },
  rss:     { color: '#f97316', icon: '📡' },
};

const ArticleCard = ({ article, index = 0 }: ArticleCardProps) => {
  const navigate = useNavigate();
  const platform = PLATFORM[article.sourceType] || { color: '#6366f1', icon: '📰' };

  const summaryText = cleanSummary(article.aiSummary || article.summary || '');

  // 时间显示：今天显示 HH:MM，否则显示 M/D
  const pubDate = new Date(article.publishTime);
  const isToday = pubDate.toDateString() === new Date().toDateString();
  const timeStr = isToday
    ? pubDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : `${pubDate.getMonth() + 1}月${pubDate.getDate()}日`;

  return (
    <motion.div
      className="bg-card rounded-2xl shadow-card cursor-pointer overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28 }}
      whileTap={{ scale: 0.975 }}
      onClick={() => {
        sessionStorage.setItem(`article_${article.id}`, JSON.stringify(article));
        navigate(`/article/${article.id}`);
      }}
    >
      {/* 平台色条 */}
      <div className="h-[3px] w-full" style={{ backgroundColor: platform.color }} />

      <div className="p-4">
        {/* 信息源行 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
              style={{ backgroundColor: platform.color }}
            >
              {platform.icon}
            </div>
            <span className="text-[13px] font-semibold text-foreground">{article.sourceName}</span>
            <span className="text-xs text-muted-foreground">{timeStr}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="text-[11px]">{article.readTime} 分钟</span>
          </div>
        </div>

        {/* 标题 */}
        <h3 className="text-[15px] font-bold text-foreground leading-snug mb-2 line-clamp-2">
          {article.title}
        </h3>

        {/* 摘要 */}
        {summaryText && (
          <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {summaryText}
          </p>
        )}

        {/* 底部：查看详情 */}
        <div className="flex items-center justify-end pt-1 border-t border-border/50">
          <span
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: platform.color }}
          >
            查看详情
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ArticleCard;
