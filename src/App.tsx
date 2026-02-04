import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useEffect } from 'react';
import { storage } from './lib/storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

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

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;