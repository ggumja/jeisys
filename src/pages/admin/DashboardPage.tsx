import { TrendingUp, TrendingDown, ShoppingCart, Users, Package, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function DashboardPage() {
  // 매출 추이 데이터
  const salesData = [
    { month: '1월', sales: 45000000, orders: 89 },
    { month: '2월', sales: 52000000, orders: 102 },
    { month: '3월', sales: 48000000, orders: 95 },
    { month: '4월', sales: 61000000, orders: 118 },
    { month: '5월', sales: 55000000, orders: 107 },
    { month: '6월', sales: 67000000, orders: 132 },
  ];

  // 카테고리별 매출 데이터
  const categoryData = [
    { name: 'Density', value: 28, color: '#3b82f6' },
    { name: 'POTENZA', value: 22, color: '#8b5cf6' },
    { name: 'ULTRAcel II', value: 18, color: '#ec4899' },
    { name: 'LIPOcel II', value: 15, color: '#f59e0b' },
    { name: '기타소모품', value: 17, color: '#10b981' },
  ];

  // 최근 주문 목록
  const recentOrders = [
    { id: 'ORD-2024-1567', customer: '서울피부과', amount: 2850000, status: '배송완료', date: '2024-06-28' },
    { id: 'ORD-2024-1566', customer: '강남성형외과', amount: 4200000, status: '배송중', date: '2024-06-27' },
    { id: 'ORD-2024-1565', customer: '부산뷰티클리닉', amount: 1950000, status: '결제완료', date: '2024-06-27' },
    { id: 'ORD-2024-1564', customer: '대구피부과', amount: 3100000, status: '배송완료', date: '2024-06-26' },
    { id: 'ORD-2024-1563', customer: '인천메디컬센터', amount: 5600000, status: '배송완료', date: '2024-06-25' },
  ];

  // 베스트셀러 제품
  const bestProducts = [
    { name: 'Density 니들 (32G 9P)', sales: 145, revenue: 43500000 },
    { name: 'POTENZA 니들팁 (25P)', sales: 128, revenue: 38400000 },
    { name: 'ULTRAcel II 카트리지', sales: 98, revenue: 29400000 },
    { name: 'LIPOcel II 카트리지', sales: 87, revenue: 26100000 },
    { name: 'IntraGen 팁', sales: 76, revenue: 22800000 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '배송완료':
        return 'text-green-600 bg-green-50';
      case '배송중':
        return 'text-blue-600 bg-blue-50';
      case '결제완료':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-neutral-600 bg-neutral-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium mb-2">대시보드</h1>
        <p className="text-neutral-600">제이시스메디칼 운영 현황을 한눈에 확인하세요</p>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 이번 달 매출 */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neutral-900 text-white rounded">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>+12.3%</span>
            </div>
          </div>
          <p className="text-sm text-neutral-600 mb-1">이번 달 매출</p>
          <p className="text-2xl font-medium">₩67,000,000</p>
          <p className="text-xs text-neutral-500 mt-2">목표: ₩70,000,000 (95.7%)</p>
        </div>

        {/* 이번 달 주문 */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neutral-900 text-white rounded">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>+8.2%</span>
            </div>
          </div>
          <p className="text-sm text-neutral-600 mb-1">이번 달 주문</p>
          <p className="text-2xl font-medium">132건</p>
          <p className="text-xs text-neutral-500 mt-2">평균 주문액: ₩507,575</p>
        </div>

        {/* 전체 회원 */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neutral-900 text-white rounded">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>+5.7%</span>
            </div>
          </div>
          <p className="text-sm text-neutral-600 mb-1">전체 회원</p>
          <p className="text-2xl font-medium">1,247명</p>
          <p className="text-xs text-neutral-500 mt-2">이번 달 신규: 23명</p>
        </div>

        {/* 전체 상품 */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neutral-900 text-white rounded">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-red-600 text-sm">
              <ArrowDownRight className="w-4 h-4" />
              <span>재고부족 3개</span>
            </div>
          </div>
          <p className="text-sm text-neutral-600 mb-1">전체 상품</p>
          <p className="text-2xl font-medium">156개</p>
          <p className="text-xs text-neutral-500 mt-2">판매중: 148개</p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 매출 추이 차트 */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-medium">월별 매출 추이</h2>
            <select className="text-sm border border-neutral-300 rounded px-3 py-1.5">
              <option>최근 6개월</option>
              <option>최근 12개월</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" stroke="#737373" style={{ fontSize: '12px' }} />
              <YAxis stroke="#737373" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '4px' }}
                formatter={(value: number) => [`₩${value.toLocaleString()}`, '매출']}
              />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#262626" strokeWidth={2} name="매출" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 카테고리별 매출 비율 */}
        <div className="bg-white border border-neutral-200 p-6">
          <h2 className="font-medium mb-6">카테고리별 매출 비율</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 베스트셀러 제품 & 최근 주문 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 베스트셀러 제품 */}
        <div className="bg-white border border-neutral-200 p-6">
          <h2 className="font-medium mb-4">베스트셀러 제품 (이번 달)</h2>
          <div className="space-y-3">
            {bestProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-neutral-500">{product.sales}개 판매</p>
                  </div>
                </div>
                <p className="text-sm font-medium">₩{product.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 주문 */}
        <div className="bg-white border border-neutral-200 p-6">
          <h2 className="font-medium mb-4">최근 주문</h2>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="py-3 border-b border-neutral-100 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{order.customer}</p>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span>{order.id}</span>
                  <span>₩{order.amount.toLocaleString()}</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">{order.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 회원 등급별 현황 */}
      <div className="bg-white border border-neutral-200 p-6">
        <h2 className="font-medium mb-4">회원 등급별 현황</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 border border-neutral-200 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600">VIP 등급</span>
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            </div>
            <p className="text-2xl font-medium mb-1">48명</p>
            <p className="text-xs text-neutral-500">전체의 3.8%</p>
          </div>
          <div className="p-4 border border-neutral-200 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600">Gold 등급</span>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            </div>
            <p className="text-2xl font-medium mb-1">156명</p>
            <p className="text-xs text-neutral-500">전체의 12.5%</p>
          </div>
          <div className="p-4 border border-neutral-200 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600">Silver 등급</span>
              <div className="w-3 h-3 rounded-full bg-neutral-400"></div>
            </div>
            <p className="text-2xl font-medium mb-1">387명</p>
            <p className="text-xs text-neutral-500">전체의 31.0%</p>
          </div>
          <div className="p-4 border border-neutral-200 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600">Bronze 등급</span>
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
            </div>
            <p className="text-2xl font-medium mb-1">656명</p>
            <p className="text-xs text-neutral-500">전체의 52.7%</p>
          </div>
        </div>
      </div>
    </div>
  );
}