import { useState } from "react";
import type { Route } from "../routes/types/login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "登录" },
    { name: "description", content: "请输入密码登录" },
  ];
}

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/v2/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.code === 0) {
        // 登录成功，重定向到首页或其他页面
        window.location.href = "/";
      } else {
        setError(data.msg || "密码错误");
      }
    } catch (err) {
      setError("登录失败，请重试");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">欢迎使用</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">请输入密码继续</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="password" className="sr-only">
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-2 mt-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
