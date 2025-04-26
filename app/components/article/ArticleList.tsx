import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { CalendarIcon, GlobeIcon, BookOpenIcon } from "lucide-react";
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
import { SimplePagination } from "~/components/article/SimplePagination";
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

interface ArticleListProps {
  articles: Article[];
  selectedArticle: Article | null;
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  onSelectArticle: (article: Article) => void;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onAddArticle: (url: string, comment: string) => Promise<void>;
}

export function ArticleList({
  articles,
  selectedArticle,
  loading,
  error,
  page,
  totalPages,
  onSelectArticle,
  onRetry,
  onPageChange,
  onAddArticle
}: ArticleListProps) {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // 添加文章状态
  const [newArticleUrl, setNewArticleUrl] = useState("");
  const [newArticleComment, setNewArticleComment] = useState("");
  const [addingArticle, setAddingArticle] = useState(false);

  // 滚动事件处理
  const handleScrollStart = () => {
    setIsScrolling(true);

    // 清除现有定时器
    if (scrollingTimeoutRef.current) {
      clearTimeout(scrollingTimeoutRef.current);
    }

    // 设置新定时器，滚动停止后隐藏滚动条
    scrollingTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  // 处理添加文章
  const handleAddArticle = async () => {
    if (!newArticleUrl) return;

    setAddingArticle(true);

    try {
      await onAddArticle(newArticleUrl, newArticleComment);

      // 重置表单
      setNewArticleUrl("");
      setNewArticleComment("");
    } catch (error) {
      console.error("添加文章失败:", error);
    } finally {
      setAddingArticle(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 列表头部 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
            <BookOpenIcon className="w-4 h-4" />
            <span className="text-sm">文章总数: {articles.length}</span>
          </div>

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
        onScroll={handleScrollStart}
      >
        {error && (
          <div className="m-4 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md p-4 shadow-sm">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
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
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-2"></div>
                <div>正在加载文章...</div>
              </div>
            );
          }

          // 无文章状态
          if (articles.length === 0 && !loading && !error) {
            return (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <BookOpenIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>暂无文章，请添加</p>
              </div>
            );
          }

          // 文章列表
          return (
            <div className="p-3">
              <ul className="flex flex-col gap-3">
                {articles.map((article) => (
                  <li key={article.id} className="group">
                    <button
                      onClick={() => onSelectArticle(article)}
                      className={`article-card flex flex-col w-full p-4 rounded-lg text-left outline-none ${
                        selectedArticle?.id === article.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 shadow-sm"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/30 border-l-4 border-transparent hover:shadow-sm"
                      }`}
                    >
                      <span
                        className={`font-medium w-full mb-2 line-clamp-3 ${
                          selectedArticle?.id === article.id
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-800 dark:text-gray-200"
                        }`}
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: "2",
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}
                      >
                        {article.title || "无标题文章"}
                      </span>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
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
          <div className="py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky bottom-0">
            <SimplePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
