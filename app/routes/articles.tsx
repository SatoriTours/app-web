import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Input } from "~/components/ui/input";
import { CalendarIcon, ExternalLinkIcon, TrashIcon, GlobeIcon } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "~/components/ui/resizable";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "~/components/ui/pagination";
import type { Route, Article, ArticlesResponse } from "./types/articles";

// 添加自定义样式，使滚动条只在滚动时显示
const scrollbarStyles = `
  /* 自定义滚动条样式 */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
    transition: background-color 0.2s ease;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.8);
  }

  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }

  /* 默认隐藏滚动条 */
  .hide-scrollbar::-webkit-scrollbar-thumb {
    background: transparent;
  }

  .hide-scrollbar.scrolling::-webkit-scrollbar-thumb,
  .hide-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
  }

  /* 暗色模式滚动条 */
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(107, 114, 128, 0.5);
  }

  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(107, 114, 128, 0.8);
  }
`;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "收藏文章" },
    { name: "description", content: "浏览和管理您收藏的文章" },
  ];
}

// 文章API接口
const fetchArticles = async (page: number, limit: number) => {
  try {
    console.log(`正在获取第${page}页文章...`);
    const response = await fetch(`/api/v2/articles?page=${page}`);
    console.log('API响应状态:', response.status);
    const result = await response.json();
    console.log('API响应数据:', result);

    if (result.code === 0) {
      return result.data as ArticlesResponse;
    } else {
      throw new Error(result.msg || "获取文章失败");
    }
  } catch (error) {
    console.error("获取文章列表失败:", error);
    throw error;
  }
};

// 删除文章API接口
const deleteArticle = async (id: number) => {
  try {
    const response = await fetch(`/api/v2/articles/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();

    if (result.code === 0) {
      return true;
    } else {
      throw new Error(result.msg || "删除文章失败");
    }
  } catch (error) {
    console.error("删除文章失败:", error);
    throw error;
  }
};

// 创建文章API接口
const createArticle = async (url: string, comment: string) => {
  try {
    const response = await fetch(`/api/v2/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, comment }),
    });
    const result = await response.json();

    if (result.code === 0) {
      return result.data;
    } else {
      throw new Error(result.msg || "添加文章失败");
    }
  } catch (error) {
    console.error("添加文章失败:", error);
    throw error;
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

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // 用于跟踪滚动状态
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 添加文章状态
  const [newArticleUrl, setNewArticleUrl] = useState("");
  const [newArticleComment, setNewArticleComment] = useState("");
  const [addingArticle, setAddingArticle] = useState(false);

  // 滚动事件处理
  const handleScrollStart = useCallback(() => {
    setIsScrolling(true);

    // 清除现有定时器
    if (scrollingTimeoutRef.current) {
      clearTimeout(scrollingTimeoutRef.current);
    }

    // 设置新定时器，滚动停止后隐藏滚动条
    scrollingTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
    };
  }, []);

  // 获取文章列表
  const loadArticles = useCallback(async (pageNum: number) => {
    if (loading) return;

    setLoading(true);
    console.log(`开始加载第${pageNum}页文章...`);

    try {
      const data = await fetchArticles(pageNum, 0);

      const articlesData = data.items || [];
      const paginationData = data.pagination || { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 };

      console.log(`获取到${articlesData.length}篇文章，总页数: ${paginationData.totalPages}`);
      setTotalPages(paginationData.totalPages);
      setArticles(articlesData);

      // 只在首次加载且没有已选择文章时，自动选择第一篇
      if (articlesData.length > 0 && !selectedArticle) {
        setSelectedArticle(articlesData[0]);
      }
    } catch (error) {
      console.error("加载文章失败:", error);
      setError((error as Error).message || "加载文章失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [loading, selectedArticle]);

  // 初始加载
  useEffect(() => {
    loadArticles(1);
  }, []);

  // 当页码变化时加载数据
  useEffect(() => {
    console.log(`页码变化: ${page}`);
    loadArticles(page);
  }, [page, loadArticles]);

  const handleLogout = () => {
    // 在实际应用中，这里应该调用登出API
    window.location.href = "/login";
  };

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
  };

  const handleDeleteArticle = async (id: number) => {
    try {
      await deleteArticle(id);

      // 更新文章列表
      setArticles(prev => prev.filter(article => article.id !== id));

      // 如果删除的是当前选中的文章，重置选中状态
      if (selectedArticle?.id === id) {
        setSelectedArticle(articles.length > 1 ? articles.find(a => a.id !== id) || null : null);
      }
    } catch (error) {
      console.error("删除文章失败:", error);
    }
  };

  const handleOpenOriginal = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  // 添加文章
  const handleAddArticle = async () => {
    if (!newArticleUrl) return;

    setAddingArticle(true);

    try {
      const result = await createArticle(newArticleUrl, newArticleComment);

      // 重新加载第一页以获取最新文章
      await loadArticles(1);

      // 重置表单
      setNewArticleUrl("");
      setNewArticleComment("");
    } catch (error) {
      console.error("添加文章失败:", error);
    } finally {
      setAddingArticle(false);
    }
  };

  // 页码改变处理
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // 生成分页导航项
  const renderPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5;

    // 确定显示哪些页码
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // 首页
    if (startPage > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={page === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // 中间页码
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => handlePageChange(i)} isActive={page === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // 末页
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={page === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // 记忆化选中文章的内容，防止频繁重渲染
  const selectedArticleContent = useMemo(() => {
    if (!selectedArticle) return null;

    return (
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedArticle.title}
          </h2>
          <div className="flex gap-2">
            {selectedArticle.url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenOriginal(selectedArticle.url)}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
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
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
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
                  <AlertDialogAction onClick={() => handleDeleteArticle(selectedArticle.id)}>
                    确认删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex items-center">
          <CalendarIcon className="w-4 h-4 mr-1" />
          发布于: {formatDate(selectedArticle.createdAt)}
        </div>

        {selectedArticle.comment && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-md">
            <p className="text-gray-700 dark:text-gray-300">{selectedArticle.comment}</p>
          </div>
        )}

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="content">文章内容</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="prose dark:prose-invert max-w-none">
            {selectedArticle.content.split('\n\n').map((paragraph: string, index: number) => (
              <p key={index} className="mb-4 text-gray-700 dark:text-gray-300">
                {paragraph}
              </p>
            ))}
          </TabsContent>

          <TabsContent value="markdown">
            <div
              className="prose dark:prose-invert max-w-none overflow-auto"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedArticle.aiMarkdownContent) }}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }, [selectedArticle]);

  return (
    <>
      {/* 注入自定义样式 */}
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />

      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 导航栏 */}
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Logo</span>
                </div>
                <nav className="ml-6 flex space-x-8">
                  <a href="/articles" className="inline-flex items-center px-1 pt-1 border-b-2 border-blue-500 text-sm font-medium text-gray-900 dark:text-gray-100">
                    文章
                  </a>
                  <a href="/diary" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300">
                    日记
                  </a>
                </nav>
              </div>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  登出
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-0 sm:px-6 lg:px-8 py-6">
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[calc(100vh-8rem)] bg-white dark:bg-gray-800 rounded-lg shadow-sm"
          >
            {/* 左侧文章列表 */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <div className="flex flex-col h-full">
                {/* 列表头部 */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 rounded-tl-lg">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      文章总数: {articles.length}
                    </span>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          添加文章
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>添加新文章</AlertDialogTitle>
                          <AlertDialogDescription>
                            请输入文章URL和备注信息。
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <label htmlFor="url" className="text-sm font-medium">
                              文章URL
                            </label>
                            <Input
                              id="url"
                              value={newArticleUrl}
                              onChange={(e) => setNewArticleUrl(e.target.value)}
                              placeholder="https://example.com/article"
                            />
                          </div>
                          <div className="grid gap-2">
                            <label htmlFor="comment" className="text-sm font-medium">
                              备注信息
                            </label>
                            <Input
                              id="comment"
                              value={newArticleComment}
                              onChange={(e) => setNewArticleComment(e.target.value)}
                              placeholder="可选: 添加备注信息"
                            />
                          </div>
                        </div>

                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleAddArticle}
                            disabled={!newArticleUrl || addingArticle}
                          >
                            {addingArticle ? "添加中..." : "添加文章"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* 列表内容 */}
                <div
                  ref={listContainerRef}
                  className={`flex-1 overflow-y-auto ${isScrolling ? 'scrolling' : ''} hide-scrollbar custom-scrollbar`}
                >
                  {error && (
                    <div className="m-4 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md p-4 shadow-sm">
                      {error}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadArticles(1)}
                        className="mt-2 w-full"
                      >
                        重试
                      </Button>
                    </div>
                  )}

                  {(() => {
                    // 加载中
                    if (loading && articles.length === 0) {
                      return (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          正在加载文章...
                        </div>
                      );
                    }

                    // 无文章状态
                    if (articles.length === 0 && !loading && !error) {
                      return (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          暂无文章，请添加
                        </div>
                      );
                    }

                    // 文章列表
                    return (
                      <div className="p-2">
                        <ul className="flex flex-col gap-2">
                          {articles.map((article) => (
                            <li key={article.id} className="group">
                              <button
                                onClick={() => handleSelectArticle(article)}
                                className={`flex flex-col w-full p-3 rounded-md text-left outline-none transition-all cursor-pointer ${
                                  selectedArticle?.id === article.id
                                    ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-700/30 border-l-4 border-transparent"
                                }`}
                              >
                                <span
                                  className={`font-medium w-full mb-2 ${
                                    selectedArticle?.id === article.id
                                      ? "text-blue-700 dark:text-blue-300"
                                      : "text-gray-800 dark:text-gray-200"
                                  }`}
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: "3",
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden"
                                  }}
                                >
                                  {article.title || "无标题文章"}
                                </span>
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                  {article.url && (
                                    <div className="flex items-center">
                                      <GlobeIcon className="w-3 h-3 mr-1" />
                                      <span className="truncate max-w-[120px]">{extractDomain(article.url)}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center">
                                    <CalendarIcon className="w-3 h-3 mr-1" />
                                    {formatDate(article.createdAt)}
                                  </div>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}

                  {/* 分页组件 */}
                  {totalPages > 1 && (
                    <div className="py-4 border-t border-gray-200 dark:border-gray-700">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(page > 1 ? page - 1 : 1)}
                              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>

                          {renderPaginationItems()}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(page < totalPages ? page + 1 : totalPages)}
                              className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            {/* 分隔线 */}
            <ResizableHandle withHandle />

            {/* 右侧文章详情 */}
            <ResizablePanel defaultSize={75}>
              <div
                className={`h-full overflow-y-auto p-6 ${isScrolling ? 'scrolling' : ''} hide-scrollbar custom-scrollbar`}
                onScroll={handleScrollStart}
              >
                {selectedArticle ? (
                  selectedArticleContent
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500 dark:text-gray-400">请选择一篇文章查看详情</p>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    </>
  );
}
