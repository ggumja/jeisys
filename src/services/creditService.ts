import { supabase } from '../lib/supabaseClient';

export type EquipmentType = string; // equipments 테이블 model_name 동적 참조
export type CreditStatus = 'active' | 'expired' | 'exhausted';
export type TransactionType = 'issue' | 'use' | 'expire' | 'refund';

export interface UserCredit {
  id: string;
  userId: string;
  equipmentType: EquipmentType;
  amount: number;
  usedAmount: number;
  remaining: number;
  expiryDate: string;
  memo: string | null;
  issuedBy: string | null;
  status: CreditStatus;
  createdAt: string;
}

export interface CreditTransaction {
  id: string;
  creditId: string;
  userId: string;
  amount: number;
  type: TransactionType;
  orderId: string | null;
  description: string | null;
  createdAt: string;
}

export interface CreditSummary {
  equipmentType: EquipmentType;
  totalAmount: number;
  usedAmount: number;
  remaining: number;
  activeCount: number;
}

export interface IssueCreditInput {
  userId: string;
  equipmentType: EquipmentType;
  amount: number;
  expiryDate: string;
  memo?: string;
}

const fromCreditRow = (row: any): UserCredit => ({
  id: row.id,
  userId: row.user_id,
  equipmentType: row.equipment_type,
  amount: Number(row.amount),
  usedAmount: Number(row.used_amount),
  remaining: Number(row.amount) - Number(row.used_amount),
  expiryDate: row.expiry_date,
  memo: row.memo,
  issuedBy: row.issued_by,
  status: row.status,
  createdAt: row.created_at,
});

const fromTransactionRow = (row: any): CreditTransaction => ({
  id: row.id,
  creditId: row.credit_id,
  userId: row.user_id,
  amount: Number(row.amount),
  type: row.type,
  orderId: row.order_id,
  description: row.description,
  createdAt: row.created_at,
});

export const creditService = {
  /** 회원의 전체 크레딧 목록 (최신순) */
  async getCreditsByUser(userId: string): Promise<UserCredit[]> {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromCreditRow);
  },

  /** 장비별 잔액 요약 (RPC) */
  async getCreditSummary(userId: string): Promise<CreditSummary[]> {
    const { data, error } = await supabase
      .rpc('get_user_credit_summary', { p_user_id: userId });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      equipmentType: row.equipment_type as EquipmentType,
      totalAmount: Number(row.total_amount),
      usedAmount: Number(row.used_amount),
      remaining: Number(row.remaining),
      activeCount: Number(row.active_count),
    }));
  },

  /** 크레딧 발급 (RPC - PATCH CORS 우회) */
  async issueCredit(input: IssueCreditInput): Promise<string> {
    const { data, error } = await supabase.rpc('issue_user_credit', {
      p_user_id:        input.userId,
      p_equipment_type: input.equipmentType,
      p_amount:         input.amount,
      p_expiry_date:    input.expiryDate,
      p_memo:           input.memo || null,
    });

    if (error) throw error;
    return data as string; // 발급된 credit_id 반환
  },

  /** 크레딧별 사용 이력 */
  async getCreditTransactions(creditId: string): Promise<CreditTransaction[]> {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('credit_id', creditId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromTransactionRow);
  },

  /** 전체 잔액 합산 (모든 장비 합계) */
  async getTotalRemaining(userId: string): Promise<number> {
    const summary = await creditService.getCreditSummary(userId);
    return summary.reduce((sum, s) => sum + s.remaining, 0);
  },

  /** 크레딧 사용 (주문 시 호출) - FIFO 차감 RPC */
  async useCredits(input: {
    userId: string;
    amount: number;
    orderId?: string;
    description?: string;
  }): Promise<void> {
    const { data, error } = await supabase.rpc('use_user_credits', {
      p_user_id:    input.userId,
      p_amount:     input.amount,
      p_order_id:   input.orderId || null,
      p_description: input.description || '주문 크레딧 사용',
    });
    if (error) throw error;
    return data;
  },

  /** 주문 취소 시 크레딧 환불 (RPC) */
  async refundOrderCredits(orderId: string): Promise<number> {
    const { data, error } = await supabase.rpc('refund_order_credits', {
      p_order_id: orderId,
    });
    if (error) throw error;
    return Number((data as any)?.refunded ?? 0);
  },
};
