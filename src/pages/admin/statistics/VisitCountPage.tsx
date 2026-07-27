import { useEffect, useCallback, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';
import { Users, UserCheck, RotateCcw, UserPlus } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
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

// 목업 데이터 생성
function generateData(dateRange: string, granularity: string) {
  const [, range] = dateRange.split('custom:');
  const [startStr, endStr] = (range ?? '').split('_');
  const start = startStr ? new Date(startStr) : new Date();
  const end = endStr ? new Date(endStr) : new Date();

  const data: { label: string; visits: number; uv: number; newUsers: number }[] = [];
  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));

  const count = granularity === 'monthly' ? Math.min(12, Math.ceil(diffDays / 30))
    : granularity === 'weekly' ? Math.min(12, Math.ceil(diffDays / 7))
    : Math.min(30, diffDays + 1);

  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    if (granularity === 'monthly') d.setMonth(d.getMonth() + i);
    else if (granularity === 'weekly') d.setDate(d.getDate() + i * 7);
    else d.setDate(d.getDate() + i);

    const visits = Math.floor(120 + Math.random() * 300 + Math.sin(i * 0.5) * 80);
    const uv = Math.floor(visits * (0.55 + Math.random() * 0.2));
    const newUsers = Math.floor(uv * (0.3 + Math.random() * 0.3));

    const lbl = granularity === 'monthly'
      ? `${d.getMonth() + 1}월`
      : granularity === 'weekly'
      ? `${d.getMonth() + 1}/${d.getDate()}`
      : `${d.getMonth() + 1}/${d.getDate()}`;

    data.push({ label: lbl, visits, uv, newUsers });
  }
  return data;
}

export function VisitCountPage() {
  const { dateRange, granularity, onRegisterExport, label } =
    useOutletContext<VisitAnalyticsContext>();
  const [ref, width] = useChartDimensions();

  const data = generateData(dateRange, granularity);
  const totalVisits = data.reduce((s, d) => s + d.visits, 0);
  const totalUV = data.reduce((s, d) => s + d.uv, 0);
  const totalNew = data.reduce((s, d) => s + d.newUsers, 0);
  const returnRate = totalUV > 0 ? (((totalUV - totalNew) / totalUV) * 100).toFixed(1) : '0.0';

  const exportFn = useCallback(async () => {
    const ws = XLSX.utils.json_to_sheet(
      data.map((d) => ({
        기간: d.label,
        총방문수: d.visits,
        순방문자UV: d.uv,
        신규방문자: d.newUsers,
        재방문자: d.uv - d.newUsers,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '방문숫자');
    XLSX.writeFile(wb, `방문숫자_${label}.xlsx`);
  }, [data, label]);

  useEffect(() => {
    onRegisterExport(exportFn);
    return () => onRegisterExport(null);
  }, [exportFn, onRegisterExport]);

  const kpis = [
    { label: '총 방문수(PV)', value: totalVisits.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '순 방문자(UV)', value: totalUV.toLocaleString(), icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '재방문율', value: `${returnRate}%`, icon: RotateCcw, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '신규 방문자', value: totalNew.toLocaleString(), icon: UserPlus, color: 'text-amber-600', bg: 'bg-amber-50' },
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
        <h2 className="text-sm font-semibold text-neutral-800 mb-4">기간별 방문 추이</h2>
        <div ref={ref}>
          <ComposedChart width={width} height={320} data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="visits" name="총 방문수(PV)" fill="#6366f1" radius={[3, 3, 0, 0]} />
            <Line type="monotone" dataKey="uv" name="순 방문자(UV)" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="newUsers" name="신규 방문자" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </ComposedChart>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">기간</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">총 방문수(PV)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">순 방문자(UV)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">신규 방문자</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">재방문자</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((row) => (
              <tr key={row.label} className="hover:bg-neutral-50">
                <td className="px-4 py-2.5 text-neutral-700">{row.label}</td>
                <td className="px-4 py-2.5 text-right font-medium text-neutral-900">{row.visits.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right text-neutral-700">{row.uv.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right text-amber-600">{row.newUsers.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right text-emerald-600">{(row.uv - row.newUsers).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-50 border-t border-neutral-200 font-semibold">
            <tr>
              <td className="px-4 py-2.5 text-neutral-700">합계</td>
              <td className="px-4 py-2.5 text-right text-neutral-900">{totalVisits.toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right text-neutral-900">{totalUV.toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right text-amber-600">{totalNew.toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right text-emerald-600">{(totalUV - totalNew).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
