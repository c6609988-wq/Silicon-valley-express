import { TwitterAggregationCard } from "@/components/home/TwitterAggregationCard";
import MobileLayout from "@/components/layout/MobileLayout";

const TwitterCardExample = () => {
  // 从 mockData 中提取的 Sam Altman GPT-5 推特
  const twitterData = {
    author: "Sam Altman",
    handle: "sama",
    publishTime: "2小时前",
    content: `Big news: GPT-5 预览版即将推出。

我们在复杂推理任务上实现了 50% 的提升。

新模型还具有 256K 上下文窗口和增强的多模态能力。

这是自 GPT-4 以来我们最大的飞跃。迫不及待让大家体验。

🧵 更多细节见下方...`,
    tags: ["AI", "GPT-5", "OpenAI"],
    aiSummary: "OpenAI 正式宣布 GPT-5 预览版即将发布，这是继 GPT-4 之后最重大的模型升级。新模型在推理、编程和多模态能力上都有显著提升。",
    aiComment: "这次发布时机非常微妙。一方面，Anthropic 的 Claude 3.5 刚刚在编程任务上超越 GPT-4；另一方面，Google 的 Gemini 2.0 也在紧锣密鼓筹备中。OpenAI 选择此时放出预览版，明显是想在竞争中保持领先地位。",
    stats: {
      replies: 1243,
      retweets: 8567,
      likes: 32451,
    },
  };

  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">推特信息聚合卡片</h1>
          <p className="text-muted-foreground">
            将 X (Twitter) 推文转化为结构化的信息卡片，包含 AI 摘要和深度点评
          </p>
        </div>

        <TwitterAggregationCard {...twitterData} />

        {/* 核心要点卡片 */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg p-6 space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-2xl">💡</span>
            核心要点
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="text-indigo-500 font-bold">•</span>
              <span>推理能力提升 50%：在复杂数学和逻辑推理任务上表现更优</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-500 font-bold">•</span>
              <span>上下文窗口扩展至 256K tokens，可处理更长文档</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-500 font-bold">•</span>
              <span>多模态能力增强：支持实时视频理解和生成</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-500 font-bold">•</span>
              <span>安全性改进：内置更强的内容过滤和对齐机制</span>
            </li>
          </ul>
        </div>
      </div>
    </MobileLayout>
  );
};

export default TwitterCardExample;
