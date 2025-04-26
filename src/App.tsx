import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Favorites from './pages/Favorites';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 检查认证状态
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/v2/auth/status");
        const data = await response.json();

        if (data.code === 0 && data.data.authenticated) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("检查认证状态失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  return (
    <>
      {isLoggedIn ? (
        <Favorites onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <Login onLogin={() => setIsLoggedIn(true)} />
      )}
    </>
  );
}

export default App;
