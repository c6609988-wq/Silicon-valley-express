import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── 套餐定义 ────────────────────────────────────────────────────
const plans = [
  {
    id: 'monthly',
    label: '月度',
    price: '¥19.9',
    unit: '/月',
    saving: '',
    popular: false,
    badge: '',
  },
  {
    id: 'quarterly',
    label: '季度',
    price: '¥59.9',
    unit: '/季',
    saving: '均摊 ¥19.97/月',
    popular: false,
    badge: '',
  },
  {
    id: 'yearly',
    label: '年度',
    price: '¥199',
    unit: '/年',
    saving: '均摊 ¥16.6/月',
    popular: true,
    badge: '最划算',
  },
];

// ── 权益矩阵 ─────────────────────────────────────────────────────
// value: true = 有, false = 无, string = 具体数值
const featureMatrix = [
  {
    label: '信息源数量',
    monthly:   '30 个',
    quarterly: '60 个',
    yearly:    '100 个',
    highlight: true,
  },
  {
    label: 'AI 每日摘要',
    monthly:   true,
    quarterly: true,
    yearly:    true,
  },
  {
    label: 'AI 深度解读',
    monthly:   false,
    quarterly: true,
    yearly:    true,
  },
  {
    label: '推送频率',
    monthly:   '每日 1 次',
    quarterly: '每日多次',
    yearly:    '实时推送',
    highlight: true,
  },
  {
    label: '飞书 / 邮件推送',
    monthly:   false,
    quarterly: true,
    yearly:    true,
  },
  {
    label: '历史内容回溯',
    monthly:   '7 天',
    quarterly: '30 天',
    yearly:    '90 天',
    highlight: true,
  },
  {
    label: '客服支持',
    monthly:   '社区',
    quarterly: '标准',
    yearly:    '专属 1v1',
    highlight: true,
  },
];

// ── 辅助：渲染权益值 ──────────────────────────────────────────────
function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true)  return <Check className="w-4 h-4 text-primary mx-auto" strokeWidth={2.5} />;
  if (value === false) return <Minus className="w-3.5 h-3.5 text-muted-foreground/40 mx-auto" />;
  return <span className="text-xs font-medium text-foreground leading-tight">{value}</span>;
}

// ── 主组件 ───────────────────────────────────────────────────────
const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  if (!isOpen) return null;

  const current = plans.find(p => p.id === selectedPlan)!;

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
          className="w-full max-w-[430px] mx-auto bg-background rounded-t-2xl max-h-[90vh] flex flex-col"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="overflow-y-auto">
            {/* ── 标题栏 ── */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">升级 Pro 会员</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* ── 套餐选择卡 ── */}
            <div className="grid grid-cols-3 gap-2 px-5 mb-5">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative flex flex-col items-center py-3 px-2 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full whitespace-nowrap">
                        {plan.badge}
                      </span>
                    )}
                    <p className={`text-xs mb-1 font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                      {plan.label}
                    </p>
                    <p className={`text-[18px] font-bold leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {plan.price}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{plan.unit}</p>
                    {plan.saving ? (
                      <p className="text-[10px] text-primary mt-1 leading-tight text-center">{plan.saving}</p>
                    ) : (
                      <p className="text-[10px] text-transparent mt-1">-</p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── 权益对比表 ── */}
            <div className="mx-5 mb-5 rounded-2xl border border-border overflow-hidden">
              {/* 表头 */}
              <div className="grid grid-cols-4 bg-secondary/60 px-3 py-2">
                <div className="text-xs text-muted-foreground font-medium col-span-1">功能</div>
                {plans.map(p => (
                  <div key={p.id} className={`text-xs font-bold text-center ${selectedPlan === p.id ? 'text-primary' : 'text-muted-foreground'}`}>
                    {p.label}
                  </div>
                ))}
              </div>

              {/* 表身 */}
              {featureMatrix.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-4 px-3 py-2.5 items-center ${
                    i < featureMatrix.length - 1 ? 'border-b border-border/60' : ''
                  } ${row.highlight ? 'bg-primary/[0.02]' : ''}`}
                >
                  <span className="text-xs text-foreground/80 font-medium col-span-1 leading-tight">{row.label}</span>
                  {(['monthly', 'quarterly', 'yearly'] as const).map(planId => (
                    <div key={planId} className={`text-center ${selectedPlan === planId ? 'opacity-100' : 'opacity-60'}`}>
                      <FeatureValue value={row[planId]} />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* ── 升级按钮 ── */}
            <div className="px-5 pb-8">
              <Button className="w-full h-12 rounded-xl text-base font-semibold">
                立即升级 · {current.price}{current.unit}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2.5">
                7 天免费试用 · 随时取消 · 到期自动续费
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradeModal;
