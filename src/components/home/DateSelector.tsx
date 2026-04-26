import { useRef } from 'react';
import { motion } from 'framer-motion';

interface Props {
  selectedDate: string;          // YYYY-MM-DD（北京时间）
  onSelect: (date: string) => void;
  availableDates?: Set<string>;  // 有内容的日期，无则全部可点
}

/** 生成北京时间日期字符串，offsetDays=0 是今天 */
function getBjDateKey(offsetDays = 0): string {
  const ms = Date.now() + 8 * 3600 * 1000 - offsetDays * 86400000;
  return new Date(ms).toISOString().split('T')[0];
}

function getDayLabel(dateKey: string, index: number): string {
  if (index === 0) return '今天';
  if (index === 1) return '昨天';
  const [y, m, d] = dateKey.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dow];
}

const DateSelector = ({ selectedDate, onSelect, availableDates }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const key = getBjDateKey(i);
    const day = parseInt(key.split('-')[2], 10);
    const label = getDayLabel(key, i);
    const hasData = !availableDates || availableDates.has(key);
    return { key, day, label, hasData };
  });

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '4px 0 4px',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {dates.map(({ key, day, label, hasData }) => {
        const active = key === selectedDate;
        return (
          <motion.button
            key={key}
            whileTap={{ scale: 0.92 }}
            onClick={() => onSelect(key)}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 58,
              borderRadius: 16,
              border: 'none',
              cursor: 'pointer',
              background: active ? '#1A73E8' : '#F0F2F5',
              transition: 'background 0.18s',
              position: 'relative',
            }}
          >
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              color: active ? 'rgba(255,255,255,0.82)' : '#999',
              marginBottom: 3,
              lineHeight: 1,
            }}>
              {label}
            </span>
            <span style={{
              fontSize: 19,
              fontWeight: 700,
              color: active ? '#fff' : '#222',
              lineHeight: 1,
            }}>
              {day}
            </span>
            {/* 有内容小圆点 */}
            {hasData && !active && (
              <span style={{
                position: 'absolute',
                bottom: 6,
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: '#1A73E8',
              }} />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default DateSelector;
