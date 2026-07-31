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

  const { typeSummary, equipmentBreakdown = [], trendData, leadTimeAnalysis } = stats;

  const displayedRows = equipmentFilter === 'all'
    ? equipmentBreakdown
    : equipmentBreakdown.filter((r: any) => r.equipmentType.toUpperCase() === equipmentFilter.toUpperCase());

  return (
    <div className="space-y-6">
      {/* 거래 유형별 집계 표 (장비별 행 + 전체 선택 시 합계 행) */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse border border-neutral-200">
            <thead className="bg-neutral-100 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-5 font-semibold text-neutral-800 border-r border-neutral-200 w-44">장비 구분</th>
                <th className="py-3 px-5 font-semibold text-neutral-800 border-r border-neutral-200 text-right">크레딧 충전(발행)</th>
                <th className="py-3 px-5 font-semibold text-neutral-800 border-r border-neutral-200 text-right">크레딧 차감(사용)</th>
                <th className="py-3 px-5 font-semibold text-neutral-800 border-r border-neutral-200 text-right">취소 환불(refund)</th>
                <th className="py-3 px-5 font-semibold text-neutral-800 border-r border-neutral-200 text-right">기간 만료(expire)</th>
                <th className="py-3 px-5 font-semibold text-neutral-800 text-right">관리자 회수(revoke)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-400 text-xs">
                    거래 통계 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                displayedRows.map((row: any) => (
                  <tr key={row.equipmentType} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-neutral-900 border-r border-neutral-200 bg-neutral-50/30">
                      {row.equipmentType}
                    </td>
                    <td className="py-3.5 px-5 text-right font-medium text-neutral-900 border-r border-neutral-200">
                      ₩{row.issue.amount.toLocaleString()}
                      <span className="block text-[11px] font-normal text-neutral-400">({row.issue.count}건)</span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-medium text-green-600 border-r border-neutral-200">
                      ₩{row.use.amount.toLocaleString()}
                      <span className="block text-[11px] font-normal text-neutral-400">({row.use.count}건)</span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-medium text-blue-500 border-r border-neutral-200">
                      ₩{row.refund.amount.toLocaleString()}
                      <span className="block text-[11px] font-normal text-neutral-400">({row.refund.count}건)</span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-medium text-red-500 border-r border-neutral-200">
                      ₩{row.expire.amount.toLocaleString()}
                      <span className="block text-[11px] font-normal text-neutral-400">({row.expire.count}건)</span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-medium text-neutral-600">
                      ₩{row.revoke.amount.toLocaleString()}
                      <span className="block text-[11px] font-normal text-neutral-400">({row.revoke.count}건)</span>
                    </td>
                  </tr>
                ))
              )}
              {/* '전체' 선택 시 합계 행 표시 */}
              {equipmentFilter === 'all' && (
                <tr className="bg-blue-50/40 border-t-2 border-[#21358D]/30 font-bold">
                  <td className="py-3.5 px-5 text-neutral-900 border-r border-neutral-200">
                    전체 합계
                  </td>
                  <td className="py-3.5 px-5 text-right text-neutral-900 border-r border-neutral-200">
                    ₩{typeSummary.issue.amount.toLocaleString()}
                    <span className="block text-[11px] font-normal text-neutral-500">({typeSummary.issue.count}건)</span>
                  </td>
                  <td className="py-3.5 px-5 text-right text-green-700 border-r border-neutral-200">
                    ₩{typeSummary.use.amount.toLocaleString()}
                    <span className="block text-[11px] font-normal text-neutral-500">({typeSummary.use.count}건)</span>
                  </td>
                  <td className="py-3.5 px-5 text-right text-blue-600 border-r border-neutral-200">
                    ₩{typeSummary.refund.amount.toLocaleString()}
                    <span className="block text-[11px] font-normal text-neutral-500">({typeSummary.refund.count}건)</span>
                  </td>
                  <td className="py-3.5 px-5 text-right text-red-600 border-r border-neutral-200">
                    ₩{typeSummary.expire.amount.toLocaleString()}
                    <span className="block text-[11px] font-normal text-neutral-500">({typeSummary.expire.count}건)</span>
                  </td>
                  <td className="py-3.5 px-5 text-right text-neutral-800">
                    ₩{typeSummary.revoke.amount.toLocaleString()}
                    <span className="block text-[11px] font-normal text-neutral-500">({typeSummary.revoke.count}건)</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

            {/* 소진율 */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded">
              <span className="text-xs font-semibold text-neutral-500 block mb-1">기간 내 크레딧 소진율</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-orange-500">
                  {typeSummary.issue.amount > 0
                    ? `${Math.round((typeSummary.use.amount / typeSummary.issue.amount) * 100)}%`
                    : '-'}
                </span>
                <span className="text-xs text-neutral-400 font-medium">발행 대비 실 사용 비율</span>
              </div>
              <div className="mt-2 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400 rounded-full transition-all"
                  style={{ width: `${typeSummary.issue.amount > 0 ? Math.min(100, Math.round((typeSummary.use.amount / typeSummary.issue.amount) * 100)) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
