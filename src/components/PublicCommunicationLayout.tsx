import { Outlet, Link, useLocation } from 'react-router';
import { FileText, HelpCircle, GraduationCap, Monitor, Newspaper, Video, LogIn } from 'lucide-react';

export function PublicCommunicationLayout() {
  const location = useLocation();

  const menuItems = [
    { to: '/public/faq', icon: HelpCircle, label: 'FAQ' },
    { to: '/public/manual', icon: FileText, label: '메뉴얼' },
    { to: '/public/news', icon: Newspaper, label: '제이시스 뉴스' },
    { to: '/public/media', icon: Video, label: '제이시스 미디어' },
  ];

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-12">
        {/* Login Banner */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white p-6 mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium mb-1">로그인하시면 더 많은 서비스를 이용하실 수 있습니다</h3>
            <p className="text-sm text-blue-100">1:1 문의, 제품 구매, 주문 관리 등</p>
          </div>
          <Link
            to="/login"
            className="bg-white text-[#1e3a8a] px-6 py-3 hover:bg-blue-50 transition-colors font-medium text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <LogIn className="w-4 h-4" />
            로그인하기
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8 lg:mb-12">
          <h1 className="text-3xl lg:text-4xl tracking-tight text-neutral-900 mb-2">
            커뮤니케이션
          </h1>
          <p className="text-base text-neutral-600">
            제이시스메디칼의 다양한 정보와 지원을 확인하세요
          </p>
        </div>

        {/* Layout Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white border border-neutral-200">
              {menuItems.map(item => {
                const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-6 py-4 border-b border-neutral-200 last:border-b-0 transition-colors ${
                      isActive
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Sign up CTA */}
            <div className="bg-neutral-100 border border-neutral-200 p-6 mt-6">
              <h3 className="text-sm font-medium text-neutral-900 mb-2">회원이 아니신가요?</h3>
              <p className="text-xs text-neutral-600 mb-4">
                회원가입하고 전문 의료 기기를 구매하세요
              </p>
              <Link
                to="/signup"
                className="block w-full bg-neutral-900 text-white text-center py-2.5 hover:bg-neutral-800 transition-colors text-sm font-medium"
              >
                회원가입
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-white border border-neutral-200 p-8 lg:p-12">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}