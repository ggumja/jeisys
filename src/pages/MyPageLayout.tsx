import { Outlet, Link, useLocation } from 'react-router';
import { ShoppingBag, Stethoscope, LogOut, UserCog, RefreshCw } from 'lucide-react';
import { storage } from '../lib/storage';

export function MyPageLayout() {
  const location = useLocation();
  const user = storage.getUser();

  const menuItems = [
    { to: '/mypage/orders', icon: ShoppingBag, label: '주문/배송 관리' },
    { to: '/mypage/subscriptions', icon: RefreshCw, label: '정기배송 관리' },
    { to: '/mypage/equipment', icon: Stethoscope, label: '보유 장비' },
    { to: '/mypage/profile', icon: UserCog, label: '정보 수정' },
  ];

  const handleLogout = () => {
    storage.clearAll();
    window.location.href = '/login';
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8 lg:mb-12">
        <h1 className="text-3xl lg:text-4xl tracking-tight text-neutral-900 mb-2">마이페이지</h1>
        <p className="text-base text-neutral-600">{user?.name}님, 안녕하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white border border-neutral-200 p-6 sticky top-24">
            {/* User Info */}
            <div className="mb-6 pb-6 border-b border-neutral-200">
              <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-2xl font-light">
                  {user?.name.charAt(0)}
                </span>
              </div>
              <h3 className="text-base tracking-tight text-neutral-900 mb-1">{user?.name}</h3>
              <p className="text-sm text-neutral-600">{user?.hospitalName}</p>
            </div>

            {/* Menu */}
            <nav className="space-y-1">
              {menuItems.map(item => {
                const isActive = location.pathname === item.to;
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

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-neutral-900 hover:bg-neutral-100 w-full transition-colors text-sm"
              >
                <LogOut className="w-5 h-5" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Horizontal tabs */}
        <div className="lg:hidden mb-6">
          <div className="bg-white border border-neutral-200 p-2">
            <div className="grid grid-cols-3 gap-2">
              {menuItems.map(item => {
                const isActive = location.pathname === item.to;
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
                    <span className="text-xs font-medium">{item.label}</span>
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