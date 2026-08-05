import { supabase } from '../lib/supabaseClient';
import { paymentService } from './paymentService';

// ─────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────

export interface SubscriptionScheduleRow {
  id: string;
  roundNo: number;
  scheduledDate: string;
  quantity: number;
  amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'failed' | 'skipped' | 'cancelled';
  pgTid?: string;
  orderId?: string;
  executedAt?: string;
  failReason?: string;
  note?: string;
}

export interface SubscriptionRow {
  id: string;
  subscriptionNo?: string;
  userId: string;
  productId?: string;
  originalOrderId?: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'completed';
  billingKeyId?: string;
  cycleDays: number;
  cycleMonths: number;
  totalQuantity: number;
  totalRounds: number;
  qtyPerRound: number;
  lastRoundQty: number;
  currentRound: number;
  unitPrice: number;
  regularUnitPrice: number;
  discountRate: number;
  nextBillingDate: string;
  lastBillingDate?: string;
  cancelledAt?: string;
  cancelReason?: string;
  rejoinRestrictedUntil?: string;
  createdAt: string;
  updatedAt: string;
  // 조인 데이터
  product?: { name: string; imageUrl?: string; sku?: string };
  user?: { name: string; hospitalName?: string };
  deliveryAddress?: string;        // subscriptions.delivery_address (사용자 변경 시)
  orderDeliveryAddress?: string;   // orders.delivery_address (주문 시점 원본)
  shipments?: SubscriptionScheduleRow[];
  quantityDiscountTiers?: Array<{ minQty: number; maxQty: number; discountRate: number }>;
  pauseCount: number; // 일시정지 사용 횟수
  pausedAt?: string;  // 일시정지 시작 시각
}

export interface CancellationRequest {
  id: string;
  subscriptionId: string;
  userId: string;
  cancelReason: string;
  shippedQuantity: number;
  paidAmount: number;
  regularAmount: number;
  penaltyAmount: number; // 위약금 (0 이하면 없음)
  status: 'pending' | 'processed';
  adminAction?: 'charge' | 'waive';
  adminMemo?: string;
  processedAt?: string;
  createdAt: string;
  // 조인
  user?: { name: string; hospitalName?: string };
  subscription?: Pick<SubscriptionRow, 'id' | 'subscriptionNo' | 'totalQuantity' | 'cycleMonths' | 'productId' | 'currentRound' | 'totalRounds' | 'qtyPerRound'> & {
    productName?: string;
  };
}

export interface CreateSubscriptionParams {
  userId: string;
  productId: string;
  totalQuantity: number;  // 100 or 200
  cycleMonths: number;    // 1, 2, 3, 6
  unitPrice: number;      // 구독 적용 단가
  regularUnitPrice: number; // 일반 단가
  discountRate: number;   // 할인율 (%)
  billingKeyId?: string;
  startDate?: string;     // 기본값: 오늘
}

// ─────────────────────────────────────────
// 스케줄 계산 유틸
// ─────────────────────────────────────────

/**
 * 결제주기별 정기공급 스케줄 계산
 *
 * 규칙:
 *  - 회차별 출고수량은 5개 단위
 *  - 총 수량이 회차수로 정확히 나누어지지 않으면 마지막 회차에 잔여 일괄 출고
 *
 * 결제주기 → 총 회차 매트릭스 (운영안 기준):
 *  100개: 1개월=10회, 2개월=5회, 3개월=4회, 6개월=2회
 *  200개: 1개월=10회, 2개월=5회, 3개월=4회, 6개월=2회
 */
export function calculateSchedule(
  totalQty: number,
  cycleMonths: number
): {
  totalRounds: number;
  qtyPerRound: number;
  lastRoundQty: number;
  rounds: Array<{ roundNo: number; quantity: number; monthOffset: number }>;
} {
  // 총 운영기간(개월) = 총 회차 × 결제주기
  // 운영안에서 최대 12개월, 즉 총회차 = totalMonths / cycleMonths
  // totalMonths는 totalQty와 cycleMonths에 따라 결정됨
  // 운영안 고정 매트릭스 우선 적용
  const roundMatrix: Record<number, Record<number, number>> = {
    // [cycleMonths][totalQty] = totalRounds
    1: { 100: 10, 200: 10 },
    2: { 100: 5,  200: 5  },
    3: { 100: 4,  200: 4  },
    6: { 100: 2,  200: 2  },
  };

  const totalRounds = roundMatrix[cycleMonths]?.[totalQty]
    ?? Math.ceil(totalQty / (Math.floor(totalQty / cycleMonths / 5) * 5));

  // 5개 단위 기본 출고수량
  const baseQty = Math.floor(totalQty / totalRounds / 5) * 5;
  const lastRoundQty = totalQty - baseQty * (totalRounds - 1);

  const rounds = Array.from({ length: totalRounds }, (_, i) => ({
    roundNo: i + 1,
    quantity: i === totalRounds - 1 ? lastRoundQty : baseQty,
    monthOffset: cycleMonths * i,
  }));

  return { totalRounds, qtyPerRound: baseQty, lastRoundQty, rounds };
}

/**
 * 중도해지 위약금 계산
 *
 * 위약금 = (기출고 수량 × 수령수량 구간 정가) - (기납부 총액)
 * - quantityDiscountTiers 있으면 shippedQuantity 구간의 할인율로 정가 산정
 * - 결과가 0 이하면 위약금 없음 (0으로 처리)
 */
export function calculatePenalty(params: {
  currentRound: number;
  qtyPerRound: number;
  lastRoundQty: number;
  totalRounds: number;
  unitPrice: number;       // 구독 적용 단가 (회차 결제금액)
  regularUnitPrice: number; // 일반 단가 (개당, 구간 할인 미적용 기준)
  quantityDiscountTiers?: Array<{ minQty: number; maxQty: number; discountRate: number }>;
  isCurrentRoundShipped?: boolean; // 현재 회차 출고 완료 여부 (기본값: true)
}): {
  shippedQuantity: number;
  paidAmount: number;
  regularAmount: number;
  penaltyAmount: number;
  appliedDiscountRate: number;
  isShipped: boolean;
} {
  const {
    currentRound,
    qtyPerRound,
    lastRoundQty,
    totalRounds,
    unitPrice,
    regularUnitPrice,
    quantityDiscountTiers,
    isCurrentRoundShipped = true,
  } = params;

  // 현재 회차출고 여부에 따른 기출고 회차 수 계산 (발송 전이면 이전 회차까지만 합산)
  const effectiveShippedRounds = isCurrentRoundShipped ? currentRound : Math.max(0, currentRound - 1);

  // 기출고 수량 계산
  let shippedQuantity = 0;
  for (let r = 1; r <= effectiveShippedRounds; r++) {
    shippedQuantity += r === totalRounds ? lastRoundQty : qtyPerRound;
  }

  // 기납부 총액 (현재 회차까지 결제 완료된 총액)
  const paidAmount = currentRound * unitPrice;

  // 1회차 발송 전 등 기출고 수량이 0인 경우: 위약금 0원 (전액 환불 대상)
  if (shippedQuantity === 0) {
    return {
      shippedQuantity: 0,
      paidAmount,
      regularAmount: 0,
      penaltyAmount: 0,
      appliedDiscountRate: 0,
      isShipped: false,
    };
  }

  // 수령 수량 구간의 할인율 조회
  let appliedDiscountRate = 0;
  if (quantityDiscountTiers && quantityDiscountTiers.length > 0) {
    const sorted = [...quantityDiscountTiers].sort((a, b) => a.minQty - b.minQty);
    const tier = sorted.find(t => shippedQuantity >= t.minQty && shippedQuantity <= t.maxQty);
    if (tier) appliedDiscountRate = tier.discountRate;
  }

  const effectiveUnitPrice = quantityDiscountTiers && quantityDiscountTiers.length > 0
    ? Math.round(regularUnitPrice * (1 - appliedDiscountRate / 100))
    : regularUnitPrice;

  const regularAmount = shippedQuantity * effectiveUnitPrice;
  const penaltyAmount = Math.max(0, regularAmount - paidAmount);

  return {
    shippedQuantity,
    paidAmount,
    regularAmount,
    penaltyAmount,
    appliedDiscountRate,
    isShipped: isCurrentRoundShipped,
  };
}

// ─────────────────────────────────────────
// subscriptionService
// ─────────────────────────────────────────

function mapShipmentRow(row: any): SubscriptionScheduleRow {
  return {
    id: row.id,
    roundNo: row.round_no,
    scheduledDate: row.scheduled_date,
    quantity: row.quantity,
    amount: row.amount,
    status: row.status,
    pgTid: row.pg_tid,
    orderId: row.order_id,
    executedAt: row.executed_at,
    failReason: row.fail_reason ?? row.failReason,
    note: row.note,
  };
}

function mapSubscriptionRow(row: any): SubscriptionRow {
  return {
    id: row.id,
    subscriptionNo: row.subscription_no ?? undefined,
    userId: row.user_id,
    productId: row.product_id,
    originalOrderId: row.original_order_id,
    status: row.status,
    billingKeyId: row.billing_key_id,
    cycleDays: row.cycle_days,
    cycleMonths: row.cycle_months,
    totalQuantity: row.total_quantity,
    totalRounds: row.total_rounds,
    qtyPerRound: row.qty_per_round,
    lastRoundQty: row.last_round_qty,
    currentRound: row.current_round,
    unitPrice: row.unit_price,
    regularUnitPrice: row.regular_unit_price,
    discountRate: row.discount_rate,
    nextBillingDate: row.next_billing_date,
    lastBillingDate: row.last_billing_date,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    rejoinRestrictedUntil: row.rejoin_restricted_until,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    product: row.products
      ? { name: row.products.name, imageUrl: row.products.image_url, sku: row.products.sku }
      : undefined,
    user: row.users
      ? { name: row.users.name, hospitalName: row.users.hospital_name }
      : undefined,
    // 배송지: subscriptions.delivery_address (변경) > orders.delivery_address (원본)
    deliveryAddress: row.delivery_address ?? undefined,
    orderDeliveryAddress: row.orders?.delivery_address ?? undefined,
    shipments: row.subscription_shipments?.map(mapShipmentRow),
    quantityDiscountTiers: row.products?.quantity_discount_tiers ?? [],
    pauseCount: row.pause_count ?? 0,
    pausedAt: row.status === 'paused' ? (row.paused_at ?? row.updated_at) : undefined,
  };
}

function mapCancellationRow(row: any): CancellationRequest {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    userId: row.user_id,
    cancelReason: row.cancel_reason,
    shippedQuantity: row.shipped_quantity,
    paidAmount: row.paid_amount,
    regularAmount: row.regular_amount,
    penaltyAmount: row.penalty_amount,
    status: row.status,
    adminAction: row.admin_action,
    adminMemo: row.admin_memo,
    processedAt: row.processed_at,
    createdAt: row.created_at,
    user: row.users
      ? { name: row.users.name, hospitalName: row.users.hospital_name }
      : undefined,
    subscription: row.subscriptions
      ? {
          id: row.subscriptions.id,
          subscriptionNo: row.subscriptions.subscription_no ?? undefined,
          totalQuantity: row.subscriptions.total_quantity,
          cycleMonths: row.subscriptions.cycle_months,
          productId: row.subscriptions.product_id,
          currentRound: row.subscriptions.current_round,
          totalRounds: row.subscriptions.total_rounds,
          qtyPerRound: row.subscriptions.qty_per_round,
          productName: row.subscriptions.products?.name ?? undefined,
        }
      : undefined,
  };
}

export const subscriptionService = {
  // ──────────────────────────────
  // 구독 생성 (데모: Mock 결제)
  // ──────────────────────────────
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionRow> {
    const {
      userId, productId, totalQuantity, cycleMonths,
      unitPrice, regularUnitPrice, discountRate, billingKeyId,
    } = params;

    const startDate = params.startDate ?? new Date().toISOString().split('T')[0];
    const { totalRounds, qtyPerRound, lastRoundQty, rounds } = calculateSchedule(totalQuantity, cycleMonths);

    // 첫 결제일 = startDate, 다음 결제일 = startDate + cycleMonths
    const nextBillingDate = new Date(startDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + cycleMonths);

    const { data: sub, error: subErr } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        product_id: productId,
        status: 'active',
        billing_key_id: billingKeyId ?? null,
        cycle_days: cycleMonths * 30,
        cycle_months: cycleMonths,
        total_quantity: totalQuantity,
        total_rounds: totalRounds,
        qty_per_round: qtyPerRound,
        last_round_qty: lastRoundQty,
        current_round: 1, // 1회차 즉시 처리됨
        unit_price: unitPrice,
        regular_unit_price: regularUnitPrice,
        discount_rate: discountRate,
        next_billing_date: nextBillingDate.toISOString().split('T')[0],
        last_billing_date: startDate,
      })
      .select()
      .single();

    if (subErr) throw subErr;

    // 회차별 스케줄 일괄 생성 (1회차는 이미 처리됨 → 'paid')
    const shipmentsToInsert = rounds.map((r) => {
      const scheduledDate = new Date(startDate);
      scheduledDate.setMonth(scheduledDate.getMonth() + r.monthOffset);
      return {
        subscription_id: sub.id,
        round_no: r.roundNo,
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        quantity: r.quantity,
        amount: unitPrice,
        status: r.roundNo === 1 ? 'paid' : 'pending',
        executed_at: r.roundNo === 1 ? new Date().toISOString() : null,
      };
    });

    const { error: shipErr } = await supabase
      .from('subscription_shipments')
      .insert(shipmentsToInsert);

    if (shipErr) throw shipErr;

    return mapSubscriptionRow(sub);
  },

  // ──────────────────────────────
  // 내 구독 목록 조회 (사용자)
  // ──────────────────────────────
  async getMySubscriptions(userId: string): Promise<SubscriptionRow[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        products (name, image_url, sku, quantity_discount_tiers),
        users (name, hospital_name),
        orders (delivery_address),
        subscription_shipments (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapSubscriptionRow);
  },

  // ──────────────────────────────
  // 구독 상세 조회
  // ──────────────────────────────
  async getSubscriptionDetail(subId: string): Promise<SubscriptionRow | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        products (name, image_url, sku, quantity_discount_tiers),
        users (name, hospital_name),
        subscription_shipments (*)
      `)
      .eq('id', subId)
      .single();

    if (error) return null;
    return mapSubscriptionRow(data);
  },

  async getSubscriptionByOrderId(orderId: string): Promise<SubscriptionRow | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        products (name, image_url, sku, quantity_discount_tiers),
        users (name, hospital_name),
        subscription_shipments (*)
      `)
      .or(`original_order_id.eq.${orderId}`)
      .limit(1)
      .maybeSingle();

    if (data) return mapSubscriptionRow(data);

    // fallback: find subscription_id via shipment order_id
    const { data: shipData } = await supabase
      .from('subscription_shipments')
      .select('subscription_id')
      .eq('order_id', orderId)
      .limit(1)
      .maybeSingle();

    if (shipData?.subscription_id) {
      return this.getSubscriptionDetail(shipData.subscription_id);
    }
    return null;
  },

  async pauseSubscriptionWithOrderCancel(params: {
    orderId: string;
    subscriptionId: string;
    reason: string;
    cancelAmount?: number;
    pgTid?: string;
  }): Promise<void> {
    const { orderId, subscriptionId, reason, cancelAmount, pgTid } = params;

    if (pgTid && cancelAmount) {
      try {
        await paymentService.requestRefund({
          tid: pgTid,
          amount: cancelAmount,
          reason: `[구독 일시정지] ${reason}`,
        });
      } catch (err) {
        console.error('PG Refund error during pause:', err);
      }
    }

    await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: `[구독 일시정지] ${reason}`,
        refunded_amount: cancelAmount,
      })
      .eq('id', orderId);

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('pause_count')
      .eq('id', subscriptionId)
      .single();

    const newPauseCount = (sub?.pause_count ?? 0) + 1;
    await supabase
      .from('subscriptions')
      .update({
        status: 'paused',
        pause_count: newPauseCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    await supabase
      .from('subscription_shipments')
      .update({ status: 'paused' })
      .eq('order_id', orderId);
  },

  async cancelSubscriptionDirectly(subscriptionId: string, orderId: string, reason: string = '1회차 결제 취소로 인한 구독 자동 취소'): Promise<void> {
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    await supabase
      .from('subscription_shipments')
      .update({ status: 'cancelled' })
      .or(`subscription_id.eq.${subscriptionId},order_id.eq.${orderId}`);
  },

  async cancelSubscriptionByOrderId(orderId: string, reason?: string): Promise<void> {
    const sub = await this.getSubscriptionByOrderId(orderId);
    if (sub) {
      await this.cancelSubscriptionDirectly(sub.id, orderId, reason);
    } else {
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .or(`id.eq.${orderId},original_order_id.eq.${orderId}`);

      await supabase
        .from('subscription_shipments')
        .update({ status: 'cancelled' })
        .eq('order_id', orderId);
    }
  },

  async cancelSubscriptionWithPenalty(params: {
    orderId: string;
    subscriptionId: string;
    userId: string;
    reason: string;
    penaltyAmount: number;
    shippedQuantity: number;
    paidAmount: number;
    regularAmount: number;
    adminAction: 'charge' | 'waive';
    adminMemo?: string;
    cancelAmount?: number;
    pgTid?: string;
  }): Promise<void> {
    const {
      orderId,
      subscriptionId,
      userId,
      reason,
      penaltyAmount,
      shippedQuantity,
      paidAmount,
      regularAmount,
      adminAction,
      adminMemo,
      cancelAmount,
      pgTid,
    } = params;

    if (pgTid && cancelAmount) {
      try {
        await paymentService.requestRefund({
          tid: pgTid,
          amount: cancelAmount,
          reason: `[구독 해지] ${reason}`,
        });
      } catch (err) {
        console.error('PG Refund error during cancel:', err);
      }
    }

    await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: `[구독 해지] ${reason}`,
        refunded_amount: cancelAmount,
      })
      .eq('id', orderId);

    await supabase
      .from('subscription_cancellation_requests')
      .insert({
        subscription_id: subscriptionId,
        user_id: userId,
        cancel_reason: reason,
        shipped_quantity: shippedQuantity,
        paid_amount: paidAmount,
        regular_amount: regularAmount,
        penalty_amount: adminAction === 'waive' ? 0 : penaltyAmount,
        status: 'processed',
        admin_action: adminAction,
        admin_memo: adminMemo || reason,
        processed_at: new Date().toISOString(),
      });

    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    await supabase
      .from('subscription_shipments')
      .update({ status: 'cancelled' })
      .or(`subscription_id.eq.${subscriptionId},order_id.eq.${orderId}`);
  },

  // ──────────────────────────────
  // 위약금 계산 (해지 전 미리보기)
  // ──────────────────────────────
  calculatePenaltyPreview(sub: SubscriptionRow, isCurrentRoundShipped = true): ReturnType<typeof calculatePenalty> {
    return calculatePenalty({
      currentRound: sub.currentRound,
      qtyPerRound: sub.qtyPerRound,
      lastRoundQty: sub.lastRoundQty,
      totalRounds: sub.totalRounds,
      unitPrice: sub.unitPrice,
      regularUnitPrice: sub.regularUnitPrice,
      quantityDiscountTiers: sub.quantityDiscountTiers,
      isCurrentRoundShipped,
    });
  },

  // ──────────────────────────────
  // 일시정지 / 재개
  // ──────────────────────────────
  async pauseSubscription(subId: string): Promise<void> {
    // 현재 pause_count 조회 후 +1
    const { data: current } = await supabase
      .from('subscriptions')
      .select('pause_count')
      .eq('id', subId)
      .single();
    const newCount = (current?.pause_count ?? 0) + 1;
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'paused', pause_count: newCount, updated_at: new Date().toISOString() })
      .eq('id', subId);
    if (error) throw error;
  },

  async resumeSubscription(subId: string, immediate = false): Promise<void> {
    if (immediate) {
      // 즉시 재개: 다음 결제일을 오늘로 설정
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          next_billing_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subId);
      if (error) throw error;
    } else {
      // 다음 결제일에 재개: status만 active로
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', subId);
      if (error) throw error;
    }
  },

  // ──────────────────────────────
  // 결제 카드(빌링키) 변경
  // ──────────────────────────────
  async updateBillingKey(subId: string, paymentMethodId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ billing_key_id: paymentMethodId, updated_at: new Date().toISOString() })
      .eq('id', subId);
    if (error) throw error;
  },

  // ──────────────────────────────
  // 배송지 변경
  // ──────────────────────────────
  async updateDeliveryAddress(subId: string, address: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ delivery_address: address, updated_at: new Date().toISOString() })
      .eq('id', subId);
    if (error) throw error;
  },

  // ──────────────────────────────
  // 결제 재시도 (결제실패 회차)
  // ──────────────────────────────
  async retryFailedPayment(sub: SubscriptionRow): Promise<{ success: boolean; message: string }> {
    // 1. 실패한 회차 조회
    const failedShipment = (sub.shipments ?? []).find((s) => s.status === 'failed');
    if (!failedShipment) throw new Error('결제 실패 회차를 찾을 수 없습니다.');

    // 2. 빌링키 확인
    if (!sub.billingKeyId) throw new Error('결제 수단이 등록되지 않았습니다.');

    // 3. billing_key 조회
    const { data: paymentMethod, error: pmError } = await supabase
      .from('user_payment_methods')
      .select('billing_key')
      .eq('id', sub.billingKeyId)
      .single();
    if (pmError || !paymentMethod) throw new Error('결제 수단 정보를 불러올 수 없습니다.');

    // 4. 결제 시도 (paymentService.requestPayment 시뮬레이션)
    const orderNumber = `RETRY-${sub.subscriptionNo ?? sub.id.slice(0, 8)}-R${failedShipment.roundNo}-${Date.now()}`;
    console.log(`[결제 재시도] ${orderNumber}, 금액: ${failedShipment.amount}`);

    // 실제 환경에서는 백엔드 API 호출 → 여기서는 시뮬레이션 (1초 후 성공)
    await new Promise((res) => setTimeout(res, 1000));
    const paySuccess = true; // 실 서버 연동 시 응답값으로 대체
    const tid = `KICC_RETRY_${Date.now()}`;

    if (!paySuccess) {
      return { success: false, message: '결제가 실패하였습니다. 결제 수단을 확인해 주세요.' };
    }

    // 5. shipment 상태 → paid 업데이트
    const { error: shipError } = await supabase
      .from('subscription_shipments')
      .update({
        status: 'paid',
        pg_tid: tid,
        executed_at: new Date().toISOString(),
      })
      .eq('id', failedShipment.id);
    if (shipError) throw shipError;

    return { success: true, message: `${failedShipment.roundNo}회차 결제가 완료되었습니다.` };
  },

  // ──────────────────────────────
  // 해지 신청 (고객)
  // ──────────────────────────────
  async requestCancellation(params: {
    subscriptionId: string;
    userId: string;
    cancelReason: string;
    sub: SubscriptionRow; // 위약금 계산에 사용
  }): Promise<CancellationRequest> {
    const penalty = calculatePenalty({
      currentRound: params.sub.currentRound,
      qtyPerRound: params.sub.qtyPerRound,
      lastRoundQty: params.sub.lastRoundQty,
      totalRounds: params.sub.totalRounds,
      unitPrice: params.sub.unitPrice,
      regularUnitPrice: params.sub.regularUnitPrice,
      quantityDiscountTiers: params.sub.quantityDiscountTiers,
    });

    const { data, error } = await supabase
      .from('subscription_cancellation_requests')
      .insert({
        subscription_id: params.subscriptionId,
        user_id: params.userId,
        cancel_reason: params.cancelReason,
        shipped_quantity: penalty.shippedQuantity,
        paid_amount: penalty.paidAmount,
        regular_amount: penalty.regularAmount,
        penalty_amount: penalty.penaltyAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // 구독 상태를 'cancelled'로 변경하고 이후 회차 취소
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: params.cancelReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.subscriptionId);

    await supabase
      .from('subscription_shipments')
      .update({ status: 'cancelled' })
      .eq('subscription_id', params.subscriptionId)
      .eq('status', 'pending');

    return mapCancellationRow(data);
  },

  // ──────────────────────────────
  // 관리자: 전체 구독 목록
  // ──────────────────────────────
  async getAllSubscriptions(): Promise<SubscriptionRow[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        products (name, image_url, sku),
        users (name, hospital_name),
        subscription_shipments (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapSubscriptionRow);
  },

  // ──────────────────────────────
  // 관리자: 해지신청 목록
  // ──────────────────────────────
  async getCancellationRequests(statusFilter?: 'pending' | 'processed'): Promise<CancellationRequest[]> {
    let query = supabase
      .from('subscription_cancellation_requests')
      .select(`
        *,
        users!subscription_cancellation_requests_user_id_fkey (name, hospital_name),
        subscriptions (id, subscription_no, total_quantity, cycle_months, product_id, current_round, total_rounds, qty_per_round, products (name))
      `)
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapCancellationRow);
  },

  // ──────────────────────────────
  // 사용자: 내 해지신청 목록
  // ──────────────────────────────
  async getMyCancellationRequests(userId: string): Promise<CancellationRequest[]> {
    const { data, error } = await supabase
      .from('subscription_cancellation_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapCancellationRow);
  },

  // ──────────────────────────────
  // 관리자: 해지신청 처리 (청구 / 비청구)
  // ──────────────────────────────
  async processCancellation(params: {
    requestId: string;
    adminId: string;
    action: 'charge' | 'waive';
    memo?: string; // waive 시 필수
  }): Promise<void> {
    if (params.action === 'waive' && !params.memo?.trim()) {
      throw new Error('비청구 처리 시 사유 메모는 필수입니다.');
    }

    const { error } = await supabase
      .from('subscription_cancellation_requests')
      .update({
        status: 'processed',
        admin_action: params.action,
        admin_memo: params.memo ?? null,
        processed_at: new Date().toISOString(),
        processed_by: params.adminId,
      })
      .eq('id', params.requestId);

    if (error) throw error;
  },
};
