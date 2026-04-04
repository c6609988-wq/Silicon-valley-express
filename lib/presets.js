// server/config/presets.js

module.exports = {
  presets: [
    // ── 第一类：LLM 核心 / 官方来源 ──────────────────
    { id: 'openai_x', name: 'OpenAI', handle: '@OpenAI', platform: 'x', url: 'https://twitter.com/OpenAI', category: 'LLM核心/官方', score: 20, enabled: true },
    { id: 'anthropic_x', name: 'Anthropic', handle: '@AnthropicAI', platform: 'x', url: 'https://twitter.com/AnthropicAI', category: 'LLM核心/官方', score: 20, enabled: true },
    { id: 'deepmind_x', name: 'Google DeepMind', handle: '@GoogleDeepMind', platform: 'x', url: 'https://twitter.com/GoogleDeepMind', category: 'LLM核心/官方', score: 19, enabled: true },
    { id: 'sama_x', name: 'Sam Altman', handle: '@sama', platform: 'x', url: 'https://twitter.com/sama', category: 'LLM核心/官方', score: 18, enabled: true, note: '信噪比偏低，AI过滤权重调至最高' },
    { id: 'ylecun_x', name: 'Yann LeCun', handle: '@ylecun', platform: 'x', url: 'https://twitter.com/ylecun', category: 'LLM核心/官方', score: 15, enabled: true, note: '已声明不在X写原创，主要转发链接' },
    { id: 'openai_yt', name: 'OpenAI', handle: 'YouTube channel', platform: 'youtube', url: 'https://www.youtube.com/@OpenAI', category: 'LLM核心/官方', score: 18, enabled: true },

    // ── 第二类：深度分析与洞察 ────────────────────────
    { id: 'emollick_x', name: 'Ethan Mollick', handle: '@emollick', platform: 'x', url: 'https://twitter.com/emollick', category: '深度分析与洞察', score: 19, enabled: true },
    { id: 'karpathy_x', name: 'Andrej Karpathy', handle: '@karpathy', platform: 'x', url: 'https://twitter.com/karpathy', category: '深度分析与洞察', score: 18, enabled: true },
    { id: 'karpathy_yt', name: 'Andrej Karpathy', handle: 'YouTube channel', platform: 'youtube', url: 'https://www.youtube.com/@AndrejKarpathy', category: '深度分析与洞察', score: 17, enabled: true, note: '更新频率低，设为事件驱动而非日常轮询' },
    { id: 'aiexplained_yt', name: 'AI Explained', handle: 'YouTube channel', platform: 'youtube', url: 'https://www.youtube.com/@aiexplained-official', category: '深度分析与洞察', score: 17, enabled: true },
    { id: 'a16z_web', name: 'a16z / Sequoia', handle: 'a16z.com/ai', platform: 'rss', url: 'https://a16z.com/feed/', category: '深度分析与洞察', score: 18, enabled: true },

    // ── 第三类：产品与独立开发者 ──────────────────────
    { id: 'producthunt_web', name: 'Product Hunt', handle: 'producthunt.com', platform: 'rss', url: 'https://www.producthunt.com/feed', category: '产品与独立开发者', score: 19, enabled: true },
    { id: 'levelsio_x', name: 'Pieter Levels', handle: '@levelsio', platform: 'x', url: 'https://twitter.com/levelsio', category: '产品与独立开发者', score: 19, enabled: true, note: 'X推文无公开RSS，需TikHub抓取' },
    { id: 'huggingface_web', name: 'Hugging Face', handle: 'huggingface.co/posts', platform: 'rss', url: 'https://huggingface.co/blog/feed.xml', category: '产品与独立开发者', score: 18, enabled: true },
  ]
};
