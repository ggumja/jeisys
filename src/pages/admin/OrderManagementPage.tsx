import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Package, Truck, Printer, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';
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
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'partially_shipped' | 'cancel_requested' | 'return_requested' | 'returning' | 'returned' | 'exchange_requested';
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
  memo?: string;
}

interface PaymentInfo {
  method: string;
  bankName?: string;
  accountNumber?: string;
  depositor?: string;
  paidAt?: string;
}

// Removed generateLogenTrackingNumber as we rely on adminService.registerLogenInvoice

export function OrderManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('paid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog states
  const [shippingDialog, setShippingDialog] = useState<{
    open: boolean;
    type: 'confirm' | 'success' | 'bulk-confirm' | 'bulk-order-print' | 'bulk-invoice-print' | 'bulk-success' | 'no-orders';
    orderId?: string;
    trackingNumber?: string;
    bulkTracking?: Array<{ orderNumber: string; trackingNumber: string }>;
    ordersToProcess?: Order[];
  }>({
    open: false,
    type: 'confirm',
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await adminService.getOrders();
      setOrders(data as unknown as Order[]);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    partially_shipped: orders.filter(o => o.status === 'partially_shipped').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    claims: orders.filter(o => ['cancel_requested', 'return_requested', 'returning', 'returned', 'exchange_requested'].includes(o.status)).length,
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">입금대기</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">결제완료/발송대기</Badge>;
      case 'partially_shipped':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">결제완료/부분발송</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">배송중</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">배송완료</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">취소됨</Badge>;
      case 'cancel_requested':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 font-bold animate-pulse">취소요청</Badge>;
      case 'return_requested':
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-100 font-bold animate-pulse">반품요청</Badge>;
      case 'returning':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">반품수거중</Badge>;
      case 'returned':
        return <Badge variant="outline" className="bg-neutral-100 text-neutral-600 border-neutral-200">반품완료</Badge>;
      case 'exchange_requested':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-bold animate-pulse">교환요청</Badge>;
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.hospitalName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' 
      ? true 
      : selectedStatus === 'claims' 
        ? ['cancel_requested', 'return_requested', 'returning', 'returned', 'exchange_requested'].includes(order.status)
        : order.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);


  const confirmShipping = async () => {
    if (shippingDialog.orderId && shippingDialog.trackingNumber) {
      try {
        await adminService.updateOrderStatus(shippingDialog.orderId, 'shipped', shippingDialog.trackingNumber);
        setShippingDialog(prev => ({ ...prev, type: 'success' }));
        loadOrders();
      } catch (error) {
        console.error('Failed to update order status', error);
        alert('배송 처리에 실패했습니다.');
      }
    }
  };

  const handleBulkLogenInvoice = async () => {
    if (selectedStatus !== 'paid' && selectedStatus !== 'partially_shipped') {
      toast.error('발송대상 관련된 탭에서만 일괄 처리가 가능합니다.');
      return;
    }

    if (filteredOrders.length === 0) {
      setShippingDialog({
        open: true,
        type: 'no-orders',
      });
      return;
    }

    // 각 주문에 대해 로젠 API 호출하여 송장 채번
    toast.info('로젠택배 시스템과 연동 중입니다...');
    const generatePromises = filteredOrders.map(async (order: Order) => {
      const trackingNumber = await adminService.registerLogenInvoice(order);
      return {
        ...order,
        trackingNumber,
        trackingCompany: '로젠택배',
        shippedAt: new Date().toISOString(),
      };
    });

    const ordersWithTracking = await Promise.all(generatePromises);

    setShippingDialog({
      open: true,
      type: 'bulk-confirm',
      bulkTracking: ordersWithTracking.map((order: any) => ({
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber!,
      })),
      ordersToProcess: ordersWithTracking, // Confirm에서 사용하기 위해 저장
    });
  };

  const confirmBulkShipping = async () => {
    try {
      if (!shippingDialog.ordersToProcess) return;

      const promises = shippingDialog.ordersToProcess
        .filter((o: Order) => o.status === 'paid')
        .map((o: Order) => adminService.updateOrderStatus(o.id, 'shipped', o.trackingNumber));
      await Promise.all(promises);
      setShippingDialog(prev => ({ ...prev, type: 'bulk-success' }));
      loadOrders();
    } catch (error) {
      console.error('Failed to bulk update', error);
      toast.error('일괄 배송 처리에 실패했습니다.');
    }
  };


  // 내부 포맷 주문서 출력
  const handlePrintInternalOrders = () => {
    alert('주문서 출력 기능은 데모에서 생략되었습니다.');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">주문 관리</h2>
          <p className="text-sm text-neutral-600">결제 및 입금이 완료된 발송 대상 주문을 관리합니다.</p>
        </div>
        {/* 
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handlePrintInternalOrders()}>
            <Printer className="w-4 h-4 mr-2" />
            주문서 출력
          </Button>
          <Button onClick={handleBulkLogenInvoice} disabled={stats.paid === 0}>
            <Truck className="w-4 h-4 mr-2" />
            배송 일괄처리
          </Button>
        </div>
        */}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: '전체', count: stats.all },
          { id: 'pending', label: '입금대기', count: stats.pending },
          { id: 'paid', label: '발송대기', count: stats.paid },
          { id: 'partially_shipped', label: '부분발송', count: stats.partially_shipped },
          { id: 'shipped', label: '배송중', count: stats.shipped },
          { id: 'delivered', label: '배송완료', count: stats.delivered },
          { id: 'cancelled', label: '취소됨', count: stats.cancelled },
          { id: 'claims', label: '취소/반품/교환', count: stats.claims },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${selectedStatus === tab.id
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
          >
            {tab.label} <span className="ml-1 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-neutral-200 p-4 sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="주문번호, 고객명, 병원명 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* Order List */}
      <div className="bg-white border border-neutral-200 divide-y divide-neutral-200">
        {/* Order Table */}
        <div className="bg-white border border-neutral-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-700 uppercase tracking-tighter">주문번호</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-700 uppercase tracking-tighter">고객정보</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-700 uppercase tracking-tighter">주문금액</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-700 uppercase tracking-tighter">주문일시</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-700 uppercase tracking-tighter">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-neutral-300 opacity-20" />
                    조건에 맞는 주문이 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order: Order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-neutral-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-neutral-900 group-hover:text-blue-600 transition-colors uppercase tracking-wider">{order.orderNumber}</div>
                      <div className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{order.itemsSummary}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-neutral-900">{order.hospitalName}</div>
                      <div className="text-xs text-neutral-500">{order.customerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-neutral-900">₩{order.totalAmount.toLocaleString()}</div>
                      <div className="text-xs text-neutral-500">{order.paymentInfo?.method}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">{order.orderDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                      {order.isSubscription && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 border-purple-100">정기배송</Badge>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredOrders.length > 0 && (
          <div className="bg-white border border-neutral-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-600">
                전체 <span className="font-medium text-neutral-900">{filteredOrders.length}</span>건 중{' '}
                <span className="font-medium text-neutral-900">{startIndex + 1}</span>-
                <span className="font-medium text-neutral-900">{Math.min(endIndex, filteredOrders.length)}</span>건
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
                          className={`px-3 py-2 text-sm border transition-colors ${currentPage === page
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

      {/* Shipping Confirmation Dialog */}
      <AlertDialog open={shippingDialog.open} onOpenChange={(open: boolean) => setShippingDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {shippingDialog.type === 'confirm' && '발송 처리하시겠습니까?'}
              {shippingDialog.type === 'success' && '발송 처리가 완료되었습니다'}
              {shippingDialog.type === 'bulk-confirm' && `총 ${shippingDialog.bulkTracking?.length}건을 일괄 발송하시겠습니까?`}
              {shippingDialog.type === 'bulk-success' && '일괄 발송 처리가 완료되었습니다'}
              {shippingDialog.type === 'no-orders' && '발송할 주문이 없습니다'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {shippingDialog.type === 'confirm' && (
                  <div className="mt-2 p-3 bg-neutral-50 text-sm">
                    <div className="mb-1"><strong>발송 정보:</strong> 로젠택배</div>
                    <div><strong>송장번호:</strong> {shippingDialog.trackingNumber}</div>
                  </div>
                )}
                {shippingDialog.type === 'bulk-confirm' && (
                  <div>선택된 모든 주문의 상태가 '배송중'으로 변경되며, 송장번호가 자동으로 생성됩니다.</div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {shippingDialog.type === 'success' || shippingDialog.type === 'bulk-success' || shippingDialog.type === 'no-orders' ? (
              <AlertDialogAction onClick={() => setShippingDialog(prev => ({ ...prev, open: false }))}>확인</AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={shippingDialog.type === 'confirm' ? confirmShipping : confirmBulkShipping}>
                  발송 처리
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}