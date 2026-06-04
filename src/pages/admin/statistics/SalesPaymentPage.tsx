import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Wallet, TrendingUp } from 'lucide-react';
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

const MOCK_PAYMENT_STATS = {
  paymentStats: [
    { method: '신용카드(저장)', amount: 48500000, count: 98, percentage: 38.5 },
    { method: '일반결제(신용카드)', amount: 32000000, count: 65, percentage: 25.4 },
    { method: '무통장입금', amount: 24500000, count: 35, percentage: 19.4 },
    { method: '가상계좌', amount: 15000000, count: 20, percentage: 11.9 },
    { method: '카드분할결제', amount: 6000000, count: 8, percentage: 4.8 }
  ],
  trendData: [
    { label: '2026-01', '신용카드(저장)': 8000000, '일반결제(신용카드)': 5000000, '무통장입금': 4000000, '가상계좌': 2000000, '카드분할결제': 1000000 },
    { label: '2026-02', '신용카드(저장)': 9500000, '일반결제(신용카드)': 6000000, '무통장입금': 4500000, '가상계좌': 2500000, '카드분할결제': 1200000 },
    { label: '2026-03', '신용카드(저장)': 11000000, '일반결제(신용카드)': 7500000, '무통장입금': 5000000, '가상계좌': 3000000, '카드분할결제': 1500000 },
    { label: '2026-04', '신용카드(저장)': 13000000, '일반결제(신용카드)': 8500000, '무통장입금': 6000000, '가상계좌': 4500000, '카드분할결제': 1800000 }
  ]
};

const COLORS = ['#21358D', '#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#64748b'];

export function SalesPaymentPage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Resize Ref
  const [chartRef, chartWidth] = useChartDimensions();

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const stats = await adminService.getSalesPaymentStats(dateRange);
        if (stats && stats.paymentStats && stats.paymentStats.length > 0) {
          setData(stats);
          setIsDemo(false);
        } else {
          setData(MOCK_PAYMENT_STATS);
          setIsDemo(true);
        }
      } catch (err) {
        console.error(err);
        setData(MOCK_PAYMENT_STATS);
        setIsDemo(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  const { paymentStats, trendData } = data;

  // 전체 트렌드 차트에 사용된 고유한 결제 수단 추출 (차트 Bar 목록 생성용)
  const uniqueMethods = Array.from(
    new Set(
      paymentStats.map((p: any) => p.method)
    )
  ) as string[];

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
        {/* 결제 수단별 금액 비중 리스트 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#21358D]" />
              <span>결제수단별 점유율</span>
            </h3>
            <p className="text-xs text-neutral-500 mb-6">주문 시 선택된 결제수단별 매출 누적액과 비중입니다.</p>
          </div>
          <div className="space-y-5 flex-1 flex flex-col justify-center">
            {paymentStats.map((payment: any, index: number) => {
              const color = COLORS[index % COLORS.length];
              return (
                <div key={payment.method} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span>{payment.method}</span>
                      <span className="text-neutral-400 font-normal">({payment.count}건)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-neutral-900">₩{payment.amount.toLocaleString()}</span>
                      <span className="text-[#21358D] ml-1.5">{payment.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${payment.percentage}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-neutral-200 flex justify-between items-center text-sm font-semibold text-neutral-800">
            <span>총 결제금액</span>
            <span className="text-base text-neutral-950 font-bold">
              ₩{paymentStats.reduce((sum: number, p: any) => sum + p.amount, 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* 월별 결제수단 비중 변화 트렌드 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm lg:col-span-2 min-w-0">
          <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#21358D]" />
            <span>결제 수단별 트렌드 추이</span>
          </h3>
          <p className="text-xs text-neutral-500 mb-6">시간 흐름에 따른 각 결제 수단의 누적 매출 추세입니다.</p>
          <div ref={chartRef} className="h-[320px] w-full min-w-0 relative">
            {trendData.length > 0 ? (
              <BarChart width={chartWidth} height={320} data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
                <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} formatter={(v: number) => `₩${(v / 10000).toLocaleString()}만`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px' }}
                  formatter={(value: number) => [`₩${value.toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
                {uniqueMethods.map((method, index) => (
                  <Bar
                    key={method}
                    dataKey={method}
                    name={method}
                    stackId="a"
                    fill={COLORS[index % COLORS.length]}
                    radius={index === uniqueMethods.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-400 text-sm">
                비교 분석할 트렌드 데이터가 충분하지 않습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
