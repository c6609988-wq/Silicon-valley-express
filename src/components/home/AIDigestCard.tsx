import { motion } from 'framer-motion';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { AuthorDigest } from '@/hooks/useAIDigest';

interface AIDigestCardProps {
  digests: AuthorDigest[];
}

function DigestSection({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return (
            <p key={i} className="text-xs font-semibold text-primary mt-3 mb-1 first:mt-0">
              {line.replace('### ', '')}
            </p>
          );
        }
        if (line === '---') {
          return <hr key={i} className="border-border my-1" />;
        }
        if (line.trim() === '') return null;
        return (
          <p key={i} className="text-xs text-foreground/80 leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}

const AIDigestCard = ({ digests }: AIDigestCardProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

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
        <span className="ml-auto text-xs text-muted-foreground">{digests.length} 位博主</span>
      </div>

      <div className="space-y-2">
        {digests.map((d, index) => (
          <div key={d.author} className="border border-border rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <span className="text-xs font-medium text-foreground">@{d.author}</span>
              {expandedIndex === index
                ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              }
            </button>
            {expandedIndex === index && (
              <motion.div
                className="px-3 py-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                <DigestSection content={d.content} />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AIDigestCard;
