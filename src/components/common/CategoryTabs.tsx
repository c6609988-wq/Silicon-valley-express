import React, { useRef } from 'react';
import { motion } from 'framer-motion';

interface CategoryTabsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

const CategoryTabs = ({ categories, active, onChange }: CategoryTabsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleClick = (cat: string, index: number) => {
    onChange(cat);

    // 点击后将该标签滚动到可视区域中央
    const container = scrollRef.current;
    const btn = buttonRefs.current[index];
    if (!container || !btn) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    // 计算按钮相对于容器的偏移，滚动使其居中
    const offset =
      btn.offsetLeft - container.clientWidth / 2 + btn.offsetWidth / 2;

    container.scrollTo({ left: offset, behavior: 'smooth' });
  };

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 py-1"
      style={{
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      } as React.CSSProperties}
    >
      {categories.map((cat, index) => (
        <motion.button
          key={cat}
          ref={(el) => { buttonRefs.current[index] = el; }}
          onClick={() => handleClick(cat, index)}
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
  );
};

export default CategoryTabs;
