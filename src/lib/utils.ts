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
