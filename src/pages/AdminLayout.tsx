import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { ShoppingCart, Package, MessageSquare, Users, Shield, LogOut, Home, ChevronDown, ChevronUp, HelpCircle, FileText, GraduationCap, Monitor, Newspaper, Video, Building2, BarChart3, TrendingUp, PieChart, Calendar, FileStack, RefreshCw, Truck, Megaphone, LayoutList, Layers, Settings, Smartphone, Mail, Send, History, Wallet, CreditCard, Inbox, Wrench, Lock, Coins } from 'lucide-react';
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
  const [currentUser, setCurrentUser] = useState<any>(null);

  const hasPermission = (key: string) => {
    // 최고관리자(super)인 경우 모든 권한 허용
    if (currentUser?.adminRole === 'super') {
      return true;
    }
    // 실제 유저의 permissions 배열 검사
    const userPermissions = currentUser?.permissions || [];
    if (userPermissions.includes('all')) return true;
    
    return userPermissions.includes(key);
  };

  // Check admin permission
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user || (user.role !== 'admin' && !import.meta.env.DEV)) {
          navigate('/', { replace: true });
          return;
        }
        setCurrentUser(user);
      } catch (error) {
        navigate('/', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  const menuItems = [
    { to: '/admin/dashboard', icon: BarChart3, label: '대시보드', permKey: 'dashboard' },
  ];

  const statisticsSubMenus = [
    { to: '/admin/statistics/period-sales', icon: Calendar, label: '기간별 매출현황' },
    { to: '/admin/statistics/sales', icon: TrendingUp, label: '매출 분석' },
    { to: '/admin/statistics/products', icon: PieChart, label: '상품 분석' },
    { to: '/admin/statistics/credits', icon: Coins, label: '크레딧 분석' },
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
    { to: '/admin/sales-offices', icon: Building2, label: '판매영업점 관리', permKey: 'sales_offices' },
    { to: '/admin/members', icon: Users, label: '회원관리', permKey: 'members' },
    { to: '/admin/admins', icon: Shield, label: '관리자 계정관리', permKey: 'admins' },
    { to: '/admin/settings', icon: Settings, label: '쇼핑몰 기본 설정', permKey: 'settings' },
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

  // Auto-expand menus if active and collapse others
  useEffect(() => {
    if (isOrdersActive) setIsOrdersOpen(true);
    
    if (isCommunicationActive) {
      setIsCommunicationOpen(true);
      setIsStatisticsOpen(false);
      setIsAdsOpen(false);
      setIsProductsOpen(false);
      setIsMarketingOpen(false);
    } else if (isStatisticsActive) {
      setIsCommunicationOpen(false);
      setIsStatisticsOpen(true);
      setIsAdsOpen(false);
      setIsProductsOpen(false);
      setIsMarketingOpen(false);
    } else if (isAdsActive) {
      setIsCommunicationOpen(false);
      setIsStatisticsOpen(false);
      setIsAdsOpen(true);
      setIsProductsOpen(false);
      setIsMarketingOpen(false);
    } else if (isProductsActive) {
      setIsCommunicationOpen(false);
      setIsStatisticsOpen(false);
      setIsAdsOpen(false);
      setIsProductsOpen(true);
      setIsMarketingOpen(false);
    } else if (isMarketingActive) {
      setIsCommunicationOpen(false);
      setIsStatisticsOpen(false);
      setIsAdsOpen(false);
      setIsProductsOpen(false);
      setIsMarketingOpen(true);
      if (isSmsMktActive) setIsSmsMktOpen(true);
      if (isEmailMktActive) setIsEmailMktOpen(true);
    }
  }, [location.pathname, isOrdersActive, isCommunicationActive, isStatisticsActive, isAdsActive, isProductsActive, isMarketingActive, isSmsMktActive, isEmailMktActive]);

  const toggleMenu = (menu: 'communication' | 'statistics' | 'ads' | 'products' | 'marketing') => {
    if (!hasPermission(menu)) return;
    setIsCommunicationOpen(menu === 'communication' ? !isCommunicationOpen : false);
    setIsStatisticsOpen(menu === 'statistics' ? !isStatisticsOpen : false);
    setIsAdsOpen(menu === 'ads' ? !isAdsOpen : false);
    setIsProductsOpen(menu === 'products' ? !isProductsOpen : false);
    setIsMarketingOpen(menu === 'marketing' ? !isMarketingOpen : false);
  };

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

  const renderMobileMenuLink = (to: string, icon: any, label: string, permKey: string, isActive: boolean) => {
    const allowed = hasPermission(permKey);
    const Icon = icon;
    return (
      <Link
        to={to}
        onClick={(e) => { if (!allowed) e.preventDefault(); }}
        className={`flex flex-col items-center gap-1 py-3 transition-colors relative ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-600'} ${!allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-xs font-medium text-center">{label}</span>
        {!allowed && <Lock className="w-3 h-3 absolute top-2 right-2 text-neutral-400" />}
      </Link>
    );
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
                  const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                  const allowed = hasPermission(item.permKey);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={(e) => { if (!allowed) e.preventDefault(); }}
                      className={`flex items-center justify-between px-4 py-3 transition-colors text-sm ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'} ${!allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {!allowed && <Lock className="w-4 h-4 text-neutral-400" />}
                    </Link>
                  );
                })}

                {/* Orders Menu */}
                {(() => {
                  const allowed = hasPermission('orders');
                  return (
                    <Link
                      to="/admin/orders"
                      onClick={(e) => { if (!allowed) e.preventDefault(); }}
                      className={`flex items-center justify-between px-4 py-3 transition-colors text-sm ${isOrdersActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'} ${!allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="w-5 h-5 shrink-0" />
                        <span>주문관리</span>
                      </div>
                      {!allowed && <Lock className="w-4 h-4 text-neutral-400" />}
                    </Link>
                  );
                })()}

                {/* Subscription List */}
                {(() => {
                  const allowed = hasPermission('subscriptions');
                  const isActive = location.pathname === '/admin/subscriptions' || location.pathname.startsWith('/admin/subscriptions/');
                  return (
                    <Link
                      to="/admin/subscriptions"
                      onClick={(e) => { if (!allowed) e.preventDefault(); }}
                      className={`flex items-center justify-between px-4 py-3 transition-colors text-sm ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'} ${!allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 shrink-0" />
                        <span>정기배송목록</span>
                      </div>
                      {!allowed && <Lock className="w-4 h-4 text-neutral-400" />}
                    </Link>
                  );
                })()}

                {/* Communication Menu - Accordion */}
                <div>
                  <button
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-sm ${isCommunicationActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'} ${!hasPermission('communication') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => toggleMenu('communication')}
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 shrink-0" />
                      <span>커뮤니케이션관리</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!hasPermission('communication') && <Lock className="w-4 h-4 text-neutral-400" />}
                      {hasPermission('communication') && (isCommunicationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </button>
                  {isCommunicationOpen && hasPermission('communication') && (
                    <div className="bg-white">
                      {communicationSubMenus.map((item) => {
                        const isActive = location.pathname === item.to;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center gap-3 pl-12 pr-4 py-2.5 transition-colors text-sm ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
                          >
                            <item.icon className="w-4 h-4 shrink-0" />
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
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-sm ${isStatisticsActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'} ${!hasPermission('statistics') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => toggleMenu('statistics')}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 shrink-0" />
                      <span>통계 분석</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!hasPermission('statistics') && <Lock className="w-4 h-4 text-neutral-400" />}
                      {hasPermission('statistics') && (isStatisticsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </button>
                  {isStatisticsOpen && hasPermission('statistics') && (
                    <div className="bg-white">
                      {statisticsSubMenus.map((item) => {
                        const isActive = location.pathname === item.to;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center gap-3 pl-12 pr-4 py-2.5 transition-colors text-sm ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
                          >
                            <item.icon className="w-4 h-4 shrink-0" />
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
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-sm ${isAdsActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'} ${!hasPermission('ads') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => toggleMenu('ads')}
                  >
                    <div className="flex items-center gap-3">
                      <Megaphone className="w-5 h-5 shrink-0" />
                      <span>광고/배너 관리</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!hasPermission('ads') && <Lock className="w-4 h-4 text-neutral-400" />}
                      {hasPermission('ads') && (isAdsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </button>
                  {isAdsOpen && hasPermission('ads') && (
                    <div className="bg-white">
                      {adsSubMenus.map((item) => {
                        const isActive = location.pathname === item.to;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center gap-3 pl-12 pr-4 py-2.5 transition-colors text-sm ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
                          >
                            <item.icon className="w-4 h-4 shrink-0" />
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
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-sm ${isProductsActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'} ${!hasPermission('products') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => toggleMenu('products')}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 shrink-0" />
                      <span>상품관리</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!hasPermission('products') && <Lock className="w-4 h-4 text-neutral-400" />}
                      {hasPermission('products') && (isProductsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </button>
                  {isProductsOpen && hasPermission('products') && (
                    <div className="bg-white">
                      {productSubMenus.map((item) => {
                        let isActive = false;
                        if (item.to === '/admin/products/single') {
                          isActive = location.pathname === '/admin/products/single' || location.pathname === '/admin/products/register' || location.pathname.startsWith('/admin/products/edit/');
                        } else if (item.to === '/admin/products/set') {
                          isActive = location.pathname === '/admin/products/set' || location.pathname === '/admin/products/set-register' || location.pathname.startsWith('/admin/products/set-edit/');
                        } else if (item.to === '/admin/products/package') {
                          isActive = location.pathname === '/admin/products/package' || location.pathname === '/admin/products/package-register' || location.pathname.startsWith('/admin/products/package-edit/');
                        } else if (item.to === '/admin/products/promotion') {
                          isActive = location.pathname === '/admin/products/promotion' || location.pathname === '/admin/products/promotion-register' || location.pathname.startsWith('/admin/products/promotion-edit/');
                        } else {
                          isActive = location.pathname === item.to;
                        }
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center gap-3 pl-12 pr-4 py-2.5 transition-colors text-sm ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
                          >
                            <item.icon className="w-4 h-4 shrink-0" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Equipment Management */}
                {(() => {
                  const allowed = hasPermission('equipments');
                  const isActive = location.pathname.startsWith('/admin/equipments');
                  return (
                    <Link
                      to="/admin/equipments"
                      onClick={(e) => { if (!allowed) e.preventDefault(); }}
                      className={`flex items-center justify-between px-4 py-3 transition-colors text-sm ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'} ${!allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5 shrink-0" />
                        <span>장비관리</span>
                      </div>
                      {!allowed && <Lock className="w-4 h-4 text-neutral-400" />}
                    </Link>
                  );
                })()}

                {/* Marketing Menu - Accordion */}
                <div>
                  <button
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-sm ${isMarketingActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'} ${!hasPermission('marketing') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => toggleMenu('marketing')}
                  >
                    <div className="flex items-center gap-3">
                      <Megaphone className="w-5 h-5 shrink-0" />
                      <span>마케팅관리</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!hasPermission('marketing') && <Lock className="w-4 h-4 text-neutral-400" />}
                      {hasPermission('marketing') && (isMarketingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </button>
                  {isMarketingOpen && hasPermission('marketing') && (
                    <div className="bg-white">
                      <button
                        className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 transition-colors text-sm ${isSmsMktActive ? 'text-neutral-900 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`}
                        onClick={() => setIsSmsMktOpen(!isSmsMktOpen)}
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 shrink-0" />
                          <span>문자 마케팅</span>
                        </div>
                        {isSmsMktOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {isSmsMktOpen && (
                        <div className="border-l-2 border-neutral-100 ml-12">
                          {smsSubMenus.map((item) => (
                            <Link key={item.to} to={item.to} className={`flex items-center gap-2 pl-4 pr-4 py-2 transition-colors text-xs ${location.pathname === item.to ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}>
                              <item.icon className="w-3.5 h-3.5 shrink-0" />
                              <span>{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                      <button
                        className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 transition-colors text-sm ${isEmailMktActive ? 'text-neutral-900 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`}
                        onClick={() => setIsEmailMktOpen(!isEmailMktOpen)}
                      >
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 shrink-0" />
                          <span>이메일 마케팅</span>
                        </div>
                        {isEmailMktOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {isEmailMktOpen && (
                        <div className="border-l-2 border-neutral-100 ml-12">
                          {emailSubMenus.map((item) => (
                            <Link key={item.to} to={item.to} className={`flex items-center gap-2 pl-4 pr-4 py-2 transition-colors text-xs ${location.pathname === item.to ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}>
                              <item.icon className="w-3.5 h-3.5 shrink-0" />
                              <span>{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Menu Items */}
                {bottomMenuItems.map((item) => {
                  const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                  const allowed = hasPermission(item.permKey);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={(e) => { if (!allowed) e.preventDefault(); }}
                      className={`flex items-center justify-between px-4 py-3 transition-colors text-sm ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'} ${!allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {!allowed && <Lock className="w-4 h-4 text-neutral-400" />}
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
                {renderMobileMenuLink('/admin/dashboard', BarChart3, '대시보드', 'dashboard', location.pathname === '/admin/dashboard')}
                {renderMobileMenuLink('/admin/orders', ShoppingCart, '주문관리', 'orders', isOrdersActive)}
                {renderMobileMenuLink('/admin/subscriptions', RefreshCw, '정기배송', 'subscriptions', location.pathname === '/admin/subscriptions')}
                {renderMobileMenuLink('/admin/equipments', Wrench, '장비관리', 'equipments', location.pathname.startsWith('/admin/equipments'))}
                {renderMobileMenuLink('/admin/products/single', Package, '상품관리', 'products', location.pathname.startsWith('/admin/products'))}
                {renderMobileMenuLink('/admin/members', Users, '회원관리', 'members', location.pathname === '/admin/members')}
                {renderMobileMenuLink('/admin/admins', Shield, '관리자', 'admins', location.pathname === '/admin/admins')}
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
