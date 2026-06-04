import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RefreshCw, Filter } from 'lucide-react';
import { adminService } from '../../../services/adminService';

export function ProductConversionPage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [conversionData, setConversionData] = useState<any>(null);

  // 페이징 상태
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // 기본 10개씩 보기

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const stats = await adminService.getProductConversionStats(dateRange, page, limit);
        setConversionData(stats);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange, page, limit]);

  if (isLoading || !conversionData) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  const { data: products, totalCount, top5Funnel } = conversionData;
  const totalPages = Math.ceil(totalCount / limit);

  // 상위 5개 상품 퍼널 차트용 데이터 포맷
  const chartData = top5Funnel.map((p: any) => ({
    name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
    '1. 조회': p.views,
    '2. 장바구니': p.carts,
    '3. 구매': p.purchases,
  }));

  return (
    <div className="space-y-6">
      {/* 3단 전환율 퍼널 시각화 차트 */}
      <div className="bg-white border border-neutral-200 p-6 shadow-sm">
        <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-[#21358D]" />
          <span>핵심 상품 3단계 전환 퍼널 (Top 5)</span>
        </h3>
        <p className="text-xs text-neutral-500 mb-6">구매 전환율 상위 5개 상품의 [조회 ➜ 장바구니 추가 ➜ 최종 주문] 단계별 유입 현황입니다.</p>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
              <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
              <Bar dataKey="1. 조회" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="2. 장바구니" fill="#fde047" radius={[4, 4, 0, 0]} />
              <Bar dataKey="3. 구매" fill="#86efac" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 상세 테이블 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-neutral-200">
          <div>
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#21358D]" />
              <span>상품별 상세 전환율 현황</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1">개별 상품의 퍼널 유입량과 최종 구매 전환 성과 순위입니다.</p>
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
                <th className="py-3.5 px-6 font-semibold text-neutral-700 w-20 text-center">No.</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700">상품명</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 w-32">카테고리</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">조회수</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">장바구니 등록</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">구매수량</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">최종 구매 전환율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((prod: any, idx: number) => {
                const rowNo = (page - 1) * limit + (idx + 1);
                return (
                  <tr key={prod.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-6 text-center text-neutral-500 font-medium">{rowNo}</td>
                    <td className="py-3.5 px-6 font-semibold text-neutral-900">{prod.name}</td>
                    <td className="py-3.5 px-6 text-neutral-600 font-semibold">{prod.category}</td>
                    <td className="py-3.5 px-6 text-right text-neutral-700">{prod.views.toLocaleString()}회</td>
                    <td className="py-3.5 px-6 text-right text-neutral-700">{prod.carts.toLocaleString()}회</td>
                    <td className="py-3.5 px-6 text-right font-medium text-neutral-800">{prod.purchases.toLocaleString()}개</td>
                    <td className="py-3.5 px-6 text-right font-bold text-[#21358D]">
                      <div className="flex items-center justify-end gap-2">
                        <span className="w-12 text-right">{prod.conversionRate}%</span>
                        <div className="w-16 bg-neutral-100 rounded-full h-1.5 hidden sm:block">
                          <div className="bg-[#21358D] h-1.5 rounded-full" style={{ width: `${prod.conversionRate}%` }} />
                        </div>
                      </div>
                    </td>
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
                  전체 <span className="font-semibold text-neutral-900">{totalCount}</span>개 상품 중{' '}
                  <span className="font-semibold text-neutral-900">{(page - 1) * limit + 1}</span>~
                  <span className="font-semibold text-neutral-900">{Math.min(page * limit, totalCount)}</span>번째 표시
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
