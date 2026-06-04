import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { Search, RotateCcw, Award } from 'lucide-react';
import { adminService } from '../../../services/adminService';

export function SalesCustomerPage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // 검색 및 페이징 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // 기본 10개씩 보기

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const stats = await adminService.getSalesCustomerStats(dateRange, page, limit, appliedSearch);
        setCustomers(stats.data);
        setTotalCount(stats.totalCount);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange, page, limit, appliedSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchTerm);
    setPage(1); // 검색 시 첫 페이지로 리셋
  };

  const handleReset = () => {
    setSearchTerm('');
    setAppliedSearch('');
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 패널 */}
      <div className="bg-white border border-neutral-200 p-6 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="고객명 또는 병원명 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-300 rounded text-neutral-700 bg-white hover:bg-neutral-50 active:bg-neutral-100 font-semibold text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>초기화</span>
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-neutral-900 text-white hover:bg-neutral-800 rounded font-semibold text-xs transition-colors"
            >
              검색
            </button>
          </div>
        </form>
      </div>

      {/* 테이블 목록 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-neutral-200">
          <div>
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#21358D]" />
              <span>고객별 매출 순위</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1">선택한 기간 동안의 누적 구매 금액 기준 고객 순위입니다.</p>
          </div>
          {/* 행 수 선택 (Rows per Page) - 가이드라인 1-2 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">행 표시:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border border-neutral-300 rounded px-2 py-1 text-xs bg-white text-neutral-700 font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-900"
            >
              <option value="10">10개씩 보기</option>
              <option value="20">20개씩 보기</option>
              <option value="50">50개씩 보기</option>
              <option value="100">100개씩 보기</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-6 font-semibold text-neutral-700 w-20 text-center">No.</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 w-24 text-center">순위</th>
                <th className="py-3 px-6 font-semibold text-neutral-700">고객명</th>
                <th className="py-3 px-6 font-semibold text-neutral-700">병원명</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 text-right">총 주문건수</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 text-right">평균 주문액</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 text-right">누적 매출액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#21358D] mx-auto" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-neutral-400">
                    조회된 고객 매출 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                customers.map((c, index) => {
                  // No. 계산 공식 적용 - 가이드라인 1-1
                  const rowNo = (page - 1) * limit + (index + 1);
                  return (
                    <tr key={c.userId} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3.5 px-6 text-center text-neutral-500 font-medium">{rowNo}</td>
                      <td className="py-3.5 px-6 text-center">
                        <span className={`inline-flex items-center justify-center w-5.5 h-5.5 text-xs font-bold rounded-full ${
                          c.rank <= 3
                            ? 'bg-[#21358D]/10 text-[#21358D] border border-[#21358D]/20'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {c.rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-neutral-900">{c.name}</td>
                      <td className="py-3.5 px-6 text-neutral-600 font-medium">{c.hospitalName}</td>
                      <td className="py-3.5 px-6 text-right text-neutral-600 font-medium">{c.orders}건</td>
                      <td className="py-3.5 px-6 text-right text-neutral-600 font-medium">₩{c.avgOrder.toLocaleString()}</td>
                      <td className="py-3.5 px-6 text-right font-bold text-neutral-950">₩{c.totalSales.toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이징 컴포넌트 - 가이드라인 1-2 */}
        {!isLoading && totalPages > 1 && (
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
                  전체 <span className="font-semibold text-neutral-900">{totalCount}</span>명 중{' '}
                  <span className="font-semibold text-neutral-900">{(page - 1) * limit + 1}</span>~
                  <span className="font-semibold text-neutral-900">{Math.min(page * limit, totalCount)}</span>위 표시
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded shadow-sm gap-1" aria-label="Pagination">
                  <button
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 border border-neutral-300 rounded disabled:opacity-50 transition-colors"
                  >
                    이전
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
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
                    className="relative inline-flex items-center px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 border border-neutral-300 rounded disabled:opacity-50 transition-colors"
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
