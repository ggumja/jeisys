import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router';
import { CalendarIcon, CalendarCheck, Coins, TrendingUp, Sparkles, Building2, Search, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from '../../../components/ui/calendar';
import { ko } from 'date-fns/locale';
import { adminService, CreditClosingRow } from '../../../services/adminService';

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CreditClosingPage() {
  const { onRegisterExport } = useOutletContext<{ onRegisterExport?: (fn: (() => void) | null) => void }>() || {};
  const navigate = useNavigate();

  // 특정 일자 기준 (기본값: 오늘 날짜)
  const [closingDate, setClosingDate] = useState<Date>(() => new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // 필터 및 상태
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 데이터
  const [isLoading, setIsLoading] = useState(true);
  const [closingData, setClosingData] = useState<{ summary: any; customerList: CreditClosingRow[] }>({
    summary: { totalIssued: 0, totalUsed: 0, totalRemaining: 0, totalExpired: 0 },
    customerList: [],
  });

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

  // 월마감 데이터 Fetch
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const targetDateStr = toDateStr(closingDate);
        const res = await adminService.getCreditClosingStats(targetDateStr, equipmentFilter);
        setClosingData(res);
        setCurrentPage(1);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [closingDate, equipmentFilter]);

  // CSV 다운로드 등록
  const exportToCSV = useCallback(() => {
    if (!closingData.customerList.length) return;
    const targetDateStr = toDateStr(closingDate);
    const headers = ['고객사(병원명)', '회원명', 'SAP 고객코드', '선택기준일 발행액', '선택기준일 사용액', '선택기준일 만료액', '기준일시 잔액'];
    const rows = closingData.customerList.map(c => [
      `"${c.hospitalName}"`,
      `"${c.userName}"`,
      `"${c.sapCode}"`,
      c.totalIssued,
      c.totalUsed,
      c.totalExpired,
      c.remainingAmount
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `크레딧월마감_${targetDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [closingData.customerList, closingDate]);

  useEffect(() => {
    if (onRegisterExport) {
      onRegisterExport(exportToCSV);
    }
    return () => {
      if (onRegisterExport) onRegisterExport(null);
    };
  }, [onRegisterExport, exportToCSV]);

  const { summary, customerList } = closingData;

  // 검색 필터링
  const filteredCustomers = customerList.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.hospitalName.toLowerCase().includes(q) ||
      item.userName.toLowerCase().includes(q) ||
      item.sapCode.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* 상단 일자 지정 및 장비 필터 Bar */}
      <div className="bg-white border border-neutral-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#21358D]" />
            <span className="text-sm font-semibold text-neutral-800">마감 기준일자 선택:</span>
          </div>

          {/* 일자 픽버 팝오버 */}
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setPickerOpen(o => !o)}
              className={`flex items-center gap-2 px-4 py-2 rounded border text-sm font-semibold transition-all ${
                pickerOpen
                  ? 'border-[#21358D] text-[#21358D] bg-blue-50/30'
                  : 'border-neutral-300 text-neutral-800 bg-white hover:border-neutral-400'
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-[#21358D]" />
              <span>{toDateStr(closingDate)}</span>
            </button>

            {pickerOpen && (
              <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-lg border border-neutral-200 shadow-xl p-3 animate-fadeIn">
                <div className="text-xs font-semibold text-neutral-600 mb-2 border-b pb-1">
                  마감 기준일 지정
                </div>
                <Calendar
                  mode="single"
                  selected={closingDate}
                  onSelect={(date) => {
                    if (date) {
                      setClosingDate(date);
                      setPickerOpen(false);
                    }
                  }}
                  locale={ko}
                />
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-neutral-200" />

          {/* 장비 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-600">장비 구분</span>
            <div className="flex gap-1">
              {[{ value: 'all', label: '전체' }, { value: 'Density', label: 'Density' }, { value: 'POTENZA', label: 'POTENZA' }, { value: 'LinearZ', label: 'LINEARZ' }].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEquipmentFilter(opt.value)}
                  className={`px-3 py-1.5 text-xs font-semibold border transition-all ${
                    equipmentFilter === opt.value
                      ? 'text-white border-[#21358D]'
                      : 'border-neutral-300 text-neutral-600 bg-white hover:border-neutral-400 hover:bg-neutral-50'
                  }`}
                  style={equipmentFilter === opt.value ? { backgroundColor: '#21358D' } : undefined}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-neutral-500 font-medium">
          * 지정된 기준일자(23:59:59) 시점까지의 누적 크레딧 합계 및 보유 현황입니다.
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
        </div>
      ) : (
        <>
          {/* 기준일자 누적 지표 카드 */}
          <div className="flex flex-row flex-nowrap overflow-x-auto pb-1 gap-3 scrollbar-thin">
            {/* 기준일 기준 누적 발행액 */}
            <div className="bg-white border border-neutral-200 p-5 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 bg-blue-50 text-[#21358D] rounded">
                  <Coins className="w-4 h-4" />
                </div>
                <span className="text-xs text-neutral-600 font-semibold">기준일 누적 발행액</span>
              </div>
              <p className="text-lg font-bold text-neutral-900 leading-tight">₩{summary.totalIssued.toLocaleString()}</p>
              <p className="text-xs text-neutral-400 mt-1 font-medium whitespace-nowrap">{toDateStr(closingDate)} 이전 누적 충전</p>
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#21358D]/5 rounded-full translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
            </div>

            {/* 기준일 기준 누적 사용액 */}
            <div className="bg-white border border-neutral-200 p-5 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 bg-green-50 text-green-600 rounded">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs text-neutral-600 font-semibold">기준일 누적 차감액</span>
              </div>
              <p className="text-lg font-bold text-neutral-900 leading-tight">₩{summary.totalUsed.toLocaleString()}</p>
              <p className="text-xs text-neutral-400 mt-1 font-medium whitespace-nowrap">{toDateStr(closingDate)} 이전 누적 소진</p>
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
            </div>

            {/* 기준일 기준 누적 만료액 */}
            <div className="bg-white border border-neutral-200 p-5 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 bg-red-50 text-red-600 rounded">
                  <Coins className="w-4 h-4" />
                </div>
                <span className="text-xs text-neutral-600 font-semibold">기준일 누적 만료액</span>
              </div>
              <p className="text-lg font-bold text-neutral-900 leading-tight">₩{summary.totalExpired.toLocaleString()}</p>
              <p className="text-xs text-neutral-400 mt-1 font-medium whitespace-nowrap">{toDateStr(closingDate)} 이전 누적 소멸</p>
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
            </div>

            {/* 기준일 시점 보유 잔액 */}
            <div className="bg-white border border-neutral-200 p-5 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 bg-purple-50 text-purple-600 rounded">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs text-neutral-600 font-semibold">기준일 시점 보유 잔액</span>
              </div>
              <p className="text-lg font-bold text-neutral-900 leading-tight">₩{summary.totalRemaining.toLocaleString()}</p>
              <p className="text-xs text-neutral-400 mt-1 font-medium whitespace-nowrap">발행액 - (차감액 + 만료액)</p>
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
            </div>
          </div>

          {/* 고객사별 마감 보유 현황 테이블 */}
          <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#21358D]" />
                  <span>고객사별 마감 크레딧 보유 현황</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  {toDateStr(closingDate)} 기준 각 고객사(병원)별 크레딧 발행, 사용, 만료 및 최종 잔액 리스트입니다.
                </p>
              </div>

              {/* 검색창 */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="병원명 / 회원명 / SAP코드 검색..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded focus:outline-none focus:border-[#21358D]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="py-4 px-6 font-semibold text-neutral-700">고객사(병원명)</th>
                    <th className="py-4 px-6 font-semibold text-neutral-700">회원명</th>
                    <th className="py-4 px-6 font-semibold text-neutral-700">SAP 고객코드</th>
                    <th className="py-4 px-6 font-semibold text-neutral-700 text-right">누적 발행액</th>
                    <th className="py-4 px-6 font-semibold text-neutral-700 text-right">누적 차감액</th>
                    <th className="py-4 px-6 font-semibold text-neutral-700 text-right">누적 만료액</th>
                    <th className="py-4 px-6 font-semibold text-neutral-700 text-right">기준일 잔액</th>
                    <th className="py-4 px-6 font-semibold text-neutral-700 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-sans">
                  {paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-neutral-400">
                        {searchQuery ? '검색 결과와 일치하는 고객사가 없습니다.' : '마감 크레딧 데이터가 존재하지 않습니다.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((row) => (
                      <tr key={row.userId} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-4 px-6 font-medium text-neutral-900">{row.hospitalName}</td>
                        <td className="py-4 px-6 text-neutral-700">{row.userName}</td>
                        <td className="py-4 px-6 text-neutral-500 font-mono text-xs">{row.sapCode}</td>
                        <td className="py-4 px-6 text-right font-medium text-neutral-900">₩{row.totalIssued.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right font-medium text-green-600">₩{row.totalUsed.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right font-medium text-red-500">₩{row.totalExpired.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right font-bold text-[#21358D]">₩{row.remainingAmount.toLocaleString()}</td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => navigate('/admin/statistics/credits/history', { state: { searchUser: row.userName } })}
                            className="inline-flex items-center gap-1 text-xs text-[#21358D] hover:underline font-semibold"
                          >
                            <span>내역보기</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 페이징 컨트롤 */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-neutral-200 flex items-center justify-between bg-neutral-50">
                <span className="text-xs text-neutral-500">
                  전체 {filteredCustomers.length}개 항목 중 {((currentPage - 1) * itemsPerPage) + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} 표시
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded border border-neutral-300 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-xs font-semibold text-neutral-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded border border-neutral-300 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
