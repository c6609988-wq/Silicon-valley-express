import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Zap, Star, Clock, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const plans = [
  {
    id: 'monthly',
    label: '月度会员',
    price: '¥29',
    period: '/月',
    saving: '',
  },
  {
    id: 'yearly',
    label: '年度会员',
    price: '¥199',
    period: '/年',
    saving: '省 43%',
    popular: true,
  },
];

const features = [
  { icon: Zap, label: '关注 100 个信息源' },
  { icon: Star, label: 'AI 智能分析总结' },
  { icon: Clock, label: '优先推送' },
  { icon: Shield, label: '专属客服' },
];

const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 flex items-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-[430px] mx-auto bg-background rounded-t-2xl max-h-[85vh] flex flex-col"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 overflow-y-auto pb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-primary" />
                <h2 className="text-lg font-bold text-foreground">升级 Pro</h2>
              </div>
              <button onClick={onClose}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {features.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{label}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  className={`relative p-4 rounded-xl border-2 text-left transition-colors ${
                    plan.popular ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                      推荐
                    </span>
                  )}
                  <p className="text-sm text-muted-foreground">{plan.label}</p>
                  <p className="text-xl font-bold text-foreground">
                    {plan.price}
                    <span className="text-xs font-normal text-muted-foreground">{plan.period}</span>
                  </p>
                  {plan.saving && (
                    <p className="text-xs text-primary mt-1">{plan.saving}</p>
                  )}
                </button>
              ))}
            </div>

            <Button className="w-full h-12 rounded-xl text-base">
              立即升级
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              7 天免费试用，随时取消
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradeModal;
