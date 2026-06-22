import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { adminService } from '../../../services/adminService';

// Custom ResizeObserver Hook using callback ref to bypass React conditional loading state ref issues
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

// Dynamic Mock Fallback Data Generator
function getMockSalesOverviewData(period: 'day' | 'week' | 'month' | 'quarter' | 'half', dateRange: string) {
  const now = new Date();
  const chartData = [];
  let totalSales = 0;
  let totalOrders = 0;
  const totalCustomers = 42;
  
  if (period === 'day') {
    // Generate data for past 10 days
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      const sales = 1500000 + Math.floor(Math.random() * 2000000);
      const orders = 3 + Math.floor(Math.random() * 8);
      chartData.push({ label, sales, orders, customers: Math.max(1, orders - 2) });
      totalSales += sales;
      totalOrders += orders;
    }
  } else if (period === 'week') {
    // Generate data for past 6 weeks
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - (i * 7));
      const oneJan = new Date(d.getFullYear(), 0, 1);
      const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
      const weekNum = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
      const label = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      const sales = 12000000 + Math.floor(Math.random() * 8000000);
      const orders = 25 + Math.floor(Math.random() * 30);
      chartData.push({ label, sales, orders, customers: Math.max(5, orders - 10) });
      totalSales += sales;
      totalOrders += orders;
    }
  } else if (period === 'month') {
    // Generate data for past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const sales = 45000000 + Math.floor(Math.random() * 35000000);
      const orders = 110 + Math.floor(Math.random() * 80);
      chartData.push({ label, sales, orders, customers: Math.max(20, orders - 40) });
      totalSales += sales;
      totalOrders += orders;
    }
  } else if (period === 'quarter') {
    // Generate data for past 4 quarters
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - (i * 3));
      const q = Math.floor(d.getMonth() / 3) + 1;
      const label = `${d.getFullYear()}-Q${q}`;
      const sales = 120000000 + Math.floor(Math.random() * 80000000);
      const orders = 300 + Math.floor(Math.random() * 200);
      chartData.push({ label, sales, orders, customers: Math.max(50, orders - 100) });
      totalSales += sales;
      totalOrders += orders;
    }
  } else {
    // Generate data for past 4 halves (2 years)
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - (i * 6));
      const h = Math.floor(d.getMonth() / 6) + 1;
      const label = `${d.getFullYear()}-H${h}`;
      const sales = 250000000 + Math.floor(Math.random() * 150000000);
      const orders = 600 + Math.floor(Math.random() * 400);
      chartData.push({ label, sales, orders, customers: Math.max(100, orders - 200) });
      totalSales += sales;
      totalOrders += orders;
    }
  }

  const avgOrder = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  return {
    summary: {
      totalSales,
      totalOrders,
      totalCustomers,
      avgOrder,
      salesGrowth: 14.5,
      orderGrowth: 8.2
    },
    chartData
  };
}

export function SalesOverviewPage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'half'>('day');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Resize refs
  const [chartRef, chartWidth] = useChartDimensions();

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const data = await adminService.getSalesOverviewStats(dateRange, period);
        if (data && data.chartData && data.chartData.length > 0) {
          setStats(data);
          setIsDemo(false);
        } else {
          setStats(getMockSalesOverviewData(period, dateRange));
          setIsDemo(true);
        }
      } catch (err) {
        console.error(err);
        setStats(getMockSalesOverviewData(period, dateRange));
        setIsDemo(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange, period]);

  // 분석 기간 기본값(7일/30일 등)에 맞추어 period 자동 추천 설정
  useEffect(() => {
    if (dateRange === '7days' || dateRange === '30days') {
      setPeriod('day');
    } else if (dateRange === '3months') {
      setPeriod('week');
    } else {
      setPeriod('month');
    }
  }, [dateRange]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  const { summary, chartData } = stats;

  return (
    <div className="space-y-6">
      {/* 데모 데이터 알림 배너 */}
      {isDemo && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-amber-100 text-amber-800 rounded">
              <span className="text-xs font-bold">INFO</span>
            </div>
            <div>
              <p className="text-xs text-amber-800 font-semibold">
                현재 분석 기간 내 매출 데이터가 부족하여 시각화 테스트용 데모 통계 데이터를 표시 중입니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 데이터 단위 필터 */}
      <div className="flex justify-end items-center bg-white border border-neutral-200 p-3 shadow-sm gap-2">
        <span className="text-xs text-neutral-500 font-medium">데이터 단위:</span>
        <div className="flex bg-neutral-100 p-0.5 rounded border border-neutral-200">
          {(['day', 'week', 'month', 'quarter', 'half'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                period === p
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {p === 'day' ? '일별' : p === 'week' ? '주별' : p === 'month' ? '월별' : p === 'quarter' ? '분기별' : '반기별'}
            </button>
          ))}
        </div>
      </div>

      {/* 통합 매출 및 주문/고객 추이 차트 */}
      <div className="bg-white border border-neutral-200 p-6 shadow-sm min-w-0">
        <h3 className="font-semibold text-neutral-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#21358D]" />
          <span>매출 및 주문/고객 수 추이</span>
        </h3>
        <div ref={chartRef} className="h-[400px] w-full min-w-0 relative">
          <ComposedChart width={chartWidth} height={400} data={chartData} margin={{ top: 10, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
            
            {/* Left YAxis for Sales (Bar) */}
            <YAxis 
              yAxisId="left"
              stroke="#888888" 
              style={{ fontSize: '11px', fontWeight: 500 }} 
              formatter={(v: number) => `₩${(v / 10000).toLocaleString()}만`} 
            />
            
            {/* Right YAxis for Orders and Customers (Line) */}
            <YAxis 
              yAxisId="right" 
              orientation="right"
              stroke="#888888" 
              style={{ fontSize: '11px', fontWeight: 500 }} 
              formatter={(v: number) => `${v.toLocaleString()}`}
            />
            
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
              formatter={(value: number, name: string) => {
                if (name === '매출액') {
                  return [`₩${value.toLocaleString()}`, name];
                }
                if (name === '주문건수') {
                  return [`${value.toLocaleString()}건`, name];
                }
                if (name === '고객수') {
                  return [`${value.toLocaleString()}명`, name];
                }
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
            
            {/* Bar for Sales (Left Y-Axis) */}
            <Bar 
              yAxisId="left" 
              dataKey="sales" 
              name="매출액" 
              fill="#21358D" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={50}
            />
            
            {/* Line for Orders (Right Y-Axis) */}
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="orders" 
              name="주문건수" 
              stroke="#8b5cf6" 
              strokeWidth={2} 
              dot={{ r: 3 }} 
              activeDot={{ r: 5 }} 
            />
            
            {/* Line for Customers (Right Y-Axis) */}
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="customers" 
              name="고객수" 
              stroke="#f59e0b" 
              strokeWidth={2} 
              dot={{ r: 3 }} 
              activeDot={{ r: 5 }} 
            />
          </ComposedChart>
        </div>
      </div>

      {/* 요약 지표 카드 (차트 하단으로 이동 배치) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 총 매출 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-50 text-[#21358D] rounded">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600 font-medium">총 매출</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">₩{summary.totalSales.toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-1">
            <span className={`text-xs font-semibold ${summary.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.salesGrowth >= 0 ? '+' : ''}{summary.salesGrowth}%
            </span>
            <span className="text-[10px] text-neutral-400">이전 동기 대비</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#21358D]/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
        </div>

        {/* 총 주문수 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600 font-medium">총 주문건수</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{summary.totalOrders}건</p>
          <div className="mt-2 flex items-center gap-1">
            <span className={`text-xs font-semibold ${summary.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.orderGrowth >= 0 ? '+' : ''}{summary.orderGrowth}%
            </span>
            <span className="text-[10px] text-neutral-400">이전 동기 대비</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
        </div>

        {/* 구매 고객수 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600 font-medium">구매 고객수</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{summary.totalCustomers}명</p>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs font-semibold text-neutral-500">실시간 집계</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
        </div>

        {/* 평균 주문액 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600 font-medium">평균 주문액</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">₩{summary.avgOrder.toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs text-neutral-500 font-medium">1회 거래당 평균</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
        </div>
      </div>
    </div>
  );
}
