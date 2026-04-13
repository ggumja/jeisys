import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Package, User, Truck, Mail, Clock, CheckCircle, XCircle, RefreshCw, Calendar, Play, Pause, Edit2, Loader2, Save, Printer, FileText, AlertTriangle, CreditCard } from 'lucide-react';
import { printInvoice, printPackingList } from '../../utils/printUtils';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';
import { OrderCancelModal } from '../../components/admin/OrderCancelModal';
import { OrderClaimModal } from '../../components/admin/OrderClaimModal';
import { useModal } from '../../context/ModalContext';
import { Product } from '../../types';
import { productService } from '../../services/productService';

interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  category: string;
  quantity: number;
  shippedQuantity?: number;
  stock?: number | null;
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
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'partially_refunded';
  amount: number;
  trackingNumber?: string;
}

interface PaymentHistory {
  id: string;
  orderId: string;
  transactionType: 'PAYMENT' | 'REFUND' | 'PARTIAL_REFUND';
  amount: number;
  pgTid?: string;
  status: 'SUCCESS' | 'FAILURE';
  reason?: string;
  method?: string;
    createdAt: string;
}

interface OrderHistory {
    id: string;
    orderId: string;
    beforeStatus?: string;
    afterStatus: string;
    actionTitle: string;
    actionDescription?: string;
    adminId?: string;
    createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  hospitalName: string;
  orderDate: string;
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'partially_shipped' | 'partially_refunded';
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
    paymentHistory?: PaymentHistory[];
    orderHistory?: OrderHistory[];
    trackingNumber?: string;
  pgTid?: string;
  shipments?: Array<{
    id: string;
    trackingNumber: string;
    shippedAt: string;
    isPartial: boolean;
    items: Array<{ productName: string; quantity: number }>;
  }>;
  claimInfo?: {
    type: 'CANCEL' | 'RETURN' | 'EXCHANGE';
    reason: string;
    requestedAt: string;
    processedAt?: string;
    rejectedReason?: string;
    returnTrackingNumber?: string;
    exchangeTrackingNumber?: string;
  };
  paymentMethod?: string;
}


export function OrderDetailPage() {
  const { confirm, alert } = useModal();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [boxCount, setBoxCount] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'paused' | 'cancelled'>('active');
  const [subProductsMap, setSubProductsMap] = useState<Record<string, Product>>({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  // 발송 수량 상태: { [orderItemId]: shipQty }
  const [shipQtyMap, setShipQtyMap] = useState<Record<string, number>>({});
  // 번들 상품의 발송 대상 인덱스 상태: { [orderItemId]: [index1, index2, ...] }
  const [bundleShipIndicesMap, setBundleShipIndicesMap] = useState<Record<string, number[]>>({});

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await adminService.getOrderById(id!) as any;
      setOrder(data);
      
      // Load bundled sub-products if any
      if (data.orderItems) {
        const allSubProductIds = new Set<string>();
        data.orderItems.forEach((item: any) => {
          item.selected_product_ids?.forEach((id: string) => allSubProductIds.add(id));
        });

        if (allSubProductIds.size > 0) {
          const productPromises = Array.from(allSubProductIds).map(id => productService.getProductById(id));
          const products = await Promise.all(productPromises);
          const map: Record<string, Product> = {};
          products.forEach(p => {
            if (p) map[p.id] = p;
          });
          setSubProductsMap(prev => ({ ...prev, ...map }));
        }

        const initMap: Record<string, number> = {};
        data.orderItems.forEach((item: OrderItem) => {
          const isBundle = item.selected_product_ids && (item.selected_product_ids as string[]).length > 0;
          if (isBundle) {
            initMap[item.id] = 0; // 번들은 체크박스 선택 방식이므로 0 유지
          } else {
            const remaining = Math.max(0, item.quantity - (item.shippedQuantity || 0));
            initMap[item.id] = remaining;
          }
        });
        setShipQtyMap(initMap);

        // 🔄 자동 상태 보정: 전체 발송 완료인데 status가 paid/partially_shipped인 경우 shipped로 업데이트
        const allFullyShipped = data.orderItems.every(
          (item: OrderItem) => (item.shippedQuantity || 0) >= item.quantity
        );
        if (allFullyShipped && (data.status === 'paid' || data.status === 'partially_shipped')) {
          try {
            await adminService.updateOrderStatus(data.id, 'shipped', data.trackingNumber);
            // 상태 보정 후 데이터 다시 로드
            const refreshed = await adminService.getOrderById(id!);
            setOrder(refreshed);
          } catch (e) {
            console.error('상태 자동 보정 실패:', e);
          }
        }
      }
      if (data.trackingNumber) {
        setTrackingNumber(data.trackingNumber);
      }
      if (data.subscriptionStatus) {
        setSubscriptionStatus(data.subscriptionStatus);
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      toast.error('주문 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string, manualTracking?: string) => {
    const targetStatus = status as Order['status'];
    try {
      setIsUpdating(true);
      await adminService.updateOrderStatus(id!, status, manualTracking || trackingNumber);

      // ✅ DB 업데이트 성공 즉시 로컬 상태 반영 (UI 지연 방지)
      setOrder(prev => prev ? { ...prev, status: targetStatus, trackingNumber: manualTracking || trackingNumber } : prev);

      toast.success('주문 상태가 변경되었습니다.');

      // 리로드 후에도 확정 상태가 캐시로 인해 뒤집히지 않도록 재적용
      await loadOrder();
      setOrder(prev => prev ? { ...prev, status: targetStatus } : prev);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('상태 변경에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartShipping = async () => {
    if (!trackingNumber.trim()) {
      toast.error('송장 번호를 입력해 주세요.');
      return;
    }
    await handleUpdateStatus('shipped');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <p className="text-sm text-neutral-500">주문 정보를 불러오는 중...</p>
      </div>
    );
  }

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

  const getTransactionTypeText = (type: PaymentHistory['transactionType']) => {
    switch (type) {
      case 'PAYMENT': return '결제';
      case 'REFUND': return '전체환불';
      case 'PARTIAL_REFUND': return '부분환불';
      default: return type;
    }
  };

  const getTransactionTypeColor = (type: PaymentHistory['transactionType']) => {
    switch (type) {
      case 'PAYMENT': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'REFUND': return 'text-red-600 bg-red-50 border-red-100';
      case 'PARTIAL_REFUND': return 'text-orange-600 bg-orange-50 border-orange-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getStatusBadge = (status: Order['status'] | any) => {
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
      case 'partially_refunded':
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
            <RefreshCw className="w-3 h-3 mr-1" />
            부분환불
          </Badge>
        );
      case 'partially_shipped':
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
            <Truck className="w-3 h-3 mr-1" />
            부분발송
          </Badge>
        );
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
        return <Badge variant="outline">{status}</Badge>;
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
  const getStatusText = (status: Order['status'] | any) => {
    switch (status) {
      case 'pending': return '입금대기';
      case 'paid': return '결제완료';
      case 'shipped': return '배송중';
      case 'delivered': return '배송완료';
      case 'cancelled': return '취소';
      case 'partially_refunded': return '부분환불';
      case 'partially_shipped': return '부분발송';
      case 'cancel_requested': return '취소요청';
      case 'return_requested': return '반품요청';
      case 'returning': return '반품입고중';
      case 'returned': return '반품완료';
      case 'exchange_requested': return '교환요청';
      default: return status;
    }
  };

  const handlePauseSubscription = async () => {
    if (await confirm('정기배송을 일시정지하시겠습니까?')) {
      setSubscriptionStatus('paused');
      await alert('정기배송이 일시정지되었습니다.');
    }
  };

  const handleResumeSubscription = async () => {
    if (await confirm('정기배송을 재개하시겠습니까?')) {
      setSubscriptionStatus('active');
      await alert('정기배송이 재개되었습니다.');
    }
  };

  const handleCancelSubscription = async () => {
    if (await confirm('정기배송을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setSubscriptionStatus('cancelled');
      await alert('정기배송이 취소되었습니다.');
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
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrder}
            disabled={loading}
            className="flex items-center gap-2 border-neutral-300 text-neutral-600 hover:bg-neutral-50 px-3 h-10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">새로고침</span>
          </Button>
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
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 클레임 승인/거절 버튼 (요청 상태일 때만 노출) */}
          {(order.status === 'cancel_requested' || order.status === 'return_requested' || order.status === 'exchange_requested') && (
            <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-lg border border-neutral-200">
              <span className="text-xs font-bold text-neutral-500 px-2 uppercase">Claim Action</span>
              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700 h-9"
                onClick={async () => {
                  if (await confirm(`${getStatusText(order.status)}을 승인하시겠습니까?`)) {
                    try {
                      setIsUpdating(true);
                      const claimType = order.status === 'cancel_requested' ? 'CANCEL' : order.status === 'return_requested' ? 'RETURN' : 'EXCHANGE';
                      await adminService.processClaim(order.id, 'APPROVE', { claimType });
                      toast.success('클레임이 승인되었습니다.');
                      await loadOrder();
                    } catch (e) {
                      toast.error('처리에 실패했습니다.');
                    } finally {
                      setIsUpdating(false);
                    }
                  }
                }}
              >
                클레임 승인
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 h-9"
                onClick={async () => {
                  const reason = window.prompt('거절 사유를 입력해주세요:');
                  if (reason) {
                    try {
                      setIsUpdating(true);
                      const claimType = order.status === 'cancel_requested' ? 'CANCEL' : order.status === 'return_requested' ? 'RETURN' : 'EXCHANGE';
                      await adminService.processClaim(order.id, 'REJECT', { claimType, reason });
                      toast.success('클레임이 거절되었습니다.');
                      await loadOrder();
                    } catch (e) {
                      toast.error('처리에 실패했습니다.');
                    } finally {
                      setIsUpdating(false);
                    }
                  }
                }}
              >
                요청 거절
              </Button>
            </div>
          )}

          {/* 기존 취소/환불 버튼: 배송 시작 전(paid) 단계에서만 '취소'로 동작 */}
          {order.status !== 'cancelled' && order.status !== 'pending' && !order.status.includes('_requested') && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={async () => {
                  const isShipped = order.status === 'shipped' || order.status === 'delivered' || order.status === 'partially_shipped';
                  if (isShipped) {
                    await alert('이미 배송이 진행된 주문입니다. 취소 대신 [클레임(반품/교환) 등록] 버튼을 사용해 주세요.');
                    return;
                  }
                  setShowCancelModal(true);
                }}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                주문 취소
              </Button>

              {(order.status === 'shipped' || order.status === 'delivered' || order.status === 'partially_shipped') && (
                <Button
                  variant="outline"
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  onClick={() => setShowClaimModal(true)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  반품/교환 등록
                </Button>
              )}
            </div>
          )}

          {order.status === 'pending' && (
            <Button
              variant="default"
              onClick={() => handleUpdateStatus('paid')}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              입금 확인 처리
            </Button>
          )}
          {order.status === 'paid' && (
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={async () => {
                if (await confirm({
                  title: '상품준비중 처리',
                  description: '이 주문을 상품준비중 상태로 변경하시겠습니까? 고객에게 주문이 접수되었음을 알립니다.'
                })) {
                  handleUpdateStatus('processing');
                }
              }}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
              상품준비중 처리
            </Button>
          )}
          {order.status === 'shipped' && (
            <Button 
              variant="outline" 
              onClick={async () => {
                if (await confirm({
                  title: '배송 완료 처리',
                  description: '정말로 이 주문을 배송 완료 상태로 변경하시겠습니까?'
                })) {
                  handleUpdateStatus('delivered');
                }
              }}
            >
              배송 완료 처리
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

      {/* Claim Info Section - 클레임 정보가 있는 경우 최상단 노출 */}
      {order.claimInfo && (
        <div className="bg-red-50 border-2 border-red-200 p-6 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="text-lg font-bold text-red-900">클레임 상세 정보 ({getStatusText(order.status)})</h4>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(order.status)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white p-4 border border-red-100 shadow-sm">
                <dt className="text-xs font-bold text-red-700 mb-2 uppercase flex items-center gap-1">
                  <Package className="w-3 h-3" /> 요청 유형
                </dt>
                <dd className="text-sm font-bold text-red-900">
                  {order.claimInfo.type === 'CANCEL' ? '주문 취소' : order.claimInfo.type === 'RETURN' ? '반품/환불' : '상품 교환'}
                </dd>
              </div>
              <div className="bg-white p-4 border border-red-100 shadow-sm">
                <dt className="text-xs font-bold text-red-700 mb-2 uppercase flex items-center gap-1">
                  <FileText className="w-3 h-3" /> 클레임 상세 사유
                </dt>
                <dd className="text-sm text-red-900 leading-relaxed whitespace-pre-wrap">
                  {order.claimInfo.reason}
                </dd>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white p-4 border border-red-100 shadow-sm">
                <dt className="text-xs font-bold text-neutral-500 mb-2 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 타임라인
                </dt>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">요청 접수</span>
                    <span className="font-medium text-neutral-900">{new Date(order.claimInfo.requestedAt).toLocaleString()}</span>
                  </div>
                  {order.claimInfo.processedAt && (
                    <div className="flex justify-between text-xs border-t border-neutral-50 pt-2 font-bold text-green-700">
                      <span>처리 완료</span>
                      <span>{new Date(order.claimInfo.processedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
              {order.claimInfo.rejectedReason && (
                <div className="bg-red-600 p-4 border border-red-700 shadow-md">
                  <dt className="text-xs font-bold text-white mb-2 uppercase flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> 거절 사유 (고객 안내됨)
                  </dt>
                  <dd className="text-sm font-bold text-white">
                    {order.claimInfo.rejectedReason}
                  </dd>
                </div>
              )}
            </div>
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
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h4 className="text-sm font-medium text-neutral-900">주문 상품</h4>
          {order.status === 'paid' || order.status === 'processing' || order.status === 'partially_shipped' ? (
            <div className="flex items-center gap-3">
              {(() => {
                const isAllShipped = !order.orderItems?.some(item => (item.quantity - (item.shippedQuantity || (item as any).shipped_quantity || 0)) > 0);
                return (
                  <>
                    <div className="flex items-center gap-2 mr-1">
                      <span className="text-sm font-medium text-neutral-600">박스 수량:</span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={boxCount}
                        disabled={isAllShipped}
                        onChange={(e) => setBoxCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className={`w-16 border border-neutral-300 px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-neutral-900 ${isAllShipped ? 'bg-neutral-50 text-neutral-400' : ''}`}
                      />
                    </div>
                    <Button
                      variant="default"
                      disabled={isAllShipped || isUpdating}
                      title={isAllShipped ? '모든 상품 발송 완료' : ''}
                      onClick={async () => {
                        const itemsToShip = order.orderItems?.filter(item => {
                          const qty = shipQtyMap[item.id] ?? 0;
                          return qty > 0 && item.productId;
                        }).map(item => ({
                          orderItemId: item.id,
                          productId: item.productId!,
                          shipQty: shipQtyMap[item.id] ?? 0,
                          stock: item.stock,
                          productName: item.productName,
                          shippedSelectedIndices: bundleShipIndicesMap[item.id] || []
                        })) || [];

                        if (itemsToShip.length === 0) {
                          toast.error('발송 처리할 상품과 수량을 선택해주세요.');
                          return;
                        }

                        // 재고 부족 체크
                        const outOfStockItems = itemsToShip.filter(item => {
                          const currentStock = item.stock ?? 0;
                          return currentStock < item.shipQty;
                        });

                        if (outOfStockItems.length > 0) {
                          const itemNames = outOfStockItems.map(i => i.productName).join(', ');
                          toast.error(`재고가 부족한 상품이 포함되어 있습니다 (현재 재고 확인 필요): ${itemNames}`);
                          return;
                        }

                        if (itemsToShip.length === 0) {
                          toast.error('발송할 수량을 확인해 주세요.');
                          return;
                        }

                        try {
                          setIsUpdating(true);

                          // 송장번호 자동 발급 (박스수량만큼)
                          toast.info(`로젠택배 송장번호를 ${boxCount}개 발급중입니다...`);
                          const finalTrackingNumber = await adminService.registerLogenInvoice(order, boxCount);
                          
                          if (!finalTrackingNumber) {
                            toast.error('송장 번호 발급에 실패했습니다. 데이터를 확인해주세요.');
                            setIsUpdating(false);
                            return;
                          }

                          setTrackingNumber(finalTrackingNumber);

                          const result = await adminService.partialShipOrder({
                            orderId: order.id,
                            trackingNumber: finalTrackingNumber,
                            orderNumber: order.orderNumber,
                            items: itemsToShip,
                          });

                          toast.success(result.status === 'shipped' ? '전체 발송 처리가 완료되었습니다.' : '부분 발송 처리가 완료되었습니다.');
                          // DB 업데이트 성공 즉시 로컬 상태도 반영 (UI 지연 방지)
                          const confirmedStatus = result.status as 'shipped' | 'partially_shipped';
                          setOrder(prev => prev ? { ...prev, status: confirmedStatus } : prev);
                          setTrackingNumber('');
                          setBoxCount(1);
                          setBundleShipIndicesMap({});
                          // loadOrder 후에도 확정 상태 재적용 (Supabase 캐시로 stale 데이터 방지)
                          await loadOrder();
                          setOrder(prev => prev ? { ...prev, status: confirmedStatus } : prev);
                        } catch (e) {
                          toast.error('발송 처리에 실패했습니다.');
                        } finally {
                          setIsUpdating(false);
                        }
                      }}
                      className=""
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                      {order.orderItems?.some(item => {
                        const isBundle = item.selected_product_ids && item.selected_product_ids.length > 0;
                        const totalPossible = isBundle ? item.quantity * item.selected_product_ids.length : item.quantity;
                        const shippedTotal = item.shippedQuantity || (item as any).shipped_quantity || 0;
                        const shipTarget = shipQtyMap[item.id] ?? 0;
                        return shipTarget < (totalPossible - shippedTotal);
                      })
                        ? '부분 발송 처리'
                        : '전체 발송 처리'}
                    </Button>
                  </>
                );
              })()}
            </div>
          ) : null}
        </div>
        <div className="p-6">
          <table className="w-full">
            <thead className="border-b border-neutral-200">
              <tr>
                <th className="pb-3 text-left text-xs font-medium text-neutral-700">상품명</th>
                <th className="pb-3 text-left text-xs font-medium text-neutral-700">카테고리</th>
                <th className="pb-3 text-right text-xs font-medium text-neutral-700">주문수량</th>
                <th className="pb-3 text-right text-xs font-medium text-neutral-700">재고</th>
                <th className="pb-3 text-right text-xs font-medium text-neutral-700">발송수량</th>
                <th className="pb-3 text-right text-xs font-medium text-neutral-700">단가</th>
                <th className="pb-3 text-right text-xs font-medium text-neutral-700">합계</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {order.orderItems && order.orderItems.length > 0 ? (
                order.orderItems.map((item: any) => {
                  const shippedQty = item.shippedQuantity || item.shipped_quantity || 0;
                  const remaining = item.quantity - shippedQty;
                  const stock = item.stock;
                  const isOutOfStock = stock !== null && stock !== undefined && stock === 0;
                  const isLowStock = stock !== null && stock !== undefined && stock > 0 && stock < remaining;
                  const canEdit = order.status === 'paid' || order.status === 'processing' || order.status === 'partially_shipped';
                  return (
                    <tr key={item.id}>
                      <td className="py-4 text-sm text-neutral-900">
                        <div className="flex flex-col">
                          <span className="font-bold">{item.productName}</span>
                          {item.selected_product_ids && item.selected_product_ids.length > 0 && (
                            <div className="mt-2 ml-2 pl-3 border-l-2 border-neutral-100 space-y-3">
                              {(() => {
                                // 1. 전체 구성품 (세트 수만큼 복제)
                                const totalItems: { id: string, index: number }[] = [];
                                for (let s = 0; s < item.quantity; s++) {
                                  item.selected_product_ids.forEach((pid: string, idx: number) => {
                                    totalItems.push({ id: pid, index: s * item.selected_product_ids.length + idx });
                                  });
                                }

                                // 2. 제품 종류별로 그룹화
                                const grouped: Record<string, { id: string, name: string, items: number[] }> = {};
                                totalItems.forEach(({ id, index }) => {
                                  const name = subProductsMap[id]?.name || '로딩 중...';
                                  if (!grouped[id]) grouped[id] = { id, name, items: [] };
                                  grouped[id].items.push(index);
                                });

                                const alreadyShipped = (item as any).shipped_selected_indices || [];
                                const currentSelected = bundleShipIndicesMap[item.id] || [];

                                return Object.values(grouped).map(group => {
                                  const alreadyShippedInGroup = group.items.filter(idx => alreadyShipped.includes(idx));
                                  const remainingInGroup = group.items.filter(idx => !alreadyShipped.includes(idx));
                                  const selectedInGroup = group.items.filter(idx => currentSelected.includes(idx));
                                  
                                  const groupShippedQty = alreadyShippedInGroup.length;
                                  const groupRemainingQty = remainingInGroup.length;
                                  const groupSelectedQty = selectedInGroup.length;

                                  return (
                                    <div key={group.id} className="space-y-2 pb-2 border-b border-neutral-50 last:border-0">
                                      <div className="flex items-center justify-between text-[11px]">
                                        <div className="flex flex-col">
                                          <span className="font-bold text-neutral-900">{group.name}</span>
                                          <span className="text-neutral-500">
                                            잔여: {groupRemainingQty}개 (총 {group.items.length}개 중 {groupShippedQty}개 발송완료)
                                          </span>
                                        </div>
                                        {canEdit && groupRemainingQty > 0 ? (
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-neutral-400">발송할 수량:</span>
                                            <input
                                              type="number"
                                              min={0}
                                              max={groupRemainingQty}
                                              value={groupSelectedQty}
                                              onChange={(e) => {
                                                const val = Math.max(0, Math.min(groupRemainingQty, parseInt(e.target.value) || 0));
                                                // 해당 그룹의 미발송 인덱스들 중 입력한 수량만큼 선택
                                                const newIndicesInGroup = remainingInGroup.slice(0, val);
                                                
                                                setBundleShipIndicesMap(prev => {
                                                  const otherGroupsIndices = (prev[item.id] || []).filter(idx => !group.items.includes(idx));
                                                  const newBundleIndices = [...otherGroupsIndices, ...newIndicesInGroup];
                                                  
                                                  // 동기화: 메인 발송 수량 업데이트
                                                  setShipQtyMap(sqm => ({ ...sqm, [item.id]: newBundleIndices.length }));
                                                  
                                                  return { ...prev, [item.id]: newBundleIndices };
                                                });
                                              }}
                                              className="w-12 h-7 text-right border border-neutral-300 px-1 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                            />
                                          </div>
                                        ) : groupRemainingQty === 0 ? (
                                          <span className="text-green-600 font-bold">발송 완료</span>
                                        ) : null}
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </div>
                        {shippedQty > 0 && (
                          <span className="mt-1 text-xs text-purple-600 block">
                            {(() => {
                              const totalPossible = item.selected_product_ids && item.selected_product_ids.length > 0 
                                ? item.quantity * item.selected_product_ids.length 
                                : item.quantity;
                              return shippedQty >= totalPossible 
                                ? '(전체 발송완료)' 
                                : `(${shippedQty}개 발송완료)`;
                            })()}
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className="inline-flex px-2 py-1 bg-neutral-100 text-neutral-800 text-xs">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-neutral-900 text-right">
                        {item.selected_product_ids && item.selected_product_ids.length > 0 
                          ? `${item.quantity * item.selected_product_ids.length}개` 
                          : `${item.quantity}개`}
                      </td>
                      <td className="py-4 text-right">
                        {stock === null || stock === undefined ? (
                          <span className="text-xs text-neutral-400">-</span>
                        ) : isOutOfStock ? (
                          <span className="inline-flex px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">품절</span>
                        ) : isLowStock ? (
                          <span className="inline-flex px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">⚠ {stock}개</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">✓ {stock}개</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        {(() => {
                          const isBundle = item.selected_product_ids && item.selected_product_ids.length > 0;
                          const totalPossible = isBundle 
                            ? item.quantity * item.selected_product_ids.length 
                            : item.quantity;
                          const remainingItems = totalPossible - shippedQty;

                          if (canEdit && remainingItems > 0) {
                            return (
                              <div className="flex flex-col items-end gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={remainingItems}
                                  disabled={isOutOfStock || isBundle} // 번들은 수동 입력 방지 (자동 동기화)
                                  value={shipQtyMap[item.id] ?? (isOutOfStock ? 0 : remainingItems)}
                                  onChange={(e) => {
                                    if (!isBundle) {
                                      const v = Math.min(Number(e.target.value), remainingItems);
                                      setShipQtyMap(prev => ({ ...prev, [item.id]: v }));
                                    }
                                  }}
                                  className={`w-16 text-right border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                                    (isOutOfStock || isBundle) ? 'bg-neutral-100 border-neutral-200 text-neutral-400' : 'border-neutral-300'
                                  }`}
                                />
                                {stock !== null && stock !== undefined && stock < (shipQtyMap[item.id] ?? (isOutOfStock ? 0 : remainingItems)) && (
                                  <span className="text-[10px] text-red-500 font-bold animate-pulse">재고 부족</span>
                                )}
                              </div>
                            );
                          }
                          return (
                            <span className="text-sm text-neutral-500">
                              {remainingItems === 0 ? '완료' : `${remainingItems}개`}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-4 text-sm text-neutral-900 text-right">{item.price.toLocaleString()}원</td>
                      <td className="py-4 text-sm font-medium text-neutral-900 text-right">
                        {(item.quantity * item.price).toLocaleString()}원
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    등록된 주문 상품 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="border-t-2 border-neutral-900">
              <tr>
                <td colSpan={6} className="pt-4 text-right text-sm font-medium text-neutral-900">
                  {order.isSubscription ? '회당 주문금액' : '총 주문금액'}
                </td>
                <td className="pt-4 text-right text-lg font-bold text-neutral-900">
                  {(() => {
                    const calculatedTotal = order.orderItems?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
                    return calculatedTotal.toLocaleString();
                  })()}원
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      {/* Shipment History */}
      {order.shipments && order.shipments.length > 0 && (
        <div className="bg-white border border-neutral-200 mt-6">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h4 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              배송(송장) 추적 이력
            </h4>
          </div>
          <div className="p-6">
            <ul className="space-y-4">
              {order.shipments.map((shipment) => (
                <li key={shipment.id} className="p-4 border border-neutral-100 bg-neutral-50 flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${shipment.isPartial ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {shipment.isPartial ? '부분발송' : '전체발송'}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {shipment.trackingNumber?.split(',').map((tn, idx) => (
                            <span key={idx} className="font-bold text-neutral-900 text-sm bg-white border border-neutral-300 px-2 py-1 rounded shadow-sm">
                              📦 로젠택배 <span className="text-blue-600 underline cursor-pointer">{tn.trim()}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 md:mt-0">
                        <span className="text-xs text-neutral-500 mr-2">
                          {new Date(shipment.shippedAt).toLocaleString()}
                        </span>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() => printInvoice(order, shipment)}
                        >
                          <Printer className="w-3 h-3" /> 송장 출력
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() => printPackingList(order, shipment)}
                        >
                          <FileText className="w-3 h-3" /> 패킹리스트
                        </Button>

                        <button
                          onClick={async () => {
                            try {
                              setIsUpdating(true);
                              await adminService.cancelShipment(shipment.id, order.id);
                              toast.success('발송 내역이 정상적으로 취소되었습니다.');
                              await loadOrder();
                            } catch (e) {
                              toast.error('발송 취소 중 오류가 발생했습니다.');
                            } finally {
                              setIsUpdating(false);
                            }
                          }}
                          disabled={isUpdating}
                          className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                        >
                          발송 취소
                        </button>
                      </div>
                    </div>
                    {/* 발송된 상품 목록 - 테이블 */}
                    <div className="mt-3 border border-neutral-200 overflow-hidden text-xs">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-200">
                            <th className="px-3 py-1.5 text-left font-medium text-neutral-500 w-8">No.</th>
                            <th className="px-3 py-1.5 text-left font-medium text-neutral-500">상품명</th>
                            <th className="px-3 py-1.5 text-center font-medium text-neutral-500 w-12">수량</th>
                            <th className="px-3 py-1.5 text-center font-medium text-neutral-500 w-14">구분</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {shipment.items.flatMap((it, idx) => {
                            let rowNum = 0;
                            const rows = [];
                            rowNum = idx + 1;
                            rows.push(
                              <tr key={`main-${idx}`} className="bg-white">
                                <td className="px-3 py-2 text-neutral-400 text-center">{rowNum}</td>
                                <td className="px-3 py-2 text-neutral-900 font-medium">{it.productName}</td>
                                <td className="px-3 py-2 text-center font-bold text-neutral-900">{it.quantity}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-medium rounded">구매</span>
                                </td>
                              </tr>
                            );
                            if (it.bonusItems && it.bonusItems.length > 0) {
                              it.bonusItems.forEach((bonus, bIdx) => {
                                rows.push(
                                  <tr key={`bonus-${idx}-${bIdx}`} className="bg-amber-50">
                                    <td className="px-3 py-1.5 text-amber-400 text-center">{rowNum}.{bIdx + 1}</td>
                                    <td className="px-3 py-1.5 text-amber-800">{bonus.productName}</td>
                                    <td className="px-3 py-1.5 text-center font-bold text-amber-800">{bonus.quantity * it.quantity}</td>
                                    <td className="px-3 py-1.5 text-center">
                                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 text-[10px] font-bold rounded">증정</span>
                                    </td>
                                  </tr>
                                );
                              });
                            }
                            return rows;
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
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
                {order.deliveryHistory.map((history: DeliveryHistory) => (
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
            <h4 className="text-sm font-medium text-neutral-900 flex items-center justify-between gap-2 w-full">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                결제 정보
              </span>
              {order.pgTid && (order.status === 'paid' || order.status === 'shipped' || order.status === 'partially_shipped') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => setShowCancelModal(true)}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  결제 취소/환불
                </Button>
              )}
            </h4>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-neutral-600 mb-1">결제 방법</dt>
                <dd className="text-sm text-neutral-900">
                  {order.paymentInfo.method}
                  <span className="ml-2 text-neutral-400 text-xs">
                    ({(() => {
                      const calculatedTotal = order.orderItems?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
                      const amountStr = calculatedTotal.toLocaleString();
                      
                      if (order.paymentMethod === 'credit') {
                        return `총 결제 완료: ${amountStr}원`;
                      } else {
                        const label = order.status === 'pending' ? '입금 예정' : '입금 완료';
                        return `${label}: ${amountStr}원`;
                      }
                    })()})
                  </span>
                </dd>
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

      {/* Unified Order History List */}
      <div className="bg-white border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/50">
          <h4 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            주문 처리 및 결제 통합 히스토리
          </h4>
        </div>
        <div className="overflow-x-auto">
          {(!order.orderHistory?.length && !order.paymentHistory?.length) ? (
            <div className="py-8 text-center text-neutral-500 text-sm p-6">
              기록된 활동 내역이 없습니다.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">일시</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">구분</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">활동 내용</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">상세 / 상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {[
                  ...(order.orderHistory || []).map(h => ({ ...h, type: 'status' as const })),
                  ...(order.paymentHistory || []).map(p => {
                    const methodLabel = p.method === 'credit' ? '신용카드' : p.method === 'virtual' ? '가상계좌' : p.method;
                    return { 
                      id: p.id, 
                      orderId: p.orderId, 
                      afterStatus: '', 
                      actionTitle: getTransactionTypeText(p.transactionType),
                      actionDescription: `${p.transactionType === 'PAYMENT' ? '+' : '-'} ${p.amount.toLocaleString()}원 (${methodLabel}) ${p.pgTid ? `[TID: ${p.pgTid}]` : ''} ${p.reason ? ` - ${p.reason}` : ''}`,
                      createdAt: p.createdAt,
                      type: 'payment' as const,
                      transactionType: p.transactionType,
                      method: p.method
                    };
                  })
                ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs text-neutral-500 whitespace-nowrap font-mono">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                          {item.type === 'payment' ? (
                            <CreditCard className="w-3.5 h-3.5" />
                          ) : item.actionTitle.includes('배송') ? (
                            <Truck className="w-3.5 h-3.5" />
                          ) : item.actionTitle.includes('클레임') ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className="text-xs font-medium text-neutral-700">{item.actionTitle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-neutral-600 max-w-md line-clamp-2">
                        {item.actionDescription}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.afterStatus ? (
                        getStatusBadge(item.afterStatus as any)
                      ) : item.type === 'payment' ? (
                        <Badge 
                          variant="outline" 
                          className={item.transactionType === 'PAYMENT' 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {item.transactionType === 'PAYMENT' ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {item.transactionType === 'PAYMENT' ? (
                            (item as any).method === 'credit' ? '결제완료' : '입금완료'
                          ) : (
                            (item as any).method === 'credit' ? '결제취소' : '환불완료'
                          )}
                        </Badge>
                      ) : (
                        <span className="text-neutral-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Refund/Cancel Modal */}
      {showCancelModal && order && (
        <OrderCancelModal
          order={{
            id: order.id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            pgTid: order.pgTid,
            paymentMethod: order.paymentMethod
          }}
          onClose={() => setShowCancelModal(false)}
          onSuccess={loadOrder}
        />
      )}

      {/* Refund/Exchange Claim Modal */}
      {showClaimModal && order && (
        <OrderClaimModal
          order={{
            id: order.id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            status: order.status
          }}
          onClose={() => setShowClaimModal(false)}
          onSuccess={loadOrder}
        />
      )}
    </div>
  );
}
