import { Link } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-gray-600 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/"
            className="bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Home className="w-5 h-5" />
            홈으로 돌아가기
          </Link>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            이전 페이지
          </button>
        </div>
      </div>
    </div>
  );
}