import { supabase } from '../lib/supabaseClient';

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
}

export interface SubscriptionRow {
  id: string;
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
  shipments?: SubscriptionScheduleRow[];
  quantityDiscountTiers?: Array<{ minQty: number; maxQty: number; discountRate: number }>;
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
  subscription?: Pick<SubscriptionRow, 'id' | 'totalQuantity' | 'cycleMonths' | 'productId'>;
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
 * 결제주기별 정기구독 스케줄 계산
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
}): {
  shippedQuantity: number;
  paidAmount: number;
  regularAmount: number;
  penaltyAmount: number;
  appliedDiscountRate: number;
} {
  const { currentRound, qtyPerRound, lastRoundQty, totalRounds, unitPrice, regularUnitPrice, quantityDiscountTiers } = params;

  // 기출고 수량 계산
  let shippedQuantity = 0;
  for (let r = 1; r <= currentRound; r++) {
    shippedQuantity += r === totalRounds ? lastRoundQty : qtyPerRound;
  }

  // 기납부 총액
  const paidAmount = currentRound * unitPrice;

  // 수령 수량 구간의 할인율 조회
  let appliedDiscountRate = 0;
  if (quantityDiscountTiers && quantityDiscountTiers.length > 0) {
    const sorted = [...quantityDiscountTiers].sort((a, b) => a.minQty - b.minQty);
    const tier = sorted.find(t => shippedQuantity >= t.minQty && shippedQuantity <= t.maxQty);
    if (tier) appliedDiscountRate = tier.discountRate;
  }

  // 구간 할인율 적용 가격으로 정가 재산정
  // regularUnitPrice는 개당 원가(할인 전). 구간할인율이 있으면 해당 구간 단가로 산정
  const effectiveUnitPrice = quantityDiscountTiers && quantityDiscountTiers.length > 0
    ? Math.round(regularUnitPrice * (1 - appliedDiscountRate / 100))
    : regularUnitPrice;

  const regularAmount = shippedQuantity * effectiveUnitPrice;
  const penaltyAmount = Math.max(0, regularAmount - paidAmount);

  return { shippedQuantity, paidAmount, regularAmount, penaltyAmount, appliedDiscountRate };
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
  };
}

function mapSubscriptionRow(row: any): SubscriptionRow {
  return {
    id: row.id,
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
    shipments: row.subscription_shipments?.map(mapShipmentRow),
    quantityDiscountTiers: row.products?.quantity_discount_tiers ?? [],
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
          totalQuantity: row.subscriptions.total_quantity,
          cycleMonths: row.subscriptions.cycle_months,
          productId: row.subscriptions.product_id,
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
        subscription_shipments (*)
      `)
      .eq('id', subId)
      .single();

    if (error) return null;
    return mapSubscriptionRow(data);
  },

  // ──────────────────────────────
  // 위약금 계산 (해지 전 미리보기)
  // ──────────────────────────────
  calculatePenaltyPreview(sub: SubscriptionRow): ReturnType<typeof calculatePenalty> {
    return calculatePenalty({
      currentRound: sub.currentRound,
      qtyPerRound: sub.qtyPerRound,
      lastRoundQty: sub.lastRoundQty,
      totalRounds: sub.totalRounds,
      unitPrice: sub.unitPrice,
      regularUnitPrice: sub.regularUnitPrice,
      quantityDiscountTiers: sub.quantityDiscountTiers,
    });
  },

  // ──────────────────────────────
  // 일시정지 / 재개
  // ──────────────────────────────
  async pauseSubscription(subId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', subId);
    if (error) throw error;
  },

  async resumeSubscription(subId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', subId);
    if (error) throw error;
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
        subscriptions (id, total_quantity, cycle_months, product_id)
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
