import { ShoppingCart, Users, Package, DollarSign, ArrowUpRight, ArrowDownRight, Loader2, Calendar, Eye } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { adminService } from '../../services/adminService';

// Custom ResizeObserver Hook using callback ref
function useChartDimensions(defaultWidth = 500) {
  const [width, setWidth] = useState(defaultWidth);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node) {
      const observer = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const { width } = entries[0].contentRect;
        if (width > 0) {
          setWidth(width);
        }
      });
      observer.observe(node);
      observerRef.current = observer;

      const initialWidth = node.getBoundingClientRect().width;
      if (initialWidth > 0) {
        setWidth(initialWidth);
      }
    }
  }, []);

  return [ref, width] as const;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Resize Refs for Recharts rendering stability
  const [trendRef, trendWidth] = useChartDimensions(600);
  const [categoryRef, categoryWidth] = useChartDimensions(300);
  const [paymentRef, paymentWidth] = useChartDimensions(300);
  const [regionRef, regionWidth] = useChartDimensions(600);
  
  // Filters
  const [dateRange, setDateRange] = useState('month'); // month, year, cumulative, custom
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Comprehensive Stats State
  const [stats, setStats] = useState({
    periodSales: 0,
    newUsersCount: 0,
    avgSalesPerCustomer: 0,
    avgSalesPerOrder: 0,
    buyingUsersCount: 0,
    periodOrdersCount: 0,
    paymentData: [] as { name: string; value: number; percentage: number }[],
    categoryData: [] as { name: string; value: number; color: string }[],
    bestProducts: [] as { name: string; sales: number; revenue: number }[],
    topCustomers: [] as { name: string; hospitalName: string; totalSales: number }[],
    regionSales: [] as { region: string; sales: number; percentage: number }[],
    trendData: [] as { label: string; sales: number }[]
  });

  // Cumulative Static Stats (Independent of period)
  const [cumulativeStats, setCumulativeStats] = useState({
    totalSales: 0,
    totalUsers: 0,
    lowStockProducts: 0,
    totalProducts: 0,
    gradeStats: {
      VIP: { count: 0, percentage: 0 },
      Gold: { count: 0, percentage: 0 },
      Silver: { count: 0, percentage: 0 },
      Bronze: { count: 0, percentage: 0 }
    }
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadFilteredStats();
  }, [dateRange, customStart, customEnd]);

  const loadInitialData = async () => {
    try {
      const basicStats = await adminService.getDashboardStats();
      setCumulativeStats({
        totalSales: basicStats.monthSales,
        totalUsers: basicStats.totalUsers,
        lowStockProducts: basicStats.lowStockProducts,
        totalProducts: basicStats.totalProducts,
        gradeStats: basicStats.gradeStats
      });
    } catch (error) {
      console.error('Failed to load initial dashboard config', error);
    }
  };

  const loadFilteredStats = async () => {
    try {
      setLoading(true);
      const effectiveRange = dateRange === 'custom' ? `custom:${customStart}_${customEnd}` : dateRange;
      
      const [comprehensive, basicStats] = await Promise.all([
        adminService.getDashboardComprehensiveStats({
          dateRange: effectiveRange
        }),
        // Fetch static stats for total cumulative items
        adminService.getDashboardComprehensiveStats({
          dateRange: 'cumulative'
        })
      ]);

      setStats(comprehensive);
      setCumulativeStats(prev => ({
        ...prev,
        totalSales: basicStats.periodSales
      }));
    } catch (error) {
      console.error('Failed to filter dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeClick = (grade: string) => {
    navigate(`/admin/members?grade=${grade}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 타이틀 및 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-1">대시보드</h1>
          <p className="text-sm text-neutral-600">제이시스메디칼 쇼핑몰 운영 성과와 통계를 통합 필터링하여 확인하세요.</p>
        </div>
      </div>

      {/* 필터바 영역 */}
      <div className="bg-white border border-neutral-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 bg-neutral-100 p-1 border border-neutral-200 rounded">
            {[
              { label: '당월', value: 'month' },
              { label: '올해', value: 'year' },
              { label: '총 누적', value: 'cumulative' },
              { label: '기간지정', value: 'custom' }
            ].map(opt => {
              const active = dateRange === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setDateRange(opt.value)}
                  className={`px-5 py-1.5 text-xs font-semibold rounded transition-all ${
                    active ? 'text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                  }`}
                  style={active ? { backgroundColor: '#21358D' } : undefined}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="border border-neutral-300 rounded px-2.5 py-1.5 text-xs bg-white font-semibold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
              <span className="text-neutral-400 text-xs">~</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="border border-neutral-300 rounded px-2.5 py-1.5 text-xs bg-white font-semibold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center bg-white border border-neutral-200">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : (
        <>
          {/* 1단: 고정/누적 지표 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-neutral-200 p-6 shadow-sm cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => navigate('/admin/members')}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-neutral-900 text-white rounded">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-neutral-500 font-medium mb-1">누적 총 회원수</p>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">{cumulativeStats.totalUsers.toLocaleString()}명</p>
            </div>

            <div className="bg-white border border-neutral-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-neutral-900 text-white rounded">
                  <Package className="w-5 h-5" />
                </div>
                {cumulativeStats.lowStockProducts > 0 && (
                  <span className="text-xs text-red-600 bg-red-50 font-bold px-2 py-0.5 rounded-full">재고부족 {cumulativeStats.lowStockProducts}</span>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-medium mb-1">전체 등록 상품수</p>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">{cumulativeStats.totalProducts.toLocaleString()}개</p>
            </div>

            <div className="bg-white border border-neutral-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-neutral-900 text-white rounded">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-neutral-500 font-medium mb-1">선택기간 총 매출</p>
              <p className="text-2xl font-bold tracking-tight text-[#21358D]">₩{stats.periodSales.toLocaleString()}</p>
            </div>
          </div>

          {/* 2단: 기간 선택형 동적 지표 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-neutral-50 border border-neutral-200 p-5 rounded flex flex-col justify-between">
              <span className="text-xs text-neutral-500 font-bold">신규 회원수 (선택 기간)</span>
              <p className="text-3xl font-extrabold text-neutral-900 mt-2 font-mono">{stats.newUsersCount}명</p>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 p-5 rounded flex flex-col justify-between">
              <span className="text-xs text-neutral-500 font-bold">누적 구매 회원수 (선택 기간)</span>
              <p className="text-3xl font-extrabold text-neutral-900 mt-2 font-mono">{stats.buyingUsersCount}명</p>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 p-5 rounded flex flex-col justify-between">
              <span className="text-xs text-neutral-500 font-bold">총 구매건수 (선택 기간)</span>
              <p className="text-3xl font-extrabold text-neutral-900 mt-2 font-mono">{stats.periodOrdersCount}건</p>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 p-5 rounded flex flex-col justify-between">
              <span className="text-xs text-neutral-500 font-bold">거래처당 평균 매출 (선택 기간)</span>
              <p className="text-2xl font-extrabold text-[#21358D] mt-2 font-mono">₩{stats.avgSalesPerCustomer.toLocaleString()}</p>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 p-5 rounded flex flex-col justify-between">
              <span className="text-xs text-neutral-500 font-bold">주문 건당 평균 매출 (선택 기간)</span>
              <p className="text-2xl font-extrabold text-[#21358D] mt-2 font-mono">₩{stats.avgSalesPerOrder.toLocaleString()}</p>
            </div>
          </div>

          {/* 3단: 시각화 차트 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 매출 추이 시계열 그래프 */}
            <div className="lg:col-span-2 bg-white border border-neutral-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-neutral-900">선택 기간 매출 추이</h2>
              </div>
              <div ref={trendRef} className="h-[300px] w-full min-w-0 relative">
                {stats.trendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-neutral-400">조회된 기간 내 매출 데이터가 없습니다.</div>
                ) : (
                  <AreaChart width={trendWidth} height={300} data={stats.trendData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#21358D" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#21358D" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} formatter={(val: number) => `₩${(val/10000).toLocaleString()}만`} />
                    <Tooltip formatter={(value: number) => [`₩${value.toLocaleString()}`, '매출액']} />
                    <Area type="monotone" dataKey="sales" stroke="#21358D" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                )}
              </div>
            </div>

            {/* 카테고리별 매출 비율 (도넛 차트) */}
            <div className="bg-white border border-neutral-200 p-6 shadow-sm flex flex-col justify-between">
              <h2 className="text-base font-bold text-neutral-900 mb-4">카테고리별 매출 비중</h2>
              <div ref={categoryRef} className="h-[220px] w-full min-w-0 relative">
                {stats.categoryData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-neutral-400">데이터 없음</div>
                ) : (
                  <PieChart width={categoryWidth} height={220}>
                    <Pie
                      data={stats.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stats.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value}%`} />
                  </PieChart>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                {stats.categoryData.slice(0, 4).map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-neutral-600 truncate">{entry.name} ({entry.value}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 결제수단별 매출 비중 */}
            <div className="bg-white border border-neutral-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900 mb-4">결제수단별 매출 비율</h2>
              <div ref={paymentRef} className="h-[200px] w-full min-w-0 relative">
                {stats.paymentData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-neutral-400 font-medium">결제 데이터 없음</div>
                ) : (
                  <PieChart width={paymentWidth} height={200}>
                    <Pie
                      data={stats.paymentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {stats.paymentData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#21358D', '#4b5563', '#9ca3af', '#d1d5db', '#e5e7eb'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`₩${value.toLocaleString()}`, '매출액']} />
                  </PieChart>
                )}
              </div>
            </div>

            {/* 지역별 매출 (병원 주소 파싱) */}
            <div className="lg:col-span-2 bg-white border border-neutral-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900 mb-4">지역별 매출 분포</h2>
              <div ref={regionRef} className="h-[200px] w-full min-w-0 relative">
                {stats.regionSales.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-neutral-400 font-medium">지역 매출 데이터 없음</div>
                ) : (
                  <BarChart width={regionWidth} height={200} data={stats.regionSales.slice(0, 7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="region" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} formatter={(val: number) => `₩${(val/10000).toLocaleString()}만`} />
                    <Tooltip formatter={(value: number) => [`₩${value.toLocaleString()}`, '매출액']} />
                    <Bar dataKey="sales" fill="#21358D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </div>
            </div>
          </div>

          {/* 4단: 베스트셀러 및 TOP구매 거래처 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 베스트셀러 제품 */}
            <div className="bg-white border border-neutral-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900 mb-4">베스트셀러 제품 TOP 5</h2>
              <div className="space-y-4">
                {stats.bestProducts.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 text-sm">해당 기간 판매 제품이 없습니다.</div>
                ) : (
                  stats.bestProducts.map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-3 border-b border-neutral-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{prod.name}</p>
                          <p className="text-xs text-neutral-500 font-bold">{prod.sales.toLocaleString()}개 판매</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-neutral-900">₩{prod.revenue.toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* TOP 구매 거래처 */}
            <div className="bg-white border border-neutral-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900 mb-4">TOP 구매 거래처</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="py-2.5 px-3 font-semibold text-neutral-700 text-xs">순위</th>
                      <th className="py-2.5 px-3 font-semibold text-neutral-700 text-xs">병원명</th>
                      <th className="py-2.5 px-3 font-semibold text-neutral-700 text-xs">담당자</th>
                      <th className="py-2.5 px-3 font-semibold text-neutral-700 text-xs text-right">총 구매액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {stats.topCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-neutral-400 text-xs font-medium">거래처 데이터가 없습니다.</td>
                      </tr>
                    ) : (
                      stats.topCustomers.map((cust, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-neutral-900 text-xs">{idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-neutral-900 text-xs">{cust.hospitalName}</td>
                          <td className="py-3 px-3 text-neutral-600 text-xs">{cust.name}</td>
                          <td className="py-3 px-3 font-bold text-neutral-900 text-xs text-right">₩{cust.totalSales.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 회원 등급별 현황 */}
          <div className="bg-white border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-neutral-900 mb-4">회원 등급별 현황</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { grade: 'VIP', color: '#8b5cf6', data: cumulativeStats.gradeStats.VIP },
                { grade: 'Gold', color: '#eab308', data: cumulativeStats.gradeStats.Gold },
                { grade: 'Silver', color: '#9ca3af', data: cumulativeStats.gradeStats.Silver },
                { grade: 'Bronze', color: '#ea580c', data: cumulativeStats.gradeStats.Bronze }
              ].map(g => (
                <div
                  key={g.grade}
                  onClick={() => handleGradeClick(g.grade)}
                  className="p-4 border border-neutral-200 rounded cursor-pointer hover:border-neutral-900 transition-all hover:shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-600 font-bold">{g.grade} 등급</span>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-neutral-900 font-mono mb-1">{g.data?.count || 0}명</p>
                  <p className="text-xs text-neutral-500 font-medium font-mono">전체의 {g.data?.percentage || 0}%</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}