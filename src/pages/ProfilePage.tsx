import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Crown,
  Clock,
  Bookmark,
  HelpCircle,
  LogOut,
  LogIn,
  Zap,
  Star,
  Shield,
  UserCircle2,
} from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import UpgradeModal from '@/components/profile/UpgradeModal';
import { mockUser } from '@/data/mockData';

const menuItems = [
  { icon: Clock,       label: '推送时间',  value: '每天 08:00', path: '/settings' },
  { icon: Bookmark,    label: '我的收藏',  value: '',           path: '/favorites' },
  { icon: HelpCircle,  label: '帮助与反馈', value: '',          path: '/help' },
];

const proFeatures = [
  { icon: Zap,    label: '关注 100 个信息源' },
  { icon: Star,   label: 'AI 智能分析总结' },
  { icon: Clock,  label: '优先推送' },
  { icon: Shield, label: '专属客服' },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 从 localStorage 读取登录状态
  useEffect(() => {
    const stored = localStorage.getItem('isLoggedIn');
    setIsLoggedIn(stored === 'true');
  }, []);

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.setItem('isLoggedIn', 'false');
    setIsLoggedIn(false);
  };

  return (
    <>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      <MobileLayout>
        <AnimatePresence mode="wait">
          {isLoggedIn ? (
            // ── 已登录 ─────────────────────────────────────────────
            <motion.div
              key="logged-in"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* 用户信息卡片 */}
              <motion.div
                className="mx-4 mt-4 p-4 rounded-2xl bg-card shadow-card cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate('/settings')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-sm">
                    <span className="text-2xl font-bold text-primary">
                      {mockUser.nickname.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-foreground">{mockUser.nickname}</h2>
                    <p className="text-sm text-muted-foreground">UID: 9527</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </motion.div>

              {/* Pro 升级卡片 */}
              <motion.div
                className="mx-4 mt-4 p-5 rounded-2xl overflow-hidden relative cursor-pointer bg-gradient-to-br from-primary/5 via-white to-primary/10 border border-primary/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => setShowUpgradeModal(true)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">升级 Pro 会员</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">解锁全部高级功能</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {proFeatures.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-primary/70" />
                      <span className="text-xs text-foreground/80">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-foreground">¥19</span>
                    <span className="text-sm text-muted-foreground">/月</span>
                  </div>
                  <button
                    className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium"
                    onClick={(e) => { e.stopPropagation(); setShowUpgradeModal(true); }}
                  >
                    立即升级
                  </button>
                </div>
              </motion.div>

              {/* 菜单项 */}
              <motion.div
                className="mx-4 mt-4 bg-card rounded-2xl shadow-card overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.label}
                      className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-accent/50 transition-colors ${
                        index < menuItems.length - 1 ? 'border-b border-border' : ''
                      }`}
                      onClick={() => navigate(item.path)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <span className="flex-1 text-sm text-foreground text-left">{item.label}</span>
                      {item.value && <span className="text-sm text-muted-foreground">{item.value}</span>}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* 退出登录 */}
              <motion.div
                className="mx-4 mt-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <button
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-destructive/10 text-destructive text-sm font-medium active:scale-[0.98] transition-transform"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </motion.div>
            </motion.div>

          ) : (
            // ── 未登录 ─────────────────────────────────────────────
            <motion.div
              key="logged-out"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* 未登录用户区 */}
              <motion.div
                className="mx-4 mt-4 p-6 rounded-2xl bg-card shadow-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  {/* 默认头像 */}
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-primary flex items-center justify-center">
                    <UserCircle2 className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">未登录</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">登录后享受 AI 资讯个性化推送</p>
                  </div>
                  {/* 登录按钮 */}
                  <motion.button
                    className="mt-1 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLogin}
                  >
                    <LogIn className="w-4 h-4" />
                    立即登录
                  </motion.button>
                </div>
              </motion.div>

              {/* 功能预览卡（引导升级） */}
              <motion.div
                className="mx-4 mt-4 p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-primary">登录后可使用</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {proFeatures.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 opacity-60">
                      <Icon className="w-3.5 h-3.5 text-primary/60" />
                      <span className="text-xs text-foreground/60">{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* 帮助入口（未登录也可访问） */}
              <motion.div
                className="mx-4 mt-4 bg-card rounded-2xl shadow-card overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.button
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-accent/50 transition-colors"
                  onClick={() => navigate('/help')}
                  whileTap={{ scale: 0.98 }}
                >
                  <HelpCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="flex-1 text-sm text-foreground text-left">帮助与反馈</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </MobileLayout>
    </>
  );
};

export default ProfilePage;
