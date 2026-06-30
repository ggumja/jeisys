import { ShoppingCart, Users, Package, DollarSign, ArrowUpRight, ArrowDownRight, Loader2, CalendarIcon, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { adminService } from '../../services/adminService';
import { Calendar } from '../../components/ui/calendar';
import { ko } from 'date-fns/locale';

type Granularity = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'cumulative';

// Custom ResizeObserver Hook using callback ref
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

// granularity별 기본값 반환 (Date 객체)
function getDefaults(g: Granularity): { startDate: Date; endDate: Date } {
  const now = new Date();
  if (g === 'daily') {
    return { startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: now };
  }
  if (g === 'weekly') {
    const week = getISOWeek(now);
    const start = weekStartDate(now.getFullYear(), week);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { startDate: start, endDate: end };
  }
  if (g === 'monthly') {
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  }
  if (g === 'yearly') {
    return {
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: new Date(now.getFullYear(), 11, 31),
    };
  }
  // cumulative
  return {
    startDate: new Date(2000, 0, 1),
    endDate: now
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
  if (g === 'yearly') {
    const sy = startDate.getFullYear();
    const ey = endDate.getFullYear();
    return sy === ey ? `${sy}년` : `${sy}년 ~ ${ey}년`;
  }
  return '전체 누적 기간';
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

export function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Resize Refs for Recharts rendering stability
  const [trendRef, trendWidth] = useChartDimensions(600);
  const [categoryRef, categoryWidth] = useChartDimensions(300);
  const [paymentRef, paymentWidth] = useChartDimensions(300);
  const [regionRef, regionWidth] = useChartDimensions(600);
  
  // Date Picker States (Sales Analytics Style)
  const [granularity, setGranularity] = useState<Granularity>('monthly');
  const [startDate, setStartDate] = useState<Date>(() => getDefaults('monthly').startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaults('monthly').endDate);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Comprehensive Stats State
  const [stats, setStats] = useState({
    periodSales: 0,
    newUsersCount: 0,
    avgSalesPerCustomer: 0,
    avgSalesPerOrder: 0,
    buyingUsersCount: 0,
    periodOrdersCount: 0,
    paymentData: [] as { name: string; value: number; percentage: number }[],
    categoryData: [] as { name: string; value: number; color: string; amount?: number; orders?: number }[],
    bestProducts: [] as { name: string; sales: number; revenue: number }[],
    topCustomers: [] as { name: string; hospitalName: string; totalSales: number }[],
    regionSales: [] as { region: string; sales: number; percentage: number }[],
    trendData: [] as { label: string; sales: number }[]
  });

  // Cumulative Static Stats (Independent of period)
  const [cumulativeStats, setCumulativeStats] = useState({
    totalSales: 0,
    totalUsers: 0,
    lowStockProducts: 0,
    totalProducts: 0,
    gradeStats: {
      VIP: { count: 0, percentage: 0 },
      Gold: { count: 0, percentage: 0 },
      Silver: { count: 0, percentage: 0 },
      Bronze: { count: 0, percentage: 0 }
    }
  });

  const [todoCounts, setTodoCounts] = useState({ paid: 0, claims: 0, failed: 0 });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadFilteredStats();
  }, [granularity, startDate, endDate]);

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

  const loadInitialData = async () => {
    try {
      const [basicStats, counts] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getTodoOrderCounts()
      ]);
      setCumulativeStats({
        totalSales: basicStats.monthSales,
        totalUsers: basicStats.totalUsers,
        lowStockProducts: basicStats.lowStockProducts,
        totalProducts: basicStats.totalProducts,
        gradeStats: basicStats.gradeStats
      });
      setTodoCounts(counts);
    } catch (error) {
      console.error('Failed to load initial dashboard config', error);
    }
  };

  const loadFilteredStats = async () => {
    try {
      setLoading(true);
      const effectiveRange = granularity === 'cumulative' ? 'cumulative' : toDateRange(startDate, endDate);
      
      const [comprehensive, basicStats] = await Promise.all([
        adminService.getDashboardComprehensiveStats({
          dateRange: effectiveRange,
          granularity: granularity
        }),
        // Fetch static stats for total cumulative items
        adminService.getDashboardComprehensiveStats({
          dateRange: 'cumulative'
        })
      ]);

      setStats(comprehensive);
      setCumulativeStats(prev => ({
        ...prev,
        totalSales: basicStats.periodSales
      }));
    } catch (error) {
      console.error('Failed to filter dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleGradeClick = (grade: string) => {
    navigate(`/admin/members?grade=${grade}`);
  };

  const label = formatLabel(granularity, startDate, endDate);

  const granularityOptions: { value: Granularity; label: string }[] = [
    { value: 'daily', label: '일별' },
    { value: 'weekly', label: '주별' },
    { value: 'monthly', label: '월별' },
    { value: 'yearly', label: '년별' },
    { value: 'cumulative', label: '총 누적' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 타이틀 및 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-1">대시보드</h1>
          <p className="text-sm text-neutral-600">제이시스메디칼 쇼핑몰 운영 성과와 통계를 통합 필터링하여 확인하세요.</p>
        </div>
      </div>

      {/* 처리해야 하는 주문 */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-neutral-800 tracking-tight">처리해야 하는 주문</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => navigate('/admin/orders?status=paid')} 
            className="bg-white border border-neutral-200 p-6 shadow-sm cursor-pointer hover:bg-neutral-50/50 transition-colors"
          >
            <p className="text-xs text-neutral-500 font-medium mb-1">결제완료</p>
            <p className="text-2xl font-bold tracking-tight text-neutral-900">{todoCounts.paid}건</p>
          </div>
          
          <div 
            onClick={() => navigate('/admin/orders?status=claims')} 
            className="bg-white border border-neutral-200 p-6 shadow-sm cursor-pointer hover:bg-neutral-50/50 transition-colors"
          >
            <p className="text-xs text-neutral-500 font-medium mb-1">취소/환불/교환 요청</p>
            <p className="text-2xl font-bold tracking-tight text-neutral-900">{todoCounts.claims}건</p>
          </div>
          
          <div 
            onClick={() => navigate('/admin/orders?status=cancelled')} 
            className="bg-white border border-neutral-200 p-6 shadow-sm cursor-pointer hover:bg-neutral-50/50 transition-colors"
          >
            <p className="text-xs text-neutral-500 font-medium mb-1">결제실패</p>
            <p className="text-2xl font-bold tracking-tight text-neutral-900">{todoCounts.failed}건</p>
          </div>
        </div>
      </div>

      {/* 필터바 영역 (Sales Analytics 포맷 적용) */}
      <div className="bg-white border border-neutral-200 p-4 shadow-sm flex flex-wrap items-center gap-3">
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

        {/* 날짜 선택 버튼 + 팝오버 (총 누적이 아닐 때만 표시) */}
        {granularity !== 'cumulative' && (
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
              <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-lg border border-neutral-200 shadow-xl overflow-hidden animate-fadeIn">
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
        )}
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center bg-white border border-neutral-200">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : (
        <>
          {/* 1단: 고정/누적 지표 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-neutral-200 p-6 shadow-sm cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => navigate('/admin/members')}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-neutral-900 text-white rounded">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-neutral-500 font-medium mb-1">누적 총 회원수</p>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">{cumulativeStats.totalUsers.toLocaleString()}명</p>
            </div>

            <div className="bg-white border border-neutral-200 p-6 shadow-sm cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => navigate('/admin/products')}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-neutral-900 text-white rounded">
                  <Package className="w-5 h-5" />
                </div>
                {cumulativeStats.lowStockProducts > 0 && (
                  <span className="text-xs text-red-600 bg-red-50 font-bold px-2 py-0.5 rounded-full">재고부족 {cumulativeStats.lowStockProducts}</span>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-medium mb-1">전체 등록 상품수</p>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">{cumulativeStats.totalProducts.toLocaleString()}개</p>
            </div>

            <div className="bg-white border border-neutral-200 p-6 shadow-sm cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => navigate('/admin/statistics/sales')}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-neutral-900 text-white rounded">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-neutral-500 font-medium mb-1">선택기간 총 매출</p>
              <p className="text-2xl font-bold tracking-tight text-[#21358D]">₩{stats.periodSales.toLocaleString()}</p>
            </div>
          </div>

          {/* 2단: 기간 선택형 동적 지표 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div 
              onClick={() => navigate('/admin/members')}
              className="bg-neutral-50 border border-neutral-200 p-5 rounded flex flex-col justify-between cursor-pointer hover:bg-neutral-100 transition-colors"
            >
              <span className="text-xs text-neutral-500 font-bold">신규 회원수 (선택 기간)</span>
              <p className="text-3xl font-extrabold text-neutral-900 mt-2 font-mono">{stats.newUsersCount}명</p>
            </div>
            <div 
              onClick={() => navigate('/admin/members')}
              className="bg-neutral-50 border border-neutral-200 p-5 rounded flex flex-col justify-between cursor-pointer hover:bg-neutral-100 transition-colors"
            >
              <span className="text-xs text-neutral-500 font-bold">누적 구매 회원수 (선택 기간)</span>
              <p className="text-3xl font-extrabold text-neutral-900 mt-2 font-mono">{stats.buyingUsersCount}명</p>
            </div>
            <div 
              onClick={() => navigate('/admin/statistics/sales')}
              className="bg-neutral-50 border border-neutral-200 p-5 rounded flex flex-col justify-between cursor-pointer hover:bg-neutral-100 transition-colors"
            >
              <span className="text-xs text-neutral-500 font-bold">총 구매건수 (선택 기간)</span>
              <p className="text-3xl font-extrabold text-neutral-900 mt-2 font-mono">{stats.periodOrdersCount}건</p>
            </div>
            <div 
              onClick={() => navigate('/admin/statistics/sales')}
              className="bg-neutral-50 border border-neutral-200 p-5 rounded flex flex-col justify-between cursor-pointer hover:bg-neutral-100 transition-colors"
            >
              <span className="text-xs text-neutral-500 font-bold">거래처당 평균 매출 (선택 기간)</span>
              <p className="text-2xl font-extrabold text-[#21358D] mt-2 font-mono">₩{stats.avgSalesPerCustomer.toLocaleString()}</p>
            </div>
            <div 
              onClick={() => navigate('/admin/statistics/sales')}
              className="bg-neutral-50 border border-neutral-200 p-5 rounded flex flex-col justify-between cursor-pointer hover:bg-neutral-100 transition-colors"
            >
              <span className="text-xs text-neutral-500 font-bold">주문 건당 평균 매출 (선택 기간)</span>
              <p className="text-2xl font-extrabold text-[#21358D] mt-2 font-mono">₩{stats.avgSalesPerOrder.toLocaleString()}</p>
            </div>
          </div>

          {/* 3단: 시각화 차트 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 매출 추이 시계열 그래프 */}
            <div 
              onClick={() => navigate('/admin/statistics/period-sales')}
              className="lg:col-span-2 bg-white border border-neutral-200 p-6 shadow-sm cursor-pointer hover:bg-neutral-50/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-neutral-900">선택 기간 매출 추이</h2>
              </div>
              <div ref={trendRef} className="h-[300px] w-full min-w-0 relative">
                {stats.trendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-neutral-400">조회된 기간 내 매출 데이터가 없습니다.</div>
                ) : (
                  <AreaChart width={trendWidth} height={300} data={stats.trendData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#21358D" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#21358D" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} formatter={(val: number) => `₩${(val/10000).toLocaleString()}만`} />
                    <Tooltip formatter={(value: number) => [`₩${value.toLocaleString()}`, '매출액']} />
                    <Area type="monotone" dataKey="sales" stroke="#21358D" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                )}
              </div>
            </div>

            {/* 카테고리별 매출 비중 (막대 게이지 목록) */}
            <div 
              onClick={() => navigate('/admin/statistics/sales/category')}
              className="bg-white border border-neutral-200 p-6 shadow-sm flex flex-col justify-between cursor-pointer hover:bg-neutral-50/50 transition-colors"
            >
              <div>
                <h2 className="text-base font-bold text-neutral-900 mb-1">카테고리별 매출 비중</h2>
                <p className="text-[11px] text-neutral-500 mb-4">선택 기간 내 카테고리별 매출 기여도와 비중입니다.</p>
              </div>
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                {stats.categoryData.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-neutral-400">데이터 없음</div>
                ) : (
                  stats.categoryData.slice(0, 5).map((entry, index) => {
                    const color = entry.color || '#21358D';
                    const amount = entry.amount || 0;
                    const orders = entry.orders || 0;
                    return (
                      <div key={entry.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="truncate">{entry.name}</span>
                            <span className="text-neutral-400 font-normal">({orders}건)</span>
                          </div>
                          <div className="text-right flex items-center gap-2 flex-shrink-0">
                            <span className="text-neutral-900 font-bold">₩{amount.toLocaleString()}</span>
                            <span className="font-semibold font-mono text-[11px]" style={{ color }}>{entry.value}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${entry.value}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 결제수단별 매출 비중 */}
            <div 
              onClick={() => navigate('/admin/statistics/sales/payment')}
              className="bg-white border border-neutral-200 p-6 shadow-sm cursor-pointer hover:bg-neutral-50/50 transition-colors"
            >
              <h2 className="text-base font-bold text-neutral-900 mb-4">결제수단별 매출 비율</h2>
              <div ref={paymentRef} className="h-[200px] w-full min-w-0 relative">
                {stats.paymentData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-neutral-400 font-medium">결제 데이터 없음</div>
                ) : (
                  <PieChart width={paymentWidth} height={200}>
                    <Pie
                      data={stats.paymentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {stats.paymentData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#21358D', '#4b5563', '#9ca3af', '#d1d5db', '#e5e7eb'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`₩${value.toLocaleString()}`, '매출액']} />
                  </PieChart>
                )}
              </div>
            </div>

            {/* 지역별 매출 (병원 주소 파싱) */}
            <div className="lg:col-span-2 bg-white border border-neutral-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900 mb-4">지역별 매출 분포</h2>
              <div ref={regionRef} className="h-[200px] w-full min-w-0 relative">
                {stats.regionSales.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-neutral-400 font-medium">지역 매출 데이터 없음</div>
                ) : (
                  <BarChart width={regionWidth} height={200} data={stats.regionSales.slice(0, 7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="region" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} formatter={(val: number) => `₩${(val/10000).toLocaleString()}만`} />
                    <Tooltip formatter={(value: number) => [`₩${value.toLocaleString()}`, '매출액']} />
                    <Bar dataKey="sales" fill="#21358D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </div>
            </div>
          </div>

          {/* 4단: 베스트셀러 및 TOP구매 거래처 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 베스트셀러 제품 */}
            <div 
              onClick={() => navigate('/admin/statistics/products/bestseller')}
              className="bg-white border border-neutral-200 p-6 shadow-sm cursor-pointer hover:bg-neutral-50/50 transition-colors"
            >
              <h2 className="text-base font-bold text-neutral-900 mb-4">베스트셀러 제품 TOP 5</h2>
              <div className="space-y-4">
                {stats.bestProducts.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 text-sm">해당 기간 판매 제품이 없습니다.</div>
                ) : (
                  stats.bestProducts.map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-3 border-b border-neutral-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{prod.name}</p>
                          <p className="text-xs text-neutral-500 font-bold">{prod.sales.toLocaleString()}개 판매</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-neutral-900">₩{prod.revenue.toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* TOP 구매 거래처 */}
            <div 
              onClick={() => navigate('/admin/statistics/sales/customer')}
              className="bg-white border border-neutral-200 p-6 shadow-sm cursor-pointer hover:bg-neutral-50/50 transition-colors"
            >
              <h2 className="text-base font-bold text-neutral-900 mb-4">TOP 구매 거래처 TOP 5</h2>
              <div className="space-y-4">
                {stats.topCustomers.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 text-sm">거래처 데이터가 없습니다.</div>
                ) : (
                  stats.topCustomers.slice(0, 5).map((cust, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-3 border-b border-neutral-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{cust.hospitalName}</p>
                          <p className="text-xs text-neutral-500 font-bold">담당자: {cust.name}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-neutral-900">₩{cust.totalSales.toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 회원 등급별 현황 */}
          <div className="bg-white border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-neutral-900 mb-4">회원 등급별 현황</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { grade: 'VIP', color: '#8b5cf6', data: cumulativeStats.gradeStats.VIP },
                { grade: 'Gold', color: '#eab308', data: cumulativeStats.gradeStats.Gold },
                { grade: 'Silver', color: '#9ca3af', data: cumulativeStats.gradeStats.Silver },
                { grade: 'Bronze', color: '#ea580c', data: cumulativeStats.gradeStats.Bronze }
              ].map(g => (
                <div
                  key={g.grade}
                  onClick={() => handleGradeClick(g.grade)}
                  className="p-4 border border-neutral-200 rounded cursor-pointer hover:border-neutral-900 transition-all hover:shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-600 font-bold">{g.grade} 등급</span>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-neutral-900 font-mono mb-1">{g.data?.count || 0}명</p>
                  <p className="text-xs text-neutral-500 font-medium font-mono">전체의 {g.data?.percentage || 0}%</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
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