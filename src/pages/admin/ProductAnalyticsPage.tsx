import { useState } from 'react';
import { TrendingUp, TrendingDown, Package, AlertTriangle, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export function ProductAnalyticsPage() {
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('sales');

  // 베스트셀러 제품
  const bestSellingProducts = [
    {
      rank: 1,
      name: 'Density 니들 (32G 9P)',
      category: 'Density',
      sales: 145,
      revenue: 43500000,
      stock: 234,
      growth: 18.5,
      rating: 4.8,
    },
    {
      rank: 2,
      name: 'POTENZA 니들팁 (25P)',
      category: 'POTENZA',
      sales: 128,
      revenue: 38400000,
      stock: 187,
      growth: 12.3,
      rating: 4.9,
    },
    {
      rank: 3,
      name: 'ULTRAcel II 카트리지',
      category: 'ULTRAcel II',
      sales: 98,
      revenue: 29400000,
      stock: 156,
      growth: 15.7,
      rating: 4.7,
    },
    {
      rank: 4,
      name: 'LIPOcel II 카트리지',
      category: 'LIPOcel II',
      sales: 87,
      revenue: 26100000,
      stock: 142,
      growth: -3.2,
      rating: 4.6,
    },
    {
      rank: 5,
      name: 'IntraGen 팁',
      category: 'IntraGen',
      sales: 76,
      revenue: 22800000,
      stock: 198,
      growth: 8.4,
      rating: 4.5,
    },
    {
      rank: 6,
      name: 'Density 앰플 (10ml)',
      category: 'Density',
      sales: 68,
      revenue: 20400000,
      stock: 276,
      growth: 22.1,
      rating: 4.8,
    },
    {
      rank: 7,
      name: 'POTENZA 약침 세트',
      category: 'POTENZA',
      sales: 54,
      revenue: 16200000,
      stock: 89,
      growth: 5.6,
      rating: 4.4,
    },
    {
      rank: 8,
      name: 'LinearZ 카트리지',
      category: 'LinearZ',
      sales: 49,
      revenue: 14700000,
      stock: 112,
      growth: -1.8,
      rating: 4.5,
    },
    {
      rank: 9,
      name: 'ULTRAcel II 젤',
      category: 'ULTRAcel II',
      sales: 45,
      revenue: 13500000,
      stock: 203,
      growth: 11.2,
      rating: 4.7,
    },
    {
      rank: 10,
      name: 'DLiv 솔루션',
      category: 'DLiv',
      sales: 42,
      revenue: 12600000,
      stock: 165,
      growth: 7.8,
      rating: 4.6,
    },
  ];

  // 재고 부족 상품
  const lowStockProducts = [
    { name: 'POTENZA 약침 세트', category: 'POTENZA', stock: 89, minStock: 100, sales: 54 },
    { name: 'LinearZ 카트리지', category: 'LinearZ', stock: 112, minStock: 150, sales: 49 },
    { name: 'LIPOcel II 카트리지', category: 'LIPOcel II', stock: 142, minStock: 200, sales: 87 },
  ];

  // 카테고리별 판매 추이
  const categoryTrendData = [
    { month: '1월', Density: 8500, POTENZA: 7200, ULTRAcel: 6800, LIPOcel: 6200, IntraGen: 4100 },
    { month: '2월', Density: 9200, POTENZA: 7800, ULTRAcel: 7400, LIPOcel: 5900, IntraGen: 4500 },
    { month: '3월', Density: 8900, POTENZA: 7500, ULTRAcel: 7100, LIPOcel: 5800, IntraGen: 4200 },
    { month: '4월', Density: 10500, POTENZA: 8900, ULTRAcel: 8200, LIPOcel: 7100, IntraGen: 5100 },
    { month: '5월', Density: 9800, POTENZA: 8200, ULTRAcel: 7800, LIPOcel: 6800, IntraGen: 4800 },
    { month: '6월', Density: 11500, POTENZA: 9800, ULTRAcel: 9200, LIPOcel: 8100, IntraGen: 5600 },
  ];

  // 상품 성과 지표
  const performanceData = [
    { name: 'Density 니들', views: 2456, carts: 456, purchases: 145, conversionRate: 31.8 },
    { name: 'POTENZA 니들팁', views: 2134, carts: 398, purchases: 128, conversionRate: 32.2 },
    { name: 'ULTRAcel II 카트리지', views: 1876, carts: 312, purchases: 98, conversionRate: 31.4 },
    { name: 'LIPOcel II 카트리지', views: 1654, carts: 267, purchases: 87, conversionRate: 32.6 },
    { name: 'IntraGen 팁', views: 1432, carts: 234, purchases: 76, conversionRate: 32.5 },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-medium mb-2">상품 분석</h1>
        <p className="text-neutral-600">상품별 판매 현황과 재고를 관리하세요</p>
      </div>

      {/* 필터 */}
      <div className="bg-white border border-neutral-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-neutral-600 mb-2">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2 text-sm"
            >
              <option value="all">전체</option>
              <option value="density">Density</option>
              <option value="potenza">POTENZA</option>
              <option value="ultracel">ULTRAcel II</option>
              <option value="lipocel">LIPOcel II</option>
              <option value="intragen">IntraGen</option>
              <option value="etc">기타소모품</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-2">정렬 기준</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2 text-sm"
            >
              <option value="sales">판매량순</option>
              <option value="revenue">매출액순</option>
              <option value="growth">성장률순</option>
              <option value="rating">평점순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600">전체 상품</span>
          </div>
          <p className="text-2xl font-medium mb-1">156개</p>
          <p className="text-xs text-neutral-500">판매중: 148개</p>
        </div>

        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 text-green-600 rounded">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600">총 판매량</span>
          </div>
          <p className="text-2xl font-medium mb-1">892개</p>
          <p className="text-xs text-green-600">전월 대비 +15.2%</p>
        </div>

        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded">
              <Star className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600">평균 평점</span>
          </div>
          <p className="text-2xl font-medium mb-1">4.7</p>
          <p className="text-xs text-neutral-500">리뷰 수: 1,234개</p>
        </div>

        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-50 text-red-600 rounded">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600">재고 부족</span>
          </div>
          <p className="text-2xl font-medium mb-1">3개</p>
          <p className="text-xs text-red-600">긴급 주문 필요</p>
        </div>
      </div>

      {/* 재고 부족 경고 */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900 mb-2">재고 부족 상품 ({lowStockProducts.length}개)</p>
              <div className="space-y-2">
                {lowStockProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-red-800">
                      {product.name} ({product.category})
                    </span>
                    <span className="text-red-600 font-medium">
                      재고: {product.stock}개 / 최소: {product.minStock}개
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리별 판매 추이 */}
      <div className="bg-white border border-neutral-200 p-6">
        <h2 className="font-medium mb-6">카테고리별 판매 추이 (천원 단위)</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={categoryTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="month" stroke="#737373" style={{ fontSize: '12px' }} />
            <YAxis stroke="#737373" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '4px' }}
            />
            <Legend />
            <Line type="monotone" dataKey="Density" stroke="#262626" strokeWidth={2} />
            <Line type="monotone" dataKey="POTENZA" stroke="#404040" strokeWidth={2} />
            <Line type="monotone" dataKey="ULTRAcel" stroke="#525252" strokeWidth={2} />
            <Line type="monotone" dataKey="LIPOcel" stroke="#737373" strokeWidth={2} />
            <Line type="monotone" dataKey="IntraGen" stroke="#a3a3a3" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 베스트셀러 제품 목록 */}
      <div className="bg-white border border-neutral-200 p-6">
        <h2 className="font-medium mb-6">베스트셀러 제품 (이번 달)</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 text-sm text-neutral-600">순위</th>
                <th className="text-left py-3 px-4 text-sm text-neutral-600">상품명</th>
                <th className="text-left py-3 px-4 text-sm text-neutral-600">카테고리</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">판매량</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">매출액</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">재고</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">성장률</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">평점</th>
              </tr>
            </thead>
            <tbody>
              {bestSellingProducts.map((product) => (
                <tr key={product.rank} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-3 px-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      product.rank <= 3 ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {product.rank}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{product.name}</td>
                  <td className="py-3 px-4 text-neutral-600 text-sm">{product.category}</td>
                  <td className="py-3 px-4 text-right">{product.sales}개</td>
                  <td className="py-3 px-4 text-right">₩{(product.revenue / 1000000).toFixed(1)}M</td>
                  <td className="py-3 px-4 text-right">
                    <span className={product.stock < 100 ? 'text-red-600 font-medium' : ''}>
                      {product.stock}개
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${
                    product.growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {product.growth >= 0 ? '+' : ''}{product.growth}%
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{product.rating}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상품 성과 지표 */}
      <div className="bg-white border border-neutral-200 p-6">
        <h2 className="font-medium mb-6">상품 성과 지표 (전환율 분석)</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 text-sm text-neutral-600">상품명</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">조회수</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">장바구니</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">구매</th>
                <th className="text-right py-3 px-4 text-sm text-neutral-600">전환율</th>
                <th className="text-left py-3 px-4 text-sm text-neutral-600">전환 퍼널</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((product, index) => (
                <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-3 px-4 font-medium">{product.name}</td>
                  <td className="py-3 px-4 text-right">{product.views.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{product.carts}</td>
                  <td className="py-3 px-4 text-right">{product.purchases}</td>
                  <td className="py-3 px-4 text-right font-medium text-green-600">{product.conversionRate}%</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-6 bg-neutral-100 rounded-full overflow-hidden flex">
                        <div className="bg-blue-200 h-full" style={{ width: '100%' }} />
                        <div className="bg-yellow-300 h-full" style={{ width: `${(product.carts / product.views) * 100}%` }} />
                        <div className="bg-green-500 h-full" style={{ width: `${(product.purchases / product.views) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-4 mt-4 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span>조회</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-300 rounded"></div>
              <span>장바구니</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>구매</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
