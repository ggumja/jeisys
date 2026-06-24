import { useState, useEffect, useRef } from 'react';
import { Download, TrendingUp, ShoppingCart, BarChart3, CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminService } from '../../services/adminService';
import { DayPicker } from 'react-day-picker';

import * as XLSX from 'xlsx';

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ── 날짜 유틸 ────────────────────────────────────────────────
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function getISOWeek(d: Date): number {
  const dt = new Date(d); dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + 3 - ((dt.getDay() + 6) % 7));
  const week1 = new Date(dt.getFullYear(), 0, 4);
  return 1 + Math.round(((dt.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}
function weekStartDate(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const mon = new Date(jan4);
  mon.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  mon.setDate(mon.getDate() + (week - 1) * 7);
  return mon;
}
function getDefaults(mode: ViewMode): { startDate: Date; endDate: Date } {
  const now = new Date();
  if (mode === 'daily') {
    return { startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: now };
  }
  if (mode === 'weekly') {
    const w = getISOWeek(now);
    const s = weekStartDate(now.getFullYear(), w);
    const e = new Date(s); e.setDate(s.getDate() + 6);
    return { startDate: s, endDate: e };
  }
  if (mode === 'monthly') {
    return { startDate: new Date(now.getFullYear(), 0, 1), endDate: new Date(now.getFullYear(), 11, 31) };
  }
  return { startDate: new Date(now.getFullYear(), 0, 1), endDate: new Date(now.getFullYear(), 11, 31) };
}
function formatLabel(mode: ViewMode, s: Date, e: Date): string {
  const ko = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('ko-KR', opts);
  if (mode === 'daily') {
    return `${ko(s, { year: 'numeric', month: 'long', day: 'numeric' })} ~ ${ko(e, { year: 'numeric', month: 'long', day: 'numeric' })}`;
  }
  if (mode === 'weekly') {
    const sw = getISOWeek(s), ew = getISOWeek(e);
    if (s.getFullYear() === e.getFullYear() && sw === ew) return `${s.getFullYear()}년 ${sw}주차`;
    return `${s.getFullYear()}년 ${sw}주차 ~ ${e.getFullYear()}년 ${ew}주차`;
  }
  if (mode === 'monthly') {
    const sm = `${s.getFullYear()}년 ${s.getMonth() + 1}월`, em = `${e.getFullYear()}년 ${e.getMonth() + 1}월`;
    return sm === em ? sm : `${sm} ~ ${em}`;
  }
  return s.getFullYear() === e.getFullYear() ? `${s.getFullYear()}년` : `${s.getFullYear()}년 ~ ${e.getFullYear()}년`;
}

// ── 일별 달력 팝오버 ─────────────────────────────────────────
function DailyPicker({ startDate, endDate, onChange }: { startDate: Date; endDate: Date; onChange: (s: Date, e: Date) => void }) {
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({ from: startDate, to: endDate });
  const [month, setMonth] = useState(startDate);
  useEffect(() => { setRange({ from: startDate, to: endDate }); }, [startDate, endDate]);
  return (
    <div className="p-3">
      <DayPicker
        mode="range"
        selected={range}
        onSelect={(r) => {
          setRange(r ?? {});
          if (r?.from && r?.to) onChange(r.from, r.to);
          else if (r?.from) onChange(r.from, r.from);
        }}
        month={month}
        onMonthChange={setMonth}
        numberOfMonths={2}
        classNames={{
          months: 'flex gap-6',
          month: 'space-y-3',
          month_caption: 'flex justify-center pt-1 relative items-center',
          caption_label: 'text-sm font-semibold text-neutral-800',
          nav: 'space-x-1 flex items-center absolute inset-x-0 top-0 justify-between px-1',
          button_previous: 'inline-flex items-center justify-center size-7 bg-transparent p-0 opacity-60 hover:opacity-100 rounded hover:bg-neutral-100',
          button_next: 'inline-flex items-center justify-center size-7 bg-transparent p-0 opacity-60 hover:opacity-100 rounded hover:bg-neutral-100',
          month_grid: 'w-full border-collapse space-y-1',
          weekdays: 'grid grid-cols-7 w-full',
          weekday: 'text-neutral-500 rounded-md font-normal text-[0.8rem] text-center',
          week: 'grid grid-cols-7 w-full mt-2',
          day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([data-selected=true])]:bg-blue-50 first:[&:has([data-selected=true])]:rounded-l-md last:[&:has([data-selected=true])]:rounded-r-md [&:has([data-range-start=true])]:rounded-l-md [&:has([data-range-end=true])]:rounded-r-md',
          day_button: 'relative size-9 mx-auto p-0 font-normal inline-flex items-center justify-center rounded text-sm transition-colors hover:bg-neutral-100 disabled:opacity-50 data-[selected=true]:bg-[#21358D] data-[selected=true]:text-white data-[today=true]:bg-neutral-100 data-[today=true]:text-neutral-900 data-[outside=true]:text-neutral-400 data-[outside=true]:opacity-50 data-[range-start=true]:rounded-l-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none',
          range_start: 'rounded-l-md',
          range_end: 'rounded-r-md',
          range_middle: 'bg-blue-50 rounded-none',
        }}
        formatters={{
          formatWeekdayName: (d) => ['일','월','화','수','목','금','토'][d.getDay()],
          formatCaption: (d) => `${d.getFullYear()}년 ${d.getMonth() + 1}월`,
        }}
      />
      {range.from && range.to && (
        <p className="text-center text-xs text-neutral-500 mt-2 border-t border-neutral-100 pt-2">
          {toDateStr(range.from)} ~ {toDateStr(range.to)}
        </p>
      )}
    </div>
  );
}

// ── 주별 선택기 (월 달력 기반 주 행 선택) ─────────────────────
function WeeklyPicker({ startDate, endDate, onChange }: { startDate: Date; endDate: Date; onChange: (s: Date, e: Date) => void }) {
  const [viewYear, setViewYear] = useState(startDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(startDate.getMonth());
  const [startW, setStartW] = useState<{ y: number; w: number } | null>({ y: startDate.getFullYear(), w: getISOWeek(startDate) });
  const [endW, setEndW] = useState<{ y: number; w: number } | null>({ y: endDate.getFullYear(), w: getISOWeek(endDate) });
  const [picking, setPicking] = useState<'start' | 'end'>('start');

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // 해당 월의 주 행 목록 생성 (월요일 기준)
  const getWeekRows = () => {
    const rows: { monday: Date; sunday: Date; isoWeek: number; isoYear: number }[] = [];
    // 해당 월 1일
    const firstDay = new Date(viewYear, viewMonth, 1);
    // 해당 월의 첫 번째 월요일 or 이전 달의 월요일 찾기
    const dayOfWeek = firstDay.getDay(); // 0=Sun
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    let cur = new Date(firstDay);
    cur.setDate(firstDay.getDate() + diffToMon);

    const lastDay = new Date(viewYear, viewMonth + 1, 0); // 말일
    while (cur <= lastDay) {
      const monday = new Date(cur);
      const sunday = new Date(cur); sunday.setDate(cur.getDate() + 6);
      const isoWeek = getISOWeek(monday);
      const isoYear = monday.getFullYear();
      rows.push({ monday, sunday, isoWeek, isoYear });
      cur.setDate(cur.getDate() + 7);
    }
    return rows;
  };

  const weekRows = getWeekRows();

  const formatDay = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

  const handleClick = (isoYear: number, isoWeek: number, monday: Date, sunday: Date) => {
    if (picking === 'start') {
      setStartW({ y: isoYear, w: isoWeek }); setEndW(null); setPicking('end');
    } else {
      let fs = startW!, fe = { y: isoYear, w: isoWeek };
      let fsDate = weekStartDate(fs.y, fs.w);
      let feDate = monday;
      if (fe.y < fs.y || (fe.y === fs.y && fe.w < fs.w)) {
        [fs, fe] = [fe, fs]; [fsDate, feDate] = [feDate, fsDate];
      }
      setStartW(fs); setEndW(fe); setPicking('start');
      const eStart = weekStartDate(fe.y, fe.w); const e = new Date(eStart); e.setDate(eStart.getDate() + 6);
      onChange(fsDate, e);
    }
  };

  const isSelected = (isoYear: number, isoWeek: number) => {
    const isS = startW?.y === isoYear && startW?.w === isoWeek;
    const isE = endW?.y === isoYear && endW?.w === isoWeek;
    return { isS, isE };
  };
  const inRange = (isoYear: number, isoWeek: number) => {
    if (!startW || !endW) return false;
    const k = isoYear * 100 + isoWeek, sk = startW.y * 100 + startW.w, ek = endW.y * 100 + endW.w;
    return k > sk && k < ek;
  };

  return (
    <div className="p-4 w-96">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 hover:bg-neutral-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold whitespace-nowrap">{viewYear}년 {viewMonth + 1}월</span>
        <button onClick={nextMonth} className="p-1 hover:bg-neutral-100 rounded"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <p className="text-[11px] text-neutral-400 text-center mb-2">
        {picking === 'start' ? '시작 주 선택 (주 행 클릭)' : '종료 주 선택'}
      </p>
      {/* 요일 헤더 */}
      <div className="flex items-center gap-2 mb-1 px-2">
        <span className="text-[10px] text-neutral-400 w-10 shrink-0">주차</span>
        <span className="text-[10px] text-neutral-400 flex-1 text-center">날짜 범위</span>
      </div>
      {/* 주 행 목록 */}
      <div className="space-y-0.5">
        {weekRows.map(({ monday, sunday, isoWeek, isoYear }) => {
          const { isS, isE } = isSelected(isoYear, isoWeek);
          const inR = inRange(isoYear, isoWeek);
          const isHighlight = isS || isE;
          return (
            <button
              key={`${isoYear}-W${isoWeek}`}
              onClick={() => handleClick(isoYear, isoWeek, monday, sunday)}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded text-xs transition-all text-left ${
                isHighlight ? 'text-white' : inR ? 'bg-blue-50 text-[#21358D]' : 'hover:bg-neutral-100 text-neutral-700'
              }`}
              style={isHighlight ? { backgroundColor: '#21358D' } : undefined}
            >
              <span className="w-10 shrink-0 font-semibold text-[10px] opacity-70 whitespace-nowrap">{isoWeek}주차</span>
              <span className="font-medium whitespace-nowrap">{formatDay(monday)} ~ {formatDay(sunday)}</span>
            </button>
          );
        })}
      </div>
      {startW && (
        <p className="text-center text-[11px] text-neutral-500 mt-3 border-t border-neutral-100 pt-2">
          {startW.y}년 {startW.w}주차{endW ? ` ~ ${endW.y}년 ${endW.w}주차` : ' → 종료 주 선택'}
        </p>
      )}
    </div>
  );
}

// ── 월별 선택기 ──────────────────────────────────────────────
function MonthlyPicker({ startDate, endDate, onChange }: { startDate: Date; endDate: Date; onChange: (s: Date, e: Date) => void }) {
  const [viewYear, setViewYear] = useState(startDate.getFullYear());
  const [startM, setStartM] = useState<{ y: number; m: number } | null>({ y: startDate.getFullYear(), m: startDate.getMonth() });
  const [endM, setEndM] = useState<{ y: number; m: number } | null>({ y: endDate.getFullYear(), m: endDate.getMonth() });
  const [picking, setPicking] = useState<'start' | 'end'>('start');
  const months = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  const handleClick = (m: number) => {
    if (picking === 'start') { setStartM({ y: viewYear, m }); setEndM(null); setPicking('end'); }
    else {
      let fs = startM!, fe = { y: viewYear, m };
      if (fe.y < fs.y || (fe.y === fs.y && fe.m < fs.m)) [fs, fe] = [fe, fs];
      setStartM(fs); setEndM(fe); setPicking('start');
      onChange(new Date(fs.y, fs.m, 1), new Date(fe.y, fe.m + 1, 0));
    }
  };
  const inRange = (m: number) => {
    if (!startM || !endM) return false;
    const k = viewYear * 12 + m;
    return k >= startM.y * 12 + startM.m && k <= endM.y * 12 + endM.m;
  };
  return (
    <div className="p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewYear(v => v - 1)} className="p-1 hover:bg-neutral-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold text-neutral-800 whitespace-nowrap">{viewYear}년</span>
        <button onClick={() => setViewYear(v => v + 1)} className="p-1 hover:bg-neutral-100 rounded"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <p className="text-[11px] text-neutral-400 text-center mb-2 whitespace-nowrap">{picking === 'start' ? '시작 월 선택' : '종료 월 선택'}</p>
      <div className="grid grid-cols-3 gap-2">
        {months.map((label, idx) => {
          const isS = startM?.y === viewYear && startM?.m === idx, isE = endM?.y === viewYear && endM?.m === idx;
          return (
            <button key={idx} onClick={() => handleClick(idx)}
              className={`h-9 rounded text-xs font-semibold transition-all whitespace-nowrap ${isS || isE ? 'text-white' : inRange(idx) ? 'bg-blue-50 text-[#21358D]' : 'hover:bg-neutral-100 text-neutral-700'}`}
              style={(isS || isE) ? { backgroundColor: '#21358D' } : undefined}>
              {label}
            </button>
          );
        })}
      </div>
      {startM && <p className="text-center text-[11px] text-neutral-500 mt-3 border-t border-neutral-100 pt-2 whitespace-nowrap">{startM.y}년 {startM.m + 1}월{endM ? ` ~ ${endM.y}년 ${endM.m + 1}월` : ' ~ 종료 선택'}</p>}
    </div>
  );
}

// ── 년도 선택기 ──────────────────────────────────────────────
function YearlyPicker({ startDate, endDate, onChange }: { startDate: Date; endDate: Date; onChange: (s: Date, e: Date) => void }) {
  const [base, setBase] = useState(Math.floor(startDate.getFullYear() / 10) * 10);
  const [startY, setStartY] = useState<number | null>(startDate.getFullYear());
  const [endY, setEndY] = useState<number | null>(endDate.getFullYear());
  const [picking, setPicking] = useState<'start' | 'end'>('start');
  const years = Array.from({ length: 10 }, (_, i) => base + i);

  const handleClick = (y: number) => {
    if (picking === 'start') { setStartY(y); setEndY(null); setPicking('end'); }
    else {
      let fs = startY!, fe = y;
      if (fe < fs) [fs, fe] = [fe, fs];
      setStartY(fs); setEndY(fe); setPicking('start');
      onChange(new Date(fs, 0, 1), new Date(fe, 11, 31));
    }
  };
  return (
    <div className="p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setBase(v => v - 10)} className="p-1 hover:bg-neutral-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold text-neutral-800 whitespace-nowrap">{base} ~ {base + 9}</span>
        <button onClick={() => setBase(v => v + 10)} className="p-1 hover:bg-neutral-100 rounded"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <p className="text-[11px] text-neutral-400 text-center mb-2 whitespace-nowrap">{picking === 'start' ? '시작 연도 선택' : '종료 연도 선택'}</p>
      <div className="grid grid-cols-2 gap-2">
        {years.map(y => {
          const isS = startY === y, isE = endY === y, inRange = startY !== null && endY !== null && y >= startY && y <= endY;
          return (
            <button key={y} onClick={() => handleClick(y)}
              className={`h-9 rounded text-xs font-semibold transition-all whitespace-nowrap ${isS || isE ? 'text-white' : inRange ? 'bg-blue-50 text-[#21358D]' : 'hover:bg-neutral-100 text-neutral-700'}`}
              style={(isS || isE) ? { backgroundColor: '#21358D' } : undefined}>
              {y}년
            </button>
          );
        })}
      </div>
      {startY && <p className="text-center text-[11px] text-neutral-500 mt-3 border-t border-neutral-100 pt-2 whitespace-nowrap">{startY}년{endY ? ` ~ ${endY}년` : ' ~ 종료 선택'}</p>}
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────
export function PeriodSalesPage() {
  const now = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [startDate, setStartDate] = useState<Date>(() => getDefaults('daily').startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaults('daily').endDate);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{ rows: any[]; totalSales: number; totalOrders: number } | null>(null);

  // 외부 클릭 시 팝오버 닫기
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await adminService.getPeriodSalesStats(viewMode, undefined, undefined, startDate, endDate);
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [viewMode, startDate, endDate]);

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    const d = getDefaults(mode);
    setStartDate(d.startDate);
    setEndDate(d.endDate);
    setPickerOpen(false);
  };

  const handleRangeChange = (s: Date, e: Date) => {
    setStartDate(s);
    setEndDate(e);
    if (viewMode !== 'daily') setTimeout(() => setPickerOpen(false), 150);
  };

  const rows = data?.rows ?? [];
  const totalSales = data?.totalSales ?? 0;
  const totalOrders = data?.totalOrders ?? 0;
  const avgOrderAmount = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  const maxSales = rows.length > 0 ? Math.max(...rows.map(r => r.sales)) : 0;
  const maxRow = rows.find(r => r.sales === maxSales);

  const modeLabel: Record<ViewMode, string> = { daily: '일별', weekly: '주별', monthly: '월별', yearly: '연도별' };

  const handleExcel = () => {
    if (!rows.length) return;
    const headers = ['기간', '상세날짜', '매출액(원)', '주문건수', '평균주문액(원)'];
    const body = rows.map(r => [r.label, r.dateText || '', r.sales, r.orders, r.avgOrder]);
    const summary = [[], ['합계', '', totalSales, totalOrders, avgOrderAmount]];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...body, ...summary]);
    ws['!cols'] = [{ wch: 16 }, { wch: 24 }, { wch: 18 }, { wch: 12 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${modeLabel[viewMode]} 매출현황`);
    const d = new Date();
    XLSX.writeFile(wb, `기간별매출현황_${modeLabel[viewMode]}_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}.xlsx`);
  };

  const label = formatLabel(viewMode, startDate, endDate);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">기간별 매출현황</h1>
          <p className="text-sm text-neutral-600">일별·주별·월별·연도별 실제 매출을 조회합니다.</p>
        </div>
        <button
          onClick={handleExcel}
          className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 font-medium text-sm transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>엑셀 다운로드</span>
        </button>
      </div>

      {/* 기간 선택 필터 */}
      <div className="bg-white border border-neutral-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* 조회 단위 탭 */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 border border-neutral-200/60 rounded shrink-0">
            {(['daily', 'weekly', 'monthly', 'yearly'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`px-4 py-1.5 text-xs font-semibold rounded transition-all ${
                  viewMode === mode ? 'text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
                }`}
                style={viewMode === mode ? { backgroundColor: '#21358D' } : undefined}
              >
                {modeLabel[mode]}
              </button>
            ))}
          </div>

          {/* 날짜 선택 버튼 + 팝오버 */}
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setPickerOpen(o => !o)}
              className={`flex items-center gap-2 px-4 py-2 rounded border text-sm font-medium transition-all ${
                pickerOpen
                  ? 'border-[#21358D] text-[#21358D] bg-blue-50/30'
                  : 'border-neutral-300 text-neutral-700 bg-white hover:border-neutral-400'
              }`}
            >
              <CalendarIcon className="w-4 h-4 shrink-0" />
              <span className="max-w-xs truncate">{label}</span>
            </button>

            {pickerOpen && (
              <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-lg border border-neutral-200 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 bg-neutral-50">
                  <span className="text-xs font-semibold text-neutral-600">
                    {viewMode === 'daily' ? '날짜 범위 선택' : viewMode === 'weekly' ? '주차 범위 선택' : viewMode === 'monthly' ? '월 범위 선택' : '연도 범위 선택'}
                  </span>
                  <button onClick={() => setPickerOpen(false)} className="p-0.5 hover:bg-neutral-200 rounded">
                    <X className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                </div>

                {viewMode === 'daily' && (
                  <DailyPicker startDate={startDate} endDate={endDate} onChange={(s, e) => { setStartDate(s); setEndDate(e); }} />
                )}
                {viewMode === 'weekly' && (
                  <WeeklyPicker startDate={startDate} endDate={endDate} onChange={handleRangeChange} />
                )}
                {viewMode === 'monthly' && (
                  <MonthlyPicker startDate={startDate} endDate={endDate} onChange={handleRangeChange} />
                )}
                {viewMode === 'yearly' && (
                  <YearlyPicker startDate={startDate} endDate={endDate} onChange={handleRangeChange} />
                )}

                {viewMode === 'daily' && (
                  <div className="border-t border-neutral-100 px-4 py-2.5 flex justify-end gap-2">
                    <button onClick={() => setPickerOpen(false)} className="px-4 py-1.5 text-xs font-semibold rounded border border-neutral-300 text-neutral-600 hover:bg-neutral-50">
                      취소
                    </button>
                    <button onClick={() => setPickerOpen(false)} className="px-4 py-1.5 text-xs font-semibold rounded text-white" style={{ backgroundColor: '#21358D' }}>
                      적용
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '총 매출', value: `₩${totalSales.toLocaleString()}`, sub: '', icon: TrendingUp, color: '#21358D' },
          { label: '총 주문', value: `${totalOrders.toLocaleString()}건`, sub: rows.length > 0 ? `평균 ${Math.round(totalOrders / rows.length)}건/${modeLabel[viewMode].replace('별','').replace('도','')}` : '-', icon: ShoppingCart, color: '#059669' },
          { label: '평균 주문액', value: `₩${avgOrderAmount.toLocaleString()}`, sub: '건당 평균', icon: BarChart3, color: '#d97706' },
          { label: '최고 매출', value: maxSales > 0 ? `₩${maxSales.toLocaleString()}` : '-', sub: maxRow?.label ?? '', icon: TrendingUp, color: '#7c3aed' },
        ].map(card => (
          <div key={card.label} className="bg-white border border-neutral-200 p-5 shadow-sm">
            <p className="text-xs text-neutral-500 font-medium mb-2">{card.label}</p>
            <p className="text-xl font-bold text-neutral-900 mb-1">{isLoading ? '...' : card.value}</p>
            {card.sub && <p className="text-xs text-neutral-400">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* 차트 */}
      <div className="bg-white border border-neutral-200 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-700 mb-5">매출 추이</h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">해당 기간 데이터가 없습니다.</div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={v => `₩${(v / 10000).toFixed(0)}만`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 }}
                formatter={(value: number) => [`₩${value.toLocaleString()}`, '매출']}
              />
              <Bar dataKey="sales" name="매출" fill="#21358D" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 상세 테이블 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-700">상세 데이터</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-6 font-semibold text-neutral-700">기간</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 text-right">매출액</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 text-right">주문건수</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 text-right">평균 주문액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#21358D] mx-auto" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-16 text-neutral-400">해당 기간 데이터가 없습니다.</td></tr>
              ) : (
                <>
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-6 font-medium text-neutral-900">
                        <div className="font-semibold">{row.label}</div>
                        {row.dateText && row.dateText !== row.label && (
                          <div className="text-xs text-neutral-400 font-normal mt-0.5">{row.dateText}</div>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right font-semibold text-neutral-900">₩{row.sales.toLocaleString()}</td>
                      <td className="py-3 px-6 text-right text-neutral-600">{row.orders}건</td>
                      <td className="py-3 px-6 text-right text-neutral-600">₩{row.avgOrder.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-neutral-50 font-semibold border-t border-neutral-200">
                    <td className="py-3 px-6 text-neutral-700">합계</td>
                    <td className="py-3 px-6 text-right text-neutral-900">₩{totalSales.toLocaleString()}</td>
                    <td className="py-3 px-6 text-right text-neutral-900">{totalOrders}건</td>
                    <td className="py-3 px-6 text-right text-neutral-900">₩{avgOrderAmount.toLocaleString()}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}