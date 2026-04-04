import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  Bookmark,
  Share2,
  Sparkles,
  List,
  MessageCircle,
  Languages,
  Loader2,
} from 'lucide-react';
import { Article } from '@/types';
import { Button } from '@/components/ui/button';
import { getSourceIcon, getSourceName } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

import { API_BASE } from '@/lib/apiBase';
const SERVER_URL = API_BASE;

const ArticleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showChinese, setShowChinese] = useState(true);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // 优先从 sessionStorage 读取（由 ArticleCard 点击时存入）
    const cached = sessionStorage.getItem(`article_${id}`);
    if (cached) {
      try {
        setArticle(JSON.parse(cached));
        setLoading(false);
        return;
      } catch (e) { /* 解析失败则走接口 */ }
    }

    // fallback：从接口获取
    fetch(`${SERVER_URL}/api/content?source_id=${id}&limit=1`)
      .then(r => { if (!r.ok) throw new Error('文章未找到'); return r.json(); })
      .then(data => {
        const item = data.items?.[0];
        if (!item) throw new Error('文章未找到');
        setArticle({
          id: item.external_id || item.id,
          title: item.title || item.author_name,
          summary: item.ai_analysis?.slice(0, 100) || '',
          content: item.translated_content || item.ai_analysis || '',
          originalContent: item.original_content || '',
          sourceName: item.author_name,
          sourceHandle: item.author_handle,
          sourceType: item.platform,
          sourceIcon: item.platform === 'x' ? '𝕏' : item.platform === 'youtube' ? '▶️' : '📰',
          publishTime: item.published_at,
          readTime: Math.max(1, Math.ceil((item.ai_analysis || '').length / 400)),
          isBookmarked: false,
          url: item.link || '#',
          aiSummary: item.ai_analysis?.slice(0, 200) || '',
          chapters: [],
        });
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? '已取消收藏' : '已收藏',
      description: isBookmarked ? '文章已从收藏中移除' : '可在「我的收藏」中查看',
      duration: 1000,
    });
  };

  const handleShare = () => {
    if (navigator.share && article) {
      navigator.share({ title: article.title, url: article.url });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: '链接已复制', description: '可以分享给朋友了' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center max-w-[430px] mx-auto">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">AI 正在加载分析结果…</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center max-w-[430px] mx-auto">
        <div className="text-center">
          <p className="text-muted-foreground">{error || '文章未找到'}</p>
          <Button variant="ghost" onClick={() => navigate('/')} className="mt-4">
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const publishDate = new Date(article.publishTime);
  const dateStr = `${publishDate.getMonth() + 1}月${publishDate.getDate()}日`;

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.button onClick={() => navigate('/')} whileTap={{ scale: 0.95 }}>
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </motion.button>
          <div className="flex items-center gap-3">
            <motion.button onClick={handleBookmark} whileTap={{ scale: 0.95 }}>
              <Bookmark
                className={`w-6 h-6 ${isBookmarked ? 'text-amber-400 fill-amber-400' : 'text-foreground'}`}
              />
            </motion.button>
            <motion.button onClick={handleShare} whileTap={{ scale: 0.95 }}>
              <Share2 className="w-6 h-6 text-foreground" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* 来源与日期 */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm">{getSourceIcon(article.sourceType)}</span>
          <span className="text-sm text-primary font-medium">
            {getSourceName(article.sourceType)}
          </span>
          <span className="text-sm text-muted-foreground">{dateStr}</span>
        </div>
      </div>

      {/* 标题 */}
      <div className="px-4 py-3">
        <h1 className="text-[22px] font-bold text-foreground leading-tight">{article.title}</h1>
      </div>

      {/* 作者信息 */}
      <div className="px-4 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
          {article.sourceIcon}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{article.sourceName}</p>
          <p className="text-xs text-muted-foreground">
            {article.sourceHandle || `@${article.sourceName.toLowerCase().replace(/\s/g, '')}`}
          </p>
        </div>
      </div>

      <div className="border-t border-border mx-4" />

      {/* AI 智能总结 */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">AI 智能总结</h2>
        </div>

        {/* 核心要点 */}
        {article.chapters && article.chapters.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-3">
              <List className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">核心要点</span>
            </div>
            <div className="space-y-3">
              {article.chapters.flatMap(ch => ch.keyPoints || []).map((point, i) => {
                const clean = point.replace(/\*\*/g, '');
                const colonIndex = clean.indexOf('：');
                const label = colonIndex !== -1 ? clean.slice(0, colonIndex + 1) : clean;
                const detail = colonIndex !== -1 ? clean.slice(colonIndex + 1) : '';
                const detailParts = detail.split(/(\d[\d,.%+\-]*)/g);
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-primary text-sm mt-0.5">●</span>
                    <span className="text-[15px] text-foreground leading-relaxed">
                      <span className="font-medium">{label}</span>
                      {detailParts.map((part, j) =>
                        /\d/.test(part) ? <strong key={j}>{part}</strong> : part
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 划重点 */}
        {article.aiComment && (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <MessageCircle className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold text-purple-500">划重点</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
              {article.aiComment?.replace(/\*\*/g, '')}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border mx-4" />

      {/* 原文内容 */}
      <div className="px-4 py-5 pb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getSourceIcon(article.sourceType)}</span>
            <h2 className="text-base font-bold text-foreground">原文内容</h2>
          </div>
          <motion.button
            onClick={() => window.open(article.url, '_blank')}
            className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-full text-xs text-muted-foreground"
            whileTap={{ scale: 0.95 }}
          >
            <ExternalLink className="w-3 h-3" />
            查看原文
          </motion.button>
        </div>

        {/* 中文翻译 / 原文切换 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowChinese(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              showChinese
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            <Languages className="w-4 h-4" />
            中文翻译
          </button>
          <button
            onClick={() => setShowChinese(false)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !showChinese
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            原文
          </button>
        </div>

        <div className="bg-secondary rounded-2xl p-5">
          <p className="text-[15px] text-foreground/80 leading-relaxed whitespace-pre-line">
            {showChinese ? article.content : (article.originalContent || article.content)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailPage;
