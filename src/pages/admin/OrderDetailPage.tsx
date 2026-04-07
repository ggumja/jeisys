import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Package, User, Truck, Mail, Clock, CheckCircle, XCircle, RefreshCw, Calendar, Play, Pause, Edit2, Loader2, Save, Printer, FileText } from 'lucide-react';
import { printInvoice, printPackingList } from '../../utils/printUtils';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';

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
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
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
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'partially_shipped';
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
  trackingNumber?: string;
  shipments?: Array<{
    id: string;
    trackingNumber: string;
    shippedAt: string;
    isPartial: boolean;
    items: Array<{ productName: string; quantity: number }>;
  }>;
}


export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [boxCount, setBoxCount] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'paused' | 'cancelled'>('active');
  // 발송 수량 상태: { [orderItemId]: shipQty }
  const [shipQtyMap, setShipQtyMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await adminService.getOrderById(id!);
      setOrder(data);
      // 발송수량 초기값: 미발송 수량으로 세팅
      if (data.orderItems) {
        const initMap: Record<string, number> = {};
        data.orderItems.forEach((item: OrderItem) => {
          const remaining = item.quantity - (item.shippedQuantity || 0);
          initMap[item.id] = remaining > 0 ? remaining : 0;
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
    try {
      setIsUpdating(true);
      await adminService.updateOrderStatus(id!, status, manualTracking || trackingNumber);
      toast.success('주문 상태가 변경되었습니다.');
      await loadOrder();
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
      case 'partially_shipped':
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
            <Truck className="w-3 h-3 mr-1" />
            부분발송
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
      case 'paid': return '결제완료';
      case 'shipped': return '배송중';
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
            <p className="text-sm text-neutral-600">
              주문번호: {order.orderNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
          {order.status === 'shipped' && (
            <Button variant="outline" onClick={() => handleUpdateStatus('delivered')}>
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
          {order.status === 'paid' || order.status === 'partially_shipped' ? (
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
                    productName: item.productName
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
                {order.orderItems?.some(item => (shipQtyMap[item.id] ?? 0) < item.quantity - (item.shippedQuantity || 0))
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
                  const canEdit = order.status === 'paid' || order.status === 'partially_shipped';
                  return (
                    <tr key={item.id}>
                      <td className="py-4 text-sm text-neutral-900">
                        {item.productName}
                        {shippedQty > 0 && (
                          <span className="ml-2 text-xs text-purple-600">
                            {shippedQty >= item.quantity ? '(전체 발송완료)' : `(${shippedQty}개 발송완료)`}
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className="inline-flex px-2 py-1 bg-neutral-100 text-neutral-800 text-xs">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-neutral-900 text-right">{item.quantity}개</td>
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
                        {canEdit && remaining > 0 ? (
                          <div className="flex flex-col items-end gap-1">
                            <input
                              type="number"
                              min={0}
                              max={remaining}
                              disabled={isOutOfStock}
                              value={shipQtyMap[item.id] ?? (isOutOfStock ? 0 : remaining)}
                              onChange={(e) => {
                                const v = Math.min(Number(e.target.value), remaining);
                                setShipQtyMap(prev => ({ ...prev, [item.id]: v }));
                              }}
                              className={`w-16 text-right border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                                isOutOfStock ? 'bg-neutral-100 border-neutral-200 text-neutral-400' : 'border-neutral-300'
                              }`}
                            />
                            {stock !== null && stock !== undefined && stock < (shipQtyMap[item.id] ?? (isOutOfStock ? 0 : remaining)) && (
                              <span className="text-[10px] text-red-500 font-bold animate-pulse">재고 부족</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-neutral-500">{remaining === 0 ? '완료' : `${remaining}개`}</span>
                        )}
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
                  {order.totalAmount.toLocaleString()}원
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
                    {/* 발송된 상품 목록 요약 */}
                    <div className="text-sm text-neutral-600 border-l-2 border-neutral-300 pl-3 py-1">
                      {shipment.items.map((it, idx) => (
                        <div key={idx}>- {it.productName} <span className="font-medium text-neutral-900">{it.quantity}개</span></div>
                      ))}
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
