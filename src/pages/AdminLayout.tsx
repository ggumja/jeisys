import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { ShoppingCart, Package, MessageSquare, Users, Shield, LogOut, Home, ChevronDown, ChevronUp, HelpCircle, FileText, GraduationCap, Monitor, Newspaper, Video, Building2, BarChart3, TrendingUp, PieChart, Calendar, FileStack, RefreshCw, Truck, Megaphone, LayoutList, Layers, Settings, Smartphone, Mail, Send, History, Wallet, CreditCard, Inbox, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';

import { authService } from '../services/authService';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCommunicationOpen, setIsCommunicationOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAdsOpen, setIsAdsOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isMarketingOpen, setIsMarketingOpen] = useState(false);
  const [isSmsMktOpen, setIsSmsMktOpen] = useState(false);
  const [isEmailMktOpen, setIsEmailMktOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check admin permission
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user || (user.role !== 'admin' && !import.meta.env.DEV)) {
          navigate('/', { replace: true });
          return;
        }
      } catch (error) {
        navigate('/', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  const menuItems = [
    { to: '/admin/dashboard', icon: BarChart3, label: '대시보드' },
  ];

  const orderSubMenus = [];

  const statisticsSubMenus = [
    { to: '/admin/statistics/period-sales', icon: Calendar, label: '기간별 매출현황' },
    { to: '/admin/statistics/sales', icon: TrendingUp, label: '매출 분석' },
    { to: '/admin/statistics/products', icon: PieChart, label: '상품 분석' },
  ];

  const communicationSubMenus = [
    { to: '/admin/communication/inquiry', icon: MessageSquare, label: '1:1 문의사항' },
    { to: '/admin/communication/faq', icon: HelpCircle, label: 'FAQ' },
    { to: '/admin/communication/manual', icon: FileText, label: '메뉴얼' },
    { to: '/admin/communication/education', icon: GraduationCap, label: '교육 캘린더' },
    { to: '/admin/communication/demo', icon: Monitor, label: '장비 데모신청' },
    { to: '/admin/communication/news', icon: Newspaper, label: '제이시스 뉴스' },
    { to: '/admin/communication/media', icon: Video, label: '제이시스 미디어' },
  ];

  const adsSubMenus = [
    { to: '/admin/ads', icon: LayoutList, label: '광고 목록' },
    { to: '/admin/adstats', icon: BarChart3, label: '노출/클릭 통계' },
  ];
  
  const productSubMenus = [
    { to: '/admin/products/single', icon: LayoutList, label: '일반상품관리' },
    { to: '/admin/products/set', icon: Layers, label: '셋트상품관리' },
    { to: '/admin/products/package', icon: Package, label: '복합상품관리' },
    { to: '/admin/products/promotion', icon: Package, label: '프로모션번들관리' },
  ];

  const smsSubMenus = [
    { to: '/admin/marketing/sms/send', icon: Send, label: '메시지 전송' },
    { to: '/admin/marketing/sms/history', icon: History, label: '마케팅 전송 내역' },
    { to: '/admin/marketing/sms/system-history', icon: Inbox, label: '시스템 전송 내역' },
    { to: '/admin/marketing/sms/charge', icon: Wallet, label: '메시지 충전' },
    { to: '/admin/marketing/sms/charge-history', icon: CreditCard, label: '충전 내역' },
  ];

  const emailSubMenus = [
    { to: '/admin/marketing/email/send', icon: Send, label: '이메일 전송' },
    { to: '/admin/marketing/email/history', icon: History, label: '이메일 전송내역' },
    { to: '/admin/marketing/email/system-history', icon: Inbox, label: '시스템 전송 내역' },
  ];

  const bottomMenuItems = [
    { to: '/admin/sales-offices', icon: Building2, label: '판매영업점 관리' },
    { to: '/admin/members', icon: Users, label: '회원관리' },
    { to: '/admin/admins', icon: Shield, label: '관리자 계정관리' },
    { to: '/admin/settings', icon: Settings, label: '쇼핑몰 기본 설정' },
  ];

  // Check if current path is under orders, communication or statistics
  const isOrdersActive = location.pathname.startsWith('/admin/orders') || location.pathname.startsWith('/admin/order-history');
  const isCommunicationActive = location.pathname.startsWith('/admin/communication');
  const isStatisticsActive = location.pathname.startsWith('/admin/statistics');
  const isAdsActive = location.pathname.startsWith('/admin/ads');
  const isProductsActive = location.pathname.startsWith('/admin/products');
  const isMarketingActive = location.pathname.startsWith('/admin/marketing');
  const isSmsMktActive = location.pathname.startsWith('/admin/marketing/sms');
  const isEmailMktActive = location.pathname.startsWith('/admin/marketing/email');

  // Auto-expand menus if active
  useEffect(() => {
    if (isOrdersActive) setIsOrdersOpen(true);
    if (isCommunicationActive) setIsCommunicationOpen(true);
    if (isStatisticsActive) setIsStatisticsOpen(true);
    if (isAdsActive) setIsAdsOpen(true);
    if (isProductsActive) setIsProductsOpen(true);
    if (isMarketingActive) {
      setIsMarketingOpen(true);
      if (isSmsMktActive) setIsSmsMktOpen(true);
      if (isEmailMktActive) setIsEmailMktOpen(true);
    }
  }, [isOrdersActive, isCommunicationActive, isStatisticsActive, isAdsActive, isProductsActive, isMarketingActive, isSmsMktActive, isEmailMktActive]);

  // Redirect to dashboard if at base admin path
  useEffect(() => {
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900" />
      </div>
    );
  }

  const handleBackToSite = () => {
    navigate('/');
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Admin Header */}
      <header className="bg-neutral-900 text-white sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <h1 className="text-lg font-medium">제이시스메디칼 관리자</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToSite}
                className="flex items-center gap-2 text-sm text-neutral-300 hover:text-white transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>사이트로 이동</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-neutral-300 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block w-[280px] shrink-0">
            <div className="bg-white border border-neutral-200 p-6 sticky top-24">
              <nav className="space-y-1">
                {/* Dashboard */}
                {menuItems.map((item) => {
                  const isActive =
                    location.pathname === item.to ||
                    location.pathname.startsWith(item.to + '/');
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm ${isActive
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* Orders Menu - Direct Link instead of Accordion */}
                <Link
                  to="/admin/orders"
                  className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm ${isOrdersActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>주문관리</span>
                </Link>

                {/* Subscription List - Same level as Order Management */}
                <Link
                  to="/admin/subscriptions"
                  className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm ${location.pathname === '/admin/subscriptions' ||
                    location.pathname.startsWith('/admin/subscriptions/')
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>정기배송목록</span>
                </Link>

                {/* Communication Menu - Accordion */}
                <div>
                  <button
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-sm ${isCommunicationActive
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    onClick={() => setIsCommunicationOpen(!isCommunicationOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5" />
                      <span>커뮤니케이션관리</span>
                    </div>
                    {isCommunicationOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {isCommunicationOpen && (
                    <div className="bg-white">
                      {communicationSubMenus.map((item) => {
                        const isActive = location.pathname === item.to;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center gap-3 pl-12 pr-4 py-2.5 transition-colors text-sm ${isActive
                              ? 'bg-neutral-900 text-white'
                              : 'text-neutral-600 hover:bg-neutral-50'
                              }`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Statistics Menu - Accordion */}
                <div>
                  <button
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-sm ${isStatisticsActive
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    onClick={() => setIsStatisticsOpen(!isStatisticsOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5" />
                      <span>통계 분석</span>
                    </div>
                    {isStatisticsOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {isStatisticsOpen && (
                    <div className="bg-white">
                      {statisticsSubMenus.map((item) => {
                        const isActive = location.pathname === item.to;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center gap-3 pl-12 pr-4 py-2.5 transition-colors text-sm ${isActive
                              ? 'bg-neutral-900 text-white'
                              : 'text-neutral-600 hover:bg-neutral-50'
                              }`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Ads Menu - Accordion */}
                <div>
                  <button
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-sm ${isAdsActive
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    onClick={() => setIsAdsOpen(!isAdsOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <Megaphone className="w-5 h-5" />
                      <span>광고/배너 관리</span>
                    </div>
                    {isAdsOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {isAdsOpen && (
                    <div className="bg-white">
                      {adsSubMenus.map((item) => {
                        const isActive = location.pathname === item.to;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center gap-3 pl-12 pr-4 py-2.5 transition-colors text-sm ${isActive
                              ? 'bg-neutral-900 text-white'
                              : 'text-neutral-600 hover:bg-neutral-50'
                              }`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Products Menu - Accordion */}
                <div>
                  <button
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-sm ${isProductsActive
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    onClick={() => setIsProductsOpen(!isProductsOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5" />
                      <span>상품관리</span>
                    </div>
                    {isProductsOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {isProductsOpen && (
                    <div className="bg-white">
                      {productSubMenus.map((item) => {
                        let isActive = false;
                        if (item.to === '/admin/products/single') {
                          isActive = location.pathname === '/admin/products/single' || 
                                     location.pathname === '/admin/products/register' || 
                                     location.pathname.startsWith('/admin/products/edit/');
                        } else if (item.to === '/admin/products/set') {
                          isActive = location.pathname === '/admin/products/set' || 
                                     location.pathname === '/admin/products/set-register' || 
                                     location.pathname.startsWith('/admin/products/set-edit/');
                        } else if (item.to === '/admin/products/package') {
                          isActive = location.pathname === '/admin/products/package' || 
                                     location.pathname === '/admin/products/package-register' || 
                                     location.pathname.startsWith('/admin/products/package-edit/');
                        } else if (item.to === '/admin/products/promotion') {
                          isActive = location.pathname === '/admin/products/promotion' || 
                                     location.pathname === '/admin/products/promotion-register' || 
                                     location.pathname.startsWith('/admin/products/promotion-edit/');
                        } else {
                          isActive = location.pathname === item.to;
                        }
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center gap-3 pl-12 pr-4 py-2.5 transition-colors text-sm ${isActive
                              ? 'bg-neutral-900 text-white'
                              : 'text-neutral-600 hover:bg-neutral-50'
                              }`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Equipment Management */}
                <Link
                  to="/admin/equipments"
                  className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm ${location.pathname.startsWith('/admin/equipments')
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                >
                  <Wrench className="w-5 h-5" />
                  <span>장비관리</span>
                </Link>

                {/* Marketing Menu - Accordion */}
                <div>
                  <button
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-sm ${isMarketingActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
                    onClick={() => setIsMarketingOpen(!isMarketingOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <Megaphone className="w-5 h-5" />
                      <span>마케팅관리</span>
                    </div>
                    {isMarketingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {isMarketingOpen && (
                    <div className="bg-white">
                      {/* 문자 마케팅 */}
                      <button
                        className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 transition-colors text-sm ${isSmsMktActive ? 'text-neutral-900 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`}
                        onClick={() => setIsSmsMktOpen(!isSmsMktOpen)}
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          <span>문자 마케팅</span>
                        </div>
                        {isSmsMktOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {isSmsMktOpen && (
                        <div className="border-l-2 border-neutral-100 ml-12">
                          {smsSubMenus.map((item) => {
                            const isActive = location.pathname === item.to;
                            return (
                              <Link
                                key={item.to}
                                to={item.to}
                                className={`flex items-center gap-2 pl-4 pr-4 py-2 transition-colors text-xs ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}
                              >
                                <item.icon className="w-3.5 h-3.5" />
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                      {/* 이메일 마케팅 */}
                      <button
                        className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 transition-colors text-sm ${isEmailMktActive ? 'text-neutral-900 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`}
                        onClick={() => setIsEmailMktOpen(!isEmailMktOpen)}
                      >
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>이메일 마케팅</span>
                        </div>
                        {isEmailMktOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {isEmailMktOpen && (
                        <div className="border-l-2 border-neutral-100 ml-12">
                          {emailSubMenus.map((item) => {
                            const isActive = location.pathname === item.to;
                            return (
                              <Link
                                key={item.to}
                                to={item.to}
                                className={`flex items-center gap-2 pl-4 pr-4 py-2 transition-colors text-xs ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}
                              >
                                <item.icon className="w-3.5 h-3.5" />
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Menu Items */}
                {bottomMenuItems.map((item) => {
                  const isActive =
                    location.pathname === item.to ||
                    location.pathname.startsWith(item.to + '/');
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm ${isActive
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
            </div>
          </div>

          {/* Mobile Menu - Horizontal tabs */}
          <div className="lg:hidden mb-6">
            <div className="bg-white border border-neutral-200 p-2">
              <div className="grid grid-cols-3 gap-2">
                <Link
                  to="/admin/dashboard"
                  className={`flex flex-col items-center gap-1 py-3 transition-colors ${location.pathname === '/admin/dashboard'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600'
                    }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-xs font-medium text-center">대시보드</span>
                </Link>
                <Link
                  to="/admin/orders"
                  className={`flex flex-col items-center gap-1 py-3 transition-colors ${isOrdersActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600'
                    }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-xs font-medium text-center">주문관리</span>
                </Link>
                <Link
                  to="/admin/subscriptions"
                  className={`flex flex-col items-center gap-1 py-3 transition-colors ${location.pathname === '/admin/subscriptions'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600'
                    }`}
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="text-xs font-medium text-center">정기배송</span>
                </Link>
                <Link
                  to="/admin/equipments"
                  className={`flex flex-col items-center gap-1 py-3 transition-colors ${location.pathname.startsWith('/admin/equipments')
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600'
                    }`}
                >
                  <Wrench className="w-5 h-5" />
                  <span className="text-xs font-medium text-center">장비관리</span>
                </Link>
                <Link
                  to="/admin/products/single"
                  className={`flex flex-col items-center gap-1 py-3 transition-colors ${location.pathname.startsWith('/admin/products')
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600'
                    }`}
                >
                  <Package className="w-5 h-5" />
                  <span className="text-xs font-medium text-center">상품관리</span>
                </Link>
                <Link
                  to="/admin/members"
                  className={`flex flex-col items-center gap-1 py-3 transition-colors ${location.pathname === '/admin/members'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600'
                    }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-medium text-center">회원관리</span>
                </Link>
                <Link
                  to="/admin/admins"
                  className={`flex flex-col items-center gap-1 py-3 transition-colors ${location.pathname === '/admin/admins'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600'
                    }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="text-xs font-medium text-center">관리자</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
