import { useEffect, useCallback, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';
import { Clock, Sun, Moon, Calendar, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
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

// 00시부터 23시까지 샘플 데이터 생성
function generateHourlyData() {
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hourLabel = `${String(i).padStart(2, '0')}시`;
    // 일반적인 이커머스/B2B 쇼핑몰 방문 패턴 (오전 10~11시, 오후 2~4시 피크)
    let baseVisits = 30;
    if (i >= 9 && i <= 11) baseVisits = 180 + (i === 10 ? 80 : 0);
    else if (i >= 13 && i <= 17) baseVisits = 150 + (i === 14 ? 60 : 0);
    else if (i >= 18 && i <= 22) baseVisits = 70;
    else if (i >= 1 && i <= 6) baseVisits = 10;

    const visits = Math.floor(baseVisits + Math.random() * 40);
    const pv = Math.floor(visits * (2.2 + Math.random() * 0.8));
    return { hour: hourLabel, hourNum: i, visits, pv };
  });

  return hours;
}

export function VisitHourlyPage() {
  const { onRegisterExport, label } = useOutletContext<VisitAnalyticsContext>();
  const [ref, width] = useChartDimensions();

  const data = generateHourlyData();
  const totalVisits = data.reduce((sum, d) => sum + d.visits, 0);
  const totalPv = data.reduce((sum, d) => sum + d.pv, 0);
  
  // 가장 방문이 많은 최빈 시간대
  const peakHourObj = [...data].sort((a, b) => b.visits - a.visits)[0];
  // 주간(09시~18시) vs 야간(18시~09시) 비율
  const daytimeVisits = data.filter(d => d.hourNum >= 9 && d.hourNum < 18).reduce((sum, d) => sum + d.visits, 0);
  const daytimePercent = Math.round((daytimeVisits / (totalVisits || 1)) * 100);

  const exportFn = useCallback(async () => {
    const ws = XLSX.utils.json_to_sheet(
      data.map((d) => ({
        시간대: d.hour,
        방문자수_UV: d.visits,
        페이지뷰_PV: d.pv,
        점유율: `${((d.visits / (totalVisits || 1)) * 100).toFixed(1)}%`
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '방문시간대분석');
    XLSX.writeFile(wb, `방문시간대분석_${label}.xlsx`);
  }, [data, totalVisits, label]);

  useEffect(() => {
    onRegisterExport(exportFn);
    return () => onRegisterExport(null);
  }, [exportFn, onRegisterExport]);

  const kpis = [
    { label: '총 방문자수 (24h)', value: `${totalVisits.toLocaleString()}명`, icon: Clock, color: 'text-[#21358D]', bg: 'bg-blue-50' },
    { label: '최대 피크 시간대', value: `${peakHourObj.hour} (${peakHourObj.visits}명)`, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '업무시간대 방문율 (09-18시)', value: `${daytimePercent}%`, icon: Sun, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '총 페이지뷰 (PV)', value: `${totalPv.toLocaleString()}회`, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
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

      {/* 시간대별 방문 그래프 */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-800">24시간 시간대별 방문 분포</h2>
          <span className="text-xs text-neutral-400">* 피크 시간대는 진한 색상으로 강조 표시됩니다.</span>
        </div>
        <div ref={ref}>
          <BarChart width={width} height={320} data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="명" />
            <Tooltip
              formatter={(v: number, name: string) => [
                `${v.toLocaleString()}${name === 'visits' ? '명' : '회'}`,
                name === 'visits' ? '방문자수(UV)' : '페이지뷰(PV)'
              ]}
            />
            <Bar dataKey="visits" name="방문자수(UV)" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.hour === peakHourObj.hour ? '#21358D' : '#6366f1'}
                  fillOpacity={entry.hour === peakHourObj.hour ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </div>
      </div>

      {/* 시간대별 데이터 테이블 */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-800">시간대별 세부 상세 통계</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
              <tr>
                <th className="px-4 py-3">시간대</th>
                <th className="px-4 py-3 text-right">방문자수 (UV)</th>
                <th className="px-4 py-3 text-right">페이지뷰 (PV)</th>
                <th className="px-4 py-3 text-right">점유율 (%)</th>
                <th className="px-4 py-3 text-center">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.map((row) => {
                const ratio = ((row.visits / (totalVisits || 1)) * 100).toFixed(1);
                const isPeak = row.hour === peakHourObj.hour;
                return (
                  <tr key={row.hour} className={`hover:bg-neutral-50 ${isPeak ? 'bg-blue-50/50 font-semibold' : ''}`}>
                    <td className="px-4 py-2.5 text-neutral-900">{row.hour}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-neutral-900">{row.visits.toLocaleString()}명</td>
                    <td className="px-4 py-2.5 text-right text-neutral-600">{row.pv.toLocaleString()}회</td>
                    <td className="px-4 py-2.5 text-right text-neutral-600">{ratio}%</td>
                    <td className="px-4 py-2.5 text-center">
                      {isPeak && <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-[#21358D] text-white rounded">최대 피크</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
