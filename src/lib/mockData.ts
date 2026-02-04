import {
  Equipment,
  Product,
  Order,
} from "../types";
import { productImages } from "./productImages";

export const mockEquipment: Equipment[] = [
  {
    id: "1",
    serialNumber: "ULTRACEL-2024-001",
    modelName: "ULTRAcel Q+",
    category: "HIFU 장비",
    installDate: "2024-01-15",
    warrantyEndDate: "2027-01-15",
    imageUrl: productImages.ultracelQPlus,
  },
  {
    id: "2",
    serialNumber: "POTENZA-2023-045",
    modelName: "POTENZA",
    category: "RF 마이크로니들",
    installDate: "2023-06-20",
    warrantyEndDate: "2026-06-20",
    imageUrl: productImages.potenza,
  },
  {
    id: "3",
    serialNumber: "INTRACEL-2024-028",
    modelName: "INTRAcel",
    category: "RF 니들 장비",
    installDate: "2024-03-10",
    warrantyEndDate: "2027-03-10",
    imageUrl: productImages.intracel,
  },
];

export const mockProducts: Product[] = [
  // 소모품 - Density 카테고리 (ULTRAcel Q+ 전용)
  {
    id: "101",
    sku: "CART-ULTRA-1.5MM",
    name: "ULTRAcel 카트리지 1.5mm",
    category: "Density",
    subcategory: "클래식팁 프로모션",
    compatibleEquipment: [
      "ULTRACEL-2024-001",
      "ULTRACEL-2023-045",
    ],
    price: 85000,
    tierPricing: [
      { quantity: 1, unitPrice: 85000 },
      { quantity: 3, unitPrice: 82000 },
      { quantity: 5, unitPrice: 80000 },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400",
    description: "ULTRAcel 전용 1.5mm 카트리지. 표피층 타겟팅",
    stock: 25,
  },
  {
    id: "102",
    sku: "CART-ULTRA-3.0MM",
    name: "ULTRAcel 카트리지 3.0mm",
    category: "Density",
    subcategory: "하이팁 프로모션",
    compatibleEquipment: [
      "ULTRACEL-2024-001",
      "ULTRACEL-2023-045",
    ],
    price: 88000,
    tierPricing: [
      { quantity: 1, unitPrice: 88000 },
      { quantity: 3, unitPrice: 85000 },
      { quantity: 5, unitPrice: 83000 },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400",
    description: "ULTRAcel 전용 3.0mm 카트리지. 진피층 타겟팅",
    stock: 30,
  },
  {
    id: "103",
    sku: "CART-ULTRA-4.5MM",
    name: "ULTRAcel 카트리지 4.5mm",
    category: "Density",
    subcategory: "클래식/하이 페이스팁 300샷 프로모션",
    compatibleEquipment: [
      "ULTRACEL-2024-001",
      "ULTRACEL-2023-045",
    ],
    price: 92000,
    tierPricing: [
      { quantity: 1, unitPrice: 92000 },
      { quantity: 3, unitPrice: 89000 },
      { quantity: 5, unitPrice: 87000 },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400",
    description: "ULTRAcel 전용 4.5mm 카트리지. SMAS층 리프팅",
    stock: 28,
  },

  // 소모품 - DLiv 카테고리
  {
    id: "201",
    sku: "DLIV-INJECTOR-20",
    name: "DLiv 전용 인젝터 20 SET",
    category: "DLiv",
    compatibleEquipment: [],
    price: 198000,
    tierPricing: [
      { quantity: 1, unitPrice: 198000 },
      { quantity: 5, unitPrice: 195000 },
      { quantity: 10, unitPrice: 190000 },
    ],
    imageUrl: productImages.dlivInjector20,
    description: "DLiv 전용 인젝터 20개 세트. 주사기 및 각종 부속품 포함",
    stock: 40,
  },
  {
    id: "202",
    sku: "DLIV-PUMPING-16",
    name: "DLiv 전용 PUMPING 16 팁 10SET",
    category: "DLiv",
    compatibleEquipment: [],
    price: 250000,
    tierPricing: [
      { quantity: 1, unitPrice: 250000 },
      { quantity: 5, unitPrice: 245000 },
      { quantity: 10, unitPrice: 240000 },
    ],
    imageUrl: productImages.dlivPumping16,
    description: "DLiv PUMPING-16 10개 세트. 펌핑 헤드 및 주사기 포함",
    stock: 35,
  },
  {
    id: "203",
    sku: "DLIV-PUMPING-25",
    name: "DLiv 전용 PUMPING 25 팁 10SET",
    category: "DLiv",
    compatibleEquipment: [],
    price: 250000,
    tierPricing: [
      { quantity: 1, unitPrice: 250000 },
      { quantity: 5, unitPrice: 245000 },
      { quantity: 10, unitPrice: 240000 },
    ],
    imageUrl: productImages.dlivPumping25,
    description: "DLiv PUMPING-25 10개 세트. 대용량 펌핑 헤드 및 주사기 포함",
    stock: 30,
  },

  // 소모품 - POTENZA 카테고리
  {
    id: "104",
    sku: "PTZ-DIAMOND",
    name: "POTENZA Diamond tip",
    category: "POTENZA",
    compatibleEquipment: ["POTENZA-2023-045"],
    price: 95000,
    tierPricing: [
      { quantity: 1, unitPrice: 95000 },
      { quantity: 5, unitPrice: 92000 },
      { quantity: 10, unitPrice: 90000 },
    ],
    imageUrl: productImages.potenzaDiamond,
    description:
      "한샷에 모노폴라와 바이폴라, 교차 조사 • 6mm 깊이까지 에너지 도달 가능 • Monopola + Bipolar • 전극수: 16 EA(4X4)",
    stock: 30,
  },
  {
    id: "105",
    sku: "PTZ-DDR",
    name: "POTENZA DDR tip",
    category: "POTENZA",
    compatibleEquipment: ["POTENZA-2023-045"],
    price: 88000,
    tierPricing: [
      { quantity: 1, unitPrice: 88000 },
      { quantity: 5, unitPrice: 85000 },
      { quantity: 10, unitPrice: 83000 },
    ],
    imageUrl: productImages.potenzaDDR,
    description:
      "Multiple pulse를 이용한 Dermal Heating • 2.5mm 깊이까지 에너지 도달 가능 • Bipolar / 2MHz • 전극수: 36 EA(6X6)",
    stock: 35,
  },
  {
    id: "106",
    sku: "PTZ-SFA",
    name: "POTENZA SFA tip",
    category: "POTENZA",
    compatibleEquipment: ["POTENZA-2023-045"],
    price: 92000,
    tierPricing: [
      { quantity: 1, unitPrice: 92000 },
      { quantity: 5, unitPrice: 89000 },
      { quantity: 10, unitPrice: 87000 },
    ],
    imageUrl: productImages.potenzaSFA,
    description:
      "한샷에 모노폴라와 바이폴라, 교차 조사 • 6mm 깊이까지 에너지 도달 가능 • Monopola + Bipolar • 전극수: 16 EA(4X4)",
    stock: 28,
  },

  // 소모품 - INTRAcel 카테고리
  {
    id: "107",
    sku: "TIP-INTRACEL-49P",
    name: "INTRAcel 49핀 팁",
    category: "INTRAcel",
    compatibleEquipment: ["INTRACEL-2024-028"],
    price: 78000,
    tierPricing: [
      { quantity: 1, unitPrice: 78000 },
      { quantity: 5, unitPrice: 75000 },
      { quantity: 10, unitPrice: 73000 },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
    description: "INTRAcel 49핀 팁. 여드름 흉터 치료",
    stock: 32,
  },

  // 소모품 - 공통
  {
    id: "108",
    sku: "GEL-ULTRA-500",
    name: "초음파 전용 젤 500ml",
    category: "기타소모품",
    compatibleEquipment: [
      "ULTRACEL-2024-001",
      "ULTRACEL-2023-045",
    ],
    price: 35000,
    tierPricing: [
      { quantity: 1, unitPrice: 35000 },
      { quantity: 10, unitPrice: 33000 },
      { quantity: 20, unitPrice: 31000 },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
    description: "HIFU 장비 전용 고품질 초음파 젤",
    stock: 200,
  },
  {
    id: "109",
    sku: "CLEAN-MULTI-200",
    name: "다목적 클리닝 솔루션 200ml",
    category: "기타소모품",
    compatibleEquipment: [
      "ULTRACEL-2024-001",
      "POTENZA-2023-045",
      "INTRACEL-2024-028",
    ],
    price: 28000,
    tierPricing: [
      { quantity: 1, unitPrice: 28000 },
      { quantity: 10, unitPrice: 26000 },
      { quantity: 20, unitPrice: 24000 },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1585828922344-f5a0c8c56a9d?w=400",
    description:
      "모든 의료 기기에 사용 가능한 전문 클리닝 제품",
    stock: 150,
  },
  {
    id: "110",
    sku: "MASK-RECOVERY-10",
    name: "시술 후 진정 마스크 (10매)",
    category: "기타소모품",
    compatibleEquipment: [],
    price: 45000,
    tierPricing: [
      { quantity: 1, unitPrice: 45000 },
      { quantity: 5, unitPrice: 43000 },
      { quantity: 10, unitPrice: 40000 },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400",
    description:
      "시술 후 피부 진정 및 회복을 위한 전문 마스크팩",
    stock: 80,
  },
  {
    id: "111",
    sku: "NUMB-CREAM-30G",
    name: "마취 크림 30g",
    category: "기타소모품",
    compatibleEquipment: [],
    price: 55000,
    tierPricing: [
      { quantity: 1, unitPrice: 55000 },
      { quantity: 5, unitPrice: 52000 },
      { quantity: 10, unitPrice: 50000 },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1631549576707-5d5428a0e3d5?w=400",
    description: "시술 전 도포용 국소 마취 크림",
    stock: 60,
  },
];

export const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2025-0124-001",
    date: "2025-01-20",
    status: "shipped",
    items: [
      { product: mockProducts.find(p => p.id === "107") || mockProducts[0], quantity: 2 },
      { product: mockProducts.find(p => p.id === "108") || mockProducts[0], quantity: 3 },
    ],
    totalAmount: 425000,
    paymentMethod: "여신(외상) 거래",
    deliveryTrackingNumber: "1234567890",
  },
  {
    id: "2",
    orderNumber: "ORD-2025-0110-045",
    date: "2025-01-10",
    status: "delivered",
    items: [
      { product: mockProducts.find(p => p.id === "109") || mockProducts[0], quantity: 2 },
      { product: mockProducts.find(p => p.id === "110") || mockProducts[0], quantity: 10 },
    ],
    totalAmount: 456000,
    paymentMethod: "카드 결제",
  },
];

// Purchase history for "quick order" feature
export const mockPurchaseHistory = [
  {
    productId: "101",
    lastPurchaseDate: "2025-01-20",
    frequency: 8,
  },
  {
    productId: "102",
    lastPurchaseDate: "2025-01-20",
    frequency: 7,
  },
  {
    productId: "104",
    lastPurchaseDate: "2025-01-18",
    frequency: 5,
  },
  {
    productId: "107",
    lastPurchaseDate: "2025-01-15",
    frequency: 12,
  },
  {
    productId: "108",
    lastPurchaseDate: "2025-01-15",
    frequency: 10,
  },
];