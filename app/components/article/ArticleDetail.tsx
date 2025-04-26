import { useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { CalendarIcon, ExternalLinkIcon, TrashIcon, GlobeIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import type { Article } from "~/routes/types/articles";

// 从URL中提取域名
const extractDomain = (url: string) => {
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
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// 用于渲染Markdown的函数
const renderMarkdown = (markdown: string) => {
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

interface ArticleDetailProps {
  article: Article | null;
  onDelete: (id: number) => Promise<void>;
  onOpenOriginal: (url: string) => void;
}

export function ArticleDetail({ article, onDelete, onOpenOriginal }: ArticleDetailProps) {
  // 没有选中的文章
  if (!article) return null;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          {article.title}
        </h2>
        <div className="flex gap-3 shrink-0">
          {article.url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenOriginal(article.url)}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-2"
            >
              <ExternalLinkIcon className="w-4 h-4" />
              查看原文
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                删除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  您确定要删除这篇文章吗？此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(article.id)}>
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
        <CalendarIcon className="w-4 h-4" />
        <span>发布于: {formatDate(article.createdAt)}</span>
        {article.url && (
          <>
            <span className="mx-2">•</span>
            <GlobeIcon className="w-4 h-4" />
            <span>{extractDomain(article.url)}</span>
          </>
        )}
      </div>

      {article.comment && (
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-md border-l-4 border-blue-500 dark:border-blue-400">
          <p className="text-gray-700 dark:text-gray-300 italic">{article.comment}</p>
        </div>
      )}

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="mb-6 w-full justify-start space-x-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
          <TabsTrigger value="content" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 transition-all duration-200">文章内容</TabsTrigger>
          <TabsTrigger value="markdown" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 transition-all duration-200">Markdown</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="prose dark:prose-invert max-w-none">
          {article.content.split('\n\n').map((paragraph: string, index: number) => (
            <p key={index} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </TabsContent>

        <TabsContent value="markdown">
          <div
            className="prose dark:prose-invert max-w-none overflow-auto"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(article.aiMarkdownContent) }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function EmptyArticleDetail() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center p-6">
      <GlobeIcon className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
      <p className="text-gray-500 dark:text-gray-400 text-lg">请从左侧列表选择一篇文章</p>
      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">点击文章标题即可查看详情</p>
    </div>
  );
}
