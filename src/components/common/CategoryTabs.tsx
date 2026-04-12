import { motion } from 'framer-motion';

interface CategoryTabsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

const CategoryTabs = ({ categories, active, onChange }: CategoryTabsProps) => {
  return (
    <div
      className="flex gap-2 overflow-x-auto py-1"
      style={{
        scrollbarWidth: 'none',          // Firefox
        WebkitOverflowScrolling: 'touch', // iOS 惯性滚动
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}
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
