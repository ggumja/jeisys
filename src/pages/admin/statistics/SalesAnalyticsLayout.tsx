import { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router';
import { Download, Calendar, BarChart3, TrendingUp, PieChart, Users, DollarSign, Clock, Building2 } from 'lucide-react';

export function SalesAnalyticsLayout() {
  const [dateRange, setDateRange] = useState('6months');
  const location = useLocation();

  const tabs = [
    { path: '/admin/statistics/sales/overview', label: '매출 개요', icon: TrendingUp },
    { path: '/admin/statistics/sales/category', label: '카테고리별', icon: PieChart },
    { path: '/admin/statistics/sales/payment', label: '결제수단별', icon: DollarSign },
    { path: '/admin/statistics/sales/customer', label: '고객별 순위', icon: Users },
    { path: '/admin/statistics/sales/product-payment', label: '상품별 결제수단', icon: BarChart3 },
    { path: '/admin/statistics/sales/office', label: '영업처별 기여도', icon: Building2 },
    { path: '/admin/statistics/sales/trend', label: '요일/시간별', icon: Clock },
  ];

  const handleDownloadReport = () => {
    alert('리포트 다운로드 기능은 현재 준비 중입니다.');
  };

  // Base path 리다이렉션
  if (location.pathname === '/admin/statistics/sales' || location.pathname === '/admin/statistics/sales/') {
    return <Navigate to="/admin/statistics/sales/overview" replace />;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">매출 분석</h1>
          <p className="text-sm text-neutral-600">쇼핑몰 매출 성과와 구매 행동 통계를 다각도로 분석합니다.</p>
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
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-neutral-300 rounded px-3 py-1.5 text-sm bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all font-medium"
          >
            <option value="7days">최근 7일</option>
            <option value="30days">최근 30일</option>
            <option value="3months">최근 3개월</option>
            <option value="6months">최근 6개월</option>
            <option value="1year">최근 1년</option>
          </select>
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
