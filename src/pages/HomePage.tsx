import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import MobileLayout from '@/components/layout/MobileLayout';
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
    const key = bjDate.toISOString().split('T')[0];
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(article);
  });

  const sorted = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  const today = new Date(new Date().getTime() + 8 * 3600 * 1000).toISOString().split('T')[0];
  const yesterday = new Date(new Date().getTime() + 8 * 3600 * 1000 - 86400000).toISOString().split('T')[0];

  return sorted.map(([key, items]) => {
    let dateLabel = '';
    if (key === today) dateLabel = '今天';
    else if (key === yesterday) dateLabel = '昨天';
    else {
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

          {/* ── 顶部 Header ─────────────────────────────────────── */}
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

          {/* ── 内容区 ──────────────────────────────────────────── */}
          <div className="px-4 pt-4 pb-8">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map(i => <ArticleCardSkeleton key={i} />)}
              </div>
            ) : error ? (
              <div className="text-center py-16 space-y-2">
                <p className="text-2xl">⚠️</p>
                <p className="text-sm text-muted-foreground">获取资讯失败，请下拉刷新重试</p>
              </div>
            ) : grouped.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <p className="text-4xl">📭</p>
                <p className="text-sm font-medium text-foreground">暂无内容</p>
                <p className="text-xs text-muted-foreground">每天上午 7:00 自动更新</p>
              </div>
            ) : (
              grouped.map(({ dateKey, dateLabel, items }) => (
                <div key={dateKey} className="mb-8">
                  {/* 日期标签 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-semibold text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">
                      {dateLabel}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {/* 文章列表 */}
                  <div className="space-y-3">
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
