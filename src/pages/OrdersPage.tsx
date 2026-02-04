import { Link } from 'react-router';
import { Package, FileText, Copy } from 'lucide-react';
import { mockOrders } from '../lib/mockData';

export function OrdersPage() {
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-50 text-yellow-900 border border-yellow-200',
      processing: 'bg-blue-50 text-blue-900 border border-blue-200',
      shipped: 'bg-purple-50 text-purple-900 border border-purple-200',
      delivered: 'bg-green-50 text-green-900 border border-green-200',
    };

    const labels = {
      pending: '주문 확인 중',
      processing: '상품 준비 중',
      shipped: '배송 중',
      delivered: '배송 완료',
    };

    return (
      <span className={`px-3 py-1 text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const handleReorder = (orderId: string) => {
    alert(`주문 ${orderId}를 장바구니에 복사합니다.`);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">주문/배송 관리</h2>
        <p className="text-sm text-neutral-600">주문 내역과 배송 현황을 확인하세요</p>
      </div>

      <div className="space-y-6">
        {mockOrders.map(order => (
          <div key={order.id} className="bg-white border border-neutral-200 p-8">
            {/* Order Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b border-neutral-200">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg tracking-tight text-neutral-900">{order.orderNumber}</h3>
                  {getStatusBadge(order.status)}
                </div>
                <p className="text-sm text-neutral-600">{order.date}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReorder(order.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-sm font-medium transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  재주문
                </button>
                {order.status === 'delivered' && (
                  <>
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-900 text-sm font-medium transition-colors border border-red-200">
                      반품신청
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 text-sm font-medium transition-colors border border-blue-200">
                      교환신청
                    </button>
                  </>
                )}
                <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium transition-colors">
                  <FileText className="w-4 h-4" />
                  거래명세서
                </button>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4 mb-6">
              {order.items.map((item, index) => {
                // Safety check for undefined product
                if (!item.product) {
                  return null;
                }
                
                return (
                  <div key={index} className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-neutral-100 overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <Link
                        to={`/products/${item.product.id}`}
                        className="text-lg font-bold tracking-tight text-neutral-900 hover:text-neutral-700"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-neutral-600 mt-1">
                        {item.quantity}개 × ₩{item.product.price.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-lg tracking-tight text-neutral-900">
                      ₩{(item.quantity * item.product.price).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Order Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-neutral-200">
              <div className="text-sm text-neutral-600">
                <span>결제수단: </span>
                <span className="font-medium text-neutral-900">{order.paymentMethod}</span>
                {order.deliveryTrackingNumber && (
                  <>
                    <span className="mx-2">|</span>
                    <span>송장번호: </span>
                    <span className="font-medium text-neutral-900">{order.deliveryTrackingNumber}</span>
                  </>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-600 mb-1">총 결제 금액</p>
                <p className="text-2xl tracking-tight text-neutral-900">
                  ₩{order.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Tracking Button */}
            {order.deliveryTrackingNumber && (
              <button className="w-full mt-6 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 py-4 font-medium flex items-center justify-center gap-2 transition-colors text-sm tracking-wide uppercase">
                <Package className="w-5 h-5" />
                실시간 배송 트래킹
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {mockOrders.length === 0 && (
        <div className="bg-white border border-neutral-200 p-20 text-center">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            주문 내역이 없습니다
          </h3>
          <p className="text-gray-600 mb-6">
            첫 주문을 시작해보세요
          </p>
          <Link
            to="/products"
            className="inline-block bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            상품 둘러보기
          </Link>
        </div>
      )}
    </div>
  );
}