import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, CheckCircle, Clock, XCircle,
  Search, Loader2, FileText, ChevronUp, ChevronDown,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { useModal } from '../../context/ModalContext';
import { authService } from '../../services/authService';
import {
  subscriptionService,
  CancellationRequest,
} from '../../services/subscriptionService';

// ─────────────────────────────────────────
// 처리 모달 (청구 / 비청구)
// ─────────────────────────────────────────

interface ProcessModalProps {
  open: boolean;
  request: CancellationRequest;
  action: 'charge' | 'waive';
  onConfirm: (memo: string) => void;
  onClose: () => void;
  processing: boolean;
}

function ProcessModal({ open, request, action, onConfirm, onClose, processing }: ProcessModalProps) {
  const [memo, setMemo] = useState('');
  const isWaive = action === 'waive';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !processing && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isWaive ? 'text-neutral-800' : 'text-red-700'}`}>
            {isWaive
              ? <><CheckCircle className="w-5 h-5 text-green-500" />위약금 비청구 처리</>
              : <><AlertTriangle className="w-5 h-5 text-red-500" />위약금 청구 처리</>
            }
          </DialogTitle>
          <DialogDescription>
            {request.user?.name} ({request.user?.hospitalName}) 님의 해지 신청 건
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 위약금 정보 */}
          <div className="rounded border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-neutral-700">
              <span>기출고 수량</span>
              <span className="font-medium">{request.shippedQuantity}개</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>기납부 총액</span>
              <span className="font-medium">{request.paidAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>일반가 재산정액</span>
              <span className="font-medium">{request.regularAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2 text-neutral-900">
              <span>위약금</span>
              <span className={request.penaltyAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                {request.penaltyAmount > 0
                  ? `${request.penaltyAmount.toLocaleString()}원`
                  : '없음'
                }
              </span>
            </div>
          </div>

          {/* 메모 (비청구 시 필수, 청구 시 선택) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              처리 메모{' '}
              {isWaive && <span className="text-red-500">* (비청구 시 필수)</span>}
              {!isWaive && <span className="text-neutral-400">(선택)</span>}
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={isWaive
                ? '비청구 사유를 반드시 입력해주세요'
                : '처리 메모를 입력하세요 (선택)'
              }
              className="w-full h-24 px-3 py-2 border border-neutral-300 text-sm text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={processing}
            className="border-neutral-300"
          >
            취소
          </Button>
          <Button
            onClick={() => onConfirm(memo)}
            disabled={processing || (isWaive && !memo.trim())}
            className={isWaive
              ? 'bg-neutral-800 text-white hover:bg-neutral-700'
              : 'bg-red-600 text-white hover:bg-red-700'
            }
          >
            {processing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : isWaive ? '비청구 처리 완료' : '청구 처리 완료'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────

export function SubscriptionCancellationPage() {
  const { alert: globalAlert } = useModal();

  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const [modalState, setModalState] = useState<{
    open: boolean;
    request: CancellationRequest | null;
    action: 'charge' | 'waive';
  }>({ open: false, request: null, action: 'charge' });
  const [processing, setProcessing] = useState(false);

  // ── 데이터 로드 (항상 전체 로드 → 클라이언트 필터링) ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getCancellationRequests(undefined);
      setRequests(data);
    } catch (e: any) {
      console.error('[SubscriptionCancellationPage] 해지신청 목록 로드 실패:', e?.message, e?.code, e?.details, e?.hint, e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── 처리 실행 ──
  const handleProcess = async (memo: string) => {
    if (!modalState.request) return;
    setProcessing(true);
    try {
      const admin = await authService.getCurrentUser();
      if (!admin) return;
      await subscriptionService.processCancellation({
        requestId: modalState.request.id,
        adminId: admin.id,
        action: modalState.action,
        memo,
      });
      setModalState({ open: false, request: null, action: 'charge' });
      await globalAlert('처리가 완료되었습니다.');
      load();
    } catch (e: any) {
      await globalAlert(e?.message ?? '처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  // ── 필터 (탭 + 검색 클라이언트 필터링) ──
  const filtered = requests.filter((r) => {
    const matchStatus =
      statusFilter === 'all' ? true : r.status === statusFilter;
    if (!matchStatus) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.user?.name?.toLowerCase().includes(term) ||
      r.user?.hospitalName?.toLowerCase().includes(term) ||
      r.subscriptionId.toLowerCase().includes(term)
    );
  });

  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const processedCount = requests.filter((r) => r.status === 'processed').length;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 탭·검색 변경 시 첫 페이지로
  const handleFilterChange = (f: typeof statusFilter) => { setStatusFilter(f); setCurrentPage(1); };
  const handleSearchChange = (v: string) => { setSearchTerm(v); setCurrentPage(1); };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-1">
            정기배송 해지신청 관리
          </h2>
          <p className="text-sm text-neutral-500">
            고객이 신청한 해지 건을 검토하고 위약금 청구 여부를 결정합니다.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">
              처리 대기 {pendingCount}건
            </span>
          </div>
        )}
      </div>

      {/* 검색 */}
      <div className="bg-white border border-neutral-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="고객명, 병원명, 구독번호 검색"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-neutral-300 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* 탭 필터 */}
      <div className="bg-white border border-neutral-200">
        <div className="flex border-b border-neutral-200 px-4">
          {([
            { key: 'all' as const, label: '전체', activeColor: 'border-neutral-900 text-neutral-900', count: totalCount },
            { key: 'pending' as const, label: '처리대기', activeColor: 'border-amber-500 text-amber-600', count: pendingCount },
            { key: 'processed' as const, label: '처리완료', activeColor: 'border-green-600 text-green-600', count: processedCount },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                statusFilter === tab.key
                  ? tab.activeColor
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                statusFilter === tab.key ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-neutral-200 p-16 text-center">
          <FileText className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">
            {searchTerm ? '검색 결과가 없습니다' : '해지신청 내역이 없습니다'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 w-8"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">구독번호</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">고객</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">병원명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">신청일</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500">위약금</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginated.map((req) => {
                const isPending = req.status === 'pending';
                const isOpen = openRowId === req.id;
                return (
                  <>
                    <tr
                      key={req.id}
                      className={`hover:bg-neutral-50 cursor-pointer transition-colors ${
                        isPending ? 'bg-amber-50/40' : ''
                      }`}
                      onClick={() => setOpenRowId(isOpen ? null : req.id)}
                    >
                      <td className="px-4 py-3 text-neutral-400">
                        {isOpen
                          ? <ChevronUp className="w-3.5 h-3.5" />
                          : <ChevronDown className="w-3.5 h-3.5" />}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                        {req.subscription?.subscriptionNo ?? req.subscriptionId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        {req.user?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {req.user?.hospitalName ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {req.createdAt.split('T')[0]}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${
                          req.penaltyAmount > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {req.penaltyAmount > 0
                            ? `${req.penaltyAmount.toLocaleString()}원`
                            : '없음'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPending
                          ? <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                              <Clock className="w-3 h-3 mr-1" />처리 대기
                            </Badge>
                          : req.adminAction === 'charge'
                            ? <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />청구 완료
                              </Badge>
                            : <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />비청구 처리
                              </Badge>
                        }
                      </td>
                    </tr>

                    {/* 아코디언 상세 */}
                    {isOpen && (
                      <tr key={`${req.id}-detail`}>
                        <td colSpan={7} className="bg-neutral-50 border-t border-neutral-100 px-6 py-5">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-sm mb-4">
                            <div>
                              <p className="text-xs text-neutral-400 mb-1">기출고 수량</p>
                              <p className="font-medium text-neutral-800">{req.shippedQuantity}개</p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-400 mb-1">기납부 총액</p>
                              <p className="font-medium text-neutral-800">{req.paidAmount.toLocaleString()}원</p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-400 mb-1">일반가 재산정액</p>
                              <p className="font-medium text-neutral-800">{req.regularAmount.toLocaleString()}원</p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-400 mb-1">위약금</p>
                              <p className={`font-semibold ${
                                req.penaltyAmount > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {req.penaltyAmount > 0
                                  ? `${req.penaltyAmount.toLocaleString()}원`
                                  : '없음'}
                              </p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-xs text-neutral-400 mb-1">해지 사유</p>
                            <p className="text-sm text-neutral-700 bg-white px-3 py-2 rounded border border-neutral-200">
                              {req.cancelReason}
                            </p>
                          </div>

                          {!isPending && req.adminMemo && (
                            <div className="mb-4">
                              <p className="text-xs text-neutral-400 mb-1">처리 메모</p>
                              <p className="text-sm text-neutral-700 bg-blue-50 px-3 py-2 rounded border border-blue-100">
                                {req.adminMemo}
                              </p>
                            </div>
                          )}

                          {isPending && (
                            <div className="flex gap-2 justify-end pt-2 border-t border-neutral-200">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); setModalState({ open: true, request: req, action: 'waive' }); }}
                                className="border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs"
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />청구 안 함
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setModalState({ open: true, request: req, action: 'charge' }); }}
                                className="bg-red-600 text-white hover:bg-red-700 text-xs"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 mr-1" />위약금 청구
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500 text-xs">
            총 {filtered.length}건 · {currentPage}/{totalPages} 페이지
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs border border-neutral-200 rounded disabled:opacity-30 hover:bg-neutral-50"
            >«</button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs border border-neutral-200 rounded disabled:opacity-30 hover:bg-neutral-50"
            >‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              const page = start + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2.5 py-1 text-xs border rounded ${
                    page === currentPage
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >{page}</button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs border border-neutral-200 rounded disabled:opacity-30 hover:bg-neutral-50"
            >›</button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs border border-neutral-200 rounded disabled:opacity-30 hover:bg-neutral-50"
            >»</button>
          </div>
        </div>
      )}

      {/* 처리 모달 */}
      {modalState.open && modalState.request && (
        <ProcessModal
          open={modalState.open}
          request={modalState.request}
          action={modalState.action}
          onConfirm={handleProcess}
          onClose={() => !processing && setModalState({ open: false, request: null, action: 'charge' })}
          processing={processing}
        />
      )}
    </div>
  );
}
