import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  Bookmark,
  Share2,
  Loader2,
  Languages,
} from 'lucide-react';
import { Article } from '@/types';
import { Button } from '@/components/ui/button';
import { getSourceIcon, getSourceName } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/apiBase';

const SERVER_URL = API_BASE;

// ── 工具函数 ──────────────────────────────────────────────────
// 去除所有 Markdown 符号
function stripMd(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#{1,4}\s*/gm, '')
    .replace(/^\s*[-•]\s*/gm, '')
    .trim();
}

// 提取原文翻译块中的"翻译："部分
function parseTranslation(raw: string): string {
  const results: string[] = [];
  const blocks = raw.split(/\n[-─]{2,}\n?/);
  for (const block of blocks) {
    const buf: string[] = [];
    let inTrans = false;
    for (const line of block.split('\n')) {
      const t = line.trim();
      if (/^翻译[：:]/.test(t)) {
        inTrans = true;
        buf.push(t.replace(/^翻译[：:]/, '').trim());
      } else if (/^原文[：:]/.test(t) || /^「/.test(t) || /^\[/.test(t)) {
        inTrans = false;
      } else if (inTrans && t) {
        buf.push(t);
      }
    }
    const s = buf.join('').trim();
    if (s) results.push(s);
  }
  return results.join('\n\n');
}

// ── 核心解析函数（兼容 v4 / v3 / 旧格式三种 AI 输出）───────────
function parseAIAnalysis(aiText: string) {
  let keyPoint = '';   // 核心要点：一句话
  let insight = '';    // 深度解读：一段话
  let chineseTranslation = '';

  // ── v4 格式：核心要点 / 深度解读 / 原文翻译 ─────────────────
  if (/^核心要点\s*$/m.test(aiText)) {
    const kpMatch = aiText.match(/核心要点\s*\n([\s\S]*?)(?=\n深度解读|$)/);
    keyPoint = stripMd(kpMatch?.[1] || '').trim();

    const insMatch = aiText.match(/深度解读\s*\n([\s\S]*?)(?=\n原文翻译|$)/);
    insight = stripMd(insMatch?.[1] || '').trim();

    const trMatch = aiText.match(/原文翻译\s*\n([\s\S]*)/);
    chineseTranslation = parseTranslation(trMatch?.[1] || '');

  // ── v3 格式：一、今日核心要点 / 二、划重点 / 三、原文翻译 ────
  } else if (/一[、.]\s*(?:今日)?核心要点/.test(aiText)) {
    const kpMatch = aiText.match(/一[、.]\s*(?:今日)?核心要点[^\n]*\n([\s\S]*?)(?=二[、.]|$)/);
    const points = (kpMatch?.[1] || '')
      .split('\n')
      .filter(l => /^\d+[.)、]/.test(l.trim()))
      .map(l => stripMd(l.replace(/^\d+[.)、]\s*/, '').replace(/^[\w\s]+[：:]\s*/, '').trim()))
      .filter(s => s.length > 4);
    keyPoint = points[0] || '';

    const cmMatch = aiText.match(/二[、.]\s*划重点[^\n]*\n([\s\S]*?)(?=三[、.]|$)/);
    insight = stripMd(cmMatch?.[1] || '').trim();

    const trMatch = aiText.match(/三[、.]\s*原文翻译([\s\S]*)/);
    chineseTranslation = parseTranslation(trMatch?.[1] || '');

  // ── 旧格式：**核心要点提炼：** 等 ───────────────────────────
  } else {
    const pointRe = /\d+[.)、]\s*(?:\*\*[^*\n]*\*\*\s*[：:]\s*)?([^\n*]{6,})/g;
    let m = pointRe.exec(aiText);
    if (m) keyPoint = stripMd(m[1]).replace(/^[\w\s]+[：:]\s*/, '').trim();

    const cmMatch = aiText.match(/\*{0,2}划重点[：:]\*{0,2}\s*\n?([\s\S]*?)(?=\*{0,2}原文翻译|\*{0,2}三[、.]|$)/);
    insight = stripMd(cmMatch?.[1] || '').trim();

    const trMatch = aiText.match(/\*{0,2}原文翻译[：:]\*{0,2}\s*\n?([\s\S]*)/);
    chineseTranslation = parseTranslation(trMatch?.[1] || '');
  }

  // 最终兜底：如果仍然为空，从全文取第一句干净文字
  if (!keyPoint) {
    const clean = stripMd(aiText).replace(/\n+/g, ' ');
    keyPoint = clean.slice(0, 60).trim();
  }

  return { keyPoint, insight, chineseTranslation };
}

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

    const cached = sessionStorage.getItem(`article_${id}`);
    if (cached) {
      try { setArticle(JSON.parse(cached)); setLoading(false); return; } catch {}
    }

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
          aiSummary: item.ai_analysis || '',
          aiComment: item.ai_analysis || '',
          chapters: [],
        });
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({ title: isBookmarked ? '已取消收藏' : '已收藏', duration: 1000 });
  };

  const handleShare = () => {
    if (navigator.share && article) {
      navigator.share({ title: article.title, url: article.url });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: '链接已复制' });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center max-w-[430px] mx-auto">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">加载中…</p>
      </div>
    </div>
  );

  if (error || !article) return (
    <div className="min-h-screen bg-background flex items-center justify-center max-w-[430px] mx-auto">
      <div className="text-center">
        <p className="text-muted-foreground">{error || '文章未找到'}</p>
        <Button variant="ghost" onClick={() => navigate('/')} className="mt-4">返回首页</Button>
      </div>
    </div>
  );

  // 解析 AI 分析内容
  const aiRaw = article.aiComment || article.aiSummary || '';
  const { keyPoint, insight, chineseTranslation } = parseAIAnalysis(aiRaw);

  // 核心要点：始终过 stripMd，防止 ** 泄漏
  const keyPointText = stripMd(keyPoint || article.summary || '');

  // 中文内容回退
  const chineseContent = chineseTranslation || article.content || '';

  const publishDate = new Date(article.publishTime);
  const dateStr = `${publishDate.getMonth() + 1}月${publishDate.getDate()}日`;

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto">

      {/* ── 顶部导航 ──────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/60">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.button
            onClick={() => navigate('/')}
            whileTap={{ scale: 0.92 }}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <span className="text-[11px] font-bold tracking-widest text-primary uppercase">硅谷速递</span>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleBookmark}
              whileTap={{ scale: 0.92 }}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'text-amber-400 fill-amber-400' : 'text-foreground'}`} />
            </motion.button>
            <motion.button
              onClick={handleShare}
              whileTap={{ scale: 0.92 }}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
            >
              <Share2 className="w-4 h-4 text-foreground" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── 文章头部信息 ──────────────────────────────────── */}
      <div className="px-4 pt-5 pb-4">
        {/* 来源徽章 + 日期 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 rounded-full text-xs font-semibold text-primary">
            {getSourceIcon(article.sourceType)} {getSourceName(article.sourceType)}
          </span>
          <span className="text-xs text-muted-foreground">{dateStr}</span>
        </div>

        {/* 标题 */}
        <h1 className="text-[21px] font-bold text-foreground leading-snug mb-4">
          {article.title}
        </h1>

        {/* 作者 */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-base">
            {article.sourceIcon}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">{article.sourceName}</p>
            <p className="text-xs text-muted-foreground">
              {article.sourceHandle || `@${article.sourceName.toLowerCase().replace(/\s/g, '')}`}
            </p>
          </div>
        </div>
      </div>

      {/* ── 栏目一：核心要点 ──────────────────────────────── */}
      {keyPointText && (
        <div className="mx-4 mb-3 px-4 py-4 bg-primary/5 rounded-2xl border border-primary/10">
          <p className="text-xs font-bold text-primary mb-2 tracking-wide">核心要点</p>
          <p className="text-[15px] font-bold text-foreground leading-relaxed">
            {keyPointText}
          </p>
        </div>
      )}

      {/* ── 栏目二：深度解读 ──────────────────────────────── */}
      {insight && (
        <div className="mx-4 mb-3 px-4 py-4 bg-card rounded-2xl border border-border shadow-card">
          <p className="text-xs font-bold text-foreground mb-2 tracking-wide">深度解读</p>
          <p className="text-[14px] text-foreground/80 leading-[1.8]">
            {insight}
          </p>
        </div>
      )}

      {/* ── 栏目三：原文 ──────────────────────────────────── */}
      <div className="mx-4 mb-12 px-4 py-4 bg-card rounded-2xl border border-border shadow-card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-foreground tracking-wide">原文</p>
          <motion.button
            onClick={() => window.open(article.url, '_blank')}
            className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-xs text-muted-foreground font-medium"
            whileTap={{ scale: 0.95 }}
          >
            <ExternalLink className="w-3 h-3" />
            跳转原文
          </motion.button>
        </div>

        {/* 中文翻译 / 英文原文 切换 */}
        <div className="flex gap-2 mb-4 p-1 bg-secondary rounded-full">
          <button
            onClick={() => setShowChinese(true)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              showChinese ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            中文翻译
          </button>
          <button
            onClick={() => setShowChinese(false)}
            className={`flex-1 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              !showChinese ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            英文原文
          </button>
        </div>

        <p className="text-[14px] text-foreground/80 leading-relaxed whitespace-pre-line">
          {showChinese ? chineseContent : (article.originalContent || article.content)}
        </p>
      </div>
    </div>
  );
};

export default ArticleDetailPage;
