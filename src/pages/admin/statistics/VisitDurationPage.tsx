import { useEffect, useCallback, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';
import { Clock, TrendingUp, LogOut, Layers } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import type { VisitAnalyticsContext } from './VisitAnalyticsLayout';
import * as XLSX from 'xlsx';

function useChartDimensions(defaultWidth = 500) {
  const [width, setWidth] = useState(defaultWidth);
  const observerRef = useRef<ResizeObserver | null>(null);
  const ref = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null; }
    if (node) {
      const observer = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect.width;
        if (w > 0) setWidth(w);
      });
      observer.observe(node);
      observerRef.current = observer;
      const init = node.getBoundingClientRect().width;
      if (init > 0) setWidth(init);
    }
  }, []);
  return [ref, width] as const;
}

function fmtSec(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}분 ${sec}초` : `${sec}초`;
}

function generateData(dateRange: string, granularity: string) {
  const [, range] = dateRange.split('custom:');
  const [startStr, endStr] = (range ?? '').split('_');
  const start = startStr ? new Date(startStr) : new Date();
  const end = endStr ? new Date(endStr) : new Date();
  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));

  const count = granularity === 'monthly' ? Math.min(12, Math.ceil(diffDays / 30))
    : granularity === 'weekly' ? Math.min(12, Math.ceil(diffDays / 7))
    : Math.min(30, diffDays + 1);

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    if (granularity === 'monthly') d.setMonth(d.getMonth() + i);
    else if (granularity === 'weekly') d.setDate(d.getDate() + i * 7);
    else d.setDate(d.getDate() + i);

    const avg = Math.floor(90 + Math.random() * 180 + Math.sin(i * 0.7) * 40);
    const bounce = Math.floor(25 + Math.random() * 30);
    const pageViews = Math.floor(2.5 + Math.random() * 2);

    const lbl = granularity === 'monthly' ? `${d.getMonth() + 1}월`
      : `${d.getMonth() + 1}/${d.getDate()}`;

    return { label: lbl, avgSec: avg, bounceRate: bounce, pagePerSession: pageViews };
  });
}

export function VisitDurationPage() {
  const { dateRange, granularity, onRegisterExport, label } =
    useOutletContext<VisitAnalyticsContext>();
  const [ref, width] = useChartDimensions();

  const data = generateData(dateRange, granularity);
  const avgDuration = Math.floor(data.reduce((s, d) => s + d.avgSec, 0) / (data.length || 1));
  const maxDuration = Math.max(...data.map((d) => d.avgSec));
  const avgBounce = (data.reduce((s, d) => s + d.bounceRate, 0) / (data.length || 1)).toFixed(1);
  const avgPagePerSession = (data.reduce((s, d) => s + d.pagePerSession, 0) / (data.length || 1)).toFixed(1);

  const exportFn = useCallback(async () => {
    const ws = XLSX.utils.json_to_sheet(
      data.map((d) => ({
        기간: d.label,
        평균체류시간_초: d.avgSec,
        평균체류시간: fmtSec(d.avgSec),
        이탈율: `${d.bounceRate}%`,
        세션당페이지뷰: d.pagePerSession,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '체류시간');
    XLSX.writeFile(wb, `쇼핑몰체류시간_${label}.xlsx`);
  }, [data, label]);

  useEffect(() => {
    onRegisterExport(exportFn);
    return () => onRegisterExport(null);
  }, [exportFn, onRegisterExport]);

  const kpis = [
    { label: '평균 체류시간', value: fmtSec(avgDuration), icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '최장 체류시간', value: fmtSec(maxDuration), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '이탈율', value: `${avgBounce}%`, icon: LogOut, color: 'text-red-500', bg: 'bg-red-50' },
    { label: '세션당 페이지뷰', value: `${avgPagePerSession}페이지`, icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white border border-neutral-200 rounded-lg p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-neutral-500">{k.label}</p>
                <p className="text-xl font-bold text-neutral-900">{k.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 차트 */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-neutral-800 mb-4">기간별 평균 체류시간 (초)</h2>
        <div ref={ref}>
          <AreaChart width={width} height={300} data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="초" />
            <Tooltip formatter={(v: number) => [fmtSec(v), '평균 체류시간']} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone" dataKey="avgSec" name="평균 체류시간"
              stroke="#6366f1" strokeWidth={2}
              fill="url(#durationGrad)" dot={false}
            />
          </AreaChart>
        </div>
      </div>

      {/* 이탈율 차트 */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-neutral-800 mb-4">이탈율 추이 (%)</h2>
        <div ref={ref}>
          <AreaChart width={width} height={200} data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="bounceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 80]} />
            <Tooltip formatter={(v: number) => [`${v}%`, '이탈율']} />
            <Area
              type="monotone" dataKey="bounceRate" name="이탈율"
              stroke="#ef4444" strokeWidth={2}
              fill="url(#bounceGrad)" dot={false}
            />
          </AreaChart>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">기간</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">평균 체류시간</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">이탈율</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">세션당 페이지뷰</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((row) => (
              <tr key={row.label} className="hover:bg-neutral-50">
                <td className="px-4 py-2.5 text-neutral-700">{row.label}</td>
                <td className="px-4 py-2.5 text-right font-medium text-neutral-900">{fmtSec(row.avgSec)}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={row.bounceRate > 45 ? 'text-red-500' : 'text-emerald-600'}>
                    {row.bounceRate}%
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-neutral-700">{row.pagePerSession}페이지</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
