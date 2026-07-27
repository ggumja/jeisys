import { useState, useRef, useCallback, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router';
import { BarChart2, Clock, Download, CalendarIcon, X } from 'lucide-react';
import { Calendar } from '../../../components/ui/calendar';
import { ko } from 'date-fns/locale';

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Granularity = 'daily' | 'weekly' | 'monthly';

function getDefaults(): { startDate: Date; endDate: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 29);
  return { startDate: start, endDate: now };
}

// ── 일별 달력 팝오버 ───────────────────────────────────────────
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

// ── export 타입 ────────────────────────────────────────────────
export type VisitAnalyticsContext = {
  dateRange: string;
  granularity: Granularity;
  label: string;
  onRegisterExport: (fn: (() => Promise<void>) | null) => void;
};

// ── Layout 본체 ────────────────────────────────────────────────
export function VisitAnalyticsLayout() {
  const location = useLocation();
  const { startDate: defStart, endDate: defEnd } = getDefaults();

  const [startDate, setStartDate] = useState(defStart);
  const [endDate, setEndDate] = useState(defEnd);
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const exportFnRef = useRef<(() => Promise<void>) | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const onRegisterExport = useCallback((fn: (() => Promise<void>) | null) => {
    exportFnRef.current = fn;
  }, []);

  // 외부 클릭 시 달력 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dateRange = `custom:${toDateStr(startDate)}_${toDateStr(endDate)}`;
  const label = `${toDateStr(startDate)} ~ ${toDateStr(endDate)}`;

  const granularityOptions: { value: Granularity; label: string }[] = [
    { value: 'daily', label: '일별' },
    { value: 'weekly', label: '주별' },
    { value: 'monthly', label: '월별' },
  ];

  // 빠른 기간 선택
  const quickRanges = [
    { label: '오늘', days: 0 },
    { label: '7일', days: 7 },
    { label: '30일', days: 30 },
    { label: '90일', days: 90 },
  ];

  const applyQuickRange = (days: number) => {
    const now = new Date();
    if (days === 0) {
      setStartDate(now);
      setEndDate(now);
    } else {
      const start = new Date(now);
      start.setDate(now.getDate() - (days - 1));
      setStartDate(start);
      setEndDate(now);
    }
    setPickerOpen(false);
  };

  const tabs = [
    { path: '/admin/statistics/visit/count', label: '방문숫자', icon: BarChart2 },
    { path: '/admin/statistics/visit/duration', label: '쇼핑몰 체류시간', icon: Clock },
  ];

  const showDownloadBtn = !!exportFnRef.current;

  const handleDownloadReport = async () => {
    if (!exportFnRef.current) {
      alert('현재 탭에서 다운로드할 데이터가 없습니다.');
      return;
    }
    setIsDownloading(true);
    try {
      await exportFnRef.current();
    } finally {
      setIsDownloading(false);
    }
  };

  if (
    location.pathname === '/admin/statistics/visit' ||
    location.pathname === '/admin/statistics/visit/'
  ) {
    return <Navigate to="/admin/statistics/visit/count" replace />;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">방문 분석</h1>
          <p className="text-sm text-neutral-600">쇼핑몰 방문 현황과 페이지별 사용 행동을 분석합니다.</p>
        </div>
        {showDownloadBtn && (
          <button
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading
              ? <span className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
              : <Download className="w-4 h-4" />
            }
            보고서 다운로드
          </button>
        )}
      </div>

      {/* 필터 바 */}
      <div className="bg-white border border-neutral-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
        {/* 집계 단위 */}
        <div className="flex items-center gap-1 bg-neutral-100 rounded p-0.5">
          {granularityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGranularity(opt.value)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                granularity === opt.value
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 빠른 기간 */}
        <div className="flex items-center gap-1">
          {quickRanges.map((r) => (
            <button
              key={r.label}
              onClick={() => applyQuickRange(r.days)}
              className="px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded hover:bg-neutral-50 text-neutral-600 transition-colors"
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* 날짜 범위 선택 */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-1.5 border border-neutral-200 rounded text-sm text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
          >
            <CalendarIcon className="w-4 h-4 text-neutral-400" />
            <span>{label}</span>
            {pickerOpen && (
              <X className="w-3 h-3 text-neutral-400" onClick={(e) => { e.stopPropagation(); setPickerOpen(false); }} />
            )}
          </button>

          {pickerOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-neutral-200 rounded-lg shadow-xl">
              <DailyPicker
                startDate={startDate}
                endDate={endDate}
                onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
              />
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
            </div>
          )}
        </div>
      </div>

      {/* 상단 탭 바 */}
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
        <Outlet context={{ dateRange, granularity, onRegisterExport, label } as VisitAnalyticsContext} />
      </div>
    </div>
  );
}
