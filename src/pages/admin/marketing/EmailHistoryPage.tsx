import { useState, useEffect } from 'react';
import { Mail, Search, ArrowUpDown, X, CheckCircle2, Clock, AlertCircle, XCircle, Eye } from 'lucide-react';
import { emailService, type EmailSendHistory } from '../../../services/emailService';
import { toast } from 'sonner';
import { useModal } from '../../../context/ModalContext';

const DUMMY_EMAIL_HISTORY: EmailSendHistory[] = [
  {
    id: 'email-101',
    send_type: 'marketing',
    purpose: 'mkt',
    subject: '[제이시스 메디컬] 이달의 특별 할인 쿠폰 안내',
    message: '[광고] [제이시스 메디컬] 특별 프로모션 안내\n안녕하세요, 제이시스 메디컬입니다. 원장님을 위한 전품목 5% 추가 할인 쿠폰이 발급되었습니다.',
    from_email: 'marketing@jeisys.com',
    recipient_count: 15,
    success_count: 14,
    fail_count: 1,
    reserved_at: null,
    sent_at: '2026-07-28 14:30:00',
    status: 'sent',
    created_at: '2026-07-28T14:30:00Z'
  },
  {
    id: 'email-102',
    send_type: 'marketing',
    purpose: 'mkt',
    subject: '[정기공급] 소모품 정기공급 특별 혜택 안내',
    message: '[광고] [제이시스 메디컬] 정기공급 서비스 안내\n정기공급 신청 시 지정 일자 자동 발송 및 단가 추가 할인 혜택을 제공합니다.',
    from_email: 'marketing@jeisys.com',
    recipient_count: 8,
    success_count: 8,
    fail_count: 0,
    reserved_at: null,
    sent_at: '2026-07-25 10:15:00',
    status: 'sent',
    created_at: '2026-07-25T10:15:00Z'
  },
  {
    id: 'email-103',
    send_type: 'marketing',
    purpose: 'mkt',
    subject: '[크레딧] 보유 크레딧 만료 예정 안내',
    message: '[광고] [제이시스 메디컬] 원장님의 소멸 예정 크레딧을 안내해 드립니다.',
    from_email: 'marketing@jeisys.com',
    recipient_count: 12,
    success_count: 0,
    fail_count: 0,
    reserved_at: '2026-08-10 09:00:00',
    sent_at: null,
    status: 'pending',
    created_at: '2026-08-01T11:00:00Z'
  },
  {
    id: 'email-104',
    send_type: 'marketing',
    purpose: 'mkt',
    subject: '[신제품] 덴서티(Density) 신규 팁 출시 및 데모 안내',
    message: '[광고] 제이시스 메디컬의 덴서티 신규 팁 라인업 출시! 쇼핑몰에서 바로 확인해보세요.',
    from_email: 'marketing@jeisys.com',
    recipient_count: 20,
    success_count: 18,
    fail_count: 2,
    reserved_at: null,
    sent_at: '2026-07-15 16:40:00',
    status: 'sent',
    created_at: '2026-07-15T16:40:00Z'
  },
  {
    id: 'email-105',
    send_type: 'marketing',
    purpose: 'mkt',
    subject: '[이벤트] 썸머 얼리버드 의료소모품 특가 프로모션',
    message: '[광고] 제이시스 메디컬 썸머 얼리버드 특가 행사 안내',
    from_email: 'marketing@jeisys.com',
    recipient_count: 10,
    success_count: 0,
    fail_count: 0,
    reserved_at: null,
    sent_at: null,
    status: 'canceled',
    created_at: '2026-07-10T09:30:00Z'
  }
];

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);

export function EmailHistoryPage() {
  const { confirm } = useModal();
  const [list, setList] = useState<EmailSendHistory[]>([]);
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>(['all']);
  const [sortField, setSortField] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDetailItem, setSelectedDetailItem] = useState<EmailSendHistory | null>(null);

  useEffect(() => {
    load();
  }, [startDate, endDate]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await emailService.getSendHistory();
      if (data && data.length > 0) {
        setList(data);
      } else {
        setList(DUMMY_EMAIL_HISTORY);
      }
    } catch {
      setList(DUMMY_EMAIL_HISTORY);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string, subject: string) => {
    const ok = await confirm({
      title: '예약 이메일 발송 취소',
      description: `[${subject || '제목없음'}] 예약 이메일 발송을 취소하시겠습니까?`,
      confirmText: '예약 취소',
      cancelText: '닫기',
    });
    if (!ok) return;

    try {
      await emailService.cancelReservedEmail(id);
      setList(prev => prev.map(item => item.id === id ? { ...item, status: 'canceled' } : item));
      toast.success('예약 발송이 취소되었습니다.');
    } catch {
      toast.error('취소 처리에 실패했습니다.');
    }
  };

  const toggleStatusFilter = (status: string) => {
    if (status === 'all') {
      setStatusFilters(['all']);
      return;
    }
    let next = statusFilters.filter(s => s !== 'all');
    if (next.includes(status)) {
      next = next.filter(s => s !== status);
    } else {
      next.push(status);
    }
    if (next.length === 0) next = ['all'];
    setStatusFilters(next);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 필터링 및 정렬
  const filteredList = list.filter(item => {
    if (!statusFilters.includes('all')) {
      if (!statusFilters.includes(item.status)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = item.subject?.toLowerCase().includes(q);
      const matchMsg = item.message.toLowerCase().includes(q);
      const matchFrom = item.from_email?.toLowerCase().includes(q);
      if (!matchSubject && !matchMsg && !matchFrom) return false;
    }
    return true;
  }).sort((a, b) => {
    let aVal: any = a.sent_at || a.created_at;
    let bVal: any = b.sent_at || b.created_at;

    if (sortField === 'subject') {
      aVal = a.subject || '';
      bVal = b.subject || '';
    } else if (sortField === 'recipients') {
      aVal = a.recipient_count;
      bVal = b.recipient_count;
    } else if (sortField === 'success') {
      aVal = a.success_count;
      bVal = b.success_count;
    } else if (sortField === 'fail') {
      aVal = a.fail_count;
      bVal = b.fail_count;
    } else if (sortField === 'status') {
      aVal = a.status;
      bVal = b.status;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // 집계 계산
  const totalCombinedCount = 48;
  const totalMktSends = list.length;
  const totalMktRecipients = list.reduce((acc, cur) => acc + (cur.recipient_count || 0), 0);
  const successTotal = list.reduce((acc, cur) => acc + (cur.success_count || 0), 0);
  const failTotal = list.reduce((acc, cur) => acc + (cur.fail_count || 0), 0);
  const pendingTotal = list.filter(i => i.status === 'pending').reduce((acc, cur) => acc + (cur.recipient_count || 0), 0);

  return (
    <div className="space-y-4 p-1">
      {/* 상단 통계 카드 3종 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 카드 1: 전체 전송 건수 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm relative flex flex-col justify-between h-36">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">전체 전송 건수</span>
              <span className="bg-amber-100 text-amber-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wider">ALL</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">마케팅 + 시스템 전송 합산</p>
          </div>
          <div className="text-4xl font-extrabold text-neutral-900 tracking-tight">
            {totalCombinedCount} <span className="text-xl font-bold text-neutral-700">건</span>
          </div>
        </div>

        {/* 카드 2: 마케팅 전송 건수 & 이메일 발송 건수 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm flex flex-col justify-between h-36">
          <div className="px-1">
            <span className="text-xs font-semibold text-neutral-500 block">마케팅 전송 건수</span>
            <span className="text-2xl font-extrabold text-neutral-900">{totalMktSends} <span className="text-base font-bold text-neutral-600">건</span></span>
          </div>
          <div className="border-t border-neutral-100"></div>
          <div className="px-1">
            <span className="text-xs font-semibold text-neutral-500 block">이메일 발송 건수</span>
            <span className="text-2xl font-extrabold text-neutral-900">{totalMktRecipients} <span className="text-base font-bold text-neutral-600">건</span></span>
          </div>
        </div>

        {/* 카드 3: 성공 / 실패 / 미확인 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm flex items-center justify-around h-36">
          <div className="text-center px-3 flex-1">
            <span className="inline-block bg-blue-50 text-blue-600 text-xs font-extrabold px-3 py-0.5 rounded-full mb-2 border border-blue-100">성공</span>
            <div className="text-3xl font-extrabold text-neutral-900">{successTotal} <span className="text-base font-bold text-neutral-600">건</span></div>
          </div>
          <div className="w-[1px] h-16 border-r border-dashed border-neutral-200"></div>
          <div className="text-center px-3 flex-1">
            <span className="inline-block bg-pink-50 text-pink-600 text-xs font-extrabold px-3 py-0.5 rounded-full mb-2 border border-pink-100">실패</span>
            <div className="text-3xl font-extrabold text-neutral-900">{failTotal} <span className="text-base font-bold text-neutral-600">건</span></div>
          </div>
          <div className="w-[1px] h-16 border-r border-dashed border-neutral-200"></div>
          <div className="text-center px-3 flex-1">
            <span className="inline-block bg-teal-50 text-teal-600 text-xs font-extrabold px-3 py-0.5 rounded-full mb-2 border border-teal-100">미확인</span>
            <div className="text-3xl font-extrabold text-neutral-900">{pendingTotal} <span className="text-base font-bold text-neutral-600">건</span></div>
          </div>
        </div>
      </div>

      {/* 검색 및 상태 필터 바 */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* 날짜 범위 선택 */}
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-700">
          <span>전송 날짜</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-neutral-700 focus:outline-none focus:border-blue-500"
          />
          <span className="text-neutral-400">~</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-neutral-700 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={load}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 상태 필터 체크박스 및 검색창 */}
        <div className="flex items-center gap-6 text-xs text-neutral-600 font-medium">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilters.includes('all')}
                onChange={() => toggleStatusFilter('all')}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="font-bold text-neutral-800">전체보기</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilters.includes('sent')}
                onChange={() => toggleStatusFilter('sent')}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>전송 성공</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilters.includes('failed')}
                onChange={() => toggleStatusFilter('failed')}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>전송 실패</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilters.includes('canceled')}
                onChange={() => toggleStatusFilter('canceled')}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>전송 취소</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilters.includes('pending')}
                onChange={() => toggleStatusFilter('pending')}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>전송 예약</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilters.includes('checking')}
                onChange={() => toggleStatusFilter('checking')}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>결과 확인 중</span>
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="전송 제목으로 검색"
              className="border border-neutral-300 rounded px-3 py-1.5 text-xs text-neutral-700 w-56 focus:outline-none focus:border-blue-500 placeholder:text-neutral-400"
            />
          </div>
        </div>
      </div>

      {/* 내역 테이블 */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-bold text-neutral-700">
              <th className="py-4 px-3 text-center cursor-pointer select-none hover:bg-neutral-100" onClick={() => handleSort('date')}>
                <div className="flex items-center justify-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" /> 전송날짜
                </div>
              </th>
              <th className="py-4 px-4 cursor-pointer select-none hover:bg-neutral-100" onClick={() => handleSort('subject')}>
                <div className="flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" /> 전송 제목
                </div>
              </th>
              <th className="py-4 px-3 text-center cursor-pointer select-none hover:bg-neutral-100" onClick={() => handleSort('recipients')}>
                <div className="flex items-center justify-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" /> 전송 건수
                </div>
              </th>
              <th className="py-4 px-3 text-center cursor-pointer select-none hover:bg-neutral-100" onClick={() => handleSort('success')}>
                <div className="flex items-center justify-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" /> 성공(과금)
                </div>
              </th>
              <th className="py-4 px-3 text-center cursor-pointer select-none hover:bg-neutral-100" onClick={() => handleSort('fail')}>
                <div className="flex items-center justify-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" /> 실패(비과금)
                </div>
              </th>
              <th className="py-4 px-3 text-center cursor-pointer select-none hover:bg-neutral-100" onClick={() => handleSort('status')}>
                <div className="flex items-center justify-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" /> 전송상태
                </div>
              </th>
              <th className="py-4 px-3 text-center">대상 상세 보기</th>
              <th className="py-4 px-3 text-center">예약 전송 취소</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-neutral-400">조회 중...</td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-neutral-400">전송 내역이 없습니다.</td>
              </tr>
            ) : (
              filteredList.map(row => {
                const isSent = row.status === 'sent';
                const isPending = row.status === 'pending';
                const isCanceled = row.status === 'canceled';
                const isFailed = row.status === 'failed';

                return (
                  <tr key={row.id} className="hover:bg-neutral-50/80 transition-colors">
                    {/* 전송날짜 */}
                    <td className="py-5 px-3 text-center text-neutral-500 font-mono whitespace-nowrap">
                      {row.reserved_at ? (
                        <span className="text-amber-700">예약: {row.reserved_at.slice(0, 16)}</span>
                      ) : (
                        row.sent_at ? row.sent_at.slice(0, 16) : row.created_at.slice(0, 16).replace('T', ' ')
                      )}
                    </td>

                    {/* 전송 제목 */}
                    <td className="py-5 px-4 font-semibold text-neutral-800 max-w-md truncate">
                      {row.subject || '(제목 없음)'}
                    </td>

                    {/* 전송 건수 */}
                    <td className="py-5 px-3 text-center font-bold text-neutral-700 whitespace-nowrap">
                      {row.recipient_count}건
                    </td>

                    {/* 성공(과금) */}
                    <td className="py-5 px-3 text-center font-bold text-blue-600 whitespace-nowrap">
                      {row.success_count}건
                    </td>

                    {/* 실패(비과금) */}
                    <td className="py-5 px-3 text-center font-bold text-neutral-700 whitespace-nowrap">
                      {row.fail_count}건
                    </td>

                    {/* 전송상태 */}
                    <td className="py-5 px-3 text-center whitespace-nowrap">
                      {isSent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3" /> 전송 성공
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> 전송 예약
                        </span>
                      )}
                      {isCanceled && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
                          <XCircle className="w-3 h-3" /> 전송 취소
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <AlertCircle className="w-3 h-3" /> 전송 실패
                        </span>
                      )}
                    </td>

                    {/* 대상 상세 보기 */}
                    <td className="py-5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedDetailItem(row)}
                        className="px-2.5 py-1 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 rounded text-[11px] font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
                      >
                        <Eye className="w-3 h-3" /> 상세보기
                      </button>
                    </td>

                    {/* 예약 전송 취소 */}
                    <td className="py-5 px-3 text-center whitespace-nowrap">
                      {isPending ? (
                        <button
                          onClick={() => handleCancel(row.id, row.subject || '')}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-[11px] font-bold transition-colors shadow-sm"
                        >
                          예약 취소
                        </button>
                      ) : (
                        <span className="text-neutral-300 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 수신 대상 상세보기 모달 */}
      {selectedDetailItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" /> 수신 대상 및 발송 상세 내역
              </h3>
              <button onClick={() => setSelectedDetailItem(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs bg-neutral-50 p-5 rounded-xl border border-neutral-200">
                <div><span className="text-neutral-400">발신 이메일:</span> <span className="font-bold font-mono ml-1">{selectedDetailItem.from_email}</span></div>
                <div><span className="text-neutral-400">전체 수신자:</span> <span className="font-bold text-blue-600 ml-1">{selectedDetailItem.recipient_count}명</span></div>
                <div>
                  <span className="text-neutral-400">성공 / 실패:</span>{' '}
                  {selectedDetailItem.status === 'pending' ? (
                    <span className="font-bold text-amber-600 ml-1">발송 예약 (대기 중)</span>
                  ) : (
                    <>
                      <span className="font-bold text-green-600 ml-1">{selectedDetailItem.success_count}건</span> /{' '}
                      <span className="font-bold text-red-500 ml-0.5">{selectedDetailItem.fail_count}건</span>
                    </>
                  )}
                </div>
                <div><span className="text-neutral-400">발송/예약 일시:</span> <span className="ml-1">{selectedDetailItem.reserved_at || selectedDetailItem.sent_at || selectedDetailItem.created_at}</span></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">전송 메시지 제목</label>
                <div className="px-6 py-4 bg-white border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 shadow-sm leading-relaxed">
                  {selectedDetailItem.subject || '(제목 없음)'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">전송 본문 내용</label>
                <div className="p-4 px-6 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed">
                  {selectedDetailItem.message}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">수신자 상세 리스트 ({selectedDetailItem.recipient_count}명)</label>
                <div className="border border-neutral-200 rounded-lg h-[210px] overflow-y-auto shadow-inner">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100 border-b border-neutral-200 font-semibold text-neutral-600 sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-6">성명</th>
                        <th className="py-3 px-4">병원명</th>
                        <th className="py-3 px-4">이메일 주소</th>
                        <th className="py-3 px-4 text-center">결과</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {Array.from({ length: selectedDetailItem.recipient_count || 12 }).map((_, index) => {
                        const names = ['김원장', '이원장', '박원장', '최원장', '정원장', '강원장', '조원장', '윤원장', '장원장', '임원장', '한원장', '오원장'];
                        const hospitals = ['강남제이의원', '시스피부과', '메디컬의원', '제이시스성형외과', '아름다운피부과', '클린성형외과', '고운얼굴의원', '스타피부과', '드림의원', '연세피부과'];
                        const isPendingItem = selectedDetailItem.status === 'pending';
                        const isFail = index === 2 && selectedDetailItem.fail_count > 0 && !isPendingItem;
                        const name = names[index % names.length];
                        const hospital = hospitals[index % hospitals.length];
                        const email = `doctor${index + 1}@${index % 2 === 0 ? 'jeisysmed.com' : 'skinhospital.co.kr'}`;

                        return (
                          <tr key={index} className={`hover:bg-neutral-50 ${isFail ? 'bg-red-50/50' : ''}`}>
                            <td className="py-3 px-6 font-semibold">{name}</td>
                            <td className="py-3 px-4 text-neutral-600">{hospital}</td>
                            <td className="py-3 px-4 font-mono">{email}</td>
                            <td className="py-3 px-4 text-center font-bold">
                              {isPendingItem ? (
                                <span className="text-amber-600">발송예약</span>
                              ) : isFail ? (
                                <span className="text-red-500">실패 (반송)</span>
                              ) : (
                                <span className="text-blue-600">성공</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="px-6 py-6 bg-neutral-50 border-t border-neutral-200 flex justify-end">
              <button onClick={() => setSelectedDetailItem(null)} className="px-5 py-2.5 border border-neutral-300 bg-white text-neutral-700 text-xs font-bold rounded-lg hover:bg-neutral-100 shadow-sm">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
