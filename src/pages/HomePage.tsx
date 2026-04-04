import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import MobileLayout from '@/components/layout/MobileLayout';
import DateSelector from '@/components/home/DateSelector';
import ArticleCard from '@/components/home/ArticleCard';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import PullToRefresh from '@/components/common/PullToRefresh';
import { ArticleCardSkeleton } from '@/components/ui/skeleton-card';
import { getGreeting, mockUser } from '@/data/mockData';
import { useLiveTweets } from '@/hooks/useLiveTweets';
import { useToast } from '@/hooks/use-toast';

const HomePage = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();
  const greeting = getGreeting();
  const { articles, loading, error } = useLiveTweets(6);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) setShowOnboarding(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    window.location.reload();
  }, []);

  const handleOnboardingComplete = (selectedChannels: string[]) => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
    if (selectedChannels.length > 0) {
      toast({ title: '设置成功', description: `已关注 ${selectedChannels.length} 个频道` });
    }
  };

  return (
    <>
      <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />

      <MobileLayout>
        <PullToRefresh onRefresh={handleRefresh}>
          {/* 顶部问候语 */}
          <motion.header
            className="sticky top-0 bg-background/95 backdrop-blur-sm z-30 safe-area-inset-top"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-foreground">{greeting}，{mockUser.nickname} 👋</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">为你整理了今日资讯</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-foreground">{mockUser.nickname.charAt(0)}</span>
                </div>
              </div>
            </div>
          </motion.header>

          {/* 日期 */}
          <div className="px-4 py-2">
            <DateSelector />
          </div>

          {/* 内容区 */}
          <div className="px-4 py-3 space-y-4">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map(i => <ArticleCardSkeleton key={i} />)
            ) : error ? (
              <p className="text-sm text-muted-foreground text-center py-8">获取推文失败：{error}</p>
            ) : (
              articles.map((article, index) => (
                <ArticleCard key={article.id} article={article} index={index} />
              ))
            )}
          </div>
        </PullToRefresh>
      </MobileLayout>
    </>
  );
};

export default HomePage;
