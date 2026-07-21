import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Calendar, Package, Play, Pause, XCircle, Edit2,
  MapPin, Clock, CreditCard, ChevronRight, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Loader2,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { useModal } from '../context/ModalContext';
import { authService } from '../services/authService';
import {
  subscriptionService,
  SubscriptionRow,
  SubscriptionScheduleRow,
} from '../services/subscriptionService';

// ─────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────

function getStatusBadge(status: SubscriptionRow['status']) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          <Play className="w-3 h-3 mr-1" />진행중
        </Badge>
      );
    case 'paused':
      return (
        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
          <Pause className="w-3 h-3 mr-1" />일시정지
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />해지완료
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="outline" className="bg-neutral-200 text-neutral-600 border-neutral-300">
          만료
        </Badge>
      );
  }
}

function getShipmentStatusBadge(status: SubscriptionScheduleRow['status']) {
  const map: Record<string, { label: string; className: string }> = {
    pending:   { label: '예정', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    paid:      { label: '결제완료', className: 'bg-green-100 text-green-700 border-green-200' },
    shipped:   { label: '출고완료', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    failed:    { label: '결제실패', className: 'bg-red-100 text-red-700 border-red-200' },
    skipped:   { label: '건너뜀', className: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
    cancelled: { label: '취소', className: 'bg-neutral-100 text-neutral-500 border-neutral-200 line-through' },
  };
  const s = map[status] ?? { label: status, className: 'bg-neutral-100 text-neutral-600' };
  return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return dateStr.replace(/-/g, '.');
}

// ─────────────────────────────────────────
// 위약금 확인 모달
// ─────────────────────────────────────────

interface PenaltyModalProps {
  open: boolean;
  sub: SubscriptionRow;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

function PenaltyModal({ open, sub, onConfirm, onClose }: PenaltyModalProps) {
  const [reason, setReason] = useState('');
  const penalty = subscriptionService.calculatePenaltyPreview(sub);

  const hasPenalty = penalty.penaltyAmount > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            정기구독 해지 신청
          </DialogTitle>
          <DialogDescription>
            해지 전 아래 내용을 반드시 확인해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 위약금 안내 */}
          <div className={`rounded border p-4 ${hasPenalty ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <p className={`text-sm font-medium mb-3 ${hasPenalty ? 'text-red-700' : 'text-green-700'}`}>
              {hasPenalty ? '⚠️ 해지 위약금이 발생합니다' : '✅ 위약금이 없습니다'}
            </p>

            {/* 요약 */}
            <div className="space-y-1 text-sm mb-3">
              <div className="flex justify-between text-neutral-700">
                <span>기출고 수량</span>
                <span className="font-medium">{penalty.shippedQuantity}개</span>
              </div>
              <div className="flex justify-between text-neutral-700">
                <span>기납부 총액</span>
                <span className="font-medium">{penalty.paidAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-neutral-700">
                <span>
                  일반가 재산정액 ({penalty.shippedQuantity}개 기준
                  {penalty.appliedDiscountRate > 0 ? `, ${penalty.appliedDiscountRate}% 구간` : ''})
                </span>
                <span className="font-medium">{penalty.regularAmount.toLocaleString()}원</span>
              </div>
              <div className={`flex justify-between font-semibold border-t pt-1 mt-1 ${hasPenalty ? 'text-red-700' : 'text-green-700'}`}>
                <span>위약금</span>
                <span>{hasPenalty ? `${penalty.penaltyAmount.toLocaleString()}원` : '없음'}</span>
              </div>
            </div>

            {/* 갯수별 할인표 */}
            {sub.quantityDiscountTiers && sub.quantityDiscountTiers.length > 0 && (
              <div className="mt-3 p-3 bg-white border border-neutral-200 rounded">
                <p className="text-xs font-semibold text-neutral-700 mb-2">📊 갯수별 할인율 기준표</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-neutral-50">
                      <th className="px-2 py-1.5 text-left font-medium text-neutral-500 border-b border-neutral-100">수량 구간</th>
                      <th className="px-2 py-1.5 text-right font-medium text-neutral-500 border-b border-neutral-100">할인율</th>
                      <th className="px-2 py-1.5 text-right font-medium text-neutral-500 border-b border-neutral-100">적용 구간</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {[...sub.quantityDiscountTiers]
                      .sort((a, b) => a.minQty - b.minQty)
                      .map((tier, idx) => {
                        const isApplied =
                          penalty.shippedQuantity >= tier.minQty &&
                          penalty.shippedQuantity <= tier.maxQty;
                        return (
                          <tr
                            key={idx}
                            className={isApplied ? 'bg-blue-50' : ''}
                          >
                            <td className={`px-2 py-1.5 ${isApplied ? 'font-semibold text-blue-800' : 'text-neutral-600'}`}>
                              {tier.minQty} ~ {tier.maxQty}개
                            </td>
                            <td className={`px-2 py-1.5 text-right ${isApplied ? 'font-semibold text-blue-800' : 'text-neutral-600'}`}>
                              {tier.discountRate}%
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
                {penalty.appliedDiscountRate > 0 && (
                  <p className="text-[10px] text-blue-500 mt-1.5">
                    ※ 기출고 {penalty.shippedQuantity}개 → {penalty.appliedDiscountRate}% 할인 구간 단가로 위약금 산정
                  </p>
                )}
              </div>
            )}

            {/* 위약금 계산식 */}
            {hasPenalty && (() => {
              // 개당 구독 실제 납부 단가
              const subscriptionUnitPricePerItem = sub.qtyPerRound > 0
                ? Math.round(sub.unitPrice / sub.qtyPerRound)
                : sub.regularUnitPrice;
              // ① 기존 받은 할인금액 = 기출고 × (원가 − 구독단가)
              const receivedDiscount = penalty.shippedQuantity * (sub.regularUnitPrice - subscriptionUnitPricePerItem);
              // ② 갯수구간 기준 할인금액 = 기출고 × 원가 × 갯수구간 할인율
              const tierDiscount = Math.round(penalty.shippedQuantity * sub.regularUnitPrice * penalty.appliedDiscountRate / 100);
              return (
                <div className="mt-3 p-3 bg-white border border-red-100 rounded text-xs text-neutral-600 space-y-2">
                  <p className="font-semibold text-neutral-700 mb-2">📐 위약금 계산식</p>

                  {/* ① 기존 받은 할인금액 */}
                  <div>
                    <p className="text-neutral-500 mb-0.5">① 기존 받은 할인금액 (구독 혜택, {sub.discountRate}%)</p>
                    <div className="flex items-center justify-between pl-2">
                      <span className="text-neutral-400">
                        {penalty.shippedQuantity}개 × {sub.regularUnitPrice?.toLocaleString()}원 × {sub.discountRate}%
                      </span>
                      <span className="font-medium text-neutral-800">{receivedDiscount.toLocaleString()}원</span>
                    </div>
                  </div>

                  {/* ② 갯수구간 기준 할인금액 */}
                  <div>
                    <p className="text-neutral-500 mb-0.5">② 갯수구간 기준 할인금액 ({penalty.appliedDiscountRate}%)</p>
                    <div className="flex items-center justify-between pl-2">
                      <span className="text-neutral-400">
                        {penalty.shippedQuantity}개 × {sub.regularUnitPrice?.toLocaleString()}원 × {penalty.appliedDiscountRate}%
                      </span>
                      <span className="font-medium text-neutral-800">{tierDiscount.toLocaleString()}원</span>
                    </div>
                  </div>

                  {/* 위약금 */}
                  <div className="border-t border-dashed border-red-200 pt-1.5 flex items-center justify-between font-semibold">
                    <span className="text-red-700">위약금 (① − ②)</span>
                    <span className="text-red-700">{penalty.penaltyAmount.toLocaleString()}원</span>
                  </div>

                  <p className="text-[11px] text-neutral-400 pt-0.5">
                    * 구독으로 받은 할인({receivedDiscount.toLocaleString()}원) 중 갯수구간 혜택({tierDiscount.toLocaleString()}원)을 초과한 금액
                  </p>
                </div>
              );
            })()}

            {hasPenalty && (
              <p className="text-xs text-red-600 mt-2">
                * 위약금은 관리자 검토 후 실제 청구 여부가 결정됩니다.
              </p>
            )}
          </div>

          {/* 해지 사유 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              해지 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="해지 사유를 입력해주세요"
              className="w-full h-24 px-3 py-2 border border-neutral-300 text-sm text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="border-neutral-300">
            취소
          </Button>
          <Button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            해지 신청
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// 회차 스케줄 아코디언
// ─────────────────────────────────────────

function ShipmentSchedule({ shipments }: { shipments: SubscriptionScheduleRow[] }) {
  const [open, setOpen] = useState(false);
  const sorted = [...shipments].sort((a, b) => a.roundNo - b.roundNo);

  return (
    <div className="border border-neutral-200 rounded">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-400" />
          회차별 출고 스케줄 ({shipments.length}회)
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="border-t border-neutral-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600">회차</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600">예정일</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-neutral-600">수량</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-neutral-600">금액</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sorted.map((s) => (
                  <tr key={s.id} className={s.status === 'cancelled' ? 'opacity-40' : ''}>
                    <td className="px-4 py-2 text-neutral-900 font-medium">{s.roundNo}회차</td>
                    <td className="px-4 py-2 text-neutral-700">{formatDate(s.scheduledDate)}</td>
                    <td className="px-4 py-2 text-right text-neutral-700">{s.quantity}개</td>
                    <td className="px-4 py-2 text-right text-neutral-700">{s.amount.toLocaleString()}원</td>
                    <td className="px-4 py-2 text-center">{getShipmentStatusBadge(s.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// 구독 카드
// ─────────────────────────────────────────

interface SubscriptionCardProps {
  sub: SubscriptionRow;
  onPause: (sub: SubscriptionRow) => void;
  onResume: (sub: SubscriptionRow) => void;
  onCancel: (sub: SubscriptionRow) => void;
}

function SubscriptionCard({ sub, onPause, onResume, onCancel }: SubscriptionCardProps) {
  const isActive = sub.status === 'active';
  const isPaused = sub.status === 'paused';
  const isCancelled = sub.status === 'cancelled' || sub.status === 'expired';

  return (
    <div className={`bg-white border border-neutral-200 p-6 space-y-4 ${isCancelled ? 'opacity-60' : ''}`}>
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-medium text-neutral-900">
              {sub.product?.name ?? '상품명 로딩 중'}
            </h4>
            {getStatusBadge(sub.status)}
          </div>
          <p className="text-sm text-neutral-500">
            총 {sub.totalQuantity}개 · {sub.cycleMonths}개월 주기 · 총 {sub.totalRounds}회
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-500">회차별 결제금액</p>
          <p className="text-base font-semibold text-neutral-900">
            {sub.unitPrice.toLocaleString()}원
          </p>
          {sub.discountRate > 0 && (
            <p className="text-xs text-[#21358D]">{sub.discountRate}% 할인 적용</p>
          )}
        </div>
      </div>

      {/* 진행 정보 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded">
          <RefreshCw className="w-4 h-4 text-neutral-400 shrink-0" />
          <div>
            <p className="text-xs text-neutral-500">진행 회차</p>
            <p className="text-sm font-medium text-neutral-900">
              {sub.currentRound} / {sub.totalRounds}회
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded">
          <Package className="w-4 h-4 text-neutral-400 shrink-0" />
          <div>
            <p className="text-xs text-neutral-500">회차별 출고</p>
            <p className="text-sm font-medium text-neutral-900">{sub.qtyPerRound}개</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded">
          <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
          <div>
            <p className="text-xs text-neutral-500">다음 결제일</p>
            <p className="text-sm font-medium text-neutral-900">
              {isActive ? formatDate(sub.nextBillingDate) : '-'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded">
          <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
          <div>
            <p className="text-xs text-neutral-500">최근 결제일</p>
            <p className="text-sm font-medium text-neutral-900">
              {formatDate(sub.lastBillingDate)}
            </p>
          </div>
        </div>
      </div>

      {/* 회차 스케줄 */}
      {sub.shipments && sub.shipments.length > 0 && (
        <ShipmentSchedule shipments={sub.shipments} />
      )}

      {/* 해지 안내 */}
      {isCancelled && sub.cancelledAt && (
        <div className="flex items-start gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded text-sm text-neutral-600">
          <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <span>
            {formatDate(sub.cancelledAt.split('T')[0])} 해지됨
            {sub.cancelReason && ` · ${sub.cancelReason}`}
          </span>
        </div>
      )}

      {/* 버튼 */}
      {!isCancelled && (
        <div className="flex flex-wrap gap-2 pt-2">
          {isActive && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPause(sub)}
                className="border-neutral-300 text-neutral-700 hover:bg-neutral-50"
              >
                <Pause className="w-3.5 h-3.5 mr-1" />일시정지
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(sub)}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />해지 신청
              </Button>
            </>
          )}
          {isPaused && (
            <Button
              size="sm"
              onClick={() => onResume(sub)}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <Play className="w-3.5 h-3.5 mr-1" />재개하기
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────

export function MySubscriptionsPage() {
  const { alert: globalAlert, confirm: globalConfirm } = useModal();

  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 해지 신청 모달
  const [cancelTarget, setCancelTarget] = useState<SubscriptionRow | null>(null);
  const [processing, setProcessing] = useState(false);

  // ── 데이터 로드 ──
  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (!user) return;
      const data = await subscriptionService.getMySubscriptions(user.id);
      setSubscriptions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // ── 일시정지 ──
  const handlePause = async (sub: SubscriptionRow) => {
    const ok = await globalConfirm('정기구독을 일시정지하시겠습니까?\n다음 결제일이 일시정지됩니다.');
    if (!ok) return;
    try {
      await subscriptionService.pauseSubscription(sub.id);
      await globalAlert('일시정지되었습니다.');
      loadSubscriptions();
    } catch {
      await globalAlert('처리 중 오류가 발생했습니다.');
    }
  };

  // ── 재개 ──
  const handleResume = async (sub: SubscriptionRow) => {
    const ok = await globalConfirm('정기구독을 재개하시겠습니까?');
    if (!ok) return;
    try {
      await subscriptionService.resumeSubscription(sub.id);
      await globalAlert('재개되었습니다. 다음 결제일부터 진행됩니다.');
      loadSubscriptions();
    } catch {
      await globalAlert('처리 중 오류가 발생했습니다.');
    }
  };

  // ── 해지 신청 (위약금 모달에서 확인 후 호출) ──
  const handleCancelConfirm = async (reason: string) => {
    if (!cancelTarget) return;
    setProcessing(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;
      await subscriptionService.requestCancellation({
        subscriptionId: cancelTarget.id,
        userId: user.id,
        cancelReason: reason,
        sub: cancelTarget,
      });
      setCancelTarget(null);
      await globalAlert(
        '해지 신청이 접수되었습니다.\n관리자 검토 후 처리 결과를 안내드립니다.'
      );
      loadSubscriptions();
    } catch {
      await globalAlert('처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  // ── 집계 ──
  const active = subscriptions.filter((s) => s.status === 'active');
  const paused = subscriptions.filter((s) => s.status === 'paused');
  const cancelled = subscriptions.filter((s) => s.status === 'cancelled' || s.status === 'expired');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl tracking-tight text-neutral-900 mb-1">정기구독 관리</h2>
        <p className="text-sm text-neutral-500">정기구독 현황과 회차별 출고 스케줄을 확인하세요.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '전체', value: subscriptions.length, color: 'text-neutral-900' },
          { label: '진행중', value: active.length, color: 'text-green-600' },
          { label: '일시정지', value: paused.length, color: 'text-orange-500' },
          { label: '해지', value: cancelled.length, color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 진행중 */}
      {active.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            진행중인 정기구독
          </h3>
          <div className="space-y-4">
            {active.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                onPause={handlePause}
                onResume={handleResume}
                onCancel={setCancelTarget}
              />
            ))}
          </div>
        </section>
      )}

      {/* 일시정지 */}
      {paused.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
            일시정지된 정기구독
          </h3>
          <div className="space-y-4">
            {paused.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                onPause={handlePause}
                onResume={handleResume}
                onCancel={setCancelTarget}
              />
            ))}
          </div>
        </section>
      )}

      {/* 해지 완료 */}
      {cancelled.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-neutral-500 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neutral-400 inline-block" />
            해지 완료
          </h3>
          <div className="space-y-4">
            {cancelled.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                onPause={handlePause}
                onResume={handleResume}
                onCancel={setCancelTarget}
              />
            ))}
          </div>
        </section>
      )}

      {/* 빈 상태 */}
      {subscriptions.length === 0 && (
        <div className="bg-white border border-neutral-200 p-16 text-center">
          <RefreshCw className="w-14 h-14 text-neutral-200 mx-auto mb-4" />
          <h3 className="text-base font-medium text-neutral-700 mb-1">정기구독 내역이 없습니다</h3>
          <p className="text-sm text-neutral-500">자주 사용하는 소모품을 정기구독으로 편리하게 받아보세요.</p>
        </div>
      )}

      {/* 위약금 확인 + 해지신청 모달 */}
      {cancelTarget && (
        <PenaltyModal
          open={!!cancelTarget}
          sub={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => !processing && setCancelTarget(null)}
        />
      )}
    </div>
  );
}