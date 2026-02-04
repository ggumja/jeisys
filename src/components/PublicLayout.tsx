import { Outlet, Link } from 'react-router';
import logoImage from '@/assets/4591d8760fc4bee033f8f40ab29f57f1554d66ce.png';
import brandsImage from '@/assets/b5662c9e081b390cfd4a0ad2846686cabac40eaf.png';
import { Youtube, LogIn } from 'lucide-react';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Notice Bar */}
      <div className="bg-[#1e3a8a] text-white text-xs">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center gap-2">
              <span>제이시스 B2B 전용몰 - 의료인 회원 전용 쇼핑몰입니다.</span>
              <span className="font-bold">로그인 후 상품 구매가 가능합니다.</span>
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
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/login" className="flex items-center gap-3">
              <img
                src={logoImage}
                alt="Jeisys"
                className="h-6"
              />
              <span className="text-neutral-500 text-sm tracking-wide">B2B쇼핑몰</span>
            </Link>

            {/* Login Button */}
            <Link
              to="/login"
              className="flex items-center gap-2 bg-[#1e3a8a] text-white px-6 py-2.5 hover:bg-[#1e40af] transition-colors text-sm font-medium"
            >
              <LogIn className="w-4 h-4" />
              로그인
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-14rem)]">
        <Outlet />
      </main>

      {/* Brand Lineup Section */}
      <div className="bg-white mt-12">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <img
            src={brandsImage}
            alt="제이시스메디칼 장비 라인 신장"
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-100 text-neutral-600 border-t border-neutral-200">
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
    </div>
  );
}
