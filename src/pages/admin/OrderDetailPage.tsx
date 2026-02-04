import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Package, User, Truck, Mail, Clock, CheckCircle, XCircle, RefreshCw, Calendar, Play, Pause, Edit2 } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

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

interface DeliveryHistory {
  id: string;
  deliveryNumber: number;
  deliveryDate: string;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  amount: number;
  trackingNumber?: string;
}

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
  deliveryHistory?: DeliveryHistory[];
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
    id: '2',
    orderNumber: 'ORD-2026-0002',
    customerName: '이수진 원장',
    hospitalName: '강남클리닉',
    orderDate: '2026-02-01',
    totalAmount: 850000,
    status: 'shipping',
    items: 2,
    orderItems: [
      {
        id: '2-1',
        productName: 'LinearZ 앰플 세트',
        category: 'LinearZ',
        quantity: 1,
        price: 400000,
      },
      {
        id: '2-2',
        productName: 'Density HIGH 스킨부스터',
        category: 'Density',
        quantity: 1,
        price: 450000,
      },
    ],
    shippingInfo: {
      recipient: '이수진 원장',
      phone: '010-8765-4321',
      address: '서울특별시 강남구 역삼동 654-321',
      addressDetail: '강남클리닉 2층',
      zipCode: '06543',
      memo: '배송 전 연락 부탁드립니다',
    },
    paymentInfo: {
      method: '무통장 입금',
      bankName: '기업은행',
      accountNumber: '220-456-789123',
      depositor: '이수진',
      paidAt: '2026-02-01 11:15',
    },
  },
  {
    id: '3',
    orderNumber: 'ORD-2026-0003',
    customerName: '박지훈 원장',
    hospitalName: '부산성형외과',
    orderDate: '2026-01-31',
    totalAmount: 3200000,
    status: 'delivered',
    items: 5,
    orderItems: [
      {
        id: '3-1',
        productName: 'POTENZA 니들 팁 16핀',
        category: 'POTENZA',
        quantity: 2,
        price: 1000000,
      },
      {
        id: '3-2',
        productName: 'ULTRAcel II 카트리지 3.0mm',
        category: 'ULTRAcel II',
        quantity: 1,
        price: 600000,
      },
      {
        id: '3-3',
        productName: 'LinearZ 앰플 세트',
        category: 'LinearZ',
        quantity: 2,
        price: 800000,
      },
    ],
    shippingInfo: {
      recipient: '박지훈 원장',
      phone: '010-5555-5555',
      address: '부산광역시 해운대구 센텀중앙로 123',
      addressDetail: '부산성형외과 3층',
      zipCode: '48059',
      memo: '오전 배송 희망',
    },
    paymentInfo: {
      method: '무통장 입금',
      bankName: '우리은행',
      accountNumber: '1002-345-678901',
      depositor: '박지훈',
      paidAt: '2026-01-31 09:20',
    },
  },
  {
    id: '4',
    orderNumber: 'ORD-2026-0004',
    customerName: '최영희 원장',
    hospitalName: '인천피부과',
    orderDate: '2026-01-30',
    totalAmount: 420000,
    status: 'pending',
    items: 1,
    orderItems: [
      {
        id: '4-1',
        productName: 'Density HIGH 스킨부스터',
        category: 'Density',
        quantity: 1,
        price: 420000,
      },
    ],
    shippingInfo: {
      recipient: '최영희 원장',
      phone: '010-9999-9999',
      address: '인천광역시 남동구 예술로 456',
      addressDetail: '인천피부과 1층',
      zipCode: '21562',
      memo: '문 앞에 놓아주세요',
    },
    paymentInfo: {
      method: '무통장 입금',
      bankName: '국민은행',
      accountNumber: '123-01-0123-456',
      depositor: '최영희',
    },
  },
  // 정기배송 주문
  {
    id: 'SUB-1',
    orderNumber: 'SUB-2026-0001',
    customerName: '김민종 원장',
    hospitalName: '서울피부과의원',
    orderDate: '2026-01-15',
    totalAmount: 500000,
    status: 'delivered',
    items: 2,
    isSubscription: true,
    subscriptionCycle: '매월',
    nextDeliveryDate: '2026-03-15',
    subscriptionStatus: 'active',
    subscriptionStartDate: '2026-01-15',
    deliveryCount: 2,
    orderItems: [
      {
        id: 'sub-1-1',
        productName: 'POTENZA 니들 팁 16핀',
        category: 'POTENZA',
        quantity: 2,
        price: 500000,
      },
    ],
    shippingInfo: {
      recipient: '김민종 원장',
      phone: '010-1234-5678',
      address: '서울특별시 강남구 논현동 123-456',
      addressDetail: '서울피부과의원 1층',
      zipCode: '06234',
    },
    paymentInfo: {
      method: '자동결제 (신용카드)',
      paidAt: '매월 15일 자동결제',
    },
    deliveryHistory: [
      {
        id: 'h1',
        deliveryNumber: 2,
        deliveryDate: '2026-02-15',
        status: 'delivered',
        amount: 500000,
        trackingNumber: '1234567890',
      },
      {
        id: 'h2',
        deliveryNumber: 1,
        deliveryDate: '2026-01-15',
        status: 'delivered',
        amount: 500000,
        trackingNumber: '0987654321',
      },
    ],
  },
  {
    id: 'SUB-2',
    orderNumber: 'SUB-2026-0002',
    customerName: '이수진 원장',
    hospitalName: '강남클리닉',
    orderDate: '2026-01-20',
    totalAmount: 450000,
    status: 'confirmed',
    items: 1,
    isSubscription: true,
    subscriptionCycle: '2주마다',
    nextDeliveryDate: '2026-02-17',
    subscriptionStatus: 'active',
    subscriptionStartDate: '2026-01-20',
    deliveryCount: 3,
    orderItems: [
      {
        id: 'sub-2-1',
        productName: 'Density HIGH 스킨부스터',
        category: 'Density',
        quantity: 1,
        price: 450000,
      },
    ],
    shippingInfo: {
      recipient: '이수진 원장',
      phone: '010-8765-4321',
      address: '서울특별시 강남구 역삼동 654-321',
      addressDetail: '강남클리닉 2층',
      zipCode: '06543',
    },
    paymentInfo: {
      method: '자동결제 (신용카드)',
      paidAt: '2주마다 자동결제',
    },
    deliveryHistory: [
      {
        id: 'h3',
        deliveryNumber: 3,
        deliveryDate: '2026-02-03',
        status: 'delivered',
        amount: 450000,
        trackingNumber: '1122334455',
      },
      {
        id: 'h4',
        deliveryNumber: 2,
        deliveryDate: '2026-01-27',
        status: 'delivered',
        amount: 450000,
        trackingNumber: '5544332211',
      },
      {
        id: 'h5',
        deliveryNumber: 1,
        deliveryDate: '2026-01-20',
        status: 'delivered',
        amount: 450000,
        trackingNumber: '9988776655',
      },
    ],
  },
  {
    id: 'SUB-3',
    orderNumber: 'SUB-2026-0003',
    customerName: '박지훈 원장',
    hospitalName: '부산성형외과',
    orderDate: '2025-12-01',
    totalAmount: 800000,
    status: 'delivered',
    items: 2,
    isSubscription: true,
    subscriptionCycle: '3개월마다',
    nextDeliveryDate: '2026-03-01',
    subscriptionStatus: 'paused',
    subscriptionStartDate: '2025-12-01',
    deliveryCount: 1,
    orderItems: [
      {
        id: 'sub-3-1',
        productName: 'LinearZ 앰플 세트',
        category: 'LinearZ',
        quantity: 2,
        price: 800000,
      },
    ],
    shippingInfo: {
      recipient: '박지훈 원장',
      phone: '010-5555-5555',
      address: '부산광역시 해운대구 센텀중앙로 123',
      addressDetail: '부산성형외과 3층',
      zipCode: '48059',
    },
    paymentInfo: {
      method: '자동결제 (신용카드)',
      paidAt: '3개월마다 자동결제',
    },
    deliveryHistory: [
      {
        id: 'h6',
        deliveryNumber: 1,
        deliveryDate: '2025-12-01',
        status: 'delivered',
        amount: 800000,
        trackingNumber: '6677889900',
      },
    ],
  },
];

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = mockOrders.find((o) => o.id === id);
  const [subscriptionStatus, setSubscriptionStatus] = useState(order?.subscriptionStatus || 'active');

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl tracking-tight text-neutral-900">
            주문을 찾을 수 없습니다
          </h2>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            입금대기
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            주문확정
          </Badge>
        );
      case 'shipping':
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            <Package className="w-3 h-3 mr-1" />
            배송중
          </Badge>
        );
      case 'delivered':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            배송완료
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            취소
          </Badge>
        );
    }
  };

  const getSubscriptionStatusBadge = (status: 'active' | 'paused' | 'cancelled') => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <Play className="w-3 h-3 mr-1" />
            진행중
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
            <Pause className="w-3 h-3 mr-1" />
            일시정지
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            취소됨
          </Badge>
        );
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '입금대기';
      case 'confirmed': return '주문확정';
      case 'shipping': return '배송중';
      case 'delivered': return '배송완료';
      case 'cancelled': return '취소';
    }
  };

  const handlePauseSubscription = () => {
    if (confirm('정기배송을 일시정지하시겠습니까?')) {
      setSubscriptionStatus('paused');
      alert('정기배송이 일시정지되었습니다.');
    }
  };

  const handleResumeSubscription = () => {
    if (confirm('정기배송을 재개하시겠습니까?')) {
      setSubscriptionStatus('active');
      alert('정기배송이 재개되었습니다.');
    }
  };

  const handleCancelSubscription = () => {
    if (confirm('정기배송을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setSubscriptionStatus('cancelled');
      alert('정기배송이 취소되었습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl tracking-tight text-neutral-900">
                {order.isSubscription ? '정기배송 주문 상세정보' : '주문 상세정보'}
              </h2>
              {order.isSubscription && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  정기배송
                </Badge>
              )}
              {getStatusBadge(order.status)}
            </div>
            <p className="text-sm text-neutral-600">
              주문번호: {order.orderNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!order.isSubscription && order.status === 'pending' && (
            <Button variant="default">
              입금 확인
            </Button>
          )}
          {!order.isSubscription && order.status === 'confirmed' && (
            <Button variant="default">
              배송 시작
            </Button>
          )}
        </div>
      </div>

      {/* Subscription Info - 정기배송인 경우만 표시 */}
      {order.isSubscription && (
        <div className="bg-purple-50 border border-purple-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-700" />
              <h4 className="text-lg font-medium text-purple-900">정기배송 정보</h4>
            </div>
            {getSubscriptionStatusBadge(subscriptionStatus as 'active' | 'paused' | 'cancelled')}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <dt className="text-xs font-medium text-purple-700 mb-1">배송 주기</dt>
              <dd className="text-sm font-medium text-purple-900">{order.subscriptionCycle}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-purple-700 mb-1">정기배송 시작일</dt>
              <dd className="text-sm text-purple-900">{order.subscriptionStartDate}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-purple-700 mb-1">다음 배송 예정일</dt>
              <dd className="text-sm text-purple-900 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {order.nextDeliveryDate}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-purple-700 mb-1">총 배송 횟수</dt>
              <dd className="text-sm font-medium text-purple-900">{order.deliveryCount}회</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-purple-700 mb-1">회당 결제 금액</dt>
              <dd className="text-sm font-medium text-purple-900">{order.totalAmount.toLocaleString()}원</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-purple-700 mb-1">총 결제 금액</dt>
              <dd className="text-sm font-bold text-purple-900">
                {(order.totalAmount * (order.deliveryCount || 0)).toLocaleString()}원
              </dd>
            </div>
          </div>

          {/* 정기배송 관리 버튼 */}
          <div className="flex items-center gap-3 pt-4 border-t border-purple-200">
            {subscriptionStatus === 'active' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePauseSubscription}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  <Pause className="w-4 h-4 mr-1" />
                  일시정지
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  배송주기 변경
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  배송지 변경
                </Button>
              </>
            )}
            {subscriptionStatus === 'paused' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleResumeSubscription}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Play className="w-4 h-4 mr-1" />
                재개
              </Button>
            )}
            {subscriptionStatus !== 'cancelled' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancelSubscription}
                className="border-red-300 text-red-700 hover:bg-red-100 ml-auto"
              >
                <XCircle className="w-4 h-4 mr-1" />
                정기배송 취소
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Order Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 p-6">
          <h4 className="text-sm font-medium text-neutral-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" />
            주문 정보
          </h4>
          <dl className="space-y-3">
            <div className="flex justify-between text-sm">
              <dt className="text-neutral-600">주문번호</dt>
              <dd className="font-medium text-neutral-900">{order.orderNumber}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-neutral-600">주문일시</dt>
              <dd className="text-neutral-900">{order.orderDate}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-neutral-600">주문상태</dt>
              <dd className="text-neutral-900">{getStatusText(order.status)}</dd>
            </div>
            {order.isSubscription && (
              <div className="flex justify-between text-sm">
                <dt className="text-neutral-600">주문 유형</dt>
                <dd className="font-medium text-purple-700">정기배송</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white border border-neutral-200 p-6">
          <h4 className="text-sm font-medium text-neutral-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            고객 정보
          </h4>
          <dl className="space-y-3">
            <div className="flex justify-between text-sm">
              <dt className="text-neutral-600">고객명</dt>
              <dd className="font-medium text-neutral-900">{order.customerName}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-neutral-600">병원명</dt>
              <dd className="text-neutral-900">{order.hospitalName}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h4 className="text-sm font-medium text-neutral-900">주문 상품</h4>
        </div>
        <div className="p-6">
          <table className="w-full">
            <thead className="border-b border-neutral-200">
              <tr>
                <th className="pb-3 text-left text-xs font-medium text-neutral-700">상품명</th>
                <th className="pb-3 text-left text-xs font-medium text-neutral-700">카테고리</th>
                <th className="pb-3 text-right text-xs font-medium text-neutral-700">수량</th>
                <th className="pb-3 text-right text-xs font-medium text-neutral-700">단가</th>
                <th className="pb-3 text-right text-xs font-medium text-neutral-700">합계</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {order.orderItems?.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 text-sm text-neutral-900">{item.productName}</td>
                  <td className="py-4">
                    <span className="inline-flex px-2 py-1 bg-neutral-100 text-neutral-800 text-xs">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-neutral-900 text-right">{item.quantity}개</td>
                  <td className="py-4 text-sm text-neutral-900 text-right">{item.price.toLocaleString()}원</td>
                  <td className="py-4 text-sm font-medium text-neutral-900 text-right">
                    {(item.quantity * item.price).toLocaleString()}원
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-neutral-900">
              <tr>
                <td colSpan={4} className="pt-4 text-right text-sm font-medium text-neutral-900">
                  {order.isSubscription ? '회당 주문금액' : '총 주문금액'}
                </td>
                <td className="pt-4 text-right text-lg font-bold text-neutral-900">
                  {order.totalAmount.toLocaleString()}원
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Delivery History - 정기배송인 경우만 표시 */}
      {order.isSubscription && order.deliveryHistory && order.deliveryHistory.length > 0 && (
        <div className="bg-white border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h4 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
              <Package className="w-4 h-4" />
              배송 내역
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700">회차</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700">배송일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700">배송상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700">송장번호</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-700">금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {order.deliveryHistory.map((history) => (
                  <tr key={history.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                      {history.deliveryNumber}회차
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {history.deliveryDate}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(history.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {history.trackingNumber || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900 text-right">
                      {history.amount.toLocaleString()}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shipping Info */}
      {order.shippingInfo && (
        <div className="bg-white border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h4 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              배송 정보
            </h4>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-neutral-600 mb-1">받는 사람</dt>
                <dd className="text-sm text-neutral-900">{order.shippingInfo.recipient}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-neutral-600 mb-1">연락처</dt>
                <dd className="text-sm text-neutral-900">{order.shippingInfo.phone}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs font-medium text-neutral-600 mb-1">배송지</dt>
                <dd className="text-sm text-neutral-900">
                  ({order.shippingInfo.zipCode}) {order.shippingInfo.address}<br />
                  {order.shippingInfo.addressDetail}
                </dd>
              </div>
              {order.shippingInfo.memo && (
                <div className="md:col-span-2">
                  <dt className="text-xs font-medium text-neutral-600 mb-1">배송 메모</dt>
                  <dd className="text-sm text-neutral-900">{order.shippingInfo.memo}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* Payment Info */}
      {order.paymentInfo && (
        <div className="bg-white border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h4 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              결제 정보
            </h4>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-neutral-600 mb-1">결제 방법</dt>
                <dd className="text-sm text-neutral-900">{order.paymentInfo.method}</dd>
              </div>
              {order.paymentInfo.bankName && (
                <div>
                  <dt className="text-xs font-medium text-neutral-600 mb-1">입금 은행</dt>
                  <dd className="text-sm text-neutral-900">{order.paymentInfo.bankName}</dd>
                </div>
              )}
              {order.paymentInfo.accountNumber && (
                <div>
                  <dt className="text-xs font-medium text-neutral-600 mb-1">계좌번호</dt>
                  <dd className="text-sm text-neutral-900">{order.paymentInfo.accountNumber}</dd>
                </div>
              )}
              {order.paymentInfo.depositor && (
                <div>
                  <dt className="text-xs font-medium text-neutral-600 mb-1">입금자명</dt>
                  <dd className="text-sm text-neutral-900">{order.paymentInfo.depositor}</dd>
                </div>
              )}
              {order.paymentInfo.paidAt && (
                <div>
                  <dt className="text-xs font-medium text-neutral-600 mb-1">
                    {order.isSubscription ? '자동결제 일정' : '입금 완료일시'}
                  </dt>
                  <dd className="text-sm text-neutral-900">{order.paymentInfo.paidAt}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
