import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { adminService } from '../../../services/adminService';

export function SalesOverviewPage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const data = await adminService.getSalesOverviewStats(dateRange, period);
        setStats(data);
      } catch (err) {
        console.error(err);
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
      {/* 데이터 단위 필터 */}
      <div className="flex justify-end items-center bg-white border border-neutral-200 p-3 shadow-sm gap-2">
        <span className="text-xs text-neutral-500 font-medium">데이터 단위:</span>
        <div className="flex bg-neutral-100 p-0.5 rounded border border-neutral-200">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                period === p
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {p === 'day' ? '일별' : p === 'week' ? '주별' : '월별'}
            </button>
          ))}
        </div>
      </div>

      {/* 요약 지표 카드 */}
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

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 매출 트렌드 차트 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-neutral-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#21358D]" />
            <span>매출 추이</span>
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#21358D" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#21358D" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
                <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} formatter={(v: number) => `₩${(v / 10000).toLocaleString()}만`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  formatter={(value: number) => [`₩${value.toLocaleString()}`, '매출액']}
                />
                <Area type="monotone" dataKey="sales" stroke="#21358D" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 주문건수 및 구매 고객수 차트 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm">
          <h3 className="font-semibold text-neutral-900 mb-6 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-indigo-600" />
            <span>주문 및 고객 수 추이</span>
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
                <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
                <Bar dataKey="orders" name="주문건수" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="customers" name="고객수" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
