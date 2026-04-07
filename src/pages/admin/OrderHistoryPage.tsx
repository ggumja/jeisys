import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Filter, Eye, Package, Clock, CheckCircle, XCircle, RefreshCw, Pause, Play, Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  hospitalName: string;
  orderDate: string;
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  items: number;
  itemsSummary?: string;
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

export function OrderHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  const itemsPerPage = 10;

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await adminService.getOrders();
      setOrders(data as any);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('주문 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const regularOrders = orders.filter(order => !order.isSubscription);
  const subscriptionOrders = orders.filter(order => order.isSubscription);

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
      case 'shipped':
        setActiveTab('all');
        setStatusFilter('shipped');
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
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        start = oneWeekAgo.toISOString().split('T')[0];
        break;
      case '1month':
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        start = oneMonthAgo.toISOString().split('T')[0];
        break;
      case '3months':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        start = threeMonthsAgo.toISOString().split('T')[0];
        break;
      case '6months':
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        start = sixMonthsAgo.toISOString().split('T')[0];
        break;
      case 'all':
        start = '';
        break;
    }

    setStartDate(start);
    setEndDate(range === 'all' ? '' : end);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            입금대기
          </Badge>
        );
      case 'paid':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            결제완료
          </Badge>
        );
      case 'shipped':
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
      
      const statusArray = statusFilter.split(',');
      const matchesStatus = statusFilter === 'all' || statusArray.includes(order.status);
      
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
                {loading ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                                <span>주문 내역을 불러오는 중...</span>
                            </div>
                        </td>
                    </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                      조회된 주문이 없습니다
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr 
                        key={order.id} 
                        className="hover:bg-neutral-50 cursor-pointer group"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-neutral-900 group-hover:text-blue-600 transition-colors uppercase tracking-wider">
                          {order.orderNumber}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                          {order.itemsSummary || `${order.items}개 상품`}
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
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          상세보기
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {orders.length > 0 && !loading && (
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
          <div className="text-2xl font-medium text-neutral-900">{orders.length}</div>
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
            {orders.filter((o) => o.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4 cursor-pointer" onClick={() => handleDashboardClick('shipped')}>
          <div className="text-xs text-neutral-600 mb-1">배송중</div>
          <div className="text-2xl font-medium text-purple-600">
            {orders.filter((o) => o.status === 'shipped').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4 cursor-pointer" onClick={() => handleDashboardClick('delivered')}>
          <div className="text-xs text-neutral-600 mb-1">배송완료</div>
          <div className="text-2xl font-medium text-green-600">
            {orders.filter((o) => o.status === 'delivered').length}
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
              placeholder="주문번호, 고객명, 병원명으로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>
              초기화
            </Button>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {['today', '1week', '1month', '3months', '6months', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setQuickDateRange(range)}
              className="text-xs px-3 py-1 border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              {range === 'today' ? '오늘' : 
               range === '1week' ? '1주일' : 
               range === '1month' ? '1개월' : 
               range === '3months' ? '3개월' : 
               range === '6months' ? '6개월' : '전체'}
            </button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="bg-neutral-100 p-1">
            <TabsTrigger value="all" onClick={() => { setStatusFilter('all'); setActiveTab('all'); }}>전체</TabsTrigger>
            <TabsTrigger value="regular" onClick={() => { setStatusFilter('all'); setActiveTab('regular'); }}>일반주문</TabsTrigger>
            <TabsTrigger value="subscription" onClick={() => { setStatusFilter('all'); setActiveTab('subscription'); }}>정기배송</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">상태 필터:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-neutral-200 p-1 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            >
              <option value="all">전체 상태</option>
              <option value="pending">입금대기</option>
              <option value="paid">결제완료</option>
              <option value="shipped">배송중</option>
              <option value="delivered">배송완료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <TabsContent value="all">
            {renderOrderTable(getFilteredOrders(orders))}
          </TabsContent>
          <TabsContent value="regular">
            {renderOrderTable(getFilteredOrders(regularOrders))}
          </TabsContent>
          <TabsContent value="subscription">
            {renderOrderTable(getFilteredOrders(subscriptionOrders), true)}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}