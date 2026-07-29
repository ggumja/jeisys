import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { Coins, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
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

export function PointOverviewPage() {
  const { dateRange, granularity, onRegisterExport, label } = useOutletContext<PointAnalyticsContext>();
  const [trendRef, trendWidth] = useChartDimensions(500);

  // 포인트 개요 시뮬레이션/샘플 데이터
  const summary = {
    totalIssued: 12500000,
    totalUsed: 8400000,
    totalRemaining: 3800000,
    totalExpired: 300000
  };

  const trendData = [
    { label: '07/01', 지급액: 450000, 사용액: 320000 },
    { label: '07/05', 지급액: 620000, 사용액: 410000 },
    { label: '07/10', 지급액: 890000, 사용액: 650000 },
    { label: '07/15', 지급액: 530000, 사용액: 390000 },
    { label: '07/20', 지급액: 950000, 사용액: 720000 },
    { label: '07/25', 지급액: 1100000, 사용액: 880000 },
    { label: '07/29', 지급액: 780000, 사용액: 540000 }
  ];

  const exportFn = useCallback(async () => {
    const ws = XLSX.utils.json_to_sheet([
      { 항목: '누적 총 지급액 (P)', 금액: summary.totalIssued },
      { 항목: '누적 총 사용액 (P)', 금액: summary.totalUsed },
      { 항목: '현재 총 잔액 (P)', 금액: summary.totalRemaining },
      { 항목: '누적 총 만료액 (P)', 금액: summary.totalExpired }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '포인트 개요');
    XLSX.writeFile(wb, `포인트개요통계_${label}.xlsx`);
  }, [summary, label]);

  useEffect(() => {
    onRegisterExport(exportFn);
    return () => onRegisterExport(null);
  }, [exportFn, onRegisterExport]);

  return (
    <div className="space-y-6">
      {/* 요약 지표 카드 */}
      <div className="flex flex-row flex-nowrap overflow-x-auto pb-1 gap-3 scrollbar-thin">
        {/* 누적 지급액 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-blue-50 text-[#21358D] rounded">
              <Coins className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-600 font-semibold">누적 총 지급액</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">{summary.totalIssued.toLocaleString()} P</p>
          <p className="text-xs text-neutral-400 mt-1 font-medium whitespace-nowrap">선택 기간 내 신규 지급</p>
        </div>

        {/* 누적 사용액 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-green-50 text-green-600 rounded">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-600 font-semibold">누적 총 사용액</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">{summary.totalUsed.toLocaleString()} P</p>
          <p className="text-xs text-neutral-400 mt-1 font-medium whitespace-nowrap">선택 기간 내 실제 차감</p>
        </div>

        {/* 현재 총 잔액 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-600 font-semibold">현재 총 잔액</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">{summary.totalRemaining.toLocaleString()} P</p>
          <p className="text-xs text-neutral-400 mt-1 font-medium whitespace-nowrap">모든 회원 미소진 활성액</p>
        </div>

        {/* 누적 만료액 */}
        <div className="bg-white border border-neutral-200 p-5 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-red-50 text-red-600 rounded">
              <AlertCircle className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-600 font-semibold">누적 총 만료액</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 leading-tight">{summary.totalExpired.toLocaleString()} P</p>
          <p className="text-xs text-neutral-400 mt-1 font-medium whitespace-nowrap">유효기간 종료 미사용 소멸</p>
        </div>
      </div>

      {/* 지급 vs 사용 추이 차트 */}
      <div className="bg-white border border-neutral-200 p-6 shadow-sm min-w-0">
        <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#21358D]" />
          <span>{granularity === 'daily' ? '일별' : granularity === 'weekly' ? '주별' : granularity === 'yearly' ? '년별' : '월별'} 포인트 지급 vs 사용 추이</span>
        </h3>
        <p className="text-xs text-neutral-500 mb-6">선택한 기간 동안의 신규 포인트 지급액과 실제 사용액 추이를 분석합니다.</p>
        <div ref={trendRef} className="h-[300px] w-full min-w-0 relative">
          <ComposedChart width={trendWidth} height={300} data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="label" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
            <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} formatter={(v: any) => `${(v/10000).toLocaleString()}만P`} />
            <Tooltip formatter={(value: any) => [`${value.toLocaleString()} P`, '']} />
            <Bar dataKey="지급액" fill="#21358D" barSize={20} radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="사용액" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
          </ComposedChart>
        </div>
      </div>
    </div>
  );
}
