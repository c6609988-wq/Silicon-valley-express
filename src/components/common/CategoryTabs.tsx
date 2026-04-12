import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CategoryTabsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

const CategoryTabs = ({ categories, active, onChange }: CategoryTabsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);
  const dirRef = useRef(1); // 1 = 向右, -1 = 向左
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // 等 DOM 渲染完再启动，确保 scrollWidth 有值
    const startTimer = setTimeout(() => {
      const tick = () => {
        if (!pausedRef.current && el) {
          const maxScroll = el.scrollWidth - el.clientWidth;
          if (maxScroll <= 0) {
            // 内容没溢出，不需要滚动
            animRef.current = requestAnimationFrame(tick);
            return;
          }

          posRef.current += dirRef.current * 0.6; // 滚动速度

          if (posRef.current >= maxScroll) {
            posRef.current = maxScroll;
            dirRef.current = -1;
            // 到达末端停顿 1.5s
            pausedRef.current = true;
            setTimeout(() => { pausedRef.current = false; }, 1500);
          } else if (posRef.current <= 0) {
            posRef.current = 0;
            dirRef.current = 1;
            // 到达起点停顿 1.5s
            pausedRef.current = true;
            setTimeout(() => { pausedRef.current = false; }, 1500);
          }

          el.scrollLeft = posRef.current;
        }
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    }, 500);

    return () => {
      clearTimeout(startTimer);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [categories]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => {
    // 触摸结束后同步实际滚动位置再恢复
    if (scrollRef.current) posRef.current = scrollRef.current.scrollLeft;
    setTimeout(() => { pausedRef.current = false; }, 800);
  };

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 py-1"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
      style={{
        overflowX: 'auto',
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
  );
};

export default CategoryTabs;
