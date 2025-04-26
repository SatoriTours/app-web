// 从URL中提取域名
export const extractDomain = (url: string) => {
  if (!url) return '';

  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, ''); // 移除www前缀
  } catch (e) {
    console.error('无效的URL:', url);
    return '';
  }
};

// 格式化日期函数 - 只返回日期部分
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// 用于渲染Markdown的函数
export const renderMarkdown = (markdown: string) => {
  if (!markdown) return "无内容";

  // 简单解析Markdown的函数
  const html = markdown
    // 处理标题
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold my-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold my-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold my-5">$1</h1>')
    // 处理链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-500 hover:underline" target="_blank">$1</a>')
    // 处理粗体
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // 处理斜体
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // 处理代码块
    .replace(/```([\s\S]*?)```/gim, '<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto my-3"><code>$1</code></pre>')
    // 处理行内代码
    .replace(/`(.*?)`/gim, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm">$1</code>')
    // 处理列表
    .replace(/^\s*-\s*(.*$)/gim, '<li class="ml-5">$1</li>')
    // 处理段落
    .replace(/^(?!<[hl]|<li|<pre)(.+$)/gim, '<p class="my-2">$1</p>');

  return html;
};
