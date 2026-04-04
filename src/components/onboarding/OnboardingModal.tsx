import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockChannels } from '@/data/mockData';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (selectedChannels: string[]) => void;
}

const OnboardingModal = ({ isOpen, onComplete }: OnboardingModalProps) => {
  const [step, setStep] = useState(0);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  if (!isOpen) return null;

  const totalSteps = 3;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] bg-background flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="flex-1 flex flex-col max-w-[430px] mx-auto w-full">
          {/* Progress bar */}
          <div className="flex gap-1 px-4 pt-6">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>

          {step === 0 ? (
            <motion.div
              className="flex-1 flex flex-col p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex-1 flex flex-col justify-start pt-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-3">欢迎来到硅谷速递</h1>
                <p className="text-muted-foreground text-[15px] leading-relaxed">
                  一手硅谷，中文速递。每天 20 分钟掌握全球科技最前沿动态。
                </p>
              </div>

              <div className="mt-auto">
                <Button
                  onClick={() => setStep(1)}
                  className="w-full h-12 rounded-xl text-base"
                >
                  继续
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <button
                  onClick={() => onComplete([])}
                  className="w-full text-center text-sm text-muted-foreground mt-3 py-2"
                >
                  跳过引导
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="flex-1 flex flex-col p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground">选择感兴趣的频道</h2>
                <button
                  onClick={() => onComplete([])}
                  className="text-sm text-muted-foreground"
                >
                  跳过
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {mockChannels.map((channel) => (
                  <motion.button
                    key={channel.id}
                    onClick={() => toggleChannel(channel.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                      selectedChannels.includes(channel.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-2xl">{channel.icon}</span>
                    <div className="flex-1 text-left">
                      <h3 className="text-sm font-semibold text-foreground">{channel.name}</h3>
                      <p className="text-xs text-muted-foreground">{channel.description}</p>
                    </div>
                    {selectedChannels.includes(channel.id) && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              <Button
                onClick={() => onComplete(selectedChannels)}
                className="w-full h-12 rounded-xl text-base mt-4"
                disabled={selectedChannels.length === 0}
              >
                关注 {selectedChannels.length} 个频道
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal;
