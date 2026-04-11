import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { Home, ShoppingCart, Package, User, Zap, Youtube, MessageSquare, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { FloatingButtons } from './FloatingButtons';
import logoImage from '@/assets/4591d8760fc4bee033f8f40ab29f57f1554d66ce.png';
import brandsImage from '@/assets/b5662c9e081b390cfd4a0ad2846686cabac40eaf.png';

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [showCommunicationDropdown, setShowCommunicationDropdown] = useState(false);
  const user = storage.getUser();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const cart = storage.getCart();
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  }, [user, navigate, location]);

  const handleLogout = () => {
    storage.clearAll();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: Home, label: '홈' },
    { to: '/quick-order', icon: Zap, label: '최근 구매 상품' },
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
    { to: '/quick-order', icon: Zap, label: '최근구매' },
    { to: '/products', icon: Package, label: '상품' },
    { to: '/communication/inquiry', icon: MessageSquare, label: '커뮤니케이션' },
    { to: '/mypage/orders', icon: User, label: '마이페이지' },
  ];

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div 
        className="w-full bg-white flex flex-col min-h-screen relative pb-20 md:pb-0"
        style={{ maxWidth: '1440px', margin: '0 auto' }}
      >
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
            <div className="flex items-center h-20 px-4">
              {/* Left Section: Logo (Fixed Width Area) */}
              <div className="flex-1 flex justify-start z-10">
                <Link to="/" className="flex items-center">
                  <img src={logoImage} alt="Jeisys" className="h-6" />
                </Link>
              </div>

              {/* Center Section: Main Navigation (Centered) */}
              <nav className="hidden md:flex items-center justify-center gap-8 z-20">
                {navItems.map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="text-sm font-bold tracking-tight text-neutral-900 hover:text-neutral-500 transition-colors uppercase whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                ))}

                <div
                  className="relative group"
                  onMouseEnter={() => setShowCommunicationDropdown(true)}
                  onMouseLeave={() => setShowCommunicationDropdown(false)}
                >
                  <button className="flex items-center gap-1 text-sm font-bold tracking-tight text-neutral-900 hover:text-neutral-500 transition-colors uppercase whitespace-nowrap">
                    커뮤니케이션
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showCommunicationDropdown && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-48 z-50">
                      <div className="bg-white border border-neutral-200 shadow-xl rounded-sm overflow-hidden">
                        {communicationMenuItems.map(item => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className="block px-4 py-3 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </nav>

              {/* Right Section: User Utilities (Fixed Width Area) */}
              <div className="flex-1 flex items-center justify-end gap-6 z-10">
                <Link
                  to="/mypage/orders"
                  className="hidden md:block text-sm font-bold tracking-tight text-neutral-900 hover:text-neutral-500 transition-colors uppercase whitespace-nowrap"
                >
                  마이페이지
                </Link>

                <button
                  onClick={handleLogout}
                  className="hidden md:block text-sm font-bold tracking-tight text-neutral-400 hover:text-neutral-900 transition-colors uppercase whitespace-nowrap"
                >
                  로그아웃
                </button>

                <Link to="/cart" className="relative group p-1 flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 text-neutral-900 hover:text-neutral-500 transition-colors" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#21358D] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Mobile Cart Icon - Integrated into utilities */}
                <Link to="/cart" className="md:hidden relative p-1 flex-shrink-0">
                  <ShoppingCart className="w-6 h-6 text-neutral-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#21358D] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
        </header>

        <main className="flex-grow">
          <Outlet />
        </main>

        <nav className="md:hidden fixed bottom-1 left-1/2 -translate-x-1/2 bg-white border border-neutral-200 z-50 rounded-full shadow-lg" style={{ width: 'calc(100% - 32px)', maxWidth: '400px' }}>
          <div className="grid grid-cols-5 h-14">
            {mobileNavItems.map(item => {
              const isActive = location.pathname === item.to ||
                (item.to === '/mypage/orders' && location.pathname.startsWith('/mypage')) ||
                (item.to === '/communication/inquiry' && location.pathname.startsWith('/communication'));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-black' : 'text-neutral-500'}`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="hidden md:block bg-white w-full">
          <div className="w-full px-4 border-t border-neutral-100 pt-12">
            <img src={brandsImage} alt="Brands" className="w-full h-auto" />
          </div>
        </div>

        <footer className="hidden md:block bg-neutral-100 text-neutral-600 border-t border-neutral-200 w-full mt-16">
          <div className="w-full px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-sm tracking-wide text-black mb-4 font-medium">(주)제이시스메디칼</h3>
                <div className="text-sm leading-relaxed space-y-1">
                  <p>대표자: 이라미</p>
                  <p>대표번호: 070-7435-4927 | E-mail: webmaster@jeisys.com</p>
                  <p>사업자등록번호: 424-87-00852 | 통신판매업 신고번호: 제 2022-서울금천-0845호</p>
                  <p>개인정보관리책임자: 박종선</p>
                  <p>주소: 서울특별시 금천구 가마산로 96 대륭테크노타운6동</p>
                </div>
              </div>
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
              </div>
            </div>
          </div>
        </footer>

        <FloatingButtons />
      </div>
    </div>
  );
}