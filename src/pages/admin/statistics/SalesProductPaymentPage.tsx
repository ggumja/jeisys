import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Package, Award } from 'lucide-react';
import { adminService } from '../../../services/adminService';

const COLORS = ['#21358D', '#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#64748b'];

export function SalesProductPaymentPage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  // 페이징 상태
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const stats = await adminService.getSalesProductPaymentStats(dateRange);
        setProducts(stats);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 p-16 text-center shadow-sm">
        <p className="text-neutral-500 font-medium">선택한 기간 동안의 결제 연동 데이터가 없습니다.</p>
      </div>
    );
  }

  // Stacked Bar Chart용 데이터 변환
  // 차트에 노출할 상위 5개 또는 10개 상품만 필터링 (너무 많으면 뭉개짐)
  const chartData = products.slice(0, 5).map((p) => {
    return {
      name: p.productName.length > 10 ? p.productName.substring(0, 10) + '...' : p.productName,
      ...p.payments,
    };
  });

  // 사용된 모든 결제 수단 종류 추출
  const paymentMethodsSet = new Set<string>();
  products.forEach((p) => {
    Object.keys(p.payments).forEach((m) => paymentMethodsSet.add(m));
  });
  const uniqueMethods = Array.from(paymentMethodsSet);

  // 테이블 페이징 계산
  const totalProducts = products.length;
  const totalPages = Math.ceil(totalProducts / limit);
  const paginatedProducts = products.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6">
      {/* 누적 바 차트 (상위 5개 상품) */}
      <div className="bg-white border border-neutral-200 p-6 shadow-sm">
        <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
          <Package className="w-4 h-4 text-[#21358D]" />
          <span>인기 상품별 결제수단 비중 (Top 5)</span>
        </h3>
        <p className="text-xs text-neutral-500 mb-6">매출 상위 5개 상품의 누적 매출액과 사용된 결제 수단별 세부 금액을 시각화합니다.</p>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
              <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} formatter={(v: number) => `₩${(v / 10000).toLocaleString()}만`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px' }}
                formatter={(value: number) => [`₩${value.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
              {uniqueMethods.map((method, index) => (
                <Bar
                  key={method}
                  dataKey={method}
                  name={method}
                  stackId="a"
                  fill={COLORS[index % COLORS.length]}
                  radius={index === uniqueMethods.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 상세 테이블 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-neutral-200">
          <div>
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#21358D]" />
              <span>상품별 매출 & 결제수단 현황</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1">개별 상품의 매출 누계와 사용된 결제수단별 상세 집계입니다.</p>
          </div>
          {/* 행 수 선택 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">행 표시:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border border-neutral-300 rounded px-2 py-1 text-xs bg-white text-neutral-700 font-semibold"
            >
              <option value="10">10개씩 보기</option>
              <option value="20">20개씩 보기</option>
              <option value="50">50개씩 보기</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-6 font-semibold text-neutral-700 w-20 text-center">No.</th>
                <th className="py-3 px-6 font-semibold text-neutral-700">상품명</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 text-right">총 매출액</th>
                {uniqueMethods.map((m) => (
                  <th key={m} className="py-3 px-6 font-semibold text-neutral-500 text-right">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginatedProducts.map((p, idx) => {
                const rowNo = (page - 1) * limit + (idx + 1);
                return (
                  <tr key={p.productName} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-6 text-center text-neutral-500 font-medium">{rowNo}</td>
                    <td className="py-3.5 px-6 font-semibold text-neutral-900">{p.productName}</td>
                    <td className="py-3.5 px-6 text-right font-bold text-neutral-950">₩{p.totalSales.toLocaleString()}</td>
                    {uniqueMethods.map((m) => {
                      const val = p.payments[m] || 0;
                      return (
                        <td key={m} className="py-3.5 px-6 text-right text-neutral-600 font-medium">
                          {val > 0 ? `₩${val.toLocaleString()}` : '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 페이징 컴포넌트 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="relative inline-flex items-center rounded border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                이전
              </button>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="relative ml-3 inline-flex items-center rounded border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                다음
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-neutral-600">
                  전체 <span className="font-semibold text-neutral-900">{totalProducts}</span>개 상품 중{' '}
                  <span className="font-semibold text-neutral-900">{(page - 1) * limit + 1}</span>~
                  <span className="font-semibold text-neutral-900">{Math.min(page * limit, totalProducts)}</span>번째 표시
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded shadow-sm gap-1" aria-label="Pagination">
                  <button
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 border border-neutral-300 rounded disabled:opacity-50"
                  >
                    이전
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded border ${
                        page === i + 1
                          ? 'bg-[#21358D] text-white border-[#21358D] z-10'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 border border-neutral-300 rounded disabled:opacity-50"
                  >
                    다음
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
