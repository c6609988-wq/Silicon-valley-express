import React from 'react';
import { motion } from 'framer-motion';

interface CategoryTabsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

const CategoryTabs = ({ categories, active, onChange }: CategoryTabsProps) => {
  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="flex gap-2 py-1 overflow-x-scroll"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingLeft: '1rem',
          paddingRight: '1rem',
        } as React.CSSProperties}
      >
        {categories.map((cat) => (
          <motion.button
            key={cat}
            onClick={() => onChange(cat)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 transition-colors ${
              active === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {cat}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;
