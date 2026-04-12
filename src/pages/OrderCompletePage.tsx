import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { CheckCircle, FileText, Package, Share2, Copy, AlertCircle, Calendar, CreditCard, Landmark, Info } from 'lucide-react';
import { orderService } from '../services/orderService';
import { Order } from '../types';
import { toast } from 'sonner';

export function OrderCompletePage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrderById(orderId!);
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order', error);
      toast.error('주문 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('복사되었습니다.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">주문을 찾을 수 없습니다</h2>
        <Link to="/" className="text-blue-600 hover:underline">홈으로 돌아가기</Link>
      </div>
    );
  }

  const expectedDelivery = new Date();
  expectedDelivery.setDate(expectedDelivery.getDate() + 3);
  const deliveryStr = expectedDelivery.toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    weekday: 'short' 
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 animate-in fade-in duration-700">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {order.paymentMethod === 'virtual' ? '입금 대기 중입니다' : '주문이 완료되었습니다'}
        </h1>
        <p className="text-gray-600">
          {order.paymentMethod === 'virtual' 
            ? '아래 계좌로 입금해 주시면 결제가 완료됩니다.' 
            : '주문해주셔서 감사합니다. 빠르게 준비하여 배송해드리겠습니다.'}
        </p>
      </div>

      {/* Virtual Account Info Box */}
      {order.paymentMethod === 'virtual' && order.vactNum && (
        <div className="bg-neutral-900 rounded-2xl p-8 mb-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Landmark className="w-32 h-32" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-blue-400 uppercase tracking-widest">Deposit Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">입금 은행</label>
                  <p className="text-xl font-bold flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-neutral-400" />
                    {order.vactBankName}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">입금 계좌번호</label>
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-black tracking-wider">{order.vactNum}</p>
                    <button 
                      onClick={() => handleCopy(order.vactNum!)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="계좌번호 복사"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">예금주</label>
                  <p className="text-xl font-bold">{order.vactName}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">입금 기한</label>
                  <div className="flex items-center gap-2 text-blue-400">
                    <Calendar className="w-5 h-5" />
                    <p className="text-xl font-bold">
                      {new Date(order.vactInputDeadline!).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} 까지
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
              <p className="text-sm text-neutral-400 leading-relaxed">
                위 계좌는 고객님 전용 가상계좌입니다. <br />
                입금액이 일치하지 않으면 처리가 되지 않으니 주의해 주세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">주문번호</label>
            <p className="text-xl font-bold text-gray-900">{order.orderNumber}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">예상 배송일</label>
            <p className="text-xl font-bold text-blue-600">{deliveryStr}</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          안내사항
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• 주문 확인 후 영업일 기준 2-3일 내 배송됩니다.</li>
          <li>• {order.paymentMethod === 'virtual' ? '입금 확인 즉시' : '배송 시작 시'} SMS/이메일로 알림을 보내드립니다.</li>
          <li>• 증빙 서류가 필요한 경우 고객센터로 문의해주세요.</li>
        </ul>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/mypage/orders"
          className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-4 rounded-xl font-bold text-center shadow-lg transition-all"
        >
          주문 내역 보기
        </Link>
        <Link
          to="/"
          className="flex-1 bg-white border-2 border-neutral-900 text-neutral-900 hover:bg-neutral-50 py-4 rounded-xl font-bold text-center transition-all"
        >
          홈으로 가기
        </Link>
      </div>

      {/* Customer Service */}
      <div className="mt-12 text-center">
        <p className="text-gray-500 mb-1 text-sm">도움이 필요하시면 고객센터로 연락해주세요</p>
        <p className="text-2xl font-black text-gray-900">1588-1234</p>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Weekdays 09:00 - 18:00</p>
      </div>
    </div>
  );
}
