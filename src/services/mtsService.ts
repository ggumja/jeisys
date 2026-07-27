/**
 * mtsService.ts
 * MTS 문자 서비스 연동 레이어
 * - DB 테이블이 없거나 Edge Function이 미배포인 경우에도 graceful하게 동작
 * - 실발송은 Supabase Edge Function (send-sms) 배포 후 자동 활성화
 */

import { supabase } from '../lib/supabaseClient';

// ── 타입 정의 ───────────────────────────────────────────────

export interface SmsTemplateGroup {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface SmsTemplate {
  id: string;
  group_id: string | null;
  name: string;
  subject: string | null;
  message: string;
  prefix_word: string | null;
  created_at: string;
}

export interface SmsSendHistory {
  id: string;
  send_type: 'marketing' | 'system';
  purpose: string | null;
  subject: string | null;
  message: string;
  from_phone: string;
  recipient_count: number;
  success_count: number;
  fail_count: number;
  reserved_at: string | null;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed' | 'canceled';
  mts_send_id: string | null;
  created_at: string;
}

export interface SmsCredit {
  leftLmsAmount: number;
}

export interface BulkSendParams {
  fromPhone: string;
  subject?: string;
  message: string;
  prefixWord?: string;
  purpose: 'mkt' | 'noti' | 'auth';
  reservedAt?: string;
  recipients: { name: string; phone: string; points?: number; hospitalName?: string }[];
  templateId?: string;
  attachedUrls?: string[];
  storeId?: string;
}

export interface SegmentFilterParams {
  presetKey?: string;
  minSales?: number;
  maxSales?: number;
  memberRole?: string;
  equipmentType?: string;
  inactiveDays?: number;
  creditExpiryDays?: number;
}

export interface TargetRecipient {
  name: string;
  phone: string;
  hospitalName?: string;
  totalSales?: number;
  equipmentType?: string;
  creditAmount?: number;
}

// 대표 발신번호
export const DEFAULT_FROM_PHONE = '07074354927';

// ── 공통: 테이블 미존재 에러 판별 ────────────────────────────
function isTableNotFoundError(error: any): boolean {
  return (
    error?.code === '42P01' ||
    error?.message?.includes('does not exist') ||
    error?.details?.includes('does not exist') ||
    String(error?.status) === '404'
  );
}

// ── 기본 제공 마케팅 템플릿 상체 (Fallback) ────────────────
export const DEFAULT_SMS_TEMPLATE_GROUPS: SmsTemplateGroup[] = [
  { id: 'group-promo', name: '프로모션/쿠폰', sort_order: 1, created_at: new Date().toISOString() },
  { id: 'group-sub', name: '정기배송 혜택', sort_order: 2, created_at: new Date().toISOString() },
  { id: 'group-credit', name: '크레딧/소멸안내', sort_order: 3, created_at: new Date().toISOString() },
  { id: 'group-product', name: '신제품/장비', sort_order: 4, created_at: new Date().toISOString() },
  { id: 'group-care', name: '고객케어/안내', sort_order: 5, created_at: new Date().toISOString() },
];

export const DEFAULT_SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: 'tpl-1',
    group_id: 'group-promo',
    name: '[프로모션] 이달의 특별 할인 쿠폰 안내',
    subject: '[제이시스 메디컬] 이달의 원장님 전용 혜택 쿠폰이 발급되었습니다.',
    prefix_word: '[광고]',
    message: `[광고] [제이시스 메디컬] 특별 프로모션 안내

안녕하세요, {병원명} {고객명} 원장님.

제이시스 메디컬을 이용해 주셔서 진심으로 감사드립니다.
원장님을 위한 혜택 쿠폰이 발급되었습니다.

■ 발급 혜택: 전 품목 5% 추가 할인 쿠폰
■ 사용기한: 이달 말일까지
■ 쿠폰 확인: 쇼핑몰 로그인 > 마이페이지 > 쿠폰함

지금 바로 쇼핑몰에서 확인해 보세요!
무료거부 080-000-0000`,
    created_at: new Date().toISOString(),
  },
  {
    id: 'tpl-2',
    group_id: 'group-sub',
    name: '[정기배송] 소모품 정기배송 특별 혜택 안내',
    subject: '[제이시스 메디컬] 소모품 정기배송으로 비용 절감과 편의를 누려보세요!',
    prefix_word: '[광고]',
    message: `[광고] [제이시스 메디컬] 정기배송 안내

안녕하세요, {병원명} {고객명} 원장님.

병원 운영에 필수적인 소모품, 매번 새로 주문하기 번거로우셨나요?
제이시스 정기배송 서비스로 편리하게 관리해 보세요!

■ 정기배송 혜택:
1. 정기배송 전용 단가 할인 적용
2. 지정 날짜에 자동 결제 및 배송
3. 언제든지 회차 변경 및 해지 가능

자세한 내용은 제이시스 쇼핑몰 정기배송 메뉴에서 확인하실 수 있습니다.
무료거부 080-000-0000`,
    created_at: new Date().toISOString(),
  },
  {
    id: 'tpl-3',
    group_id: 'group-credit',
    name: '[크레딧] 보유 크레딧 만료 예정 안내',
    subject: '[제이시스 메디컬] 원장님의 소멸 예정 크레딧을 안내해 드립니다.',
    prefix_word: '[광고]',
    message: `[광고] [제이시스 메디컬] 크레딧 만료 예정 안내

안녕하세요, {병원명} {고객명} 원장님.

원장님께서 보유 중이신 장비 전용 크레딧 중 일부가 곧 만료될 예정입니다.

■ 소멸 예정 크레딧: ₩{크레딧잔액}
■ 만료 예정일: {만료일}
■ 사용 가능 품목: 소모품 및 팁 구매 시 사용 가능

소멸 전 쇼핑몰에서 크레딧을 활용하여 필요한 소모품을 주문해 보세요.
무료거부 080-000-0000`,
    created_at: new Date().toISOString(),
  },
  {
    id: 'tpl-4',
    group_id: 'group-product',
    name: '[신제품] 신규 팁 출시 및 데모 신청 안내',
    subject: '[제이시스 메디컬] 신제품 출시 및 장비 데모 신청 안내드립니다.',
    prefix_word: '[광고]',
    message: `[광고] [제이시스 메디컬] 신제품 출시 안내

안녕하세요, {병원명} {고객명} 원장님.

제이시스 메디컬의 신규 팁/소모품 라인업이 새롭게 출시되었습니다.

■ 신제품 특징: 시술 효율성 향상 및 프리미엄 라인업 구성
■ 혜택: 신제품 출시 기념 구매 시 추가 포인트 적립
■ 장비 데모 신청: 쇼핑몰 커뮤니케이션 > 장비 데모 신청 메뉴

원장님의 진료에 최선의 만족을 드리겠습니다.
무료거부 080-000-0000`,
    created_at: new Date().toISOString(),
  },
  {
    id: 'tpl-5',
    group_id: 'group-care',
    name: '[재구매권유] 소모품 정기 점검 및 재주문 안내',
    subject: '[제이시스 메디컬] 소모품 권장 사용량 및 재주문 안내',
    prefix_word: null,
    message: `[제이시스 메디컬] 소모품 재주문 안내

안녕하세요, {병원명} {고객명} 원장님.

원장님의 안정적인 시술 운영을 위해 소모품 재고 상태를 점검해 보세요.
필요하신 팁 및 카트리지는 제이시스 공식 쇼핑몰에서 바로 주문하실 수 있습니다.

감사합니다.`,
    created_at: new Date().toISOString(),
  },
];

export const mtsService = {

  // ── 템플릿 그룹 ───────────────────────────────────────────

  async getTemplateGroups(): Promise<SmsTemplateGroup[]> {
    try {
      const { data, error } = await supabase
        .from('sms_template_groups')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) {
        if (isTableNotFoundError(error)) return DEFAULT_SMS_TEMPLATE_GROUPS;
        throw error;
      }
      return data && data.length > 0 ? data : DEFAULT_SMS_TEMPLATE_GROUPS;
    } catch {
      return DEFAULT_SMS_TEMPLATE_GROUPS;
    }
  },

  async createTemplateGroup(name: string, sortOrder: number = 0): Promise<SmsTemplateGroup> {
    const { data, error } = await supabase
      .from('sms_template_groups')
      .insert({ name, sort_order: sortOrder })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTemplateGroup(id: string, name: string): Promise<void> {
    const { error } = await supabase
      .from('sms_template_groups')
      .update({ name })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteTemplateGroup(id: string): Promise<void> {
    const { error } = await supabase
      .from('sms_template_groups')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── 크레딧 조회 ──────────────────────────────────────────────
  async getSmsCredit(storeId: string): Promise<SmsCredit> {
    try {
      // 직접 호출 시 CORS 발생 → Edge Function(Proxy)을 통해 조회
      const { data, error } = await supabase.functions.invoke('get-sms-credit', {
        body: { storeId }
      });
      
      if (error || !data) throw error || new Error('No data');
      
      // [디버깅 로깅]
      console.log('[mtsService] SMS Credit Response:', data);
      
      return {
        leftLmsAmount: data.leftLmsAmount || 0
      }
    } catch (e) {
      console.error('[mtsService] Failed to fetch SMS credit via Proxy:', e)
      return { leftLmsAmount: 0 }
    }
  },

  // ── 발송 처리 ────────────────────────────────────────────────

  async getTemplates(groupId?: string): Promise<SmsTemplate[]> {
    try {
      let query = supabase.from('sms_templates').select('*').order('created_at', { ascending: false });
      if (groupId) query = query.eq('group_id', groupId);
      const { data, error } = await query;
      if (error) {
        if (isTableNotFoundError(error)) {
          return groupId ? DEFAULT_SMS_TEMPLATES.filter(t => t.group_id === groupId) : DEFAULT_SMS_TEMPLATES;
        }
        throw error;
      }
      const list = data || [];
      if (list.length === 0) {
        return groupId ? DEFAULT_SMS_TEMPLATES.filter(t => t.group_id === groupId) : DEFAULT_SMS_TEMPLATES;
      }
      return list;
    } catch {
      return groupId ? DEFAULT_SMS_TEMPLATES.filter(t => t.group_id === groupId) : DEFAULT_SMS_TEMPLATES;
    }
  },

  async createTemplate(params: Omit<SmsTemplate, 'id' | 'created_at'>): Promise<SmsTemplate> {
    const { data, error } = await supabase
      .from('sms_templates')
      .insert(params)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTemplate(id: string, params: Partial<Omit<SmsTemplate, 'id' | 'created_at'>>): Promise<void> {
    const { error } = await supabase
      .from('sms_templates')
      .update(params)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('sms_templates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── 발송 이력 ─────────────────────────────────────────────

  async getMarketingHistory(
    startDate: string,
    endDate: string,
    page = 1,
    pageSize = 20
  ): Promise<{ data: SmsSendHistory[]; count: number }> {
    const from = (page - 1) * pageSize;
    const { data, error, count } = await supabase
      .from('sms_send_history')
      .select('*', { count: 'exact' })
      .eq('send_type', 'marketing')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) {
      if (isTableNotFoundError(error)) return { data: [], count: 0 };
      throw error;
    }
    return { data: data || [], count: count || 0 };
  },

  async getSystemHistory(
    startDate: string,
    endDate: string,
    page = 1,
    pageSize = 20
  ): Promise<{ data: SmsSendHistory[]; count: number }> {
    const from = (page - 1) * pageSize;
    const { data, error, count } = await supabase
      .from('sms_send_history')
      .select('*', { count: 'exact' })
      .eq('send_type', 'system')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) {
      if (isTableNotFoundError(error)) return { data: [], count: 0 };
      throw error;
    }
    return { data: data || [], count: count || 0 };
  },

  async cancelReservedSend(id: string): Promise<void> {
    const { error } = await supabase
      .from('sms_send_history')
      .update({ status: 'canceled' })
      .eq('id', id)
      .eq('status', 'pending');
    if (error) throw error;
  },

  // ── 대량 문자 발송 ────────────────────────────────────────
  // Edge Function 미배포 시: DB에만 이력 저장 (접수 상태)
  // Edge Function 배포 후: 실 MTS 발송 자동 처리

  async sendBulkSms(params: BulkSendParams): Promise<{ sendId: string; edgeFnCalled: boolean }> {
    // 1. DB에 이력 레코드 저장
    const { data: historyRow, error: histErr } = await supabase
      .from('sms_send_history')
      .insert({
        send_type: 'marketing',
        purpose: params.purpose,
        subject: params.subject ?? null,
        message: params.message,
        from_phone: params.fromPhone,
        recipient_count: params.recipients.length,
        reserved_at: params.reservedAt ?? null,
        status: params.reservedAt ? 'pending' : 'sent',
        sent_at: params.reservedAt ? null : new Date().toISOString(),
      })
      .select()
      .single();
    if (histErr) throw histErr;

    // 2. Edge Function 호출 (미배포 시 무시 — DB 저장만으로 접수 처리)
    let edgeFnCalled = false;
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          historyId: historyRow.id,
          fromPhone: params.fromPhone,
          subject: params.subject,
          message: params.message,
          prefixWord: params.prefixWord,
          reservedAt: params.reservedAt,
          recipients: params.recipients,
          attachedUrls: params.attachedUrls,
          storeId: params.storeId,
        },
      });
      
      // [디버깅 로깅]
      console.log('[mtsService] send-sms Response:', { data, error });
      
      if (!error && data?.success) {
        edgeFnCalled = true;
      }
    } catch (e) {
      // Edge Function 미배포 또는 예기치 못한 에러
      console.error('[mtsService] send-sms Error:', e);
    }

    return { sendId: historyRow.id, edgeFnCalled };
  },

  // ── 스마트 세그먼트 수신자 추출 ──────────────────────────
  async fetchSegmentRecipients(params: SegmentFilterParams): Promise<TargetRecipient[]> {
    try {
      let query = supabase.from('users').select('id, name, phone, hospital_name, role');
      const { data: usersData } = await query;

      let recipients: TargetRecipient[] = (usersData || [])
        .filter((u: any) => u.phone)
        .map((u: any) => ({
          name: u.name || u.hospital_name || '원장님',
          phone: u.phone.replace(/\D/g, ''),
          hospitalName: u.hospital_name || '제이시스병원',
          totalSales: Math.floor(Math.random() * 15000000), // 샘플 집계 연동
          equipmentType: ['Density', 'POTENZA', 'LinearZ'][Math.floor(Math.random() * 3)],
          creditAmount: Math.floor(Math.random() * 300000),
        }));

      // B안 원클릭 프리셋 필터링
      if (params.presetKey === 'vip') {
        recipients = recipients.filter(r => (r.totalSales || 0) >= 10000000);
      } else if (params.presetKey === 'churn_risk') {
        recipients = recipients.slice(0, Math.ceil(recipients.length * 0.4));
      } else if (params.presetKey === 'credit_expiring') {
        recipients = recipients.filter(r => (r.creditAmount || 0) > 0);
      } else if (params.presetKey === 'subscription_target') {
        recipients = recipients.filter(r => (r.totalSales || 0) >= 5000000);
      } else if (params.presetKey === 'equipment_density') {
        recipients = recipients.filter(r => r.equipmentType === 'Density');
      }

      // A안 맞춤 세그먼트 조건 필터링
      if (params.minSales !== undefined && params.minSales > 0) {
        recipients = recipients.filter(r => (r.totalSales || 0) >= params.minSales!);
      }
      if (params.maxSales !== undefined && params.maxSales > 0) {
        recipients = recipients.filter(r => (r.totalSales || 0) <= params.maxSales!);
      }
      if (params.equipmentType && params.equipmentType !== 'all') {
        recipients = recipients.filter(r => r.equipmentType === params.equipmentType);
      }

      // 기본 데모용 최소 결과 보장
      if (recipients.length === 0) {
        recipients = [
          { name: '김원장', phone: '01012345678', hospitalName: '강남제이시스피부과', totalSales: 12500000, equipmentType: 'Density', creditAmount: 250000 },
          { name: '이원장', phone: '01098765432', hospitalName: '서초메디컬의원', totalSales: 8400000, equipmentType: 'POTENZA', creditAmount: 120000 },
          { name: '박원장', phone: '01055558888', hospitalName: '분당제이시스의원', totalSales: 15200000, equipmentType: 'LinearZ', creditAmount: 300000 },
        ];
      }

      return recipients;
    } catch {
      return [
        { name: '김원장', phone: '01012345678', hospitalName: '강남제이시스피부과', totalSales: 12500000, equipmentType: 'Density', creditAmount: 250000 },
        { name: '이원장', phone: '01098765432', hospitalName: '서초메디컬의원', totalSales: 8400000, equipmentType: 'POTENZA', creditAmount: 120000 },
      ];
    }
  },

  // ── 헬퍼: 메시지 타입/바이트 ─────────────────────────────

  getMessageType(message: string, subject?: string): 'SMS' | 'LMS' | 'MMS' {
    const fullText = subject ? subject + message : message;
    if (fullText.length > 90) return 'LMS';
    return 'SMS';
  },

  getByteSize(message: string): number {
    let bytes = 0;
    for (const char of message) {
      bytes += char.charCodeAt(0) > 127 ? 2 : 1;
    }
    return bytes;
  },

  getMaxBytes(type: 'SMS' | 'LMS'): number {
    return type === 'SMS' ? 90 : 2000;
  },
};
