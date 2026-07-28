import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Clock, CheckCircle2, AlertCircle, XCircle, Search, RefreshCw, Filter, Calendar } from 'lucide-react';
import { emailService, type EmailSendHistory } from '../../../services/emailService';
import { toast } from 'sonner';
import { useModal } from '../../../context/ModalContext';

export function EmailHistoryPage() {
  const navigate = useNavigate();
  const { confirm } = useModal();
  const [history, setHistory] = useState<EmailSendHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<EmailSendHistory | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await emailService.getSendHistory();
      setHistory(data);
    } catch {
      toast.error('이메일 발송 이력을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReserved = async (id: string, subject: string) => {
    const ok = await confirm({
      title: '예약 이메일 발송 취소',
      description: `[${subject || '제목없음'}] 예약 이메일 발송을 취소하시겠습니까?`,
      confirmText: '예약 취소',
      cancelText: '닫기',
    });
    if (!ok) return;

    try {
      await emailService.cancelReservedEmail(id);
      toast.success('예약 발송이 취소되었습니다.');
      await loadHistory();
    } catch {
      toast.error('예약 발송 취소 실패.');
    }
  };

  const filtered = history.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      (item.subject && item.subject.toLowerCase().includes(query)) ||
      item.message.toLowerCase().includes(query) ||
      item.from_email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" /> 이메일 발송 내역
          </h1>
          <p className="text-sm text-neutral-500 mt-1">발송된 마케팅 이메일 및 예약 발송 내역을 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/marketing/email/send')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-bold transition-colors"
          >
            + 이메일 발송 작성
          </button>
          <button
            onClick={loadHistory}
            className="p-2 border border-neutral-200 bg-white hover:bg-neutral-50 rounded text-neutral-600"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 검색 바 */}
      <div className="bg-white p-4 rounded-lg border border-neutral-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="제목, 내용, 발신 이메일 검색..."
            className="w-full text-xs border border-neutral-300 rounded pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-neutral-500 font-semibold">
          총 <span className="text-blue-600 font-bold">{filtered.length}</span>건의 이력
        </div>
      </div>

      {/* 발송 이력 테이블 */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-bold text-neutral-600">
              <th className="py-3 px-4">상태</th>
              <th className="py-3 px-4">이메일 제목</th>
              <th className="py-3 px-4">발신자</th>
              <th className="py-3 px-4 text-center">수신자 수</th>
              <th className="py-3 px-4">발송/예약 일시</th>
              <th className="py-3 px-4 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-neutral-400">불러오는 중...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-neutral-400">발송 내역이 없습니다.</td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    {item.status === 'sent' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 className="w-3 h-3" /> 발송완료
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" /> 발송예약
                      </span>
                    )}
                    {item.status === 'canceled' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
                        <XCircle className="w-3 h-3" /> 예약취소
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                        <AlertCircle className="w-3 h-3" /> 발송실패
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-semibold text-neutral-800 max-w-md truncate">
                    <button onClick={() => setSelectedItem(item)} className="hover:text-blue-600 text-left truncate block w-full">
                      {item.subject || '(제목 없음)'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">{item.from_email}</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600">{item.recipient_count}명</td>
                  <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                    {item.reserved_at ? (
                      <span className="text-amber-700">📅 예약: {new Date(item.reserved_at).toLocaleString()}</span>
                    ) : (
                      new Date(item.sent_at || item.created_at).toLocaleString()
                    )}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[11px] font-bold transition-colors"
                      >
                        상세
                      </button>
                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleCancelReserved(item.id, item.subject || '')}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[11px] font-bold transition-colors"
                        >
                          예약취소
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 이력 상세 모달 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" /> 이메일 발송 상세 내역
              </h2>
              <button onClick={() => setSelectedItem(null)} className="text-neutral-400 hover:text-neutral-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs bg-neutral-50 p-3.5 rounded border border-neutral-200">
                <div><span className="text-neutral-400">발신 이메일:</span> <span className="font-bold font-mono">{selectedItem.from_email}</span></div>
                <div><span className="text-neutral-400">수신 대상 수:</span> <span className="font-bold text-blue-600">{selectedItem.recipient_count}명</span></div>
                <div><span className="text-neutral-400">발송 상태:</span> <span className="font-bold">{selectedItem.status.toUpperCase()}</span></div>
                <div><span className="text-neutral-400">등록 일시:</span> <span>{new Date(selectedItem.created_at).toLocaleString()}</span></div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">제목</label>
                <div className="p-2.5 bg-white border border-neutral-200 rounded text-xs font-semibold text-neutral-800">
                  {selectedItem.subject || '(제목 없음)'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">이메일 본문 (HTML Preview)</label>
                <div className="p-4 bg-white border border-neutral-200 rounded text-xs overflow-y-auto max-h-60" dangerouslySetInnerHTML={{ __html: selectedItem.message }} />
              </div>
            </div>
            <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex justify-end">
              <button onClick={() => setSelectedItem(null)} className="px-4 py-2 border border-neutral-300 bg-white text-neutral-700 text-xs font-bold rounded hover:bg-neutral-100">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
