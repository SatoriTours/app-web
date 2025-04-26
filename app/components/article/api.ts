import type { ArticlesResponse } from "~/routes/types/articles";

// 获取文章列表
export const fetchArticles = async (page: number, limit: number = 0) => {
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

// 删除文章
export const deleteArticle = async (id: number) => {
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

// 创建文章
export const createArticle = async (url: string, comment: string) => {
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
