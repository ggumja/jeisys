import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useOutletContext } from 'react-router';
import { PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Tag, TrendingUp, ChevronRight, ChevronDown } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import * as XLSX from 'xlsx';

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
    subcategories: [
      { subcategory: 'Density 계열', sales: 75000000, orders: 15, avgOrder: 5000000, percentage: 60.0 },
      { subcategory: 'POTENZA 계열', sales: 30000000, orders: 10, avgOrder: 3000000, percentage: 24.0 },
      { subcategory: 'LinearZ 계열', sales: 20000000, orders: 20, avgOrder: 1000000, percentage: 16.0 }
    ],
    products: [
      { id: 'p1', name: 'Density 장비 세트', sales: 75000000, quantity: 15, percentage: 60.0 },
      { id: 'p2', name: 'POTENZA 메인 바디', sales: 30000000, quantity: 10, percentage: 24.0 },
      { id: 'p3', name: 'LinearZ 장비 패키지', sales: 20000000, quantity: 20, percentage: 16.0 },
    ],
    trendData: [
      { label: '06/13', sales: 12000000 },
      { label: '06/14', sales: 15000000 },
      { label: '06/15', sales: 8000000 },
      { label: '06/16', sales: 22000000 },
      { label: '06/17', sales: 18000000 },
      { label: '06/18', sales: 30000000 },
      { label: '06/19', sales: 20000000 },
    ]
  },
  {
    category: '시술 전용 팁',
    sales: 65000000,
    orders: 120,
    avgOrder: 541666,
    percentage: 28.3,
    subcategories: [
      { subcategory: 'POTENZA 팁', sales: 35000000, orders: 70, avgOrder: 500000, percentage: 53.8 },
      { subcategory: 'Density 팁', sales: 20000000, orders: 30, avgOrder: 666666, percentage: 30.8 },
      { subcategory: 'LinearZ 팁', sales: 10000000, orders: 20, avgOrder: 500000, percentage: 15.4 }
    ],
    products: [
      { id: 'p4', name: 'POTENZA 전용 DDR Tip', sales: 35000000, quantity: 175, percentage: 53.8 },
      { id: 'p5', name: 'Density 단독 팁 결제', sales: 20000000, quantity: 80, percentage: 30.8 },
      { id: 'p6', name: 'LinearZ Contouring Tip', sales: 10000000, quantity: 50, percentage: 15.4 },
    ],
    trendData: [
      { label: '06/13', sales: 8000000 },
      { label: '06/14', sales: 9000000 },
      { label: '06/15', sales: 6000000 },
      { label: '06/16', sales: 12000000 },
      { label: '06/17', sales: 10000000 },
      { label: '06/18', sales: 11000000 },
      { label: '06/19', sales: 9000000 },
    ]
  },
  {
    category: '의료 소모품',
    sales: 28000000,
    orders: 95,
    avgOrder: 294736,
    percentage: 12.2,
    subcategories: [
      { subcategory: '일회용 음극판', sales: 15000000, orders: 50, avgOrder: 300000, percentage: 53.6 },
      { subcategory: '포텐자 오일', sales: 8000000, orders: 25, avgOrder: 320000, percentage: 28.6 },
      { subcategory: '카본 크림', sales: 5000000, orders: 20, avgOrder: 250000, percentage: 17.8 }
    ],
    products: [
      { id: 'p7', name: '일회용 환자 음극판 (밴드형)', sales: 15000000, quantity: 500, percentage: 53.6 },
      { id: 'p8', name: '포텐자 전용 커플링 플로이드', sales: 8000000, quantity: 160, percentage: 28.6 },
      { id: 'p9', name: 'ND-YAG 소프트필링 카본 크림', sales: 5000000, quantity: 100, percentage: 17.8 },
    ],
    trendData: [
      { label: '06/13', sales: 3000000 },
      { label: '06/14', sales: 4000000 },
      { label: '06/15', sales: 2000000 },
      { label: '06/16', sales: 5000000 },
      { label: '06/17', sales: 4000000 },
      { label: '06/18', sales: 6000000 },
      { label: '06/19', sales: 4000000 },
    ]
  },
  {
    category: '액세서리 및 가드',
    sales: 12000000,
    orders: 60,
    avgOrder: 200000,
    percentage: 5.2,
    subcategories: [],
    products: [
      { id: 'p10', name: '시술자 보호 고글 (셀렉V 전용)', sales: 6000000, quantity: 30, percentage: 50.0 },
      { id: 'p11', name: '환자 보호용 아이쉴드 고글', sales: 4000000, quantity: 40, percentage: 33.3 },
      { id: 'p12', name: 'Clarius 전용 스캐너 가드', sales: 2000000, quantity: 10, percentage: 16.7 },
    ],
    trendData: [
      { label: '06/13', sales: 1000000 },
      { label: '06/14', sales: 1500000 },
      { label: '06/15', sales: 800000 },
      { label: '06/16', sales: 2200000 },
      { label: '06/17', sales: 1800000 },
      { label: '06/18', sales: 3000000 },
      { label: '06/19', sales: 1700000 },
    ]
  }
];

export function SalesCategoryPage() {
  const { dateRange, granularity, onRegisterExport, label } = useOutletContext<{
    dateRange: string;
    granularity: string;
    onRegisterExport: (fn: (() => void) | null) => void;
    label: string;
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryNames, setActiveCategoryNames] = useState<string[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    setExpandedCategories([]);
  }, [dateRange, granularity]);

  const handleExport = useCallback(() => {
    if (!categories || categories.length === 0) return;

    try {
      const titleRows = [
        ['카테고리별 매출 분석'],
        [`분석 기간: ${label}`],
        []
      ];

      // 1. 카테고리 요약 시트 데이터 준비
      const summaryHeaders = ['순위', '카테고리', '매출액', '주문수', '평균주문액', '점유율'];
      const summaryBody = categories.map((c, index) => [
        index + 1,
        c.category,
        c.sales,
        c.orders,
        c.avgOrder,
        `${c.percentage}%`
      ]);
      const wsSummary = XLSX.utils.aoa_to_sheet([...titleRows, summaryHeaders, ...summaryBody]);
      wsSummary['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 12 }];

      // 2. 제품별 상세 매출 시트 데이터 준비
      const detailHeaders = ['카테고리', '제품명', '제품 매출액', '판매 수량', '카테고리 내 매출 비중'];
      const detailBody: any[] = [];
      categories.forEach(c => {
        if (c.products && Array.isArray(c.products)) {
          c.products.forEach((p: any) => {
            detailBody.push([
              c.category,
              p.name || p.product_name || '-',
              p.sales,
              p.quantity,
              `${p.percentage}%`
            ]);
          });
        }
      });
      const wsDetail = XLSX.utils.aoa_to_sheet([...titleRows, detailHeaders, ...detailBody]);
      wsDetail['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 15 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, '카테고리 요약');
      XLSX.utils.book_append_sheet(wb, wsDetail, '카테고리별 제품 상세');

      const now = new Date();
      const dateSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      XLSX.writeFile(wb, `카테고리별_매출분석_${dateSuffix}.xlsx`);
    } catch (error) {
      console.error('카테고리별 매출 엑셀 다운로드 실패:', error);
    }
  }, [categories, label]);



  // 엑셀 다운로드 함수 등록
  useEffect(() => {
    if (categories && categories.length > 0) {
      onRegisterExport(handleExport);
    } else {
      onRegisterExport(null);
    }
    return () => {
      onRegisterExport(null);
    };
  }, [categories, handleExport, onRegisterExport]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setActiveCategoryNames(categories.map(c => c.category));
    }
  }, [categories]);

  // Resize Ref
  const [trendRef, trendWidth] = useChartDimensions();

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const data = await adminService.getSalesCategoryStats(dateRange, granularity);
        if (data && data.length > 0) {
          setCategories(data);
          setIsDemo(false);
        } else {
          setCategories(MOCK_CATEGORY_DATA);
          setIsDemo(true);
        }
      } catch (err) {
        console.error(err);
        setCategories(MOCK_CATEGORY_DATA);
        setIsDemo(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange, granularity]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }



  // 모든 카테고리의 trendData를 라벨(날짜) 기준으로 병합
  const mergedTrendData = (() => {
    const dataMap: Record<string, Record<string, number>> = {};
    const allLabels = new Set<string>();
    
    categories.forEach(cat => {
      if (cat.trendData) {
        cat.trendData.forEach((t: any) => {
          allLabels.add(t.label);
          if (!dataMap[t.label]) {
            dataMap[t.label] = {};
          }
          dataMap[t.label][cat.category] = t.sales;
        });
      }
    });

    const labelsArray = Array.from(allLabels).sort((a, b) => a.localeCompare(b));
    return labelsArray.map(label => {
      const row: Record<string, any> = { label };
      categories.forEach(cat => {
        row[cat.category] = dataMap[label]?.[cat.category] || 0;
      });
      return row;
    });
  })();



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

      {/* 카테고리 상세 목록 (아코디언 형태) */}
      <div className="bg-white border border-neutral-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#21358D]" />
              <span>카테고리별 매출 상세</span>
            </h3>
          </div>
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
                  const hasSub = item.subcategories && item.subcategories.length > 0;
                  const isExpanded = expandedCategories.includes(item.category);
                  return (
                    <Fragment key={item.category}>
                      <tr
                        onClick={hasSub ? () => {
                          setExpandedCategories(prev => 
                            prev.includes(item.category)
                              ? prev.filter(name => name !== item.category)
                              : [...prev, item.category]
                          );
                        } : undefined}
                        className={`transition-colors ${hasSub ? 'cursor-pointer hover:bg-neutral-50/80' : 'text-neutral-500'}`}
                      >
                        <td className="py-3 px-4 text-center text-neutral-500 font-semibold">{index + 1}</td>
                        <td className="py-3 px-4 font-bold text-neutral-900">
                          <div className="flex items-center gap-1.5">
                            <span>{item.category}</span>
                            {hasSub && (
                              isExpanded 
                                ? <ChevronDown className="w-3.5 h-3.5 text-[#21358D]" /> 
                                : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold">₩{item.sales.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">{item.orders}건</td>
                        <td className="py-3 px-4 text-right">₩{item.avgOrder.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-[#21358D] font-extrabold">{item.percentage}%</td>
                      </tr>
                      {hasSub && isExpanded && item.subcategories.map((sub: any, subIdx: number) => (
                        <tr key={sub.subcategory} className="bg-neutral-50/60 text-neutral-600 transition-colors">
                          <td className="py-2.5 px-4 text-center text-neutral-400 font-medium text-xs">
                            {index + 1}-{subIdx + 1}
                          </td>
                          <td className="py-2.5 px-4 pl-8 text-xs font-semibold text-neutral-700">
                            <span className="text-neutral-300 mr-1.5">└─</span>
                            <span>{sub.subcategory}</span>
                          </td>
                          <td className="py-2.5 px-4 text-right text-xs">₩{sub.sales.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right text-xs">{sub.orders}건</td>
                          <td className="py-2.5 px-4 text-right text-xs">₩{sub.avgOrder.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right text-xs font-semibold text-[#21358D]/80">
                            {sub.percentage}%
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
      </div>

      {/* 카테고리별 매출 추이 차트 (전체 카테고리 꺾은선 차트) */}
      <div className="bg-white border border-neutral-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#21358D]" />
              <span>카테고리별 매출 추이</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              분석 기간 내 각 카테고리의 매출 추이를 비교하여 시각화합니다. 아래 체크박스를 통해 개별 카테고리 표시를 켜거나 끌 수 있습니다.
            </p>
          </div>
        </div>

        {/* 카테고리 선택 체크박스 필터 */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-neutral-50 rounded border border-neutral-200">
          {/* 전체선택 체크박스 */}
          <label className="flex items-center gap-2 text-xs font-bold text-neutral-800 cursor-pointer select-none border-r border-neutral-300 pr-4 mr-1">
            <input
              type="checkbox"
              checked={activeCategoryNames.length === categories.length && categories.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setActiveCategoryNames(categories.map(c => c.category));
                } else {
                  setActiveCategoryNames([]);
                }
              }}
              className="w-4 h-4 rounded border-neutral-300 text-[#21358D] focus:ring-[#21358D] transition-colors cursor-pointer"
            />
            <span>전체선택</span>
          </label>

          {categories.map((cat, index) => {
            const isChecked = activeCategoryNames.includes(cat.category);
            return (
              <label key={cat.category} className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    setActiveCategoryNames(prev => 
                      prev.includes(cat.category)
                        ? prev.filter(name => name !== cat.category)
                        : [...prev, cat.category]
                    );
                  }}
                  className="w-4 h-4 rounded border-neutral-300 text-[#21358D] focus:ring-[#21358D] transition-colors cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 inline-block rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {cat.category}
                </span>
              </label>
            );
          })}
        </div>

        <div ref={trendRef} className="h-[350px] w-full min-w-0 relative">
          <LineChart width={trendWidth} height={350} data={mergedTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
            <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} formatter={(v: number) => `₩${(v / 10000).toLocaleString()}만`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
              formatter={(value: number, name: string) => [`₩${value.toLocaleString()}`, name]}
            />
            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
            {categories.map((cat, index) => {
              if (!activeCategoryNames.includes(cat.category)) return null;
              return (
                <Line
                  key={cat.category}
                  type="monotone"
                  dataKey={cat.category}
                  name={cat.category}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              );
            })}
          </LineChart>
        </div>
      </div>
    </div>
  );
}
