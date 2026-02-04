import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useEffect } from 'react';
import { storage } from './lib/storage';

function App() {
  // 기존 로그인된 사용자 정보 업데이트
  useEffect(() => {
    const user = storage.getUser();
    if (user && user.name === '김원장') {
      storage.setUser({
        ...user,
        name: '김민종 원장'
      });
    }
  }, []);

  return <RouterProvider router={router} />;
}

export default App;