import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router';
import { Download, CalendarIcon, BarChart3, TrendingUp, Archive, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Calendar } from '../../../components/ui/calendar';
import { ko } from 'date-fns/locale';

type Granularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ISO 주차 계산
function getISOWeek(d: Date): number {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

// 주차의 월요일 날짜
function weekStartDate(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const startOfYear = new Date(jan4);
  startOfYear.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const monday = new Date(startOfYear);
  monday.setDate(startOfYear.getDate() + (week - 1) * 7);
  return monday;
}

function getDefaults(g: Granularity): { startDate: Date; endDate: Date } {
  const now = new Date();
  if (g === 'daily') {
    const s = new Date(now);
    s.setDate(now.getDate() - 13);
    return { startDate: s, endDate: now };
  }
  if (g === 'weekly') {
    const week = getISOWeek(now);
    const start = weekStartDate(now.getFullYear(), week);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const start10w = new Date(start);
    start10w.setDate(start.getDate() - 9 * 7);
    return { startDate: start10w, endDate: end };
  }
  if (g === 'monthly') {
    const s = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: s, endDate: e };
  }
  // yearly
  return {
    startDate: new Date(now.getFullYear() - 4, 0, 1),
    endDate: new Date(now.getFullYear(), 11, 31),
  };
}

// 표시용 레이블
function formatLabel(g: Granularity, startDate: Date, endDate: Date): string {
  const koFormatter = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString('ko-KR', opts);

  if (g === 'daily') {
    return `${koFormatter(startDate, { year: 'numeric', month: 'long', day: 'numeric' })} ~ ${koFormatter(endDate, { year: 'numeric', month: 'long', day: 'numeric' })}`;
  }
  if (g === 'weekly') {
    const sw = getISOWeek(startDate);
    const ew = getISOWeek(endDate);
    const sy = startDate.getFullYear();
    const ey = endDate.getFullYear();
    if (sy === ey && sw === ew) return `${sy}년 ${sw}주차`;
    return `${sy}년 ${sw}주차 ~ ${ey}년 ${ew}주차`;
  }
  if (g === 'monthly') {
    const sm = `${startDate.getFullYear()}년 ${startDate.getMonth() + 1}월`;
    const em = `${endDate.getFullYear()}년 ${endDate.getMonth() + 1}월`;
    return sm === em ? sm : `${sm} ~ ${em}`;
  }
  const sy = startDate.getFullYear();
  const ey = endDate.getFullYear();
  return sy === ey ? `${sy}년` : `${sy}년 ~ ${ey}년`;
}

// custom:start_end 포맷 변환
function toDateRange(startDate: Date, endDate: Date): string {
  return `custom:${toDateStr(startDate)}_${toDateStr(endDate)}`;
}

// ── 일별 달력 팝오버 ──────────────────────────────────────────
function DailyPicker({ startDate, endDate, onChange }: {
  startDate: Date; endDate: Date;
  onChange: (s: Date, e: Date) => void;
}) {
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({ from: startDate, to: endDate });
  const [month, setMonth] = useState(startDate);

  useEffect(() => { setRange({ from: startDate, to: endDate }); }, [startDate, endDate]);

  return (
    <div className="p-3">
      <Calendar
        mode="range"
        selected={range}
        onSelect={(r) => {
          setRange(r ?? {});
          if (r?.from && r?.to) onChange(r.from, r.to);
          else if (r?.from && !r?.to) onChange(r.from, r.from);
        }}
        month={month}
        onMonthChange={setMonth}
        numberOfMonths={2}
        locale={ko}
      />
      {range.from && range.to && (
        <p className="text-center text-xs text-neutral-500 mt-2 border-t border-neutral-100 pt-2">
          {toDateStr(range.from)} ~ {toDateStr(range.to)}
        </p>
      )}
    </div>
  );
}

// ── 주별 선택기 (월 달력 기반 주 행 선택) ──────────────────────
function WeeklyPicker({ startDate, endDate, onChange }: {
  startDate: Date; endDate: Date;
  onChange: (s: Date, e: Date) => void;
}) {
  const [viewYear, setViewYear] = useState(startDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(startDate.getMonth());
  const [startWeek, setStartWeek] = useState<{ y: number; w: number } | null>({
    y: startDate.getFullYear(), w: getISOWeek(startDate)
  });
  const [endWeek, setEndWeek] = useState<{ y: number; w: number } | null>({
    y: endDate.getFullYear(), w: getISOWeek(endDate)
  });
  const [picking, setPicking] = useState<'start' | 'end'>('start');

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const getWeekRows = () => {
    const rows: { monday: Date; sunday: Date; isoWeek: number; isoYear: number }[] = [];
    const firstDay = new Date(viewYear, viewMonth, 1);
    const dayOfWeek = firstDay.getDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    let cur = new Date(firstDay);
    cur.setDate(firstDay.getDate() + diffToMon);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    while (cur <= lastDay) {
      const monday = new Date(cur);
      const sunday = new Date(cur); sunday.setDate(cur.getDate() + 6);
      rows.push({ monday, sunday, isoWeek: getISOWeek(monday), isoYear: monday.getFullYear() });
      cur.setDate(cur.getDate() + 7);
    }
    return rows;
  };

  const weekRows = getWeekRows();
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

  const handleWeekClick = (isoYear: number, isoWeek: number, monday: Date) => {
    if (picking === 'start') {
      setStartWeek({ y: isoYear, w: isoWeek }); setEndWeek(null); setPicking('end');
    } else {
      let fs = startWeek!, fe = { y: isoYear, w: isoWeek };
      let fsDate = weekStartDate(fs.y, fs.w);
      if (fe.y < fs.y || (fe.y === fs.y && fe.w < fs.w)) {
        [fs, fe] = [fe, fs]; fsDate = monday;
      }
      setStartWeek(fs); setEndWeek(fe); setPicking('start');
      const eStart = weekStartDate(fe.y, fe.w);
      const e = new Date(eStart); e.setDate(eStart.getDate() + 6);
      onChange(fsDate, e);
    }
  };

  const isInRange = (isoYear: number, isoWeek: number) => {
    if (!startWeek || !endWeek) return false;
    const k = isoYear * 100 + isoWeek, sk = startWeek.y * 100 + startWeek.w, ek = endWeek.y * 100 + endWeek.w;
    return k > sk && k < ek;
  };

  return (
    <div className="p-4 w-96">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 hover:bg-neutral-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold text-neutral-800 whitespace-nowrap">{viewYear}년 {viewMonth + 1}월</span>
        <button onClick={nextMonth} className="p-1 hover:bg-neutral-100 rounded"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <p className="text-[11px] text-neutral-400 text-center mb-2">
        {picking === 'start' ? '시작 주 선택 (주 행 클릭)' : '종료 주 선택'}
      </p>
      <div className="flex items-center gap-2 mb-1 px-2">
        <span className="text-[10px] text-neutral-400 w-10 shrink-0">주차</span>
        <span className="text-[10px] text-neutral-400 flex-1 text-center">날짜 범위</span>
      </div>
      <div className="space-y-0.5">
        {weekRows.map(({ monday, sunday, isoWeek, isoYear }) => {
          const isStart = startWeek?.y === isoYear && startWeek?.w === isoWeek;
          const isEnd = endWeek?.y === isoYear && endWeek?.w === isoWeek;
          const inRange = isInRange(isoYear, isoWeek);
          const isHighlight = isStart || isEnd;
          return (
            <button
              key={`${isoYear}-W${isoWeek}`}
              onClick={() => handleWeekClick(isoYear, isoWeek, monday)}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded text-xs transition-all text-left ${
                isHighlight ? 'text-white' : inRange ? 'bg-blue-50 text-[#21358D]' : 'hover:bg-neutral-100 text-neutral-700'
              }`}
              style={isHighlight ? { backgroundColor: '#21358D' } : undefined}
            >
              <span className="w-10 shrink-0 font-semibold text-[10px] opacity-70 whitespace-nowrap">{isoWeek}주차</span>
              <span className="font-medium whitespace-nowrap">{fmt(monday)} ~ {fmt(sunday)}</span>
            </button>
          );
        })}
      </div>
      {startWeek && (
        <p className="text-center text-[11px] text-neutral-500 mt-3 border-t border-neutral-100 pt-2">
          {startWeek.y}년 {startWeek.w}주차{endWeek ? ` ~ ${endWeek.y}년 ${endWeek.w}주차` : ' → 종료 주 선택'}
        </p>
      )}
    </div>
  );
}

// ── 월별 선택기 ──────────────────────────────────────────────
function MonthlyPicker({ startDate, endDate, onChange }: {
  startDate: Date; endDate: Date;
  onChange: (s: Date, e: Date) => void;
}) {
  const [viewYear, setViewYear] = useState(startDate.getFullYear());
  const [startM, setStartM] = useState<{ y: number; m: number } | null>({ y: startDate.getFullYear(), m: startDate.getMonth() });
  const [endM, setEndM] = useState<{ y: number; m: number } | null>({ y: endDate.getFullYear(), m: endDate.getMonth() });
  const [picking, setPicking] = useState<'start' | 'end'>('start');
  const months = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  const handleMonthClick = (m: number) => {
    if (picking === 'start') {
      setStartM({ y: viewYear, m });
      setEndM(null);
      setPicking('end');
    } else {
      const sm = startM!;
      const em = { y: viewYear, m };
      let fs = sm, fe = em;
      if (em.y < sm.y || (em.y === sm.y && em.m < sm.m)) { fs = em; fe = sm; }
      setStartM(fs); setEndM(fe);
      setPicking('start');
      const s = new Date(fs.y, fs.m, 1);
      const e = new Date(fe.y, fe.m + 1, 0);
      onChange(s, e);
    }
  };

  const isInRange = (m: number) => {
    if (!startM || !endM) return false;
    const key = viewYear * 12 + m;
    return key >= startM.y * 12 + startM.m && key <= endM.y * 12 + endM.m;
  };

  return (
    <div className="p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewYear(v => v - 1)} className="p-1 hover:bg-neutral-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold text-neutral-800 whitespace-nowrap">{viewYear}년</span>
        <button onClick={() => setViewYear(v => v + 1)} className="p-1 hover:bg-neutral-100 rounded"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <p className="text-[11px] text-neutral-400 text-center mb-2 whitespace-nowrap">
        {picking === 'start' ? '시작 월을 선택하세요' : '종료 월을 선택하세요'}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {months.map((label, idx) => {
          const isStart = startM?.y === viewYear && startM?.m === idx;
          const isEnd = endM?.y === viewYear && endM?.m === idx;
          const inRange = isInRange(idx);
          return (
            <button
              key={idx}
              onClick={() => handleMonthClick(idx)}
              className={`h-9 rounded text-xs font-semibold transition-all whitespace-nowrap ${
                isStart || isEnd ? 'text-white' : inRange ? 'bg-blue-50 text-[#21358D]' : 'hover:bg-neutral-100 text-neutral-700'
              }`}
              style={(isStart || isEnd) ? { backgroundColor: '#21358D' } : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>
      {startM && (
        <p className="text-center text-[11px] text-neutral-500 mt-3 border-t border-neutral-100 pt-2 whitespace-nowrap">
          {startM.y}년 {startM.m + 1}월{endM ? ` ~ ${endM.y}년 ${endM.m + 1}월` : ' ~ 종료 월 선택'}
        </p>
      )}
    </div>
  );
}

// ── 년도 선택기 ──────────────────────────────────────────────
function YearlyPicker({ startDate, endDate, onChange }: {
  startDate: Date;
  endDate: Date;
  onChange: (s: Date, e: Date) => void;
}) {
  const now = new Date();
  const [baseYear, setBaseYear] = useState(Math.floor(now.getFullYear() / 10) * 10);
  const [startY, setStartY] = useState<number | null>(startDate.getFullYear());
  const [endY, setEndY] = useState<number | null>(endDate.getFullYear());
  const [picking, setPicking] = useState<'start' | 'end'>('start');
  const years = Array.from({ length: 10 }, (_, i) => baseYear + i);

  const handleYearClick = (y: number) => {
    if (picking === 'start') {
      setStartY(y); setEndY(null); setPicking('end');
    } else {
      let fs = startY!, fe = y;
      if (fe < fs) { [fs, fe] = [fe, fs]; }
      setStartY(fs); setEndY(fe);
      setPicking('start');
      onChange(new Date(fs, 0, 1), new Date(fe, 11, 31));
    }
  };

  return (
    <div className="p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setBaseYear(v => v - 10)} className="p-1 hover:bg-neutral-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold text-neutral-800 whitespace-nowrap">{baseYear} ~ {baseYear + 9}</span>
        <button onClick={() => setBaseYear(v => v + 10)} className="p-1 hover:bg-neutral-100 rounded"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <p className="text-[11px] text-neutral-400 text-center mb-2 whitespace-nowrap">
        {picking === 'start' ? '시작 연도를 선택하세요' : '종료 연도를 선택하세요'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {years.map(y => {
          const isStart = startY === y;
          const isEnd = endY === y;
          const inRange = startY !== null && endY !== null && y >= startY && y <= endY;
          return (
            <button
              key={y}
              onClick={() => handleYearClick(y)}
              className={`h-9 rounded text-xs font-semibold transition-all whitespace-nowrap ${
                isStart || isEnd ? 'text-white' : inRange ? 'bg-blue-50 text-[#21358D]' : 'hover:bg-neutral-100 text-neutral-700'
              }`}
              style={(isStart || isEnd) ? { backgroundColor: '#21358D' } : undefined}
            >
              {y}년
            </button>
          );
        })}
      </div>
      {startY && (
        <p className="text-center text-[11px] text-neutral-500 mt-3 border-t border-neutral-100 pt-2 whitespace-nowrap">
          {startY}년{endY ? ` ~ ${endY}년` : ' ~ 종료 연도 선택'}
        </p>
      )}
    </div>
  );
}

export function ProductAnalyticsLayout() {
  const [granularity, setGranularity] = useState<Granularity>('monthly');
  const [startDate, setStartDate] = useState<Date>(() => getDefaults('monthly').startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaults('monthly').endDate);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const [showDownloadBtn, setShowDownloadBtn] = useState(false);
  const exportFnRef = useRef<(() => void) | null>(null);
  const onRegisterExport = useCallback((fn: (() => void) | null) => {
    exportFnRef.current = fn;
    setShowDownloadBtn(fn !== null);
  }, []);

  // Clear export fn when path changes
  useEffect(() => {
    exportFnRef.current = null;
    setShowDownloadBtn(false);
  }, [location.pathname]);

  // 외부 클릭 시 팝오버 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleGranularityChange = (g: Granularity) => {
    setGranularity(g);
    const d = getDefaults(g);
    setStartDate(d.startDate);
    setEndDate(d.endDate);
    setPickerOpen(false);
  };

  const handleRangeChange = (s: Date, e: Date) => {
    setStartDate(s);
    setEndDate(e);
    if (granularity !== 'daily') {
      setTimeout(() => setPickerOpen(false), 150);
    }
  };

  const dateRange = toDateRange(startDate, endDate);
  const label = formatLabel(granularity, startDate, endDate);

  const granularityOptions: { value: Granularity; label: string }[] = [
    { value: 'daily', label: '일별' },
    { value: 'weekly', label: '주별' },
    { value: 'monthly', label: '월별' },
    { value: 'yearly', label: '년별' },
  ];

  const tabs = [
    { path: '/admin/statistics/products/overview', label: '상품 개요', icon: TrendingUp },
    { path: '/admin/statistics/products/category', label: '카테고리별', icon: BarChart3 },
    { path: '/admin/statistics/products/bestseller', label: '베스트셀러', icon: AwardIcon },
    { path: '/admin/statistics/products/conversion', label: '전환율 분석', icon: RefreshCw },
    { path: '/admin/statistics/products/stock', label: '재고 분석', icon: AlertTriangle },
    { path: '/admin/statistics/products/low-performing', label: '비인기 상품', icon: Archive },
  ];

  const handleDownloadReport = async () => {
    if (!exportFnRef.current) return;
    try {
      await exportFnRef.current();
    } catch (err) {
      console.error(err);
    }
  };

  // Base path 리다이렉션
  if (location.pathname === '/admin/statistics/products' || location.pathname === '/admin/statistics/products/') {
    return <Navigate to="/admin/statistics/products/overview" replace />;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">상품 분석</h1>
          <p className="text-sm text-neutral-600">상품별 매출, 판매 성과 및 재고 모니터링 분석을 다각도로 제공합니다.</p>
        </div>
        {showDownloadBtn && (
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 active:bg-neutral-100 font-medium text-sm transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>엑셀 다운로드</span>
          </button>
        )}
      </div>

      {/* 공통 필터 영역 */}
      {!(location.pathname.endsWith('/products/stock') || location.pathname.endsWith('/products/low-performing')) && (
        <div className="bg-white border border-neutral-200 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Granularity 탭 */}
            <div className="flex bg-neutral-100 p-0.5 rounded border border-neutral-200">
              {granularityOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleGranularityChange(opt.value)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded transition-all ${
                    granularity === opt.value
                      ? 'text-white shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                  }`}
                  style={granularity === opt.value ? { backgroundColor: '#21358D' } : undefined}
                >
                  {opt.label}
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

              {/* 팝오버 */}
              {pickerOpen && (
                <div className="absolute top-full mt-2 right-0 sm:left-0 z-50 bg-white rounded-lg border border-neutral-200 shadow-xl overflow-hidden animate-fadeIn">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 bg-neutral-50">
                    <span className="text-xs font-semibold text-neutral-600">
                      {granularity === 'daily' ? '날짜 범위 선택' : granularity === 'weekly' ? '주차 범위 선택' : granularity === 'monthly' ? '월 범위 선택' : '연도 범위 선택'}
                    </span>
                    <button onClick={() => setPickerOpen(false)} className="p-0.5 hover:bg-neutral-200 rounded">
                      <X className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                  </div>

                  {granularity === 'daily' && (
                    <DailyPicker
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(s, e) => {
                        setStartDate(s);
                        setEndDate(e);
                      }}
                    />
                  )}
                  {granularity === 'weekly' && (
                    <WeeklyPicker startDate={startDate} endDate={endDate} onChange={handleRangeChange} />
                  )}
                  {granularity === 'monthly' && (
                    <MonthlyPicker startDate={startDate} endDate={endDate} onChange={handleRangeChange} />
                  )}
                  {granularity === 'yearly' && (
                    <YearlyPicker startDate={startDate} endDate={endDate} onChange={handleRangeChange} />
                  )}

                  {/* 일별 적용 버튼 */}
                  {granularity === 'daily' && (
                    <div className="border-t border-neutral-100 px-4 py-2.5 flex justify-end gap-2">
                      <button
                        onClick={() => setPickerOpen(false)}
                        className="px-4 py-1.5 text-xs font-semibold rounded border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => setPickerOpen(false)}
                        className="px-4 py-1.5 text-xs font-semibold rounded text-white"
                        style={{ backgroundColor: '#21358D' }}
                      >
                        적용
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 상단 탭 바 (Brand Color #21358D 적용) */}
      <div className="border-b border-neutral-200 bg-white px-2 pt-2 flex flex-wrap gap-1 shadow-sm">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const TabIcon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[1px] ${
                isActive
                  ? 'border-[#21358D] text-[#21358D] bg-blue-50/20'
                  : 'border-transparent text-neutral-600 hover:text-neutral-950 hover:border-neutral-300'
              }`}
            >
              <TabIcon className={`w-4 h-4 ${isActive ? 'text-[#21358D]' : 'text-neutral-400'}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 하위 컴포넌트 렌더링 */}
      <div className="min-h-[400px]">
        <Outlet context={{ dateRange, granularity, onRegisterExport, label }} />
      </div>
    </div>
  );
}

// AwardIcon 헬퍼 컴포넌트
function AwardIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}
