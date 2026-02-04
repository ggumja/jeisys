import { useState } from 'react';
import { Calendar as CalendarIcon, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar } from '../../components/ui/calendar';
import type { DateRange } from 'react-day-picker';

export function PeriodSalesPage() {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('1');

  // 일별 데이터 (2026년 1월)
  const dailyData = [
    { date: '01/01', sales: 2300000, orders: 4, avgOrder: 575000 },
    { date: '01/02', sales: 2050000, orders: 4, avgOrder: 512500 },
    { date: '01/03', sales: 3400000, orders: 6, avgOrder: 566667 },
    { date: '01/04', sales: 2850000, orders: 5, avgOrder: 570000 },
    { date: '01/05', sales: 2200000, orders: 4, avgOrder: 550000 },
    { date: '01/06', sales: 3100000, orders: 6, avgOrder: 516667 },
    { date: '01/07', sales: 2900000, orders: 5, avgOrder: 580000 },
    { date: '01/08', sales: 2650000, orders: 5, avgOrder: 530000 },
    { date: '01/09', sales: 1980000, orders: 3, avgOrder: 660000 },
    { date: '01/10', sales: 3600000, orders: 7, avgOrder: 514286 },
    { date: '01/11', sales: 2950000, orders: 5, avgOrder: 590000 },
    { date: '01/12', sales: 2450000, orders: 4, avgOrder: 612500 },
    { date: '01/13', sales: 3200000, orders: 6, avgOrder: 533333 },
    { date: '01/14', sales: 2800000, orders: 5, avgOrder: 560000 },
    { date: '01/15', sales: 2150000, orders: 4, avgOrder: 537500 },
    { date: '01/16', sales: 3500000, orders: 7, avgOrder: 500000 },
    { date: '01/17', sales: 2900000, orders: 5, avgOrder: 580000 },
    { date: '01/18', sales: 2600000, orders: 5, avgOrder: 520000 },
    { date: '01/19', sales: 1850000, orders: 3, avgOrder: 616667 },
    { date: '01/20', sales: 3300000, orders: 6, avgOrder: 550000 },
    { date: '01/21', sales: 2950000, orders: 5, avgOrder: 590000 },
    { date: '01/22', sales: 2400000, orders: 4, avgOrder: 600000 },
    { date: '01/23', sales: 3100000, orders: 6, avgOrder: 516667 },
    { date: '01/24', sales: 2750000, orders: 5, avgOrder: 550000 },
    { date: '01/25', sales: 2200000, orders: 4, avgOrder: 550000 },
    { date: '01/26', sales: 1900000, orders: 3, avgOrder: 633333 },
    { date: '01/27', sales: 3400000, orders: 6, avgOrder: 566667 },
    { date: '01/28', sales: 2900000, orders: 5, avgOrder: 580000 },
    { date: '01/29', sales: 2650000, orders: 5, avgOrder: 530000 },
    { date: '01/30', sales: 3200000, orders: 6, avgOrder: 533333 },
    { date: '01/31', sales: 2850000, orders: 5, avgOrder: 570000 },
  ];

  // 주별 데이터 (최근 8주: 2025년 12월 중순 ~ 2026년 2월 초)
  const weeklyData = [
    { week: '1주차 (12/9-12/15)', sales: 18200000, orders: 34, avgOrder: 535294, growth: 8.3 },
    { week: '2주차 (12/16-12/22)', sales: 19100000, orders: 36, avgOrder: 530556, growth: 10.5 },
    { week: '3주차 (12/23-12/29)', sales: 21500000, orders: 40, avgOrder: 537500, growth: 15.2 },
    { week: '4주차 (12/30-1/5)', sales: 20800000, orders: 38, avgOrder: 547368, growth: 13.8 },
    { week: '5주차 (1/6-1/12)', sales: 19700000, orders: 36, avgOrder: 547222, growth: 11.4 },
    { week: '6주차 (1/13-1/19)', sales: 18900000, orders: 35, avgOrder: 540000, growth: 9.6 },
    { week: '7주차 (1/20-1/26)', sales: 19600000, orders: 36, avgOrder: 544444, growth: 11.2 },
    { week: '8주차 (1/27-2/2)', sales: 20300000, orders: 37, avgOrder: 548649, growth: 12.8 },
  ];

  // 월별 데이터 (2025년 6월 ~ 2026년 2월)
  const monthlyData = [
    { month: '2025년 6월', sales: 67000000, orders: 132, avgOrder: 507576, growth: 0, prevYear: 55000000 },
    { month: '2025년 7월', sales: 72000000, orders: 142, avgOrder: 507042, growth: 7.5, prevYear: 58000000 },
    { month: '2025년 8월', sales: 78000000, orders: 152, avgOrder: 513158, growth: 16.4, prevYear: 62000000 },
    { month: '2025년 9월', sales: 74000000, orders: 145, avgOrder: 510345, growth: 25.4, prevYear: 59000000 },
    { month: '2025년 10월', sales: 81000000, orders: 158, avgOrder: 512658, growth: 24.6, prevYear: 65000000 },
    { month: '2025년 11월', sales: 85000000, orders: 166, avgOrder: 512048, growth: 21.4, prevYear: 70000000 },
    { month: '2025년 12월', sales: 92000000, orders: 180, avgOrder: 511111, growth: 22.7, prevYear: 75000000 },
    { month: '2026년 1월', sales: 88000000, orders: 172, avgOrder: 511628, growth: 18.9, prevYear: 74000000 },
    { month: '2026년 2월', sales: 15000000, orders: 29, avgOrder: 517241, growth: 0, prevYear: 68000000 },
  ];

  // 연도별 데이터
  const yearlyData = [
    { year: '2021', sales: 485000000, orders: 962, avgOrder: 504158, growth: 0 },
    { year: '2022', sales: 550000000, orders: 1089, avgOrder: 505051, growth: 13.4 },
    { year: '2023', sales: 653000000, orders: 1287, avgOrder: 507382, growth: 18.7 },
    { year: '2024', sales: 748000000, orders: 1468, avgOrder: 509510, growth: 14.5 },
    { year: '2025', sales: 652000000, orders: 1282, avgOrder: 508596, growth: 16.2 },
  ];

  const getCurrentData = () => {
    switch (viewMode) {
      case 'daily':
        return dailyData;
      case 'weekly':
        return weeklyData;
      case 'monthly':
        return monthlyData;
      case 'yearly':
        return yearlyData;
      default:
        return monthlyData;
    }
  };

  const getChartKey = () => {
    switch (viewMode) {
      case 'daily':
        return 'date';
      case 'weekly':
        return 'week';
      case 'monthly':
        return 'month';
      case 'yearly':
        return 'year';
      default:
        return 'month';
    }
  };

  const currentData = getCurrentData();
  const totalSales = currentData.reduce((sum, item) => sum + item.sales, 0);
  const totalOrders = currentData.reduce((sum, item) => sum + item.orders, 0);
  const avgOrderAmount = totalOrders > 0 ? totalSales / totalOrders : 0;

  // 전월/전년 대비 증감
  const previousPeriodSales = viewMode === 'monthly' ? 55000000 : viewMode === 'yearly' ? 653000000 : 0;
  const growthRate = previousPeriodSales > 0 ? ((totalSales - previousPeriodSales) / previousPeriodSales * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium mb-2">기간별 매출현황</h1>
          <p className="text-neutral-600">일별, 주별, 월별, 연도별 매출을 상세하게 확인하세요</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded hover:bg-neutral-50 transition-colors">
          <Download className="w-4 h-4" />
          <span className="text-sm">Excel 다운로드</span>
        </button>
      </div>

      {/* 기간 선택 */}
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-neutral-600 mb-2">조회 기간 단위</label>
            <div className="grid grid-cols-4 gap-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {mode === 'daily' ? '일별' : mode === 'weekly' ? '주별' : mode === 'monthly' ? '월별' : '연도별'}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'daily' && (
            <>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">연도</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="border border-neutral-300 rounded px-3 py-2 text-sm"
                >
                  <option value="2024">2024년</option>
                  <option value="2023">2023년</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">월</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border border-neutral-300 rounded px-3 py-2 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {month}월
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {viewMode === 'weekly' && (
            <>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">연도</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="border border-neutral-300 rounded px-3 py-2 text-sm"
                >
                  <option value="2024">2024년</option>
                  <option value="2023">2023년</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">월</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border border-neutral-300 rounded px-3 py-2 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {month}월
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {viewMode === 'monthly' && (
            <div>
              <label className="block text-sm text-neutral-600 mb-2">연도</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border border-neutral-300 rounded px-3 py-2 text-sm"
              >
                <option value="2024">2024년</option>
                <option value="2023">2023년</option>
                <option value="2022">2022년</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600 mb-2">총 매출</p>
          <p className="text-2xl font-medium mb-1">₩{totalSales.toLocaleString()}</p>
          <div className={`flex items-center gap-1 text-sm ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growthRate >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600 mb-2">총 주문</p>
          <p className="text-2xl font-medium mb-1">{totalOrders.toLocaleString()}건</p>
          <p className="text-xs text-neutral-500">
            {viewMode === 'daily' ? '일평균: ' + Math.round(totalOrders / currentData.length) + '건' : 
             viewMode === 'weekly' ? '주평균: ' + Math.round(totalOrders / currentData.length) + '건' :
             viewMode === 'monthly' ? '월평균: ' + Math.round(totalOrders / currentData.length) + '건' :
             '연평균: ' + Math.round(totalOrders / currentData.length) + '건'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600 mb-2">평균 주문액</p>
          <p className="text-2xl font-medium mb-1">₩{Math.round(avgOrderAmount).toLocaleString()}</p>
          <p className="text-xs text-neutral-500">건당 평균 금액</p>
        </div>

        <div className="bg-white border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600 mb-2">최고 매출</p>
          <p className="text-2xl font-medium mb-1">
            ₩{Math.max(...currentData.map(d => d.sales)).toLocaleString()}
          </p>
          <p className="text-xs text-neutral-500">
            {currentData.find(d => d.sales === Math.max(...currentData.map(d => d.sales)))?.[getChartKey()]}
          </p>
        </div>
      </div>

      {/* 매출 차트 */}
      <div className="bg-white border border-neutral-200 p-6">
        <h2 className="font-medium mb-6">매출 추이</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={currentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey={getChartKey()} stroke="#737373" style={{ fontSize: '12px' }} />
            <YAxis stroke="#737373" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '4px' }}
              formatter={(value: number) => [`₩${value.toLocaleString()}`, '매출']}
            />
            <Legend />
            <Bar dataKey="sales" fill="#3b82f6" name="매출" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 월별 비교 차트 (월별 보기일 때만) */}
      {viewMode === 'monthly' && (
        <div className="bg-white border border-neutral-200 p-6">
          <h2 className="font-medium mb-6">전년 대비 비교</h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" stroke="#737373" style={{ fontSize: '12px' }} />
              <YAxis stroke="#737373" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '4px' }}
                formatter={(value: number) => [`₩${value.toLocaleString()}`, '']}
              />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#262626" strokeWidth={2} name="2024년" />
              <Line type="monotone" dataKey="prevYear" stroke="#a3a3a3" strokeWidth={2} strokeDasharray="5 5" name="2023년" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 상세 데이터 테이블 */}
      <div className="bg-white border border-neutral-200 p-6">
        <h2 className="font-medium mb-4">상세 데이터</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 text-sm text-neutral-600">기간</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">매출액</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">주문건수</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">평균 주문액</th>
                {viewMode !== 'yearly' && (
                  <th className="text-right py-3 px-4 text-sm text-neutral-600">성장률</th>
                )}
                {viewMode === 'monthly' && (
                  <th className="text-right py-3 px-4 text-sm text-neutral-600">전년 동월</th>
                )}
              </tr>
            </thead>
            <tbody>
              {currentData.map((item, index) => (
                <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-3 px-4 font-medium">{item[getChartKey() as keyof typeof item]}</td>
                  <td className="py-3 px-4 text-right">₩{item.sales.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{item.orders}건</td>
                  <td className="py-3 px-4 text-right">₩{item.avgOrder.toLocaleString()}</td>
                  {viewMode !== 'yearly' && 'growth' in item && (
                    <td className={`py-3 px-4 text-right font-medium ${
                      item.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.growth >= 0 ? '+' : ''}{item.growth}%
                    </td>
                  )}
                  {viewMode === 'monthly' && 'prevYear' in item && (
                    <td className="py-3 px-4 text-right text-neutral-500">
                      ₩{item.prevYear.toLocaleString()}
                    </td>
                  )}
                </tr>
              ))}
              <tr className="bg-neutral-50 font-medium">
                <td className="py-3 px-4">합계</td>
                <td className="py-3 px-4 text-right">₩{totalSales.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">{totalOrders}건</td>
                <td className="py-3 px-4 text-right">₩{Math.round(avgOrderAmount).toLocaleString()}</td>
                {viewMode !== 'yearly' && (
                  <td className="py-3 px-4 text-right">-</td>
                )}
                {viewMode === 'monthly' && (
                  <td className="py-3 px-4 text-right">
                    ₩{monthlyData.reduce((sum, m) => sum + m.prevYear, 0).toLocaleString()}
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}