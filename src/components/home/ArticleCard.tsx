import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Article } from '@/types';
import { getSourceIcon } from '@/data/mockData';

interface ArticleCardProps {
  article: Article;
  index?: number;
}

// 清除 AI 分析文本中的 markdown 符号，提取干净摘要
function cleanSummary(text: string): string {
  if (!text) return '';

  // 去掉所有 markdown 标记
  const stripped = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#{1,4}\s*/gm, '');

  // 尝试提取"一、今日核心要点"或"核心要点提炼"下第一条有效内容
  const pointMatch = stripped.match(/(?:核心要点[提炼]*|今日核心要点)[：:]\s*(?:\d+[.、]\s*)?([^\n。！？]{6,}[。！？]?)/);
  if (pointMatch) {
    return pointMatch[1]
      .replace(/^\d+[.、]\s*/, '')
      .replace(/^[\w\s]+[：:]\s*/, '')  // 去掉"事件：""实验发现："等前缀
      .trim()
      .slice(0, 80);
  }

  // 回退：去掉编号和列表符号，取第一句
  return stripped
    .replace(/^\s*\d+[.、·]\s*/gm, '')
    .replace(/^[-•]\s*/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
    .split(/(?<=[。！？])/)[0]
    .trim()
    .slice(0, 80);
}

// 平台图标（与截图2保持一致，使用文字符号）
const platformIcon: Record<string, string> = {
  twitter: '𝕏',
  x: '𝕏',
  youtube: '▶',
  rss: '📡',
};

const ArticleCard = ({ article, index = 0 }: ArticleCardProps) => {
  const navigate = useNavigate();

  const summaryText = cleanSummary(article.aiSummary || article.summary || '');

  // 时间格式：M月D日
  const pubDate = new Date(article.publishTime);
  const dateStr = `${pubDate.getMonth() + 1}月${pubDate.getDate()}日`;

  const icon = platformIcon[article.sourceType] || getSourceIcon(article.sourceType);

  return (
    <motion.div
      className="bg-card rounded-xl p-4 shadow-card cursor-pointer active:scale-[0.98] transition-transform"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => {
        sessionStorage.setItem(`article_${article.id}`, JSON.stringify(article));
        navigate(`/article/${article.id}`);
      }}
    >
      {/* 行1：胶囊徽章 + 日期 */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-full">
          <span className="text-xs">{icon}</span>
          <span className="text-xs text-muted-foreground font-medium">{article.sourceName}</span>
        </div>
        <span className="text-xs text-muted-foreground">{dateStr}</span>
      </div>

      {/* 行2：标题 */}
      <h3 className="text-[15px] font-semibold text-foreground leading-snug mb-1.5 line-clamp-2">
        {article.title}
      </h3>

      {/* 行3：摘要（无 ** 符号）*/}
      {summaryText && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-2">
          {summaryText}
        </p>
      )}

      {/* 行4：底部 */}
      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        <span className="text-xs text-muted-foreground">{article.readTime} 分钟阅读</span>
        <span className="text-xs text-primary font-medium">阅读详情</span>
      </div>
    </motion.div>
  );
};

export default ArticleCard;
