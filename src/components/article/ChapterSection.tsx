import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Chapter } from '@/types';

interface ChapterSectionProps {
  chapters: Chapter[];
}

const ChapterSection = ({ chapters }: ChapterSectionProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(chapters[0]?.id || null);

  return (
    <div className="space-y-2">
      {chapters.map((chapter) => (
        <motion.div
          key={chapter.id}
          className="bg-secondary rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => setExpandedId(expandedId === chapter.id ? null : chapter.id)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <h4 className="text-sm font-semibold text-foreground">{chapter.title}</h4>
            {expandedId === chapter.id ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {expandedId === chapter.id && (
            <motion.div
              className="px-4 pb-4"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
            >
              <p className="text-sm text-foreground/80 mb-2">{chapter.content}</p>
              {chapter.keyPoints && (
                <div className="space-y-1">
                  {chapter.keyPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-primary text-xs mt-1">●</span>
                      <span className="text-xs text-muted-foreground">{point}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default ChapterSection;
