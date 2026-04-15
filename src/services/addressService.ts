import { supabase } from '../lib/supabaseClient';
import { ShippingAddress } from '../types';

// DB row -> 클라이언트 타입 변환
const fromRow = (row: any): ShippingAddress => ({
  id: row.id,
  userId: row.user_id,
  label: row.label,
  recipient: row.recipient,
  phone: row.phone,
  zipCode: row.zip_code,
  address: row.address,
  addressDetail: row.address_detail || '',
  isDefault: row.is_default,
  createdAt: row.created_at,
});

export const addressService = {
  /** 내 배송지 목록 조회 (기본배송지 우선 정렬) */
  async getAddresses(userId: string): Promise<ShippingAddress[]> {
    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromRow);
  },

  /** 배송지 추가 */
  async addAddress(
    userId: string,
    input: Omit<ShippingAddress, 'id' | 'userId' | 'createdAt'>
  ): Promise<ShippingAddress> {
    // 기본배송지로 설정할 경우 기존 기본 해제
    if (input.isDefault) {
      await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('shipping_addresses')
      .insert({
        user_id: userId,
        label: input.label,
        recipient: input.recipient,
        phone: input.phone,
        zip_code: input.zipCode,
        address: input.address,
        address_detail: input.addressDetail,
        is_default: input.isDefault,
      })
      .select()
      .single();

    if (error) throw error;
    return fromRow(data);
  },

  /** 배송지 수정 */
  async updateAddress(
    id: string,
    userId: string,
    input: Partial<Omit<ShippingAddress, 'id' | 'userId' | 'createdAt'>>
  ): Promise<ShippingAddress> {
    if (input.isDefault) {
      await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const updatePayload: any = {};
    if (input.label !== undefined) updatePayload.label = input.label;
    if (input.recipient !== undefined) updatePayload.recipient = input.recipient;
    if (input.phone !== undefined) updatePayload.phone = input.phone;
    if (input.zipCode !== undefined) updatePayload.zip_code = input.zipCode;
    if (input.address !== undefined) updatePayload.address = input.address;
    if (input.addressDetail !== undefined) updatePayload.address_detail = input.addressDetail;
    if (input.isDefault !== undefined) updatePayload.is_default = input.isDefault;
    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('shipping_addresses')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromRow(data);
  },

  /** 배송지 삭제 */
  async deleteAddress(id: string): Promise<void> {
    const { error } = await supabase
      .from('shipping_addresses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /** 기본배송지 변경 */
  async setDefault(id: string, userId: string): Promise<void> {
    await supabase
      .from('shipping_addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    const { error } = await supabase
      .from('shipping_addresses')
      .update({ is_default: true })
      .eq('id', id);

    if (error) throw error;
  },
};
