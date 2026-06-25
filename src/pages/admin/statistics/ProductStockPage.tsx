import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Hourglass, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService } from '../../../services/adminService';

export function ProductStockPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stockData, setStockData] = useState<any>(null);

  // 페이징 상태
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // 기본 10개씩 보기

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const stats = await adminService.getProductStockStats(page, limit);
        setStockData(stats);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [page, limit]);

  if (isLoading || !stockData) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  const { data: products, totalCount, lowStockAlerts } = stockData;
  const totalPages = Math.ceil(totalCount / limit);

  // 소진 기한 배지 렌더링 헬퍼
  const renderOutOfStockBadge = (days: number, stock: number) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
          재고 없음
        </span>
      );
    }
    if (days <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200 animate-pulse">
          <Hourglass className="w-3 h-3" />
          {days}일 내 품절 임박
        </span>
      );
    }
    if (days <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          {days}일분 남음
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        안전 (30일 이상)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 긴급 재고부족 경고 (최소재고 미만) */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 text-red-600 rounded">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-950 mb-1">긴급 재고 부족 알림 ({lowStockAlerts.length}개 상품)</h4>
              <p className="text-xs text-red-800 mb-4">아래 상품들은 설정된 안전 재고 미만입니다. 빠른 재발주를 권장합니다.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lowStockAlerts.map((prod: any) => (
                  <div key={prod.id} className="flex items-center justify-between text-xs bg-white/60 p-2.5 border border-red-200/50 rounded font-semibold text-neutral-800">
                    <span className="truncate max-w-[220px]">{prod.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">재고: {prod.stock}개</span>
                      <span className="text-red-600">(기준: {prod.minStock}개)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 전체 상품 재고 분석 테이블 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-neutral-200">
          <div>
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-[#21358D]" />
              <span>재고 소진 기한 예측 및 회전율</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1">최근 30일간의 판매 속도(일평균 판매량)를 기초로 현재 재고의 예상 소진일을 분석합니다.</p>
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
                <th className="py-3.5 px-6 font-semibold text-neutral-700 w-28">카테고리</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">현재 재고</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">안전 재고</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">최근 30일 판매량</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-center w-40">예상 소진 기한</th>
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
                    <td className="py-3 px-6 text-right font-semibold text-neutral-800">{prod.stock.toLocaleString()}개</td>
                    <td className="py-3 px-6 text-right text-neutral-500">{prod.minStock}개</td>
                    <td className="py-3 px-6 text-right font-medium text-neutral-700">{prod.sales30Days.toLocaleString()}개</td>
                    <td className="py-3 px-6 text-center">
                      {renderOutOfStockBadge(prod.daysToOutOfStock, prod.stock)}
                    </td>
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
