import { Article } from '@/types';

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

export function getSeedArticles(): Article[] {
  return [
    {
      id: 'seed-deepseek-v4-preview-2026-04-29',
      title: 'DeepSeek-V4 Preview 正式开源上线',
      summary:
        'DeepSeek 发布 V4 预览版，开源双模型：V4-Pro 以 49B 激活参数对标顶级闭源模型，V4-Flash 主打快速经济，并支持百万上下文。',
      content:
        'DeepSeek-V4 Preview 正式开源发布，用 49B 激活参数对标顶级闭源模型，支持百万上下文。\n\nV4-Pro 采用 1.6T 总参数、49B 激活参数，主打高性能与高性价比。V4-Flash 采用 284B 总参数、13B 激活参数，定位快速、高效、经济。\n\n技术报告及开放权重已上传至 Hugging Face，DeepSeek-V4-Pro 折扣延长至 2026 年 5 月 31 日 15:59 UTC。',
      originalContent:
        'DeepSeek-V4 Preview is officially live and open-sourced. DeepSeek-V4-Pro: 1.6T total / 49B active params. DeepSeek-V4-Flash: 284B total / 13B active params. The DeepSeek-V4-Pro discount has been extended until May 31, 2026, 15:59 UTC.',
      sourceType: 'twitter',
      sourceName: 'DeepSeek',
      sourceHandle: 'deepseek_ai',
      sourceIcon: 'X',
      publishTime: minutesAgo(18),
      readTime: 2,
      isBookmarked: false,
      url: '#',
      tags: ['DeepSeek', '开源模型', '百万上下文'],
      aiSummary:
        'DeepSeek 发布 V4 预览版，开源 V4-Pro 与 V4-Flash，用双模型覆盖高性能和低成本两类需求。',
      aiComment:
        '49B 激活参数如果跑得住，意味着推理成本可能只有顶级闭源模型的一小部分。对做 AI 产品的团队来说，这不是“又一个开源模型”，而是定价逻辑要不要重新算一遍。\n\n折扣延期更像是拉长迁移窗口的商业动作。现在测试接入成本最低，但团队也应该同步评估后续切换成本，避免只盯当前价格。\n\n开放权重放到 Hugging Face 对国内模型尤其值得注意：社区可以直接跑本地推理，不必依赖 API，这会真实降低中小团队的锁定风险。',
      chapters: [
        {
          id: '1',
          title: 'V4-Pro 发布',
          content: '1.6T 总参数、49B 激活参数，性能对标顶级闭源模型。',
          keyPoints: [
            '1.6T 总参数，49B 激活参数，性能对标顶级闭源模型。',
            '激活参数只有 49B，意味着推理成本大幅低于同级闭源模型，性价比是核心卖点。',
          ],
        },
        {
          id: '2',
          title: 'V4-Flash 同步发布',
          content: '284B 总参数、13B 激活参数，定位快速经济。',
          keyPoints: [
            '284B 总参数，13B 激活参数，定位快速、高效、经济。',
            '双模型策略覆盖高性能和低成本两类需求，给开发者更灵活的选择空间。',
          ],
        },
        {
          id: '3',
          title: '折扣与开源权重',
          content: '折扣延长至 5 月 31 日，权重开放到 Hugging Face。',
          keyPoints: [
            'V4-Pro 折扣延长至 2026 年 5 月 31 日 15:59 UTC。',
            '技术报告和开放权重上传至 Hugging Face，降低本地推理和社区验证门槛。',
          ],
        },
      ],
      score: 92,
      contentCategory: 'product_signal',
      contentTypeLabel: '产品信号',
      priority: 'high',
      priorityWeight: 3,
      isHighlight: true,
    },
    {
      id: 'seed-openai-chatgpt-images-2-2026-04-29',
      title: 'This is ChatGPT Images 2.0',
      summary:
        'OpenAI 发布 ChatGPT Images 2.0（gpt-image-2），首次将推理能力引入图像生成，文字渲染英文准确率 99%，最高 2K 分辨率，单提示可生成 8 张连贯图像。',
      content:
        'OpenAI 发布 ChatGPT Images 2.0（gpt-image-2），将推理能力引入图像生成。\n\n这次更新重点在文字渲染、图像一致性和多图生成能力：英文文字渲染准确率达到 99%，最高支持 2K 分辨率，单个提示可生成 8 张连贯图像。\n\n这意味着图像模型不再只是生成“看起来像”的图片，而开始更像一个能理解任务约束的视觉执行器。',
      originalContent:
        'OpenAI released ChatGPT Images 2.0 (gpt-image-2), bringing reasoning into image generation with improved text rendering, up to 2K resolution, and coherent multi-image generation.',
      sourceType: 'youtube',
      sourceName: 'OpenAI',
      sourceHandle: 'OpenAI',
      sourceIcon: 'YouTube',
      publishTime: minutesAgo(12),
      readTime: 2,
      isBookmarked: false,
      url: '#',
      tags: ['OpenAI', '图像生成', 'gpt-image-2'],
      aiSummary:
        'OpenAI 发布 ChatGPT Images 2.0，把推理能力引入图像生成，重点提升文字渲染、多图一致性和高分辨率输出。',
      aiComment:
        '如果文字渲染准确率真的接近 99%，图像生成会从“创意草图工具”进一步靠近可交付的生产工具。海报、界面素材、教育图示这类场景会直接受益。\n\n单提示生成 8 张连贯图像也很关键，它解决的是系列化表达问题。对内容团队来说，这比单张图更接近真实工作流。\n\n需要继续观察的是中文、多语言排版和复杂信息图的表现。如果这些也稳定，图像模型会开始吃掉一部分轻量设计与营销素材生产流程。',
      chapters: [
        {
          id: '1',
          title: '推理进入图像生成',
          content: 'gpt-image-2 首次将推理能力引入图像生成。',
          keyPoints: [
            'ChatGPT Images 2.0（gpt-image-2）把推理能力引入图像生成。',
            '模型更强调理解任务约束，而不只是生成视觉上相似的图片。',
          ],
        },
        {
          id: '2',
          title: '文字与分辨率提升',
          content: '英文文字渲染准确率 99%，最高 2K 分辨率。',
          keyPoints: [
            '英文文字渲染准确率达到 99%，更适合海报、界面、说明图等场景。',
            '最高支持 2K 分辨率，提升输出可用性。',
          ],
        },
        {
          id: '3',
          title: '多图一致性',
          content: '单提示可生成 8 张连贯图像。',
          keyPoints: [
            '单提示可生成 8 张连贯图像，适合系列海报、分镜和成套素材。',
            '一致性能力提升后，图像模型更接近内容生产工作流。',
          ],
        },
      ],
      score: 92,
      contentCategory: 'product_signal',
      contentTypeLabel: '产品信号',
      priority: 'high',
      priorityWeight: 3,
      isHighlight: true,
    },
  ];
}
