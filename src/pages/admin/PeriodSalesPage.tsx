import { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, ShoppingCart, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminService } from '../../services/adminService';

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function PeriodSalesPage() {
  const now = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{ rows: any[]; totalSales: number; totalOrders: number } | null>(null);

  useEffect(() => {
    async function fetch() {
      setIsLoading(true);
      try {
        const result = await adminService.getPeriodSalesStats(viewMode, selectedYear, selectedMonth);
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [viewMode, selectedYear, selectedMonth]);

  const rows = data?.rows ?? [];
  const totalSales = data?.totalSales ?? 0;
  const totalOrders = data?.totalOrders ?? 0;
  const avgOrderAmount = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  const maxSales = rows.length > 0 ? Math.max(...rows.map(r => r.sales)) : 0;
  const maxRow = rows.find(r => r.sales === maxSales);

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const modeLabel: Record<ViewMode, string> = {
    daily: '일별',
    weekly: '주별',
    monthly: '월별',
    yearly: '연도별',
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">기간별 매출현황</h1>
          <p className="text-sm text-neutral-600">일별·주별·월별·연도별 실제 매출을 조회합니다.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 font-medium text-sm transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          <span>Excel 다운로드</span>
        </button>
      </div>

      {/* 기간 선택 필터 */}
      <div className="bg-white border border-neutral-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          {/* 조회 단위 */}
          <div>
            <p className="text-xs text-neutral-500 font-medium mb-2">조회 단위</p>
            <div className="flex items-center gap-1 bg-neutral-100 p-1 border border-neutral-200/60 rounded">
              {(['daily', 'weekly', 'monthly', 'yearly'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                    viewMode === mode ? 'text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
                  }`}
                  style={viewMode === mode ? { backgroundColor: '#21358D' } : undefined}
                >
                  {modeLabel[mode]}
                </button>
              ))}
            </div>
          </div>

          {/* 연도 선택 */}
          {viewMode !== 'yearly' && (
            <div>
              <p className="text-xs text-neutral-500 font-medium mb-2">연도</p>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="border border-neutral-300 rounded px-3 py-1.5 text-sm bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
            </div>
          )}

          {/* 월 선택 (일별/주별만) */}
          {(viewMode === 'daily' || viewMode === 'weekly') && (
            <div>
              <p className="text-xs text-neutral-500 font-medium mb-2">월</p>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="border border-neutral-300 rounded px-3 py-1.5 text-sm bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: '총 매출',
            value: `₩${totalSales.toLocaleString()}`,
            sub: '',
            icon: TrendingUp,
            color: '#21358D',
          },
          {
            label: '총 주문',
            value: `${totalOrders.toLocaleString()}건`,
            sub: rows.length > 0 ? `평균 ${Math.round(totalOrders / rows.length)}건/${modeLabel[viewMode].replace('별', '')}` : '-',
            icon: ShoppingCart,
            color: '#059669',
          },
          {
            label: '평균 주문액',
            value: `₩${avgOrderAmount.toLocaleString()}`,
            sub: '건당 평균',
            icon: BarChart3,
            color: '#d97706',
          },
          {
            label: '최고 매출',
            value: maxSales > 0 ? `₩${maxSales.toLocaleString()}` : '-',
            sub: maxRow?.label ?? '',
            icon: TrendingUp,
            color: '#7c3aed',
          },
        ].map(card => (
          <div key={card.label} className="bg-white border border-neutral-200 p-5 shadow-sm">
            <p className="text-xs text-neutral-500 font-medium mb-2">{card.label}</p>
            <p className="text-xl font-bold text-neutral-900 mb-1">{isLoading ? '...' : card.value}</p>
            {card.sub && <p className="text-xs text-neutral-400">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* 차트 */}
      <div className="bg-white border border-neutral-200 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-700 mb-5">매출 추이</h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">해당 기간 데이터가 없습니다.</div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={v => `₩${(v / 10000).toFixed(0)}만`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 }}
                formatter={(value: number) => [`₩${value.toLocaleString()}`, '매출']}
              />
              <Bar dataKey="sales" name="매출" fill="#21358D" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 상세 테이블 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-700">상세 데이터</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-6 font-semibold text-neutral-700">기간</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 text-right">매출액</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 text-right">주문건수</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 text-right">평균 주문액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-16">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#21358D] mx-auto" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-neutral-400">해당 기간 데이터가 없습니다.</td>
                </tr>
              ) : (
                <>
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-6 font-medium text-neutral-900">{row.label}</td>
                      <td className="py-3 px-6 text-right font-semibold text-neutral-900">₩{row.sales.toLocaleString()}</td>
                      <td className="py-3 px-6 text-right text-neutral-600">{row.orders}건</td>
                      <td className="py-3 px-6 text-right text-neutral-600">₩{row.avgOrder.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-neutral-50 font-semibold border-t border-neutral-200">
                    <td className="py-3 px-6 text-neutral-700">합계</td>
                    <td className="py-3 px-6 text-right text-neutral-900">₩{totalSales.toLocaleString()}</td>
                    <td className="py-3 px-6 text-right text-neutral-900">{totalOrders}건</td>
                    <td className="py-3 px-6 text-right text-neutral-900">₩{avgOrderAmount.toLocaleString()}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}