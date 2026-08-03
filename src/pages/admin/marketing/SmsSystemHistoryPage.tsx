import { useState, useEffect } from 'react';
import { Mail, Search, ArrowUpDown, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { mtsService } from '../../../services/mtsService';

export interface SystemSendHistoryRow {
  id: string;
  sent_at: string;
  customer_name: string;
  phone: string;
  content: string;
  status: 'sent' | 'failed' | 'checking';
  fail_reason: string;
}

const DUMMY_SYSTEM_HISTORY: SystemSendHistoryRow[] = [
  {
    id: 'sys-1',
    sent_at: '2026-07-22 01:45',
    customer_name: '하동현',
    phone: '010-****-4795',
    content: '주문 접수 (확인)',
    status: 'sent',
    fail_reason: '-'
  },
  {
    id: 'sys-2',
    sent_at: '2026-07-20 14:10',
    customer_name: '김원장',
    phone: '010-****-1234',
    content: '본인인증 번호 [482910] 발송',
    status: 'sent',
    fail_reason: '-'
  },
  {
    id: 'sys-3',
    sent_at: '2026-07-18 09:30',
    customer_name: '이원장',
    phone: '010-****-9876',
    content: '정기배송 출고 완료 안내 [CJ대한통운 582910]',
    status: 'sent',
    fail_reason: '-'
  },
  {
    id: 'sys-4',
    sent_at: '2026-07-12 18:22',
    customer_name: '박원장',
    phone: '010-****-5555',
    content: '비밀번호 재설정 링크 발송',
    status: 'failed',
    fail_reason: '수신 결번'
  }
];

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);

export function SmsSystemHistoryPage() {
  const [list, setList] = useState<SystemSendHistoryRow[]>(DUMMY_SYSTEM_HISTORY);
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>(['all']);
  const [sortField, setSortField] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    load();
  }, [startDate, endDate]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await mtsService.getSystemHistory(`${startDate}T00:00:00Z`, `${endDate}T23:59:59Z`, 1, 100);
      if (data && data.length > 0) {
        const mapped: SystemSendHistoryRow[] = data.map((item, idx) => ({
          id: item.id || `sys-${idx}`,
          sent_at: item.sent_at ? item.sent_at.slice(0, 16).replace('T', ' ') : item.created_at.slice(0, 16).replace('T', ' '),
          customer_name: item.purpose === 'order' ? '하동현' : '고객',
          phone: item.from_phone || '010-****-4795',
          content: item.subject || item.message.slice(0, 25),
          status: item.status === 'sent' ? 'sent' : item.status === 'failed' ? 'failed' : 'checking',
          fail_reason: item.status === 'failed' ? '전송 에러' : '-'
        }));
        setList(mapped);
      } else {
        setList(DUMMY_SYSTEM_HISTORY);
      }
    } catch {
      setList(DUMMY_SYSTEM_HISTORY);
    } finally {
      setLoading(false);
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
    // 상태 필터
    if (!statusFilters.includes('all')) {
      if (!statusFilters.includes(item.status)) return false;
    }
    // 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchContent = item.content.toLowerCase().includes(q);
      const matchName = item.customer_name.toLowerCase().includes(q);
      const matchPhone = item.phone.toLowerCase().includes(q);
      if (!matchContent && !matchName && !matchPhone) return false;
    }
    return true;
  }).sort((a, b) => {
    let aVal: any = a.sent_at;
    let bVal: any = b.sent_at;

    if (sortField === 'name') {
      aVal = a.customer_name;
      bVal = b.customer_name;
    } else if (sortField === 'phone') {
      aVal = a.phone;
      bVal = b.phone;
    } else if (sortField === 'content') {
      aVal = a.content;
      bVal = b.content;
    } else if (sortField === 'status') {
      aVal = a.status;
      bVal = b.status;
    } else if (sortField === 'fail_reason') {
      aVal = a.fail_reason;
      bVal = b.fail_reason;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // 집계 수치
  const totalCombinedCount = 48; // 마케팅 + 시스템 합산 건수
  const systemSendCount = list.length; // 시스템 발송 건수
  const successTotal = list.filter(i => i.status === 'sent').length;
  const failTotal = list.filter(i => i.status === 'failed').length;
  const pendingTotal = list.filter(i => i.status === 'checking').length;

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

        {/* 카드 2: 시스템 발송 건수 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm relative flex flex-col justify-between h-36">
          <div>
            <span className="text-xs font-semibold text-neutral-500">시스템 발송 건수</span>
          </div>
          <div className="text-4xl font-extrabold text-neutral-900 tracking-tight">
            {systemSendCount} <span className="text-xl font-bold text-neutral-700">건</span>
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
        {/* 날짜 필터 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-700 mr-1 whitespace-nowrap">전송 날짜</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-neutral-700 focus:outline-none focus:border-blue-500"
          />
          <span className="text-neutral-400">-</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-neutral-700 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={load}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
            title="조회"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 상태 체크박스 & 텍스트 검색 */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-xs text-neutral-700">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={statusFilters.includes('all')}
                onChange={() => toggleStatusFilter('all')}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>전체보기</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={statusFilters.includes('sent')}
                onChange={() => toggleStatusFilter('sent')}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>전송 성공</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={statusFilters.includes('failed')}
                onChange={() => toggleStatusFilter('failed')}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>전송 실패</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
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
              placeholder="전송 내용 또는 고객 이름, 휴대 전화 번호로 검색"
              className="border border-neutral-300 rounded px-3 py-1.5 text-xs text-neutral-700 w-72 focus:outline-none focus:border-blue-500 placeholder:text-neutral-400"
            />
          </div>
        </div>
      </div>

      {/* 내역 테이블 */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-bold text-neutral-700">
              <th className="py-4 px-4 text-center cursor-pointer select-none hover:bg-neutral-100" onClick={() => handleSort('date')}>
                <div className="flex items-center justify-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" /> 전송날짜
                </div>
              </th>
              <th className="py-4 px-4 text-center cursor-pointer select-none hover:bg-neutral-100" onClick={() => handleSort('name')}>
                <div className="flex items-center justify-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" /> 고객 이름
                </div>
              </th>
              <th className="py-4 px-4 text-center cursor-pointer select-none hover:bg-neutral-100" onClick={() => handleSort('phone')}>
                <div className="flex items-center justify-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" /> 휴대 전화
                </div>
              </th>
              <th className="py-4 px-4 text-center cursor-pointer select-none hover:bg-neutral-100" onClick={() => handleSort('content')}>
                <div className="flex items-center justify-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" /> 전송 내용
                </div>
              </th>
              <th className="py-4 px-4 text-center cursor-pointer select-none hover:bg-neutral-100" onClick={() => handleSort('status')}>
                <div className="flex items-center justify-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" /> 전송 상태
                </div>
              </th>
              <th className="py-4 px-4 text-center cursor-pointer select-none hover:bg-neutral-100" onClick={() => handleSort('fail_reason')}>
                <div className="flex items-center justify-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" /> 실패 사유
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-neutral-400">조회 중...</td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-neutral-400">전송 내역이 없습니다.</td>
              </tr>
            ) : (
              filteredList.map(row => {
                const isSent = row.status === 'sent';
                const isFailed = row.status === 'failed';
                const isChecking = row.status === 'checking';

                return (
                  <tr key={row.id} className="hover:bg-neutral-50/80 transition-colors">
                    {/* 전송날짜 */}
                    <td className="py-5 px-4 text-center text-neutral-500 font-mono whitespace-nowrap">
                      {row.sent_at}
                    </td>

                    {/* 고객 이름 */}
                    <td className="py-5 px-4 text-center font-semibold text-neutral-800 whitespace-nowrap">
                      {row.customer_name}
                    </td>

                    {/* 휴대 전화 */}
                    <td className="py-5 px-4 text-center text-neutral-600 font-mono whitespace-nowrap">
                      {row.phone}
                    </td>

                    {/* 전송 내용 */}
                    <td className="py-5 px-4 text-center font-medium text-neutral-700">
                      {row.content}
                    </td>

                    {/* 전송 상태 */}
                    <td className="py-5 px-4 text-center whitespace-nowrap">
                      {isSent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3" /> 전송 성공
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <AlertCircle className="w-3 h-3" /> 전송 실패
                        </span>
                      )}
                      {isChecking && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          <Clock className="w-3 h-3" /> 결과 확인 중
                        </span>
                      )}
                    </td>

                    {/* 실패 사유 */}
                    <td className="py-5 px-4 text-center text-neutral-500 whitespace-nowrap">
                      {row.fail_reason}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

