import { useState, useEffect } from 'react';
import { Download, RefreshCw, XCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { mtsService, type SmsSendHistory } from '../../../services/mtsService';
import { toast } from 'sonner';

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending:  { label: '예약', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
  sent:     { label: '발송완료', className: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed:   { label: '실패', className: 'bg-red-100 text-red-700', icon: XCircle },
  canceled: { label: '취소', className: 'bg-neutral-100 text-neutral-500', icon: AlertCircle },
};

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

export function SmsMarketingHistoryPage() {
  const [list, setList] = useState<SmsSendHistory[]>([]);
  const [count, setCount] = useState(0);
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  useEffect(() => { load(); }, [page, startDate, endDate]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, count } = await mtsService.getMarketingHistory(`${startDate}T00:00:00Z`, `${endDate}T23:59:59Z`, page, pageSize);
      setList(data); setCount(count);
    } catch { toast.error('내역 조회에 실패했습니다.'); }
    finally { setLoading(false); }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('예약 발송을 취소하시겠습니까?')) return;
    try { await mtsService.cancelReservedSend(id); await load(); toast.success('취소되었습니다.'); }
    catch { toast.error('취소에 실패했습니다.'); }
  };

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-neutral-900">마케팅 전송 내역</h2><p className="text-sm text-neutral-500 mt-0.5">마케팅 목적으로 발송된 문자 내역입니다.</p></div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-50"><RefreshCw className="w-4 h-4" />새로고침</button>
      </div>

      {/* 필터 */}
      <div className="bg-white border border-neutral-200 p-4 flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <label className="text-neutral-500">기간</label>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} className="border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none" />
          <span className="text-neutral-400">~</span>
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} className="border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none" />
        </div>
        <div className="ml-auto text-sm text-neutral-500">총 <strong className="text-neutral-900">{count}</strong>건</div>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-neutral-200">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 w-10">No.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700">메시지 내용</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-neutral-700 w-20">수신(성공/실패)</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-neutral-700 w-28">상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 w-40">발송일시</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-neutral-700 w-16">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-neutral-400">조회 중...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-neutral-400">내역이 없습니다.</td></tr>
            ) : list.map((row, i) => {
              const { label, className, icon: Icon } = STATUS_BADGE[row.status] || STATUS_BADGE.pending;
              const rowNo = (page - 1) * pageSize + i + 1;
              return (
                <tr key={row.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-xs text-neutral-400 text-center">{rowNo}</td>
                  <td className="px-4 py-3">
                    {row.subject && <div className="text-xs font-medium text-neutral-700">[제목] {row.subject}</div>}
                    <div className="text-sm text-neutral-800 line-clamp-2">{row.message}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-center">
                    <div>{row.recipient_count}명</div>
                    <div className="text-green-600">{row.success_count} / <span className="text-red-500">{row.fail_count}</span></div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${className}`}>
                      <Icon className="w-3 h-3" />{label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {row.reserved_at ? `예약: ${new Date(row.reserved_at).toLocaleString('ko-KR')}` : row.sent_at ? new Date(row.sent_at).toLocaleString('ko-KR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.status === 'pending' && (
                      <button onClick={() => handleCancel(row.id)} className="text-xs text-red-500 hover:underline">취소</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
          <span className="text-xs text-neutral-500">전체 {count}건</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border border-neutral-300 disabled:opacity-40">이전</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-sm border ${p === page ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-300'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm border border-neutral-300 disabled:opacity-40">다음</button>
          </div>
        </div>
      </div>
    </div>
  );
}
