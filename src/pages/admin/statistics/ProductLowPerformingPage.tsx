import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
          <div className="bg-white border-t border-neutral-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-600">
                전체 <span className="font-medium text-neutral-900">{totalCount}</span>개 중{' '}
                <span className="font-medium text-neutral-900">{(page - 1) * limit + 1}</span>-
                <span className="font-medium text-neutral-900">{Math.min(page * limit, totalCount)}</span>개
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm border bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                    if (
                      p === 1 ||
                      p === totalPages ||
                      (p >= page - 2 && p <= page + 2)
                    ) {
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`px-3 py-2 text-sm border transition-colors ${page === p
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50'
                            }`}
                        >
                          {p}
                        </button>
                      );
                    } else if (
                      p === page - 3 ||
                      p === page + 3
                    ) {
                      return (
                        <span key={p} className="px-2 text-neutral-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 text-sm border bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
