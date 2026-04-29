import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import DateSelector from '@/components/home/DateSelector';
import ArticleCard from '@/components/home/ArticleCard';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import PullToRefresh from '@/components/common/PullToRefresh';
import SearchBar from '@/components/common/SearchBar';
import { ArticleCardSkeleton } from '@/components/ui/skeleton-card';
import { getGreetingMeta, mockUser } from '@/data/mockData';
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
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding]   = useState(false);
  const [selectedDate, setSelectedDate]       = useState(getBjTodayKey);
  const [showSearch, setShowSearch]           = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const { toast }    = useToast();
  const greeting     = getGreetingMeta();
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

  useEffect(() => {
    if (!loading && grouped.length > 0 && !availableDates.has(selectedDate)) {
      setSelectedDate(grouped[0].dateKey);
    }
  }, [loading, grouped, availableDates, selectedDate]);

  // 当前选中日期的内容（找不到则 undefined）
  const selectedGroup = grouped.find(g => g.dateKey === selectedDate);
  const visibleArticles = selectedGroup?.items.filter(article => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return true;

    return [
      article.title,
      article.summary,
      article.aiSummary,
      article.sourceName,
      article.sourceHandle,
      ...(article.tags ?? []),
    ].some(value => value?.toLowerCase().includes(keyword));
  }) ?? [];

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
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 leading-none">
                    <span className="text-[13px] font-medium" style={{ color: '#6B7280' }}>
                      {greeting.text}
                    </span>
                    <span className="text-[13px] font-medium" style={{ color: '#6B7280' }}>
                      {mockUser.nickname}
                    </span>
                    {greeting.icon === 'sun' ? (
                      <Sun aria-hidden="true" className="h-3.5 w-3.5 shrink-0" style={{ color: '#F97316' }} />
                    ) : (
                      <span aria-hidden="true" className="shrink-0 text-[14px] leading-none">🌙</span>
                    )}
                  </div>
                  <h1 className="mt-1 text-[21px] font-bold leading-none text-foreground" style={{ letterSpacing: 0 }}>
                    硅谷速递
                  </h1>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <motion.button
                    type="button"
                    aria-label="推送设置"
                    onClick={() => navigate('/settings')}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-secondary"
                    whileTap={{ scale: 0.94 }}
                  >
                    <Bell style={{ color: '#6B7280', width: 19, height: 19 }} />
                  </motion.button>
                  <motion.button
                    type="button"
                    aria-label="搜索"
                    onClick={() => setShowSearch(prev => !prev)}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-secondary"
                    whileTap={{ scale: 0.94 }}
                  >
                    <Search style={{ color: showSearch ? '#1A73E8' : '#6B7280', width: 20, height: 20 }} />
                  </motion.button>
                </div>
              </div>

              {showSearch && (
                <motion.div
                  className="mb-3"
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                >
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="搜索文章、频道、关键词..."
                  />
                </motion.div>
              )}

              {!showSearch && (
                <p className="text-[13px] leading-5 -mt-1 mb-2" style={{ color: '#9CA3AF' }}>{subTitle}</p>
              )}

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
            ) : !selectedGroup || visibleArticles.length === 0 ? (
              <motion.div
                key={selectedDate}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 space-y-2"
              >
                <p className="text-3xl">📭</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery.trim() ? '没有找到相关文章' : '该日期暂无内容'}
                </p>
                <p className="text-xs" style={{ color: '#bbb' }}>
                  {searchQuery.trim() ? '换个关键词试试看' : '每天上午 7:00 / 下午 3:00 自动更新'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`${selectedDate}-${searchQuery}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {visibleArticles.map((article, index) => (
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
