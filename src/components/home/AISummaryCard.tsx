import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { DailySummary } from '@/types';

interface AISummaryCardProps {
  summary: DailySummary;
}

const AISummaryCard = ({ summary }: AISummaryCardProps) => {
  return (
    <motion.div
      className="rounded-2xl p-5 shadow-card border border-primary/10 bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-primary/10 dark:via-card dark:to-primary/5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">AI 今日摘要</h3>
      </div>

      <div className="space-y-2">
        {summary.highlights.map((highlight, index) => (
          <motion.div
            key={index}
            className="flex items-start gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <span className="text-primary mt-0.5 text-xs">●</span>
            <p className="text-sm text-foreground/80 leading-relaxed">{highlight}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{summary.stats.totalArticles}</p>
          <p className="text-xs text-muted-foreground">篇文章</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{summary.stats.newSources}</p>
          <p className="text-xs text-muted-foreground">新来源</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{summary.stats.aiInsights}</p>
          <p className="text-xs text-muted-foreground">AI 洞察</p>
        </div>
      </div>
    </motion.div>
  );
};

export default AISummaryCard;
