export interface User {
  id: string;
  email: string;
  name: string;
  hospitalName: string;
  businessNumber: string;
  phone: string;
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

export interface Product {
  id: string;
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