import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { TrendingUp } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { PointAnalyticsContext } from './PointAnalyticsLayout';
import * as XLSX from 'xlsx';

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
        if (width > 0) setWidth(width);
      });
      observer.observe(node);
      observerRef.current = observer;
      const initialWidth = node.getBoundingClientRect().width;
      if (initialWidth > 0) setWidth(initialWidth);
    }
  }, []);

  return [ref, width] as const;
}

export function PointTransactionPage() {
  const { granularity, onRegisterExport, label } = useOutletContext<PointAnalyticsContext>();
  const [chartRef, chartWidth] = useChartDimensions(500);

  const typeSummary = {
    issue: { amount: 12500000, count: 142 },
    use: { amount: 8400000, count: 98 },
    refund: { amount: 650000, count: 8 },
    expire: { amount: 300000, count: 5 },
    revoke: { amount: 150000, count: 2 }
  };

  const trendData = [
    { day: '07/01', 지급액: 450000, 사용액: 320000 },
    { day: '07/05', 지급액: 620000, 사용액: 410000 },
    { day: '07/10', 지급액: 890000, 사용액: 650000 },
    { day: '07/15', 지급액: 530000, 사용액: 390000 },
    { day: '07/20', 지급액: 950000, 사용액: 720000 },
    { day: '07/25', 지급액: 1100000, 사용액: 880000 },
    { day: '07/29', 지급액: 780000, 사용액: 540000 }
  ];

  const exportFn = useCallback(async () => {
    const ws = XLSX.utils.json_to_sheet([
      { 구분: '지급(issue)', 금액_P: typeSummary.issue.amount, 건수: typeSummary.issue.count },
      { 구분: '사용(use)', 금액_P: typeSummary.use.amount, 건수: typeSummary.use.count },
      { 구분: '취소환불(refund)', 금액_P: typeSummary.refund.amount, 건수: typeSummary.refund.count },
      { 구분: '기간만료(expire)', 금액_P: typeSummary.expire.amount, 건수: typeSummary.expire.count },
      { 구분: '관리자회수(revoke)', 금액_P: typeSummary.revoke.amount, 건수: typeSummary.revoke.count }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '포인트 거래통계');
    XLSX.writeFile(wb, `포인트거래통계_${label}.xlsx`);
  }, [typeSummary, label]);

  useEffect(() => {
    onRegisterExport(exportFn);
    return () => onRegisterExport(null);
  }, [exportFn, onRegisterExport]);

  return (
    <div className="space-y-6">
      {/* 거래 유형별 집계 그리드 */}
      <div className="flex flex-row flex-nowrap overflow-x-auto pb-1 gap-3 scrollbar-thin">
        {/* 지급 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm flex-1 min-w-[180px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#21358D]" />
            <span className="text-xs text-neutral-500 font-semibold">포인트 지급(발행)</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">{typeSummary.issue.amount.toLocaleString()} P</p>
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">거래 건수: {typeSummary.issue.count}건</span>
        </div>

        {/* 사용 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm flex-1 min-w-[180px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-neutral-500 font-semibold">포인트 차감(사용)</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">{typeSummary.use.amount.toLocaleString()} P</p>
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">거래 건수: {typeSummary.use.count}건</span>
        </div>

        {/* 환불 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm flex-1 min-w-[180px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-xs text-neutral-500 font-semibold">취소 환불(refund)</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">{typeSummary.refund.amount.toLocaleString()} P</p>
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">거래 건수: {typeSummary.refund.count}건</span>
        </div>

        {/* 만료 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm flex-1 min-w-[180px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs text-neutral-500 font-semibold">기간 만료(expire)</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">{typeSummary.expire.amount.toLocaleString()} P</p>
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">거래 건수: {typeSummary.expire.count}건</span>
        </div>

        {/* 회수 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm flex-1 min-w-[180px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-400" />
            <span className="text-xs text-neutral-500 font-semibold">관리자 회수(revoke)</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">{typeSummary.revoke.amount.toLocaleString()} P</p>
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">거래 건수: {typeSummary.revoke.count}건</span>
        </div>
      </div>

      {/* 트랜잭션 추이 차트 */}
      <div className="bg-white border border-neutral-200 p-6 shadow-sm">
        <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#21358D]" />
          <span>{granularity === 'daily' ? '일별' : granularity === 'weekly' ? '주별' : granularity === 'yearly' ? '년별' : '월별'} 포인트 거래 추이</span>
        </h3>
        <p className="text-xs text-neutral-500 mb-6">선택한 기간 동안 발생하는 지급액과 사용액 트렌드를 비교 분석합니다.</p>
        <div ref={chartRef} className="h-[300px] w-full min-w-0 relative">
          <ComposedChart width={chartWidth} height={300} data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="day" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
            <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} formatter={(v: any) => `${(v/10000).toLocaleString()}만P`} />
            <Tooltip formatter={(value: any) => [`${value.toLocaleString()} P`, '']} />
            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
            <Bar dataKey="지급액" fill="#21358D" barSize={14} radius={[2, 2, 0, 0]} />
            <Line type="monotone" dataKey="사용액" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </div>
      </div>
    </div>
  );
}
