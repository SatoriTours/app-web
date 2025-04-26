import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { BookOpenIcon } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "~/components/ui/resizable";
import type { Route, Article } from "./types/articles";

// 导入分离的组件
import { ArticleList } from "~/components/article/ArticleList";
import { ArticleDetail, EmptyArticleDetail } from "~/components/article/ArticleDetail";

// 导入API和工具函数
import { fetchArticles, deleteArticle, createArticle } from "~/components/article/api";
import { scrollbarStyles } from "~/components/article/styles";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "收藏文章" },
    { name: "description", content: "浏览和管理您收藏的文章" },
  ];
}

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  // 用于跟踪滚动状态
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const handleAddArticle = async (url: string, comment: string): Promise<void> => {
    try {
      await createArticle(url, comment);

      // 重新加载第一页以获取最新文章
      await loadArticles(1);
    } catch (error) {
      console.error("添加文章失败:", error);
      throw error;
    }
  };

  // 页码改变处理
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <>
      {/* 注入自定义样式 */}
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />

      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 导航栏 */}
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
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
        <main className="flex-grow max-w-7xl w-full mx-auto px-0 sm:px-6 lg:px-8 py-6 fade-in">
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[calc(100vh-8rem)] bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* 左侧文章列表 */}
            <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
              <ArticleList
                articles={articles}
                selectedArticle={selectedArticle}
                loading={loading}
                error={error}
                page={page}
                totalPages={totalPages}
                onSelectArticle={handleSelectArticle}
                onRetry={() => loadArticles(1)}
                onPageChange={handlePageChange}
                onAddArticle={handleAddArticle}
              />
            </ResizablePanel>

            {/* 分隔线 */}
            <ResizableHandle withHandle />

            {/* 右侧文章详情 */}
            <ResizablePanel defaultSize={72}>
              <div
                className={`h-full overflow-y-auto ${isScrolling ? 'scrolling' : ''} hide-scrollbar custom-scrollbar`}
                onScroll={handleScrollStart}
              >
                {selectedArticle ? (
                  <ArticleDetail
                    article={selectedArticle}
                    onDelete={handleDeleteArticle}
                    onOpenOriginal={handleOpenOriginal}
                  />
                ) : (
                  <EmptyArticleDetail />
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    </>
  );
}
