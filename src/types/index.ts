export interface User {
  id: string;
  loginId?: string;
  email: string;
  name: string;
  hospitalName: string;
  businessNumber: string;
  phone: string;
  mobile?: string;
  hospitalEmail?: string;
  taxEmail?: string;
  address?: string;
  addressDetail?: string;
  zipCode?: string;
  region?: string;
  businessCertificateUrl?: string;
  emailNotification?: boolean;
  holidayWeek?: string;
  holidayDay?: string;
  isPublicHoliday?: boolean;
  role?: 'admin' | 'user';
  memberType?: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
}

export interface ShippingAddress {
  id: string;
  userId: string;
  label: string;          // 배송지 별칭 (병원, 집, 창고 등)
  recipient: string;
  phone: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface Equipment {
  id: string;
  serialNumber: string;
  modelName: string;
  category: string;
  installDate: string;
  warrantyEndDate: string;
  imageUrl: string;
}

export interface SignupEquipment {
  name: string;
  selected: boolean;
  serialNumber: string;
}

export interface Product {
  id: string;
  displayNo?: number;
  sku: string;
  sapSku?: string;
  manufacturer?: string;
  name: string;
  category: string;
  subcategory?: string;
  compatibleEquipment: string[];
  price: number;
  tierPricing: { quantity: number; unitPrice: number }[];
  imageUrl: string;
  additionalImages?: string[];
  description: string;
  stock: number;
  salesUnit?: number;
  baseProductId?: string;
  stockMultiplier?: number;
  isPackage?: boolean;
  isPromotion?: boolean;
  buyQuantity?: number;
  getQuantity?: number;
  selectableCount?: number;
  itemInputType?: 'select' | 'input';
  creditAvailable?: boolean;
  pointsAvailable?: boolean;
  isVisible?: boolean;
  isActive?: boolean;
  subscriptionDiscount?: number;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  quantityInputType?: 'button' | 'list';
  discountRate?: number;
  bonusItems?: BonusItem[];
  options?: ProductQuantityOption[];
}

export interface ProductQuantityOption {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  discountRate: number;
  price?: number;
  displayOrder: number;
}

export interface BonusItem {
  id: string;
  productId: string;
  quantity: number;
  priceOverride?: number;
  product?: Product;
  optionId?: string;
  calculationMethod?: 'fixed' | 'ratio';
  percentage?: number;
}

export interface PackageItem {
  id: string;
  packageId: string;
  productId: string;
  product?: Product;
  priceOverride?: number;
  maxQuantity?: number;
  optionId?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  isSubscription: boolean;
  selectedProductIds?: string[];
  optionId?: string;
  optionName?: string;
  customPrice?: number | null; // 어드민 대리주문 협의 단가
}

export interface ClaimInfo {
  type: 'CANCEL' | 'RETURN' | 'EXCHANGE';
  reason: string;
  requestedAt: string;
  processedAt?: string;
  rejectedReason?: string;
  returnTrackingNumber?: string;
  exchangeTrackingNumber?: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  shippedAt: string;
  isPartial: boolean;
  items: Array<{
    productName: string;
    quantity: number;
    bonusItems?: Array<{ productName: string; quantity: number }>;
  }>;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status:
    | 'pending'
    | 'paid'
    | 'processing'
    | 'partially_shipped'
    | 'shipped'
    | 'delivered'
    | 'cancel_requested'
    | 'return_requested'
    | 'returning'
    | 'returned'
    | 'exchange_requested'
    | 'partially_refunded'
    | 'cancelled';
  items: {
    product: Product;
    quantity: number;
    price: number;
    shippedQuantity?: number;
    optionId?: string;
    optionName?: string;
    selectedProductIds?: string[];
    bonusItems?: Array<{ productName: string; quantity: number }>;
  }[];
  totalAmount: number;
  paymentMethod: string;
  deliveryTrackingNumber?: string;
  shipments?: Shipment[];
  claimInfo?: ClaimInfo;
  vactBankName?: string;
  vactNum?: string;
  vactName?: string;
  vactInputDeadline?: string;
}

export interface Inquiry {
  id: string;
  userId: string | null;
  type: string;
  title: string;
  content: string;
  isSecret: boolean;
  status: 'waiting' | 'answered';
  answerContent?: string | null;
  answeredAt?: string | null;
  createdAt: string;
  user?: {
    name: string;
    hospitalName?: string | null;
    phone?: string | null;
    mobile?: string | null;
  } | null;
}

export interface Post {
  id: string;
  type: 'notice' | 'faq' | 'news' | 'media' | 'manual';
  title: string;
  content: string | null;
  viewCount: number;
  isVisible: boolean;
  imageUrl: string | null;
  createdAt: string;
  platform?: 'youtube' | 'instagram' | 'blog' | 'facebook'; // Added for Media
  category?: string; // Added for FAQ/Manual
}

export interface PaymentMethod {
  id: string;
  userId: string;
  provider: string;
  billingKey: string;
  cardName: string;
  cardNumberMasked: string;
  alias?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  originalOrderId?: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  billingKeyId: string;
  cycleDays: number;
  nextBillingDate: string;
  lastBillingDate?: string;
  createdAt: string;
}

export interface SplitPaymentMethod {
  id: string;
  type: 'credit' | 'general' | 'virtual';
  cardId?: string;
  amount: number;
}

