import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { Calendar, Clock, BarChart3, TrendingUp } from 'lucide-react';
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

const MOCK_TREND_STATS = {
  dayStats: [
    { label: '일', sales: 4500000, orders: 12 },
    { label: '월', sales: 18500000, orders: 48 },
    { label: '화', sales: 22000000, orders: 55 },
    { label: '수', sales: 19500000, orders: 50 },
    { label: '목', sales: 24000000, orders: 62 },
    { label: '금', sales: 28000000, orders: 70 },
    { label: '토', sales: 8500000, orders: 20 }
  ],
  hourStats: [
    { label: '00시', sales: 500000, orders: 2 },
    { label: '02시', sales: 200000, orders: 1 },
    { label: '04시', sales: 0, orders: 0 },
    { label: '06시', sales: 300000, orders: 1 },
    { label: '08시', sales: 2500000, orders: 8 },
    { label: '10시', sales: 18000000, orders: 45 },
    { label: '12시', sales: 9500000, orders: 24 },
    { label: '14시', sales: 21000000, orders: 55 },
    { label: '16시', sales: 16000000, orders: 40 },
    { label: '18시', sales: 7500000, orders: 18 },
    { label: '20시', sales: 4000000, orders: 10 },
    { label: '22시', sales: 1500000, orders: 4 }
  ]
};

export function SalesTrendPage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [trendStats, setTrendStats] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Resize Refs
  const [dayRef, dayWidth] = useChartDimensions();
  const [hourRef, hourWidth] = useChartDimensions();

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const stats = await adminService.getSalesTrendStats(dateRange);
        if (stats && stats.dayStats && stats.dayStats.length > 0) {
          setTrendStats(stats);
          setIsDemo(false);
        } else {
          setTrendStats(MOCK_TREND_STATS);
          setIsDemo(true);
        }
      } catch (err) {
        console.error(err);
        setTrendStats(MOCK_TREND_STATS);
        setIsDemo(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange]);

  if (isLoading || !trendStats) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  const { dayStats, hourStats } = trendStats;

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 요일별 매출 및 주문수 분석 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm min-w-0">
          <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#21358D]" />
            <span>요일별 주문 및 매출 분석</span>
          </h3>
          <p className="text-xs text-neutral-500 mb-6">주간 요일별 주문 활동량 및 총 매출 분포입니다.</p>
          <div ref={dayRef} className="h-[320px] w-full min-w-0 relative">
            <BarChart width={dayWidth} height={320} data={dayStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
              <YAxis yAxisId="left" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} formatter={(v: number) => `₩${(v / 10000).toLocaleString()}만`} />
              <YAxis yAxisId="right" orientation="right" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
              <Bar yAxisId="left" dataKey="sales" name="매출액" fill="#21358D" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="orders" name="주문건수" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </div>
        </div>

        {/* 시간대별 주문 분포 분석 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm min-w-0">
          <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>24시간대별 주문 추이</span>
          </h3>
          <p className="text-xs text-neutral-500 mb-6">하루 중 몇 시에 주문이 활발히 들어오는지 시각화합니다.</p>
          <div ref={hourRef} className="h-[320px] w-full min-w-0 relative">
            <AreaChart width={hourWidth} height={320} data={hourStats}>
              <defs>
                <linearGradient id="colorHourOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
              <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px' }}
                formatter={(value: number) => [value, '주문건수']}
              />
              <Area type="monotone" dataKey="orders" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHourOrders)" />
            </AreaChart>
          </div>
        </div>
      </div>
    </div>
  );
}
