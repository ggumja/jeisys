import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Building2, TrendingUp } from 'lucide-react';
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

export function SalesOfficePage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [offices, setOffices] = useState<any[]>([]);

  // Resize Ref
  const [chartRef, chartWidth] = useChartDimensions();

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const stats = await adminService.getSalesOfficeStats(dateRange);
        setOffices(stats);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  if (offices.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 p-16 text-center shadow-sm">
        <p className="text-neutral-500 font-medium">선택한 기간 동안의 영업지점별 연동 데이터가 없습니다.</p>
      </div>
    );
  }

  // 파이 차트용 데이터 포맷
  const chartData = offices.map((o) => ({
    name: o.officeName,
    value: o.sales,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 기여도 도넛 차트 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#21358D]" />
              <span>영업처별 매출 비중</span>
            </h3>
            <p className="text-xs text-neutral-500 mb-6">각 지점/영업처가 전체 매출에서 기여하는 비중입니다.</p>
          </div>
          <div ref={chartRef} className="h-[250px] w-full min-w-0 relative">
            <PieChart width={chartWidth} height={250}>
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
            {offices.map((o, index) => (
              <div key={o.officeCode} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="truncate">{o.officeName} ({o.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* 영업처 상세 목록 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-neutral-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#21358D]" />
            <span>지점별 매출 상세</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4 font-semibold text-neutral-700 w-16 text-center">순위</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700">지점명</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700">지점코드</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700">담당지역</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700 text-right">총 주문건수</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700 text-right">총 매출액</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700 text-right">점유율</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {offices.map((item, index) => {
                  return (
                    <tr key={item.officeCode} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-5.5 h-5.5 text-xs font-bold rounded-full ${
                          index < 3
                            ? 'bg-[#21358D]/10 text-[#21358D] border border-[#21358D]/20'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-neutral-900">{item.officeName}</td>
                      <td className="py-3.5 px-4 font-mono text-neutral-500">{item.officeCode}</td>
                      <td className="py-3.5 px-4 text-neutral-600 font-medium">{item.region}</td>
                      <td className="py-3.5 px-4 text-right text-neutral-600 font-medium">{item.orders}건</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-neutral-900">₩{item.sales.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right text-[#21358D] font-bold">{item.percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
