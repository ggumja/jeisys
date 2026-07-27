export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type TargetScope = 'ALL' | 'CATEGORY' | 'EQUIPMENT' | 'PRODUCT';
export type IssueType = 'MANUAL' | 'DOWNLOAD' | 'AUTO';
export type ValidityType = 'DATE_RANGE' | 'DAYS_FROM_ISSUE';
export type UserCouponStatus = 'UNUSED' | 'USED' | 'EXPIRED';

export interface CouponTarget {
  id: string;
  couponId: string;
  targetType: 'CATEGORY' | 'EQUIPMENT' | 'PRODUCT';
  targetId: string;
  targetName?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  name: string;
  code?: string;
  discountType: DiscountType;       // 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number;            // 비율(%) 또는 금액(원)
  targetScope: TargetScope;         // 'ALL' | 'CATEGORY' | 'EQUIPMENT' | 'PRODUCT'
  minOrderAmount: number;           // 최소 주문 금액
  maxDiscountAmount?: number;       // 최대 할인 금액 (정률 할인 시 한도)
  issueType: IssueType;
  totalQuantity?: number;           // 총 발급 가능 수량 (null: 무제한)
  issuedQuantity: number;           // 현재 발급 수량
  validityType: ValidityType;       // 'DATE_RANGE' | 'DAYS_FROM_ISSUE'
  startDate?: string;               // 시작일 (YYYY-MM-DD)
  endDate?: string;                 // 종료일 (YYYY-MM-DD)
  validDays?: number;               // 발급일 기준 N일
  isActive: boolean;
  targets?: CouponTarget[];
  createdAt: string;
  updatedAt: string;
}

export interface UserCoupon {
  id: string;
  couponId: string;
  userId: string;
  status: UserCouponStatus;
  issuedAt: string;
  usedAt?: string;
  orderId?: string;
  expiresAt: string;
  coupon?: Coupon;
  createdAt: string;
}

export interface CouponDiscountCalculation {
  isApplicable: boolean;
  reason?: string;
  applicableSubtotal: number;
  discountAmount: number;
}
