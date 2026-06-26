import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
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

const COLORS = ['#21358D', '#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#64748b'];

export function ProductOverviewPage() {
  const { dateRange, granularity } = useOutletContext<{ dateRange: string; granularity: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  // Resize Ref
  const [chartRef, chartWidth] = useChartDimensions(500);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const data = await adminService.getProductOverviewStats(dateRange, granularity);
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange, granularity]);

  // stats 로드 시 전체 카테고리 활성화
  useEffect(() => {
    if (!stats) return;
    const categoriesSet = new Set<string>();
    stats.categoryTrendData.forEach((row: any) => {
      Object.keys(row).forEach((k) => {
        if (k !== 'month') categoriesSet.add(k);
      });
    });
    setActiveCategories(Array.from(categoriesSet));
  }, [stats]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  const { summary, categoryTrendData } = stats;

  // 차트에 그릴 카테고리 종류 추출 (데이터 필드가 Y축에 렌더링됨)
  const categoriesSet = new Set<string>();
  categoryTrendData.forEach((row: any) => {
    Object.keys(row).forEach((k) => {
      if (k !== 'month') categoriesSet.add(k);
    });
  });
  const uniqueCategories = Array.from(categoriesSet);

  return (
    <div className="space-y-6">
      {/* 요약 지표 카드 */}
      <div className="flex flex-row flex-nowrap overflow-x-auto pb-1 gap-3 scrollbar-thin">
        {/* 전체 상품 수 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-blue-50 text-[#21358D] rounded">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-600 font-semibold">전체 등록 상품</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">{summary.totalProducts}개</p>
          <div className="mt-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs text-neutral-500 font-medium">활성 판매중: {summary.activeProducts}개</span>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#21358D]/5 rounded-full translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
        </div>

        {/* 총 판매량 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-green-50 text-green-600 rounded">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-600 font-semibold">선택 기간 판매량</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">{summary.totalQtySold.toLocaleString()}개</p>
          <div className="mt-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs text-neutral-500 font-medium">실시간 판매수량</span>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
        </div>

        {/* 재고 부족 경고 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-red-50 text-red-600 rounded">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-600 font-semibold">재고 부족 경보</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">{summary.lowStockCount}개 상품</p>
          <div className="mt-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs text-red-600 font-semibold">재고 10개 미만 상품</span>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* 카테고리별 판매 추이 그래프 */}
      <div className="bg-white border border-neutral-200 p-6 shadow-sm">
        <h3 className="font-semibold text-neutral-900 mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#21358D]" />
          <span>카테고리별 판매량 추이</span>
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          분석 기간 내 각 카테고리의 판매 추이를 비교하여 시각화합니다. 아래 체크박스를 통해 개별 카테고리 표시를 켜거나 끌 수 있습니다.
        </p>

        {/* 카테고리 선택 체크박스 필터 */}
        {uniqueCategories.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-neutral-50 rounded border border-neutral-200">
            {/* 전체선택 체크박스 */}
            <label className="flex items-center gap-2 text-xs font-bold text-neutral-800 cursor-pointer select-none border-r border-neutral-300 pr-4 mr-1">
              <input
                type="checkbox"
                checked={activeCategories.length === uniqueCategories.length && uniqueCategories.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setActiveCategories(uniqueCategories);
                  } else {
                    setActiveCategories([]);
                  }
                }}
                className="w-4 h-4 rounded border-neutral-300 text-[#21358D] focus:ring-[#21358D] transition-colors cursor-pointer"
              />
              <span>전체선택</span>
            </label>

            {uniqueCategories.map((cat, index) => {
              const isChecked = activeCategories.includes(cat);
              return (
                <label key={cat} className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (activeCategories.includes(cat)) {
                        setActiveCategories(activeCategories.filter((c) => c !== cat));
                      } else {
                        setActiveCategories([...activeCategories, cat]);
                      }
                    }}
                    className="w-4 h-4 rounded border-neutral-300 text-[#21358D] focus:ring-[#21358D] transition-colors cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 inline-block rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {cat}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        <div ref={chartRef} className="h-[350px] w-full min-w-0 relative">
          {categoryTrendData.length > 0 ? (
            <LineChart width={chartWidth} height={350} data={categoryTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
              <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} formatter={(v: number) => `${v.toLocaleString()}개`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
              {uniqueCategories.map((cat, index) => {
                if (!activeCategories.includes(cat)) return null;
                return (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    name={cat}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                );
              })}
            </LineChart>
          ) : (
            <div className="h-full flex items-center justify-center text-neutral-400 text-sm">
              분석 가능한 판매 추이 데이터가 충분하지 않습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
