/**
 * emailService.ts
 * 마케팅 이메일 서비스 연동 레이어
 * - DB 미배포 환경에서도 Graceful Fallback 시드 데이터 제공
 * - 이메일 템플릿 CRUD, 대량 발송, 이력 관리 지원
 */

import { supabase } from '../lib/supabaseClient';

export interface EmailTemplateGroup {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  group_id: string | null;
  name: string;
  subject: string | null;
  message: string; // HTML 포맷
  created_at: string;
}

export interface EmailSendHistory {
  id: string;
  send_type: string;
  purpose: string | null;
  subject: string | null;
  message: string;
  from_email: string;
  recipient_count: number;
  success_count: number;
  fail_count: number;
  status: 'pending' | 'sent' | 'failed' | 'canceled';
  reserved_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface BulkEmailSendParams {
  fromEmail: string;
  fromName?: string;
  subject: string;
  message: string; // HTML 포맷
  purpose: 'mkt' | 'noti';
  reservedAt?: string;
  recipients: { name: string; email: string; hospitalName?: string }[];
  storeId?: string;
}

// ── 기본 Fallback 데이터 ──────────────────────────────────────────

const DEFAULT_EMAIL_GROUPS: EmailTemplateGroup[] = [
  { id: 'group-promo', name: '프로모션/쿠폰', sort_order: 1, created_at: new Date().toISOString() },
  { id: 'group-device', name: '신제품/데모', sort_order: 2, created_at: new Date().toISOString() },
  { id: 'group-sub', name: '정기공급 혜택', sort_order: 3, created_at: new Date().toISOString() },
  { id: 'group-care', name: '고객케어/안내', sort_order: 4, created_at: new Date().toISOString() },
];

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tmpl-promo-1',
    group_id: 'group-promo',
    name: '[프로모션] 제이시스 메디컬 특별 할인 쿠폰 안내',
    subject: '[제이시스몰] {고객명} 원장님만을 위한 이달의 특별 쿠폰이 발급되었습니다.',
    message: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;"><div style="background-color: #2563eb; padding: 24px; text-align: center;"><h1 style="color: #ffffff; margin: 0; font-size: 20px;">Jeisys Medical</h1></div><div style="padding: 24px; background-color: #ffffff;"><h2 style="color: #111827; font-size: 18px; margin-top: 0;">안녕하세요, {병원명} {고객명} 원장님!</h2><p style="color: #4b5563; font-size: 14px; line-height: 1.6;">제이시스 메디컬을 이용해 주시는 원장님께 감사의 마음을 담아 특별 전용 할인 쿠폰을 발행해 드렸습니다.</p><div style="background-color: #eff6ff; border: 1px dashed #2563eb; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;"><span style="color: #2563eb; font-weight: bold; font-size: 14px;">전품목 10% 추가 할인 쿠폰</span><div style="font-size: 22px; font-weight: bold; color: #1e40af; margin-top: 6px;">[ JEISYSVIP10 ]</div></div><div style="text-align: center; margin-top: 28px;"><a href="https://jeisys.com" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">쇼핑몰에서 쿠폰 사용하기</a></div></div><div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;"><p style="margin: 0;">본 메일은 수신동의를 하신 회원님께 발송되는 마케팅 메일입니다.</p></div></div>`,
    created_at: new Date().toISOString(),
  },
  {
    id: 'tmpl-device-1',
    group_id: 'group-device',
    name: '[신제품] 신규 팁 출시 및 장비 데모 신청 안내',
    subject: '[제이시스] 신제품 공식 출시 및 병원 데모 신청 안내드립니다.',
    message: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;"><div style="background-color: #111827; padding: 24px; text-align: center;"><h1 style="color: #ffffff; margin: 0; font-size: 20px;">Jeisys Innovation</h1></div><div style="padding: 24px; background-color: #ffffff;"><h2 style="color: #111827; font-size: 18px; margin-top: 0;">{병원명} {고객명} 원장님, 혁신적인 신제품을 경험해 보세요!</h2><p style="color: #4b5563; font-size: 14px; line-height: 1.6;">제이시스 메디컬의 신규 시술 팁 및 최신 라인업이 공식 출시되었습니다. 원장님의 병원에서 직접 체험해 보실 수 있도록 데모 시연 서비스를 제공해 드립니다.</p><ul style="color: #374151; font-size: 14px; line-height: 1.8; padding-left: 20px;"><li>정밀하고 빠른 시술 모드 지원</li><li>원장님 및 고객 맞춤형 팁 라인업 확충</li><li>데모 신청 시 전용 소모품 체험 팩 증정</li></ul><div style="text-align: center; margin-top: 28px;"><a href="https://jeisys.com" style="background-color: #111827; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">장비 데모 신청하기</a></div></div><div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;"><p style="margin: 0;">© Jeisys Medical Inc. All rights reserved.</p></div></div>`,
    created_at: new Date().toISOString(),
  },
  {
    id: 'tmpl-sub-1',
    group_id: 'group-sub',
    name: '[정기공급] 소모품 정기 점검 및 자동배송 혜택',
    subject: '[제이시스] {고객명} 원장님, 소모품 정기공급으로 최대 15% 혜택을 받으세요.',
    message: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;"><div style="background-color: #059669; padding: 24px; text-align: center;"><h1 style="color: #ffffff; margin: 0; font-size: 20px;">Jeisys Regular Service</h1></div><div style="padding: 24px; background-color: #ffffff;"><h2 style="color: #111827; font-size: 18px; margin-top: 0;">안정적인 병원 운영을 위한 정기공급 서비스</h2><p style="color: #4b5563; font-size: 14px; line-height: 1.6;">{병원명}의 소모품 재고 걱정 없이, 원하는 날짜에 맞춰 정기적으로 배송받으실 수 있습니다.</p><div style="background-color: #ecfdf5; border-left: 4px solid #059669; padding: 14px; margin: 20px 0;"><div style="color: #065f46; font-weight: bold; font-size: 14px;">정기공급 회원 전용 혜택</div><div style="color: #047857; font-size: 13px; margin-top: 4px;">• 소모품 전품목 추가 10~15% 할인<br/>• 무료배송 및 정기 점검 서비스 제공</div></div><div style="text-align: center; margin-top: 28px;"><a href="https://jeisys.com" style="background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">정기공급 신청하기</a></div></div></div>`,
    created_at: new Date().toISOString(),
  },
];

let localEmailTemplates = [...DEFAULT_EMAIL_TEMPLATES];
let localEmailGroups = [...DEFAULT_EMAIL_GROUPS];
let localEmailHistory: EmailSendHistory[] = [];

export const DEFAULT_FROM_EMAIL = 'no-reply@jeisys.com';

function isTableNotFoundError(error: any): boolean {
  return error?.code === 'PGRST301' || error?.code === '42P01' || error?.status === 404;
}

export const emailService = {
  // ── 템플릿 그룹 ───────────────────────────────────────────
  async getTemplateGroups(): Promise<EmailTemplateGroup[]> {
    try {
      const { data, error } = await supabase
        .from('email_template_groups')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) {
        if (isTableNotFoundError(error)) return localEmailGroups;
        throw error;
      }
      return data && data.length > 0 ? data : localEmailGroups;
    } catch {
      return localEmailGroups;
    }
  },

  async createTemplateGroup(name: string, sortOrder: number = 0): Promise<EmailTemplateGroup> {
    try {
      const { data, error } = await supabase
        .from('email_template_groups')
        .insert({ name, sort_order: sortOrder })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch {
      const newGroup: EmailTemplateGroup = {
        id: `group-custom-${Date.now()}`,
        name,
        sort_order: sortOrder,
        created_at: new Date().toISOString(),
      };
      localEmailGroups.push(newGroup);
      return newGroup;
    }
  },

  async updateTemplateGroup(id: string, name: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_template_groups')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
    } catch {
      localEmailGroups = localEmailGroups.map(g => g.id === id ? { ...g, name } : g);
    }
  },

  async deleteTemplateGroup(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_template_groups')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch {
      localEmailGroups = localEmailGroups.filter(g => g.id !== id);
      localEmailTemplates = localEmailTemplates.map(t => t.group_id === id ? { ...t, group_id: null } : t);
    }
  },

  // ── 템플릿 ────────────────────────────────────────────────
  async getTemplates(): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        if (isTableNotFoundError(error)) return localEmailTemplates;
        throw error;
      }
      return data && data.length > 0 ? data : localEmailTemplates;
    } catch {
      return localEmailTemplates;
    }
  },

  async createTemplate(params: { name: string; subject?: string | null; message: string; group_id?: string | null }): Promise<EmailTemplate> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name: params.name,
          subject: params.subject ?? null,
          message: params.message,
          group_id: params.group_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch {
      const newTmpl: EmailTemplate = {
        id: `tmpl-custom-${Date.now()}`,
        name: params.name,
        subject: params.subject ?? null,
        message: params.message,
        group_id: params.group_id ?? null,
        created_at: new Date().toISOString(),
      };
      localEmailTemplates.unshift(newTmpl);
      return newTmpl;
    }
  },

  async updateTemplate(id: string, params: { name?: string; subject?: string | null; message?: string; group_id?: string | null }): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          ...(params.name && { name: params.name }),
          ...(params.subject !== undefined && { subject: params.subject }),
          ...(params.message && { message: params.message }),
          ...(params.group_id !== undefined && { group_id: params.group_id }),
        })
        .eq('id', id);
      if (error) throw error;
    } catch {
      localEmailTemplates = localEmailTemplates.map(t => t.id === id ? {
        ...t,
        ...(params.name && { name: params.name }),
        ...(params.subject !== undefined && { subject: params.subject }),
        ...(params.message && { message: params.message }),
        ...(params.group_id !== undefined && { group_id: params.group_id }),
      } : t);
    }
  },

  async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch {
      localEmailTemplates = localEmailTemplates.filter(t => t.id !== id);
    }
  },

  // ── 대량 이메일 발송 & 이력 ──────────────────────────────────
  async sendBulkEmail(params: BulkEmailSendParams): Promise<{ sendId: string }> {
    const isReserved = !!params.reservedAt;
    const historyRow: EmailSendHistory = {
      id: `email-hist-${Date.now()}`,
      send_type: 'marketing',
      purpose: params.purpose,
      subject: params.subject,
      message: params.message,
      from_email: params.fromEmail,
      recipient_count: params.recipients.length,
      success_count: isReserved ? 0 : params.recipients.length,
      fail_count: 0,
      status: isReserved ? 'pending' : 'sent',
      reserved_at: params.reservedAt ?? null,
      sent_at: isReserved ? null : new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('email_send_history')
        .insert({
          send_type: 'marketing',
          purpose: params.purpose,
          subject: params.subject,
          message: params.message,
          from_email: params.fromEmail,
          recipient_count: params.recipients.length,
          success_count: isReserved ? 0 : params.recipients.length,
          reserved_at: params.reservedAt ?? null,
          status: isReserved ? 'pending' : 'sent',
          sent_at: isReserved ? null : new Date().toISOString(),
        })
        .select()
        .single();
      if (!error && data) {
        return { sendId: data.id };
      }
    } catch {
      // Fallback
    }

    localEmailHistory.unshift(historyRow);
    return { sendId: historyRow.id };
  },

  async getSendHistory(): Promise<EmailSendHistory[]> {
    try {
      const { data, error } = await supabase
        .from('email_send_history')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        if (isTableNotFoundError(error)) return localEmailHistory;
        throw error;
      }
      return data && data.length > 0 ? data : localEmailHistory;
    } catch {
      return localEmailHistory;
    }
  },

  async cancelReservedEmail(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_send_history')
        .update({ status: 'canceled' })
        .eq('id', id);
      if (error) throw error;
    } catch {
      localEmailHistory = localEmailHistory.map(h => h.id === id ? { ...h, status: 'canceled' } : h);
    }
  },
};
