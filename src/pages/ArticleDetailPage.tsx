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

// 取第一句完整的话（以。！？结尾，长度 5-80）
function firstSentence(text: string): string {
  const clean = stripMd(text);
  const m = clean.match(/^(.{5,80}[。！？])/);
  return m ? m[1].trim() : clean.split(/\n/)[0].slice(0, 60).trim();
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

// ── 核心解析函数（兼容新旧两种 AI 输出格式）────────────────────
function parseAIAnalysis(aiText: string) {
  const isNewFormat = /一[、.]\s*(?:今日)?核心要点/.test(aiText);

  let keyPoints: string[] = [];
  let comment = '';
  let chineseTranslation = '';

  if (isNewFormat) {
    // ── 新格式（v3 提示词）：一、今日核心要点 / 二、划重点 / 三、原文翻译
    const kpMatch = aiText.match(/一[、.]\s*(?:今日)?核心要点[^\n]*\n([\s\S]*?)(?=二[、.]|$)/);
    keyPoints = (kpMatch?.[1] || '')
      .split('\n')
      .filter(l => /^\d+[.)、]/.test(l.trim()))
      .map(l => stripMd(
        l.replace(/^\d+[.)、]\s*/, '')       // 去序号
         .replace(/^[\w\s]+[：:]\s*/, '')    // 去"话题关键词："前缀
         .trim()
      ))
      .filter(s => s.length > 4);

    const cmMatch = aiText.match(/二[、.]\s*划重点[^\n]*\n([\s\S]*?)(?=三[、.]|$)/);
    comment = stripMd(cmMatch?.[1] || '').trim();

    const trMatch = aiText.match(/三[、.]\s*原文翻译([\s\S]*)/);
    chineseTranslation = parseTranslation(trMatch?.[1] || '');

  } else {
    // ── 旧格式（兼容旧数据）：**核心要点提炼：** 1. **事件**：xxx
    // 提取所有编号条目
    const pointRe = /\d+[.)、]\s*(?:\*\*[^*\n]*\*\*\s*[：:]\s*)?([^\n*]{6,})/g;
    let m;
    while ((m = pointRe.exec(aiText)) !== null) {
      const s = stripMd(m[1]).replace(/^[\w\s]+[：:]\s*/, '').trim();
      if (s.length > 4) keyPoints.push(s);
      if (keyPoints.length >= 7) break;
    }

    // 旧格式"划重点"
    const cmMatch = aiText.match(/\*{0,2}划重点[：:]\*{0,2}\s*\n?([\s\S]*?)(?=\*{0,2}原文翻译|\*{0,2}三[、.]|$)/);
    comment = stripMd(cmMatch?.[1] || '').trim();

    // 旧格式"原文翻译"
    const trMatch = aiText.match(/\*{0,2}原文翻译[：:]\*{0,2}\s*\n?([\s\S]*)/);
    chineseTranslation = parseTranslation(trMatch?.[1] || '');
  }

  // ── 一句话摘要：优先取划重点第一句，其次取要点连句，最后取全文首句
  let oneLiner = '';
  if (comment) {
    oneLiner = firstSentence(comment);
  } else if (keyPoints.length > 0) {
    oneLiner = firstSentence(keyPoints[0]);
  } else {
    oneLiner = firstSentence(aiText);   // stripMd 在 firstSentence 内调用，确保干净
  }

  return { oneLiner, keyPoints, comment, chineseTranslation };
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
  const { oneLiner, keyPoints, comment, chineseTranslation } = parseAIAnalysis(aiRaw);

  // 摘要：始终通过 stripMd 过滤，防止 ** 泄漏
  const summaryText = stripMd(oneLiner || article.summary || '');

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

      {/* ── 栏目一：✨ 一句话摘要 ─────────────────────────── */}
      {summaryText && (
        <div className="mx-4 mb-4 px-4 py-4 bg-primary/5 rounded-2xl border border-primary/10">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-base">✨</span>
            <span className="text-xs font-bold text-primary uppercase tracking-wide">一句话摘要</span>
          </div>
          <p className="text-[15px] font-bold text-primary leading-relaxed">
            {summaryText}
          </p>
        </div>
      )}

      {/* ── 栏目二：🎯 智能总结 ──────────────────────────── */}
      {(keyPoints.length > 0 || comment) && (
        <div className="mx-4 mb-4 px-4 py-4 bg-card rounded-2xl border border-border shadow-card">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-base">🎯</span>
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">智能总结</span>
          </div>

          {/* 核心要点段落 */}
          {keyPoints.length > 0 && (
            <p className="text-[14px] text-foreground leading-[1.75] mb-3">
              {keyPoints
                .map(p => p.replace(/^\[.*?\][：:]\s*/, '').replace(/[。]$/, '').trim())
                .join('。') + '。'}
            </p>
          )}

          {/* 划重点 */}
          {comment && (
            <div className="pt-3 border-t border-border/60">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {comment}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 栏目三：原文内容 ────────────────────────────── */}
      <div className="mx-4 mb-12 px-4 py-4 bg-card rounded-2xl border border-border shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{getSourceIcon(article.sourceType)}</span>
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">原文内容</span>
          </div>
          <motion.button
            onClick={() => window.open(article.url, '_blank')}
            className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-xs text-muted-foreground font-medium"
            whileTap={{ scale: 0.95 }}
          >
            <ExternalLink className="w-3 h-3" />
            查看原文
          </motion.button>
        </div>

        {/* 中文 / 原文切换 */}
        <div className="flex gap-2 mb-4 p-1 bg-secondary rounded-full">
          <button
            onClick={() => setShowChinese(true)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              showChinese
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            中文翻译
          </button>
          <button
            onClick={() => setShowChinese(false)}
            className={`flex-1 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              !showChinese
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            原文
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
