import { useState, useMemo } from 'react';
import { X, ShieldAlert, Loader2, ArrowLeft, Calculator, Table, Info } from 'lucide-react';
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
  cancelLastPayment?: boolean;
  onClose: () => void;
  onBack: () => void;
  onSuccess: () => void;
}

export function SubscriptionPenaltySettlementModal({
  order,
  sub,
  cancelLastPayment = false,
  onClose,
  onBack,
  onSuccess,
}: SubscriptionPenaltySettlementModalProps) {
  const [adminAction, setAdminAction] = useState<'charge' | 'waive'>('charge');
  const [cancelReason, setCancelReason] = useState('');
  const [adminMemo, setAdminMemo] = useState('');
  const [loading, setLoading] = useState(false);

  // 2단계 승인 팝업 스테이트 ('none' | 'confirm_refund' | 'confirm_penalty')
  const [confirmStep, setConfirmStep] = useState<'none' | 'confirm_refund' | 'confirm_penalty'>('none');
  const [paymentRefundDone, setPaymentRefundDone] = useState(false);

  const isCurrentRoundShipped = ['shipped', 'delivered', 'partially_shipped'].includes((order as any).status || '');

  // 위약금 계산 미리보기
  const penaltyInfo = useMemo(() => {
    return subscriptionService.calculatePenaltyPreview(sub, {
      cancelLastPayment,
      isCurrentRoundShipped,
    });
  }, [sub, cancelLastPayment, isCurrentRoundShipped]);

  const hasPenalty = penaltyInfo.penaltyAmount > 0;

  // 단가 계산 유틸
  const paidUnitPrice = penaltyInfo.shippedQuantity > 0
    ? Math.round(penaltyInfo.paidAmount / penaltyInfo.shippedQuantity)
    : 0;

  const effectiveRegularUnitPrice = penaltyInfo.shippedQuantity > 0
    ? Math.round(penaltyInfo.regularAmount / penaltyInfo.shippedQuantity)
    : sub.regularUnitPrice || order.totalAmount;

  // 구간별 단가 목록 (전달된 tiers가 없으면 기본 구간 구성)
  const discountTiers = useMemo(() => {
    if (sub.quantityDiscountTiers && sub.quantityDiscountTiers.length > 0) {
      return [...sub.quantityDiscountTiers].sort((a, b) => a.minQty - b.minQty);
    }
    return [
      { minQty: 1, maxQty: 99, discountRate: 0 },
      { minQty: 100, maxQty: 199, discountRate: 10 },
      { minQty: 200, maxQty: 500, discountRate: 18 },
    ];
  }, [sub.quantityDiscountTiers]);

  // 메인 양클릭 제출 버튼
  const handleFormSubmit = () => {
    if (!cancelReason.trim()) {
      toast.error('해지 사유를 입력해 주세요.');
      return;
    }

    if (cancelLastPayment) {
      // 마지막 결제 취소 포함 건: 1단계 카드 승인 취소 팝업으로 이동
      setConfirmStep('confirm_refund');
    } else {
      // 기결제 유지 건: 위약금 부과 시 위약금 결제 승인 팝업으로 이동, 면제 시 즉시 해지
      if (adminAction === 'charge' && hasPenalty) {
        setConfirmStep('confirm_penalty');
      } else {
        handleExecuteNoPenaltyCancel();
      }
    }
  };

  // 1단계: 마지막 결제 카드 승인 취소 실행
  const handleExecutePaymentRefundStep = async () => {
    try {
      setLoading(true);
      await subscriptionService.cancelOrderPaymentOnly({
        orderId: order.id,
        subscriptionId: sub.id,
        reason: cancelReason.trim(),
        cancelAmount: order.totalAmount,
        pgTid: order.pgTid,
        currentRound: sub.currentRound,
      });

      setPaymentRefundDone(true);

      // 위약금 부과건인 경우 -> 2단계: 위약금 결제 승인 팝업으로 이동
      if (adminAction === 'charge' && hasPenalty) {
        setConfirmStep('confirm_penalty');
      } else {
        // 1회차 또는 위약금 미부과인 경우 -> 즉시 최종 해지 완료
        await subscriptionService.finalizeSubscriptionCancellation({
          subscriptionId: sub.id,
          userId: sub.userId || order.userId || '',
          reason: cancelReason.trim(),
          penaltyAmount: 0,
          shippedQuantity: 0,
          paidAmount: 0,
          regularAmount: 0,
          adminAction: 'waive',
          adminMemo: adminMemo.trim() || undefined,
        });

        toast.success('마지막 결제 취소 및 구독 해지가 완료되었습니다.');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Payment refund step error:', err);
      toast.error(err.message || '카드 승인 취소 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2단계: 위약금 결제 승인 & 최종 해지 처리
  const handleExecutePenaltyChargeStep = async () => {
    try {
      setLoading(true);
      if (!cancelLastPayment) {
        // 기결제 유지 시 예정 회차 스케줄 취소
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
          cancelLastPayment: false,
          currentRound: sub.currentRound,
        });
      } else {
        // 승인 취소가 이미 완료된 상태에서 위약금 정산 및 구독 상태 해지
        await subscriptionService.finalizeSubscriptionCancellation({
          subscriptionId: sub.id,
          userId: sub.userId || order.userId || '',
          reason: cancelReason.trim(),
          penaltyAmount: penaltyInfo.penaltyAmount,
          shippedQuantity: penaltyInfo.shippedQuantity,
          paidAmount: penaltyInfo.paidAmount,
          regularAmount: penaltyInfo.regularAmount,
          adminAction,
          adminMemo: adminMemo.trim() || undefined,
        });
      }

      toast.success(
        cancelLastPayment
          ? `마지막 결제 취소 및 위약금 ₩${penaltyInfo.penaltyAmount.toLocaleString()}원 청구 승인이 완료되었습니다.`
          : `위약금 ₩${penaltyInfo.penaltyAmount.toLocaleString()}원 청구 승인 및 구독 해지가 완료되었습니다.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Penalty charge step error:', err);
      toast.error(err.message || '위약금 결제 승인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 위약금 미부과 & 기결제 유지 시 즉시 해지
  const handleExecuteNoPenaltyCancel = async () => {
    try {
      setLoading(true);
      await subscriptionService.cancelSubscriptionWithPenalty({
        orderId: order.id,
        subscriptionId: sub.id,
        userId: sub.userId || order.userId || '',
        reason: cancelReason.trim(),
        penaltyAmount: 0,
        shippedQuantity: penaltyInfo.shippedQuantity,
        paidAmount: penaltyInfo.paidAmount,
        regularAmount: penaltyInfo.regularAmount,
        adminAction: 'waive',
        adminMemo: adminMemo.trim() || undefined,
        cancelLastPayment: false,
        currentRound: sub.currentRound,
      });

      toast.success('위약금 면제 및 구독 해지가 완료되었습니다.');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Cancel error:', err);
      toast.error(err.message || '구독 해지 처리 중 오류가 발생했습니다.');
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
            <button
              onClick={onBack}
              className="p-1 text-neutral-400 hover:text-neutral-700 rounded transition-colors mr-1"
              title="이전 단계로"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h3 className="text-base font-bold text-neutral-900">
              {cancelLastPayment ? '마지막 결제 취소 & 정기공급 해지' : '정기공급 해지 및 위약금 정산'}
            </h3>
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
          {/* 📦 1회차 결제 취소 (위약금 0원) 안내 메세지 */}
          {penaltyInfo.shippedQuantity === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded p-4 text-xs text-amber-900 flex items-start gap-2.5 shadow-sm">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">📦 1회차 상품 결제 취소 (전액 100% 환불 대상)</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  아직 상품이 출고 전이거나 1회차 결제가 취소되므로 중도해지 위약금이 발생하지 않습니다. 승인 시 회차 결제 금액({order.totalAmount.toLocaleString()}원)이 100% 전액 취소 환불 처리됩니다.
                </p>
              </div>
            </div>
          ) : (
            /* 🟥 MyPage PenaltyModal Style Container */
            <div className={`rounded border p-4 ${hasPenalty ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              <p className={`text-sm font-medium mb-3 ${hasPenalty ? 'text-red-700' : 'text-green-700'}`}>
                {hasPenalty ? '⚠️ 중도 해지시 추가정산이 필요합니다' : '✅ 추가정산이 없습니다'}
              </p>

              {/* 요약 */}
              <div className="space-y-1 text-sm mb-3">
                <div className="flex justify-between text-neutral-700">
                  <span>기출고 수량</span>
                  <span className="font-medium">{penaltyInfo.shippedQuantity}개</span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>기납부 총액</span>
                  <span className="font-medium">{penaltyInfo.paidAmount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>
                    단가 재산정액 ({penaltyInfo.shippedQuantity}개 기준, 단가 {effectiveRegularUnitPrice.toLocaleString()}원)
                  </span>
                  <span className="font-medium">{penaltyInfo.regularAmount.toLocaleString()}원</span>
                </div>
                <div className={`flex justify-between font-semibold border-t pt-1 mt-1 ${hasPenalty ? 'text-red-700' : 'text-green-700'}`}>
                  <span>추가정산금액</span>
                  <span>{hasPenalty ? `${penaltyInfo.penaltyAmount.toLocaleString()}원` : '없음'}</span>
                </div>
              </div>

              {/* 📊 구간별 단가표 */}
              {discountTiers && discountTiers.length > 0 && (
                <div className="mt-3 p-3 bg-white border border-neutral-200 rounded">
                  <p className="text-xs font-semibold text-neutral-700 mb-2">📊 구간별 단가표</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-neutral-50">
                        <th className="px-2 py-1.5 text-left font-medium text-neutral-500 border-b border-neutral-100">수량 구간</th>
                        <th className="px-2 py-1.5 text-right font-medium text-neutral-500 border-b border-neutral-100">단가 (개당)</th>
                        <th className="px-2 py-1.5 text-right font-medium text-neutral-500 border-b border-neutral-100">적용 구간</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {discountTiers.map((tier, idx) => {
                        const targetQtyForTier = penaltyInfo.shippedQuantity;
                        const isApplied = targetQtyForTier >= tier.minQty && targetQtyForTier <= tier.maxQty;
                        const baseUnitPrice = sub.regularUnitPrice || (sub.qtyPerRound ? Math.round(order.totalAmount / sub.qtyPerRound) : 770000);
                        const tierUnitPrice = Math.round(baseUnitPrice * (1 - tier.discountRate / 100));

                        return (
                          <tr key={idx} className={isApplied ? 'bg-blue-50' : ''}>
                            <td className={`px-2 py-1.5 ${isApplied ? 'font-semibold text-blue-800' : 'text-neutral-600'}`}>
                              {tier.minQty} ~ {tier.maxQty}개
                            </td>
                            <td className={`px-2 py-1.5 text-right font-medium ${isApplied ? 'text-blue-800' : 'text-neutral-600'}`}>
                              {tierUnitPrice.toLocaleString()}원
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              {isApplied ? (
                                <span className="text-blue-700 text-[11px] font-semibold">적용구간</span>
                              ) : (
                                <span className="text-neutral-300">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {penaltyInfo.shippedQuantity > 0 && (
                    <p className="text-xs text-red-600 mt-2">
                      ※ 기출고 {penaltyInfo.shippedQuantity}개 → {penaltyInfo.appliedDiscountRate > 0 ? `${penaltyInfo.appliedDiscountRate}% 할인 구간 (${effectiveRegularUnitPrice.toLocaleString()}원/개)` : `기본 단가 (${effectiveRegularUnitPrice.toLocaleString()}원/개)`} 적용
                    </p>
                  )}
                </div>
              )}

              {/* 📐 추가정산 계산식 */}
              {hasPenalty && (
                <div className="mt-3 p-3 bg-white border border-red-100 rounded text-xs text-neutral-600 space-y-2">
                  <p className="font-semibold text-neutral-700 mb-2">📐 추가정산 계산식</p>

                  {/* ① 실제 납부금액 */}
                  <div>
                    <p className="text-neutral-500 mb-0.5">① 실제 납부금액 (단가 {paidUnitPrice.toLocaleString()}원)</p>
                    <div className="flex items-center justify-between pl-2">
                      <span className="text-neutral-400">
                        {penaltyInfo.shippedQuantity}개 × {paidUnitPrice.toLocaleString()}원
                      </span>
                      <span className="font-medium text-neutral-800">{penaltyInfo.paidAmount.toLocaleString()}원</span>
                    </div>
                  </div>

                  {/* ② 단가 재산정액 */}
                  <div>
                    <p className="text-neutral-500 mb-0.5">
                      ② 단가 재산정액 ({penaltyInfo.shippedQuantity}개 기준 단가 {effectiveRegularUnitPrice.toLocaleString()}원)
                    </p>
                    <div className="flex items-center justify-between pl-2">
                      <span className="text-neutral-400">
                        {penaltyInfo.shippedQuantity}개 × {effectiveRegularUnitPrice.toLocaleString()}원
                      </span>
                      <span className="font-medium text-neutral-800">{penaltyInfo.regularAmount.toLocaleString()}원</span>
                    </div>
                  </div>

                  {/* 추가정산 */}
                  <div className="border-t border-dashed border-red-200 pt-1.5 flex items-center justify-between font-semibold">
                    <span className="text-red-700">추가정산금액 (② − ①)</span>
                    <span className="text-red-700">{penaltyInfo.penaltyAmount.toLocaleString()}원</span>
                  </div>

                  <p className="text-[11px] text-neutral-400 pt-0.5">
                    * 정기공급으로 적용된 단가를 기존 구간별 단가로 재 정산한 차액
                  </p>
                </div>
              )}

              {hasPenalty && (
                <p className="text-xs text-red-600 mt-2">
                  * 추가 정산 금액은 해지 신청 승인 시 청구될 수 있습니다.
                </p>
              )}
            </div>
          )}

          {/* Admin Action Selection (결제 유지 회차가 있는 경우 노출) */}
          {penaltyInfo.shippedQuantity > 0 && (
            <div className="space-y-2 pt-1">
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
                    <div className="font-bold text-red-700">위약금 부과</div>
                    <div className="text-[11px] opacity-90 font-mono mt-0.5">
                      ₩{penaltyInfo.penaltyAmount.toLocaleString()} 청구
                    </div>
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
                    <div className="font-bold text-green-700">위약금 면제</div>
                    <div className="text-[11px] opacity-90 font-mono mt-0.5">₩0 (관리자 재량)</div>
                  </div>
                </label>
              </div>
            </div>
          )}

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
              onClick={onBack || onClose}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={loading || !cancelReason.trim()}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>
                {loading
                  ? '처리 중...'
                  : cancelLastPayment
                    ? '마지막 결제 취소 & 구독 해지'
                    : '기결제 유지 & 구독 해지'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ⚠️ 1단계: 마지막 결제 카드 승인 취소 확인 팝업 */}
      {confirmStep === 'confirm_refund' && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-red-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-bold text-neutral-900">
                마지막 결제 카드 승인 취소 확인
                {adminAction === 'charge' && hasPenalty && <span className="text-xs text-neutral-500 font-normal ml-2">(1/2 단계)</span>}
              </h4>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs space-y-2 text-red-900">
              <p className="font-bold">⚠️ 전자결제(PG) 카드 승인 취소 대상</p>
              <div className="space-y-1.5 text-neutral-700 font-medium pt-1">
                <div className="flex justify-between">
                  <span>취소 회차:</span>
                  <span className="font-bold text-neutral-900">{sub.currentRound || 1}회차 결제건</span>
                </div>
                <div className="flex justify-between">
                  <span>승인 취소(환불) 금액:</span>
                  <span className="font-bold text-red-600">₩{order.totalAmount.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              {adminAction === 'charge' && hasPenalty
                ? `회차 결제 금액(₩${order.totalAmount.toLocaleString()}원)의 카드 승인을 먼저 취소 처리합니다. 취소 후 2단계 위약금 결제 승인 팝업으로 이동합니다.`
                : `회차 결제 금액(₩${order.totalAmount.toLocaleString()}원)의 카드 승인이 즉시 취소되며, 복구할 수 없습니다. 승인 취소 및 정기공급 해지를 진행하시겠습니까?`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setConfirmStep('none')}
                disabled={loading}
                className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleExecutePaymentRefundStep}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {adminAction === 'charge' && hasPenalty ? '카드 승인 취소 (다음: 위약금 승인)' : '카드 승인 취소 & 해지 확정'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💳 2단계: 위약금 결제/청구 승인 팝업 */}
      {confirmStep === 'confirm_penalty' && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-red-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-bold text-neutral-900">
                위약금 결제/청구 승인
                {cancelLastPayment && <span className="text-xs text-neutral-500 font-normal ml-2">(2/2 단계)</span>}
              </h4>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs space-y-2 text-red-900">
              <p className="font-bold">💳 위약금 결제/청구 정산 내역</p>
              <div className="space-y-1.5 text-neutral-700 font-medium pt-1">
                {cancelLastPayment && paymentRefundDone && (
                  <div className="flex justify-between text-green-700 font-semibold bg-green-50 px-2 py-1 rounded">
                    <span>마지막 회차 결제 상태:</span>
                    <span>✅ 카드 승인 취소 완료</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>기출고 정산 수량:</span>
                  <span className="font-bold text-neutral-900">{penaltyInfo.shippedQuantity}개</span>
                </div>
                <div className="flex justify-between">
                  <span>부과 위약금 금액:</span>
                  <span className="font-bold text-red-700 text-sm">₩{penaltyInfo.penaltyAmount.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              {cancelLastPayment
                ? `마지막 결제 카드 승인 취소가 완료되었습니다. 약정 미달 위약금 ₩${penaltyInfo.penaltyAmount.toLocaleString()}원 부과 정산 및 정기공급 해지를 최종 승인합니다.`
                : `정기공급 중도 해지에 따른 약정 미달 위약금 ₩${penaltyInfo.penaltyAmount.toLocaleString()}원 부과 정산 및 정기공급 해지를 최종 승인합니다.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              {!cancelLastPayment && (
                <button
                  type="button"
                  onClick={() => setConfirmStep('none')}
                  disabled={loading}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  취소
                </button>
              )}
              <button
                type="button"
                onClick={handleExecutePenaltyChargeStep}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>위약금 결제 승인 & 해지 최종 완료</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
