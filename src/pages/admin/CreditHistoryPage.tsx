import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Search, Loader2, RefreshCw, Download, Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Calendar } from '../../components/ui/calendar';
import { ko } from 'date-fns/locale';

type ViewMode = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly';

function toDateStr(d: Date): string {
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

function getDefaults(mode: Exclude<ViewMode, 'all'>): { startDate: Date; endDate: Date } {
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

function formatLabel(mode: ViewMode, s: Date | null, e: Date | null): string {
  if (mode === 'all' || !s || !e) return '전체 기간';
  const koLocale = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('ko-KR', opts);
  if (mode === 'daily') {
    return `${koLocale(s, { year: 'numeric', month: 'long', day: 'numeric' })} ~ ${koLocale(e, { year: 'numeric', month: 'long', day: 'numeric' })}`;
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

function DailyPicker({ startDate, endDate, onChange }: { startDate: Date; endDate: Date; onChange: (s: Date, e: Date) => void }) {
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
          else if (r?.from) onChange(r.from, r.from);
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
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="p-1 hover:bg-neutral-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold whitespace-nowrap">{viewYear}년 {viewMonth + 1}월</span>
        <button type="button" onClick={nextMonth} className="p-1 hover:bg-neutral-100 rounded"><ChevronRight className="w-4 h-4" /></button>
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
          const { isS, isE } = isSelected(isoYear, isoWeek);
          const inR = inRange(isoYear, isoWeek);
          const isHighlight = isS || isE;
          return (
            <button
              key={`${isoYear}-W${isoWeek}`}
              type="button"
              onClick={() => handleClick(isoYear, isoWeek, monday, sunday)}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded text-xs transition-all text-left ${
                isHighlight ? 'text-white shadow-sm' : inR ? 'bg-blue-50 text-[#21358D]' : 'hover:bg-neutral-100 text-neutral-700'
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
        <button type="button" onClick={() => setViewYear(v => v - 1)} className="p-1 hover:bg-neutral-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold text-neutral-800 whitespace-nowrap">{viewYear}년</span>
        <button type="button" onClick={() => setViewYear(v => v + 1)} className="p-1 hover:bg-neutral-100 rounded"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <p className="text-[11px] text-neutral-400 text-center mb-2 whitespace-nowrap">{picking === 'start' ? '시작 월 선택' : '종료 월 선택'}</p>
      <div className="grid grid-cols-3 gap-2">
        {months.map((label, idx) => {
          const isS = startM?.y === viewYear && startM?.m === idx, isE = endM?.y === viewYear && endM?.m === idx;
          return (
            <button key={idx} type="button" onClick={() => handleClick(idx)}
              className={`h-9 rounded text-xs font-semibold transition-all whitespace-nowrap ${isS || isE ? 'text-white shadow-sm' : inRange(idx) ? 'bg-blue-50 text-[#21358D]' : 'hover:bg-neutral-100 text-neutral-700'}`}
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
        <button type="button" onClick={() => setBase(v => v - 10)} className="p-1 hover:bg-neutral-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold text-neutral-800 whitespace-nowrap">{base} ~ {base + 9}</span>
        <button type="button" onClick={() => setBase(v => v + 10)} className="p-1 hover:bg-neutral-100 rounded"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <p className="text-[11px] text-neutral-400 text-center mb-2 whitespace-nowrap">{picking === 'start' ? '시작 연도 선택' : '종료 연도 선택'}</p>
      <div className="grid grid-cols-2 gap-2">
        {years.map(y => {
          const isS = startY === y, isE = endY === y, inRange = startY !== null && endY !== null && y >= startY && y <= endY;
          return (
            <button key={y} type="button" onClick={() => handleClick(y)}
              className={`h-9 rounded text-xs font-semibold transition-all whitespace-nowrap ${isS || isE ? 'text-white shadow-sm' : inRange ? 'bg-blue-50 text-[#21358D]' : 'hover:bg-neutral-100 text-neutral-700'}`}
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

interface CreditTransaction {
  id: string;
  credit_id: string;
  user_id: string;
  amount: number;
  type: 'issue' | 'use' | 'expire' | 'refund' | 'revoke';
  order_id: string | null;
  description: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    hospital_name: string;
    email: string;
    login_id: string;
  } | null;
  order: {
    id: string;
    order_number: string;
  } | null;
  credit: {
    equipment_type: 'Density' | 'LinearZ';
  } | null;
}

export function CreditHistoryPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 팝오버 닫기
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'all') {
      setStartDate(null);
      setEndDate(null);
    } else {
      const d = getDefaults(mode);
      setStartDate(d.startDate);
      setEndDate(d.endDate);
    }
    setPickerOpen(false);
    setCurrentPage(1);
  };

  const handleRangeChange = (s: Date, e: Date) => {
    setStartDate(s);
    setEndDate(e);
    setCurrentPage(1);
    if (viewMode !== 'daily') setTimeout(() => setPickerOpen(false), 150);
  };

  const handlePresetDate = (days: number) => {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() - days);
    setEndDate(today);
    setStartDate(targetDate);
    setCurrentPage(1);
    setPickerOpen(false);
  };

  const fetchTransactions = async (page: number, size: number, search: string, type: string, equipment: string, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const startStr = startDate ? toDateStr(startDate) : '';
      const endStr = endDate ? toDateStr(endDate) : '';
      const result = await adminService.getAllCreditTransactions(page, size, search, type, startStr, endStr, equipment);
      setTransactions(result.data as CreditTransaction[]);
      setTotalCount(result.total);
    } catch (error) {
      console.error('크레딧 이력 조회 실패:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage, pageSize, searchTerm, typeFilter, equipmentFilter);
  }, [currentPage, pageSize, typeFilter, equipmentFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTransactions(1, pageSize, searchTerm, typeFilter, equipmentFilter);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactions(currentPage, pageSize, searchTerm, typeFilter, equipmentFilter, true);
    setIsRefreshing(false);
  };

  const handleExcelDownload = async () => {
    setIsDownloading(true);
    try {
      // 0은 전체 데이터 조회를 뜻함
      const startStr = toDateStr(startDate);
      const endStr = toDateStr(endDate);
      const result = await adminService.getAllCreditTransactions(0, 0, searchTerm, typeFilter, startStr, endStr, equipmentFilter);
      const allData = result.data as CreditTransaction[];
      
      const headers = ['일시', '아이디', '회원명', '병원명', '구분', '크레딧 종류', '변동 크레딧(원)', '상세내용', '관련 주문번호'];
      const body = allData.map(tx => {
        const typeLabels: Record<string, string> = {
          issue: '발급',
          use: '사용',
          refund: '취소환불',
          revoke: '관리자회수',
          expire: '기간만료'
        };
        const date = new Date(tx.created_at);
        const dateStr = date.toLocaleString('ko-KR');
        const sign = ['issue', 'refund'].includes(tx.type) ? '+' : '-';
        
        // ORD-... 형태의 주문번호 패턴 제거
        const cleanedDesc = tx.description ? tx.description.replace(/\s*\(ORD-[^)]+\)/g, '') : '-';
        const displayOrderNo = tx.order?.order_number || tx.order_id || '-';

        return [
          dateStr,
          tx.user?.login_id || '-',
          tx.user?.name || '-',
          tx.user?.hospital_name || '-',
          typeLabels[tx.type] || tx.type,
          tx.credit?.equipment_type || '-',
          `${sign}${tx.amount.toLocaleString()}`,
          cleanedDesc,
          displayOrderNo
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
      ws['!cols'] = [{ wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 30 }, { wch: 36 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '크레딧 거래 이력');
      
      const now = new Date();
      const dateSuffix = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
      XLSX.writeFile(wb, `전체크레딧이력_${dateSuffix}.xlsx`);
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const getTypeBadge = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'issue':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">발급</Badge>;
      case 'use':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">사용</Badge>;
      case 'refund':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">취소환불</Badge>;
      case 'revoke':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">관리자회수</Badge>;
      case 'expire':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">기간만료</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getAmountDisplay = (tx: CreditTransaction) => {
    const isPlus = ['issue', 'refund'].includes(tx.type);
    return (
      <span className={`font-semibold ${isPlus ? 'text-blue-600' : 'text-red-600'}`}>
        {isPlus ? '+' : '-'}₩{tx.amount.toLocaleString()}
      </span>
    );
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageBlock = 5;
  const blockStart = Math.floor((currentPage - 1) / pageBlock) * pageBlock + 1;
  const blockEnd = Math.min(blockStart + pageBlock - 1, totalPages);

  const modeLabel: Record<ViewMode, string> = { all: '전체', daily: '일별', weekly: '주별', monthly: '월별', yearly: '연도별' };
  const label = formatLabel(viewMode, startDate, endDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">크레딧 이력 관리</h2>
          <p className="text-sm text-neutral-600">회원들의 크레딧 충전, 사용, 환불 및 만료 이력을 통합하여 추적합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />새로고침
          </Button>
          <Button variant="outline" onClick={handleExcelDownload} disabled={isDownloading || transactions.length === 0} className="flex items-center gap-2">
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>엑셀 다운로드</span>
          </Button>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white border border-neutral-200 p-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
          {/* 검색어 입력 및 검색 버튼 */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="회원명, 병원명, 아이디 또는 이메일 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <Button type="submit" className="h-11 px-8 bg-neutral-900 text-white hover:bg-neutral-800">
              검색하기
            </Button>
          </div>

          {/* 필터 버튼 그룹 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-sm text-neutral-700 border-t border-neutral-100 pt-4">
            {/* 거래 유형 */}
            <div className="flex items-center gap-3">
              <span className="font-semibold w-16 text-neutral-500 shrink-0">거래 유형</span>
              <div className="flex flex-wrap items-center gap-1 bg-neutral-100 p-1 border border-neutral-200/60 rounded">
                {[
                  { value: 'all', label: '전체' },
                  { value: 'issue', label: '발급' },
                  { value: 'use', label: '사용' },
                  { value: 'refund', label: '취소환불' },
                  { value: 'revoke', label: '관리자회수' },
                  { value: 'expire', label: '기간만료' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setTypeFilter(opt.value); setCurrentPage(1); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                      typeFilter === opt.value ? 'text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
                    }`}
                    style={typeFilter === opt.value ? { backgroundColor: '#21358D' } : undefined}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 장비 구분 */}
            <div className="flex items-center gap-3">
              <span className="font-semibold w-16 text-neutral-500 shrink-0">장비 구분</span>
              <div className="flex flex-wrap items-center gap-1 bg-neutral-100 p-1 border border-neutral-200/60 rounded">
                {[
                  { value: 'all', label: '전체' },
                  { value: 'Density', label: 'Density' },
                  { value: 'POTENZA', label: 'POTENZA' },
                  { value: 'LinearZ', label: 'LINEARZ' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setEquipmentFilter(opt.value); setCurrentPage(1); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                      equipmentFilter === opt.value ? 'text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
                    }`}
                    style={equipmentFilter === opt.value ? { backgroundColor: '#21358D' } : undefined}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-700">
            <span className="font-medium mr-2">기간 조회</span>
            
            {/* 조회 단위 탭 */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 border border-neutral-200/60 rounded shrink-0">
              {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
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
                disabled={viewMode === 'all'}
                onClick={() => setPickerOpen(o => !o)}
                className={`flex items-center gap-2 px-4 py-2 rounded border text-sm font-medium transition-all ${
                  viewMode === 'all'
                    ? 'border-neutral-200 text-neutral-400 bg-neutral-50 cursor-not-allowed'
                    : pickerOpen
                      ? 'border-[#21358D] text-[#21358D] bg-blue-50/30'
                      : 'border-neutral-300 text-neutral-700 bg-white hover:border-neutral-400'
                }`}
              >
                <CalendarIcon className="w-4 h-4 shrink-0" />
                <span className="max-w-xs truncate">{label}</span>
              </button>

              {pickerOpen && (
                <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-lg border border-neutral-200 shadow-xl overflow-hidden animate-fadeIn">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 bg-neutral-50">
                    <span className="text-xs font-semibold text-neutral-600">
                      {viewMode === 'daily' ? '날짜 범위 선택' : viewMode === 'weekly' ? '주차 범위 선택' : viewMode === 'monthly' ? '월 범위 선택' : '연도 범위 선택'}
                    </span>
                    <button type="button" onClick={() => setPickerOpen(false)} className="p-0.5 hover:bg-neutral-200 rounded">
                      <X className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                  </div>

                  {viewMode === 'daily' && (
                    <DailyPicker startDate={startDate} endDate={endDate} onChange={handleRangeChange} />
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
                      <button type="button" onClick={() => setPickerOpen(false)} className="px-4 py-1.5 text-xs font-semibold rounded border border-neutral-300 text-neutral-600 hover:bg-neutral-50">
                        취소
                      </button>
                      <button type="button" onClick={() => setPickerOpen(false)} className="px-4 py-1.5 text-xs font-semibold rounded text-white" style={{ backgroundColor: '#21358D' }}>
                        적용
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* 테이블 영역 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="py-4 px-6 font-semibold text-neutral-700 w-16 text-center">No.</th>
                <th className="py-4 px-6 font-semibold text-neutral-700">일시</th>
                <th className="py-4 px-6 font-semibold text-neutral-700">회원 정보</th>
                <th className="py-4 px-6 font-semibold text-neutral-700">구분</th>
                <th className="py-4 px-6 font-semibold text-neutral-700">크레딧 종류</th>
                <th className="py-4 px-6 font-semibold text-neutral-700 text-right">변동 크레딧</th>
                <th className="py-4 px-6 font-semibold text-neutral-700">내용/메모</th>
                <th className="py-4 px-6 font-semibold text-neutral-700">관련 주문</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#21358D] mx-auto" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-neutral-400">
                    등록된 크레딧 거래 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                transactions.map((tx, idx) => {
                  const rowNo = (currentPage - 1) * pageSize + idx + 1;
                  const date = new Date(tx.created_at);
                  const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}`;
                  
                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-4 px-6 text-center text-neutral-400 font-mono">{rowNo}</td>
                      <td className="py-4 px-6 text-neutral-600 whitespace-nowrap">{dateStr}</td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-neutral-900">{tx.user?.hospital_name || '-'}</div>
                        <div className="text-xs text-neutral-500">{tx.user?.name} ({tx.user?.login_id})</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">{getTypeBadge(tx.type)}</td>
                      <td className="py-4 px-6 font-medium text-neutral-800 whitespace-nowrap">
                        {tx.credit?.equipment_type || '-'}
                      </td>
                      <td className="py-4 px-6 text-right font-medium">{getAmountDisplay(tx)}</td>
                      <td className="py-4 px-6 text-neutral-700 max-w-xs truncate" title={tx.description || ''}>
                        {tx.description ? tx.description.replace(/\s*\(ORD-[^)]+\)/g, '') : '-'}
                      </td>
                      <td className="py-4 px-6 text-neutral-500 font-mono text-xs">
                        {tx.order_id ? (
                          <button
                            onClick={() => navigate(`/admin/orders/${tx.order_id}`)}
                            className="text-[#21358D] hover:underline"
                          >
                            {tx.order?.order_number || tx.order_id}
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {!isLoading && transactions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <span>페이지당</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-neutral-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                {[10, 20, 50, 100].map(n => (
                  <option key={n} value={n}>{n}개</option>
                ))}
              </select>
              <span>/ 전체 {totalCount}건</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                이전
              </button>
              {Array.from({ length: blockEnd - blockStart + 1 }, (_, i) => blockStart + i).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 text-sm border ${
                    page === currentPage
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
