import { Coupon, UserCoupon, CouponDiscountCalculation } from '../types/coupon';
import { CartItem, Product } from '../types';

const STORAGE_KEY_COUPONS = 'jeisys_coupons';
const STORAGE_KEY_USER_COUPONS = 'jeisys_user_coupons';

const initialCoupons: Coupon[] = [
  {
    id: 'cpn-1',
    name: '신규 회원 가입 10% 감사 쿠폰',
    code: 'WELCOME10',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    targetScope: 'ALL',
    minOrderAmount: 10000,
    maxDiscountAmount: 30000,
    issueType: 'AUTO',
    issuedQuantity: 15,
    validityType: 'DAYS_FROM_ISSUE',
    validDays: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cpn-2',
    name: 'Potenza 장비 전용 소모품 20,000원 할인쿠폰',
    code: 'POTENZA20K',
    discountType: 'FIXED_AMOUNT',
    discountValue: 20000,
    targetScope: 'EQUIPMENT',
    minOrderAmount: 50000,
    maxDiscountAmount: 20000,
    issueType: 'DOWNLOAD',
    issuedQuantity: 8,
    validityType: 'DATE_RANGE',
    startDate: '2026-07-01',
    endDate: '2026-08-31',
    isActive: true,
    targets: [
      {
        id: 't-1',
        couponId: 'cpn-2',
        targetType: 'EQUIPMENT',
        targetId: 'POTENZA',
        targetName: 'Potenza',
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cpn-3',
    name: '레이저 카테고리 15% 특별 할인쿠폰',
    code: 'LASER15',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    targetScope: 'CATEGORY',
    minOrderAmount: 30000,
    maxDiscountAmount: 50000,
    issueType: 'MANUAL',
    issuedQuantity: 5,
    validityType: 'DATE_RANGE',
    startDate: '2026-07-15',
    endDate: '2026-09-30',
    isActive: true,
    targets: [
      {
        id: 't-2',
        couponId: 'cpn-3',
        targetType: 'CATEGORY',
        targetId: 'laser',
        targetName: '레이저',
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const initialUserCoupons: UserCoupon[] = [
  {
    id: 'ucpn-1',
    couponId: 'cpn-1',
    userId: 'usr-1',
    status: 'UNUSED',
    issuedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
    coupon: initialCoupons[0],
    createdAt: new Date().toISOString()
  },
  {
    id: 'ucpn-2',
    couponId: 'cpn-2',
    userId: 'usr-1',
    status: 'UNUSED',
    issuedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    coupon: initialCoupons[1],
    createdAt: new Date().toISOString()
  },
  {
    id: 'ucpn-3',
    couponId: 'cpn-3',
    userId: 'usr-1',
    status: 'UNUSED',
    issuedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    coupon: initialCoupons[2],
    createdAt: new Date().toISOString()
  }
];

export const couponService = {
  getCoupons(): Coupon[] {
    const raw = localStorage.getItem(STORAGE_KEY_COUPONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(initialCoupons));
      return initialCoupons;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(initialCoupons));
      return initialCoupons;
    } catch {
      localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(initialCoupons));
      return initialCoupons;
    }
  },

  saveCoupons(coupons: Coupon[]): void {
    localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(coupons));
  },

  getUserCoupons(userId: string): UserCoupon[] {
    const raw = localStorage.getItem(STORAGE_KEY_USER_COUPONS);
    let list: UserCoupon[] = [];
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USER_COUPONS, JSON.stringify(initialUserCoupons));
      list = initialUserCoupons;
    } else {
      try {
        list = JSON.parse(raw);
      } catch {
        list = initialUserCoupons;
      }
    }

    const allCoupons = this.getCoupons();
    const now = new Date().toISOString();

    return list
      .filter(uc => uc.userId === userId || !userId)
      .map(uc => {
        const parent = allCoupons.find(c => c.id === uc.couponId) || uc.coupon;
        let status = uc.status;
        if (status === 'UNUSED' && uc.expiresAt < now) {
          status = 'EXPIRED';
        }
        return {
          ...uc,
          status,
          coupon: parent
        };
      });
  },

  saveUserCoupons(userCoupons: UserCoupon[]): void {
    localStorage.setItem(STORAGE_KEY_USER_COUPONS, JSON.stringify(userCoupons));
  },

  createCoupon(couponData: Omit<Coupon, 'id' | 'issuedQuantity' | 'createdAt' | 'updatedAt'>): Coupon {
    const list = this.getCoupons();
    const newCoupon: Coupon = {
      ...couponData,
      id: `cpn-${Date.now()}`,
      issuedQuantity: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(newCoupon);
    this.saveCoupons(list);
    return newCoupon;
  },

  updateCoupon(id: string, updates: Partial<Coupon>): Coupon | null {
    const list = this.getCoupons();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveCoupons(list);
    return list[idx];
  },

  deleteCoupon(id: string): boolean {
    let list = this.getCoupons();
    const lenBefore = list.length;
    list = list.filter(c => c.id !== id);
    this.saveCoupons(list);
    return list.length < lenBefore;
  },

  issueCouponToUser(couponId: string, userId: string): UserCoupon {
    const coupons = this.getCoupons();
    const coupon = coupons.find(c => c.id === couponId);
    if (!coupon) throw new Error('쿠폰을 찾을 수 없습니다.');

    let expiresAt = new Date().toISOString();
    if (coupon.validityType === 'DAYS_FROM_ISSUE' && coupon.validDays) {
      expiresAt = new Date(Date.now() + coupon.validDays * 24 * 60 * 60 * 1000).toISOString();
    } else if (coupon.validityType === 'DATE_RANGE' && coupon.endDate) {
      expiresAt = new Date(`${coupon.endDate}T23:59:59`).toISOString();
    } else {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const userCoupons = this.getUserCoupons('');
    const newUserCoupon: UserCoupon = {
      id: `ucpn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      couponId,
      userId,
      status: 'UNUSED',
      issuedAt: new Date().toISOString(),
      expiresAt,
      coupon,
      createdAt: new Date().toISOString()
    };

    userCoupons.push(newUserCoupon);
    this.saveUserCoupons(userCoupons);

    this.updateCoupon(couponId, { issuedQuantity: (coupon.issuedQuantity || 0) + 1 });

    return newUserCoupon;
  },

  markCouponUsed(userCouponId: string, orderId: string): void {
    const list = this.getUserCoupons('');
    const idx = list.findIndex(uc => uc.id === userCouponId);
    if (idx !== -1) {
      list[idx].status = 'USED';
      list[idx].usedAt = new Date().toISOString();
      list[idx].orderId = orderId;
      this.saveUserCoupons(list);
    }
  },

  calculateDiscount(
    userCoupon: UserCoupon,
    cartItems: CartItem[],
    productsMap: Record<string, Product>
  ): CouponDiscountCalculation {
    const coupon = userCoupon.coupon;
    if (!coupon || !coupon.isActive) {
      return { isApplicable: false, reason: '유효하지 않거나 비활성화된 쿠폰입니다.', applicableSubtotal: 0, discountAmount: 0 };
    }

    if (userCoupon.status !== 'UNUSED') {
      return { isApplicable: false, reason: '이미 사용하였거나 만료된 쿠폰입니다.', applicableSubtotal: 0, discountAmount: 0 };
    }

    const now = new Date().toISOString();
    if (userCoupon.expiresAt < now) {
      return { isApplicable: false, reason: '사용기한이 만료된 쿠폰입니다.', applicableSubtotal: 0, discountAmount: 0 };
    }

    let applicableItems: { item: CartItem; itemTotal: number }[] = [];

    cartItems.forEach(item => {
      const product = productsMap[item.productId];
      if (!product) return;

      const unitPrice = item.customPrice != null ? item.customPrice : product.price;
      const itemTotal = unitPrice * item.quantity;

      let isMatch = false;

      if (coupon.targetScope === 'ALL') {
        isMatch = true;
      } else if (coupon.targetScope === 'CATEGORY') {
        const targetCategoryIds = (coupon.targets || [])
          .filter(t => t.targetType === 'CATEGORY')
          .map(t => t.targetId);
        if (product.categoryId && targetCategoryIds.includes(product.categoryId)) {
          isMatch = true;
        }
      } else if (coupon.targetScope === 'EQUIPMENT') {
        const targetEquipmentIds = (coupon.targets || [])
          .filter(t => t.targetType === 'EQUIPMENT')
          .map(t => t.targetId.toUpperCase());
        const productEquipments = (product.compatibleEquipment || []).map(e => e.toUpperCase());
        if (productEquipments.some(eq => targetEquipmentIds.includes(eq))) {
          isMatch = true;
        }
      } else if (coupon.targetScope === 'PRODUCT') {
        const targetProductIds = (coupon.targets || [])
          .filter(t => t.targetType === 'PRODUCT')
          .map(t => t.targetId);
        if (targetProductIds.includes(product.id) || (product.sku && targetProductIds.includes(product.sku))) {
          isMatch = true;
        }
      }

      if (isMatch) {
        applicableItems.push({ item, itemTotal });
      }
    });

    if (applicableItems.length === 0) {
      let targetDesc = '해당 상품';
      if (coupon.targetScope === 'CATEGORY') targetDesc = '해당 카테고리';
      if (coupon.targetScope === 'EQUIPMENT') targetDesc = '해당 장비';
      if (coupon.targetScope === 'PRODUCT') targetDesc = '해당 지정 상품';
      return {
        isApplicable: false,
        reason: `장바구니에 ${targetDesc} 할인 대상 상품이 없습니다.`,
        applicableSubtotal: 0,
        discountAmount: 0
      };
    }

    const applicableSubtotal = applicableItems.reduce((sum, i) => sum + i.itemTotal, 0);

    if (coupon.minOrderAmount > 0 && applicableSubtotal < coupon.minOrderAmount) {
      return {
        isApplicable: false,
        reason: `최소 주문금액(${coupon.minOrderAmount.toLocaleString()}원) 이상 시 사용 가능합니다. (현재 대상금액: ${applicableSubtotal.toLocaleString()}원)`,
        applicableSubtotal,
        discountAmount: 0
      };
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      calculatedDiscount = Math.floor(applicableSubtotal * (coupon.discountValue / 100));
      if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        calculatedDiscount = Math.min(calculatedDiscount, coupon.maxDiscountAmount);
      }
    } else {
      calculatedDiscount = Math.min(coupon.discountValue, applicableSubtotal);
    }

    return {
      isApplicable: true,
      applicableSubtotal,
      discountAmount: calculatedDiscount
    };
  }
};
