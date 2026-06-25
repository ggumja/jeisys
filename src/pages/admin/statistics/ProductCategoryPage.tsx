import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Tag, TrendingUp, Info } from 'lucide-react';
import { adminService } from '../../../services/adminService';

import * as XLSX from 'xlsx';

// Custom ResizeObserver Hook using callback ref
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

const COLORS = [
  '#21358D', '#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', 
  '#10b981', '#06b6d4', '#64748b', '#ef4444', '#14b8a6'
];

export function ProductCategoryPage() {
  const { dateRange, onRegisterExport, label } = useOutletContext<{
    dateRange: string;
    onRegisterExport: (fn: (() => void) | null) => void;
    label: string;
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [checkedProducts, setCheckedProducts] = useState<string[]>([]);

  // Resize Ref
  const [chartRef, chartWidth] = useChartDimensions(500);

  // 엑셀 다운로드 핸들러
  const handleExport = useCallback(() => {
    if (!stats || !stats.products) return;
    try {
      const titleRows = [
        ['카테고리별 상품 판매 실적 현황'],
        [`선택 카테고리: ${selectedCategory || stats.selectedCategory}`],
        [`분석 기간: ${label}`],
        []
      ];

      const headers = ['상품명', '상품코드', '카테고리', '누적 판매 수량', '총 판매 금액', '현재 재고', '판매 상태'];
      const body = stats.products.map((p: any) => [
        p.name,
        p.sku || '-',
        p.category || '-',
        p.totalQty,
        p.totalRevenue,
        p.stock,
        p.is_active ? '판매중' : '판매중지'
      ]);

      const ws = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...body]);
      ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '카테고리별 상품 실적');

      const now = new Date();
      const dateSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      XLSX.writeFile(wb, `카테고리별_상품실적_${dateSuffix}.xlsx`);
    } catch (error) {
      console.error('카테고리별 엑셀 다운로드 실패:', error);
    }
  }, [stats, selectedCategory, label]);

  // Register Export Function
  useEffect(() => {
    if (!isLoading && stats) {
      onRegisterExport(handleExport);
    }
    return () => {
      onRegisterExport(null);
    };
  }, [isLoading, stats, handleExport, onRegisterExport]);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const data = await adminService.getProductCategoryTrendStats(dateRange, selectedCategory);
        setStats(data);
        if (data && data.selectedCategory) {
          setSelectedCategory(data.selectedCategory);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange, selectedCategory]);

  // 카테고리 변경 혹은 데이터 로드 시 체크 상품 ID 목록 초기화
  useEffect(() => {
    if (stats?.products) {
      const productIds = stats.products.map((p: any) => p.id);
      setCheckedProducts(productIds);
    }
  }, [stats?.products]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
  };

  const handleToggleProduct = (id: string) => {
    setCheckedProducts(prev => 
      prev.includes(id) 
        ? prev.filter(pId => pId !== id) 
        : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (!stats) return;
    const allIds = stats.products.map((p: any) => p.id);
    if (checkedProducts.length === allIds.length) {
      setCheckedProducts([]);
    } else {
      setCheckedProducts(allIds);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  const { categories = [], products = [], trendData = [] } = stats || {};

  return (
    <div className="space-y-6">
      {/* 카테고리 탭 선택 */}
      <div className="bg-white border border-neutral-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-[#21358D]" />
          <span className="text-sm font-semibold text-neutral-800">카테고리 선택</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat: string) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 text-xs font-semibold rounded border transition-all ${
                  isSelected
                    ? 'border-[#21358D] text-white'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
                style={isSelected ? { backgroundColor: '#21358D' } : undefined}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 상품 체크박스 필터 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm flex flex-col h-full lg:col-span-1">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
            <span className="text-sm font-semibold text-neutral-800">상품 필터</span>
            <button
              onClick={handleToggleAll}
              className="text-xs text-[#21358D] hover:underline font-medium"
            >
              {checkedProducts.length === products.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[300px] flex-1 pr-1">
            {products.map((p: any, idx: number) => {
              const isChecked = checkedProducts.includes(p.id);
              const color = COLORS[idx % COLORS.length];
              return (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-neutral-50 rounded px-1">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleProduct(p.id)}
                    className="rounded border-neutral-300 text-[#21358D] focus:ring-[#21358D] w-4 h-4"
                  />
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs text-neutral-700 truncate" title={p.name}>{p.name}</span>
                </label>
              );
            })}
            {products.length === 0 && (
              <span className="text-xs text-neutral-400">카테고리에 상품이 없습니다.</span>
            )}
          </div>
        </div>

        {/* 차트 시각화 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm lg:col-span-3">
          <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#21358D]" />
            <span>선택 카테고리 상품별 누적 판매량 추이</span>
          </h3>
          <p className="text-xs text-neutral-500 mb-6">선택한 카테고리에 속한 개별 상품들의 월간 판매 추세를 보여줍니다.</p>

          <div ref={chartRef} className="h-[350px] w-full min-w-0 relative">
            {trendData.length > 0 && checkedProducts.length > 0 ? (
              <LineChart width={chartWidth} height={350} data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
                <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} formatter={(v: number) => `${v.toLocaleString()}개`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
                {products.map((p: any, index: number) => {
                  if (!checkedProducts.includes(p.id)) return null;
                  return (
                    <Line
                      key={p.id}
                      type="monotone"
                      dataKey={p.id}
                      name={p.name}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2.5}
                      activeDot={{ r: 6 }}
                    />
                  );
                })}
              </LineChart>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-400 text-sm">
                {checkedProducts.length === 0 
                  ? '필터에서 노출할 상품을 선택해주세요.' 
                  : '분석 가능한 판매 추이 데이터가 충분하지 않습니다.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#21358D]" />
            <span>상품별 누적 판매 실적 현황</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            현재 카테고리("{selectedCategory}") 내의 모든 상품별 누적 판매량 및 총 매출액, 재고량을 조회합니다.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-3.5 text-xs font-semibold text-neutral-700">상품명</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-neutral-700">상품코드</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-neutral-700">카테고리</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-neutral-700 text-right">누적 판매 수량</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-neutral-700 text-right">총 판매 금액</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-neutral-700 text-right">현재 재고</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-neutral-700 text-center">판매 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-neutral-900">{p.name}</td>
                  <td className="px-6 py-4 font-semibold text-neutral-500 uppercase tracking-wider">{p.sku}</td>
                  <td className="px-6 py-4 text-neutral-500">{p.category}</td>
                  <td className="px-6 py-4 text-right font-medium text-neutral-900">{p.totalQty.toLocaleString()}개</td>
                  <td className="px-6 py-4 text-right font-semibold text-[#21358D]">{p.totalRevenue.toLocaleString()}원</td>
                  <td className={`px-6 py-4 text-right ${p.stock < 10 ? 'text-red-600 font-medium' : 'text-neutral-700'}`}>
                    {p.stock.toLocaleString()}개
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 rounded text-[10px] font-semibold ${
                      p.is_active 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    }`}>
                      {p.is_active ? '판매중' : '판매중지'}
                    </span>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-neutral-400">
                    등록된 상품이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
