// api/seed.js → GET /api/seed
// 一次性接口：向 Supabase 写入 4月4-6日 的示例精选推文（每天3条）
// 部署后访问 /api/seed 一次即可填充首页数据，之后由 Cron 每日自动更新
const { supabase } = require('../lib/supabase');

// 格式：ai_analysis 开头即为摘要，前150字会显示在卡片上
const SEED_ARTICLES = [
  // ─── 4月4日 ───────────────────────────────────────────────────────────────
  {
    source_id: 'sama_x',
    platform: 'x',
    external_id: 'seed_sama_20260404',
    author_name: 'Sam Altman',
    author_handle: '@sama',
    title: 'Sam Altman · 2026-04-04',
    original_content: `We're closer to AGI than most people think. The capability jump from where we are today to where we'll be in 18 months is going to surprise a lot of people. The hard part isn't the technology anymore — it's figuring out how to deploy it responsibly at scale.`,
    translated_content: `我们离AGI比大多数人想象的更近。从我们今天所处的位置到18个月后的位置，能力的飞跃将让很多人大吃一惊。现在的难点不再是技术本身，而是如何在大规模部署时负责任地推进。`,
    ai_analysis: `AGI时间线判断：Sam Altman明确表示18个月内将有重大能力跳跃，难点已转向规模化部署的责任问题。

### 一、今日核心要点
1. AGI进展：18个月内将出现超预期的能力飞跃
2. 重心转移：技术已非瓶颈，负责任的大规模部署才是核心挑战
3. 态度偏乐观，但措辞谨慎（"responsibly at scale"）

### 二、划重点
Sam Altman这条推文值得重点关注——作为OpenAI CEO，他公开给出"18个月"这个具体时间窗口，意味着内部评估比外界认知更激进。"hard part isn't the technology anymore"这句话是重要信号：OpenAI认为技术层面的核心挑战已基本解决，挑战在于治理和部署。这对整个AI行业的融资逻辑、监管走向、以及应用层创业都有直接影响。

### 三、原文翻译
[原创]
原文：We're closer to AGI than most people think...
翻译：我们离AGI比大多数人想象的更近。18个月内的能力跳跃将超出预期。难点已不是技术，而是如何负责任地大规模部署。`,
    content_type: 'short',
    link: 'https://x.com/sama',
    published_at: '2026-04-04T08:23:00.000Z',
    fetched_at: new Date().toISOString(),
    raw_data: { summary: 'Sam Altman：18个月内将出现超预期能力跳跃，AGI时间线比外界认知更近' },
  },
  {
    source_id: 'karpathy_x',
    platform: 'x',
    external_id: 'seed_karpathy_20260404',
    author_name: 'Andrej Karpathy',
    author_handle: '@karpathy',
    title: 'Andrej Karpathy · 2026-04-04',
    original_content: `Just finished testing the new AI tutoring system with 200 students. The results are wild: students learning with AI tutors master material 2.8x faster than traditional classroom methods. The secret isn't just speed — it's that the AI can detect confusion in real-time and adjust. Every student gets a 1-on-1 Socratic tutor. We're looking at the biggest transformation in education since Gutenberg.`,
    translated_content: `刚完成了对200名学生的新AI辅导系统测试。结果令人震惊：使用AI辅导的学生掌握知识的速度是传统课堂方法的2.8倍。秘诀不只是速度——AI能实时检测困惑并调整。每个学生都获得了一对一的苏格拉底式辅导。我们正在目睹自古腾堡以来教育领域最大的变革。`,
    ai_analysis: `AI教育实验数据：Karpathy测试结果显示AI辅导效率是传统课堂的2.8倍，核心优势在于实时感知困惑。

### 一、今日核心要点
1. 实验数据：AI辅导学习效率比传统课堂快2.8倍（200名学生样本）
2. 核心机制：实时检测学生困惑点并动态调整，非单纯加速
3. 历史类比：Karpathy认为此变革比肩古腾堡印刷术

### 二、划重点
这条推文的价值在于有具体数据背书。Karpathy不是在预测未来，而是在报告已完成的测试。2.8倍的效率提升配合"实时困惑检测"这个机制解释，说服力很强。对教育科技创业者而言，这是一个清晰的产品方向：不是把AI做成答题机器，而是做成能感知学习状态的苏格拉底式对话系统。

### 三、原文翻译
[原创]
原文：Just finished testing the new AI tutoring system...
翻译：200名学生测试完成，AI辅导效率是传统课堂2.8倍。关键是AI能实时感知困惑并调整，每人获得一对一苏格拉底辅导。`,
    content_type: 'short',
    link: 'https://x.com/karpathy',
    published_at: '2026-04-04T14:07:00.000Z',
    fetched_at: new Date().toISOString(),
    raw_data: { summary: 'Karpathy实测：AI辅导效率是传统课堂2.8倍，实时困惑检测是关键机制' },
  },
  {
    source_id: 'emollick_x',
    platform: 'x',
    external_id: 'seed_emollick_20260404',
    author_name: 'Ethan Mollick',
    author_handle: '@emollick',
    title: 'Ethan Mollick · 2026-04-04',
    original_content: `New Wharton study (n=1,200 knowledge workers): AI users spend 40% less time on routine tasks. More surprising: they report 63% higher job satisfaction. The "AI replaces workers" frame is wrong. The real story is AI *changes* work — often in ways workers like. The resistance isn't coming from workers, it's coming from managers afraid of losing control.`,
    translated_content: `沃顿商学院新研究（样本量1200名知识工作者）：AI使用者在日常任务上花费的时间减少40%。更令人意外的是：他们报告工作满意度提高了63%。"AI取代工人"的框架是错误的。真正的故事是AI改变了工作方式——通常是工人喜欢的方式。抵制并不来自工人，而是来自害怕失去控制权的管理者。`,
    ai_analysis: `沃顿研究：AI用户工作满意度提升63%，阻力来自管理层而非一线工人。

### 一、今日核心要点
1. 效率数据：AI用户日常任务时间减少40%（n=1200，沃顿商学院）
2. 意外发现：工作满意度同步提升63%，与"AI焦虑"叙事相反
3. 关键判断：抵制AI的是管理层，而非一线工作者

### 二、划重点
Mollick这条很有价值——1200人的样本量足够说话，且结论颠覆了主流叙事。"AI取代工人"从来都是媒体喜欢的框架，实际数据显示工人们反而更满意。管理层才是阻力所在，这个洞见对企业AI推广策略有直接指导意义。如果你在做To B的AI产品，应该认真思考：你的真正用户（工人）和你的真正决策者（管理层）诉求完全不同。

### 三、原文翻译
[原创]
原文：New Wharton study (n=1,200 knowledge workers)...
翻译：沃顿1200人研究：AI用户效率提升40%，满意度提升63%。AI在改变工作而非取代工人，阻力来自管理层。`,
    content_type: 'short',
    link: 'https://x.com/emollick',
    published_at: '2026-04-04T19:45:00.000Z',
    fetched_at: new Date().toISOString(),
    raw_data: { summary: '沃顿研究：AI用户工作满意度+63%，Mollick指出AI阻力来自管理层非工人' },
  },

  // ─── 4月5日 ───────────────────────────────────────────────────────────────
  {
    source_id: 'openai_x',
    platform: 'x',
    external_id: 'seed_openai_20260405',
    author_name: 'OpenAI',
    author_handle: '@OpenAI',
    title: 'OpenAI · 2026-04-05',
    original_content: `Introducing Canvas 2.0 — our most powerful collaborative AI workspace yet. Now available to all ChatGPT Plus users. New features: real-time multiplayer editing, code execution with live output, and full multimodal support (images, PDFs, data files). Canvas 2.0 is our vision for how AI and humans co-create. Try it now at chat.openai.com`,
    translated_content: `推出 Canvas 2.0——我们迄今最强大的协作式AI工作空间，现向所有ChatGPT Plus用户开放。新功能：实时多人协作编辑、带实时输出的代码执行，以及完整的多模态支持（图片、PDF、数据文件）。Canvas 2.0是我们对人机协作创造方式的愿景。立即前往 chat.openai.com 体验。`,
    ai_analysis: `OpenAI Canvas 2.0发布：面向Plus用户，支持实时多人协作、代码执行和多模态，重新定义人机协作工作流。

### 一、今日核心要点
1. 产品发布：Canvas 2.0向所有Plus用户开放
2. 核心新功能：实时多人协作编辑 + 代码即时执行 + 多模态（图/PDF/数据）
3. 战略定位：OpenAI正从"AI聊天"转向"AI协作工作空间"

### 二、划重点
Canvas 2.0的发布信号很清晰：OpenAI在往Notion+Cursor的方向走，把AI嵌入整个创作工作流而不只是对话框。"实时多人协作"这个功能直接对标Notion和Google Docs的核心场景，意味着OpenAI开始攻打知识工作协作这个巨大市场。对做AI生产力工具的创业者来说，这是一个需要重新审视竞争格局的信号。

### 三、原文翻译
[原创]
原文：Introducing Canvas 2.0...
翻译：Canvas 2.0正式发布，面向Plus用户。支持实时多人协作、代码执行和多模态，OpenAI将AI工作空间定位为人机协作创造的未来。`,
    content_type: 'short',
    link: 'https://x.com/OpenAI',
    published_at: '2026-04-05T10:00:00.000Z',
    fetched_at: new Date().toISOString(),
    raw_data: { summary: 'OpenAI发布Canvas 2.0：实时多人协作+代码执行+多模态，向AI协作工作空间转型' },
  },
  {
    source_id: 'levelsio_x',
    platform: 'x',
    external_id: 'seed_levelsio_20260405',
    author_name: 'Pieter Levels',
    author_handle: '@levelsio',
    title: 'Pieter Levels · 2026-04-05',
    original_content: `PhotoAI just crossed $500k MRR 🎉 Fully bootstrapped, no VC, just me and 2 contractors. The AI photo tools market is bigger than anyone expected. Lesson: find one painful workflow, add AI, ship in a week, iterate on feedback. The moat isn't the AI — it's the distribution and the niche. Any solopreneur can do this right now.`,
    translated_content: `PhotoAI刚刚突破50万美元月经常性收入🎉完全自举，无风投，只有我和2名承包商。AI照片工具市场比任何人预期的都大。经验教训：找一个痛苦的工作流程，加入AI，一周内发布，根据反馈迭代。护城河不是AI本身——而是分发渠道和垂直定位。任何独立创业者现在都可以做到这一点。`,
    ai_analysis: `Pieter Levels的PhotoAI突破500k MRR，完全自举，揭示AI SaaS创业核心公式：垂直定位+快速迭代+分发即护城河。

### 一、今日核心要点
1. 里程碑：PhotoAI月收入突破50万美元，完全自举无融资
2. 核心公式：垂直痛点 + AI + 一周发布 + 反馈迭代
3. 关键洞见：护城河是分发和垂直定位，不是AI技术本身

### 二、划重点
Levels这条推文是独立创业者的教科书案例。500k MRR = 年收入600万美元，就他一个人加2个外包，这个效率是VC支持的团队很难复制的。"moat isn't the AI"这句话是整个AI创业圈目前最被低估的真相——技术同质化已经到来，能快速找到垂直场景并把用户留住才是壁垒。对正在考虑AI创业的产品人来说，这是最值得反复读的一条。

### 三、原文翻译
[原创]
原文：PhotoAI just crossed $500k MRR...
翻译：PhotoAI月收入突破50万美元，完全自举。护城河不是AI，是分发和垂直定位。任何独立创业者现在都可以复制这个模式。`,
    content_type: 'short',
    link: 'https://x.com/levelsio',
    published_at: '2026-04-05T15:32:00.000Z',
    fetched_at: new Date().toISOString(),
    raw_data: { summary: 'Pieter Levels：PhotoAI突破500k MRR，完全自举，AI护城河是分发而非技术' },
  },
  {
    source_id: 'deepmind_x',
    platform: 'x',
    external_id: 'seed_deepmind_20260405',
    author_name: 'Google DeepMind',
    author_handle: '@GoogleDeepMind',
    title: 'Google DeepMind · 2026-04-05',
    original_content: `AlphaFold 4 is here. We've extended protein structure prediction to protein-ligand binding with unprecedented accuracy — predicting how drugs bind to target proteins. In early tests, AlphaFold 4 has already identified 3 promising drug candidates for diseases with no current treatments. This is what AI for science looks like.`,
    translated_content: `AlphaFold 4来了。我们将蛋白质结构预测扩展到了蛋白质-配体结合，以前所未有的精度预测药物如何与靶蛋白结合。在早期测试中，AlphaFold 4已经为目前无有效治疗方法的疾病识别出3个有前景的候选药物。这就是AI赋能科学的样子。`,
    ai_analysis: `AlphaFold 4发布：将预测能力扩展至药物-蛋白结合，早期已识别3个候选新药，标志AI制药进入实用阶段。

### 一、今日核心要点
1. 重大发布：AlphaFold 4扩展至蛋白质-配体结合预测（即药物靶向预测）
2. 实际成果：早期测试已发现3个针对无药可治疾病的候选药物
3. 里程碑意义：AI在生命科学领域从"辅助工具"变为"发现引擎"

### 二、划重点
AlphaFold系列每一版都是真正的科学突破，不是PR稿。从蛋白质折叠（AF2）到蛋白质互作（AF3）再到药物结合（AF4），DeepMind在系统性地解构药物研发的整条链路。"3个候选药物"这个数字意味着AI制药不再是概念，已经进入实验验证阶段。这对生物医药创业和AI+Science领域的判断有直接影响：下一个十年的重大突破很可能来自这里。

### 三、原文翻译
[原创]
原文：AlphaFold 4 is here...
翻译：AlphaFold 4发布，扩展至药物-蛋白结合预测，已识别3个候选新药。AI赋能科学从预测结构进化到发现药物。`,
    content_type: 'short',
    link: 'https://x.com/GoogleDeepMind',
    published_at: '2026-04-05T20:15:00.000Z',
    fetched_at: new Date().toISOString(),
    raw_data: { summary: 'AlphaFold 4发布：预测药物-蛋白结合，早期已发现3个候选新药，AI制药进入实用阶段' },
  },

  // ─── 4月6日（今天） ───────────────────────────────────────────────────────
  {
    source_id: 'anthropic_x',
    platform: 'x',
    external_id: 'seed_anthropic_20260406',
    author_name: 'Anthropic',
    author_handle: '@AnthropicAI',
    title: 'Anthropic · 2026-04-06',
    original_content: `Claude 3.7 Sonnet is now live for everyone. Key improvements: 40% better on coding benchmarks, significantly stronger multi-step reasoning, and our most capable extended thinking mode yet. We've also updated Claude's constitution based on our latest alignment research. Available on claude.ai and API. Full technical report: anthropic.com/research`,
    translated_content: `Claude 3.7 Sonnet现已向所有人开放。主要改进：编程基准提升40%，多步推理能力显著增强，以及我们迄今最强的扩展思考模式。我们还根据最新对齐研究更新了Claude的价值宪法。可在claude.ai和API上使用。完整技术报告：anthropic.com/research`,
    ai_analysis: `Claude 3.7 Sonnet发布：编码+40%，多步推理增强，更新价值宪法，是Anthropic 2026年最重要的版本迭代。

### 一、今日核心要点
1. 版本发布：Claude 3.7 Sonnet全面上线，面向所有用户
2. 核心提升：编程基准+40%，多步推理显著增强
3. 对齐更新：基于最新研究更新"价值宪法"，安全+能力并进
4. 开放API：开发者可直接集成

### 二、划重点
Claude 3.7这个版本值得重点关注——Anthropic一贯的策略是用安全性差异化对抗OpenAI，"更新价值宪法"这个动作不只是PR，背后是真实的技术迭代（Constitutional AI）。编程+40%意味着在代码场景Claude正在追平甚至超越GPT-4o级别。对用Claude做产品的开发者来说，API性价比可能有明显提升，值得重新评估技术栈。

### 三、原文翻译
[原创]
原文：Claude 3.7 Sonnet is now live for everyone...
翻译：Claude 3.7 Sonnet全面上线。编程+40%，多步推理增强，更新价值宪法。claude.ai和API均可使用。`,
    content_type: 'short',
    link: 'https://x.com/AnthropicAI',
    published_at: '2026-04-06T02:00:00.000Z',
    fetched_at: new Date().toISOString(),
    raw_data: { summary: 'Claude 3.7 Sonnet发布：编程+40%，多步推理增强，更新价值宪法，全面开放API' },
  },
  {
    source_id: 'sama_x',
    platform: 'x',
    external_id: 'seed_sama_20260406',
    author_name: 'Sam Altman',
    author_handle: '@sama',
    title: 'Sam Altman · 2026-04-06',
    original_content: `The most important insight from our alignment research team this year: safety and capability are not in tension — they're complementary. The same techniques that make AI more reliable also make it more capable. We're seeing this empirically in our latest models. The "safety vs. speed" framing was always wrong.`,
    translated_content: `今年对齐研究团队最重要的洞见：安全性和能力并不冲突——它们是互补的。让AI更可靠的技术同样让它更强大。我们在最新模型中从实证角度看到了这一点。"安全vs速度"的框架从一开始就是错的。`,
    ai_analysis: `Sam Altman：安全与能力互补而非对立，OpenAI内部已有实证支持，正面回应外界对AGI安全的质疑。

### 一、今日核心要点
1. 核心判断：AI安全和能力是互补关系，非零和博弈
2. 实证支持：最新模型已验证这一结论
3. 隐含信息：为OpenAI加速研发节奏提供理论背书

### 二、划重点
这条推文的背景很重要：它出现在Claude 3.7发布后几小时，是Altman对AI安全话题的主动回应。"safety vs. speed framing was always wrong"是一句很强的断言，意在打消外界对OpenAI"为了商业牺牲安全"的批评。但真正有价值的是"互补"这个技术判断——如果成立，意味着未来更强的模型不需要在能力和安全之间做取舍，这对整个行业的研发路径是个重要信号。

### 三、原文翻译
[原创]
原文：The most important insight from our alignment research team...
翻译：今年最重要洞见：安全和能力互补而非对立，最新模型已实证支持，"安全vs速度"框架从来就是错的。`,
    content_type: 'short',
    link: 'https://x.com/sama',
    published_at: '2026-04-06T09:18:00.000Z',
    fetched_at: new Date().toISOString(),
    raw_data: { summary: 'Sam Altman：AI安全与能力互补而非对立，最新模型已实证，反驳"安全vs速度"框架' },
  },
  {
    source_id: 'karpathy_x',
    platform: 'x',
    external_id: 'seed_karpathy_20260406',
    author_name: 'Andrej Karpathy',
    author_handle: '@karpathy',
    title: 'Andrej Karpathy · 2026-04-06',
    original_content: `Hot take: "vibe coding" is being massively underestimated by traditional engineers. Yes, it produces messy code. But it's changing who can build software. I'm seeing non-programmers ship real products in days. The bar to entry for software creation is collapsing. In 5 years, "can you code" will be as irrelevant as "can you touch-type" — useful but not the differentiator.`,
    translated_content: `热观点："氛围编程"被传统工程师严重低估了。是的，它产生的代码很乱。但它正在改变谁能构建软件。我看到非程序员在几天内就能发布真正的产品。进入软件创作的门槛正在崩塌。5年后，"你会写代码吗"将像"你会盲打吗"一样无关紧要——有用但不是差异化因素。`,
    ai_analysis: `Karpathy力挺"氛围编程"：软件创作门槛崩塌，5年内写代码将像盲打一样不再是核心差异点。

### 一、今日核心要点
1. 核心判断：vibe coding被传统工程师低估，正在让非程序员也能发布产品
2. 历史类比：5年内"会写代码"→"会盲打"（有用但非差异化）
3. 观察依据：已看到非程序员用AI在几天内完成产品发布

### 二、划重点
Karpathy敢说这句话很有分量——他本人是顶级工程师，这不是外行人的乌托邦幻想。"vibe coding让谁能构建软件"这个问题是整个AI工具链最核心的变量。如果软件创作门槛真的坍塌，受益的不只是独立开发者，而是每一个有产品想法的人。对产品经理来说，这意味着你离"自己做出原型"只差一个正确的AI工具选择。这条推文值得反复读。

### 三、原文翻译
[原创]
原文：Hot take: "vibe coding" is being massively underestimated...
翻译：氛围编程被严重低估。它让非程序员能在几天内发布产品。5年后写代码的门槛将像盲打一样不再是差异化因素。`,
    content_type: 'short',
    link: 'https://x.com/karpathy',
    published_at: '2026-04-06T13:42:00.000Z',
    fetched_at: new Date().toISOString(),
    raw_data: { summary: 'Karpathy：氛围编程被低估，5年内"会写代码"将不再是差异化竞争力' },
  },
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const { data, error } = await supabase
      .from('articles')
      .upsert(SEED_ARTICLES, { onConflict: 'external_id' });

    if (error) {
      console.error('[Seed] 写入失败:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log(`[Seed] 成功写入 ${SEED_ARTICLES.length} 条种子文章`);
    res.json({
      success: true,
      message: `已写入 ${SEED_ARTICLES.length} 条种子文章（4月4-6日，每天3条）`,
      dates: ['2026-04-04', '2026-04-05', '2026-04-06'],
      articles: SEED_ARTICLES.map(a => ({ id: a.external_id, author: a.author_name, date: a.published_at.slice(0, 10) })),
    });
  } catch (err) {
    console.error('[Seed] 异常:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
