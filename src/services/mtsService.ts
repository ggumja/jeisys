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

export const mtsService = {

  // ── 템플릿 그룹 ───────────────────────────────────────────

  async getTemplateGroups(): Promise<SmsTemplateGroup[]> {
    const { data, error } = await supabase
      .from('sms_template_groups')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      if (isTableNotFoundError(error)) return [];
      throw error;
    }
    return data || [];
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
    let query = supabase.from('sms_templates').select('*').order('created_at', { ascending: false });
    if (groupId) query = query.eq('group_id', groupId);
    const { data, error } = await query;
    if (error) {
      if (isTableNotFoundError(error)) return [];
      throw error;
    }
    return data || [];
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
      const { error } = await supabase.functions.invoke('send-sms', {
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
      if (!error) edgeFnCalled = true;
    } catch {
      // Edge Function 미배포 → 로그만 남기고 계속 진행
      console.info('[mtsService] send-sms Edge Function not available. DB record saved.');
    }

    return { sendId: historyRow.id, edgeFnCalled };
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
