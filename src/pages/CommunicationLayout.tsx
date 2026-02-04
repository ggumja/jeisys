import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { MessageSquare, HelpCircle, FileText, GraduationCap, Monitor, Newspaper, Megaphone } from 'lucide-react';
import { useEffect } from 'react';

export function CommunicationLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { to: '/communication/inquiry', icon: MessageSquare, label: '1:1 문의사항' },
    { to: '/communication/faq', icon: HelpCircle, label: 'FAQ' },
    { to: '/communication/manual', icon: FileText, label: '메뉴얼' },
    { to: '/communication/education', icon: GraduationCap, label: '교육 캘린더' },
    { to: '/communication/demo', icon: Monitor, label: '장비 데모신청' },
    { to: '/communication/news', icon: Newspaper, label: '제이시스 뉴스' },
    { to: '/communication/media', icon: Megaphone, label: '제이시스 미디어' },
  ];

  // Redirect to inquiry if at base communication path
  useEffect(() => {
    if (location.pathname === '/communication' || location.pathname === '/communication/') {
      navigate('/communication/inquiry', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8 lg:mb-12">
        <h1 className="text-3xl lg:text-4xl tracking-tight text-neutral-900 mb-2">
          커뮤니케이션
        </h1>
        <p className="text-base text-neutral-600">
          제이시스메디컬을 이용해주시는 고객님들과의 소통창구입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white border border-neutral-200 p-6 sticky top-24">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive =
                  location.pathname === item.to ||
                  location.pathname.startsWith(item.to + '/');
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm ${
                      isActive
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Help Info */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-xs text-neutral-600 mb-2">고객지원센터</p>
              <a
                href="tel:070-7435-4927"
                className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
              >
                070-7435-4927
              </a>
              <p className="text-xs text-neutral-500 mt-2">
                평일 오전 9시 ~ 오후 5시
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Horizontal tabs */}
        <div className="lg:hidden mb-6">
          <div className="bg-white border border-neutral-200 p-2">
            <div className="grid grid-cols-4 gap-2">
              {menuItems.map((item) => {
                const isActive =
                  location.pathname === item.to ||
                  location.pathname.startsWith(item.to + '/');
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex flex-col items-center gap-1 py-3 transition-colors ${
                      isActive
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-600'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs font-medium text-center">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
}