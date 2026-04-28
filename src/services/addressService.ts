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
    // 기본배송지로 설정할 경우 기존 기본 해제 (RPC 사용 - PATCH 우회)
    if (input.isDefault) {
      await supabase.rpc('clear_default_shipping_addresses');
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
    // RPC로 업데이트 (PATCH CORS 우회)
    const { error: rpcError } = await supabase.rpc('update_shipping_address', {
      p_id: id,
      p_label: input.label ?? null,
      p_recipient: input.recipient ?? null,
      p_phone: input.phone ?? null,
      p_zip_code: input.zipCode ?? null,
      p_address: input.address ?? null,
      p_address_detail: input.addressDetail ?? null,
      p_is_default: input.isDefault ?? null,
    });
    if (rpcError) throw rpcError;

    // 업데이트된 데이터 재조회
    const { data, error } = await supabase
      .from('shipping_addresses')
      .select()
      .eq('id', id)
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
    const { error } = await supabase.rpc('set_default_shipping_address', {
      p_id: id,
    });
    if (error) throw error;
  },
};
