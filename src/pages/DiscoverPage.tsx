import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Flame, Sparkles, X } from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import SearchBar from '@/components/common/SearchBar';
import CategoryTabs from '@/components/common/CategoryTabs';
import PullToRefresh from '@/components/common/PullToRefresh';
import ChannelDetailModal from '@/components/discover/ChannelDetailModal';
import { ChannelCardSkeleton } from '@/components/ui/skeleton-card';
import { mockChannels } from '@/data/mockData';
import { Channel } from '@/types';
import { useToast } from '@/hooks/use-toast';

const DiscoverPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [channels, setChannels] = useState<Channel[]>(mockChannels);
  const [activeCategory, setActiveCategory] = useState('全部');

  // 动态计算有内容的分类标签（去重 + 保留顺序），始终把「全部」放第一位
  const categories = ['全部', ...Array.from(new Set(channels.map(ch => ch.category).filter(Boolean)))];
  const [isLoading, setIsLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const { toast } = useToast();

  // 收集所有已关注的 source ID，同步到后端
  const syncFollowedSources = useCallback((updatedChannels: Channel[]) => {
    const followedIds = updatedChannels
      .flatMap(ch => ch.sources || [])
      .filter(s => s.isFollowed)
      .map(s => s.id);

    // 存 localStorage（离线可用）
    localStorage.setItem('followed_source_ids', JSON.stringify(followedIds));

    // 同步到 Supabase
    fetch('/api/sources/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followedIds }),
    }).catch(() => {});
  }, []);

  // 初始化时从后端加载关注状态
  useEffect(() => {
    fetch('/api/sources/follow')
      .then(r => r.json())
      .then(({ followedIds }) => {
        if (!followedIds) return;
        const idSet = new Set(followedIds);
        setChannels(prev => prev.map(ch => ({
          ...ch,
          isSubscribed: ch.sources?.some(s => idSet.has(s.id)) ?? ch.isSubscribed,
          sources: ch.sources?.map(s => ({ ...s, isFollowed: idSet.has(s.id) })),
        })));
      })
      .catch(() => {});
  }, []);

  const handleSubscribe = (channelId: string) => {
    setChannels(prev => 
      prev.map(ch => 
        ch.id === channelId 
          ? { 
              ...ch, 
              isSubscribed: !ch.isSubscribed,
              sources: ch.sources?.map(s => ({ ...s, isFollowed: !ch.isSubscribed }))
            }
          : ch
      )
    );
    
    const channel = channels.find(ch => ch.id === channelId);
    if (channel && !channel.isSubscribed) {
      toast({
        title: "已关注",
        description: `你已成功关注「${channel.name}」的全部 ${channel.sources?.length || 0} 个信息源`,
      });
    }

    setChannels(prev => {
      const updated = prev.map(ch =>
        ch.id === channelId
          ? { ...ch, isSubscribed: !ch.isSubscribed, sources: ch.sources?.map(s => ({ ...s, isFollowed: !ch.isSubscribed })) }
          : ch
      );
      syncFollowedSources(updated);
      return updated;
    });

    if (selectedChannel && selectedChannel.id === channelId) {
      const updatedChannel = channels.find(ch => ch.id === channelId);
      if (updatedChannel) {
        setSelectedChannel({
          ...updatedChannel,
          isSubscribed: !updatedChannel.isSubscribed,
          sources: updatedChannel.sources?.map(s => ({ ...s, isFollowed: !updatedChannel.isSubscribed }))
        });
      }
    }
  };

  const handleFollowSource = (sourceId: string) => {
    setChannels(prev => {
      const updated = prev.map(ch => ({
        ...ch,
        sources: ch.sources?.map(s =>
          s.id === sourceId ? { ...s, isFollowed: !s.isFollowed } : s
        )
      }));
      syncFollowedSources(updated);
      return updated;
    });

    if (selectedChannel) {
      setSelectedChannel({
        ...selectedChannel,
        sources: selectedChannel.sources?.map(s =>
          s.id === sourceId ? { ...s, isFollowed: !s.isFollowed } : s
        )
      });
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  }, []);

  const filteredChannels = channels.filter(ch => {
    const matchesSearch = !searchQuery || ch.name.includes(searchQuery) || ch.description.includes(searchQuery);
    const matchesCategory = activeCategory === '全部' || ch.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <MobileLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-xl font-bold text-foreground mb-3">发现</h1>
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="搜索频道、博主..." />
        </div>

        <div className="py-2">
          <CategoryTabs categories={categories} active={activeCategory} onChange={setActiveCategory} />
        </div>

        {/* 推荐 Banner */}
        <AnimatePresence>
          {showBanner && (
            <motion.div
              className="mx-4 mb-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 relative"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <button
                onClick={() => setShowBanner(false)}
                className="absolute top-3 right-3 p-1"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">不知道关注啥？看看大家的选择</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 飙升榜标题 */}
        <div className="px-4 mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-foreground">飙升榜</span>
            <span className="text-xs text-muted-foreground">· 热门频道</span>
          </div>
        </div>

        {/* 频道排行列表 */}
        <div className="px-4 space-y-2 pb-4">
          {isLoading ? (
            [1, 2, 3].map(i => <ChannelCardSkeleton key={i} />)
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">没有找到相关频道</p>
            </div>
          ) : (
            filteredChannels.map((channel, index) => (
              <motion.div
                key={channel.id}
                className="bg-card rounded-2xl p-4 shadow-card cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedChannel(channel)}
              >
                <div className="flex items-center gap-3">
                  {/* 排名数字 */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    index < 3 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl">
                    {channel.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-foreground truncate">{channel.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{channel.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {channel.subscriberCount >= 1000 
                          ? `${(channel.subscriberCount / 1000).toFixed(1)}k` 
                          : channel.subscriberCount} 订阅
                      </span>
                      {index < 3 && (
                        <span className="text-xs text-orange-500 flex items-center gap-0.5">
                          🔥热门
                        </span>
                      )}
                    </div>
                  </div>

                  <motion.button
                    onClick={(e) => { e.stopPropagation(); handleSubscribe(channel.id); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                      channel.isSubscribed
                        ? 'bg-secondary text-muted-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {channel.isSubscribed ? (
                      <><Check className="w-3 h-3" /> 已关注</>
                    ) : (
                      <><Plus className="w-3 h-3" /> 关注</>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </PullToRefresh>

      <ChannelDetailModal
        channel={selectedChannel}
        onClose={() => setSelectedChannel(null)}
        onSubscribe={handleSubscribe}
        onFollowSource={handleFollowSource}
      />
    </MobileLayout>
  );
};

export default DiscoverPage;
