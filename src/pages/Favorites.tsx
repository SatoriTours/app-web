import { useState, useEffect } from "react";

interface FavoritesProps {
  onLogout: () => void;
}

interface Article {
  id: number;
  title: string;
  content: string;
  url: string;
  isFavorite: boolean;
  comment: string;
  coverImage: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface ArticleResponse {
  code: number;
  msg: string;
  data: {
    data: Article[];
    pagination: PaginationData;
  };
}

export default function Favorites({ onLogout }: FavoritesProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  // 获取收藏文章
  const fetchFavorites = async () => {
    setLoading(true);
    try {
      // 这里应该使用API获取收藏文章，目前简单模拟
      const response = await fetch(`/api/v2/articles?page=${page}`);
      const data: ArticleResponse = await response.json();

      if (data.code === 0) {
        // 筛选出收藏的文章
        const favorites = data.data.data.filter(article => article.isFavorite);
        setArticles(favorites);
        setPagination(data.data.pagination);
      } else {
        setError(data.msg || "获取收藏文章失败");
      }
    } catch (error) {
      console.error("获取收藏文章失败:", error);
      setError("获取收藏文章失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 处理页码变化
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  useEffect(() => {
    if (page > 1) {
      fetchFavorites();
    }
  }, [page]);

  // 退出登录
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/v2/auth/logout", {
        method: "POST",
      });
      const data = await response.json();

      if (data.code === 0) {
        onLogout();
      }
    } catch (error) {
      console.error("退出登录失败:", error);
      setError("退出登录失败，请稍后重试");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">收藏文章</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            退出登录
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-10">加载中...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-10 text-gray-500">暂无收藏文章</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <div key={article.id} className="bg-white overflow-hidden shadow rounded-lg">
                {article.coverImage && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={article.coverImage.startsWith('http') ? article.coverImage : `/api${article.coverImage}`}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-2">{article.title}</h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {article.content?.substring(0, 150)}...
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>
                      {new Date(article.createdAt).toLocaleDateString()}
                    </span>
                    {article.comment && (
                      <span className="italic">"{article.comment}"</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="flex items-center">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 rounded border mr-2 disabled:opacity-50"
              >
                上一页
              </button>
              <span className="mx-2">
                第 {page} 页，共 {pagination.totalPages} 页
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1 rounded border ml-2 disabled:opacity-50"
              >
                下一页
              </button>
            </nav>
          </div>
        )}
      </main>
    </div>
  );
}
