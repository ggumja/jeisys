import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router';
import { Download, Calendar, BarChart3, TrendingUp, Archive, AlertTriangle, RefreshCw } from 'lucide-react';

export function ProductAnalyticsLayout() {
  const [selectRange, setSelectRange] = useState('6months');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const location = useLocation();

  const [showDownloadBtn, setShowDownloadBtn] = useState(false);
  const exportFnRef = useRef<(() => void) | null>(null);
  const onRegisterExport = useCallback((fn: (() => void) | null) => {
    exportFnRef.current = fn;
    setShowDownloadBtn(fn !== null);
  }, []);

  // Clear export fn when path changes
  useEffect(() => {
    exportFnRef.current = null;
    setShowDownloadBtn(false);
  }, [location.pathname]);

  const getEffectiveRange = () => {
    if (selectRange === 'custom') {
      return `custom:${customStart}_${customEnd}`;
    }
    return selectRange;
  };

  const dateRange = getEffectiveRange();

  const ranges = [
    { label: '최근 7일', value: '7days' },
    { label: '최근 30일', value: '30days' },
    { label: '최근 3개월', value: '3months' },
    { label: '최근 6개월', value: '6months' },
    { label: '최근 1년', value: '1year' },
    { label: '기간 지정', value: 'custom' },
  ];

  const tabs = [
    { path: '/admin/statistics/products/overview', label: '상품 개요', icon: TrendingUp },
    { path: '/admin/statistics/products/category', label: '상품카테고리별', icon: BarChart3 },
    { path: '/admin/statistics/products/bestseller', label: '베스트셀러', icon: AwardIcon },
    { path: '/admin/statistics/products/stock', label: '재고 분석', icon: AlertTriangle },
    { path: '/admin/statistics/products/conversion', label: '전환율 분석', icon: RefreshCw },
    { path: '/admin/statistics/products/low-performing', label: '비인기 상품', icon: Archive },
  ];

  const handleDownloadReport = async () => {
    if (!exportFnRef.current) return;
    try {
      await exportFnRef.current();
    } catch (err) {
      console.error(err);
    }
  };

  // Base path 리다이렉션
  if (location.pathname === '/admin/statistics/products' || location.pathname === '/admin/statistics/products/') {
    return <Navigate to="/admin/statistics/products/overview" replace />;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">상품 분석</h1>
          <p className="text-sm text-neutral-600">상품별 매출, 판매 성과 및 재고 모니터링 분석을 다각도로 제공합니다.</p>
        </div>
        {showDownloadBtn && (
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 active:bg-neutral-100 font-medium text-sm transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>리포트 다운로드</span>
          </button>
        )}
      </div>

      {/* 공통 필터 영역 */}
      <div className="bg-white border border-neutral-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-500" />
          <span className="text-sm text-neutral-600 font-medium">분석 기간 설정</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* 세련된 세그먼트 버튼 그룹 */}
          <div className="flex flex-wrap items-center gap-1 bg-neutral-100 p-1 border border-neutral-200/60 rounded">
            {ranges.map((r) => {
              const isActive = selectRange === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectRange(r.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                  }`}
                  style={isActive ? { backgroundColor: '#21358D' } : undefined}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {selectRange === 'custom' && (
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border border-neutral-300 rounded px-2.5 py-1.5 text-xs bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900 font-semibold"
              />
              <span className="text-neutral-400 text-xs">~</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border border-neutral-300 rounded px-2.5 py-1.5 text-xs bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900 font-semibold"
              />
            </div>
          )}
        </div>
      </div>

      {/* 상단 탭 바 (Brand Color #21358D 적용) */}
      <div className="border-b border-neutral-200 bg-white px-2 pt-2 flex flex-wrap gap-1 shadow-sm">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const TabIcon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[1px] ${
                isActive
                  ? 'border-[#21358D] text-[#21358D] bg-blue-50/20'
                  : 'border-transparent text-neutral-600 hover:text-neutral-950 hover:border-neutral-300'
              }`}
            >
              <TabIcon className={`w-4 h-4 ${isActive ? 'text-[#21358D]' : 'text-neutral-400'}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 하위 컴포넌트 렌더링 */}
      <div className="min-h-[400px]">
        <Outlet context={{ dateRange, onRegisterExport }} />
      </div>
    </div>
  );
}

// AwardIcon 헬퍼 컴포넌트
function AwardIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}
