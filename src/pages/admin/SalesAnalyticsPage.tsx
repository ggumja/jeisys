import { useState } from 'react';
import { Calendar, Download, TrendingUp, Users, ShoppingCart, Package } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export function SalesAnalyticsPage() {
  const [period, setPeriod] = useState('month');
  const [dateRange, setDateRange] = useState('6months');

  // 일별 매출 데이터
  const dailySalesData = [
    { date: '06/01', sales: 2100000, orders: 4, customers: 4 },
    { date: '06/02', sales: 1850000, orders: 3, customers: 3 },
    { date: '06/03', sales: 3200000, orders: 6, customers: 5 },
    { date: '06/04', sales: 2950000, orders: 5, customers: 5 },
    { date: '06/05', sales: 2400000, orders: 4, customers: 4 },
    { date: '06/06', sales: 1950000, orders: 3, customers: 3 },
    { date: '06/07', sales: 2800000, orders: 5, customers: 5 },
  ];

  // 월별 매출 데이터
  const monthlySalesData = [
    { month: '2024-01', sales: 45000000, orders: 89, avgOrder: 505618 },
    { month: '2024-02', sales: 52000000, orders: 102, avgOrder: 509804 },
    { month: '2024-03', sales: 48000000, orders: 95, avgOrder: 505263 },
    { month: '2024-04', sales: 61000000, orders: 118, avgOrder: 516949 },
    { month: '2024-05', sales: 55000000, orders: 107, avgOrder: 514019 },
    { month: '2024-06', sales: 67000000, orders: 132, avgOrder: 507576 },
  ];

  // 카테고리별 매출
  const categorySalesData = [
    { category: 'Density', sales: 18760000, orders: 67, growth: 15.3 },
    { category: 'POTENZA', sales: 14740000, orders: 52, growth: 8.7 },
    { category: 'ULTRAcel II', sales: 12060000, orders: 43, growth: 12.1 },
    { category: 'LIPOcel II', sales: 10050000, orders: 36, growth: -3.2 },
    { category: 'IntraGen', sales: 6700000, orders: 24, growth: 5.9 },
    { category: '기타소모품', sales: 4690000, orders: 21, growth: 18.4 },
  ];

  // 고객별 매출 순위 (Top 10)
  const topCustomersData = [
    { rank: 1, name: '강남성형외과', totalSales: 18500000, orders: 12, avgOrder: 1541667 },
    { rank: 2, name: '서울피부과의원', totalSales: 15200000, orders: 10, avgOrder: 1520000 },
    { rank: 3, name: '부산뷰티클리닉', totalSales: 13800000, orders: 9, avgOrder: 1533333 },
    { rank: 4, name: '대구메디컬센터', totalSales: 12400000, orders: 8, avgOrder: 1550000 },
    { rank: 5, name: '인천피부과', totalSales: 11900000, orders: 8, avgOrder: 1487500 },
    { rank: 6, name: '광주성형외과', totalSales: 10200000, orders: 7, avgOrder: 1457143 },
    { rank: 7, name: '대전뷰티의원', totalSales: 9800000, orders: 6, avgOrder: 1633333 },
    { rank: 8, name: '울산피부과', totalSales: 8500000, orders: 6, avgOrder: 1416667 },
    { rank: 9, name: '수원성형외과', totalSales: 7900000, orders: 5, avgOrder: 1580000 },
    { rank: 10, name: '청주메디컬', totalSales: 7200000, orders: 5, avgOrder: 1440000 },
  ];

  // 결제 수단별 통계
  const paymentMethodData = [
    { method: '무통장입금', amount: 38500000, percentage: 57.5, count: 76 },
    { method: '법인카드', amount: 22100000, percentage: 33.0, count: 42 },
    { method: '개인카드', amount: 6400000, percentage: 9.5, count: 14 },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium mb-2">매출 분석</h1>
          <p className="text-neutral-600">매출 현황을 상세하게 분석하고 인사이트를 확인하세요</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded hover:bg-neutral-50 transition-colors">
          <Download className="w-4 h-4" />
          <span className="text-sm">리포트 다운로드</span>
        </button>
      </div>

      {/* 필터 */}
      <div className="bg-white border border-neutral-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-neutral-600 mb-2">기간 설정</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2 text-sm"
            >
              <option value="7days">최근 7일</option>
              <option value="30days">최근 30일</option>
              <option value="3months">최근 3개월</option>
              <option value="6months">최근 6개월</option>
              <option value="1year">최근 1년</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-2">데이터 단위</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2 text-sm"
            >
              <option value="day">일별</option>
              <option value="week">주별</option>
              <option value="month">월별</option>
            </select>
          </div>
        </div>
      </div>

      {/* 요약 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600">총 매출</span>
          </div>
          <p className="text-2xl font-medium mb-1">₩67,000,000</p>
          <p className="text-xs text-green-600">전월 대비 +21.8%</p>
        </div>

        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600">총 주문</span>
          </div>
          <p className="text-2xl font-medium mb-1">132건</p>
          <p className="text-xs text-green-600">전월 대비 +23.4%</p>
        </div>

        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600">구매 고객</span>
          </div>
          <p className="text-2xl font-medium mb-1">87명</p>
          <p className="text-xs text-green-600">전월 대비 +12.9%</p>
        </div>

        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 text-green-600 rounded">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600">평균 주문액</span>
          </div>
          <p className="text-2xl font-medium mb-1">₩507,576</p>
          <p className="text-xs text-red-600">전월 대비 -1.2%</p>
        </div>
      </div>

      {/* 매출 추이 그래프 */}
      <div className="bg-white border border-neutral-200 p-6">
        <h2 className="font-medium mb-6">매출 추이</h2>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={monthlySalesData}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#262626" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#262626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="month" stroke="#737373" style={{ fontSize: '12px' }} />
            <YAxis stroke="#737373" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '4px' }}
              formatter={(value: number) => [`₩${value.toLocaleString()}`, '매출']}
            />
            <Area type="monotone" dataKey="sales" stroke="#262626" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 카테고리별 매출 & 주문건수 */}
      <div className="bg-white border border-neutral-200 p-6">
        <h2 className="font-medium mb-6">카테고리별 매출 현황</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 text-sm text-neutral-600">카테고리</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">매출액</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">주문건수</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">평균 주문액</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">성장률</th>
              </tr>
            </thead>
            <tbody>
              {categorySalesData.map((item, index) => (
                <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-3 px-4 font-medium">{item.category}</td>
                  <td className="py-3 px-4 text-right">₩{item.sales.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{item.orders}건</td>
                  <td className="py-3 px-4 text-right">₩{Math.round(item.sales / item.orders).toLocaleString()}</td>
                  <td className={`py-3 px-4 text-right font-medium ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.growth >= 0 ? '+' : ''}{item.growth}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 고객별 매출 순위 & 결제수단 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 고객별 매출 순위 */}
        <div className="bg-white border border-neutral-200 p-6">
          <h2 className="font-medium mb-4">고객별 매출 순위 (Top 10)</h2>
          <div className="space-y-3">
            {topCustomersData.map((customer) => (
              <div key={customer.rank} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    customer.rank <= 3 ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {customer.rank}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-neutral-500">{customer.orders}건 구매</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">₩{(customer.totalSales / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-neutral-500">평균 ₩{Math.round(customer.avgOrder / 10000)}만</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 결제 수단별 통계 */}
        <div className="bg-white border border-neutral-200 p-6">
          <h2 className="font-medium mb-4">결제 수단별 통계</h2>
          <div className="space-y-4">
            {paymentMethodData.map((payment, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{payment.method}</p>
                    <p className="text-xs text-neutral-500">{payment.count}건</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₩{payment.amount.toLocaleString()}</p>
                    <p className="text-xs text-neutral-500">{payment.percentage}%</p>
                  </div>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2">
                  <div
                    className="bg-neutral-900 h-2 rounded-full transition-all"
                    style={{ width: `${payment.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">총 결제금액</p>
              <p className="font-medium">₩{paymentMethodData.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
