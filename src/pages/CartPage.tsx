import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Trash2, Plus, Minus, FileDown, ShoppingBag } from 'lucide-react';
import { storage } from '../lib/storage';
import { mockProducts } from '../lib/mockData';
import { CartItem } from '../types';

export function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(storage.getCart());
  }, []);

  const updateQuantity = (productId: string, newQuantity: number) => {
    const updatedCart = cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: Math.max(1, newQuantity) }
        : item
    );
    setCart(updatedCart);
    storage.setCart(updatedCart);
  };

  const toggleSubscription = (productId: string) => {
    const updatedCart = cart.map(item =>
      item.productId === productId
        ? { ...item, isSubscription: !item.isSubscription }
        : item
    );
    setCart(updatedCart);
    storage.setCart(updatedCart);
  };

  const removeItem = (productId: string) => {
    const updatedCart = cart.filter(item => item.productId !== productId);
    setCart(updatedCart);
    storage.setCart(updatedCart);
  };

  const getProductDetails = (productId: string) => {
    return mockProducts.find(p => p.id === productId);
  };

  const getTierPrice = (productId: string, quantity: number) => {
    const product = getProductDetails(productId);
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

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const exportQuote = () => {
    alert('견적서 PDF가 다운로드됩니다.');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="w-12 h-12 text-neutral-400" />
          </div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-3">
            장바구니가 비어있습니다
          </h2>
          <p className="text-sm text-neutral-600 mb-8">
            필요한 상품을 장바구니에 담아보세요
          </p>
          <Link
            to="/products"
            className="inline-block bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 font-medium transition-colors text-sm tracking-wide uppercase"
          >
            상품 둘러보기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8 lg:mb-12">
        <h1 className="text-3xl lg:text-4xl tracking-tight text-neutral-900 mb-2">장바구니</h1>
        <p className="text-sm text-neutral-600">총 {cart.length}개 상품</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => {
            const product = getProductDetails(item.productId);
            if (!product) return null;

            const unitPrice = getTierPrice(item.productId, item.quantity);
            const itemTotal = unitPrice * item.quantity * (item.isSubscription ? 0.95 : 1);

            return (
              <div
                key={item.productId}
                className="bg-white border border-neutral-200 p-6"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Product Image */}
                  <Link
                    to={`/products/${product.id}`}
                    className="w-full sm:w-24 aspect-square sm:aspect-auto sm:h-24 bg-neutral-100 overflow-hidden flex-shrink-0"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-neutral-500 mb-2 tracking-wide uppercase">{product.sku}</p>
                        <Link
                          to={`/products/${product.id}`}
                          className="text-lg font-bold tracking-tight text-neutral-900 hover:text-neutral-700"
                        >
                          {product.name}
                        </Link>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-10 h-10 border border-neutral-300 hover:border-neutral-900 flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4 text-neutral-700" />
                        </button>
                        <span className="w-12 text-center text-sm font-medium text-neutral-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-10 h-10 bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <span className="text-xs text-neutral-600 text-center sm:text-left">
                        단가: ₩{unitPrice.toLocaleString()}
                      </span>
                    </div>

                    {/* Subscription Toggle */}
                    <label className="flex items-center gap-2 mb-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isSubscription}
                        onChange={() => toggleSubscription(item.productId)}
                        className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                      />
                      <span className="text-sm text-neutral-700">
                        정기 배송 (5% 추가 할인)
                      </span>
                    </label>

                    {/* Item Total */}
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                      <span className="text-sm text-neutral-600">소계</span>
                      <span className="text-lg tracking-tight text-neutral-900">
                        ₩{itemTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-neutral-200 p-8 sticky top-24">
            <h2 className="text-xl tracking-tight text-neutral-900 mb-6">주문 요약</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm text-neutral-600">
                <span>상품 금액</span>
                <span>₩{calculateTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-600">
                <span>배송비</span>
                <span className="text-neutral-900">무료</span>
              </div>
              <div className="pt-4 border-t border-neutral-200">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-neutral-900">총 결제 금액</span>
                  <span className="text-2xl tracking-tight text-neutral-900">
                    ₩{calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-4 font-medium mb-3 transition-colors text-sm tracking-wide uppercase"
            >
              결제하기
            </button>

            <button
              onClick={exportQuote}
              className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 py-3 font-medium flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <FileDown className="w-5 h-5" />
              견적서 다운로드
            </button>

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-xs text-neutral-600 leading-relaxed">
                • 50만원 이상 구매 시 무료 배송
              </p>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                • 영업일 기준 2-3일 내 배송
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}