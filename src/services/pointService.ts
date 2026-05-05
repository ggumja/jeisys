import { supabase } from '../lib/supabaseClient';

export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'issue' | 'use' | 'revoke' | 'expire' | 'refund';
  description?: string;
  expiryDate?: string;
  createdAt: string;
  createdBy?: string;
}

export interface PointSummary {
  totalIssued: number;
  totalUsed: number;
  totalRevoked: number;
  remaining: number;
}

export const pointService = {
  // 1. 포인트 요약 정보 (잔액 등) 조회
  async getPointSummary(userId: string): Promise<PointSummary> {
    const { data, error } = await supabase
      .from('point_transactions')
      .select('amount, type')
      .eq('user_id', userId);

    if (error) throw error;

    const summary: PointSummary = {
      totalIssued: 0,
      totalUsed: 0,
      totalRevoked: 0,
      remaining: 0,
    };

    data?.forEach(tx => {
      summary.remaining += tx.amount;
      if (tx.type === 'issue' || tx.type === 'refund') {
        summary.totalIssued += tx.amount;
      } else if (tx.type === 'use') {
        summary.totalUsed += Math.abs(tx.amount);
      } else if (tx.type === 'revoke' || tx.type === 'expire') {
        summary.totalRevoked += Math.abs(tx.amount);
      }
    });

    return summary;
  },

  // 2. 포인트 내역 조회
  async getPointTransactions(userId: string): Promise<PointTransaction[]> {
    const { data, error } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      type: row.type as PointTransaction['type'],
      description: row.description,
      expiryDate: row.expiry_date,
      createdAt: row.created_at,
      createdBy: row.created_by,
    }));
  },

  // 3. 포인트 지급
  async issuePoints({ userId, amount, description, expiryDate }: { userId: string; amount: number; description?: string; expiryDate?: string }): Promise<void> {
    if (amount <= 0) throw new Error('지급액은 0보다 커야 합니다.');
    
    // 현재 로그인된 관리자 정보를 가져옵니다.
    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase
      .from('point_transactions')
      .insert({
        user_id: userId,
        amount,
        type: 'issue',
        description,
        expiry_date: expiryDate || null,
        created_by: session?.user?.id,
      });

    if (error) throw error;
  },

  // 4. 포인트 회수
  async revokePoints({ userId, amount, description }: { userId: string; amount: number; description?: string }): Promise<void> {
    if (amount <= 0) throw new Error('회수액은 0보다 커야 합니다.');

    // 현재 잔액 체크
    const summary = await this.getPointSummary(userId);
    if (summary.remaining < amount) {
      throw new Error(`잔여 포인트(${summary.remaining.toLocaleString()}원)를 초과하여 회수할 수 없습니다.`);
    }

    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase
      .from('point_transactions')
      .insert({
        user_id: userId,
        amount: -Math.abs(amount), // 회수는 항상 음수로 저장
        type: 'revoke',
        description,
        created_by: session?.user?.id,
      });

    if (error) throw error;
  },

  // 5. 포인트 사용 (주문 결제용)
  async usePoints({ userId, amount, orderId, description }: { userId: string; amount: number; orderId: string; description?: string }): Promise<void> {
    if (amount <= 0) throw new Error('사용액은 0보다 커야 합니다.');

    const summary = await this.getPointSummary(userId);
    if (summary.remaining < amount) {
      throw new Error(`잔여 포인트(${summary.remaining.toLocaleString()}원)를 초과하여 사용할 수 없습니다.`);
    }

    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase
      .from('point_transactions')
      .insert({
        user_id: userId,
        amount: -Math.abs(amount), // 사용은 음수로 저장
        type: 'use',
        order_id: orderId,
        description: description || '상품 주문 시 포인트 사용',
        created_by: session?.user?.id,
      });

    if (error) throw error;
  },

  // 6. 주문 취소 시 사용된 포인트 롤백 (환불)
  async refundOrderPoints(orderId: string): Promise<number> {
    // 해당 주문에서 사용된 포인트 총합 조회
    const { data, error } = await supabase
      .from('point_transactions')
      .select('amount, user_id')
      .eq('order_id', orderId)
      .eq('type', 'use');

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    // 사용된 포인트의 합 계산 (음수로 저장되어 있으므로 절댓값 합산)
    let totalUsed = 0;
    let userId = data[0].user_id;

    data.forEach(tx => {
      totalUsed += Math.abs(tx.amount);
    });

    if (totalUsed > 0) {
      const { data: { session } } = await supabase.auth.getSession();

      // 환불 내역 인서트 (양수)
      const { error: refundError } = await supabase
        .from('point_transactions')
        .insert({
          user_id: userId,
          amount: totalUsed,
          type: 'refund',
          order_id: orderId,
          description: '주문 취소에 따른 포인트 자동 환불',
          created_by: session?.user?.id,
        });

      if (refundError) throw refundError;
    }

    return totalUsed;
  }
};
