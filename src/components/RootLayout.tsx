import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { Home, ShoppingCart, Package, User, Menu, X, Zap, Youtube, MessageSquare, ChevronDown, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { FloatingButtons } from './FloatingButtons';
import { BASE_PATH } from '../constants/paths';
import logoImage from '@/assets/4591d8760fc4bee033f8f40ab29f57f1554d66ce.png';
import brandsImage from '@/assets/b5662c9e081b390cfd4a0ad2846686cabac40eaf.png';

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCommunicationDropdown, setShowCommunicationDropdown] = useState(false);
  const user = storage.getUser();

  useEffect(() => {
    if (!user) {
      navigate(`${BASE_PATH}/login`);
      return;
    }

    const cart = storage.getCart();
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  }, [user, navigate, location]);

  const handleLogout = () => {
    storage.clearAll();
    navigate(`${BASE_PATH}/login`);
  };

  const navItems = [
    { to: '/', icon: Home, label: '홈' },
    { to: '/quick-order', icon: Zap, label: '반복 구매 상품' },
    { to: '/products', icon: Package, label: '상품' },
  ];

  const communicationMenuItems = [
    { to: '/communication/inquiry', label: '1:1 문의사항' },
    { to: '/communication/faq', label: 'FAQ' },
    { to: '/communication/manual', label: '메뉴얼' },
    { to: '/communication/education', label: '교육 캘린더' },
    { to: '/communication/demo', label: '장비 데모신청' },
    { to: '/communication/news', label: '제이시스 뉴스' },
    { to: '/communication/media', label: '제이시스 미디어' },
  ];

  const mobileNavItems = [
    { to: '/', icon: Home, label: '홈' },
    { to: '/quick-order', icon: Zap, label: '반복구매' },
    { to: '/products', icon: Package, label: '상품' },
    { to: '/communication/inquiry', icon: MessageSquare, label: '커뮤니케이션' },
    { to: '/mypage/orders', icon: User, label: '마이페이지' },
  ];

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Top Notice Bar */}
      <div className="bg-[#1e3a8a] text-white text-xs hidden md:block">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center gap-2">
              <span>제이시스 B2B 전용몰 - 의료인 회원 전용 쇼핑몰입니다.</span>
              {!user && (
                <span className="font-bold">로그인 후 상품 구매가 가능합니다.</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://www.youtube.com/@%EC%A0%9C%EC%9D%B4%EC%8B%9C%EC%8A%A4%EB%A9%94%EB%94%94%EC%B9%BC"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity">NEWS</a>
              <a href="#" className="hover:opacity-80 transition-opacity">1:1 문의사항</a>
              <a href="#" className="hover:opacity-80 transition-opacity">FAQ</a>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3">
              <img
                src={logoImage}
                alt="Jeisys"
                className="h-6"
              />
              <span className="text-neutral-500 text-sm tracking-wide">B2B쇼핑몰</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-5">
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-sm font-bold tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors uppercase"
                >
                  {item.label}
                </Link>
              ))}

              {/* Communication Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setShowCommunicationDropdown(true)}
                onMouseLeave={() => setShowCommunicationDropdown(false)}
              >
                <button className="flex items-center gap-1 text-sm font-bold tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors uppercase">
                  커뮤니케이션
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showCommunicationDropdown && (
                  <div className="absolute top-full left-0 pt-2 w-48 z-50">
                    <div className="bg-white border border-neutral-200 shadow-lg">
                      {communicationMenuItems.map(item => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="block px-4 py-3 text-sm text-neutral-900 hover:bg-neutral-100 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* MyPage Link */}
              <Link
                to="/mypage/orders"
                className="text-sm font-bold tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors uppercase"
              >
                마이페이지
              </Link>


              {/* Admin Link (for admin users) */}
              {user?.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className="text-sm font-bold tracking-tight text-red-600 hover:text-red-800 transition-colors uppercase border border-red-200 px-2 py-1 rounded"
                >
                  Admin Panel
                </Link>
              )}


              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="text-sm font-bold tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors uppercase"
                title="로그아웃"
              >
                로그아웃
              </button>

              <Link to="/cart" className="relative">
                <ShoppingCart className="w-5 h-5 text-neutral-900 hover:text-neutral-600 transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </Link>
            </nav>

            {/* Mobile Cart Icon */}
            <Link to="/cart" className="md:hidden relative">
              <ShoppingCart className="w-6 h-6 text-neutral-700" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-14rem)]">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50 safe-area-bottom">
        <div className="grid grid-cols-5 h-16">
          {mobileNavItems.map(item => {
            const isActive = location.pathname === item.to ||
              (item.to === '/mypage/orders' && location.pathname.startsWith('/mypage')) ||
              (item.to === '/communication/inquiry' && location.pathname.startsWith('/communication'));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? 'text-black' : 'text-neutral-500'
                  }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2]' : ''}`} />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Brand Lineup Section - Hidden on mobile */}
      <div className="hidden md:block bg-white mt-12">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <img
            src={brandsImage}
            alt="제이시스메디칼 장비 라인 신장"
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Footer - Hidden on mobile */}
      <footer className="hidden md:block bg-neutral-100 text-neutral-600 border-t border-neutral-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left Column */}
            <div>
              <h3 className="text-sm tracking-wide text-black mb-4 font-medium">(주)제이시스메디칼</h3>
              <div className="text-sm leading-relaxed space-y-1">
                <p>대표자: 이라미</p>
                <p>대표번호: 070-7435-4927 | E-mail: webmaster@jeisys.com</p>
                <p>사업자등록번호: 424-87-00852 | 통신판매업 신고번호: 제 2022-서울금천-0845호</p>
                <p>개인정보관리책임자: 박종선</p>
                <p>주소: 서울특별시 금천구 가마산로 96 대륭테크노타운6동</p>
              </div>
              <div className="mt-6 text-xs text-neutral-500 leading-relaxed">
                <p>본 사이트의 이미지에 대한 모든 권한은 (주)제이시스메디칼에 있습니다.</p>
                <p>무단 도용 시 법적 제재를 받으실 수 있습니다.</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm tracking-wide text-black mb-3 font-medium">고객지원센터 070-7435-4927</h4>
                <div className="text-sm space-y-1">
                  <p>평일: 오전 9시 ~ 오후 5시 | 휴일: 토요일, 일요일, 공휴일</p>
                  <p>주문마감: 오후 2시 30분 | 배달 및 제주(도) 오후 1시 마감</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm tracking-wide text-black mb-3 font-medium">AS고객센터 1544-1639</h4>
                <div className="text-sm space-y-1">
                  <p>평일: 오전 10시 ~ 오후 4시 | 휴일: 토요일, 일요일, 공휴일</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm tracking-wide text-black mb-3 font-medium">입금계좌 안내</h4>
                <div className="text-sm space-y-1">
                  <p>우리은행 1005-803-786090</p>
                  <p>예금주: (주)제이시스메디칼</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Buttons */}
      <FloatingButtons />
    </div>
  );
}