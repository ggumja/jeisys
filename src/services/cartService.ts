import { supabase } from '../lib/supabaseClient';
import { CartItem } from '../types';

// ── 대리주문 Proxy 헬퍼 ─────────────────────────────────────
const PROXY_KEY = 'proxy_customer_id';
const PROXY_NAME_KEY = 'proxy_customer_name';

export const proxyOrderService = {
  /** 대리주문 모드 시작: 고객 장바구니 초기화 후 proxy 설정 */
  async startProxy(customerId: string, customerName: string): Promise<void> {
    // 고객 기존 장바구니 초기화
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', customerId);
    if (error) throw error;

    localStorage.setItem(PROXY_KEY, customerId);
    localStorage.setItem(PROXY_NAME_KEY, customerName);
  },

  /** 대리주문 모드 종료 */
  endProxy(): void {
    localStorage.removeItem(PROXY_KEY);
    localStorage.removeItem(PROXY_NAME_KEY);
  },

  /** 현재 proxy 고객 ID */
  getProxyCustomerId(): string | null {
    return localStorage.getItem(PROXY_KEY);
  },

  /** 현재 proxy 고객 이름 */
  getProxyCustomerName(): string | null {
    return localStorage.getItem(PROXY_NAME_KEY);
  },

  /** proxy 모드 여부 */
  isProxyMode(): boolean {
    return !!localStorage.getItem(PROXY_KEY);
  },
};

// ── cartService ─────────────────────────────────────────────
export const cartService = {
  // Get cart items — proxy 모드시 대상 고객의 cart 반환
  async getCart(): Promise<CartItem[]> {
    const proxyId = proxyOrderService.getProxyCustomerId();
    const targetUserId = proxyId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
          id,
          product_id,
          quantity,
          is_subscription,
          selected_product_ids,
          option_id,
          option_name,
          custom_price
      `)
      .eq('user_id', targetUserId);

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      isSubscription: item.is_subscription,
      selectedProductIds: item.selected_product_ids,
      optionId: item.option_id,
      optionName: item.option_name,
      customPrice: item.custom_price ?? null,
    }));
  },

  // Add item to cart — proxy 모드시 고객 cart에 추가
  async addToCart(
    productId: string,
    quantity: number,
    isSubscription: boolean = false,
    selectedProductIds?: string[],
    optionId?: string,
    optionName?: string
  ) {
    const proxyId = proxyOrderService.getProxyCustomerId();
    const authUser = (await supabase.auth.getUser()).data.user;
    if (!authUser) throw new Error('User not authenticated');

    const targetUserId = proxyId || authUser.id;

    // Check if identical item exists
    let query = supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', targetUserId)
      .eq('product_id', productId);

    if (selectedProductIds && selectedProductIds.length > 0) {
      query = query.filter('selected_product_ids', 'eq', `{"${selectedProductIds.join('","')}"}`);
    } else {
      query = query.is('selected_product_ids', null);
    }

    if (optionId) {
      query = query.eq('option_id', optionId);
    } else {
      query = query.is('option_id', null);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity, is_subscription: isSubscription })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: targetUserId,
          product_id: productId,
          quantity,
          is_subscription: isSubscription,
          selected_product_ids: selectedProductIds || null,
          option_id: optionId || null,
          option_name: optionName || null,
        });
      if (error) throw error;
    }
  },

  // Update item quantity
  async updateQuantity(cartItemId: string, quantity: number) {
    const proxyId = proxyOrderService.getProxyCustomerId();
    const authUser = (await supabase.auth.getUser()).data.user;
    if (!authUser) throw new Error('User not authenticated');

    const targetUserId = proxyId || authUser.id;

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .eq('user_id', targetUserId);

    if (error) throw error;
  },

  // Toggle subscription
  async updateSubscription(cartItemId: string, isSubscription: boolean) {
    const proxyId = proxyOrderService.getProxyCustomerId();
    const authUser = (await supabase.auth.getUser()).data.user;
    if (!authUser) throw new Error('User not authenticated');

    const targetUserId = proxyId || authUser.id;

    const { error } = await supabase
      .from('cart_items')
      .update({ is_subscription: isSubscription })
      .eq('id', cartItemId)
      .eq('user_id', targetUserId);

    if (error) throw error;
  },

  // Remove item
  async removeItem(cartItemId: string) {
    const proxyId = proxyOrderService.getProxyCustomerId();
    const authUser = (await supabase.auth.getUser()).data.user;
    if (!authUser) throw new Error('User not authenticated');

    const targetUserId = proxyId || authUser.id;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .eq('user_id', targetUserId);

    if (error) throw error;
  },

  // Clear cart
  async clearCart() {
    const proxyId = proxyOrderService.getProxyCustomerId();
    const authUser = (await supabase.auth.getUser()).data.user;
    if (!authUser) throw new Error('User not authenticated');

    const targetUserId = proxyId || authUser.id;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', targetUserId);

    if (error) throw error;
  },

  /** 어드민 전용 — 협의 단가 설정/해제 */
  async updateCustomPrice(cartItemId: string, customPrice: number | null) {
    const { error } = await supabase
      .from('cart_items')
      .update({ custom_price: customPrice })
      .eq('id', cartItemId);

    if (error) throw error;
  },
};
