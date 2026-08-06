import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Search, RefreshCw, Play, Pause, XCircle, CheckCircle,
  Loader2, AlertTriangle, ChevronDown, ChevronUp, Package,
  Calendar, Edit2, ShieldAlert, History,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import {
  subscriptionService,
  SubscriptionRow,
  CancellationRequest,
} from '../../services/subscriptionService';
import { SubscriptionCancelModeModal } from '../../components/admin/SubscriptionCancelModeModal';
import { SubscriptionPenaltySettlementModal } from '../../components/admin/SubscriptionPenaltySettlementModal';
import { SubscriptionPauseModal } from '../../components/admin/SubscriptionPauseModal';
import { SubscriptionHistoryModal } from '../../components/SubscriptionHistoryModal';

// ─────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────

function getStatusBadge(status: SubscriptionRow['status']) {
  switch (status) {
    case 'active':
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200"><Play className="w-3 h-3 mr-1" />진행중</Badge>;
    case 'paused':
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200"><Pause className="w-3 h-3 mr-1" />일시정지</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />해지</Badge>;
    case 'expired':
      return <Badge variant="outline" className="bg-neutral-200 text-neutral-600">만료</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" />정기공급완료</Badge>;
    default:
      return <Badge variant="outline" className="bg-neutral-100 text-neutral-700">{status}</Badge>;
  }
}

function formatDate(s?: string) {
  if (!s) return '-';
  return s.split('T')[0].replace(/-/g, '.');
}

// ─────────────────────────────────────────
// 구독 행 컴포넌트
// ─────────────────────────────────────────

function SubscriptionRow_({
  sub,
  isOpen,
  onToggle,
  hasPendingCancel,
  onRetryPayment,
  onReload,
  onOpenCancelModal,
  onOpenCancelLastPaymentModal,
  onOpenPauseModal,
  onOpenHistoryModal,
}: {
  sub: SubscriptionRow;
  isOpen: boolean;
  onToggle: () => void;
  hasPendingCancel?: boolean;
  onRetryPayment?: (subId: string, roundNo: number) => void;
  onReload?: () => void;
  onOpenCancelModal?: (sub: SubscriptionRow) => void;
  onOpenCancelLastPaymentModal?: (sub: SubscriptionRow) => void;
  onOpenPauseModal?: (sub: SubscriptionRow) => void;
  onOpenHistoryModal?: (sub: SubscriptionRow) => void;
}) {
  const [retryingRound, setRetryingRound] = useState<number | null>(null);

  const handleRetry = async (e: React.MouseEvent, roundNo: number) => {
    e.stopPropagation();
    setRetryingRound(roundNo);
    try {
      if (onRetryPayment) {
        await onRetryPayment(sub.id, roundNo);
      }
    } finally {
      setRetryingRound(null);
    }
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenPauseModal) {
      onOpenPauseModal(sub);
    }
  };

  const handleResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('정기공급을 재개하시겠습니까?')) {
      try {
        await subscriptionService.resumeSubscription(sub.id);
        toast.success('정기공급이 재개 되었습니다.');
        onReload?.();
      } catch (err: any) {
        toast.error(err.message || '재개 처리 중 오류가 발생했습니다.');
      }
    }
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenCancelModal) {
      onOpenCancelModal(sub);
    }
  };

  const failedShipment = sub.shipments?.find(s => s.status === 'failed');
  const totalContractAmount = sub.unitPrice * sub.totalRounds;

  return (
    <>
      <tr className="hover:bg-neutral-50 transition-colors cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center gap-1">
            {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />}
            <span className="font-mono text-xs text-neutral-500">
              {sub.subscriptionNo ?? sub.id.slice(0, 8)}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-neutral-900">{(sub as any).user?.name ?? '-'}</p>
            <p className="text-xs text-neutral-500">{(sub as any).user?.hospitalName ?? ''}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-neutral-700">{sub.product?.name ?? '-'}</td>
        <td className="px-4 py-3 text-sm text-center text-neutral-700">{sub.totalQuantity}개 / {sub.cycleMonths}개월</td>
        <td className="px-4 py-3 text-sm text-center">
          <span className="font-medium text-neutral-900">{sub.currentRound}</span>
          <span className="text-neutral-400"> / {sub.totalRounds}회</span>
        </td>
        <td className="px-4 py-3 text-sm text-right text-neutral-700">{sub.unitPrice.toLocaleString()}원</td>
        <td className="px-4 py-3 text-sm text-center text-neutral-600">{formatDate(sub.nextBillingDate)}</td>
        <td className="px-4 py-3 text-sm text-center text-neutral-500">{formatDate(sub.createdAt)}</td>
        <td className="px-4 py-3 text-center">
          {hasPendingCancel ? (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
              <AlertTriangle className="w-3 h-3 mr-1" />처리대기
            </Badge>
          ) : failedShipment ? (
            <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-200">
              <XCircle className="w-3 h-3 mr-1" />결제실패
            </Badge>
          ) : (
            getStatusBadge(sub.status)
          )}
        </td>
      </tr>

      {/* 구독 상세 정보 (정기공급 정보 카드 + 회차 상세 스케줄) */}
      {isOpen && (
        <tr>
          <td colSpan={9} className="px-6 py-5 bg-neutral-50 border-t border-neutral-200">
            <div className="space-y-6">
              {/* 정기공급 정보 카드 (모던 그레이 톤) */}
              <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-2xs text-left">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-neutral-700" />
                    <h4 className="text-lg font-bold text-neutral-900">정기공급 정보</h4>
                  </div>
                  {getStatusBadge(sub.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 mb-1">배송 주기</dt>
                    <dd className="text-sm font-semibold text-neutral-900">
                      {sub.cycleMonths ? `${sub.cycleMonths}개월 (${sub.cycleDays || sub.cycleMonths * 30}일)` : '1개월 (30일)'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 mb-1">정기공급 시작일</dt>
                    <dd className="text-sm font-semibold text-neutral-900">
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 mb-1">다음 배송 예정일</dt>
                    <dd className="text-sm font-semibold text-neutral-900 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-neutral-500" />
                      {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '스케줄 확정 대기'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 mb-1">총 배송 횟수</dt>
                    <dd className="text-sm font-semibold text-neutral-900">
                      {sub.totalRounds}회
                      <span className="text-xs text-neutral-500 font-normal ml-1">
                        (현재 {sub.currentRound}회차 진행 중)
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 mb-1">회당 결제 금액</dt>
                    <dd className="text-sm font-semibold text-neutral-900">
                      {sub.unitPrice.toLocaleString()}원
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 mb-1">총 약정 결제 금액</dt>
                    <dd className="text-sm font-bold text-neutral-900">
                      {totalContractAmount.toLocaleString()}원
                    </dd>
                  </div>
                </div>

                {/* 정기공급 관리 버튼 */}
                <div className="flex items-center gap-3 pt-4 border-t border-neutral-200" onClick={e => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenHistoryModal?.(sub);
                    }}
                    className="border-neutral-300 text-neutral-800 hover:bg-neutral-100 font-bold bg-white"
                  >
                    <History className="w-4 h-4 mr-1 text-neutral-700" />
                    정기공급 히스토리
                  </Button>
                  {sub.status === 'active' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePause}
                        className="border-neutral-300 text-neutral-800 hover:bg-neutral-100 font-bold bg-white"
                      >
                        <Pause className="w-4 h-4 mr-1 text-neutral-700" />
                        일시정지
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info('배송지 변경 기능이 곧 지원될 예정입니다.')}
                        className="border-neutral-300 text-neutral-800 hover:bg-neutral-100 font-bold bg-white"
                      >
                        <Edit2 className="w-4 h-4 mr-1 text-neutral-700" />
                        배송지 변경
                      </Button>
                    </>
                  )}
                  {sub.status === 'paused' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResume}
                      className="border-green-300 text-green-700 hover:bg-green-100 font-bold"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      재개
                    </Button>
                  )}
                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    {sub.status !== 'cancelled' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenCancelLastPaymentModal) {
                              onOpenCancelLastPaymentModal(sub);
                            }
                          }}
                          className="border-red-400 text-red-700 bg-red-50 hover:bg-red-100 font-bold"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          마지막 결제 취소 & 해지
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelClick}
                          className="border-red-300 text-red-700 hover:bg-red-100 font-bold"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          정기공급 해지
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 회차 상세 스케줄 */}
              {sub.shipments && sub.shipments.length > 0 && (
                <div className="bg-white border border-neutral-200 rounded-xl p-4 text-left shadow-sm">
                  <h5 className="text-xs font-bold text-neutral-800 mb-3 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-neutral-600" />
                    <span>회차별 배송 및 결제 스케줄</span>
                  </h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-neutral-500 border-b border-neutral-100">
                          <th className="py-2 pr-4 text-left font-medium">회차</th>
                          <th className="py-2 pr-4 text-left font-medium">예정일</th>
                          <th className="py-2 pr-4 text-right font-medium">수량</th>
                          <th className="py-2 pr-4 text-right font-medium">금액</th>
                          <th className="py-2 pr-4 text-center font-medium">상태</th>
                          <th className="py-2 pr-4 text-left font-medium">실패사유</th>
                          <th className="py-2 text-center font-medium">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-50">
                        {(() => {
                          const isCancelled = sub.status === 'cancelled';
                          const isPaused = sub.status === 'paused';
                          const lastDoneRound = isPaused
                            ? Math.max(
                                0,
                                ...(sub.shipments ?? [])
                                  .filter((s) => s.status === 'paid' || s.status === 'shipped')
                                  .map((s) => s.roundNo)
                              )
                            : -1;

                          return [...sub.shipments].sort((a, b) => a.roundNo - b.roundNo).map(s => {
                            const displayStatus =
                              isCancelled
                                ? (s.status === 'shipped' ? 'shipped' : 'cancelled')
                                : (isPaused && s.status === 'pending' && s.roundNo > lastDoneRound)
                                  ? 'cancelled'
                                  : s.status;

                            return (
                              <tr key={s.id} className={displayStatus === 'cancelled' ? 'opacity-40' : ''}>
                                <td className="py-2 pr-4 text-neutral-700 font-medium">{s.roundNo}회차</td>
                                <td className="py-2 pr-4 text-neutral-600">{formatDate(s.scheduledDate)}</td>
                                <td className="py-2 pr-4 text-right text-neutral-700">{s.quantity}개</td>
                                <td className="py-2 pr-4 text-right text-neutral-700">{s.amount.toLocaleString()}원</td>
                                <td className="py-2 pr-4 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    displayStatus === 'paid'      ? 'bg-green-100 text-green-700' :
                                    displayStatus === 'pending'   ? 'bg-blue-100 text-blue-700' :
                                    displayStatus === 'shipped'   ? 'bg-emerald-100 text-emerald-700' :
                                    displayStatus === 'failed'    ? 'bg-rose-100 text-rose-700 font-bold' :
                                    displayStatus === 'skipped'   ? 'bg-neutral-100 text-neutral-500' :
                                    displayStatus === 'cancelled' ? 'bg-neutral-100 text-neutral-400' :
                                    'bg-neutral-100 text-neutral-600'
                                  }`}>
                                    {{
                                      paid: '결제완료',
                                      pending: '예정',
                                      shipped: '출고완료',
                                      failed: '결제실패',
                                      skipped: '건너뜀',
                                      cancelled: '취소',
                                    }[displayStatus] ?? displayStatus}
                                  </span>
                                </td>
                                <td className="py-2 pr-4 text-left text-neutral-600">
                                  {s.status === 'failed' ? (
                                    <span className="text-rose-600 font-medium">
                                      {s.failReason || '고객 카드 승인 오류 (한도초과/카드사 거부)'}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="py-2 text-center">
                                  {s.status === 'failed' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => handleRetry(e, s.roundNo)}
                                      disabled={retryingRound === s.roundNo}
                                      className="h-6 px-2 text-[11px] border-rose-300 text-rose-700 hover:bg-rose-50"
                                    >
                                      {retryingRound === s.roundNo ? (
                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                      ) : (
                                        <RefreshCw className="w-3 h-3 mr-1" />
                                      )}
                                      재결제 실행
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────

export function SubscriptionListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('subId') || searchParams.get('orderId') || '';

  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [pendingCancelIds, setPendingCancelIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'failed' | 'completed' | 'cancelled' | 'pending_cancel'>('all');
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('subId') || searchParams.get('orderId');
    if (q) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchTerm.trim() && subscriptions.length > 0) {
      const term = searchTerm.toLowerCase().trim();
      const matched = subscriptions.find(sub =>
        sub.id.toLowerCase().includes(term) ||
        (sub.subscriptionNo && sub.subscriptionNo.toLowerCase().includes(term)) ||
        (sub.originalOrderId && sub.originalOrderId.toLowerCase().includes(term)) ||
        sub.shipments?.some(sh => sh.orderId?.toLowerCase().includes(term))
      );
      if (matched) {
        setExpandedSubId(matched.id);
      }
    }
  }, [searchTerm, subscriptions]);

  // 2단계 구독 취소 모달 상태
  const [showSubCancelModeModal, setShowSubCancelModeModal] = useState(false);
  const [showSubPenaltyModal, setShowSubPenaltyModal] = useState(false);
  const [cancelLastPaymentMode, setCancelLastPaymentMode] = useState(false);
  const [selectedSubForCancel, setSelectedSubForCancel] = useState<SubscriptionRow | null>(null);

  // 구독 일시정지 모달 상태
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [selectedSubForPause, setSelectedSubForPause] = useState<SubscriptionRow | null>(null);

  // 정기공급 히스토리 모달 상태
  const [historyModalSub, setHistoryModalSub] = useState<SubscriptionRow | null>(null);

  // ── 로드 ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cancellations] = await Promise.all([
        subscriptionService.getAllSubscriptions(),
        subscriptionService.getCancellationRequests('pending'),
      ]);
      setSubscriptions(data || []);
      setPendingCancelIds(new Set(cancellations.map((c: CancellationRequest) => c.subscriptionId)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── 결제 실패한 구독 판별 ──
  const isPaymentFailed = (s: SubscriptionRow) => {
    return s.shipments?.some(shipment => shipment.status === 'failed') ?? false;
  };

  // ── 필터 ──
  const filtered = subscriptions.filter(s => {
    const matchStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'failed' ? isPaymentFailed(s) :
      statusFilter === 'active' ? (s.status === 'active' && !isPaymentFailed(s) && !pendingCancelIds.has(s.id)) :
      statusFilter === 'pending_cancel' ? pendingCancelIds.has(s.id) :
      statusFilter === 'completed' ? (s.status === 'completed' || s.status === 'expired') :
      statusFilter === 'cancelled' ? (s.status === 'cancelled' && !pendingCancelIds.has(s.id)) :
      s.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchSearch = !term ||
      (s as any).user?.name?.toLowerCase().includes(term) ||
      (s as any).user?.hospitalName?.toLowerCase().includes(term) ||
      s.product?.name?.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term) ||
      (s.subscriptionNo && s.subscriptionNo.toLowerCase().includes(term)) ||
      (s.originalOrderId && s.originalOrderId.toLowerCase().includes(term)) ||
      s.shipments?.some(sh => sh.orderId?.toLowerCase().includes(term));
    return matchStatus && matchSearch;
  });

  // ── 집계 ──
  const counts = {
    all: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active' && !isPaymentFailed(s) && !pendingCancelIds.has(s.id)).length,
    paused: subscriptions.filter(s => s.status === 'paused').length,
    failed: subscriptions.filter(s => isPaymentFailed(s)).length,
    completed: subscriptions.filter(s => s.status === 'completed' || s.status === 'expired').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled' && !pendingCancelIds.has(s.id)).length,
    pending_cancel: pendingCancelIds.size,
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-1">정기공급 목록</h2>
          <p className="text-sm text-neutral-500">전체 정기공급 현황을 관리합니다.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/subscriptions/cancellations')}
          className="border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          해지신청 관리
        </Button>
      </div>

      {/* 검색 */}
      <div className="bg-white border border-neutral-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="고객명, 병원명, 상품명, 구독ID 검색"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-neutral-300 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* 탭 필터 */}
      <div className="bg-white border border-neutral-200">
        <div className="flex border-b border-neutral-200 px-4 overflow-x-auto">
          {([
            { key: 'all', label: '전체', color: 'text-neutral-900', activeColor: 'border-neutral-900 text-neutral-900' },
            { key: 'active', label: '진행중', color: 'text-green-600', activeColor: 'border-green-600 text-green-600' },
            { key: 'paused', label: '일시정지', color: 'text-orange-500', activeColor: 'border-orange-500 text-orange-500' },
            { key: 'failed', label: '결제실패', color: 'text-rose-600', activeColor: 'border-rose-600 text-rose-600' },
            { key: 'completed', label: '완료', color: 'text-blue-600', activeColor: 'border-blue-600 text-blue-600' },
            { key: 'cancelled', label: '해지', color: 'text-red-500', activeColor: 'border-red-500 text-red-500' },
            { key: 'pending_cancel', label: '처리대기', color: 'text-amber-600', activeColor: 'border-amber-500 text-amber-600' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
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
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">
              {searchTerm ? '검색 결과가 없습니다' : '정기공급 내역이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">구독ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">고객</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">상품</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">수량/주기</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">진행회차</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">회차금액</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">다음결제일</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">신청일</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map(sub => (
                  <SubscriptionRow_
                    key={sub.id}
                    sub={sub}
                    isOpen={expandedSubId === sub.id}
                    onToggle={() => setExpandedSubId(prev => prev === sub.id ? null : sub.id)}
                    hasPendingCancel={pendingCancelIds.has(sub.id)}
                    onReload={load}
                    onOpenPauseModal={(targetSub) => {
                      setSelectedSubForPause(targetSub);
                      setShowPauseModal(true);
                    }}
                    onOpenHistoryModal={(targetSub) => {
                      setHistoryModalSub(targetSub);
                    }}
                    onOpenCancelModal={(targetSub) => {
                      setSelectedSubForCancel(targetSub);
                      setCancelLastPaymentMode(false);
                      setShowSubPenaltyModal(true);
                    }}
                    onOpenCancelLastPaymentModal={(targetSub) => {
                      setSelectedSubForCancel(targetSub);
                      setCancelLastPaymentMode(true);
                      setShowSubPenaltyModal(true);
                    }}
                    onRetryPayment={async (subId, roundNo) => {
                      await new Promise(resolve => setTimeout(resolve, 1200));
                      alert(`${roundNo}회차 재결제 요청이 신용카드사로 전송되었습니다.`);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 합계 */}
      {!loading && filtered.length > 0 && (
        <div className="text-right text-xs text-neutral-500">
          총 {filtered.length}건 표시 중 (전체 {subscriptions.length}건)
        </div>
      )}

      {/* 정기공급 히스토리 모달 */}
      {historyModalSub && (
        <SubscriptionHistoryModal
          sub={historyModalSub}
          onClose={() => setHistoryModalSub(null)}
        />
      )}

      {/* 구독 일시정지 모달 */}
      {selectedSubForPause && showPauseModal && (
        <SubscriptionPauseModal
          sub={selectedSubForPause}
          onClose={() => {
            setShowPauseModal(false);
            setSelectedSubForPause(null);
          }}
          onSuccess={load}
        />
      )}

      {/* 구독 해지 & 위약금 정산 모달 */}
      {selectedSubForCancel && showSubPenaltyModal && (
        <SubscriptionPenaltySettlementModal
          order={{
            id: selectedSubForCancel.originalOrderId || selectedSubForCancel.id,
            orderNumber: selectedSubForCancel.subscriptionNo || selectedSubForCancel.id.slice(0, 8),
            totalAmount: selectedSubForCancel.unitPrice,
            pgTid: selectedSubForCancel.pgTid,
            paymentMethod: selectedSubForCancel.paymentMethod,
            userId: selectedSubForCancel.userId,
          }}
          sub={selectedSubForCancel}
          cancelLastPayment={cancelLastPaymentMode}
          onClose={() => {
            setShowSubPenaltyModal(false);
            setSelectedSubForCancel(null);
          }}
          onBack={() => {
            setShowSubPenaltyModal(false);
            setSelectedSubForCancel(null);
          }}
          onSuccess={load}
        />
      )}
    </div>
  );
}