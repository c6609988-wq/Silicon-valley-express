import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Link2, Tag, FolderPlus, Check, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockChannels } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

import { API_BASE } from '@/lib/apiBase';

const platformOptions = [
  { id: 'twitter', name: 'Twitter / X', icon: '𝕏', placeholder: 'https://x.com/username' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', placeholder: 'https://youtube.com/@channel' },
  { id: 'blog', name: 'Blog / RSS', icon: '📝', placeholder: 'https://blog.example.com/rss' },
  { id: 'wechat', name: '微信公众号', icon: '💬', placeholder: '公众号名称或 ID' },
];

const AddSourcePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const collections = mockChannels.filter(ch => ch.isSubscribed);

  const handleSubmit = async () => {
    if (!sourceUrl.trim() || !sourceName.trim()) {
      toast({ title: "请填写完整信息", description: "信息源名称和链接地址不能为空", variant: "destructive" });
      return;
    }

    if (selectedPlatform === 'wechat') {
      toast({ title: "暂不支持", description: "微信公众号暂不支持，请使用 RSS 地址", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sourceName.trim(),
          url: sourceUrl.trim(),
          platform: selectedPlatform || undefined,
          collection_id: selectedCollection || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '提交失败');
      toast({ title: "添加成功", description: "已开始采集该信息源内容" });
      navigate(-1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '请确认后端服务已启动';
      toast({ title: "提交失败", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCollectionData = collections.find(c => c.id === selectedCollection);

  return (
    <MobileLayout showNav={false}>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold text-foreground">添加信息源</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 平台选择 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4" />
            选择平台
          </label>
          <div className="grid grid-cols-2 gap-2">
            {platformOptions.map((platform) => (
              <motion.button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`p-3 rounded-xl border-2 text-left transition-colors ${
                  selectedPlatform === platform.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{platform.icon}</span>
                  <span className="text-sm font-medium text-foreground">{platform.name}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 名称输入 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4" />
            信息源名称
          </label>
          <Input
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="例如：Sam Altman"
            className="h-11 rounded-xl bg-secondary border-0"
          />
        </motion.div>

        {/* 链接输入 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4" />
            链接地址
          </label>
          <Input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder={platformOptions.find(p => p.id === selectedPlatform)?.placeholder || '输入链接地址'}
            className="h-11 rounded-xl bg-secondary border-0"
          />
        </motion.div>

        {/* 归属集合 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <FolderPlus className="w-4 h-4" />
            归属集合（可选）
          </label>
          <button
            onClick={() => setShowCollectionPicker(!showCollectionPicker)}
            className="w-full flex items-center justify-between h-11 px-4 rounded-xl bg-secondary text-sm"
          >
            <span className={selectedCollectionData ? 'text-foreground' : 'text-muted-foreground'}>
              {selectedCollectionData ? `${selectedCollectionData.icon} ${selectedCollectionData.name}` : '选择集合'}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showCollectionPicker ? 'rotate-180' : ''}`} />
          </button>

          {showCollectionPicker && (
            <motion.div
              className="mt-2 bg-card rounded-xl shadow-card overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => {
                    setSelectedCollection(collection.id);
                    setShowCollectionPicker(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <span>{collection.icon}</span>
                  <span className="text-sm text-foreground">{collection.name}</span>
                  {selectedCollection === collection.id && (
                    <Check className="w-4 h-4 text-primary ml-auto" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* 提交按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl text-base"
          >
            {isSubmitting ? '提交中...' : '提交信息源'}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            提交后将立即开始采集内容
          </p>
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default AddSourcePage;
