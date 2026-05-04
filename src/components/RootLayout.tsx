import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { ShoppingCart, Package, Zap, ChevronDown, LogOut, User, Globe, AlertCircle, X, Send, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { cartService, proxyOrderService } from '../services/cartService';
import { FloatingButtons } from './FloatingButtons';
import { ModalProvider } from '../context/ModalContext';
import { ScrollToTop } from './ScrollToTop';
import logoImage from '@/assets/4591d8760fc4bee033f8f40ab29f57f1554d66ce.png';


export function RootLayout() {
  return <RootLayoutContent />;
}

function RootLayoutContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [showCommunicationDropdown, setShowCommunicationDropdown] = useState(false);
  const [proxyName, setProxyName] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const user = storage.getUser();

  useEffect(() => {
    // 홈('/')은 비로그인도 허용, 나머지는 로그인 필요
    if (!user && location.pathname !== '/') {
      navigate('/login');
      return;
    }

    if (user) {
      cartService.getCart()
        .then(items => setCartCount(items.length))
        .catch(() => setCartCount(0));

      // proxy 모드 배너
      setProxyName(proxyOrderService.getProxyCustomerName());
    }
  }, [user, navigate, location]);

  const handleLogout = () => {
    storage.clearAll();
    navigate('/');
  };

  const navItems = [
    { to: '/', label: '홈' },
    { to: '/quick-order', label: '최근 구매 상품' },
    { to: '/products', label: '상품' },
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


  return (
    <div className="w-full bg-white flex flex-col min-h-screen" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      <ScrollToTop />
        <header
          className="bg-white border-b border-neutral-200 sticky top-0 z-50"
          style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}
        >
          {/* 대리주문 모드 배너 */}
          {proxyName && (
            <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0' }} className="bg-amber-50 border-b-2 border-amber-300 py-2.5 flex items-center justify-between gap-4">
              {/* 좌: 상태 표시 */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center justify-center w-7 h-7 bg-amber-400 rounded-sm flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wide">대리 주문 모드</span>
                  <p className="text-xs text-amber-700 truncate">
                    현재 <strong>{proxyName}</strong>을 대신해 쇼핑 중입니다.
                  </p>
                </div>
              </div>
              {/* 우: 액션 버튼 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate('/cart')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-amber-400 text-amber-900 bg-white hover:bg-amber-100 transition-colors rounded-sm"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  장바구니 확인
                </button>
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-amber-400 text-amber-900 bg-white hover:bg-amber-100 transition-colors rounded-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  결제 링크·문자 발송
                </button>
                <button
                  onClick={() => { proxyOrderService.endProxy(); setProxyName(null); navigate('/admin/members'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-colors rounded-sm"
                >
                  <X className="w-3.5 h-3.5" />
                  대리 주문 종료
                </button>
              </div>
            </div>
          )}

          {/* ── Single row nav bar ──────────────────────────────── */}
          <div
            style={{ maxWidth: '1440px', margin: '0 auto', padding: '0', height: '80px', display: 'grid', alignItems: 'center', gridTemplateColumns: '1fr auto 1fr' }}
          >
            {/* 왼쪽: Logo + B2B 쇼핑몰 */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center flex-shrink-0">
                <img src={logoImage} alt="Jeisys" className="h-9" />
              </Link>
            </div>

            {/* 가운데: Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-base font-normal tracking-tight text-neutral-900 hover:text-neutral-500 transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ))}

              <div
                className="relative group"
                onMouseEnter={() => setShowCommunicationDropdown(true)}
                onMouseLeave={() => setShowCommunicationDropdown(false)}
              >
                <button className="flex items-center gap-1 text-base font-normal tracking-tight text-neutral-900 hover:text-neutral-500 transition-colors whitespace-nowrap">
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

            {/* 오른쪽: Icons / Auth */}
            <div className="flex items-center justify-end gap-3">
              {user ? (
                <>
                  {/* ADMIN 배지 + 마이페이지 아이콘 */}
                  {user.role === 'admin' ? (
                    <>
                      {/* ADMIN 배지 → /admin */}
                      <Link
                        to="/admin"
                        className="hidden md:flex items-center hover:opacity-80 transition-opacity"
                      >
                        <span className="bg-neutral-900 text-white text-[10px] font-black px-2 py-0.5 rounded-sm tracking-widest uppercase">
                          ADMIN
                        </span>
                      </Link>
                      {/* 사람 아이콘 → /mypage/orders */}
                      <Link to="/mypage/orders" className="hidden md:flex items-center justify-center p-1 text-neutral-700 hover:text-neutral-900 transition-colors">
                        <User className="w-5 h-5" />
                      </Link>
                    </>
                  ) : (
                    <Link to="/mypage/orders" className="hidden md:flex items-center justify-center p-1 text-neutral-700 hover:text-neutral-900 transition-colors">
                      <User className="w-5 h-5" />
                    </Link>
                  )}

                  {/* 로그아웃 아이콘 */}
                  <button
                    onClick={handleLogout}
                    className="hidden md:flex items-center justify-center p-1 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                    title="로그아웃"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>

                  {/* 장바구니 아이콘 + 배지 */}
                  <Link to="/cart" className="relative flex items-center justify-center p-1 text-neutral-700 hover:text-neutral-900 transition-colors">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                <>
                  {/* 비로그인: 로그인 / 회원가입 */}
                  <Link
                    to="/login"
                    className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/signup"
                    className="text-sm font-medium bg-neutral-900 text-white px-4 py-1.5 hover:bg-neutral-700 transition-colors"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-grow">
          <Outlet />
        </main>



        <footer
          style={{
            backgroundColor: '#1f262e',
            color: '#9ba3af',
            fontSize: '14px',
            lineHeight: '1.6',
            width: '100vw',
            marginLeft: 'calc(50% - 50vw)',
            boxSizing: 'border-box',
          }}
        >
          {/* 1440px 내부 컨테이너 */}
          <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '40px 0' }}>
          {/* Top bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '30px',
            borderBottom: '1px solid #2d3641',
            marginBottom: '50px',
          }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Link to="/cyber" style={{ color: '#d1d5db', textDecoration: 'none' }}>사이버신문고</Link>
              <Link to="/privacy" style={{ color: '#d1d5db', textDecoration: 'none', fontWeight: 'bold' }}>개인정보처리방침</Link>
            </div>
            <select style={{
              backgroundColor: '#2d3641',
              color: '#d1d5db',
              border: '1px solid #3f4a56',
              padding: '8px 16px',
              borderRadius: '20px',
              width: '180px',
              cursor: 'pointer',
              fontSize: '14px',
            }}>
              <option>Family site</option>
            </select>
          </div>

          {/* Bottom content */}
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px' }}>

            {/* Left: Company Info */}
            <div style={{ flex: 1, minWidth: '400px' }}>
              <span style={{
                display: 'block',
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#4b5563',
                marginBottom: '20px',
                fontFamily: "'Palatino', 'Palatino Linotype', Georgia, serif",
              }}>
                Jeisys
              </span>
              <p style={{ fontWeight: 'bold', color: '#d1d5db', marginBottom: '15px' }}>(주)제이시스메디칼</p>
              <ul style={{
                listStyle: 'none',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '5px 15px',
                marginBottom: '20px',
                padding: 0,
              }}>
                <li><span style={{ marginRight: '5px' }}>대표자:</span>이라미</li>
                <li><span style={{ marginRight: '5px' }}>대표번호:</span>070-7435-4927</li>
                <li><span style={{ marginRight: '5px' }}>E-mail:</span>webmaster@jeisys.com</li>
                <li><span style={{ marginRight: '5px' }}>사업자등록번호:</span>424-87-00852</li>
                <li><span style={{ marginRight: '5px' }}>통신판매업 신고번호:</span>제 2022-서울금천-0845호</li>
                <li><span style={{ marginRight: '5px' }}>개인정보관리책임자:</span>박종선</li>
                <li>주소: 서울특별시 금천구 가산산로 96 대륭테크노타운6동</li>
              </ul>
              <p style={{ marginTop: '30px', fontSize: '13px' }}>
                본 사이트의 이미지에 대한 모든 권한은 (주)제이시스메디칼에 있습니다. 무단 도용 시 법적 제재를 받으실 수 있습니다.
              </p>
            </div>

            {/* Right: CS Centers */}
            <div style={{ display: 'flex', gap: '60px' }}>

              <div>
                <h3 style={{ color: '#d1d5db', fontSize: '16px', marginBottom: '15px', fontWeight: 500 }}>고객지원센터</h3>
                <span style={{ display: 'block', fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '15px' }}>070-7435-4927</span>
                <div style={{ fontSize: '13px', color: '#9ba3af' }}>
                  평일: 오전 9시 ~ 오후 5시<br />
                  휴일: 토요일, 일요일, 공휴일<br />
                  주문마감: 오후 2시 30분<br />
                  배달 및 제주(도) 오후 1시 마감
                </div>
              </div>

              <div>
                <h3 style={{ color: '#d1d5db', fontSize: '16px', marginBottom: '15px', fontWeight: 500 }}>AS고객센터</h3>
                <span style={{ display: 'block', fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '15px' }}>1544-1639</span>
                <div style={{ fontSize: '13px', color: '#9ba3af' }}>
                  평일: 오전 10시 ~ 오후 4시<br />
                  휴일: 토요일, 일요일, 공휴일
                </div>
              </div>

              <div>
                <h3 style={{ color: '#d1d5db', fontSize: '16px', marginBottom: '15px', fontWeight: 500 }}>입금계좌 우리은행</h3>
                <span style={{ display: 'block', fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '15px' }}>1005-803-786090</span>
                <div style={{ fontSize: '13px', color: '#9ba3af' }}>
                  예금주: (주)제이시스메디칼
                </div>
              </div>

            </div>
          </div>
          </div>
        </footer>

        <FloatingButtons />

        {/* 결제 링크 발송 모달 */}
        {showLinkModal && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            onClick={() => setShowLinkModal(false)}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="relative bg-white w-full max-w-md mx-4 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-amber-600" />
                  <h3 className="text-base font-black text-neutral-900">결제 링크 발송</h3>
                </div>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="p-1.5 hover:bg-neutral-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-neutral-500" />
                </button>
              </div>

              {/* 모달 바디 */}
              <div className="px-6 py-5 space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-3 rounded">
                  <p className="text-xs text-amber-800 font-medium">
                    <strong>{proxyName}</strong> 고객에게 아래 링크를 전달하세요.
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    고객이 링크에 접속하면 장바구니에서 담긴 상품을 확인하고 결제할 수 있습니다.
                  </p>
                </div>

                {/* 링크 URL 박스 */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">결제 링크</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/cart`}
                      className="flex-1 text-sm px-3 py-2.5 border border-neutral-200 bg-neutral-50 text-neutral-700 select-all"
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/cart`);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-colors ${
                        linkCopied
                          ? 'bg-green-600 text-white'
                          : 'bg-neutral-900 text-white hover:bg-neutral-700'
                      }`}
                    >
                      {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {linkCopied ? '복사됨!' : '복사'}
                    </button>
                  </div>
                </div>

                {/* 안내 문구 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">문자 안내 문구</label>
                  <textarea
                    readOnly
                    rows={4}
                    value={`[제이시스메디칼] 안녕하세요, ${proxyName}님.\n\n주문 내역을 장바구니에 담아드렸습니다.\n아래 링크에서 확인 후 결제를 완료해 주세요.\n\n${window.location.origin}/cart`}
                    className="w-full text-xs px-3 py-2.5 border border-neutral-200 bg-neutral-50 text-neutral-600 resize-none"
                    onClick={e => (e.target as HTMLTextAreaElement).select()}
                  />
                  <button
                    onClick={() => {
                      const text = `[제이시스메디칼] 안녕하세요, ${proxyName}님.\n\n주문 내역을 장바구니에 담아드렸습니다.\n아래 링크에서 확인 후 결제를 완료해 주세요.\n\n${window.location.origin}/cart`;
                      navigator.clipboard.writeText(text);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                    className="w-full py-2.5 text-xs font-bold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    문자 내용 전체 복사
                  </button>
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="px-6 py-4 border-t border-neutral-100 flex justify-end">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-6 py-2.5 text-sm font-bold bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}