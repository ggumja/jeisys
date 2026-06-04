import { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router';
import { Download, Calendar, Coins, TrendingUp, Award, ShieldAlert } from 'lucide-react';

export function CreditAnalyticsLayout() {
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
    { path: '/admin/statistics/credits/overview', label: '크레딧 개요', icon: TrendingUp },
    { path: '/admin/statistics/credits/equipment', label: '장비별 통계', icon: Award },
    { path: '/admin/statistics/credits/expiry', label: '만료 임박 분석', icon: ShieldAlert },
    { path: '/admin/statistics/credits/transactions', label: '거래 통계', icon: Coins },
  ];

  const handleDownloadReport = () => {
    alert('크레딧 분석 리포트 다운로드 기능은 현재 준비 중입니다.');
  };

  // Base path 리다이렉션
  if (location.pathname === '/admin/statistics/credits' || location.pathname === '/admin/statistics/credits/') {
    return <Navigate to="/admin/statistics/credits/overview" replace />;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">크레딧 통계 분석</h1>
          <p className="text-sm text-neutral-600">장비별 크레딧 발급 및 사용 실적, 만료 예정 잔액을 통합 모니터링합니다.</p>
        </div>
        <button
          onClick={handleDownloadReport}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 active:bg-neutral-100 font-medium text-sm transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>리포트 다운로드</span>
        </button>
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
                      : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
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
        <Outlet context={{ dateRange }} />
      </div>
    </div>
  );
}
