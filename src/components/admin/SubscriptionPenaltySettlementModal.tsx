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

  const isCurrentRoundShipped = ['shipped', 'delivered', 'partially_shipped'].includes((order as any).status || '');

  // 위약금 계산 미리보기
  const penaltyInfo = useMemo(() => {
    return subscriptionService.calculatePenaltyPreview(sub, isCurrentRoundShipped);
  }, [sub, isCurrentRoundShipped]);

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
      <div className="bg-white rounded-xl border border-neutral-300 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
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
          {/* Summary Card (Light Theme) */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
              <span className="text-xs font-bold text-neutral-500">구독 상품</span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isCurrentRoundShipped
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {isCurrentRoundShipped ? `${sub.currentRound || 1}회차 출고 완료` : `${sub.currentRound || 1}회차 출고 전 (위약금 0원)`}
                </span>
                <span className="text-xs font-bold text-neutral-900 truncate max-w-[150px]">
                  {sub.product?.name || '정기공급 상품'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-neutral-500 block text-[11px]">기출고 수량 (회차)</span>
                <span className="font-bold text-neutral-900 text-sm">
                  {penaltyInfo.shippedQuantity}개 ({sub.currentRound || 1}회차)
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">기납부 총액</span>
                <span className="font-bold text-neutral-900 text-sm">
                  ₩{penaltyInfo.paidAmount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">정가 재산정 금액</span>
                <span className="font-bold text-neutral-700">
                  ₩{penaltyInfo.regularAmount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">적용 구간 할인율</span>
                <span className="font-bold text-blue-600">{penaltyInfo.appliedDiscountRate}%</span>
              </div>
            </div>

            {/* Calculated Penalty Highlight Box */}
            <div className={`border rounded-lg p-3 flex items-center justify-between mt-1 ${
              hasPenalty
                ? 'bg-red-50/80 border-red-200 text-red-900'
                : 'bg-green-50/80 border-green-200 text-green-900'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-800">중도해지 산출 위약금</span>
              </div>
              <span className={`text-base font-extrabold ${hasPenalty ? 'text-red-600' : 'text-green-700'}`}>
                ₩{penaltyInfo.penaltyAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 📊 프론트 마이페이지 스타일: 구간별 단가표 */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
              <Table className="w-3.5 h-3.5 text-blue-600" />
              <span>구간별 단가표</span>
            </div>
            <table className="w-full text-xs bg-white rounded border border-neutral-200 overflow-hidden">
              <thead>
                <tr className="bg-neutral-100 text-neutral-600">
                  <th className="px-2.5 py-1.5 text-left font-medium border-b border-neutral-200">수량 구간</th>
                  <th className="px-2.5 py-1.5 text-right font-medium border-b border-neutral-200">단가 (개당)</th>
                  <th className="px-2.5 py-1.5 text-right font-medium border-b border-neutral-200">적용 구간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {discountTiers.map((tier, idx) => {
                  const targetQtyForTier = isCurrentRoundShipped
                    ? penaltyInfo.shippedQuantity
                    : (sub.qtyPerRound || (sub.totalQuantity ? Math.round(sub.totalQuantity / (sub.totalRounds || 1)) : 250));

                  const isApplied = targetQtyForTier >= tier.minQty && targetQtyForTier <= tier.maxQty;
                  const baseUnitPrice = sub.regularUnitPrice || (sub.qtyPerRound ? Math.round(order.totalAmount / sub.qtyPerRound) : 770000);
                  const tierUnitPrice = Math.round(baseUnitPrice * (1 - tier.discountRate / 100));

                  return (
                    <tr key={idx} className={isApplied ? (isCurrentRoundShipped ? 'bg-blue-50/80 font-bold' : 'bg-amber-50/80 font-bold') : ''}>
                      <td className={`px-2.5 py-1.5 ${isApplied ? (isCurrentRoundShipped ? 'text-blue-900 font-bold' : 'text-amber-900 font-bold') : 'text-neutral-600'}`}>
                        {tier.minQty} ~ {tier.maxQty}개
                      </td>
                      <td className={`px-2.5 py-1.5 text-right ${isApplied ? (isCurrentRoundShipped ? 'text-blue-900 font-bold' : 'text-amber-900 font-bold') : 'text-neutral-600'}`}>
                        {tierUnitPrice.toLocaleString()}원
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        {isApplied ? (
                          <span className={`inline-block px-1.5 py-0.5 text-white text-[10px] font-bold rounded ${
                            isCurrentRoundShipped ? 'bg-blue-600' : 'bg-amber-600'
                          }`}>
                            {isCurrentRoundShipped ? `적용 구간 (${targetQtyForTier}개)` : `약정 구간 (${targetQtyForTier}개)`}
                          </span>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 📦 1회차 출고 전 안내 메세지 */}
          {!isCurrentRoundShipped && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5 shadow-sm">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">📦 1회차 상품 출고 전 (전액 100% 환불 대상)</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  아직 상품이 출고되지 않았으므로 중도해지 위약금이 발생하지 않습니다. 구독 해지 승인 시 회차 결제 금액(₩{order.totalAmount.toLocaleString()}원)이 100% 전액 취소 환불 처리됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 📐 프론트 마이페이지 스타일: 추가정산 계산식 (출고 완료된 경우만 노출) */}
          {isCurrentRoundShipped && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-neutral-700">
                <Calculator className="w-3.5 h-3.5 text-amber-600" />
                <span>추가정산 계산식</span>
              </div>

              <div className="bg-white border border-neutral-200 rounded p-2.5 space-y-2">
                <div>
                  <p className="text-neutral-500 text-[11px] mb-0.5">① 기납부 실 납부금액</p>
                  <div className="flex justify-between font-mono text-neutral-800 font-semibold pl-2">
                    <span>{penaltyInfo.shippedQuantity}개 × ₩{paidUnitPrice.toLocaleString()}</span>
                    <span>₩{penaltyInfo.paidAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <p className="text-neutral-500 text-[11px] mb-0.5">
                    ② 단가 재산정 금액 ({penaltyInfo.appliedDiscountRate}% 할인 구간 적용)
                  </p>
                  <div className="flex justify-between font-mono text-neutral-800 font-semibold pl-2">
                    <span>{penaltyInfo.shippedQuantity}개 × ₩{effectiveRegularUnitPrice.toLocaleString()}</span>
                    <span>₩{penaltyInfo.regularAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-neutral-300 pt-1.5 flex justify-between font-bold text-sm">
                  <span className={hasPenalty ? 'text-red-600' : 'text-green-600'}>
                    산출 위약금 (② − ①)
                  </span>
                  <span className={hasPenalty ? 'text-red-600 font-extrabold' : 'text-green-600 font-extrabold'}>
                    ₩{penaltyInfo.penaltyAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Admin Action Selection (출고 완료된 경우만 노출) */}
          {isCurrentRoundShipped && (
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
              onClick={onBack}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              이전 단계
            </button>
            <button
              type="button"
              onClick={handleExecuteCancel}
              disabled={loading || !cancelReason.trim()}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
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
