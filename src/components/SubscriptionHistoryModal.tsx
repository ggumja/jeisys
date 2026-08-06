import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  History, Calendar, Package, AlertCircle, CheckCircle, Clock, XCircle,
  ArrowRight, Loader2, ShieldAlert, CreditCard, MapPin, RefreshCw, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionService, SubscriptionRow, SubscriptionScheduleRow, CancellationRequest } from '../services/subscriptionService';
import { useNavigate } from 'react-router';

interface SubscriptionHistoryModalProps {
  order?: any;
  sub?: SubscriptionRow;
  subProductsMap?: Record<string, any>;
  isAdmin?: boolean;
  onClose: () => void;
}

export interface ActivityLogEvent {
  id: string;
  timestamp: string;
  type: 'CONTRACT' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAIL' | 'PAUSE' | 'RESUME' | 'ADDRESS_CHANGE' | 'CANCEL_REQUEST' | 'CANCEL_PROCESSED' | 'SKIPPED';
  title: string;
  description: string;
  badge: { label: string; style: React.CSSProperties };
  dotColor: string;
  amount?: number;
  actor?: string;
  actionType?: 'RETRY_CARD_CANCEL' | 'RETRY_PENALTY';
  isPending?: boolean;
}

export function SubscriptionHistoryModal({ order, sub: initialSub, subProductsMap, isAdmin = true, onClose }: SubscriptionHistoryModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<SubscriptionRow | null>(initialSub || null);
  const [cancellationRequest, setCancellationRequest] = useState<CancellationRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, [order, initialSub]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: SubscriptionRow | null = null;

      if (initialSub) {
        data = await subscriptionService.getSubscriptionDetail(initialSub.id);
        if (!data) data = initialSub;
      } else if (order) {
        data = await subscriptionService.getSubscriptionByOrderId(order.id);
        if (!data && (order as any).userId) {
          const mySubs = await subscriptionService.getMySubscriptions((order as any).userId);
          if (mySubs.length > 0) {
            data = mySubs[0];
          }
        }
      }

      if (!data && order) {
        const firstItem = order.items?.[0] || order.orderItems?.[0];
        const totalQty = firstItem?.quantity || 100;
        const totalRounds = 8;
        const qtyPerRound = Math.round(totalQty / totalRounds);
        const unitPrice = order.totalAmount || firstItem?.price || 0;

        const dummyShipments: SubscriptionScheduleRow[] = Array.from({ length: totalRounds }, (_, idx) => {
          const roundNo = idx + 1;
          const date = new Date(order.date || Date.now());
          date.setMonth(date.getMonth() + idx);
          const isPaid = roundNo === 1;
          return {
            id: `dummy-${roundNo}`,
            subscriptionId: order.id,
            roundNo,
            scheduledDate: date.toISOString().split('T')[0],
            quantity: qtyPerRound,
            amount: unitPrice,
            status: isPaid ? 'paid' : 'pending',
            executedAt: isPaid ? (order.date || new Date().toISOString()) : undefined,
          };
        });

        data = {
          id: order.id,
          userId: order.userId || '',
          subscriptionNo: (order.orderNumber?.startsWith('SUB') ? order.orderNumber : `SUB-${order.orderNumber}`),
          status: 'active',
          cycleDays: 30,
          cycleMonths: 1,
          totalQuantity: totalQty,
          totalRounds: totalRounds,
          qtyPerRound,
          lastRoundQty: qtyPerRound,
          currentRound: 1,
          unitPrice,
          regularUnitPrice: Math.round(unitPrice * 1.1),
          discountRate: 10,
          nextBillingDate: new Date().toISOString().split('T')[0],
          createdAt: order.date || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          product: { name: firstItem?.product?.name || firstItem?.productName || '정기공급 상품' },
          shipments: dummyShipments,
          pauseCount: 0,
        };
      }

      setSub(data);

      if (data?.id) {
        const cancelReq = await subscriptionService.getCancellationRequestBySubId(data.id);
        setCancellationRequest(cancelReq);
      }
    } catch (err: any) {
      console.error('Failed to load subscription history:', err);
      setError('정기공급 이력 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryCardCancel = async (log: ActivityLogEvent) => {
    if (!sub) return;
    try {
      setProcessingActionId(log.id);
      await subscriptionService.cancelLastPayment(sub.id);
      toast.success('신용카드 승인취소 재요청이 성공적으로 처리되었습니다.');
      await loadSubscriptionData();
    } catch (err: any) {
      console.error('Failed to retry card cancel:', err);
      toast.error(err.message || '승인취소 재요청 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleRetryPenaltySettlement = async (log: ActivityLogEvent) => {
    if (!cancellationRequest) {
      toast.info('위약금 정산 요청건 정보를 찾을 수 없습니다.');
      return;
    }
    try {
      setProcessingActionId(log.id);
      await subscriptionService.processCancellationRequest(cancellationRequest.id, {
        adminAction: 'charge',
        penaltyAmount: cancellationRequest.penaltyAmount || 0,
        adminMemo: '관리자 히스토리 모달 재요청 결제 승인',
      });
      toast.success('위약금 결제 정산 재요청이 성공적으로 승인 처리되었습니다.');
      await loadSubscriptionData();
    } catch (err: any) {
      console.error('Failed to retry penalty settlement:', err);
      toast.error(err.message || '위약금 결제 재요청 승인 중 오류가 발생했습니다.');
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleRetryShipmentPayment = async (log: ActivityLogEvent) => {
    if (!sub) return;
    try {
      setProcessingActionId(log.id);
      await subscriptionService.executeNextPayment(sub.id);
      toast.success('회차 정기결제 재시도가 성공적으로 실행되었습니다.');
      await loadSubscriptionData();
    } catch (err: any) {
      console.error('Failed to retry shipment payment:', err);
      toast.error(err.message || '회차 결제 재시도 중 오류가 발생했습니다.');
    } finally {
      setProcessingActionId(null);
    }
  };

  // Build Chronological Occurred Activity Logs
  const buildActivityLogs = (): ActivityLogEvent[] => {
    if (!sub) return [];
    const logs: ActivityLogEvent[] = [];

    const contractTime = sub.createdAt || sub.updatedAt || new Date().toISOString();

    // 1. Contract / Initial Order Creation
    logs.push({
      id: `evt-contract-${sub.id}`,
      timestamp: contractTime,
      type: 'CONTRACT',
      title: '신규 정기공급 계약 체결',
      description: `${sub.product?.name || '정기공급'} 총 ${sub.totalRounds}회차 플랜 (회차당 ₩${sub.unitPrice.toLocaleString()})`,
      badge: { label: '계약체결', style: { backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' } },
      dotColor: '#10b981',
      amount: sub.unitPrice,
      actor: '고객 결제',
    });

    // 2. Shipment Events (Paid, Shipped, Failed, Skipped)
    (sub.shipments || []).forEach((s) => {
      if (s.status === 'paid' || s.status === 'shipped' || s.status === 'delivered') {
        // If 1st round executed on same date as contract, align timestamp to contract time + 1s for proper flow
        let shipTimestamp = s.executedAt || s.scheduledDate || contractTime;
        if (s.roundNo === 1 && contractTime) {
          const contractDateStr = new Date(contractTime).toISOString().split('T')[0];
          const shipDateStr = new Date(shipTimestamp).toISOString().split('T')[0];
          if (contractDateStr === shipDateStr) {
            shipTimestamp = new Date(new Date(contractTime).getTime() + 1000).toISOString();
          }
        }

        logs.push({
          id: `evt-ship-${s.id}`,
          timestamp: shipTimestamp,
          type: 'PAYMENT_SUCCESS',
          title: `${s.roundNo}회차 정기결제 및 출고 완료`,
          description: `회차 수량: ${s.quantity}개 · 결제금액: ₩${s.amount.toLocaleString()}`,
          badge: { label: `${s.roundNo}회차 완료`, style: { backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' } },
          dotColor: '#3b82f6',
          amount: s.amount,
          actor: '자동 결제',
        });
      } else if (s.status === 'failed') {
        logs.push({
          id: `evt-ship-failed-${s.id}`,
          timestamp: s.executedAt || sub.updatedAt || new Date().toISOString(),
          type: 'PAYMENT_FAIL',
          title: `${s.roundNo}회차 결제 실패`,
          description: `결제 시도 금액: ₩${s.amount.toLocaleString()} (카드 한도 및 수단 확인)`,
          badge: { label: `${s.roundNo}회차 실패`, style: { backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' } },
          dotColor: '#ef4444',
          amount: s.amount,
          actor: '시스템',
          actionType: 'RETRY_SHIPMENT_PAYMENT',
          isPending: true,
        });
      } else if (s.status === 'skipped') {
        logs.push({
          id: `evt-ship-skipped-${s.id}`,
          timestamp: s.scheduledDate,
          type: 'SKIPPED',
          title: `${s.roundNo}회차 배송 건너뜀`,
          description: `고객 요청으로 ${s.roundNo}회차 건너뜀 처리`,
          badge: { label: `${s.roundNo}회차 건너뜀`, style: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' } },
          dotColor: '#9ca3af',
          actor: '고객 요청',
        });
      }
    });

    // 3. Pause / Resume logs
    if (sub.pauseCount > 0 || sub.status === 'paused' || sub.pausedAt) {
      logs.push({
        id: `evt-pause-${sub.id}`,
        timestamp: sub.pausedAt || sub.updatedAt,
        type: 'PAUSE',
        title: '정기공급 일시정지 설정',
        description: `누적 일시정지 횟수: ${sub.pauseCount}회`,
        badge: { label: '일시정지', style: { backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' } },
        dotColor: '#f59e0b',
        actor: '고객 요청',
      });
    }

    // 4. Delivery Address Changes (Only if explicit address change timestamp exists)
    if ((sub as any).addressChangedAt) {
      logs.push({
        id: `evt-addr-${sub.id}`,
        timestamp: (sub as any).addressChangedAt,
        type: 'ADDRESS_CHANGE',
        title: '배송지 주소 변경',
        description: `변경된 배송지: ${sub.deliveryAddress}`,
        badge: { label: '배송지변경', style: { backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' } },
        dotColor: '#0ea5e9',
        actor: '고객 변경',
      });
    }

    // 5. Cancellation Request & Penalty Refunds
    if (cancellationRequest) {
      if (cancellationRequest.status === 'pending') {
        logs.push({
          id: `evt-cancel-pending-${cancellationRequest.id}`,
          timestamp: cancellationRequest.createdAt,
          type: 'CANCEL_REQUEST',
          title: '정기공급 해지 신청 및 위약금 결제 미완료 (승인 대기)',
          description: `해지 사유: ${cancellationRequest.cancelReason || '고객 요청'} · 기출고 ${cancellationRequest.shippedQuantity}개 정산 (위약금: ₩${(cancellationRequest.penaltyAmount || 0).toLocaleString()})`,
          badge: { label: '위약금 결제미완료', style: { backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' } },
          dotColor: '#f59e0b',
          actor: '고객 신청 (승인 대기)',
          actionType: 'RETRY_PENALTY',
          isPending: true,
        });
      } else {
        logs.push({
          id: `evt-cancel-req-${cancellationRequest.id}`,
          timestamp: cancellationRequest.createdAt,
          type: 'CANCEL_REQUEST',
          title: '정기공급 해지 신청 접수',
          description: `해지 사유: ${cancellationRequest.cancelReason || '고객 요청'} (기출고 정산: ${cancellationRequest.shippedQuantity}개)`,
          badge: { label: '해지신청', style: { backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' } },
          dotColor: '#f59e0b',
          actor: '고객 신청',
        });

        if (cancellationRequest.status === 'processed') {
          const isCharged = cancellationRequest.adminAction === 'charge' && cancellationRequest.penaltyAmount > 0;
          if (isCharged) {
            logs.push({
              id: `evt-penalty-pay-${cancellationRequest.id}`,
              timestamp: cancellationRequest.processedAt || cancellationRequest.createdAt,
              type: 'CANCEL_PROCESSED',
              title: '위약금 결제 / 청구 승인 완료',
              description: `부과 위약금: ₩${cancellationRequest.penaltyAmount.toLocaleString()} (기출고 ${cancellationRequest.shippedQuantity}개 차액 정산) · ${cancellationRequest.adminMemo || '결제 완료'}`,
              badge: { label: '위약금 결제완료', style: { backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' } },
              dotColor: '#ef4444',
              amount: cancellationRequest.penaltyAmount,
              actor: '관리자 승인 / PG',
            });
          } else {
            logs.push({
              id: `evt-penalty-waive-${cancellationRequest.id}`,
              timestamp: cancellationRequest.processedAt || cancellationRequest.createdAt,
              type: 'CANCEL_PROCESSED',
              title: '위약금 면제 및 해지 완료',
              description: `위약금 부과 없이 면제 처리 완료 · ${cancellationRequest.adminMemo || '면제 완료'}`,
              badge: { label: '위약금 면제완료', style: { backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' } },
              dotColor: '#10b981',
              actor: '관리자 승인',
            });
          }
        }
      }
    }

    // 6. Card Approval Cancellation / Refund Event check (Only for cancelled subscriptions/orders)
    const isCancelledSub = sub.status === 'cancelled' || Boolean(sub.cancelledAt);
    const isOrderCancelled = order && (['cancelled', 'cancel_completed', 'refunded', 'canceled', '취소', '취소완료'].includes(order.status) || Boolean((order as any).cancelledAt));
    
    if (isCancelledSub || isOrderCancelled) {
      const isCardRefundCompleted = Boolean(sub.cancelledAt) || Boolean((order as any)?.cancelledAt) || cancellationRequest?.status === 'processed';

      if (isCardRefundCompleted) {
        logs.push({
          id: `evt-card-refund-${sub.id}`,
          timestamp: sub.cancelledAt || (order as any)?.cancelledAt || cancellationRequest?.processedAt || sub.updatedAt,
          type: 'CANCEL_PROCESSED',
          title: '신용카드 승인 취소 (결제 취소 완료)',
          description: `정기공급 신용카드 매출전표 승인 취소 및 환불 처리 완료`,
          badge: { label: '결제 승인 취소', style: { backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' } },
          dotColor: '#ef4444',
          actor: 'PG 결제사 / 승인취소',
        });
      } else {
        logs.push({
          id: `evt-card-cancel-pending-${sub.id}`,
          timestamp: sub.updatedAt || new Date().toISOString(),
          type: 'CANCEL_PROCESSED',
          title: '신용카드 승인 취소 (결제 취소 처리 대기 / 미완료)',
          description: '정기공급 해지 후 신용카드 승인 취소가 완료되지 않았습니다. 아래 버튼을 클릭하여 PG사 승인 취소를 재실행합니다.',
          badge: { label: '승인취소 미완료', style: { backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' } },
          dotColor: '#ef4444',
          actor: 'PG사 연동 대기',
          actionType: 'RETRY_CARD_CANCEL',
          isPending: true,
        });
      }
    }

    // Step Priority Ranking for identical timestamp tie-breaking
    logs.forEach((log) => {
      let priority = 0;
      if (log.type === 'CONTRACT') priority = 1;
      else if (log.type === 'PAYMENT_SUCCESS' || log.type === 'PAYMENT_FAIL' || log.type === 'SKIPPED') priority = 2;
      else if (log.type === 'PAUSE' || log.type === 'RESUME' || log.type === 'ADDRESS_CHANGE') priority = 3;
      else if (log.type === 'CANCEL_REQUEST') priority = 4;
      else if (log.type === 'CANCEL_PROCESSED') {
        if (log.id.includes('penalty')) priority = 5;
        else if (log.id.includes('card-refund') || log.id.includes('card-cancel')) priority = 6;
        else priority = 5;
      }
      (log as any).priority = priority;
    });

    // Sort descending by timestamp, then by step priority if timestamp is equal
    logs.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return ((b as any).priority || 0) - ((a as any).priority || 0);
    });

    return logs;
  };

  const activityLogs = buildActivityLogs();

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
        
        {/* Header Toolbar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800" style={{ backgroundColor: '#171717', color: '#ffffff' }}>
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-neutral-300" style={{ color: '#d4d4d4' }} />
            <h3 className="text-base font-bold tracking-tight" style={{ color: '#ffffff' }}>정기공급 히스토리</h3>
            <span className="text-xs px-2 py-0.5 font-mono font-semibold rounded-md" style={{ backgroundColor: '#262626', color: '#e5e5e5', border: '1px solid #404040' }}>
              {sub?.subscriptionNo || order?.orderNumber}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ color: '#a3a3a3' }}
            className="hover:text-white transition-colors text-2xl leading-none px-1.5 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Main Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5" style={{ backgroundColor: '#f9fafb' }}>
          {loading ? (
            <div className="py-16 text-center space-y-3" style={{ color: '#6b7280' }}>
              <Loader2 className="w-7 h-7 animate-spin mx-auto" style={{ color: '#374151' }} />
              <p className="text-xs font-medium">이력 정보를 불러오고 있습니다...</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center space-y-1 rounded-xl border text-xs" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fca5a5' }}>
              <AlertCircle className="w-6 h-6 mx-auto" style={{ color: '#dc2626' }} />
              <p className="font-semibold">{error}</p>
            </div>
          ) : (
            <div className="rounded-xl border shadow-2xs overflow-hidden" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
              <div className="px-5 py-3 border-b flex items-center justify-between" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" style={{ color: '#374151' }} />
                  <h5 className="text-xs font-bold text-neutral-900" style={{ color: '#111827' }}>정기공급 히스토리 목록</h5>
                </div>
                <span className="text-xs font-medium" style={{ color: '#6b7280' }}>총 {activityLogs.length}건 기록</span>
              </div>

              {activityLogs.length === 0 ? (
                <div className="py-12 text-center text-xs" style={{ color: '#6b7280' }}>
                  기록된 발생 이력이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-sans">
                    <thead>
                      <tr className="border-b font-bold text-[11px]" style={{ backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }}>
                        <th className="py-3 px-4 w-44">발생 일시</th>
                        <th className="py-3 px-4 w-32">구분 상태</th>
                        <th className="py-3 px-4">발생 내역 상세</th>
                        <th className="py-3 px-4 w-28 text-center">처리 구분</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-neutral-800" style={{ borderColor: '#f3f4f6' }}>
                      {activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-neutral-50/80 transition-colors" style={{ backgroundColor: log.isPending ? '#fffefb' : '#ffffff' }}>
                          {/* 발생 일시 */}
                          <td className="py-3 px-4 text-xs font-normal whitespace-nowrap align-top" style={{ color: '#4b5563' }}>
                            {new Date(log.timestamp).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          {/* 구분 상태 뱃지 */}
                          <td className="py-3 px-4 whitespace-nowrap align-top">
                            <span className="px-2 py-0.5 text-xs font-semibold rounded inline-block" style={log.badge.style}>
                              {log.badge.label}
                            </span>
                          </td>

                          {/* 발생 내역 상세 */}
                          <td className="py-3 px-4 align-top">
                            <p className="font-bold text-xs" style={{ color: '#111827' }}>{log.title}</p>
                            <p className="text-xs font-normal mt-0.5 leading-relaxed" style={{ color: '#4b5563' }}>{log.description}</p>
                            
                            {/* 관리자 재요청 버튼 */}
                            {isAdmin && log.actionType === 'RETRY_CARD_CANCEL' && (
                              <button
                                disabled={processingActionId === log.id}
                                onClick={() => handleRetryCardCancel(log)}
                                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 cursor-pointer shadow-2xs transition-colors"
                              >
                                {processingActionId === log.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                )}
                                <span>승인취소 재요청</span>
                              </button>
                            )}

                            {isAdmin && log.actionType === 'RETRY_SHIPMENT_PAYMENT' && (
                              <button
                                disabled={processingActionId === log.id}
                                onClick={() => handleRetryShipmentPayment(log)}
                                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 cursor-pointer shadow-2xs transition-colors"
                              >
                                {processingActionId === log.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3.5 h-3.5" />
                                )}
                                <span>결제 재시도</span>
                              </button>
                            )}

                            {isAdmin && log.actionType === 'RETRY_PENALTY' && (
                              <button
                                disabled={processingActionId === log.id}
                                onClick={() => handleRetryPenaltySettlement(log)}
                                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 cursor-pointer shadow-2xs transition-colors"
                              >
                                {processingActionId === log.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                )}
                                <span>위약금 결제 재요청</span>
                              </button>
                            )}
                          </td>

                          {/* 처리 구분 */}
                          <td className="py-3 px-4 text-center whitespace-nowrap align-top">
                            <span className="text-xs font-normal" style={{ color: '#6b7280' }}>
                              {log.actor || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between text-xs" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }}>
          <p>* 배송일 변경 및 일시정지는 [마이페이지 &gt; 정기공급 관리]에서 가능합니다.</p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold rounded-lg transition-colors cursor-pointer"
            style={{ backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db' }}
          >
            닫기
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return dateStr.replace(/-/g, '.');
}
