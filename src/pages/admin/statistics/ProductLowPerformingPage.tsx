import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { AlertCircle } from 'lucide-react';
import { adminService } from '../../../services/adminService';

export function ProductLowPerformingPage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // 페이징 상태
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // 기본 10개씩 보기

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const stats = await adminService.getProductLowPerformingStats(dateRange, page, limit);
        setData(stats);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange, page, limit]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  const { data: products, totalCount } = data;
  const totalPages = Math.ceil(totalCount / limit);


  return (
    <div className="space-y-6">

      {/* 상세 테이블 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#21358D]" />
            <h3 className="font-semibold text-neutral-900">판매 부진 순위 및 창고 보유 현황</h3>
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
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">단가</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">지정 기간 판매량</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">현재 창고재고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((prod: any, idx: number) => {
                const rowNo = (page - 1) * limit + (idx + 1);
                return (
                  <tr key={prod.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-6 text-center text-neutral-500 font-medium">{rowNo}</td>
                    <td className="py-3 px-6 font-semibold text-neutral-900">{prod.name}</td>
                    <td className="py-3 px-6 text-neutral-600 font-semibold">{prod.category}</td>
                    <td className="py-3 px-6 text-right text-neutral-600">₩{prod.price.toLocaleString()}</td>
                    <td className="py-3 px-6 text-right font-semibold text-red-600">{prod.sales.toLocaleString()}개</td>
                    <td className="py-3 px-6 text-right font-semibold text-neutral-800">{prod.stock.toLocaleString()}개</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 페이징 컴포넌트 */}
        {totalCount > 0 && (
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
