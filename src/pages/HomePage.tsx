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
import { Article } from '@/types';

// 将文章按北京时间日期分组
function groupByDate(articles: Article[]): { dateLabel: string; dateKey: string; items: Article[] }[] {
  const map = new Map<string, Article[]>();

  articles.forEach(article => {
    const bjDate = new Date(new Date(article.publishTime).getTime() + 8 * 3600 * 1000);
    const key = bjDate.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(article);
  });

  // 按日期降序排列
  const sorted = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  const today = new Date(new Date().getTime() + 8 * 3600 * 1000).toISOString().split('T')[0];
  const yesterday = new Date(new Date().getTime() + 8 * 3600 * 1000 - 86400000).toISOString().split('T')[0];

  return sorted.map(([key, items]) => {
    let dateLabel = '';
    if (key === today) {
      dateLabel = '今天';
    } else if (key === yesterday) {
      dateLabel = '昨天';
    } else {
      const [, m, d] = key.split('-');
      dateLabel = `${parseInt(m)}月${parseInt(d)}日`;
    }
    return { dateKey: key, dateLabel, items };
  });
}

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

  const grouped = groupByDate(articles);

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

          {/* 日期选择器 */}
          <div className="px-4 py-2">
            <DateSelector />
          </div>

          {/* 内容区 */}
          <div className="px-4 py-3 pb-8">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map(i => <ArticleCardSkeleton key={i} />)}
              </div>
            ) : error ? (
              <p className="text-sm text-muted-foreground text-center py-8">获取推文失败：{error}</p>
            ) : grouped.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <p className="text-2xl">📭</p>
                <p className="text-sm text-muted-foreground">暂无内容，每天上午 7:00 自动更新</p>
              </div>
            ) : (
              grouped.map(({ dateKey, dateLabel, items }) => (
                <div key={dateKey} className="mb-6">
                  {/* 灰色日期分隔线 */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground font-medium px-1">{dateLabel}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {/* 该日期下的文章 */}
                  <div className="space-y-4">
                    {items.map((article, index) => (
                      <ArticleCard key={article.id} article={article} index={index} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </PullToRefresh>
      </MobileLayout>
    </>
  );
};

export default HomePage;
