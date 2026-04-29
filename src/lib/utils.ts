import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 截取标题：≤20字全保留；>20字在15-20字范围内找自然标点断句，否则截20字 */
export function extractHeadline(text: string): string {
  if (!text) return '';
  if (text.length <= 20) return text;
  const match = text.match(/^[\s\S]{15,20}?[，。！？；、]/);
  if (match) return match[0];
  return text.slice(0, 20) + '…';
}

/**
 * 从 AI 一句话摘要提取新闻标题（主体+事件+结果）。
 * 截到第一个括号/逗号前的主干，保留核心事实，去除补充细节。
 * 例："OpenAI 发布 ChatGPT Images 2.0（gpt-image-2），首次将推理..." → "OpenAI 发布 ChatGPT Images 2.0"
 */
export function extractNewsHeadline(text: string): string {
  if (!text) return '';
  const clause = text.replace(/[（(，,。！？；].*/s, '').trim();
  if (clause.length >= 6 && clause.length <= 35) return clause;
  if (clause.length > 35) return clause.slice(0, 33) + '…';
  return text.slice(0, 30).trim();
}
