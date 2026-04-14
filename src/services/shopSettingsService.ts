import { supabase } from '../lib/supabaseClient';

export interface ShopSetting {
  key: string;
  value: string;
  label?: string;
  type: 'text' | 'number' | 'boolean' | 'time';
  group_name: string;
}

// 기본값 정의 (DB에 없을 경우 폴백)
const DEFAULTS: Record<string, string> = {
  // 배송 정책
  free_shipping_threshold: '500000',
  base_shipping_fee: '3500',
  jeju_shipping_fee: '3500',
  return_shipping_fee_buyer: '3500',
  exchange_shipping_fee: '7000',
  // 주문/운영
  order_deadline_time: '14:30',
  jeju_deadline_time: '13:00',
  biz_hours_open: '09:00',
  biz_hours_close: '17:00',
  vact_deadline_days: '7',
  min_order_amount: '0',
  // 회사 정보
  company_name: '(주)제이시스메디칼',
  cs_phone: '070-7435-4927',
  as_phone: '1544-1639',
  ceo_name: '이라미',
  business_number: '424-87-00852',
  commerce_number: '제 2022-서울금천-0845호',
  privacy_officer: '박종선',
  company_address: '서울특별시 금천구 가마산로 96',
  email: 'webmaster@jeisys.com',
  // 입금 계좌
  bank_name: '우리은행',
  bank_account: '1005-803-786090',
  bank_holder: '(주)제이시스메디칼',
  // 적립금
  credit_enabled: 'true',
  credit_earn_rate: '1',
  credit_min_use: '1000',
  credit_expiry_days: '0',
  // 회원 등급
  grades_enabled: 'true',
  grade_vip_threshold: '50000000',
  grade_vip_label: 'VIP',
  grade_gold_threshold: '10000000',
  grade_gold_label: 'Gold',
  grade_silver_threshold: '3000000',
  grade_silver_label: 'Silver',
  // 이메일 알림 발신자
  email_sender_name: '제이시스메디칼',
  email_sender_address: 'no-reply@jeisys.com',
  // 이메일 알림 관리자
  email_admin_new_order: 'true',
  email_admin_cancel_order: 'true',
  email_admin_failed_order: 'true',
  email_admin_exchange_request: 'true',
  email_admin_return_request: 'true',
  // 이메일 알림 고객 - 결제
  email_cust_vact_waiting: 'true',
  email_cust_order_complete_card: 'true',
  email_cust_order_complete_vact: 'true',
  email_cust_exchange_received: 'true',
  email_cust_return_received: 'true',
  email_cust_exchange_done: 'true',
  email_cust_return_done: 'true',
  // 이메일 알림 고객 - 회원
  email_cust_signup: 'true',
  email_cust_password_reset: 'true',
  // SMS 발신자
  sms_sender_name: '제이시스메디칼',
  sms_sender_phone: '070-7435-4927',
  // SMS 알림 관리자
  sms_admin_new_order: 'true',
  sms_admin_cancel_order: 'true',
  sms_admin_failed_order: 'true',
  sms_admin_exchange_request: 'true',
  sms_admin_return_request: 'true',
  // SMS 알림 고객 - 결제
  sms_cust_vact_waiting: 'true',
  sms_cust_order_complete_card: 'true',
  sms_cust_order_complete_vact: 'true',
  sms_cust_exchange_received: 'true',
  sms_cust_return_received: 'true',
  sms_cust_exchange_done: 'true',
  sms_cust_return_done: 'true',
  // SMS 알림 고객 - 회원
  sms_cust_signup: 'true',
  sms_cust_password_reset: 'true',
};

let cache: Record<string, string> | null = null;

export const shopSettingsService = {
  /** 전체 설정을 key→value Map으로 반환 (캐시 활용) */
  async getAll(): Promise<Record<string, string>> {
    if (cache) return cache;
    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('key, value');
      if (error || !data) return { ...DEFAULTS };
      const map: Record<string, string> = { ...DEFAULTS };
      for (const row of data) {
        map[row.key] = row.value;
      }
      cache = map;
      return map;
    } catch {
      return { ...DEFAULTS };
    }
  },

  /** 단일 값 조회 */
  async get(key: string): Promise<string> {
    const all = await shopSettingsService.getAll();
    return all[key] ?? DEFAULTS[key] ?? '';
  },

  /** 복수 설정 일괄 upsert */
  async updateMany(settings: Record<string, string>): Promise<void> {
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
    const { error } = await supabase
      .from('shop_settings')
      .upsert(rows, { onConflict: 'key' });
    if (error) throw error;
    // 캐시 무효화
    cache = null;
  },

  /** 캐시 강제 무효화 */
  invalidateCache() {
    cache = null;
  },
};
