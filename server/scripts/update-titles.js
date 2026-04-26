require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TITLES = [
  { id: 'afd98e94-7774-4079-8781-c0e2fbf01469', title: 'AI 智能体市场潜力巨大，风险与机遇并存' },
  { id: '43d89f7c-1bf2-44e0-a205-b41bd2b7eee0', title: 'Hassabis：AGI 之路始于 1988 年的奥赛罗棋局' },
  { id: 'ef69b82c-ca9c-4fa7-8df7-31488ff04a9a', title: 'GPT-5.5 正式向 Plus/Pro/企业用户推送' },
  { id: 'eb4dbdf1-9764-45b4-a78b-68f6b542f2b7', title: 'OpenAI 发布 GPT-5.5：面向真实工作的新一代智能' },
  { id: 'c1fb18ba-f675-4a2d-ad9c-5e329d233461', title: 'Anthropic 研究：让 Claude 代替员工参与商业谈判' },
  { id: '2217159e-9821-44d1-8114-ae9b49a480a4', title: 'Anthropic Project Deal 完整报告已发布' },
];

async function run() {
  for (const { id, title } of TITLES) {
    const { error } = await supabase.from('articles').update({ title }).eq('id', id);
    if (error) {
      console.error(`✗ ${id.slice(0,8)}: ${error.message}`);
    } else {
      console.log(`✓ ${id.slice(0,8)} → ${title}`);
    }
  }
  // 同时更新其他作者（Pieter Levels, Sam Altman, Ethan Mollick）最新一条
  const authors = [
    { name: 'Pieter Levels', defaultTitle: '独立开发者 Pieter Levels 的最新动态' },
    { name: 'Sam Altman', defaultTitle: 'Sam Altman 关于 AI 未来的最新见解' },
    { name: 'Ethan Mollick', defaultTitle: 'Mollick：AI 工具在实际工作中的最新研究' },
  ];
  for (const { name, defaultTitle } of authors) {
    // 找最新一条且标题是占位符的
    const { data } = await supabase
      .from('articles')
      .select('id, title, original_content')
      .eq('author_name', name)
      .order('published_at', { ascending: false })
      .limit(1);
    if (data && data[0] && /·\s*\d{4}-\d{2}-\d{2}/.test(data[0].title)) {
      const { error } = await supabase.from('articles').update({ title: defaultTitle }).eq('id', data[0].id);
      console.log(error ? `✗ ${name}: ${error.message}` : `✓ ${name} → ${defaultTitle}`);
    }
  }
  console.log('完成');
}

run().catch(console.error);
