import { motion } from 'framer-motion';
import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Mail,
  Star,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';

const helpItems = [
  { icon: HelpCircle, label: '常见问题', desc: '查看常见问题解答', color: 'bg-blue-100 text-blue-500' },
  { icon: MessageCircle, label: '联系客服', desc: '工作日 9:00-18:00', color: 'bg-blue-100 text-blue-500' },
  { icon: Mail, label: '意见反馈', desc: '告诉我们你的想法', color: 'bg-blue-100 text-blue-500' },
  { icon: Star, label: '给我们评分', desc: '你的支持是我们最大的动力', color: 'bg-blue-100 text-blue-500' },
];

const aboutItems = [
  { label: '用户协议' },
  { label: '隐私政策' },
  { label: '开源许可' },
];

const HelpPage = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout showNav={false}>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold text-foreground">帮助与反馈</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* App Icon & Info */}
        <motion.div
          className="flex flex-col items-center py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-lg">
            <Zap className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">硅谷速递</h2>
          <p className="text-sm text-muted-foreground">版本 1.0.0</p>
        </motion.div>

        {/* Help Items */}
        <motion.div
          className="bg-card rounded-2xl shadow-card overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {helpItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-accent/50 transition-colors ${
                  index < helpItems.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-3">关于我们</h3>
          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            {aboutItems.map((item, index) => (
              <button
                key={item.label}
                className={`w-full flex items-center px-4 py-4 hover:bg-accent/50 transition-colors ${
                  index < aboutItems.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <span className="flex-1 text-sm text-foreground text-left">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center py-4 border-t border-border">
          <p className="text-xs text-muted-foreground">© 2026 硅谷速递</p>
          <p className="text-xs text-muted-foreground mt-1">用 AI 连接硅谷资讯</p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default HelpPage;
