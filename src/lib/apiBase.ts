/**
 * API 基础 URL 工具
 * - 本地开发（DEV）：指向 Express server http://localhost:3001
 * - 生产环境（Vercel）：使用相对路径 ''（同域名下的 /api/* Serverless Functions）
 */
const isDev = import.meta.env.DEV;
const localServer = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const API_BASE = isDev ? localServer : '';

/**
 * 生产/本地路径映射
 * 本地 Express 路由和 Vercel Serverless 路由命名略有不同
 */
export const API_PATHS = {
  // 推文列表
  tweetsLatest: isDev ? '/api/tweets/latest' : '/api/tweets',
  // 文章详情（通过 content 接口）
  content: '/api/content',
  // 信息源
  sources: '/api/sources',
  // 设置 / 提示词
  settings: '/api/settings',
  // AI 分析
  ai: '/api/ai',
  // 健康检查
  health: '/api/health',
};

/** 构建完整请求 URL */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
