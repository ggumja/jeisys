import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
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

export function CreditTransactionPage() {
  const { dateRange, granularity, equipmentFilter } = useOutletContext<{ dateRange: string; granularity: string; equipmentFilter: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Resize Ref
  const [chartRef, chartWidth] = useChartDimensions(500);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const data = await adminService.getCreditTransactionStats(dateRange, equipmentFilter, granularity);
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange, equipmentFilter, granularity]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  const { typeSummary, trendData, leadTimeAnalysis } = stats;

  return (
    <div className="space-y-6">
      {/* 거래 유형별 집계 그리드 */}
      <div className="flex flex-row flex-nowrap overflow-x-auto pb-1 gap-3 scrollbar-thin">
        {/* 발급 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm flex-1 min-w-[180px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#21358D]" />
            <span className="text-xs text-neutral-500 font-semibold">크레딧 충전(발행)</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">₩{typeSummary.issue.amount.toLocaleString()}</p>
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">거래 건수: {typeSummary.issue.count}건</span>
        </div>

        {/* 사용 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm flex-1 min-w-[180px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-neutral-500 font-semibold">크레딧 차감(사용)</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">₩{typeSummary.use.amount.toLocaleString()}</p>
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">거래 건수: {typeSummary.use.count}건</span>
        </div>

        {/* 환불 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm flex-1 min-w-[180px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-xs text-neutral-500 font-semibold">취소 환불(refund)</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">₩{typeSummary.refund.amount.toLocaleString()}</p>
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">거래 건수: {typeSummary.refund.count}건</span>
        </div>

        {/* 만료 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm flex-1 min-w-[180px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs text-neutral-500 font-semibold">기간 만료(expire)</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">₩{typeSummary.expire.amount.toLocaleString()}</p>
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">거래 건수: {typeSummary.expire.count}건</span>
        </div>

        {/* 회수 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm flex-1 min-w-[180px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-400" />
            <span className="text-xs text-neutral-500 font-semibold">관리자 회수(revoke)</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">₩{typeSummary.revoke.amount.toLocaleString()}</p>
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">거래 건수: {typeSummary.revoke.count}건</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 일별 트랜잭션 추이 차트 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#21358D]" />
            <span>{granularity === 'daily' ? '일별' : granularity === 'weekly' ? '주별' : granularity === 'yearly' ? '년별' : '월별'} 거래 추이</span>
          </h3>
          <p className="text-xs text-neutral-500 mb-6">선택한 기간 동안 발생하는 발행액과 사용액 트렌드를 비교 분석합니다.</p>
          <div ref={chartRef} className="h-[300px] w-full min-w-0 relative">
            <ComposedChart width={chartWidth} height={300} data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="day" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
              <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} formatter={(v: any) => `₩${(v/10000).toLocaleString()}만`} />
              <Tooltip formatter={(value: any) => [`₩${value.toLocaleString()}`, '']} />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
              <Bar dataKey="발행액" fill="#21358D" barSize={14} radius={[2, 2, 0, 0]} />
              <Line type="monotone" dataKey="사용액" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </div>
        </div>

        {/* 크레딧 순환 효율 분석 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm">
          <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#21358D]" />
            <span>크레딧 소진 주기 분석</span>
          </h3>
          <p className="text-xs text-neutral-500 mb-6">충전된 크레딧이 시장에서 차감되고 완전 소진되는 평균 순환 속도입니다.</p>

          <div className="space-y-6 mt-8 font-sans">
            {/* 첫 사용 리드타임 */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded">
              <span className="text-xs font-semibold text-neutral-500 block mb-1">발급 후 첫 사용 평균 소요일</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#21358D]">{leadTimeAnalysis.avgUseDays}일</span>
                <span className="text-xs text-neutral-400 font-medium">충전 후 평균 12일 내 최초 사용 발생</span>
              </div>
            </div>

            {/* 완판 리드타임 */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded">
              <span className="text-xs font-semibold text-neutral-500 block mb-1">발급 후 전액 소진 평균 소요일</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-green-600">{leadTimeAnalysis.avgExhaustDays}일</span>
                <span className="text-xs text-neutral-400 font-medium">충전 분량이 100% 소진되는 평균 시간</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
