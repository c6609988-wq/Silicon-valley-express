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

    const container = scrollRef.current;
    const btn = buttonRefs.current[index];
    if (!container || !btn) return;

    const containerLeft = container.scrollLeft;
    const containerRight = containerLeft + container.clientWidth;
    const btnLeft = btn.offsetLeft;
    const btnRight = btnLeft + btn.offsetWidth;
    const padding = 16; // 左右 padding

    // 按钮右侧超出容器可视区 → 向右滚动刚好露出
    if (btnRight + padding > containerRight) {
      container.scrollTo({
        left: btnRight + padding - container.clientWidth,
        behavior: 'smooth',
      });
    }
    // 按钮左侧超出容器可视区 → 向左滚动刚好露出
    else if (btnLeft - padding < containerLeft) {
      container.scrollTo({
        left: btnLeft - padding,
        behavior: 'smooth',
      });
    }
    // 完全可见 → 不滚动
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
