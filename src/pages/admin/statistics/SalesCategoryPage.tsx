import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Tag, TrendingUp, ChevronRight } from 'lucide-react';
import { adminService } from '../../../services/adminService';

// Custom ResizeObserver Hook using callback ref to bypass React conditional loading state ref issues
function useChartDimensions(defaultWidth = 250) {
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

const MOCK_CATEGORY_DATA = [
  {
    category: '의료기기 장비',
    sales: 125000000,
    orders: 45,
    avgOrder: 2777777,
    percentage: 54.3,
    products: [
      { id: 'p1', name: 'Density 장비 세트', sales: 75000000, quantity: 15, percentage: 60.0 },
      { id: 'p2', name: 'POTENZA 메인 바디', sales: 30000000, quantity: 10, percentage: 24.0 },
      { id: 'p3', name: 'LinearZ 장비 패키지', sales: 2000000, quantity: 20, percentage: 16.0 },
    ]
  },
  {
    category: '시술 전용 팁',
    sales: 65000000,
    orders: 120,
    avgOrder: 541666,
    percentage: 28.3,
    products: [
      { id: 'p4', name: 'POTENZA 전용 DDR Tip', sales: 35000000, quantity: 175, percentage: 53.8 },
      { id: 'p5', name: 'Density 단독 팁 결제', sales: 20000000, quantity: 80, percentage: 30.8 },
      { id: 'p6', name: 'LinearZ Contouring Tip', sales: 10000000, quantity: 50, percentage: 15.4 },
    ]
  },
  {
    category: '의료 소모품',
    sales: 28000000,
    orders: 95,
    avgOrder: 294736,
    percentage: 12.2,
    products: [
      { id: 'p7', name: '일회용 환자 음극판 (밴드형)', sales: 15000000, quantity: 500, percentage: 53.6 },
      { id: 'p8', name: '포텐자 전용 커플링 플로이드', sales: 8000000, quantity: 160, percentage: 28.6 },
      { id: 'p9', name: 'ND-YAG 소프트필링 카본 크림', sales: 5000000, quantity: 100, percentage: 17.8 },
    ]
  },
  {
    category: '액세서리 및 가드',
    sales: 12000000,
    orders: 60,
    avgOrder: 200000,
    percentage: 5.2,
    products: [
      { id: 'p10', name: '시술자 보호 고글 (셀렉V 전용)', sales: 6000000, quantity: 30, percentage: 50.0 },
      { id: 'p11', name: '환자 보호용 아이쉴드 고글', sales: 4000000, quantity: 40, percentage: 33.3 },
      { id: 'p12', name: 'Clarius 전용 스캐너 가드', sales: 2000000, quantity: 10, percentage: 16.7 },
    ]
  }
];

export function SalesCategoryPage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Resize Ref
  const [pieRef, pieWidth] = useChartDimensions();

  // 상품 기여도 테이블 페이징 상태
  const [prodPage, setProdPage] = useState(1);
  const [prodLimit, setProdLimit] = useState(10);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const data = await adminService.getSalesCategoryStats(dateRange);
        if (data && data.length > 0) {
          setCategories(data);
          setSelectedCategory(data[0]);
          setIsDemo(false);
        } else {
          setCategories(MOCK_CATEGORY_DATA);
          setSelectedCategory(MOCK_CATEGORY_DATA[0]);
          setIsDemo(true);
        }
      } catch (err) {
        console.error(err);
        setCategories(MOCK_CATEGORY_DATA);
        setSelectedCategory(MOCK_CATEGORY_DATA[0]);
        setIsDemo(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange]);

  useEffect(() => {
    setProdPage(1); // 카테고리 변경 시 페이징 초기화
  }, [selectedCategory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  // 파이 차트용 데이터 포맷
  const chartData = categories.map((c) => ({
    name: c.category,
    value: c.sales,
  }));

  // 현재 선택된 카테고리의 상품 페이징 처리
  const currentProducts = selectedCategory?.products || [];
  const totalProductsCount = currentProducts.length;
  const totalPages = Math.ceil(totalProductsCount / prodLimit);
  const paginatedProducts = currentProducts.slice((prodPage - 1) * prodLimit, prodPage * prodLimit);

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-amber-100 text-amber-800 rounded">
              <span className="text-xs font-bold">INFO</span>
            </div>
            <div>
              <p className="text-xs text-amber-800 font-semibold">
                현재 분석 기간 내 매출 데이터가 부족하여 시각화 테스트용 데모 통계 데이터를 표시 중입니다.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 점유율 도넛 차트 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#21358D]" />
              <span>카테고리별 매출 점유율</span>
            </h3>
            <p className="text-xs text-neutral-500 mb-6">전체 매출 대비 카테고리별 기여도를 시각화합니다.</p>
          </div>
          <div ref={pieRef} className="h-[250px] w-full min-w-0 relative">
            <PieChart width={pieWidth} height={250}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `₩${value.toLocaleString()}`} />
            </PieChart>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-neutral-600">
            {categories.map((c, index) => (
              <div key={c.category} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="truncate">{c.category} ({c.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* 카테고리 상세 목록 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-neutral-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#21358D]" />
            <span>카테고리별 매출 상세</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4 font-semibold text-neutral-700 w-16 text-center">No.</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700">카테고리</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700 text-right">매출액</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700 text-right">주문수</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700 text-right">평균주문액</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700 text-right">점유율</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {categories.map((item, index) => {
                  const isSelected = selectedCategory?.category === item.category;
                  return (
                    <tr
                      key={item.category}
                      onClick={() => setSelectedCategory(item)}
                      className={`hover:bg-neutral-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/40 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center text-neutral-500 font-medium">{index + 1}</td>
                      <td className="py-3 px-4 flex items-center gap-2">
                        <span>{item.category}</span>
                        {isSelected && <ChevronRight className="w-4 h-4 text-[#21358D]" />}
                      </td>
                      <td className="py-3 px-4 text-right">₩{item.sales.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{item.orders}건</td>
                      <td className="py-3 px-4 text-right">₩{item.avgOrder.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-[#21358D] font-semibold">{item.percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 선택된 카테고리의 상품별 기여도 상세 테이블 (드릴다운) */}
      {selectedCategory && (
        <div className="bg-white border border-neutral-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <span className="text-[#21358D]">[{selectedCategory.category}]</span>
                <span>카테고리 내 상품 기여도</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-1">해당 카테고리 내에서 개별 상품이 차지하는 매출 비중 순위입니다.</p>
            </div>
            {/* 행 수 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 font-medium">보기:</span>
              <select
                value={prodLimit}
                onChange={(e) => {
                  setProdLimit(Number(e.target.value));
                  setProdPage(1);
                }}
                className="border border-neutral-300 rounded px-2 py-1 text-xs bg-white text-neutral-700"
              >
                <option value="5">5개씩</option>
                <option value="10">10개씩</option>
                <option value="20">20개씩</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4 font-semibold text-neutral-700 w-16 text-center">순위</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700">상품명</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700 text-right">총 판매수량</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700 text-right">매출액</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700 text-right">카테고리 내 비중</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedProducts.map((prod: any, idx: number) => {
                  // No. 계산 공식 적용
                  const rankNo = (prodPage - 1) * prodLimit + (idx + 1);
                  return (
                    <tr key={prod.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full ${
                          rankNo <= 3 ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {rankNo}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-neutral-900">{prod.name}</td>
                      <td className="py-3 px-4 text-right">{prod.quantity.toLocaleString()}개</td>
                      <td className="py-3 px-4 text-right">₩{prod.sales.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium text-neutral-600">
                        <div className="flex items-center justify-end gap-2">
                          <span className="w-12 text-right">{prod.percentage}%</span>
                          <div className="w-16 bg-neutral-100 rounded-full h-1.5 hidden sm:block">
                            <div className="bg-[#21358D] h-1.5 rounded-full" style={{ width: `${prod.percentage}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-neutral-400">판매된 상품이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 페이징 컴포넌트 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 mt-4">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setProdPage(prev => Math.max(prev - 1, 1))}
                  disabled={prodPage === 1}
                  className="relative inline-flex items-center rounded border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  이전
                </button>
                <button
                  onClick={() => setProdPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={prodPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  다음
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-neutral-600">
                    전체 <span className="font-semibold">{totalProductsCount}</span>개 상품 중{' '}
                    <span className="font-semibold">{(prodPage - 1) * prodLimit + 1}</span>~
                    <span className="font-semibold">{Math.min(prodPage * prodLimit, totalProductsCount)}</span>번째 표시
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded shadow-sm gap-1" aria-label="Pagination">
                    <button
                      onClick={() => setProdPage(prev => Math.max(prev - 1, 1))}
                      disabled={prodPage === 1}
                      className="relative inline-flex items-center px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 border border-neutral-300 rounded disabled:opacity-50"
                    >
                      이전
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setProdPage(i + 1)}
                        className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded border ${
                          prodPage === i + 1
                            ? 'bg-[#21358D] text-white border-[#21358D] z-10'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setProdPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={prodPage === totalPages}
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
      )}
    </div>
  );
}
