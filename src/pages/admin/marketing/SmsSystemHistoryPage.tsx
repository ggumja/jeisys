import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { mtsService, type SmsSendHistory } from '../../../services/mtsService';
import { toast } from 'sonner';

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

const PURPOSE_MAP: Record<string, string> = {
  auth: '인증', order: '주문접수', ship: '배송', wlc: '회원가입', noti: '알림', mkt: '마케팅',
};

export function SmsSystemHistoryPage() {
  const [list, setList] = useState<SmsSendHistory[]>([]);
  const [count, setCount] = useState(0);
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  useEffect(() => { load(); }, [page, startDate, endDate]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, count } = await mtsService.getSystemHistory(`${startDate}T00:00:00Z`, `${endDate}T23:59:59Z`, page, pageSize);
      setList(data); setCount(count);
    } catch { toast.error('내역 조회에 실패했습니다.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-neutral-900">시스템 전송 내역</h2><p className="text-sm text-neutral-500 mt-0.5">주문, 배송, 인증 등 시스템에서 자동 발송된 문자 내역입니다.</p></div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-50"><RefreshCw className="w-4 h-4" />새로고침</button>
      </div>
      <div className="bg-white border border-neutral-200 p-4 flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <label className="text-neutral-500">기간</label>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} className="border border-neutral-300 px-2 py-1.5 focus:outline-none" />
          <span className="text-neutral-400">~</span>
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} className="border border-neutral-300 px-2 py-1.5 focus:outline-none" />
        </div>
        <div className="ml-auto text-sm text-neutral-500">총 <strong className="text-neutral-900">{count}</strong>건</div>
      </div>
      <div className="bg-white border border-neutral-200">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 w-10">No.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 w-24">목적</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700">메시지</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-neutral-700 w-16">발송</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 w-40">발송일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-neutral-400">조회 중...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-neutral-400">내역이 없습니다.</td></tr>
            ) : list.map((row, i) => (
              <tr key={row.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 text-xs text-neutral-400 text-center">{(page-1)*pageSize+i+1}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded text-xs">{PURPOSE_MAP[row.purpose || ''] || row.purpose || '-'}</span></td>
                <td className="px-4 py-3 text-sm text-neutral-800 line-clamp-2">{row.message}</td>
                <td className="px-4 py-3 text-center text-xs"><div>{row.recipient_count}명</div><div className="text-green-600">{row.success_count}성공</div></td>
                <td className="px-4 py-3 text-xs text-neutral-600">{row.sent_at ? new Date(row.sent_at).toLocaleString('ko-KR') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
