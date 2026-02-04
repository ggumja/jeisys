import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { CreditCard, Building2, Wallet, Plus, ChevronDown, ArrowLeft } from 'lucide-react';
import { storage } from '../lib/storage';
import { mockProducts } from '../lib/mockData';

export function CheckoutPage() {
  const navigate = useNavigate();
  const cart = storage.getCart();
  const user = storage.getUser();
  
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'virtual' | 'loan'>('credit');
  const [selectedCard, setSelectedCard] = useState('신한 4402-****-****');
  const [deliveryMemo, setDeliveryMemo] = useState('');

  const getTierPrice = (productId: string, quantity: number) => {
    const product = mockProducts.find(p => p.id === productId);
    if (!product) return 0;
    
    const tier = [...product.tierPricing]
      .reverse()
      .find(t => quantity >= t.quantity);
    
    return tier?.unitPrice || product.price;
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const unitPrice = getTierPrice(item.productId, item.quantity);
      const discount = item.isSubscription ? 0.95 : 1;
      return sum + unitPrice * item.quantity * discount;
    }, 0);
  };

  const handleOrder = () => {
    // Create order
    const orderId = 'ORD-' + Date.now();
    
    // Clear cart
    storage.setCart([]);
    
    // Navigate to completion page
    navigate(`/order-complete/${orderId}`);
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const total = calculateTotal();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const firstProduct = mockProducts.find(p => p.id === cart[0].productId);

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 lg:py-12">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/cart')}
        className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        장바구니로 돌아가기
      </button>

      <div className="mb-8 lg:mb-12">
        <h1 className="text-3xl lg:text-4xl tracking-tight text-neutral-900 mb-2">결제하기</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Items */}
          <div className="bg-white border border-neutral-200 p-8">
            <h2 className="text-xl tracking-tight text-neutral-900 mb-6">주문 상품</h2>
            
            <div className="space-y-4">
              {cart.map(item => {
                const product = mockProducts.find(p => p.id === item.productId);
                if (!product) return null;

                const unitPrice = getTierPrice(item.productId, item.quantity);
                const itemTotal = unitPrice * item.quantity * (item.isSubscription ? 0.95 : 1);

                return (
                  <div
                    key={item.productId}
                    className="flex gap-4 pb-4 border-b border-neutral-200 last:border-0 last:pb-0"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-neutral-100 overflow-hidden flex-shrink-0">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-500 mb-1 tracking-wide uppercase">{product.sku}</p>
                      <h3 className="text-sm font-medium tracking-tight text-neutral-900 mb-2">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-neutral-600">
                          <span>수량: {item.quantity}개</span>
                          {item.isSubscription && (
                            <span className="ml-2 text-blue-600">• 정기배송</span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-neutral-900">
                          ₩{itemTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white border border-neutral-200 p-8">
            <h2 className="text-xl tracking-tight text-neutral-900 mb-6">결제 수단</h2>
            
            <div className="space-y-4">
              {/* Loan Payment */}
              <label
                className={`flex items-start gap-4 p-6 border-2 cursor-pointer transition-all ${
                  paymentMethod === 'loan'
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-neutral-200 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="loan"
                  checked={paymentMethod === 'loan'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mt-0.5 w-5 h-5 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-5 h-5 text-neutral-700" />
                    <span className="font-medium text-neutral-900">여신(외상) 거래</span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    가능 잔액: 5,400,000원
                  </p>
                </div>
              </label>

              {/* Card Payment */}
              <div
                className={`border-2 transition-all ${
                  paymentMethod === 'credit'
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-neutral-200 bg-white'
                }`}
              >
                <label className="flex items-start gap-4 p-6 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="credit"
                    checked={paymentMethod === 'credit'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="mt-0.5 w-5 h-5 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-5 h-5 text-neutral-700" />
                      <span className="font-medium text-neutral-900">등록 법인카드</span>
                    </div>
                    
                    {paymentMethod === 'credit' && (
                      <div className="mt-4 space-y-3">
                        <div className="relative">
                          <select
                            value={selectedCard}
                            onChange={(e) => setSelectedCard(e.target.value)}
                            className="w-full px-4 py-3 pr-10 border border-neutral-300 appearance-none bg-white text-sm focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                          >
                            <option value="신한 4402-****-****">신한 4402-****-****</option>
                            <option value="국민 5533-****-****">국민 5533-****-****</option>
                            <option value="삼성 6677-****-****">삼성 6677-****-****</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        </div>
                        
                        <button className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-900">
                          <Plus className="w-4 h-4" />
                          카드 추가하기
                        </button>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Virtual Account */}
              <label
                className={`flex items-start gap-4 p-6 border-2 cursor-pointer transition-all ${
                  paymentMethod === 'virtual'
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-neutral-200 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="virtual"
                  checked={paymentMethod === 'virtual'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mt-0.5 w-5 h-5 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-5 h-5 text-neutral-700" />
                    <span className="font-medium text-neutral-900">가상계좌</span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    입금 확인 후 배송
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Delivery Memo */}
          <div className="bg-white border border-neutral-200 p-8">
            <h2 className="text-xl tracking-tight text-neutral-900 mb-6">배송 메모</h2>
            <textarea
              value={deliveryMemo}
              onChange={(e) => setDeliveryMemo(e.target.value)}
              placeholder="배송 시 요청사항을 입력해주세요 (선택)"
              rows={4}
              className="w-full px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none text-sm"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-neutral-200 p-8 sticky top-24">
            <h2 className="text-xl tracking-tight text-neutral-900 mb-6">결제 정보</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm text-neutral-600">
                <span>상품 금액</span>
                <span>₩{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-600">
                <span>배송비</span>
                <span className="text-neutral-900">무료</span>
              </div>
              <div className="pt-4 border-t border-neutral-200">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-neutral-900">총 결제 금액</span>
                  <span className="text-2xl tracking-tight text-neutral-900">
                    ₩{total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleOrder}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-4 font-medium transition-colors text-sm tracking-wide uppercase mb-4"
            >
              ₩{total.toLocaleString()} 즉시 결제
            </button>

            <div className="pt-6 border-t border-neutral-200">
              <p className="text-xs text-neutral-600 leading-relaxed">
                결제 진행 시 구매 조건 및 개인정보 처리방침에 동의하게 됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}