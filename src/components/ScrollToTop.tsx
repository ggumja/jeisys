import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * 라우트 변경 시 스크롤을 맨 위로 이동
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
