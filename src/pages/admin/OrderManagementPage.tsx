import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Eye, Package, Clock, CheckCircle, Truck, AlertCircle, Calendar, Printer } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  hospitalName: string;
  orderDate: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  items: number;
  orderItems?: OrderItem[];
  shippingInfo?: ShippingInfo;
  paymentInfo?: PaymentInfo;
  isSubscription?: boolean;
  subscriptionCycle?: string;
  nextDeliveryDate?: string;
  subscriptionStatus?: 'active' | 'paused' | 'cancelled';
  subscriptionStartDate?: string;
  deliveryCount?: number;
  trackingNumber?: string;
  trackingCompany?: string;
  shippedAt?: string;
}

interface OrderItem {
  id: string;
  productName: string;
  category: string;
  quantity: number;
  price: number;
  thumbnail?: string;
}

interface ShippingInfo {
  recipient: string;
  phone: string;
  address: string;
  addressDetail: string;
  zipCode: string;
  memo?: string;
}

interface PaymentInfo {
  method: string;
  bankName?: string;
  accountNumber?: string;
  depositor?: string;
  paidAt?: string;
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2026-0001',
    customerName: '김민종 원장',
    hospitalName: '서울피부과의원',
    orderDate: '2026-02-02',
    totalAmount: 1250000,
    status: 'confirmed',
    items: 3,
    orderItems: [
      {
        id: '1-1',
        productName: 'POTENZA 니들 팁 16핀',
        category: 'POTENZA',
        quantity: 2,
        price: 500000,
      },
      {
        id: '1-2',
        productName: 'ULTRAcel II 카트리지 3.0mm',
        category: 'ULTRAcel II',
        quantity: 1,
        price: 250000,
      },
    ],
    shippingInfo: {
      recipient: '김민종 원장',
      phone: '010-1234-5678',
      address: '서울특별시 강남구 논현동 123-456',
      addressDetail: '서울피부과의원 1층',
      zipCode: '06234',
      memo: '부재 시 경비실에 맡겨주세요',
    },
    paymentInfo: {
      method: '무통장 입금',
      bankName: '신한은행',
      accountNumber: '110-123-456789',
      depositor: '김민종',
      paidAt: '2026-02-02 14:30',
    },
  },
  {
    id: '5',
    orderNumber: 'ORD-2026-0005',
    customerName: '한지민 원장',
    hospitalName: '청담스킨클리닉',
    orderDate: '2026-02-03',
    totalAmount: 980000,
    status: 'confirmed',
    items: 2,
    orderItems: [
      {
        id: '5-1',
        productName: 'INTRAcel 니들 카트리지',
        category: 'INTRAcel',
        quantity: 2,
        price: 490000,
      },
    ],
    shippingInfo: {
      recipient: '한지민 원장',
      phone: '010-3333-4444',
      address: '서울특별시 강남구 청담동 789-123',
      addressDetail: '청담스킨클리닉 3층',
      zipCode: '06075',
      memo: '오후 2시 이후 배송',
    },
    paymentInfo: {
      method: '무통장 입금',
      bankName: '하나은행',
      accountNumber: '333-444-555666',
      depositor: '한지민',
      paidAt: '2026-02-03 10:20',
    },
  },
  // 정기배송 - 오늘 발송 예정
  {
    id: 'SUB-5',
    orderNumber: 'SUB-2026-0005',
    customerName: '조인성 원장',
    hospitalName: '압구정피부과',
    orderDate: '2026-01-03',
    totalAmount: 720000,
    status: 'confirmed',
    items: 1,
    isSubscription: true,
    subscriptionCycle: '매월',
    nextDeliveryDate: '2026-02-03',
    subscriptionStatus: 'active',
    subscriptionStartDate: '2026-01-03',
    deliveryCount: 1,
    orderItems: [
      {
        id: 'sub-5-1',
        productName: 'DLiv 리프팅 앰플',
        category: 'DLiv',
        quantity: 3,
        price: 720000,
      },
    ],
    shippingInfo: {
      recipient: '조인성 원장',
      phone: '010-7777-8888',
      address: '서울특별시 강남구 압구정로 456',
      addressDetail: '압구정피부과 2층',
      zipCode: '06009',
    },
    paymentInfo: {
      method: '자동결제',
      paidAt: '매월 3일 자동결제',
    },
  },
  {
    id: 'SUB-6',
    orderNumber: 'SUB-2026-0006',
    customerName: '송혜교 원장',
    hospitalName: '강남프리미엄클리닉',
    orderDate: '2026-01-18',
    totalAmount: 1200000,
    status: 'confirmed',
    items: 2,
    isSubscription: true,
    subscriptionCycle: '2주마다',
    nextDeliveryDate: '2026-02-03',
    subscriptionStatus: 'active',
    subscriptionStartDate: '2026-01-18',
    deliveryCount: 2,
    orderItems: [
      {
        id: 'sub-6-1',
        productName: 'POTENZA 니들 팁 25핀',
        category: 'POTENZA',
        quantity: 2,
        price: 1200000,
      },
    ],
    shippingInfo: {
      recipient: '송혜교 원장',
      phone: '010-9999-0000',
      address: '서울특별시 강남구 선릉로 321',
      addressDetail: '강남프리미엄클리닉 5층',
      zipCode: '06178',
    },
    paymentInfo: {
      method: '자동결제',
      paidAt: '2주마다 자동결제',
    },
  },
];

// 오늘 날짜 (2026-02-03)
const TODAY = '2026-02-03';

// 로젠택배 송장 번호 생성 (Mock)
const generateLogenTrackingNumber = () => {
  // 로젠택배 송장 번호 형식: 12자리 숫자
  // 실제로는 API를 통해 발급받지만, Mock으로 생성
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${timestamp.slice(-9)}${random}`;
};

export function OrderManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Dialog states
  const [shippingDialog, setShippingDialog] = useState<{
    open: boolean;
    type: 'confirm' | 'success' | 'bulk-confirm' | 'bulk-order-print' | 'bulk-invoice-print' | 'bulk-success' | 'no-orders';
    orderId?: string;
    trackingNumber?: string;
    bulkTracking?: Array<{ orderNumber: string; trackingNumber: string }>;
  }>({
    open: false,
    type: 'confirm',
  });

  // 오늘 발송해야 하는 주문: status가 'confirmed'이면서 일반 주문이거나, 정기배송이면서 nextDeliveryDate가 오늘인 것
  const todayShipments = mockOrders.filter((order) => {
    if (order.status !== 'confirmed') return false;
    
    if (order.isSubscription) {
      return order.nextDeliveryDate === TODAY;
    }
    
    return true; // 일반 주문은 confirmed 상태면 모두 오늘 발송 대상
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            발송대기
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredOrders = todayShipments.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.hospitalName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleStartShipping = (orderId: string) => {
    const trackingNumber = generateLogenTrackingNumber();
    setShippingDialog({
      open: true,
      type: 'confirm',
      orderId,
      trackingNumber,
    });
  };

  const handleBulkShipping = () => {
    if (filteredOrders.length === 0) {
      setShippingDialog({
        open: true,
        type: 'no-orders',
      });
      return;
    }
    
    // 각 주문에 송장 번호 생성
    const ordersWithTracking = filteredOrders.map(order => ({
      ...order,
      trackingNumber: generateLogenTrackingNumber(),
      trackingCompany: '로젠택배',
      shippedAt: new Date().toISOString(),
    }));
    
    setShippingDialog({
      open: true,
      type: 'bulk-confirm',
      bulkTracking: ordersWithTracking.map(order => ({
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber!,
      })),
    });
  };

  // 내부 포맷 주문서 출력
  const handlePrintInternalOrders = (orders: Order[]) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>주문서 출력</title>
          <style>
            @media print {
              @page { 
                margin: 10mm;
                size: A4;
              }
              body { margin: 0; }
            }
            body {
              font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
              font-size: 10px;
              line-height: 1.3;
            }
            .order-page {
              page-break-after: always;
              width: 190mm;
              min-height: 277mm;
              max-height: 277mm;
              margin: 0 auto;
              padding: 8mm;
              border: 2px solid #000;
              box-sizing: border-box;
            }
            .order-page:last-child {
              page-break-after: auto;
            }
            .header {
              text-align: center;
              margin-bottom: 8mm;
              border-bottom: 2px solid #000;
              padding-bottom: 4mm;
            }
            .company-name {
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 2mm;
            }
            .document-title {
              font-size: 24px;
              font-weight: 700;
              margin: 3mm 0;
              letter-spacing: 8px;
            }
            .header-info {
              font-size: 9px;
              color: #666;
            }
            .section {
              margin-bottom: 5mm;
            }
            .section-title {
              font-size: 11px;
              font-weight: 700;
              background-color: #333;
              color: #fff;
              padding: 2mm 3mm;
              margin-bottom: 2mm;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 2mm 2mm;
              text-align: left;
              border: 1px solid #333;
              font-size: 10px;
            }
            th {
              background-color: #e8e8e8;
              font-weight: 600;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 30mm 1fr 30mm 1fr;
              gap: 0;
              border: 1px solid #333;
              margin-bottom: 3mm;
            }
            .info-grid-item {
              padding: 2mm 3mm;
              border-right: 1px solid #333;
              border-bottom: 1px solid #333;
            }
            .info-grid-item:nth-child(4n) {
              border-right: none;
            }
            .info-grid-item.label {
              background-color: #f0f0f0;
              font-weight: 600;
            }
            .total-box {
              margin-top: 3mm;
              padding: 3mm;
              background-color: #f5f5f5;
              border: 2px solid #000;
              text-align: right;
            }
            .total-amount {
              font-size: 14px;
              font-weight: 700;
            }
            .footer-note {
              margin-top: 4mm;
              padding: 3mm;
              background-color: #f9f9f9;
              border: 1px solid #ccc;
              font-size: 8px;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          ${orders.map(order => `
            <div class="order-page">
              <div class="header">
                <div class="company-name">제이시스메디칼</div>
                <div class="document-title">주 문 서</div>
                <div class="header-info">
                  서울특별시 강남구 테헤란로 123 | TEL: 070-7435-4927 | FAX: 02-1234-5678
                </div>
              </div>
              
              <div class="section">
                <div class="info-grid">
                  <div class="info-grid-item label">주문번호</div>
                  <div class="info-grid-item">${order.orderNumber}</div>
                  <div class="info-grid-item label">주문일자</div>
                  <div class="info-grid-item">${order.orderDate}</div>
                  <div class="info-grid-item label">주문유형</div>
                  <div class="info-grid-item" style="grid-column: span 3;">
                    ${order.isSubscription ? `정기배송 (${order.subscriptionCycle}) - ${order.deliveryCount}회차` : '일반주문'}
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">고객 정보</div>
                <div class="info-grid">
                  <div class="info-grid-item label">고객명</div>
                  <div class="info-grid-item">${order.customerName}</div>
                  <div class="info-grid-item label">병원명</div>
                  <div class="info-grid-item">${order.hospitalName}</div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">배송 정보</div>
                <div class="info-grid">
                  <div class="info-grid-item label">수령인</div>
                  <div class="info-grid-item">${order.shippingInfo?.recipient || '-'}</div>
                  <div class="info-grid-item label">연락처</div>
                  <div class="info-grid-item">${order.shippingInfo?.phone || '-'}</div>
                  <div class="info-grid-item label">우편번호</div>
                  <div class="info-grid-item">${order.shippingInfo?.zipCode || '-'}</div>
                  <div class="info-grid-item label">주소</div>
                  <div class="info-grid-item">${order.shippingInfo?.address || '-'} ${order.shippingInfo?.addressDetail || ''}</div>
                  ${order.shippingInfo?.memo ? `
                  <div class="info-grid-item label">배송메모</div>
                  <div class="info-grid-item" style="grid-column: span 3;">${order.shippingInfo.memo}</div>
                  ` : ''}
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">주문 상품</div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 50%">상품명</th>
                      <th style="width: 20%">카테고리</th>
                      <th style="width: 12%; text-align: center">수량</th>
                      <th style="width: 18%; text-align: right">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.orderItems?.map(item => `
                      <tr>
                        <td>${item.productName}</td>
                        <td>${item.category}</td>
                        <td style="text-align: center">${item.quantity}개</td>
                        <td style="text-align: right">${item.price.toLocaleString()}원</td>
                      </tr>
                    `).join('') || '<tr><td colspan="4">상품 정보 없음</td></tr>'}
                  </tbody>
                </table>
              </div>
              
              <div class="total-box">
                <div class="total-amount">총 주문금액: ${order.totalAmount.toLocaleString()}원</div>
              </div>
              
              ${order.paymentInfo ? `
              <div class="section">
                <div class="section-title">결제 정보</div>
                <div class="info-grid">
                  <div class="info-grid-item label">결제방법</div>
                  <div class="info-grid-item" style="grid-column: span 3;">${order.paymentInfo.method}</div>
                  ${order.paymentInfo.bankName ? `
                  <div class="info-grid-item label">은행명</div>
                  <div class="info-grid-item">${order.paymentInfo.bankName}</div>
                  <div class="info-grid-item label">계좌번호</div>
                  <div class="info-grid-item">${order.paymentInfo.accountNumber}</div>
                  <div class="info-grid-item label">입금자명</div>
                  <div class="info-grid-item">${order.paymentInfo.depositor}</div>
                  <div class="info-grid-item label">결제일시</div>
                  <div class="info-grid-item">${order.paymentInfo.paidAt || '-'}</div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
              
              <div class="footer-note">
                <strong>※ 내부용 주문서</strong><br>
                본 문서는 사내 발송 처리용 주문서입니다. 배송 완료 후 고객 서비스 향상을 위해 보관하시기 바랍니다.<br>
                문의: 070-7435-4927 | support@jsissmedical.co.kr
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // 로젠택배 포맷 송장 출력
  const handlePrintLogenInvoices = (orders: Order[]) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>로젠택배 송장 출력</title>
          <style>
            @media print {
              @page { 
                margin: 0;
                size: 100mm 150mm;
              }
              body { margin: 0; }
              .no-print { display: none; }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Pretendard', 'Malgun Gothic', sans-serif;
              font-size: 9px;
              line-height: 1.2;
            }
            .invoice-page {
              page-break-after: always;
              width: 100mm;
              height: 150mm;
              margin: 0 auto 5mm;
              border: 2px solid #000;
              position: relative;
              background: white;
              display: flex;
              flex-direction: column;
            }
            .invoice-page:last-child {
              page-break-after: auto;
            }
            
            /* 상단부 */
            .top-section {
              border-bottom: 2px solid #000;
              padding: 2mm;
            }
            .header-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 2mm;
            }
            .logo {
              font-size: 16px;
              font-weight: 900;
              color: #ff6b00;
              letter-spacing: -0.5px;
            }
            .logo-sub {
              font-size: 7px;
              color: #333;
              margin-top: 1px;
            }
            .qr-code {
              width: 18mm;
              height: 18mm;
              border: 1px solid #333;
              display: flex;
              align-items: center;
              justify-content: center;
              background: repeating-linear-gradient(
                0deg,
                #000 0px,
                #000 1px,
                #fff 1px,
                #fff 2px
              );
              font-size: 6px;
              color: #666;
            }
            .main-barcode {
              height: 15mm;
              background: repeating-linear-gradient(
                90deg,
                #000 0px,
                #000 1.5px,
                #fff 1.5px,
                #fff 3px
              );
              margin-bottom: 1mm;
            }
            .tracking-number-main {
              text-align: center;
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 1.5px;
              font-family: 'Courier New', monospace;
            }
            
            /* 중간부 - 행선지 및 코드 */
            .middle-section {
              border-bottom: 2px solid #000;
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            .destination-area {
              border-bottom: 2px solid #000;
              padding: 3mm 2mm;
              text-align: center;
              background: #f8f8f8;
            }
            .destination-main {
              font-size: 32px;
              font-weight: 900;
              letter-spacing: 3px;
              margin-bottom: 2mm;
            }
            .code-boxes {
              display: flex;
              justify-content: center;
              gap: 2mm;
            }
            .code-box {
              border: 2px solid #000;
              padding: 1mm 3mm;
              background: white;
            }
            .code-label {
              font-size: 6px;
              color: #666;
            }
            .code-value {
              font-size: 14px;
              font-weight: 700;
              margin-top: 1px;
            }
            
            /* 받는 분 / 보내는 분 */
            .address-section {
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            .address-block {
              border-bottom: 1px solid #333;
              padding: 2mm;
            }
            .address-block:last-child {
              border-bottom: none;
            }
            .address-title {
              font-size: 8px;
              font-weight: 700;
              background: #333;
              color: white;
              padding: 1mm 2mm;
              margin: -2mm -2mm 2mm -2mm;
            }
            .address-row {
              display: flex;
              margin-bottom: 1mm;
              font-size: 9px;
            }
            .address-row:last-child {
              margin-bottom: 0;
            }
            .address-label {
              width: 14mm;
              font-weight: 600;
              flex-shrink: 0;
            }
            .address-value {
              flex: 1;
            }
            .recipient-name {
              font-size: 14px;
              font-weight: 700;
            }
            .recipient-phone {
              font-size: 11px;
              font-weight: 700;
            }
            .full-address {
              font-size: 8px;
              line-height: 1.3;
            }
            
            /* 하단부 */
            .bottom-section {
              border-top: 2px solid #000;
              padding: 2mm;
            }
            .product-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
              font-size: 8px;
            }
            .product-label {
              font-weight: 600;
            }
            .checkboxes {
              display: flex;
              gap: 2mm;
              margin-top: 1mm;
              font-size: 7px;
            }
            .checkbox-item {
              display: flex;
              align-items: center;
              gap: 1mm;
            }
            .checkbox {
              width: 3mm;
              height: 3mm;
              border: 1px solid #333;
            }
            .footer-info {
              margin-top: 2mm;
              padding-top: 1mm;
              border-top: 1px solid #ccc;
              font-size: 6px;
              color: #666;
              text-align: center;
            }
            .small-barcode {
              height: 8mm;
              background: repeating-linear-gradient(
                90deg,
                #000 0px,
                #000 1px,
                #fff 1px,
                #fff 2px
              );
              margin: 1mm 0;
            }
          </style>
        </head>
        <body>
          ${orders.map(order => {
            // 주소에서 시/구 추출 (행선지 표시용)
            const address = order.shippingInfo?.address || '';
            const addressParts = address.split(' ');
            const destination = addressParts.length >= 2 
              ? `${addressParts[0].replace('특별시', '').replace('광역시', '')} ${addressParts[1].replace('구', '')}`
              : '서울 강남';
            
            // Mock 센터/구역 코드
            const centerCode = Math.floor(Math.random() * 999).toString().padStart(3, '0');
            const zoneCode = Math.floor(Math.random() * 99).toString().padStart(2, '0');
            
            return `
            <div class="invoice-page">
              <!-- 상단부: 로고, QR, 송장번호 -->
              <div class="top-section">
                <div class="header-row">
                  <div>
                    <div class="logo">LOGEN</div>
                    <div class="logo-sub">로젠택배</div>
                  </div>
                  <div class="qr-code">QR</div>
                </div>
                <div class="main-barcode"></div>
                <div class="tracking-number-main">${order.trackingNumber}</div>
              </div>
              
              <!-- 중간부: 행선지, 코드, 주소 -->
              <div class="middle-section">
                <!-- 행선지 (크게) -->
                <div class="destination-area">
                  <div class="destination-main">${destination}</div>
                  <div class="code-boxes">
                    <div class="code-box">
                      <div class="code-label">센터</div>
                      <div class="code-value">${centerCode}</div>
                    </div>
                    <div class="code-box">
                      <div class="code-label">구역</div>
                      <div class="code-value">${zoneCode}</div>
                    </div>
                  </div>
                </div>
                
                <!-- 주소 정보 -->
                <div class="address-section">
                  <!-- 받는 분 -->
                  <div class="address-block" style="flex: 1.5;">
                    <div class="address-title">받는분</div>
                    <div class="address-row">
                      <div class="address-label">성명</div>
                      <div class="address-value recipient-name">${order.shippingInfo?.recipient || '-'}</div>
                    </div>
                    <div class="address-row">
                      <div class="address-label">전화</div>
                      <div class="address-value recipient-phone">${order.shippingInfo?.phone || '-'}</div>
                    </div>
                    <div class="address-row">
                      <div class="address-label">주소</div>
                      <div class="address-value full-address">
                        [${order.shippingInfo?.zipCode}]<br>
                        ${order.shippingInfo?.address || '-'}<br>
                        ${order.shippingInfo?.addressDetail || ''}
                      </div>
                    </div>
                    ${order.shippingInfo?.memo ? `
                    <div class="address-row">
                      <div class="address-label">메모</div>
                      <div class="address-value" style="font-size: 7px; color: #d00;">${order.shippingInfo.memo}</div>
                    </div>
                    ` : ''}
                  </div>
                  
                  <!-- 보내는 분 -->
                  <div class="address-block">
                    <div class="address-title">보내는분</div>
                    <div class="address-row">
                      <div class="address-label">업체명</div>
                      <div class="address-value">제이시스메디칼</div>
                    </div>
                    <div class="address-row">
                      <div class="address-label">전화</div>
                      <div class="address-value">070-7435-4927</div>
                    </div>
                    <div class="address-row">
                      <div class="address-label">주소</div>
                      <div class="address-value full-address">
                        서울특별시 강남구 테헤란로 123
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 하단부: 물품정보, 바코드 -->
              <div class="bottom-section">
                <div class="product-row">
                  <span class="product-label">품목</span>
                  <span style="font-size: 7px;">${order.orderItems?.map(item => item.productName).join(', ').substring(0, 30) || '의료 소모품'}...</span>
                </div>
                <div class="product-row">
                  <span class="product-label">주문번호</span>
                  <span style="font-size: 7px; font-family: monospace;">${order.orderNumber}</span>
                </div>
                
                <div class="checkboxes">
                  <div class="checkbox-item">
                    <div class="checkbox"></div>
                    <span>일반</span>
                  </div>
                  <div class="checkbox-item">
                    <div class="checkbox"></div>
                    <span>착불</span>
                  </div>
                  <div class="checkbox-item">
                    <div class="checkbox"></div>
                    <span>보냉</span>
                  </div>
                  <div class="checkbox-item">
                    <div class="checkbox"></div>
                    <span>귀중품</span>
                  </div>
                  <div class="checkbox-item">
                    <div class="checkbox"></div>
                    <span>깨지기쉬움</span>
                  </div>
                </div>
                
                <div class="small-barcode"></div>
                
                <div class="footer-info">
                  로젠택배 고객센터 1588-9988 | www.ilogen.com
                </div>
              </div>
            </div>
            `;
          }).join('')}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
              주문관리
            </h2>
            <p className="text-sm text-neutral-600">
              오늘 발송해야 하는 주문 목록입니다 ({TODAY})
            </p>
          </div>
          <Button 
            onClick={() => navigate('/admin/order-history')}
            variant="outline"
            className="border-neutral-300 text-neutral-900 hover:bg-neutral-50"
          >
            <Package className="w-4 h-4 mr-2" />
            전체 주문내역 보기
          </Button>
        </div>
      </div>

      {/* Alert */}
      <div className="bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900 mb-1">
            오늘 발송 대상 주문: {todayShipments.length}건
          </p>
          <p className="text-xs text-blue-700">
            주문확정된 일반 주문과 오늘이 배송일인 정기배송 주문이 표시됩니다.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">오늘 발송 대상</div>
          <div className="text-2xl font-medium text-blue-600">{todayShipments.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">일반 주문</div>
          <div className="text-2xl font-medium text-neutral-900">
            {todayShipments.filter(o => !o.isSubscription).length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">정기배송</div>
          <div className="text-2xl font-medium text-purple-600">
            {todayShipments.filter(o => o.isSubscription).length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">총 주문금액</div>
          <div className="text-2xl font-medium text-neutral-900">
            {todayShipments.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}원
          </div>
        </div>
      </div>

      {/* Search and Bulk Actions */}
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="주문번호, 고객명, 병원명 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <Button 
            onClick={handleBulkShipping}
            className="bg-neutral-900 text-white hover:bg-neutral-800"
          >
            <Truck className="w-4 h-4 mr-2" />
            일괄 발송 처리
          </Button>
          <Button 
            onClick={() => handlePrintInternalOrders(filteredOrders)}
            className="bg-neutral-900 text-white hover:bg-neutral-800"
          >
            <Printer className="w-4 h-4 mr-2" />
            주문서 출력
          </Button>
          <Button 
            onClick={() => handlePrintLogenInvoices(filteredOrders)}
            className="bg-neutral-900 text-white hover:bg-neutral-800"
          >
            <Printer className="w-4 h-4 mr-2" />
            송장 출력
          </Button>
        </div>
      </div>

      {/* Order List */}
      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  주문번호
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  고객정보
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  주문유형
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  배송지
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  주문금액
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-600 mb-2">
                      {searchTerm ? '검색 결과가 없습니다' : '오늘 발송할 주문이 없습니다'}
                    </p>
                    <p className="text-sm text-neutral-500">
                      모든 주문을 확인하려면 '전체 주문내역 보기'를 클릭하세요
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {order.items}개 상품
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900">{order.customerName}</div>
                      <div className="text-xs text-neutral-500">{order.hospitalName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.isSubscription ? (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                          <Calendar className="w-3 h-3 mr-1" />
                          정기배송 {order.deliveryCount}회차
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-neutral-100 text-neutral-800 border-neutral-200">
                          일반주문
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900">{order.shippingInfo?.recipient}</div>
                      <div className="text-xs text-neutral-500">{order.shippingInfo?.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {order.totalAmount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigate(`/admin/orders/${order.id}`);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>상세</span>
                        </button>
                        <button
                          onClick={() => handleStartShipping(order.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs"
                        >
                          <Truck className="w-3 h-3" />
                          <span>발송</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Today's Items Summary */}
      {filteredOrders.length > 0 && (
        <div className="bg-white border border-neutral-200 p-6">
          <h4 className="text-sm font-medium text-neutral-900 mb-4">오늘 발송 상품 요약</h4>
          <div className="space-y-2">
            {filteredOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between text-sm py-2 border-b border-neutral-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-neutral-600">{order.orderNumber}</span>
                  <span className="text-neutral-900">{order.hospitalName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-neutral-600">{order.items}개 상품</span>
                  <span className="font-medium text-neutral-900">{order.totalAmount.toLocaleString()}원</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipping Dialog */}
      <AlertDialog open={shippingDialog.open} onOpenChange={(open) => setShippingDialog({ ...shippingDialog, open })}>
        <AlertDialogContent className="max-w-lg">
          {shippingDialog.type === 'confirm' && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>배송 시작 확인</AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  배송을 시작하시겠습니까?
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="bg-amber-50 border-2 border-amber-500 rounded-lg p-4 my-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-amber-900 mb-2">로젠택배</p>
                  <p className="text-2xl font-bold text-amber-600 tracking-widest mb-2">
                    {shippingDialog.trackingNumber}
                  </p>
                  <p className="text-xs text-amber-700">
                    송장번호가 자동으로 발급됩니다
                  </p>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white border-neutral-300">취소</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => {
                    setShippingDialog({
                      ...shippingDialog,
                      open: true,
                      type: 'success',
                    });
                  }}
                >
                  발송 시작
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}

          {shippingDialog.type === 'success' && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>배송 시작 완료</AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  배송이 시작되었습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="bg-amber-50 border-2 border-amber-500 rounded-lg p-4 my-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-amber-900 mb-2">로젠택배 송장번호</p>
                  <p className="text-2xl font-bold text-amber-600 tracking-widest mb-3">
                    {shippingDialog.trackingNumber}
                  </p>
                  <a
                    href={`https://www.ilogen.com/web/personal/trace/${shippingDialog.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    송장 조회하기
                  </a>
                </div>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded p-3 text-xs text-neutral-600">
                <p className="mb-1">• 배송 관련 문의: 로젠택배 고객센터 1588-9988</p>
                <p>• 제이시스메디칼 고객지원센터: 070-7435-4927</p>
              </div>

              <AlertDialogFooter>
                <AlertDialogAction
                  className="bg-neutral-900 text-white hover:bg-neutral-800"
                  onClick={() => setShippingDialog({ open: false, type: 'confirm' })}
                >
                  확인
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}

          {shippingDialog.type === 'bulk-confirm' && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>일괄 발송 확인</AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  총 {shippingDialog.bulkTracking?.length}건의 주문을 일괄 발송 처리하시겠습니까?
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="my-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
                  <span className="text-sm font-medium text-blue-900">발송 대상</span>
                  <span className="text-lg font-bold text-blue-600">{shippingDialog.bulkTracking?.length}건</span>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <p className="text-sm text-amber-900 text-center">
                    <Package className="w-4 h-4 inline mr-1" />
                    로젠택배 송장번호가 자동으로 발급됩니다
                  </p>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white border-neutral-300">취소</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => {
                    setShippingDialog({
                      ...shippingDialog,
                      open: true,
                      type: 'bulk-order-print',
                    });
                  }}
                >
                  일괄 발송
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}

          {shippingDialog.type === 'bulk-order-print' && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>주문서 출력 확인</AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  주문서를 출력하시겠습니까?
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="my-4 space-y-3">
                <div className="bg-neutral-50 border border-neutral-200 rounded p-4 text-center">
                  <Printer className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-neutral-900 mb-1">내부 포맷 주문서</p>
                  <p className="text-xs text-neutral-600">
                    총 {shippingDialog.bulkTracking?.length}건의 주문서가 출력됩니다
                  </p>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel 
                  className="bg-white border-neutral-300"
                  onClick={() => {
                    // 출력 건너뛰기 - 다음 단계로
                    setShippingDialog({
                      ...shippingDialog,
                      open: true,
                      type: 'bulk-invoice-print',
                    });
                  }}
                >
                  건너뛰기
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-neutral-900 text-white hover:bg-neutral-800"
                  onClick={() => {
                    // 주문서 출력
                    handlePrintInternalOrders(filteredOrders);
                    // 다음 단계로
                    setShippingDialog({
                      ...shippingDialog,
                      open: true,
                      type: 'bulk-invoice-print',
                    });
                  }}
                >
                  출력
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}

          {shippingDialog.type === 'bulk-invoice-print' && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>송장 출력 확인</AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  로젠택배 송장을 출력하시겠습니까?
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="my-4 space-y-3">
                <div className="bg-amber-50 border-2 border-amber-500 rounded p-4 text-center">
                  <div className="text-lg font-bold text-amber-600 mb-2">LOGEN 로젠택배</div>
                  <Printer className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-amber-900 mb-1">택배 송장</p>
                  <p className="text-xs text-amber-700">
                    총 {shippingDialog.bulkTracking?.length}장의 송장이 출력됩니다
                  </p>
                </div>
                
                <div className="bg-neutral-50 border border-neutral-200 rounded p-3">
                  <p className="text-xs text-neutral-600 text-center">
                    송장에는 발급된 송장번호와 바코드가 포함됩니다
                  </p>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel 
                  className="bg-white border-neutral-300"
                  onClick={() => {
                    // 출력 건너뛰기 - 완료 단계로
                    setShippingDialog({
                      ...shippingDialog,
                      open: true,
                      type: 'bulk-success',
                    });
                  }}
                >
                  건너뛰기
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-amber-600 text-white hover:bg-amber-700"
                  onClick={() => {
                    // 송장 출력
                    const ordersWithTracking = filteredOrders.map((order, index) => ({
                      ...order,
                      trackingNumber: shippingDialog.bulkTracking?.[index]?.trackingNumber || generateLogenTrackingNumber(),
                    }));
                    handlePrintLogenInvoices(ordersWithTracking);
                    // 완료 단계로
                    setShippingDialog({
                      ...shippingDialog,
                      open: true,
                      type: 'bulk-success',
                    });
                  }}
                >
                  출력
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}

          {shippingDialog.type === 'bulk-success' && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>일괄 발송 완료</AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  {shippingDialog.bulkTracking?.length}건의 주문 발송이 완료되었습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="my-4 max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {shippingDialog.bulkTracking?.map((tracking, index) => (
                    <div key={index} className="p-3 bg-neutral-50 border border-neutral-200 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-neutral-700">{tracking.orderNumber}</span>
                        <span className="text-xs text-neutral-500">로젠택배</span>
                      </div>
                      <div className="text-sm font-mono font-bold text-amber-600 tracking-wider">
                        {tracking.trackingNumber}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded p-3 text-xs text-neutral-600">
                <p className="mb-1">• 배송 조회: https://www.ilogen.com</p>
                <p className="mb-1">• 배송 관련 문의: 로젠택배 고객센터 1588-9988</p>
                <p>• 제이시스메디칼 고객지원센터: 070-7435-4927</p>
              </div>

              <AlertDialogFooter>
                <AlertDialogAction
                  className="bg-neutral-900 text-white hover:bg-neutral-800"
                  onClick={() => setShippingDialog({ open: false, type: 'confirm' })}
                >
                  확인
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}

          {shippingDialog.type === 'no-orders' && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>발송 대상 없음</AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  발송할 주문이 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="my-4 p-6 text-center">
                <Package className="w-16 h-16 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-600">
                  현재 발송 대기 중인 주문이 없습니다.
                </p>
              </div>

              <AlertDialogFooter>
                <AlertDialogAction
                  className="bg-neutral-900 text-white hover:bg-neutral-800"
                  onClick={() => setShippingDialog({ open: false, type: 'confirm' })}
                >
                  확인
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}