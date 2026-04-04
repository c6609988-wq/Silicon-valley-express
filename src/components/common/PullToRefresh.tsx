import { useState, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
}

const PullToRefresh = ({ children, onRefresh }: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 60], [0, 1]);
  const scale = useTransform(y, [0, 60], [0.5, 1]);

  const handleDragEnd = useCallback(async (_: any, info: PanInfo) => {
    if (info.offset.y > 60 && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center py-3 z-10"
        style={{ opacity }}
      >
        <motion.div
          className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
          style={{ scale }}
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}
        />
      </motion.div>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        style={{ y: isRefreshing ? 0 : undefined }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
