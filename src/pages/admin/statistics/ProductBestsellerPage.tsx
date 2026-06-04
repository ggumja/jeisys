import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { Award, TrendingUp } from 'lucide-react';
import { adminService } from '../../../services/adminService';

export function ProductBestsellerPage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // 검색 및 정렬 필터 상태
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('sales');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // 10개 기본보기

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const stats = await adminService.getProductBestsellerStats(
          dateRange,
          page,
          limit,
          categoryFilter,
          sortBy
        );
        setProducts(stats.data);
        setTotalCount(stats.totalCount);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange, page, limit, categoryFilter, sortBy]);

  // 필터 변경 시 첫 페이지로 리셋
  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val);
    setPage(1);
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      {/* 필터 제어부 */}
      <div className="bg-white border border-neutral-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5">카테고리</label>
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-1.5 text-xs bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900 font-semibold"
            >
              <option value="all">전체 브랜드</option>
              <option value="density">Density</option>
              <option value="potenza">POTENZA</option>
              <option value="ultracel">ULTRAcel II</option>
              <option value="lipocel">LIPOcel II</option>
              <option value="intragen">IntraGen</option>
              <option value="etc">기타소모품</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5">정렬 기준</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-1.5 text-xs bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900 font-semibold"
            >
              <option value="sales">판매량순</option>
              <option value="revenue">매출액순</option>
              <option value="growth">성장률순</option>
            </select>
          </div>
        </div>

        {/* 행 수 선택 (Rows per Page) - 가이드라인 1-2 */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs text-neutral-500 font-medium">행 표시:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="border border-neutral-300 rounded px-2 py-1 text-xs bg-white text-neutral-700 font-semibold focus:outline-none"
          >
            <option value="10">10개씩 보기</option>
            <option value="20">20개씩 보기</option>
            <option value="50">50개씩 보기</option>
          </select>
        </div>
      </div>

      {/* 테이블 리스트 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#21358D]" />
            <span>베스트셀러 상품 랭킹</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-1">지정된 정렬 기준과 카테고리에 부합하는 상품들의 성과 데이터 순위입니다.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 w-20 text-center">순위</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700">상품명</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 w-32">카테고리</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">판매수량</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">총 매출액</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">재고수량</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">성장률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#21358D] mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-neutral-400">
                    해당 조건에 부합하는 상품 판매 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                products.map((product, index) => {
                  // No. 계산 공식 적용 - 가이드라인 1-1
                  const rankNo = (page - 1) * limit + (index + 1);
                  return (
                    <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3.5 px-6 text-center">
                        <span className={`inline-flex items-center justify-center w-5.5 h-5.5 text-xs font-bold rounded-full ${
                          rankNo <= 3
                            ? 'bg-[#21358D]/10 text-[#21358D] border border-[#21358D]/20'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {rankNo}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-neutral-900">{product.name}</td>
                      <td className="py-3.5 px-6 text-neutral-600 font-semibold">{product.category}</td>
                      <td className="py-3.5 px-6 text-right font-medium text-neutral-800">{product.sales.toLocaleString()}개</td>
                      <td className="py-3.5 px-6 text-right font-bold text-neutral-900">₩{product.revenue.toLocaleString()}</td>
                      <td className="py-3.5 px-6 text-right">
                        <span className={`font-semibold ${product.stock < 10 ? 'text-red-600' : 'text-neutral-700'}`}>
                          {product.stock.toLocaleString()}개
                        </span>
                      </td>
                      <td className={`py-3.5 px-6 text-right font-bold ${
                        product.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.growth >= 0 ? '+' : ''}{product.growth}%
                      </td>
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
                  전체 <span className="font-semibold text-neutral-900">{totalCount}</span>개 상품 중{' '}
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
