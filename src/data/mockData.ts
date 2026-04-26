import { Article, Channel, DailySummary, User } from '@/types';

// 用户数据
export const mockUser: User = {
  id: 'user-1',
  nickname: 'Tyler',
  email: 'explorer@example.com',
  isVip: false,
  followedSourceCount: 12,
  readArticleCount: 156,
  joinDate: '2024-01-15',
};

// 信息源图标映射
export const getSourceIcon = (sourceType: string): string => {
  const icons: Record<string, string> = {
    twitter: '𝕏',
    youtube: '▶️',
    blog: '📝',
    wechat: '💬',
    website: '🌐',
    podcast: '🎙️',
  };
  return icons[sourceType] || '🌐';
};

// 信息源名称映射
export const getSourceName = (sourceType: string): string => {
  const names: Record<string, string> = {
    twitter: 'Twitter',
    youtube: 'YouTube',
    blog: 'Blog',
    wechat: '微信公众号',
    website: '网站',
    podcast: '播客',
  };
  return names[sourceType] || '其他';
};

// 格式化发布时间
export const formatPublishTime = (timeStr: string): string => {
  const now = new Date();
  const time = new Date(timeStr);
  const diff = now.getTime() - time.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return time.toLocaleDateString('zh-CN');
};

// 获取问候语
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
};

// Mock 文章数据
export const mockArticles: Article[] = [
  {
    id: 'article-1',
    title: 'a16z 深度解析：为什么它不只是一家基金',
    summary: '深入剖析 a16z 的战略逻辑、三个时代的投资方法论演变，以及 Databricks 案例如何完美诠释其投资哲学...',
    content: `硅谷早知道 · 深度解读\n\na16z（Andreessen Horowitz）不仅仅是一家风险投资基金，它是硅谷最具影响力的科技投资机构之一。\n\n从 2009 年成立以来，a16z 经历了三个重要的时代演变：\n\n**第一时代：平台化 VC（2009-2016）**\n首创了"平台型风投"概念，为被投公司提供远超资金的全方位支持。\n\n**第二时代：媒体化 VC（2016-2020）**\n通过 a16z Podcast、博客和 Future 杂志等媒体矩阵，建立了强大的思想领导力。\n\n**第三时代：全栈 VC（2020-至今）**\n注册为投资顾问，扩展到加密货币、生物科技等新领域。`,
    originalContent: `Silicon Valley Insider · Deep Dive\n\na16z (Andreessen Horowitz) is not just a venture capital fund — it is one of the most influential technology investment firms in Silicon Valley.\n\nSince its founding in 2009, a16z has gone through three major eras of evolution:\n\n**Era 1: Platform VC (2009–2016)**\nPioneered the "platform venture capital" concept, offering portfolio companies far more than just capital — providing comprehensive operational support.\n\n**Era 2: Media VC (2016–2020)**\nBuilt powerful thought leadership through the a16z Podcast, blog, and Future magazine media properties.\n\n**Era 3: Full-Stack VC (2020–Present)**\nRegistered as an investment advisor, expanding into cryptocurrency, biotech, and other new frontiers.`,
    sourceType: 'blog',
    sourceName: '硅谷早知道',
    sourceHandle: 'svinsider',
    sourceIcon: '📝',
    publishTime: new Date(Date.now() - 3 * 3600000).toISOString(),
    readTime: 15,
    isBookmarked: false,
    url: 'https://svinsider.com/a16z-deep-dive',
    tags: ['投资', 'a16z', '深度'],
    aiSummary: 'a16z（Andreessen Horowitz）经历了从平台化 VC 到媒体化 VC 再到全栈 VC 的三个时代演变。Databricks 的投资案例完美诠释了其投资哲学——在早期发现颠覆性技术，并通过全方位支持帮助企业成长。',
    aiComment: 'a16z 的演变路径几乎就是硅谷风投行业进化的缩影。从单纯的资金提供者，到平台化服务商，再到如今的全栈投资机构，Marc Andreessen 展示了 VC 行业如何持续创新以保持竞争力。值得注意的是，其媒体战略对后来 Sequoia、Tiger Global 等机构的内容化转型产生了深远影响。',
    chapters: [
      { id: 'ch-1', title: '核心要点', content: 'a16z 的三个时代演变', keyPoints: [
        '平台化 VC（2009-2016）：首创"平台型风投"，提供远超资金的全方位支持',
        '媒体化 VC（2016-2020）：通过 Podcast 和博客建立思想领导力',
        '全栈 VC（2020-至今）：注册为投资顾问，扩展到加密和生物科技',
        'Databricks 投资案例完美诠释了早期发现颠覆性技术的投资哲学',
      ] },
    ],
  },
  {
    id: 'article-2',
    title: 'OpenAI 发布 GPT-5 预览版，性能提升 50%',
    summary: 'Sam Altman 在推特宣布 GPT-5 即将发布，新模型在推理能力上有重大突破。据内部测试数据显示，GPT-5 在复杂数学推理任务上的准确率提升了 50%，同时支持更长的上下文窗口...',
    content: `Sam Altman (@sama) · 2h\n\nBig news: GPT-5 预览版即将推出。\n\n我们在复杂推理任务上实现了 50% 的提升。\n\n新模型还具有 256K 上下文窗口和增强的多模态能力。\n\n这是自 GPT-4 以来我们最大的飞跃。迫不及待让大家体验。\n\n🧵 更多细节见下方...`,
    originalContent: `Sam Altman (@sama) · 2h\n\nBig news: GPT-5 preview is coming soon.\n\nWe've achieved a 50% improvement in complex reasoning tasks.\n\nThe new model also features a 256K context window and enhanced multimodal capabilities.\n\nThis is our biggest leap since GPT-4. Can't wait for you all to try it.\n\n🧵 More details in thread...`,
    sourceType: 'twitter',
    sourceName: 'Sam Altman',
    sourceHandle: 'sama',
    sourceIcon: '𝕏',
    publishTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    readTime: 3,
    isBookmarked: false,
    url: 'https://x.com/sama/status/example',
    tags: ['AI', 'GPT-5', 'OpenAI'],
    aiSummary: 'OpenAI 正式宣布 GPT-5 预览版即将发布，这是继 GPT-4 之后最重大的模型升级。新模型在推理、编程和多模态能力上都有显著提升。',
    aiComment: '这次发布时机非常微妙。一方面，Anthropic 的 Claude 3.5 刚刚在编程任务上超越 GPT-4；另一方面，Google 的 Gemini 2.0 也在紧锣密鼓筹备中。OpenAI 选择此时放出预览版，明显是想在竞争中保持领先地位。',
    chapters: [
      { id: 'ch-2', title: '核心要点', content: 'GPT-5 实现 50% 推理性能提升', keyPoints: [
        '推理能力提升 50%：在复杂数学和逻辑推理任务上表现更优',
        '上下文窗口扩展至 256K tokens，可处理更长文档',
        '多模态能力增强：支持实时视频理解和生成',
        '安全性改进：内置更强的内容过滤和对齐机制',
      ] },
    ],
  },
  {
    id: 'article-3',
    title: 'Sam Altman: "AGI 比我们想象的更近"',
    summary: 'OpenAI CEO Sam Altman 在最新采访中表示，通用人工智能（AGI）的实现时间可能比外界预期的更早。他强调 OpenAI 正在加大安全研究投入...',
    content: `Lex Fridman 播客 · 第 421 期\n\nLex: Sam，我们来谈谈 AGI。时间线在哪里？\n\nSam: 我认为我们比大多数人意识到的更接近。过去 18 个月我们看到的进展非常惊人。\n\nLex: 是什么给了你这个信心？\n\nSam: Scaling laws 继续成立。而且我们看到了我们没有预测到的涌现能力。我们的模型能做的事情和人类能做的事情之间的差距正在以超出预期的速度缩小。\n\nLex: 安全方面呢？\n\nSam: 安全是我们的首要任务。今年我们将安全团队规模扩大了三倍。我们相信缓慢而谨慎地开发 AGI，给社会时间去适应。`,
    originalContent: `Lex Fridman Podcast · Episode 421\n\nLex: Sam, let's talk about AGI. Where are we on the timeline?\n\nSam: I think we're closer than most people realize. The progress we've seen in the last 18 months has been extraordinary.\n\nLex: What gives you that confidence?\n\nSam: The scaling laws continue to hold. And we're seeing emergent capabilities that we didn't predict. The gap between what our models can do and what humans can do is narrowing faster than expected.\n\nLex: What about safety?\n\nSam: Safety is our top priority. We've tripled our safety team this year. We believe in developing AGI slowly and carefully, giving society time to adapt.`,
    sourceType: 'youtube',
    sourceName: 'Lex Fridman',
    sourceHandle: 'lexfridman',
    sourceIcon: '▶️',
    publishTime: new Date(Date.now() - 5 * 3600000).toISOString(),
    readTime: 2,
    isBookmarked: false,
    url: 'https://youtube.com/watch?v=example',
    tags: ['AI', 'AGI', 'OpenAI'],
    aiSummary: 'Sam Altman 在 Lex Fridman 播客中表示 AGI 可能比预期更快到来。他指出 scaling laws 持续有效，模型展现出未预料到的涌现能力，同时 OpenAI 已将安全团队规模扩大三倍。',
    aiComment: 'Altman 的言论值得审慎解读。作为 OpenAI CEO，他既有动机营造乐观预期以吸引投资和人才，同时也需要通过强调安全来回应监管压力。不过，从技术角度看，近期大模型的进展确实超出了许多研究者的预期。',
    chapters: [
      { id: 'ch-3', title: '核心要点', content: 'AGI 发展路径讨论', keyPoints: [
        'AGI 时间线：比大多数人预期的更近，进展速度超出预期',
        'Scaling laws 持续有效：模型能力随规模扩大稳定提升',
        '涌现能力：大模型展现出未被预测的新能力',
        '安全投入：OpenAI 今年将安全团队规模扩大三倍',
      ] },
    ],
  },
  {
    id: 'article-4',
    title: 'a16z 领投 AI 编程助手，估值达 20 亿美元',
    summary: 'Andreessen Horowitz 宣布领投一家 AI 编程初创公司的 C 轮融资，投后估值达到 20 亿美元。这是 2026 年迄今为止最大的 AI 领域融资之一...',
    content: `Marc Andreessen (@pmarca) · 8h\n\n激动人心的消息：宣布我们最新的投资。\n\n我们领投了一家 AI 编程初创公司的 C 轮融资，投后估值 20 亿美元。\n\n为什么？因为我们相信 AI 原生开发工具将成为企业软件中最具影响力的品类。\n\n两年内每个开发者都将拥有 AI 编程助手。问题是谁能做出最好的那个。\n\n🧵👇`,
    originalContent: `Marc Andreessen (@pmarca) · 8h\n\nExcited to announce our latest investment.\n\nWe're leading the Series C for an AI coding startup at a $2B valuation.\n\nWhy? Because we believe AI-native development tools will be the most impactful category in enterprise software.\n\nEvery developer will have an AI pair programmer within 2 years. The question is who builds the best one.\n\nThread 🧵👇`,
    sourceType: 'blog',
    sourceName: 'Marc Andreessen',
    sourceHandle: 'pmarca',
    sourceIcon: '📝',
    publishTime: new Date(Date.now() - 24 * 3600000).toISOString(),
    readTime: 4,
    isBookmarked: false,
    url: 'https://a16z.com/ai-coding',
    tags: ['投资', 'AI', 'a16z'],
    aiSummary: 'a16z 领投一家 AI 编程初创公司的 C 轮融资，投后估值 20 亿美元。Marc Andreessen 认为 AI 原生开发工具将成为企业软件中最具影响力的品类，预计两年内每个开发者都将拥有 AI 编程助手。',
    aiComment: '20 亿美元的估值在 AI 编程赛道中属于领先水平，反映了市场对 AI 开发工具的高度看好。不过值得关注的是，GitHub Copilot、Cursor 等竞品已经建立了显著的先发优势，新进入者需要在差异化上下功夫。',
    chapters: [
      { id: 'ch-4', title: '核心要点', content: '投资详情', keyPoints: [
        'C 轮融资：投后估值 20 亿美元，2026 年最大 AI 融资之一',
        'a16z 领投：Marc Andreessen 亲自站台，看好 AI 编程赛道',
        '市场判断：AI 原生开发工具将成为企业软件最重要品类',
        '行业趋势：预计两年内每个开发者都将拥有 AI 编程助手',
      ] },
    ],
  },
  {
    id: 'article-5',
    title: 'Anthropic 发布安全研究报告：AI 对齐新突破',
    summary: 'Anthropic 安全团队公布了在 Constitutional AI 方面的最新研究成果，提出了新的对齐方法论。研究显示新方法可将模型有害输出减少 73%...',
    content: `Anthropic 研究博客\n\n今天我们发布了关于 AI 对齐的最新研究。\n\n主要发现：\n\n1. Constitutional AI 2.0 与之前的方法相比，有害输出减少了 73%。\n\n2. 我们新的"递归奖励建模"方法在模型规模化时展现了维持对齐性的前景。\n\n3. 我们引入了"可解释性探针"，可以检测模型何时即将产生潜在有害内容。\n\n这项研究代表了安全团队数月的工作成果，建立在我们致力于开发安全、有益且可理解的 AI 的承诺之上。\n\n完整论文：[链接]`,
    originalContent: `Anthropic Research Blog\n\nToday we're publishing our latest research on AI alignment.\n\nKey findings:\n\n1. Constitutional AI 2.0 reduces harmful outputs by 73% compared to previous methods.\n\n2. Our new "recursive reward modeling" approach shows promise for maintaining alignment as models scale.\n\n3. We introduce "interpretability probes" that can detect when a model is about to produce potentially harmful content.\n\nThis research represents months of work by our safety team and builds on our commitment to developing AI that is safe, beneficial, and understandable.\n\nFull paper: [link]`,
    sourceType: 'blog',
    sourceName: 'Anthropic Blog',
    sourceHandle: 'anthropic',
    sourceIcon: '📝',
    publishTime: new Date(Date.now() - 36 * 3600000).toISOString(),
    readTime: 10,
    isBookmarked: true,
    url: 'https://anthropic.com/blog/alignment',
    tags: ['AI', 'Anthropic', '安全'],
    aiSummary: 'Anthropic 发布最新 AI 对齐研究成果：Constitutional AI 2.0 将有害输出减少 73%，提出"递归奖励建模"方法来维持模型规模化时的对齐性，并引入可检测潜在有害内容的"可解释性探针"。',
    aiComment: 'Anthropic 一直将自己定位为"安全优先"的 AI 公司，这篇研究报告进一步巩固了这一形象。73% 的有害输出减少是一个显著的进步，但实际效果还需要在更大规模的部署中验证。值得注意的是，OpenAI 和 Google DeepMind 也在加大安全研究投入，行业整体的安全意识在提升。',
    chapters: [
      { id: 'ch-5', title: '核心要点', content: 'AI 对齐研究新突破', keyPoints: [
        'Constitutional AI 2.0：有害输出减少 73%，显著优于前代方法',
        '递归奖励建模：新方法可在模型规模化时维持对齐性',
        '可解释性探针：可提前检测模型即将产生的潜在有害内容',
        '团队投入：数月的安全团队研究成果，体现对安全 AI 的承诺',
      ] },
    ],
  },
];

// Mock 每日摘要
export const mockDailySummary: DailySummary = {
  date: new Date().toISOString(),
  greeting: getGreeting(),
  highlights: [
    'OpenAI GPT-5 预览版发布引发热议，Sam Altman 暗示 AGI 临近',
    'a16z 大手笔投资 AI 编程赛道',
    'Anthropic Claude 3.5 在多项测试中表现亮眼',
  ],
  topArticles: mockArticles.slice(0, 3),
  stats: {
    totalArticles: 12,
    newSources: 5,
    aiInsights: 8,
  },
};

// 频道数据 — 与 lib/presets.js 保持一致，即 App 实际采集的信息源
export const mockChannels: Channel[] = [
  // ── LLM 核心 / 官方 ──────────────────────────────────────────────────────
  {
    id: 'ch-openai',
    name: 'OpenAI',
    description: 'OpenAI 官方动态，ChatGPT、GPT 系列模型最新发布',
    icon: '🤖',
    category: 'AI 科技',
    sourceCount: 2,
    subscriberCount: 18600,
    isSubscribed: true,
    tags: ['AI', 'OpenAI', 'GPT'],
    sources: [
      { id: 'openai_x', name: 'OpenAI', platform: 'twitter', icon: '𝕏', url: 'https://x.com/OpenAI', description: 'OpenAI 官方 X 账号', followerCount: 6200000, isFollowed: true, lastUpdated: new Date().toISOString() },
      { id: 'openai_yt', name: 'OpenAI', platform: 'youtube', icon: '▶️', url: 'https://www.youtube.com/@OpenAI', description: 'OpenAI 官方 YouTube', followerCount: 980000, isFollowed: true, lastUpdated: new Date().toISOString() },
    ],
  },
  {
    id: 'ch-anthropic',
    name: 'Anthropic',
    description: 'Claude AI 研发方，安全 AI 研究前沿',
    icon: '🔬',
    category: 'AI 科技',
    sourceCount: 1,
    subscriberCount: 12400,
    isSubscribed: true,
    tags: ['AI', 'Claude', 'Anthropic'],
    sources: [
      { id: 'anthropic_x', name: 'Anthropic', platform: 'twitter', icon: '𝕏', url: 'https://x.com/AnthropicAI', description: 'Anthropic 官方账号', followerCount: 1800000, isFollowed: true, lastUpdated: new Date().toISOString() },
    ],
  },
  {
    id: 'ch-deepmind',
    name: 'Google DeepMind',
    description: 'Gemini、AlphaFold 等 Google AI 前沿研究',
    icon: '🧬',
    category: 'AI 科技',
    sourceCount: 1,
    subscriberCount: 9800,
    isSubscribed: true,
    tags: ['AI', 'Google', 'DeepMind'],
    sources: [
      { id: 'deepmind_x', name: 'Google DeepMind', platform: 'twitter', icon: '𝕏', url: 'https://x.com/GoogleDeepMind', description: 'Google DeepMind 官方账号', followerCount: 1200000, isFollowed: true, lastUpdated: new Date().toISOString() },
    ],
  },
  {
    id: 'ch-sama',
    name: 'Sam Altman',
    description: 'OpenAI CEO，AGI 进展与行业判断',
    icon: '👤',
    category: '人物观点',
    sourceCount: 1,
    subscriberCount: 9200,
    isSubscribed: false,
    tags: ['AI', 'OpenAI', 'AGI'],
    sources: [
      { id: 'sama_x', name: 'Sam Altman', platform: 'twitter', icon: '𝕏', url: 'https://x.com/sama', description: 'OpenAI CEO', followerCount: 3800000, isFollowed: false, lastUpdated: new Date().toISOString() },
    ],
  },
  {
    id: 'ch-ylecun',
    name: 'Yann LeCun',
    description: 'Meta AI 首席科学家，AI 学术与争议性观点',
    icon: '🎓',
    category: '人物观点',
    sourceCount: 1,
    subscriberCount: 6100,
    isSubscribed: false,
    tags: ['AI', 'Meta', 'LeCun'],
    sources: [
      { id: 'ylecun_x', name: 'Yann LeCun', platform: 'twitter', icon: '𝕏', url: 'https://x.com/ylecun', description: 'Meta AI 首席科学家', followerCount: 820000, isFollowed: false, lastUpdated: new Date().toISOString() },
    ],
  },

  // ── 深度分析与洞察 ────────────────────────────────────────────────────────
  {
    id: 'ch-emollick',
    name: 'Ethan Mollick',
    description: '沃顿教授，AI 实际应用与教育研究，数据驱动洞察',
    icon: '📊',
    category: '深度分析与洞察',
    sourceCount: 1,
    subscriberCount: 8700,
    isSubscribed: false,
    tags: ['AI', '教育', '研究'],
    sources: [
      { id: 'emollick_x', name: 'Ethan Mollick', platform: 'twitter', icon: '𝕏', url: 'https://x.com/emollick', description: '沃顿商学院 AI 研究者', followerCount: 560000, isFollowed: false, lastUpdated: new Date().toISOString() },
    ],
  },
  {
    id: 'ch-karpathy',
    name: 'Andrej Karpathy',
    description: '前 OpenAI / Tesla AI 负责人，深度技术洞察与 AI 教育',
    icon: '🧠',
    category: '深度分析与洞察',
    sourceCount: 2,
    subscriberCount: 11300,
    isSubscribed: false,
    tags: ['AI', '技术', '教育'],
    sources: [
      { id: 'karpathy_x', name: 'Andrej Karpathy', platform: 'twitter', icon: '𝕏', url: 'https://x.com/karpathy', description: '前 OpenAI 核心研究员', followerCount: 1100000, isFollowed: false, lastUpdated: new Date().toISOString() },
      { id: 'karpathy_yt', name: 'Andrej Karpathy', platform: 'youtube', icon: '▶️', url: 'https://www.youtube.com/@AndrejKarpathy', description: 'AI 深度教学视频', followerCount: 890000, isFollowed: false, lastUpdated: new Date().toISOString() },
    ],
  },
  {
    id: 'ch-aiexplained',
    name: 'AI Explained',
    description: '高质量 AI 科普 YouTube 频道，每期深度解读前沿模型',
    icon: '▶️',
    category: '深度分析与洞察',
    sourceCount: 1,
    subscriberCount: 5200,
    isSubscribed: false,
    tags: ['AI', '科普', 'YouTube'],
    sources: [
      { id: 'aiexplained_yt', name: 'AI Explained', platform: 'youtube', icon: '▶️', url: 'https://www.youtube.com/@aiexplained-official', description: 'AI 深度科普频道', followerCount: 420000, isFollowed: false, lastUpdated: new Date().toISOString() },
    ],
  },
  {
    id: 'ch-a16z',
    name: 'a16z',
    description: 'Andreessen Horowitz 深度文章，AI 投资趋势与行业洞察',
    icon: '💰',
    category: '深度分析与洞察',
    sourceCount: 1,
    subscriberCount: 7800,
    isSubscribed: false,
    tags: ['投资', 'VC', 'a16z'],
    sources: [
      { id: 'a16z_web', name: 'a16z Blog', platform: 'website', icon: '📝', url: 'https://a16z.com/feed/', description: 'a16z 官方博客 RSS', followerCount: 320000, isFollowed: false, lastUpdated: new Date().toISOString() },
    ],
  },

  // ── 产品与独立开发者 ──────────────────────────────────────────────────────
  {
    id: 'ch-producthunt',
    name: 'Product Hunt',
    description: '每日全球最新 AI 产品发布，发现下一个爆款工具',
    icon: '🚀',
    category: '产品与独立开发者',
    sourceCount: 1,
    subscriberCount: 8900,
    isSubscribed: false,
    tags: ['产品', '创业', 'AI工具'],
    sources: [
      { id: 'producthunt_web', name: 'Product Hunt', platform: 'website', icon: '📝', url: 'https://www.producthunt.com/feed', description: 'Product Hunt RSS', followerCount: 580000, isFollowed: false, lastUpdated: new Date().toISOString() },
    ],
  },
  {
    id: 'ch-levelsio',
    name: 'Pieter Levels',
    description: '独立开发者标杆，AI SaaS 创业实践，PhotoAI / Nomad List 创始人',
    icon: '⚡',
    category: '产品与独立开发者',
    sourceCount: 1,
    subscriberCount: 7200,
    isSubscribed: false,
    tags: ['独立开发', 'SaaS', 'AI创业'],
    sources: [
      { id: 'levelsio_x', name: 'Pieter Levels', platform: 'twitter', icon: '𝕏', url: 'https://x.com/levelsio', description: '独立开发者 / AI SaaS 创始人', followerCount: 540000, isFollowed: false, lastUpdated: new Date().toISOString() },
    ],
  },
  {
    id: 'ch-huggingface',
    name: 'Hugging Face',
    description: '开源 AI 社区，最新模型 / 数据集 / 工具发布',
    icon: '🤗',
    category: '产品与独立开发者',
    sourceCount: 1,
    subscriberCount: 6400,
    isSubscribed: false,
    tags: ['开源', 'AI', '模型'],
    sources: [
      { id: 'huggingface_web', name: 'Hugging Face Blog', platform: 'website', icon: '📝', url: 'https://huggingface.co/blog/feed.xml', description: 'Hugging Face 官方博客', followerCount: 280000, isFollowed: false, lastUpdated: new Date().toISOString() },
    ],
  },
];
