import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://glwypidexupjtjquxzdr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsd3lwaWRleHVwanRqcXV4emRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA0NjIwOCwiZXhwIjoyMDkwNjIyMjA4fQ.dvlUofNph06D2lMYVwZux91E8XHwwYaIryV8AxtUQuA'
);

// ── DeepSeek V4 Preview 推文新闻卡片 ─────────────────────────
const aiOneliner = 'DeepSeek 发布 V4 预览版，开源双模型：V4-Pro（1.6T/49B激活参数）挑战顶级闭源模型，V4-Flash（284B/13B激活）高性价比；均支持 1M tokens 超长上下文。';
const aiComment  = 'DeepSeek 正在用「每隔半年打一次」的节奏逼迫硅谷加速，这次 V4 的 Hybrid Attention 架构让 1M 上下文成本断崖式下降，才是真正的杀手锏。';

const lines = [
  '核心要点',
  aiOneliner,
  '',
  '深度解读',
  'DeepSeek V4 的真正意义不在参数规模，而在效率架构。V4-Pro 在 1M token 场景下，单 token 推理 FLOPs 仅为 DeepSeek-V3 的 27%，KV cache 仅 10%——这意味着同等成本下，上下文窗口扩大了 10 倍。',
  '',
  '值得关注的三个信号：',
  '1. 开源+MIT 协议，权重直接上 Hugging Face，彻底降低了企业私有部署门槛。',
  '2. 同时兼容 OpenAI ChatCompletions 和 Anthropic APIs，切换成本几乎为零。',
  '3. 旧模型 deepseek-chat / deepseek-reasoner 将于 7 月 24 日退役，强制迁移窗口已开始倒计时。',
  '',
  '原文翻译',
  '原文：DeepSeek-V4 Preview is officially live & open-sourced! Welcome to the era of cost-effective 1M context length. V4-Pro: 1.6T total / 49B active params, rivaling top closed-source models. V4-Flash: 284B total / 13B active params.',
  '翻译：DeepSeek-V4 预览版正式上线并开源！欢迎进入高性价比 100 万 token 上下文时代。V4-Pro：共 1.6T / 激活 49B 参数，性能媲美顶级闭源模型。V4-Flash：共 284B / 激活 13B 参数。'
];
const aiAnalysis = lines.join('\n');

const article = {
  source_id:          'deepseek_x',
  platform:           'twitter',
  external_id:        'x_deepseek_v4_preview_2047516922263285776',
  author_name:        'DeepSeek',
  author_handle:      'deepseek_ai',
  title:              'DeepSeek-V4 Preview 正式开源上线',
  original_content:   'DeepSeek-V4 Preview is officially live & open-sourced! Welcome to the era of cost-effective 1M context length.\n\nDeepSeek-V4-Pro: 1.6T total / 49B active params. Performance rivaling the world\'s top closed-source models.\nDeepSeek-V4-Flash: 284B total / 13B active params.\n\nBoth models support 1M token context. Novel Hybrid Attention Architecture (Token-wise compression + DeepSeek Sparse Attention). V4-Pro requires only 27% single-token inference FLOPs vs V3 at 1M context. Three reasoning modes: Non-think / Think High / Think Max.\n\nPricing: Flash $0.14/$0.28 per M tokens input/output. Pro $1.74/$3.48 per M tokens. Compatible with OpenAI ChatCompletions & Anthropic APIs. Open-sourced under MIT license on Hugging Face.',
  translated_content: 'DeepSeek-V4 预览版正式上线并开源！欢迎进入高性价比 100 万 token 上下文时代。\n\nDeepSeek-V4-Pro：共 1.6T 参数 / 激活 49B，性能媲美全球顶级闭源模型。\nDeepSeek-V4-Flash：共 284B 参数 / 激活 13B。\n\n两款模型均支持 1M token 上下文。全新混合注意力架构（Token 级压缩 + DeepSeek 稀疏注意力），V4-Pro 在 1M 上下文场景下推理 FLOPs 仅为 V3 的 27%。提供三种推理模式：非思考 / 高思考 / 极限思考。\n\n定价：Flash 输入 $0.14 / 输出 $0.28（每百万 token）；Pro 输入 $1.74 / 输出 $3.48。兼容 OpenAI ChatCompletions 和 Anthropic APIs，MIT 协议开源发布于 Hugging Face。',
  ai_analysis:        aiAnalysis,
  content_type:       'short',
  link:               'https://x.com/deepseek_ai/status/2047516922263285776',
  published_at:       new Date('2026-04-24T10:24:00+08:00').toISOString(),
  fetched_at:         new Date().toISOString(),
  raw_data: {
    quality_score:    88,
    content_category: 'technical_insight',
    priority:         'high',
    is_visible:       true,
    aiOneliner,
    aiComment,
    score:        88,
    content_type: 'technical_insight',
    priority:     'high',
    tags:         ['DeepSeek', 'V4', '开源', 'LLM', 'AI模型'],
  },
};

const { data, error } = await supabase
  .from('articles')
  .upsert(article, { onConflict: 'external_id' })
  .select()
  .single();

if (error) {
  console.error('FAIL:', error.message);
  process.exit(1);
}
console.log('OK id=' + data.id);
console.log('title=' + data.title);
console.log('published_at=' + data.published_at);
console.log('priority=' + data.priority);
console.log('content_category=' + data.content_category);
