// 信息源类型
export interface Source {
  id: string;
  name: string;
  platform: 'twitter' | 'youtube' | 'blog' | 'wechat' | 'website' | 'podcast';
  icon: string;
  url: string;
  description: string;
  followerCount: number;
  isFollowed: boolean;
  lastUpdated: string;
}

// 频道/集合类型
export interface Channel {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  sourceCount: number;
  subscriberCount: number;
  isSubscribed: boolean;
  sources?: Source[];
  tags?: string[];
}

// 内容分类枚举
export type ContentCategory =
  | 'deep_analysis'
  | 'investment_signal'
  | 'product_signal'
  | 'technical_insight'
  | 'news'
  | 'founder_note'
  | 'low_value'
  | 'irrelevant'
  | '';

// 展示优先级
export type ContentPriority = 'high' | 'medium' | 'low' | 'discard';

// 文章类型
export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  originalContent?: string;
  sourceType: 'twitter' | 'youtube' | 'blog' | 'wechat' | 'website' | 'podcast';
  sourceName: string;
  sourceIcon: string;
  sourceHandle?: string;
  publishTime: string;
  readTime: number;
  isBookmarked: boolean;
  url: string;
  imageUrl?: string;
  tags?: string[];
  aiSummary?: string;
  aiComment?: string;
  chapters?: Chapter[];
  // AI 过滤流水线字段
  score?: number;
  contentCategory?: ContentCategory;
  contentTypeLabel?: string;
  priority?: ContentPriority;
  priorityWeight?: number;
  isHighlight?: boolean;
}

// 章节类型（用于 AI 分析）
export interface Chapter {
  id: string;
  title: string;
  content: string;
  keyPoints?: string[];
}

// 每日摘要
export interface DailySummary {
  date: string;
  greeting: string;
  highlights: string[];
  topArticles: Article[];
  stats: {
    totalArticles: number;
    newSources: number;
    aiInsights: number;
  };
}

// 用户类型
export interface User {
  id: string;
  nickname: string;
  email: string;
  avatar?: string;
  isVip: boolean;
  vipExpireDate?: string;
  followedSourceCount: number;
  readArticleCount: number;
  joinDate: string;
}
