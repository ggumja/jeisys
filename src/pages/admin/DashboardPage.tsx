import { ShoppingCart, Users, Package, DollarSign, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { adminService } from '../../services/adminService';

// Mock chart data (to be replaced with real analytics later)
const salesData = [
  { month: '1월', sales: 45000000, orders: 89 },
  { month: '2월', sales: 52000000, orders: 102 },
  { month: '3월', sales: 48000000, orders: 95 },
  { month: '4월', sales: 61000000, orders: 118 },
  { month: '5월', sales: 55000000, orders: 107 },
  { month: '6월', sales: 67000000, orders: 132 },
];

const categoryData = [
  { name: 'Density', value: 28, color: '#3b82f6' },
  { name: 'POTENZA', value: 22, color: '#8b5cf6' },
  { name: 'ULTRAcel II', value: 18, color: '#ec4899' },
  { name: 'LIPOcel II', value: 15, color: '#f59e0b' },
  { name: '기타소모품', value: 17, color: '#10b981' },
];

const bestProducts = [
  { name: 'Density 니들 (32G 9P)', sales: 145, revenue: 43500000 },
  { name: 'POTENZA 니들팁 (25P)', sales: 128, revenue: 38400000 },
  { name: 'ULTRAcel II 카트리지', sales: 98, revenue: 29400000 },
  { name: 'LIPOcel II 카트리지', sales: 87, revenue: 26100000 },
  { name: 'IntraGen 팁', sales: 76, revenue: 22800000 },
];

interface DashboardOrder {
  id: string;
  customerName: string;
  hospitalName: string;
  status: string;
  orderNumber: string;
  totalAmount: number;
  orderDate: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monthSales: 0,
    monthOrderCount: 0,
    totalUsers: 0,
    newUsers: 0,
    pendingUsers: 0,
    lowStockProducts: 0,
    totalProducts: 0,
    gradeStats: {
      VIP: { count: 0, percentage: 0 },
      Gold: { count: 0, percentage: 0 },
      Silver: { count: 0, percentage: 0 },
      Bronze: { count: 0, percentage: 0 }
    }
  });
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardStats, orders] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getOrders()
      ]);
      setStats(dashboardStats);
      setRecentOrders(orders.slice(0, 5)); // Top 5
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeClick = (grade: string) => {
    navigate(`/admin/members?grade=${grade}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'shipped':
        return 'text-blue-600 bg-blue-50';
      case 'confirmed': // paid
      case 'paid':
        return 'text-yellow-600 bg-yellow-50';
      case 'pending':
        return 'text-neutral-600 bg-neutral-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-neutral-600 bg-neutral-50';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

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
            {/* Mock growth */}
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>+12.3%</span>
            </div>
          </div>
          <p className="text-sm text-neutral-600 mb-1">이번 달 매출</p>
          <p className="text-2xl font-medium">₩{stats.monthSales.toLocaleString()}</p>
          <p className="text-xs text-neutral-500 mt-2">목표 달성률 분석 중...</p>
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
          <p className="text-2xl font-medium">{stats.monthOrderCount}건</p>
          <p className="text-xs text-neutral-500 mt-2">
            평균 주문액: ₩{stats.monthOrderCount > 0 ? (stats.monthSales / stats.monthOrderCount).toLocaleString() : '0'}
          </p>
        </div>

        {/* 전체 회원 */}
        <div className="bg-white border border-neutral-200 p-6 cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => navigate('/admin/members')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neutral-900 text-white rounded">
              <Users className="w-5 h-5" />
            </div>
            {stats.pendingUsers > 0 && (
              <div className="flex items-center gap-1 text-yellow-600 text-sm">
                <span>승인대기 {stats.pendingUsers}명</span>
              </div>
            )}
          </div>
          <p className="text-sm text-neutral-600 mb-1">전체 회원</p>
          <p className="text-2xl font-medium">{stats.totalUsers.toLocaleString()}명</p>
          <p className="text-xs text-neutral-500 mt-2">승인 대기: {stats.pendingUsers}명</p>
        </div>

        {/* 전체 상품 */}
        <div className="bg-white border border-neutral-200 p-6 cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => navigate('/admin/products')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neutral-900 text-white rounded">
              <Package className="w-5 h-5" />
            </div>
            {stats.lowStockProducts > 0 && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <ArrowDownRight className="w-4 h-4" />
                <span>재고부족 {stats.lowStockProducts}개</span>
              </div>
            )}
          </div>
          <p className="text-sm text-neutral-600 mb-1">전체 상품</p>
          <p className="text-2xl font-medium">{stats.totalProducts}개</p>
          <p className="text-xs text-neutral-500 mt-2">판매중: {stats.totalProducts}개</p>
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
                label={({ name, value }: { name: string; value: number }) => `${name} ${value}%`}
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
            {recentOrders.length === 0 ? (
              <div className="text-center text-neutral-500 py-4">주문 내역이 없습니다.</div>
            ) : (
              recentOrders.map((order: DashboardOrder) => (
                <div key={order.id} className="py-3 border-b border-neutral-100 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{order.customerName} ({order.hospitalName})</p>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-600">
                    <span>{order.orderNumber}</span>
                    <span>₩{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{order.orderDate}</p>
                </div>
              ))
            )}

          </div>
        </div>
      </div>

      {/* 회원 등급별 현황 */}
      <div className="bg-white border border-neutral-200 p-6">
        <h2 className="font-medium mb-4">회원 등급별 현황</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 border border-neutral-200 rounded cursor-pointer hover:border-neutral-900 transition-all hover:shadow-sm" onClick={() => handleGradeClick('VIP')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600">VIP 등급</span>
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            </div>
            <p className="text-2xl font-medium mb-1 font-mono">{stats.gradeStats.VIP.count}명</p>
            <p className="text-xs text-neutral-500">전체의 {stats.gradeStats.VIP.percentage}%</p>
          </div>
          <div className="p-4 border border-neutral-200 rounded cursor-pointer hover:border-neutral-900 transition-all hover:shadow-sm" onClick={() => handleGradeClick('Gold')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600">Gold 등급</span>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            </div>
            <p className="text-2xl font-medium mb-1 font-mono">{stats.gradeStats.Gold.count}명</p>
            <p className="text-xs text-neutral-500">전체의 {stats.gradeStats.Gold.percentage}%</p>
          </div>
          <div className="p-4 border border-neutral-200 rounded cursor-pointer hover:border-neutral-900 transition-all hover:shadow-sm" onClick={() => handleGradeClick('Silver')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600">Silver 등급</span>
              <div className="w-3 h-3 rounded-full bg-neutral-400"></div>
            </div>
            <p className="text-2xl font-medium mb-1 font-mono">{stats.gradeStats.Silver.count}명</p>
            <p className="text-xs text-neutral-500">전체의 {stats.gradeStats.Silver.percentage}%</p>
          </div>
          <div className="p-4 border border-neutral-200 rounded cursor-pointer hover:border-neutral-900 transition-all hover:shadow-sm" onClick={() => handleGradeClick('Bronze')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600">Bronze 등급</span>
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
            </div>
            <p className="text-2xl font-medium mb-1 font-mono">{stats.gradeStats.Bronze.count}명</p>
            <p className="text-xs text-neutral-500">전체의 {stats.gradeStats.Bronze.percentage}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}