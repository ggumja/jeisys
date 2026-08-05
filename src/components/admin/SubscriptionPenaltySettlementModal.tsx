import { useState, useMemo } from 'react';
import { X, AlertCircle, ShieldAlert, Check, Loader2, ArrowLeft, DollarSign } from 'lucide-react';
import { subscriptionService, type SubscriptionRow } from '../../services/subscriptionService';
import { toast } from 'sonner';

interface SubscriptionPenaltySettlementModalProps {
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    pgTid?: string;
    paymentMethod?: string;
    userId?: string;
  };
  sub: SubscriptionRow;
  onClose: () => void;
  onBack: () => void;
  onSuccess: () => void;
}

export function SubscriptionPenaltySettlementModal({
  order,
  sub,
  onClose,
  onBack,
  onSuccess,
}: SubscriptionPenaltySettlementModalProps) {
  const [adminAction, setAdminAction] = useState<'charge' | 'waive'>('charge');
  const [cancelReason, setCancelReason] = useState('');
  const [adminMemo, setAdminMemo] = useState('');
  const [loading, setLoading] = useState(false);

  // 위약금 계산 미리보기
  const penaltyInfo = useMemo(() => {
    return subscriptionService.calculatePenaltyPreview(sub);
  }, [sub]);

  const finalPenaltyToCharge = adminAction === 'waive' ? 0 : penaltyInfo.penaltyAmount;

  const handleExecuteCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('해지 사유를 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);
      await subscriptionService.cancelSubscriptionWithPenalty({
        orderId: order.id,
        subscriptionId: sub.id,
        userId: sub.userId || order.userId || '',
        reason: cancelReason.trim(),
        penaltyAmount: penaltyInfo.penaltyAmount,
        shippedQuantity: penaltyInfo.shippedQuantity,
        paidAmount: penaltyInfo.paidAmount,
        regularAmount: penaltyInfo.regularAmount,
        adminAction,
        adminMemo: adminMemo.trim() || undefined,
        cancelAmount: order.totalAmount,
        pgTid: order.pgTid,
      });

      toast.success(
        adminAction === 'waive'
          ? '위약금 면제 및 정기구독 해지가 완료되었습니다.'
          : `위약금 ₩${penaltyInfo.penaltyAmount.toLocaleString()}원 청구 등록 및 구독 해지가 완료되었습니다.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Subscription cancel error:', err);
      toast.error(err.message || '구독 해지 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1 text-neutral-400 hover:text-neutral-700 rounded transition-colors mr-1"
              title="이전 단계로"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h3 className="text-base font-bold text-neutral-900">정기구독 해지 및 위약금 정산</h3>
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
          {/* Summary Card */}
          <div className="bg-neutral-900 text-white rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-bold text-neutral-400">구독 상품</span>
              <span className="text-xs font-bold text-white truncate max-w-[200px]">
                {sub.product?.name || '정기공급 상품'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-neutral-400 block text-[11px]">기출고 수량 (회차)</span>
                <span className="font-bold text-white text-sm">{penaltyInfo.shippedQuantity}개 ({sub.currentRound}회차)</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">기납부 총액</span>
                <span className="font-bold text-white text-sm">₩{penaltyInfo.paidAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">정가 재산정 금액</span>
                <span className="font-bold text-neutral-300">₩{penaltyInfo.regularAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">적용 구간 할인율</span>
                <span className="font-bold text-blue-400">{penaltyInfo.appliedDiscountRate}%</span>
              </div>
            </div>

            {/* Calculated Penalty Highlight */}
            <div className="bg-red-950/80 border border-red-800/60 rounded-lg p-3 flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-red-200">중도해지 산출 위약금</span>
              </div>
              <span className="text-base font-extrabold text-red-400">
                ₩{penaltyInfo.penaltyAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Admin Action Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-800">
              관리자 위약금 정산 선택
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  adminAction === 'charge'
                    ? 'border-red-500 bg-red-50/50 text-red-900 font-bold'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="adminAction"
                  checked={adminAction === 'charge'}
                  onChange={() => setAdminAction('charge')}
                  className="accent-red-600"
                />
                <div className="text-xs">
                  <div className="font-bold">위약금 부과</div>
                  <div className="text-[11px] opacity-80 mt-0.5">₩{penaltyInfo.penaltyAmount.toLocaleString()} 청구</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  adminAction === 'waive'
                    ? 'border-green-600 bg-green-50/50 text-green-900 font-bold'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="adminAction"
                  checked={adminAction === 'waive'}
                  onChange={() => setAdminAction('waive')}
                  className="accent-green-600"
                />
                <div className="text-xs">
                  <div className="font-bold">위약금 면제</div>
                  <div className="text-[11px] opacity-80 mt-0.5">₩0 (관리자 재량)</div>
                </div>
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                해지 및 취소 사유 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="예: 고객 요청에 의한 중도 해지, 상품 이용 만족"
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-100 placeholder:text-neutral-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                관리자 정산 메모 (선택)
              </label>
              <textarea
                rows={2}
                value={adminMemo}
                onChange={e => setAdminMemo(e.target.value)}
                placeholder="예: 고객 불만으로 위약금 면제 승인 처리함"
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              이전 단계
            </button>
            <button
              type="button"
              onClick={handleExecuteCancel}
              disabled={loading || !cancelReason.trim()}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>구독 해지 및 취소 확정</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
