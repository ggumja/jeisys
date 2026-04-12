import { supabase } from '../lib/supabaseClient';
import { PaymentMethod } from '../types';

export const paymentService = {
  /**
   * 등록된 카드 목록 조회
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('user_payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      provider: row.provider,
      billingKey: row.billing_key,
      cardName: row.card_name,
      cardNumberMasked: row.card_number_masked,
      alias: row.alias,
      isDefault: row.is_default,
      createdAt: row.created_at
    }));
  },

  /**
   * 카드 등록 (KICC Billing Key 발급 시뮬레이션)
   * 실제 환경에서는 KICC SDK 팝업 호출 후 리턴받은 데이터를 저장합니다.
   */
  async registerCard(userId: string, cardInfo: { cardName: string; lastFour: string; alias?: string }): Promise<PaymentMethod> {
    // 1. Mock Billing Key 생성 (실제로는 KICC에서 받음)
    const mockBillingKey = `BILL_${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
    const maskedNumber = `****-****-****-${cardInfo.lastFour}`;

    // 2. DB 저장
    const { data, error } = await supabase
      .from('user_payment_methods')
      .insert({
        user_id: userId,
        provider: 'kicc',
        billing_key: mockBillingKey,
        card_name: cardInfo.cardName,
        card_number_masked: maskedNumber,
        alias: cardInfo.alias,
        is_default: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering card:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      provider: data.provider,
      billingKey: data.billing_key,
      cardName: data.card_name,
      cardNumberMasked: data.card_number_masked,
      alias: data.alias,
      isDefault: data.is_default,
      createdAt: data.created_at
    };
  },

  /**
   * 결제 승인 요청 (빌링키 사용)
   * 서버사이드(KICC Direct API) 호출 시뮬레이션
   */
  async requestPayment(params: {
    userId: string;
    billingKey: string;
    amount: number;
    orderName: string;
    orderNumber: string;
  }) {
    console.log(`[KICC API CALL] Payment Request: ${params.orderNumber}, Amount: ${params.amount}`);
    
    // 실제 환경에서는 백엔드 API를 통해 KICC 서버로 승인 요청을 보냄
    // 여기서는 1초 후 성공하는 것으로 시뮬레이션
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          tid: `KICC_TID_${Date.now()}`,
          authDate: new Date().toISOString(),
          amount: params.amount
        });
      }, 1000);
    });
  },

  /**
   * 취소/환불 요청
   */
  async requestRefund(params: {
    tid: string;
    amount: number;
    reason: string;
  }) {
    console.log(`[KICC API CALL] Refund Request: ${params.tid}, Amount: ${params.amount}`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          cancelId: `CNCL_${Date.now()}`,
          cancelledAmount: params.amount
        });
      }, 800);
    });
  },

  /**
   * 기본 결제 수단 설정
   */
  async setDefaultMethod(userId: string, methodId: string) {
    // 먼저 모든 카드의 is_default를 false로
    await supabase
      .from('user_payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId);

    // 선택한 카드만 true로
    const { error } = await supabase
      .from('user_payment_methods')
      .update({ is_default: true })
      .eq('id', methodId);

    if (error) throw error;
  },

  /**
   * 카드 삭제
   */
  async deletePaymentMethod(methodId: string) {
    const { error } = await supabase
      .from('user_payment_methods')
      .delete()
      .eq('id', methodId);

    if (error) throw error;
  }
};
