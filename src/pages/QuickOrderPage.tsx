import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Clock, TrendingUp, Plus, Minus, ShoppingCart } from 'lucide-react';
import { mockProducts, mockPurchaseHistory } from '../lib/mockData';
import { storage } from '../lib/storage';

export function QuickOrderPage() {
  const navigate = useNavigate();
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  const frequentProducts = mockProducts
    .filter(p => mockPurchaseHistory.map(ph => ph.productId).includes(p.id))
    .map(p => ({
      ...p,
      frequency: mockPurchaseHistory.find(ph => ph.productId === p.id)?.frequency || 0,
      lastPurchaseDate: mockPurchaseHistory.find(ph => ph.productId === p.id)?.lastPurchaseDate,
    }))
    .sort((a, b) => b.frequency - a.frequency);

  const updateQuantity = (productId: string, change: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 0;
      const newValue = Math.max(0, current + change);
      return { ...prev, [productId]: newValue };
    });
  };

  const addAllToCart = () => {
    const cart = storage.getCart();
    Object.entries(quantities).forEach(([productId, quantity]) => {
      if (quantity > 0) {
        const existingItem = cart.find(item => item.productId === productId);
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          cart.push({ productId, quantity, isSubscription: false });
        }
      }
    });
    storage.setCart(cart);
    navigate('/cart');
  };

  const totalItems = Object.values(quantities).reduce((sum, q) => sum + q, 0);
  const totalAmount = Object.entries(quantities).reduce((sum, [productId, quantity]) => {
    const product = mockProducts.find(p => p.id === productId);
    return sum + (product?.price || 0) * quantity;
  }, 0);

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8 lg:mb-12">
        <h1 className="text-3xl lg:text-4xl tracking-tight text-neutral-900 mb-2">반복 구매 상품</h1>
        <p className="text-base text-neutral-600">
          자주 구매하시는 소모품을 빠르게 재주문하세요
        </p>
      </div>

      {/* Quick Add Section */}
      <div className="space-y-4">
        {frequentProducts.map(product => (
          <div
            key={product.id}
            className="bg-white border border-neutral-200 p-6 hover:border-neutral-900 transition-all"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Product Image */}
              <div className="w-full sm:w-24 aspect-square sm:aspect-auto sm:h-24 bg-neutral-100 overflow-hidden flex-shrink-0">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-500 mb-2 tracking-wide uppercase">{product.sku}</p>
                    <h3 className="text-lg font-bold tracking-tight text-neutral-900 mb-2">{product.name}</h3>
                    <p className="text-lg tracking-tight text-neutral-900">
                      ₩{product.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Purchase Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 mb-6">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>구매 {product.frequency}회</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>최근: {product.lastPurchaseDate}</span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(product.id, -1)}
                      className="w-10 h-10 border border-neutral-300 hover:border-neutral-900 flex items-center justify-center transition-colors disabled:opacity-30"
                      disabled={!quantities[product.id]}
                    >
                      <Minus className="w-5 h-5 text-neutral-700" />
                    </button>
                    <div className="w-16 text-center">
                      <span className="text-xl font-light tracking-tight text-neutral-900">
                        {quantities[product.id] || 0}
                      </span>
                    </div>
                    <button
                      onClick={() => updateQuantity(product.id, 1)}
                      className="w-10 h-10 bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {quantities[product.id] > 0 && (
                    <div className="text-sm text-neutral-600">
                      소계: ₩{((quantities[product.id] || 0) * product.price).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg z-40">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-600">
                  총 {totalItems}개 상품
                </p>
                <p className="text-2xl font-light tracking-tight text-neutral-900">
                  ₩{totalAmount.toLocaleString()}
                </p>
              </div>
              <button
                onClick={addAllToCart}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 font-medium flex items-center gap-2 transition-colors text-sm tracking-wide uppercase"
              >
                <ShoppingCart className="w-5 h-5" />
                장바구니에 담기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {frequentProducts.length === 0 && (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShoppingCart className="w-12 h-12 text-neutral-400" />
          </div>
          <h3 className="text-xl tracking-tight text-neutral-900 mb-3">
            구매 이력이 없습니다
          </h3>
          <p className="text-sm text-neutral-600 mb-8">
            첫 주문을 시작해보세요
          </p>
          <button
            onClick={() => navigate('/products')}
            className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 font-medium transition-colors text-sm tracking-wide uppercase"
          >
            상품 둘러보기
          </button>
        </div>
      )}

      {totalItems > 0 && <div className="h-32" />}
    </div>
  );
}