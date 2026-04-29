import React, { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface CategoryTabsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

const CategoryTabs = ({ categories, active, onChange }: CategoryTabsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    const btn = buttonRefs.current[index];
    if (!container || !btn) return;

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const targetLeft = btn.offsetLeft + btn.offsetWidth / 2 - container.clientWidth / 2;

    container.scrollTo({
      left: Math.max(0, Math.min(targetLeft, maxScrollLeft)),
      behavior: 'smooth',
    });
  }, []);

  const handleClick = (cat: string, index: number) => {
    onChange(cat);
    requestAnimationFrame(() => scrollToIndex(index));
  };

  useEffect(() => {
    const activeIndex = categories.findIndex(cat => cat === active);
    if (activeIndex >= 0) {
      requestAnimationFrame(() => scrollToIndex(activeIndex));
    }
  }, [active, categories, scrollToIndex]);

  return (
    <div
      ref={scrollRef}
      className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-1"
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorX: 'contain',
        scrollBehavior: 'smooth',
        scrollPaddingInline: '1rem',
        touchAction: 'pan-x',
      } as React.CSSProperties}
    >
      {categories.map((cat, index) => (
        <motion.button
          type="button"
          key={cat}
          ref={(el) => { buttonRefs.current[index] = el; }}
          onClick={() => handleClick(cat, index)}
          className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 transition-colors duration-200 ${
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
