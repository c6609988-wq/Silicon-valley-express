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

/** 北京时间当天日期 key */
function getBjTodayKey(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().split('T')[0];
}

/** 将文章按北京时间日期分组，返回降序数组 */
function groupByDate(articles: Article[]): { dateLabel: string; dateKey: string; items: Article[] }[] {
  const map = new Map<string, Article[]>();
  articles.forEach(article => {
    const bjDate = new Date(new Date(article.publishTime).getTime() + 8 * 3600 * 1000);
    const key = bjDate.toISOString().split('T')[0];
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(article);
  });

  const sorted = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  const today     = getBjTodayKey();
  const yesterday = new Date(Date.now() + 8 * 3600 * 1000 - 86400000).toISOString().split('T')[0];

  return sorted.map(([key, items]) => {
    let dateLabel = '';
    if (key === today)          dateLabel = '今天';
    else if (key === yesterday) dateLabel = '昨天';
    else {
      const [, m, d] = key.split('-');
      dateLabel = `${parseInt(m)}月${parseInt(d)}日`;
    }
    return { dateKey: key, dateLabel, items };
  });
}

const HomePage = () => {
  const [showOnboarding, setShowOnboarding]   = useState(false);
  const [selectedDate, setSelectedDate]       = useState(getBjTodayKey);
  const { toast }    = useToast();
  const greeting     = getGreeting();
  const { articles, loading, error, refetch } = useLiveTweets(100);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) setShowOnboarding(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleOnboardingComplete = (selectedChannels: string[]) => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
    if (selectedChannels.length > 0) {
      toast({ title: '设置成功', description: `已关注 ${selectedChannels.length} 个频道` });
    }
  };

  const grouped      = groupByDate(articles);
  const availableDates = new Set(grouped.map(g => g.dateKey));

  // 当前选中日期的内容（找不到则 undefined）
  const selectedGroup = grouped.find(g => g.dateKey === selectedDate);

  // 副标题：选中今天显示"今日资讯"，其他日期显示具体日期
  const subTitle = (() => {
    const today = getBjTodayKey();
    if (selectedDate === today) return '为你整理了今日资讯';
    const [, m, d] = selectedDate.split('-');
    return `${parseInt(m)}月${parseInt(d)}日的资讯`;
  })();

  return (
    <>
      <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />

      <MobileLayout>
        <PullToRefresh onRefresh={handleRefresh}>

          {/* ── 顶部问候语 ── */}
          <motion.header
            className="sticky top-0 z-30 safe-area-inset-top"
            style={{
              background: 'rgba(245,247,250,0.96)',
              backdropFilter: 'blur(8px)',
              borderBottom: '1px solid #EAEAEA',
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-xl font-bold" style={{ color: '#111' }}>
                    {greeting}，{mockUser.nickname} 👋
                  </h1>
                  <p className="text-sm mt-0.5" style={{ color: '#999' }}>{subTitle}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: '#1A73E8' }}
                >
                  <span className="text-sm font-bold text-white">{mockUser.nickname.charAt(0)}</span>
                </div>
              </div>

              {/* ── 日期选择器 ── */}
              <DateSelector
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                availableDates={availableDates}
              />
            </div>
          </motion.header>

          {/* ── 内容区 ── */}
          <div className="px-4 py-3 pb-8">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <ArticleCardSkeleton key={i} />)}
              </div>
            ) : error ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                获取推文失败：{error}
              </p>
            ) : !selectedGroup || selectedGroup.items.length === 0 ? (
              <motion.div
                key={selectedDate}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 space-y-2"
              >
                <p className="text-3xl">📭</p>
                <p className="text-sm text-muted-foreground">
                  该日期暂无内容
                </p>
                <p className="text-xs" style={{ color: '#bbb' }}>每天上午 7:00 / 下午 3:00 自动更新</p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedDate}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {selectedGroup.items.map((article, index) => (
                  <ArticleCard key={article.id} article={article} index={index} />
                ))}
              </motion.div>
            )}
          </div>

        </PullToRefresh>
      </MobileLayout>
    </>
  );
};

export default HomePage;
