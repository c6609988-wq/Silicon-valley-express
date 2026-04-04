import { motion } from 'framer-motion';

interface CategoryTabsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

const CategoryTabs = ({ categories, active, onChange }: CategoryTabsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {categories.map((cat) => (
        <motion.button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
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
