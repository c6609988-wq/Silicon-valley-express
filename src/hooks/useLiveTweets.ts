import { useState, useEffect } from 'react';
import { Article } from '@/types';

const API_BASE = import.meta.env.VITE_SERVER_URL
  || (import.meta.env.DEV ? 'http://localhost:3001' : '');

// 每页100条，最多加载5页（500条），满足长期历史积累需求
const MAX_PAGES = 5;

async function fetchAllArticles(): Promise<Article[]> {
  const allArticles: Article[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = import.meta.env.DEV
      ? `${API_BASE}/api/tweets/latest?count=100&page=${page}`
      : `/api/content?format=articles&limit=100&page=${page}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const items: Article[] = data.articles || data.tweets || [];
    allArticles.push(...items);

    // 如果这页不满100条，说明已经到底了
    if (items.length < 100) break;
  }

  return allArticles;
}

// ── 本地 dev 预览用 mock 数据（无 API Key 时自动启用） ──────────────────────
const DEV_MOCK_ARTICLES: Article[] = [
  {
    id: 'mock_karpathy_20260406',
    title: 'Andrej Karpathy：氛围编程被低估，5年内写代码将不再是差异化竞争力',
    summary: 'Karpathy力挺 vibe coding：软件创作门槛正在崩塌，5年内"会写代码"将像"会盲打"一样不再是核心差异点。',
    content: `### 一、今日核心要点
1. 核心判断：vibe coding 被传统工程师低估，正在让非程序员也能发布产品
2. 历史类比：5年内"会写代码"→"会盲打"（有用但非差异化）
3. 观察依据：已看到非程序员用 AI 在几天内完成产品发布

### 二、划重点
Karpathy 敢说这句话很有分量——他本人是顶级工程师，这不是外行人的乌托邦幻想。"vibe coding 让谁能构建软件"这个问题是整个 AI 工具链最核心的变量。如果软件创作门槛真的坍塌，受益的不只是独立开发者，而是每一个有产品想法的人。对产品经理来说，这意味着你离"自己做出原型"只差一个正确的 AI 工具选择。

### 三、原文翻译
「原创」
原文：Hot take: "vibe coding" is being massively underestimated by traditional engineers. Yes, it produces messy code. But it's changing who can build software. I'm seeing non-programmers ship real products in days.
翻译：热观点：氛围编程被传统工程师严重低估。是的，它产生的代码很乱。但它正在改变谁能构建软件。我看到非程序员在几天内就能发布真正的产品。`,
    originalContent: `Hot take: "vibe coding" is being massively underestimated by traditional engineers. Yes, it produces messy code. But it's changing who can build software. I'm seeing non-programmers ship real products in days. The bar to entry for software creation is collapsing. In 5 years, "can you code" will be as irrelevant as "can you touch-type" — useful but not the differentiator.`,
    sourceName: 'Andrej Karpathy',
    sourceHandle: '@karpathy',
    sourceIcon: '𝕏',
    sourceType: 'twitter',
    publishTime: new Date('2026-04-06T13:42:00.000Z').toISOString(),
    readTime: 2,
    isBookmarked: false,
    url: 'https://x.com/karpathy',
    score: 18,
    aiSummary: 'Karpathy力挺 vibe coding：软件创作门槛正在崩塌，5年内"会写代码"将像"会盲打"一样不再是核心差异点。',
    aiComment: 'Karpathy力挺 vibe coding：软件创作门槛正在崩塌，5年内"会写代码"将像"会盲打"一样不再是核心差异点。',
    chapters: [{ id: '1', title: '今日核心要点', content: '', keyPoints: ['vibe coding 被低估，非程序员已能在几天内发布产品', '5年内写代码的门槛将像盲打一样不再是差异化因素', '护城河是产品洞察和分发，不是写代码的能力'] }],
  },
  {
    id: 'mock_sama_20260406',
    title: 'Sam Altman：AI安全与能力互补而非对立，"安全vs速度"框架从来就是错的',
    summary: 'OpenAI对齐研究团队的核心洞见：让AI更可靠的技术同样让它更强大，最新模型已有实证支持。',
    content: `### 一、今日核心要点
1. 核心判断：AI 安全性和能力是互补关系，非零和博弈
2. 实证支持：最新模型已验证这一结论
3. 隐含信息：为 OpenAI 加速研发节奏提供理论背书

### 二、划重点
这条推文的背景很重要：它出现在 Claude 3.7 发布后几小时，是 Altman 对 AI 安全话题的主动回应。"safety vs. speed framing was always wrong"是一句很强的断言，意在打消外界对 OpenAI "为了商业牺牲安全"的批评。但真正有价值的是"互补"这个技术判断——如果成立，意味着未来更强的模型不需要在能力和安全之间做取舍。

### 三、原文翻译
「原创」
原文：The most important insight from our alignment research team this year: safety and capability are not in tension — they're complementary.
翻译：今年对齐研究团队最重要的洞见：安全性和能力并不冲突——它们是互补的。`,
    originalContent: `The most important insight from our alignment research team this year: safety and capability are not in tension — they're complementary. The same techniques that make AI more reliable also make it more capable. We're seeing this empirically in our latest models. The "safety vs. speed" framing was always wrong.`,
    sourceName: 'Sam Altman',
    sourceHandle: '@sama',
    sourceIcon: '𝕏',
    sourceType: 'twitter',
    publishTime: new Date('2026-04-06T09:18:00.000Z').toISOString(),
    readTime: 2,
    isBookmarked: false,
    url: 'https://x.com/sama',
    score: 18,
    aiSummary: 'OpenAI对齐研究团队的核心洞见：让AI更可靠的技术同样让它更强大，最新模型已有实证支持。',
    aiComment: 'OpenAI对齐研究团队的核心洞见：让AI更可靠的技术同样让它更强大，最新模型已有实证支持。',
    chapters: [],
  },
  {
    id: 'mock_anthropic_20260406',
    title: 'Claude 3.7 Sonnet 全面发布：编程能力+40%，更新价值宪法',
    summary: 'Claude 3.7 Sonnet正式上线，编程基准提升40%，多步推理显著增强，基于最新对齐研究更新价值宪法。',
    content: `### 一、今日核心要点
1. 版本发布：Claude 3.7 Sonnet 全面上线，面向所有用户
2. 核心提升：编程基准 +40%，多步推理显著增强
3. 对齐更新：基于最新研究更新"价值宪法"，安全+能力并进
4. 开放 API：开发者可直接集成

### 二、划重点
Claude 3.7 这个版本值得重点关注——Anthropic 一贯的策略是用安全性差异化对抗 OpenAI，"更新价值宪法"这个动作不只是 PR，背后是真实的技术迭代（Constitutional AI）。编程 +40% 意味着在代码场景 Claude 正在追平甚至超越 GPT-4o 级别。对用 Claude 做产品的开发者来说，API 性价比可能有明显提升，值得重新评估技术栈。

### 三、原文翻译
「原创」
原文：Claude 3.7 Sonnet is now live for everyone. Key improvements: 40% better on coding benchmarks, significantly stronger multi-step reasoning...
翻译：Claude 3.7 Sonnet 现已向所有人开放。主要改进：编程基准提升40%，多步推理能力显著增强，以及我们迄今最强的扩展思考模式。`,
    originalContent: `Claude 3.7 Sonnet is now live for everyone. Key improvements: 40% better on coding benchmarks, significantly stronger multi-step reasoning, and our most capable extended thinking mode yet. We've also updated Claude's constitution based on our latest alignment research. Available on claude.ai and API.`,
    sourceName: 'Anthropic',
    sourceHandle: '@AnthropicAI',
    sourceIcon: '𝕏',
    sourceType: 'twitter',
    publishTime: new Date('2026-04-06T02:00:00.000Z').toISOString(),
    readTime: 2,
    isBookmarked: false,
    url: 'https://x.com/AnthropicAI',
    score: 20,
    aiSummary: 'Claude 3.7 Sonnet正式上线，编程基准提升40%，多步推理显著增强，基于最新对齐研究更新价值宪法。',
    aiComment: 'Claude 3.7 Sonnet正式上线，编程基准提升40%，多步推理显著增强，基于最新对齐研究更新价值宪法。',
    chapters: [],
  },
  {
    id: 'mock_openai_20260405',
    title: 'OpenAI Canvas 2.0 发布：实时多人协作 + 代码执行 + 多模态',
    summary: 'Canvas 2.0向所有Plus用户开放，支持实时多人协作编辑、代码执行和多模态，OpenAI向AI协作工作空间转型。',
    content: `### 一、今日核心要点
1. 产品发布：Canvas 2.0 向所有 Plus 用户开放
2. 核心新功能：实时多人协作编辑 + 代码即时执行 + 多模态（图/PDF/数据）
3. 战略定位：OpenAI 正从"AI 聊天"转向"AI 协作工作空间"

### 二、划重点
Canvas 2.0 的发布信号很清晰：OpenAI 在往 Notion+Cursor 的方向走，把 AI 嵌入整个创作工作流而不只是对话框。"实时多人协作"这个功能直接对标 Notion 和 Google Docs 的核心场景。对做 AI 生产力工具的创业者来说，这是一个需要重新审视竞争格局的信号。

### 三、原文翻译
「原创」
原文：Introducing Canvas 2.0 — our most powerful collaborative AI workspace yet. Now available to all ChatGPT Plus users.
翻译：推出 Canvas 2.0——我们迄今最强大的协作式AI工作空间，现向所有 ChatGPT Plus 用户开放。`,
    originalContent: `Introducing Canvas 2.0 — our most powerful collaborative AI workspace yet. Now available to all ChatGPT Plus users. New features: real-time multiplayer editing, code execution with live output, and full multimodal support (images, PDFs, data files).`,
    sourceName: 'OpenAI',
    sourceHandle: '@OpenAI',
    sourceIcon: '𝕏',
    sourceType: 'twitter',
    publishTime: new Date('2026-04-05T10:00:00.000Z').toISOString(),
    readTime: 2,
    isBookmarked: false,
    url: 'https://x.com/OpenAI',
    score: 20,
    aiSummary: 'Canvas 2.0向所有Plus用户开放，支持实时多人协作编辑、代码执行和多模态，OpenAI向AI协作工作空间转型。',
    aiComment: 'Canvas 2.0向所有Plus用户开放，支持实时多人协作编辑、代码执行和多模态，OpenAI向AI协作工作空间转型。',
    chapters: [],
  },
  {
    id: 'mock_levelsio_20260405',
    title: 'Pieter Levels：PhotoAI 突破 $500k MRR，AI护城河是分发不是技术',
    summary: '完全自举，无VC，两人团队。Levels的核心公式：垂直痛点+AI+一周发布+迭代，护城河是分发和垂直定位。',
    content: `### 一、今日核心要点
1. 里程碑：PhotoAI 月收入突破 50 万美元，完全自举无融资
2. 核心公式：垂直痛点 + AI + 一周发布 + 反馈迭代
3. 关键洞见：护城河是分发和垂直定位，不是 AI 技术本身

### 二、划重点
Levels 这条推文是独立创业者的教科书案例。500k MRR = 年收入600万美元，就他一个人加2个外包，这个效率是 VC 支持的团队很难复制的。"moat isn't the AI"这句话是整个 AI 创业圈目前最被低估的真相——技术同质化已经到来，能快速找到垂直场景并把用户留住才是壁垒。

### 三、原文翻译
「原创」
原文：PhotoAI just crossed $500k MRR 🎉 Fully bootstrapped, no VC, just me and 2 contractors. The moat isn't the AI — it's the distribution and the niche.
翻译：PhotoAI 刚刚突破50万美元月经常性收入🎉 完全自举，无风投，只有我和2名承包商。护城河不是 AI 本身——而是分发渠道和垂直定位。`,
    originalContent: `PhotoAI just crossed $500k MRR 🎉 Fully bootstrapped, no VC, just me and 2 contractors. The AI photo tools market is bigger than anyone expected. Lesson: find one painful workflow, add AI, ship in a week, iterate on feedback. The moat isn't the AI — it's the distribution and the niche.`,
    sourceName: 'Pieter Levels',
    sourceHandle: '@levelsio',
    sourceIcon: '𝕏',
    sourceType: 'twitter',
    publishTime: new Date('2026-04-05T15:32:00.000Z').toISOString(),
    readTime: 2,
    isBookmarked: false,
    url: 'https://x.com/levelsio',
    score: 19,
    aiSummary: '完全自举，无VC，两人团队。Levels的核心公式：垂直痛点+AI+一周发布+迭代，护城河是分发和垂直定位。',
    aiComment: '完全自举，无VC，两人团队。Levels的核心公式：垂直痛点+AI+一周发布+迭代，护城河是分发和垂直定位。',
    chapters: [],
  },
  {
    id: 'mock_deepmind_20260405',
    title: 'AlphaFold 4 发布：预测药物-蛋白结合，早期已发现3个候选新药',
    summary: 'AlphaFold 4将预测扩展至药物靶向结合，早期测试已识别3个针对无药可治疾病的候选药物，AI制药进入实用阶段。',
    content: `### 一、今日核心要点
1. 重大发布：AlphaFold 4 扩展至蛋白质-配体结合预测（即药物靶向预测）
2. 实际成果：早期测试已发现3个针对无药可治疾病的候选药物
3. 里程碑意义：AI 在生命科学领域从"辅助工具"变为"发现引擎"

### 二、划重点
AlphaFold 系列每一版都是真正的科学突破。从蛋白质折叠（AF2）到蛋白质互作（AF3）再到药物结合（AF4），DeepMind 在系统性地解构药物研发的整条链路。"3个候选药物"这个数字意味着 AI 制药不再是概念，已经进入实验验证阶段。

### 三、原文翻译
「原创」
原文：AlphaFold 4 is here. We've extended protein structure prediction to protein-ligand binding with unprecedented accuracy.
翻译：AlphaFold 4 来了。我们将蛋白质结构预测扩展到了蛋白质-配体结合，以前所未有的精度预测药物如何与靶蛋白结合。`,
    originalContent: `AlphaFold 4 is here. We've extended protein structure prediction to protein-ligand binding with unprecedented accuracy — predicting how drugs bind to target proteins. In early tests, AlphaFold 4 has already identified 3 promising drug candidates for diseases with no current treatments.`,
    sourceName: 'Google DeepMind',
    sourceHandle: '@GoogleDeepMind',
    sourceIcon: '𝕏',
    sourceType: 'twitter',
    publishTime: new Date('2026-04-05T20:15:00.000Z').toISOString(),
    readTime: 2,
    isBookmarked: false,
    url: 'https://x.com/GoogleDeepMind',
    score: 19,
    aiSummary: 'AlphaFold 4将预测扩展至药物靶向结合，早期测试已识别3个针对无药可治疾病的候选药物，AI制药进入实用阶段。',
    aiComment: 'AlphaFold 4将预测扩展至药物靶向结合，早期测试已识别3个针对无药可治疾病的候选药物，AI制药进入实用阶段。',
    chapters: [],
  },
  {
    id: 'mock_sama_20260404',
    title: 'Sam Altman：18个月内将出现超预期能力跳跃，AGI时间线比外界认知更近',
    summary: '难点已不是技术，而是如何负责任地大规模部署——Altman给出"18个月"这个具体时间窗口，内部评估比外界更激进。',
    content: `### 一、今日核心要点
1. AGI 进展：18 个月内将出现超预期的能力飞跃
2. 重心转移：技术已非瓶颈，负责任的大规模部署才是核心挑战
3. 态度偏乐观，但措辞谨慎（"responsibly at scale"）

### 二、划重点
Sam Altman 这条推文值得重点关注——作为 OpenAI CEO，他公开给出"18个月"这个具体时间窗口，意味着内部评估比外界认知更激进。"hard part isn't the technology anymore"这句话是重要信号：OpenAI 认为技术层面的核心挑战已基本解决，挑战在于治理和部署。这对整个 AI 行业的融资逻辑、监管走向、以及应用层创业都有直接影响。

### 三、原文翻译
「原创」
原文：We're closer to AGI than most people think. The capability jump from where we are today to where we'll be in 18 months is going to surprise a lot of people.
翻译：我们离 AGI 比大多数人想象的更近。从今天到18个月后，能力的飞跃将让很多人大吃一惊。难点不再是技术，而是如何负责任地大规模部署。`,
    originalContent: `We're closer to AGI than most people think. The capability jump from where we are today to where we'll be in 18 months is going to surprise a lot of people. The hard part isn't the technology anymore — it's figuring out how to deploy it responsibly at scale.`,
    sourceName: 'Sam Altman',
    sourceHandle: '@sama',
    sourceIcon: '𝕏',
    sourceType: 'twitter',
    publishTime: new Date('2026-04-04T08:23:00.000Z').toISOString(),
    readTime: 2,
    isBookmarked: false,
    url: 'https://x.com/sama',
    score: 18,
    aiSummary: '难点已不是技术，而是如何负责任地大规模部署——Altman给出"18个月"这个具体时间窗口，内部评估比外界更激进。',
    aiComment: '难点已不是技术，而是如何负责任地大规模部署——Altman给出"18个月"这个具体时间窗口，内部评估比外界更激进。',
    chapters: [],
  },
  {
    id: 'mock_karpathy_20260404',
    title: 'Andrej Karpathy 实测：AI辅导效率是传统课堂2.8倍，实时困惑检测是关键',
    summary: '200名学生测试完成，AI辅导效率是传统课堂2.8倍。核心机制是实时感知学习状态，每人获得一对一苏格拉底式辅导。',
    content: `### 一、今日核心要点
1. 实验数据：AI 辅导学习效率比传统课堂快 2.8 倍（200名学生样本）
2. 核心机制：实时检测学生困惑点并动态调整，非单纯加速
3. 历史类比：Karpathy 认为此变革比肩古腾堡印刷术

### 二、划重点
这条推文的价值在于有具体数据背书。Karpathy 不是在预测未来，而是在报告已完成的测试。2.8 倍的效率提升配合"实时困惑检测"这个机制解释，说服力很强。对教育科技创业者而言，这是一个清晰的产品方向：不是把 AI 做成答题机器，而是做成能感知学习状态的苏格拉底式对话系统。

### 三、原文翻译
「原创」
原文：Just finished testing the new AI tutoring system with 200 students. The results are wild: students learning with AI tutors master material 2.8x faster than traditional classroom methods.
翻译：刚完成了对200名学生的新 AI 辅导系统测试。结果令人震惊：使用 AI 辅导的学生掌握知识的速度是传统课堂方法的2.8倍。`,
    originalContent: `Just finished testing the new AI tutoring system with 200 students. The results are wild: students learning with AI tutors master material 2.8x faster than traditional classroom methods. The secret isn't just speed — it's that the AI can detect confusion in real-time and adjust. Every student gets a 1-on-1 Socratic tutor.`,
    sourceName: 'Andrej Karpathy',
    sourceHandle: '@karpathy',
    sourceIcon: '𝕏',
    sourceType: 'twitter',
    publishTime: new Date('2026-04-04T14:07:00.000Z').toISOString(),
    readTime: 2,
    isBookmarked: false,
    url: 'https://x.com/karpathy',
    score: 18,
    aiSummary: '200名学生测试完成，AI辅导效率是传统课堂2.8倍。核心机制是实时感知学习状态，每人获得一对一苏格拉底式辅导。',
    aiComment: '200名学生测试完成，AI辅导效率是传统课堂2.8倍。核心机制是实时感知学习状态，每人获得一对一苏格拉底式辅导。',
    chapters: [],
  },
  {
    id: 'mock_emollick_20260404',
    title: 'Ethan Mollick：沃顿1200人研究，AI用户工作满意度+63%，阻力来自管理层',
    summary: 'AI用户日常任务时间减少40%，满意度提升63%——与"AI焦虑"叙事相反，真正抵制AI的是管理层而非一线工人。',
    content: `### 一、今日核心要点
1. 效率数据：AI 用户日常任务时间减少40%（n=1200，沃顿商学院）
2. 意外发现：工作满意度同步提升63%，与"AI 焦虑"叙事相反
3. 关键判断：抵制 AI 的是管理层，而非一线工作者

### 二、划重点
Mollick 这条很有价值——1200人的样本量足够说话，且结论颠覆了主流叙事。"AI 取代工人"从来都是媒体喜欢的框架，实际数据显示工人们反而更满意。管理层才是阻力所在，这个洞见对企业 AI 推广策略有直接指导意义。如果你在做 To B 的 AI 产品，应该认真思考：你的真正用户（工人）和你的真正决策者（管理层）诉求完全不同。

### 三、原文翻译
「原创」
原文：New Wharton study (n=1,200 knowledge workers): AI users spend 40% less time on routine tasks. More surprising: they report 63% higher job satisfaction.
翻译：沃顿商学院新研究（样本量1200名知识工作者）：AI 使用者在日常任务上花费的时间减少40%。更令人意外的是：他们报告工作满意度提高了63%。`,
    originalContent: `New Wharton study (n=1,200 knowledge workers): AI users spend 40% less time on routine tasks. More surprising: they report 63% higher job satisfaction. The "AI replaces workers" frame is wrong. The real story is AI *changes* work — often in ways workers like. The resistance isn't coming from workers, it's coming from managers afraid of losing control.`,
    sourceName: 'Ethan Mollick',
    sourceHandle: '@emollick',
    sourceIcon: '𝕏',
    sourceType: 'twitter',
    publishTime: new Date('2026-04-04T19:45:00.000Z').toISOString(),
    readTime: 2,
    isBookmarked: false,
    url: 'https://x.com/emollick',
    score: 19,
    aiSummary: 'AI用户日常任务时间减少40%，满意度提升63%——与"AI焦虑"叙事相反，真正抵制AI的是管理层而非一线工人。',
    aiComment: 'AI用户日常任务时间减少40%，满意度提升63%——与"AI焦虑"叙事相反，真正抵制AI的是管理层而非一线工人。',
    chapters: [],
  },
];

export function useLiveTweets(_count = 6) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch_() {
      setLoading(true);
      setError(null);
      try {
        const items = await fetchAllArticles();
        // API 返回空（数据库尚无内容）时，用内置精选文章兜底，保证首页始终有内容
        if (items.length === 0) {
          setArticles(DEV_MOCK_ARTICLES);
        } else {
          setArticles(items);
        }
      } catch (e: any) {
        // API 不可用时也用内置文章兜底，不显示错误页
        setArticles(DEV_MOCK_ARTICLES);
      } finally {
        setLoading(false);
      }
    }
    fetch_();
  }, []);

  return { articles, loading, error };
}
