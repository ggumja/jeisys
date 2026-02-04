import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Filter, Eye, Package, Clock, CheckCircle, XCircle, RefreshCw, Pause, Play, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

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
  // 정기배송 주문들
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
      method: '자동결제',
      paidAt: '2026-02-15 00:00',
    },
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
      method: '자동결제',
      paidAt: '2026-02-03 00:00',
    },
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
      method: '자동결제',
      paidAt: '2025-12-01 00:00',
    },
  },
  {
    id: 'SUB-4',
    orderNumber: 'SUB-2026-0004',
    customerName: '정우성 원장',
    hospitalName: '강남더마클리닉',
    orderDate: '2026-01-10',
    totalAmount: 600000,
    status: 'shipping',
    items: 1,
    isSubscription: true,
    subscriptionCycle: '매월',
    nextDeliveryDate: '2026-03-10',
    subscriptionStatus: 'active',
    subscriptionStartDate: '2026-01-10',
    deliveryCount: 2,
    orderItems: [
      {
        id: 'sub-4-1',
        productName: 'ULTRAcel II 카트리지 3.0mm',
        category: 'ULTRAcel II',
        quantity: 2,
        price: 600000,
      },
    ],
    shippingInfo: {
      recipient: '정우성 원장',
      phone: '010-5678-9012',
      address: '서울특별시 강남구 도산대로 654',
      addressDetail: '7층',
      zipCode: '06028',
    },
    paymentInfo: {
      method: '자동결제',
      paidAt: '2026-02-10 00:00',
    },
  },
];

export function OrderHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  // 대시보드 박스 클릭 핸들러
  const handleDashboardClick = (filterType: string) => {
    setCurrentPage(1); // 페이지 초기화
    
    switch (filterType) {
      case 'all':
        setActiveTab('all');
        setStatusFilter('all');
        break;
      case 'regular':
        setActiveTab('regular');
        setStatusFilter('all');
        break;
      case 'subscription':
        setActiveTab('subscription');
        setStatusFilter('all');
        break;
      case 'pending':
        setActiveTab('all');
        setStatusFilter('pending');
        break;
      case 'shipping':
        setActiveTab('all');
        setStatusFilter('shipping');
        break;
      case 'delivered':
        setActiveTab('all');
        setStatusFilter('delivered');
        break;
    }
  };

  // 빠른 기간 선택 함수
  const setQuickDateRange = (range: string) => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start = '';

    switch (range) {
      case 'today':
        start = end;
        break;
      case '1week':
        start = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        break;
      case '1month':
        start = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
        break;
      case '3months':
        start = new Date(today.setMonth(today.getMonth() - 3)).toISOString().split('T')[0];
        break;
      case '6months':
        start = new Date(today.setMonth(today.getMonth() - 6)).toISOString().split('T')[0];
        break;
      case 'all':
        start = '';
        break;
    }

    setStartDate(start);
    setEndDate(range === 'all' ? '' : end);
  };

  const regularOrders = mockOrders.filter(order => !order.isSubscription);
  const subscriptionOrders = mockOrders.filter(order => order.isSubscription);

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

  const getFilteredOrders = (orders: Order[]) => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.hospitalName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 상태 필터 - delivered,confirmed 형식 지원
      const statusArray = statusFilter.split(',');
      const matchesStatus = statusFilter === 'all' || statusArray.includes(order.status);
      
      // 날짜 필터
      const orderDate = new Date(order.orderDate);
      const matchesDateRange =
        (!startDate && !endDate) ||
        (!startDate && orderDate <= new Date(endDate)) ||
        (!endDate && orderDate >= new Date(startDate)) ||
        (orderDate >= new Date(startDate) && orderDate <= new Date(endDate));
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  };

  const renderOrderTable = (orders: Order[], isSubscription: boolean = false) => {
    // 페이징 처리
    const totalPages = Math.ceil(orders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    return (
      <div className="space-y-4">
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
                  {isSubscription ? (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                        배송주기
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                        다음배송일
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                        배송횟수
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                        정기배송상태
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                        주문일
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                        주문금액
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                        상태
                      </th>
                    </>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                      조회된 주문이 없습니다
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
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
                      {isSubscription ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm text-neutral-900">
                              <RefreshCw className="w-4 h-4 text-neutral-500" />
                              {order.subscriptionCycle}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {order.nextDeliveryDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                            {order.deliveryCount}회
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.subscriptionStatus && getSubscriptionStatusBadge(order.subscriptionStatus)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {order.orderDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                            {order.totalAmount.toLocaleString()}원
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(order.status)}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            navigate(`/admin/orders/${order.id}`);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>상세보기</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {orders.length > 0 && (
          <div className="bg-white border border-neutral-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-600">
                전체 <span className="font-medium text-neutral-900">{orders.length}</span>건 중{' '}
                <span className="font-medium text-neutral-900">{startIndex + 1}</span>-
                <span className="font-medium text-neutral-900">{Math.min(endIndex, orders.length)}</span>건
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // 현재 페이지 주변 페이지만 표시
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm border transition-colors ${
                            currentPage === page
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 3 ||
                      page === currentPage + 3
                    ) {
                      return (
                        <span key={page} className="px-2 text-neutral-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
          주문내역
        </h2>
        <p className="text-sm text-neutral-600">
          전체 주문 및 정기배송 내역을 조회하고 관리합니다
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white border border-neutral-200 p-4 cursor-pointer" onClick={() => handleDashboardClick('all')}>
          <div className="text-xs text-neutral-600 mb-1">전체 주문</div>
          <div className="text-2xl font-medium text-neutral-900">{mockOrders.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4 cursor-pointer" onClick={() => handleDashboardClick('regular')}>
          <div className="text-xs text-neutral-600 mb-1">일반 주문</div>
          <div className="text-2xl font-medium text-blue-600">
            {regularOrders.length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4 cursor-pointer" onClick={() => handleDashboardClick('subscription')}>
          <div className="text-xs text-neutral-600 mb-1">정기배송</div>
          <div className="text-2xl font-medium text-purple-600 flex items-center gap-2">
            {subscriptionOrders.length}
            <RefreshCw className="w-4 h-4" />
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4 cursor-pointer" onClick={() => handleDashboardClick('pending')}>
          <div className="text-xs text-neutral-600 mb-1">입금대기</div>
          <div className="text-2xl font-medium text-yellow-600">
            {mockOrders.filter((o) => o.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4 cursor-pointer" onClick={() => handleDashboardClick('shipping')}>
          <div className="text-xs text-neutral-600 mb-1">배송중</div>
          <div className="text-2xl font-medium text-purple-600">
            {mockOrders.filter((o) => o.status === 'shipping').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4 cursor-pointer" onClick={() => handleDashboardClick('delivered')}>
          <div className="text-xs text-neutral-600 mb-1">배송완료</div>
          <div className="text-2xl font-medium text-green-600">
            {mockOrders.filter((o) => o.status === 'delivered').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-neutral-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="주문번호, 고객명, 병원명 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="all">전체 상태</option>
              <option value="pending">입금대기</option>
              <option value="confirmed">주문확정</option>
              <option value="shipping">배송중</option>
              <option value="delivered">배송완료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span className="text-sm text-neutral-600">기간 선택</span>
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <span className="text-sm text-neutral-600">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div className="mt-2">
              <button
                onClick={() => setQuickDateRange('today')}
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm"
              >
                오늘
              </button>
              <button
                onClick={() => setQuickDateRange('1week')}
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm"
              >
                1주일
              </button>
              <button
                onClick={() => setQuickDateRange('1month')}
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm"
              >
                1개월
              </button>
              <button
                onClick={() => setQuickDateRange('3months')}
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm"
              >
                3개월
              </button>
              <button
                onClick={() => setQuickDateRange('6months')}
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm"
              >
                6개월
              </button>
              <button
                onClick={() => setQuickDateRange('all')}
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm"
              >
                전체
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-neutral-200">
          <TabsTrigger value="all" className="data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
            전체 주문
          </TabsTrigger>
          <TabsTrigger value="regular" className="data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
            일반 주문
          </TabsTrigger>
          <TabsTrigger value="subscription" className="data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
            <RefreshCw className="w-4 h-4 mr-1" />
            정기배송
            <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
              {subscriptionOrders.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {renderOrderTable(getFilteredOrders(mockOrders))}
        </TabsContent>

        <TabsContent value="regular" className="mt-0">
          {renderOrderTable(getFilteredOrders(regularOrders))}
        </TabsContent>

        <TabsContent value="subscription" className="mt-0">
          {renderOrderTable(getFilteredOrders(subscriptionOrders), true)}
        </TabsContent>
      </Tabs>
    </div>
  );
}