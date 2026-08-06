import { useState } from 'react';
import { X, PauseCircle, AlertTriangle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { subscriptionService, type SubscriptionRow } from '../../services/subscriptionService';
import { toast } from 'sonner';

interface SubscriptionCancelModeModalProps {
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    pgTid?: string;
    paymentMethod?: string;
    userId?: string;
  };
  sub: SubscriptionRow | null;
  onClose: () => void;
  onSelectCancelSubscription: (sub: SubscriptionRow) => void;
  onSuccess: () => void;
}

export function SubscriptionCancelModeModal({
  order,
  sub,
  onClose,
  onSelectCancelSubscription,
  onSuccess,
}: SubscriptionCancelModeModalProps) {
  const [pauseReason, setPauseReason] = useState('');
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExecutePause = async () => {
    if (!pauseReason.trim()) {
      toast.error('일시정지 취소 사유를 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);
      if (sub?.id) {
        await subscriptionService.pauseSubscriptionWithOrderCancel({
          orderId: order.id,
          subscriptionId: sub.id,
          reason: pauseReason.trim(),
          cancelAmount: order.totalAmount,
          pgTid: order.pgTid,
        });
      }
      toast.success('해당 회차 결제 취소 및 구독 일시정지 처리가 완료되었습니다.');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Pause execution error:', err);
      toast.error(err.message || '일시정지 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-neutral-300 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-neutral-900">정기공급 주문 취소 방식 선택</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* Order Meta Info */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between text-neutral-700">
              <span className="font-semibold">취소 대상 주문:</span>
              <span className="font-mono font-bold text-neutral-900">{order.orderNumber || order.id}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span className="font-semibold">결제 금액:</span>
              <span className="font-bold text-blue-700">₩{order.totalAmount.toLocaleString()}</span>
            </div>
            {sub && (
              <div className="flex justify-between text-neutral-700">
                <span className="font-semibold">현재 진행 회차:</span>
                <span className="font-semibold text-neutral-900">{sub.currentRound}회차 / 총 {sub.totalRounds}회차</span>
              </div>
            )}
          </div>

          {!showPauseConfirm ? (
            <div className="space-y-3">
              <p className="text-xs text-neutral-600 font-medium">
                취소 후 정기공급 계약을 어떻게 처리할지 선택해 주세요.
              </p>

              {/* Option A: Pause */}
              <div
                onClick={() => setShowPauseConfirm(true)}
                className="border-2 border-neutral-200 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl p-4 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <PauseCircle className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-neutral-900 group-hover:text-blue-600">
                      옵션 1. 정기공급 일시정지 (Pause & Hold)
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed pl-10">
                  해당 회차 결제만 취소하고 정기공급을 <strong>일시정지(Paused)</strong> 상태로 만듭니다.<br />
                  카드 승인 실패, 단순 오결제 시 유용하며 추후 해당 회차부터 다시 재결제가 가능합니다.
                </p>
              </div>

              {/* Option B: Cancel Subscription */}
              <div
                onClick={() => {
                  const targetSub: SubscriptionRow = sub || {
                    id: order.id,
                    userId: order.userId || '',
                    status: 'active',
                    cycleDays: 30,
                    cycleMonths: 1,
                    totalQuantity: 250,
                    totalRounds: 10,
                    qtyPerRound: 25,
                    lastRoundQty: 25,
                    currentRound: 1,
                    unitPrice: order.totalAmount,
                    regularUnitPrice: Math.round(order.totalAmount * 1.1),
                    discountRate: 10,
                    nextBillingDate: new Date().toISOString().split('T')[0],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    pauseCount: 0,
                    product: { name: '정기공급 상품' },
                  };
                  onSelectCancelSubscription(targetSub);
                }}
                className="border-2 border-neutral-200 hover:border-red-500 hover:bg-red-50/40 rounded-xl p-4 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-neutral-900 group-hover:text-red-600">
                      옵션 2. 정기공급 완전 해지 & 위약금 정산
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-red-600 transition-colors" />
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed pl-10">
                  해당 회차 결제 취소와 함께 <strong>전체 정기공급 계약을 중단/해지</strong>합니다.<br />
                  이후 모든 잔여 회차가 취소되며, 기출고 수량에 따른 위약금 정산 단계로 이동합니다.
                </p>
              </div>
            </div>
          ) : (
            /* Confirm Pause Input Form */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-xs text-amber-800">
                <PauseCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">정기공급 일시정지 처리 안내</p>
                  <p className="mt-0.5">
                    해당 회차 결제건(₩{order.totalAmount.toLocaleString()})을 환불하고, 정기공급 상태를 <strong>일시정지</strong>로 변경합니다.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  일시정지 처리 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={pauseReason}
                  onChange={e => setPauseReason(e.target.value)}
                  placeholder="예: 카드 한도 초과로 인한 오결제 취소, 고객 요청 재결제 대기"
                  className="w-full border border-neutral-300 rounded-lg p-3 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 placeholder:text-neutral-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowPauseConfirm(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={handleExecutePause}
                  disabled={loading || !pauseReason.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>일시정지 및 결제 취소 확정</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
