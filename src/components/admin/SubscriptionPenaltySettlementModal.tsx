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

  // 2단계 승인 팝업 스테이트 ('none' | 'confirm_penalty' | 'confirm_refund')
  const [confirmStep, setConfirmStep] = useState<'none' | 'confirm_penalty' | 'confirm_refund'>('none');
  const [penaltySettlementDone, setPenaltySettlementDone] = useState(false);

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

    const isOrderAlreadyCancelled = (order as any).status === 'cancelled';

    // 2회차 분 이상 취소건으로 위약금 부과 대상인 경우: 1단계 [위약금 결제/청구 승인] 팝업 먼저 노출
    if (adminAction === 'charge' && hasPenalty) {
      setConfirmStep('confirm_penalty');
    } else if (cancelLastPayment && !isOrderAlreadyCancelled) {
      // 1회차 또는 위약금 면제건으로 마지막 결제 취소만 있는 경우: [카드 승인 취소] 팝업 노출
      setConfirmStep('confirm_refund');
    } else {
      // 기결제 유지 및 위약금 면제건: 즉시 해지
      handleExecuteNoPenaltyCancel();
    }
  };

  // 1단계 (위약금 부과 시): 위약금 결제/청구 승인 실행
  const handleExecutePenaltyChargeStep = async () => {
    try {
      setLoading(true);

      if (cancelLastPayment && (order as any).status !== 'cancelled') {
        // 2회차 이상 취소건: 1단계 위약금 청구 승인 완료 처리 후 -> 2단계 [마지막 결제 카드 승인 취소] 팝업으로 이동
        setPenaltySettlementDone(true);
        setConfirmStep('confirm_refund');
      } else {
        // 기결제 유지 또는 이미 카드 취소가 완료된 건: 즉시 위약금 결제 승인 & 해지 완결
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

        toast.success(`위약금 ₩${penaltyInfo.penaltyAmount.toLocaleString()}원 청구 승인 및 구독 해지가 완료되었습니다.`);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Penalty charge step error:', err);
      toast.error(err.message || '위약금 결제 승인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2단계 (위약금 부과 후) 또는 1단계 (위약금 미부과 시): 마지막 결제 카드 승인 취소 실행 및 최종 완결
  const handleExecutePaymentRefundStep = async () => {
    try {
      setLoading(true);

      // 1. 카드 승인 취소 실행
      await subscriptionService.cancelOrderPaymentOnly({
        orderId: order.id,
        subscriptionId: sub.id,
        reason: cancelReason.trim(),
        cancelAmount: order.totalAmount,
        pgTid: order.pgTid,
        currentRound: sub.currentRound,
      });

      // 2. 최종 구독 해지 및 위약금 이력 저장
      await subscriptionService.finalizeSubscriptionCancellation({
        subscriptionId: sub.id,
        userId: sub.userId || order.userId || '',
        reason: cancelReason.trim(),
        penaltyAmount: adminAction === 'charge' && hasPenalty ? penaltyInfo.penaltyAmount : 0,
        shippedQuantity: penaltyInfo.shippedQuantity,
        paidAmount: penaltyInfo.paidAmount,
        regularAmount: penaltyInfo.regularAmount,
        adminAction: hasPenalty ? adminAction : 'waive',
        adminMemo: adminMemo.trim() || undefined,
      });

      toast.success(
        adminAction === 'charge' && hasPenalty
          ? `위약금 ₩${penaltyInfo.penaltyAmount.toLocaleString()}원 청구 승인 및 마지막 결제 카드 취소가 완결되었습니다.`
          : '마지막 결제 카드 승인 취소 및 구독 해지가 완료되었습니다.'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Payment refund step error:', err);
      toast.error(err.message || '카드 승인 취소 중 오류가 발생했습니다.');
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-base tracking-tight">
              {cancelLastPayment ? '마지막 결제 취소 & 정기공급 해지' : '정기공급 해지 및 위약금 정산'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left text-neutral-800 text-xs">
          {/* 계약 기본 정보 요약 */}
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-neutral-500 block mb-1">구독 번호</span>
              <span className="font-bold text-neutral-900">{sub.subscriptionNo || order.orderNumber}</span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-1">상품명</span>
              <span className="font-semibold text-neutral-900 truncate block">{sub.product?.name || '정기공급 상품'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-1">진행 회차</span>
              <span className="font-semibold text-neutral-900">{sub.currentRound || 1} / {sub.totalRounds}회차</span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-1">회당 결제 금액</span>
              <span className="font-semibold text-neutral-900">₩{(sub.unitPrice || order.totalAmount).toLocaleString()}원</span>
            </div>
          </div>

          {/* 약정 정산 내역 및 위약금 계산 표 */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-neutral-100 px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900 text-xs">
                <Calculator className="w-4 h-4 text-neutral-700" />
                <span>위약금 및 차액 정산 상세</span>
              </div>
              <span className="text-[11px] text-neutral-500 font-medium">
                {cancelLastPayment ? '* 마지막 회차 결제 취소 반영' : '* 기결제 유지 기준'}
              </span>
            </div>

            <div className="p-4 space-y-3 bg-white">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  <span className="text-neutral-500 block mb-1">실출고 수량 (정산 대상)</span>
                  <span className="text-sm font-bold text-neutral-900">{penaltyInfo.shippedQuantity}개</span>
                  <span className="text-[11px] text-neutral-500 block mt-0.5">
                    (회당 {sub.qtyPerRound || penaltyInfo.shippedQuantity}개 출고)
                  </span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  <span className="text-neutral-500 block mb-1">고객 실제 지불 총액</span>
                  <span className="text-sm font-bold text-neutral-900">₩{penaltyInfo.paidAmount.toLocaleString()}원</span>
                  <span className="text-[11px] text-neutral-500 block mt-0.5">
                    (개당 평균 ₩{paidUnitPrice.toLocaleString()}원 지불)
                  </span>
                </div>
              </div>

              {/* 정가 대비 차액 계산 요약 표 */}
              <table className="w-full text-xs text-left border-collapse mt-2">
                <thead>
                  <tr className="bg-neutral-100 border-y border-neutral-200 text-neutral-600 font-bold text-[11px]">
                    <th className="py-2 px-3">항목</th>
                    <th className="py-2 px-3 text-right">수량/단가</th>
                    <th className="py-2 px-3 text-right">총 금액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-neutral-700">① 정가 기준 정산금액</td>
                    <td className="py-2.5 px-3 text-right text-neutral-600">{penaltyInfo.shippedQuantity}개 × ₩{effectiveRegularUnitPrice.toLocaleString()}원</td>
                    <td className="py-2.5 px-3 text-right font-bold text-neutral-900">₩{penaltyInfo.regularAmount.toLocaleString()}원</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-neutral-700">② 고객 실결제 총액</td>
                    <td className="py-2.5 px-3 text-right text-neutral-600">할인가 적용</td>
                    <td className="py-2.5 px-3 text-right font-bold text-neutral-900">₩{penaltyInfo.paidAmount.toLocaleString()}원</td>
                  </tr>
                  <tr className="bg-red-50/70 font-bold">
                    <td className="py-3 px-3 text-red-900 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                      <span>산출 위약금 (① - ②)</span>
                    </td>
                    <td className="py-3 px-3 text-right text-red-700" colSpan={2}>
                      <span className="text-sm text-red-600">₩{penaltyInfo.penaltyAmount.toLocaleString()}원</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* 구간별 할인 혜택 안내 */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>수량 구간별 할인 혜택 요약</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  * 계약 시 수량 약정에 따라 구간 할인이 적용되었으나, 중도 해지 시 기출고 수량({penaltyInfo.shippedQuantity}개)에 대한 정가 차액이 위약금으로 산출됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 위약금 부과 / 면제 선택 옵션 */}
          <div className="space-y-3">
            <label className="font-bold text-neutral-900 block">위약금 처리 방식 선택</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  adminAction === 'charge'
                    ? 'border-red-500 bg-red-50/50 text-red-900 font-bold shadow-2xs'
                    : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="adminAction"
                  value="charge"
                  checked={adminAction === 'charge'}
                  onChange={() => setAdminAction('charge')}
                  className="accent-red-600"
                />
                <div>
                  <span className="block text-xs">위약금 부과 (정산 청구)</span>
                  <span className="text-[11px] font-normal text-neutral-500 block">
                    차액 ₩{penaltyInfo.penaltyAmount.toLocaleString()}원 추가 결제/청구
                  </span>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  adminAction === 'waive'
                    ? 'border-neutral-800 bg-neutral-900 text-white font-bold shadow-2xs'
                    : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="adminAction"
                  value="waive"
                  checked={adminAction === 'waive'}
                  onChange={() => setAdminAction('waive')}
                  className="accent-neutral-900"
                />
                <div>
                  <span className="block text-xs">위약금 면제</span>
                  <span className="text-[11px] font-normal opacity-80 block">
                    위약금 ₩0원 (고객 사정 감안 면제)
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 해지 사유 입력 */}
          <div className="space-y-1.5">
            <label className="font-bold text-neutral-900 block">
              해지 사유 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="예: 고객 요청, 제품 사용 종료, 수량 부담 등"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-neutral-800"
            />
          </div>

          {/* 관리자 메모 */}
          <div className="space-y-1.5">
            <label className="font-bold text-neutral-900 block">관리자 처리 메모 (선택)</label>
            <textarea
              value={adminMemo}
              onChange={(e) => setAdminMemo(e.target.value)}
              rows={2}
              placeholder="내부 관리용 메모를 입력하세요."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-neutral-800 resize-none"
            />
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>뒤로가기</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              취소
            </button>

            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={loading}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {adminAction === 'charge' && hasPenalty
                  ? '해지 및 위약금 승인 팝업으로 이동'
                  : cancelLastPayment
                  ? '마지막 결제 취소 & 해지 실행'
                  : '정기공급 해지 실행'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 💳 1단계 (2회차 이상 부과 시): 위약금 결제/청구 승인 팝업 */}
      {confirmStep === 'confirm_penalty' && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-red-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4 text-left">
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-bold text-neutral-900">
                위약금 결제/청구 승인
                {cancelLastPayment && <span className="text-xs text-neutral-500 font-normal ml-2">(1/2 단계)</span>}
              </h4>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs space-y-2 text-red-900">
              <p className="font-bold">💳 위약금 결제/청구 정산 내역</p>
              <div className="space-y-1.5 text-neutral-700 font-medium pt-1">
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
                ? `정기공급 중도 해지에 따른 약정 미달 위약금 ₩${penaltyInfo.penaltyAmount.toLocaleString()}원 부과 정산 및 청구 승인을 먼저 실행합니다. (다음 단계: 마지막 결제 카드 승인 취소)`
                : `정기공급 중도 해지에 따른 약정 미달 위약금 ₩${penaltyInfo.penaltyAmount.toLocaleString()}원 부과 정산 및 구독 해지를 최종 승인합니다.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setConfirmStep('none')}
                disabled={loading}
                className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleExecutePenaltyChargeStep}
                disabled={loading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {cancelLastPayment ? '위약금 결제 승인 (다음: 카드 승인 취소)' : '위약금 결제 승인 & 해지 최종 완료'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💳 2단계 (2회차 이상 부과 후) 또는 1단계 (미부과 시): 마지막 결제 카드 승인 취소 팝업 */}
      {confirmStep === 'confirm_refund' && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-red-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4 text-left">
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-bold text-neutral-900">
                마지막 결제 카드 승인 취소
                {adminAction === 'charge' && hasPenalty && <span className="text-xs text-neutral-500 font-normal ml-2">(2/2 단계)</span>}
              </h4>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs space-y-2 text-red-900">
              <p className="font-bold">🚨 카드 승인 취소 내역</p>
              <div className="space-y-1.5 text-neutral-700 font-medium pt-1">
                {adminAction === 'charge' && hasPenalty && penaltySettlementDone && (
                  <div className="flex justify-between text-green-700 font-semibold bg-green-50 px-2 py-1 rounded">
                    <span>1단계 위약금 청구 승인:</span>
                    <span>✅ 결제 승인 완료 (₩{penaltyInfo.penaltyAmount.toLocaleString()}원)</span>
                  </div>
                )}
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
                ? `1단계 위약금 ₩${penaltyInfo.penaltyAmount.toLocaleString()}원 결제 승인이 완료되었습니다. 회차 결제 금액(₩${order.totalAmount.toLocaleString()}원)의 카드 승인을 취소하고 정기공급 해지를 최종 완결합니다.`
                : `회차 결제 금액(₩${order.totalAmount.toLocaleString()}원)의 카드 승인이 즉시 취소되며, 복구할 수 없습니다. 승인 취소 및 정기공급 해지를 진행하시겠습니까?`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setConfirmStep('none')}
                disabled={loading}
                className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleExecutePaymentRefundStep}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {adminAction === 'charge' && hasPenalty ? '카드 승인 취소 & 해지 최종 완료' : '카드 승인 취소 & 해지 확정'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
