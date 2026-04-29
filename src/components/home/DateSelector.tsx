import { useRef } from 'react';
import { motion } from 'framer-motion';

interface Props {
  selectedDate: string;
  onSelect: (date: string) => void;
  availableDates?: Set<string>;
}

function getBjDateKey(offsetDays = 0): string {
  const ms = Date.now() + 8 * 3600 * 1000 - offsetDays * 86400000;
  return new Date(ms).toISOString().split('T')[0];
}

function getDayLabel(dateKey: string): string {
  const today = getBjDateKey(0);
  const yesterday = getBjDateKey(1);
  if (dateKey === today) return '今天';
  if (dateKey === yesterday) return '昨天';

  const [year, month, day] = dateKey.split('-').map(Number);
  const dow = new Date(year, month - 1, day).getDay();
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dow];
}

function buildDates(availableDates?: Set<string>) {
  const recentDates = Array.from({ length: 7 }, (_, i) => getBjDateKey(i));
  const merged = new Set<string>(recentDates);

  availableDates?.forEach(date => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) merged.add(date);
  });

  return Array.from(merged)
    .sort((a, b) => b.localeCompare(a))
    .map(key => ({
      key,
      day: parseInt(key.split('-')[2], 10),
      label: getDayLabel(key),
    }));
}

const DateSelector = ({ selectedDate, onSelect, availableDates }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dates = buildDates(availableDates);

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: 'calc((100% - 30px) / 7)',
        gap: 5,
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '4px 0 4px',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {dates.map(({ key, day, label }) => {
        const active = key === selectedDate;
        return (
          <motion.button
            key={key}
            whileTap={{ scale: 0.92 }}
            onClick={() => onSelect(key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minWidth: 0,
              height: 48,
              borderRadius: 16,
              border: 'none',
              cursor: 'pointer',
              background: active ? '#1A73E8' : '#F0F2F5',
              transition: 'background 0.18s',
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 400,
                color: active ? 'rgba(255,255,255,0.84)' : '#8E96A3',
                marginBottom: 4,
                lineHeight: 1,
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: active ? '#fff' : '#343A43',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {day}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default DateSelector;
