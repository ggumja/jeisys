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
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
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
}

export interface CartItem {
  productId: string;
  quantity: number;
  isSubscription: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  items: { product: Product; quantity: number }[];
  totalAmount: number;
  paymentMethod: string;
  deliveryTrackingNumber?: string;
}