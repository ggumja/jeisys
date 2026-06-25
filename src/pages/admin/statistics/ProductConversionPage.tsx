import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService } from '../../../services/adminService';

// Custom ResizeObserver Hook using callback ref to bypass React conditional loading state ref issues
function useChartDimensions(defaultWidth = 500) {
  const [width, setWidth] = useState(defaultWidth);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node) {
      const observer = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const { width } = entries[0].contentRect;
        if (width > 0) {
          setWidth(width);
        }
      });
      observer.observe(node);
      observerRef.current = observer;

      const initialWidth = node.getBoundingClientRect().width;
      if (initialWidth > 0) {
        setWidth(initialWidth);
      }
    }
  }, []);

  return [ref, width] as const;
}

import * as XLSX from 'xlsx';

export function ProductConversionPage() {
  const { dateRange, onRegisterExport, label } = useOutletContext<{
    dateRange: string;
    onRegisterExport: (fn: (() => void) | null) => void;
    label: string;
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [conversionData, setConversionData] = useState<any>(null);

  // Resize Ref
  const [chartRef, chartWidth] = useChartDimensions(500);

  // 페이징 상태
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // 기본 10개씩 보기

  // 엑셀 다운로드 핸들러
  const handleExport = useCallback(async () => {
    try {
      const stats = await adminService.getProductConversionStats(dateRange, 1, 999999);
      const allData = stats.data || [];

      const titleRows = [
        ['상품 구매 전환율 분석'],
        [`분석 기간: ${label}`],
        []
      ];

      const headers = ['순위', '상품명', '상세페이지 조회수', '장바구니 담기', '주문/구매 수량', '상세->장바구니 전환율', '상세->구매 전환율'];
      const body = allData.map((p: any, idx: number) => [
        idx + 1,
        p.name,
        p.viewCount,
        p.cartCount,
        p.buyCount,
        `${p.viewToCartRate}%`,
        `${p.viewToBuyRate}%`
      ]);

      const ws = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...body]);
      ws['!cols'] = [{ wch: 8 }, { wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 22 }, { wch: 20 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '구매 전환율 분석');

      const now = new Date();
      const dateSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      XLSX.writeFile(wb, `구매_전환율_분석_${dateSuffix}.xlsx`);
    } catch (error) {
      console.error('구매 전환율 분석 엑셀 다운로드 실패:', error);
    }
  }, [dateRange, label]);

  // Register Export Function
  useEffect(() => {
    if (!isLoading && conversionData) {
      onRegisterExport(handleExport);
    }
    return () => {
      onRegisterExport(null);
    };
  }, [isLoading, conversionData, handleExport, onRegisterExport]);

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
        <div ref={chartRef} className="h-[320px] w-full min-w-0 relative">
          <BarChart width={chartWidth} height={320} data={chartData}>
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
                    <td className="py-3 px-6 text-center text-neutral-500 font-medium">{rowNo}</td>
                    <td className="py-3 px-6 font-semibold text-neutral-900">{prod.name}</td>
                    <td className="py-3 px-6 text-neutral-600 font-semibold">{prod.category}</td>
                    <td className="py-3 px-6 text-right text-neutral-700">{prod.views.toLocaleString()}회</td>
                    <td className="py-3 px-6 text-right text-neutral-700">{prod.carts.toLocaleString()}회</td>
                    <td className="py-3 px-6 text-right font-medium text-neutral-800">{prod.purchases.toLocaleString()}개</td>
                    <td className="py-3 px-6 text-right font-bold text-[#21358D]">
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
