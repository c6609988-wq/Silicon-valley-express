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

// ── 从 AI 分析文本中解析结构化字段 ─────────────────────────────
function stripMd(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#{1,4}\s*/gm, '')
    .replace(/^\s*[-•]\s*/gm, '')
    .trim();
}

// 取字符串里第一句完整的话（以。！？结尾）
function firstSentence(text: string): string {
  const clean = stripMd(text);
  const m = clean.match(/^(.{5,80}[。！？])/);
  return m ? m[1].trim() : clean.split(/\n/)[0].slice(0, 60).trim();
}

function parseAIAnalysis(aiText: string) {
  // ── 一、核心要点 ──────────────────────────────────────
  const keypointsMatch = aiText.match(/一[、.]\s*(?:今日)?核心要点[^\n]*\n([\s\S]*?)(?=##|###|二[、.]|$)/);
  const keypointsRaw = keypointsMatch ? keypointsMatch[1] : '';
  const keyPoints = keypointsRaw
    .split('\n')
    .filter(l => /^\d+[.)、\s]/.test(l.trim()) || /^[-•\*]\s/.test(l.trim()))
    .map(l => stripMd(l.replace(/^\d+[.)、]\s*/, '')))
    .filter(s => s.length > 4);

  // ── 二、划重点 ────────────────────────────────────────
  const commentMatch = aiText.match(/二[、.]\s*划重点[^\n]*\n([\s\S]*?)(?=##|###|三[、.]|$)/);
  const comment = commentMatch ? stripMd(commentMatch[1]).trim() : '';

  // ── 一句话摘要：划重点第一句 → 要点第一条 → 首行 ───────
  let oneLiner = '';
  if (comment) {
    oneLiner = firstSentence(comment);
  } else if (keyPoints.length > 0) {
    oneLiner = firstSentence(keyPoints[0]);
  } else {
    oneLiner = firstSentence(aiText);
  }

  // ── 三、原文翻译 ──────────────────────────────────────
  const translationMatch = aiText.match(/三[、.]\s*原文翻译([\s\S]*)/);
  let chineseTranslation = '';
  if (translationMatch) {
    const results: string[] = [];
    const blocks = translationMatch[1].split(/\n[-─]{2,}\n?/);
    for (const block of blocks) {
      const buf: string[] = [];
      let inTrans = false;
      for (const line of block.split('\n')) {
        const t = line.trim();
        if (/^翻译[：:]/.test(t)) { inTrans = true; buf.push(t.replace(/^翻译[：:]/, '').trim()); }
        else if (/^原文[：:]/.test(t) || /^「/.test(t) || /^\[/.test(t)) { inTrans = false; }
        else if (inTrans && t) { buf.push(t); }
      }
      const text = buf.join('').trim();
      if (text) results.push(text);
    }
    chineseTranslation = results.join('\n\n');
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

  // 摘要回退：用 article.summary
  const summaryText = oneLiner || article.summary || '';

  // 中文内容回退
  const chineseContent = chineseTranslation || article.content || '';

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
              <Bookmark className={`w-6 h-6 ${isBookmarked ? 'text-amber-400 fill-amber-400' : 'text-foreground'}`} />
            </motion.button>
            <motion.button onClick={handleShare} whileTap={{ scale: 0.95 }}>
              <Share2 className="w-6 h-6 text-foreground" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* 来源 + 日期 */}
      <div className="px-4 pt-2 pb-1 flex items-center gap-2">
        <span className="text-sm">{getSourceIcon(article.sourceType)}</span>
        <span className="text-sm text-primary font-medium">{getSourceName(article.sourceType)}</span>
        <span className="text-sm text-muted-foreground">{dateStr}</span>
      </div>

      {/* 标题 */}
      <div className="px-4 py-3">
        <h1 className="text-[22px] font-bold text-foreground leading-tight">{article.title}</h1>
      </div>

      {/* 作者 */}
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

      {/* ── 栏目一：✨ 一句话摘要 ─────────────────────────── */}
      {summaryText && (
        <div className="px-4 py-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✨</span>
            <h2 className="text-base font-bold text-foreground">一句话摘要</h2>
          </div>
          <p className="text-[15px] font-bold text-primary leading-relaxed">
            {summaryText}
          </p>
        </div>
      )}

      {(keyPoints.length > 0 || comment) && <div className="border-t border-border mx-4" />}

      {/* ── 栏目二：🎯 智能总结 ──────────────────────────── */}
      {(keyPoints.length > 0 || comment) && (
        <div className="px-4 py-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎯</span>
            <h2 className="text-base font-bold text-foreground">智能总结</h2>
          </div>

          {/* 核心要点：合并成连贯段落 */}
          {keyPoints.length > 0 && (
            <p className="text-[14px] text-foreground leading-relaxed mb-4">
              {keyPoints
                .map(p => p.replace(/^\[.*?\][：:]\s*/, '').replace(/[。]$/, '').trim())
                .join('。') + '。'}
            </p>
          )}

          {/* 划重点 */}
          {comment && (
            <p className="text-[14px] text-foreground/75 leading-relaxed">
              {comment}
            </p>
          )}
        </div>
      )}

      <div className="border-t border-border mx-4" />

      {/* ── 栏目三：原文内容 ────────────────────────────── */}
      <div className="px-4 py-5 pb-12">
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

        {/* 中文 / 原文切换 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowChinese(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              showChinese ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}
          >
            <Languages className="w-4 h-4" />
            中文翻译
          </button>
          <button
            onClick={() => setShowChinese(false)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !showChinese ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}
          >
            原文
          </button>
        </div>

        <div className="bg-secondary rounded-2xl p-5">
          <p className="text-[15px] text-foreground/80 leading-relaxed whitespace-pre-line">
            {showChinese ? chineseContent : (article.originalContent || article.content)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailPage;
