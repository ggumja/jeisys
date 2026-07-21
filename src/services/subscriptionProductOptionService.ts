import { supabase } from '../lib/supabaseClient';
import { SubscriptionProductOption, RoundCombination } from '../types';

// ─────────────────────────────────────────────────────────────
// 회차 조합 자동 계산 유틸
// 총수량의 약수를 구해, 각 주기별 최대 12개월 제약으로 조합 생성
// ─────────────────────────────────────────────────────────────

const CYCLE_OPTIONS = [1, 2, 3, 4, 6] as const;
const MAX_TOTAL_MONTHS = 12;

export function generateRoundCombinations(
  totalQuantity: number,
): { cycleMonths: typeof CYCLE_OPTIONS[number]; combinations: { qtyPerRound: number; totalRounds: number }[] }[] {
  if (totalQuantity <= 0) return [];

  // 약수 중 2 이상, totalQuantity/2 이하 (단독 배송 및 전체 1회 제외)
  const divisors: number[] = [];
  for (let d = 2; d <= totalQuantity; d++) {
    if (totalQuantity % d === 0) {
      divisors.push(d); // d = qtyPerRound
    }
  }

  return CYCLE_OPTIONS.map((cycleMonths) => {
    const maxRounds = Math.floor(MAX_TOTAL_MONTHS / cycleMonths);
    const combinations = divisors
      .map((qtyPerRound) => ({ qtyPerRound, totalRounds: totalQuantity / qtyPerRound }))
      .filter((c) => c.totalRounds >= 2 && c.totalRounds <= maxRounds)
      .sort((a, b) => a.qtyPerRound - b.qtyPerRound);
    return { cycleMonths, combinations };
  }).filter((c) => c.combinations.length > 0);
}

/** 회차 조합 레이블 예시: "20개 × 10회 (총 10개월)" */
export function combinationLabel(
  combo: { qtyPerRound: number; totalRounds: number },
  cycleMonths: number,
): string {
  const totalMonths = combo.totalRounds * cycleMonths;
  return `${combo.qtyPerRound}개 × ${combo.totalRounds}회 (총 ${totalMonths}개월)`;
}

// ─────────────────────────────────────────────────────────────
// 구독 상품 옵션 CRUD
// ─────────────────────────────────────────────────────────────

function mapOption(row: any): SubscriptionProductOption {
  return {
    id: row.id,
    productId: row.product_id,
    optionLabel: row.option_label,
    totalQuantity: row.total_quantity,
    discountRate: row.discount_rate ?? 0,
    roundCombinations: (row.round_combinations ?? []) as RoundCombination[],
    displayOrder: row.display_order ?? 0,
    isActive: row.is_active ?? true,
  };
}

export const subscriptionProductOptionService = {
  /** 상품 ID로 옵션 목록 조회 */
  async getOptionsByProduct(productId: string): Promise<SubscriptionProductOption[]> {
    const { data, error } = await supabase
      .from('subscription_product_options')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapOption);
  },

  /** 옵션 저장 (upsert) */
  async saveOptions(
    productId: string,
    options: Omit<SubscriptionProductOption, 'id' | 'productId'>[],
  ): Promise<void> {
    // 기존 옵션 삭제 후 재삽입
    await supabase
      .from('subscription_product_options')
      .delete()
      .eq('product_id', productId);

    if (options.length === 0) return;

    const rows = options.map((opt, idx) => ({
      product_id: productId,
      option_label: opt.optionLabel,
      total_quantity: opt.totalQuantity,
      discount_rate: opt.discountRate,
      round_combinations: opt.roundCombinations,
      display_order: idx,
      is_active: opt.isActive,
    }));

    const { error } = await supabase
      .from('subscription_product_options')
      .insert(rows);

    if (error) throw error;
  },
};
