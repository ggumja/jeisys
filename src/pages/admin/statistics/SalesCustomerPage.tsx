import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { Search, RotateCcw, Award } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import * as XLSX from 'xlsx';

export function SalesCustomerPage() {
  const { dateRange, onRegisterExport } = useOutletContext<{
    dateRange: string;
    onRegisterExport: (fn: (() => void) | null) => void;
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // 검색 및 페이징 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // 기본 10개씩 보기

  // 엑셀 다운로드 핸들러 정의
  const handleExport = useCallback(async () => {
    try {
      const stats = await adminService.getSalesCustomerStats(dateRange, 1, 999999, appliedSearch);
      const allData = stats.data || [];

      const headers = ['순위', '고객명', '병원명', '고객분류', '총 주문건수', '평균 주문액', '누적 매출액'];
      const body = allData.map((c: any) => [
        c.rank,
        c.name || '-',
        c.hospitalName || '-',
        c.memberType || '-',
        c.orders,
        c.avgOrder,
        c.totalSales
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
      ws['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '고객별 매출 순위');

      const now = new Date();
      const dateSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      XLSX.writeFile(wb, `고객별_매출순위_${dateSuffix}.xlsx`);
    } catch (error) {
      console.error('고객별 매출 순위 엑셀 다운로드 실패:', error);
    }
  }, [dateRange, appliedSearch]);

  // 엑셀 다운로드 함수 등록
  useEffect(() => {
    onRegisterExport(handleExport);
    return () => {
      onRegisterExport(null);
    };
  }, [handleExport, onRegisterExport]);

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
      <div className="bg-white border border-neutral-200 p-5 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
          {/* 검색 입력 박스 */}
          <div className="flex items-center flex-1 border border-neutral-300 rounded bg-white px-3 gap-2 focus-within:ring-2 focus-within:ring-neutral-900 focus-within:border-neutral-900 transition-all">
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder="고객명 또는 병원명 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 py-2 text-sm text-neutral-900 bg-transparent outline-none placeholder:text-neutral-400"
            />
          </div>
          {/* 버튼 */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-300 rounded text-neutral-700 bg-white hover:bg-neutral-50 font-semibold text-xs transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>초기화</span>
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-neutral-900 text-white hover:bg-neutral-800 rounded font-semibold text-xs transition-colors shrink-0"
          >
            검색
          </button>
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
                  <td colSpan={6} className="text-center py-16">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#21358D] mx-auto" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-neutral-400">
                    조회된 고객 매출 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                customers.map((c, index) => {
                  return (
                    <tr key={c.userId} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-6 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${
                          c.rank <= 3
                            ? 'bg-[#21358D]/10 text-[#21358D] border border-[#21358D]/20'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {c.rank}
                        </span>
                      </td>
                      <td className="py-3 px-6 font-semibold text-neutral-900">{c.name}</td>
                      <td className="py-3 px-6 text-neutral-600 font-medium">{c.hospitalName}</td>
                      <td className="py-3 px-6 text-right text-neutral-600 font-medium">{c.orders}건</td>
                      <td className="py-3 px-6 text-right text-neutral-600 font-medium">₩{c.avgOrder.toLocaleString()}</td>
                      <td className="py-3 px-6 text-right font-bold text-neutral-950">₩{c.totalSales.toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이징 컴포넌트 */}
        {!isLoading && totalCount > 0 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
            <p className="text-xs text-neutral-600">
              전체 <span className="font-semibold text-neutral-900">{totalCount}</span>명 중{' '}
              <span className="font-semibold text-neutral-900">{(page - 1) * limit + 1}</span>~
              <span className="font-semibold text-neutral-900">{Math.min(page * limit, totalCount)}</span>위 표시
            </p>
            {totalPages > 1 && (
              <nav className="inline-flex items-center gap-1" aria-label="Pagination">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 border border-neutral-300 rounded disabled:opacity-40 transition-colors"
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce<(number | string)[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`el-${i}`} className="px-1.5 text-neutral-400 text-xs">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        style={page === p ? { backgroundColor: '#21358D', color: '#fff', borderColor: '#21358D' } : {}}
                        className={`min-w-[32px] px-2.5 py-1.5 text-xs font-semibold rounded border transition-colors ${
                          page === p ? '' : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 border border-neutral-300 rounded disabled:opacity-40 transition-colors"
                >
                  다음
                </button>
              </nav>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
