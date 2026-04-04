import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Bell, BellOff, ChevronRight, FolderOpen, User, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { mockChannels } from '@/data/mockData';
import { Channel, Source } from '@/types';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

import { API_BASE } from '@/lib/apiBase';

interface PresetSource {
  id: string;
  name: string;
  handle: string;
  platform: string;
  category: string;
  score: number;
  enabled: boolean;
}

interface UserSource {
  id: string;
  name: string;
  handle: string;
  platform: string;
  url: string;
  enabled: boolean;
}

const FollowingPage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>(mockChannels);
  const { toast } = useToast();
  const [presets, setPresets] = useState<PresetSource[]>([]);
  const [userSources, setUserSources] = useState<UserSource[]>([]);
  const [loadingApi, setLoadingApi] = useState(false);

  const fetchSources = () => {
    setLoadingApi(true);
    fetch(`${API_BASE}/api/sources`)
      .then(r => r.json())
      .then(data => {
        setPresets(data.presets || []);
        setUserSources(data.userSources || []);
      })
      .catch(() => {/* 后端未启动时静默失败，使用 mock 数据 */})
      .finally(() => setLoadingApi(false));
  };

  useEffect(() => { fetchSources(); }, []);

  const handleToggleUserSource = async (id: string, enabled: boolean) => {
    try {
      await fetch(`${API_BASE}/api/sources/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      setUserSources(prev => prev.map(s => s.id === id ? { ...s, enabled } : s));
    } catch {
      toast({ title: '操作失败', description: '请确认后端服务已启动', variant: 'destructive' });
    }
  };

  const handleDeleteUserSource = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/sources/${id}`, { method: 'DELETE' });
      setUserSources(prev => prev.filter(s => s.id !== id));
      toast({ title: '已删除' });
    } catch {
      toast({ title: '删除失败', variant: 'destructive' });
    }
  };

  const subscribedCollections = channels.filter(ch => ch.isSubscribed);

  const followedSources: (Source & { collectionName: string })[] = [];
  channels.forEach(ch => {
    ch.sources?.forEach(source => {
      if (source.isFollowed && !followedSources.find(s => s.id === source.id)) {
        followedSources.push({ ...source, collectionName: ch.name });
      }
    });
  });

  const totalSourceCount = presets.length + userSources.length || followedSources.length + subscribedCollections.reduce((sum, ch) => sum + (ch.sourceCount || 0), 0);

  const handleToggleNotification = (channelId: string) => {
    setChannels(prev => prev.map(ch =>
      ch.id === channelId ? { ...ch, isSubscribed: !ch.isSubscribed } : ch
    ));
  };

  const platformIcon: Record<string, string> = { x: '𝕏', youtube: '▶️', rss: '📝' };
  const categoryColors: Record<string, string> = {
    'LLM核心/官方': 'bg-blue-100 text-blue-700',
    '深度分析与洞察': 'bg-purple-100 text-purple-700',
    '产品与独立开发者': 'bg-green-100 text-green-700',
  };

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">我的关注</h1>
            <span className="text-sm text-muted-foreground">{totalSourceCount} 个信息源</span>
          </div>
          <button onClick={fetchSources} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loadingApi ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 添加新信息源 */}
        <motion.button
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card shadow-card mb-5"
          onClick={() => navigate('/add-source')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">添加新信息源</p>
            <p className="text-xs text-muted-foreground">支持 Twitter/X、YouTube、RSS</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        {/* 预设信息源（来自后端） */}
        {presets.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">预设信息源</span>
              <span className="text-xs text-muted-foreground">({presets.length})</span>
            </div>
            <div className="space-y-0 bg-card rounded-2xl shadow-card overflow-hidden">
              {presets.map((source, index) => (
                <div
                  key={source.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${index < presets.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                    {platformIcon[source.platform] || '🌐'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold text-foreground truncate">{source.name}</h3>
                      <span className="text-xs text-muted-foreground">{source.handle}</span>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${categoryColors[source.category] || 'bg-secondary text-muted-foreground'}`}>
                      {source.category}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-amber-600">★ {source.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 用户自定义信息源 */}
        {userSources.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">我添加的信息源</span>
              <span className="text-xs text-muted-foreground">({userSources.length})</span>
            </div>
            <div className="space-y-0 bg-card rounded-2xl shadow-card overflow-hidden">
              {userSources.map((source, index) => (
                <div
                  key={source.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${index < userSources.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                    {platformIcon[source.platform] || '🌐'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{source.name}</h3>
                    <p className="text-xs text-muted-foreground">{source.handle || source.platform}</p>
                  </div>
                  <Switch
                    checked={source.enabled}
                    onCheckedChange={(v) => handleToggleUserSource(source.id, v)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 信息集合（mock 数据兜底） */}
        {presets.length === 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">信息集合</span>
              <span className="text-xs text-muted-foreground">({subscribedCollections.length})</span>
            </div>
            <div className="space-y-2">
              {subscribedCollections.map((channel, index) => (
                <motion.div
                  key={channel.id}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-card shadow-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl">
                    {channel.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{channel.name}</h3>
                    <p className="text-xs text-muted-foreground">{channel.sourceCount} 个信息源</p>
                  </div>
                  <button className="p-1">
                    {channel.isSubscribed ? (
                      <Bell className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <BellOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <Switch
                    checked={channel.isSubscribed}
                    onCheckedChange={() => handleToggleNotification(channel.id)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default FollowingPage;
