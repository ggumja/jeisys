import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Trash2, Plus, Minus, FileDown, ShoppingBag, Loader2, Package, Check } from 'lucide-react';
import { cartService } from '../services/cartService';
import { productService } from '../services/productService';
import { CartItem, Product } from '../types';
import { ProductImage } from '../components/ui/ProductImage';

export function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const items = await cartService.getCart();
      setCart(items);

      if (items.length > 0) {
        const allProductIds = new Set<string>();
        items.forEach(item => {
          allProductIds.add(item.productId);
          item.selectedProductIds?.forEach(id => allProductIds.add(id));
        });

        const productPromises = Array.from(allProductIds).map(id => productService.getProductById(id));
        const products = await Promise.all(productPromises);

        const map: Record<string, Product> = {};
        products.forEach(p => {
          if (p) map[p.id] = p;
        });
        setProductsMap(map);
      }
    } catch (error) {
      console.error('Failed to load cart', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemKey = (item: CartItem) => {
    return item.id;
  };

  const updateQuantity = async (item: CartItem, newQuantity: number) => {
    const product = productsMap[item.productId];
    const minQty = product?.minOrderQuantity || 1;
    const maxQty = product?.maxOrderQuantity;

    if (newQuantity < minQty) {
      alert(`최소 주문 수량이 ${minQty}개인 상품입니다.`);
      return;
    }
    if (maxQty !== undefined && newQuantity > maxQty) {
      alert(`최대 주문 수량이 ${maxQty}개인 상품입니다.`);
      return;
    }

    try {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: newQuantity } : c));
      await cartService.updateQuantity(item.id, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity', error);
      loadCart();
    }
  };

  const toggleSubscription = async (item: CartItem) => {
    try {
      const newState = !item.isSubscription;
      setCart(cart.map(c => c.id === item.id ? { ...c, isSubscription: newState } : c));
      await cartService.updateSubscription(item.id, newState);
    } catch (error) {
      console.error('Failed to toggle subscription', error);
      loadCart();
    }
  };

  const removeItem = async (item: CartItem) => {
    try {
      setCart(cart.filter(c => c.id !== item.id));
      await cartService.removeItem(item.id);
    } catch (error) {
      console.error('Failed to remove item', error);
      loadCart();
    }
  };

  const getTierPrice = (item: CartItem) => {
    const product = productsMap[item.productId];
    if (!product) return 0;
    const salesUnit = product.salesUnit || 1;

    if (item.optionId) {
      const option = product.options?.find(opt => opt.id === item.optionId);
      if (option) {
        const discountRate = option.discountRate / 100;
        return (product.price * (1 - discountRate)) / salesUnit;
      }
    }

    const tier = [...product.tierPricing]
      .sort((a, b) => b.quantity - a.quantity)
      .find(t => item.quantity >= t.quantity);

    return (tier?.unitPrice || product.price) / salesUnit;
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const product = productsMap[item.productId];
      const unitPrice = getTierPrice(item);
      const subDiscount = (product?.subscriptionDiscount || 0) / 100;
      const discount = item.isSubscription ? (1 - subDiscount) : 1;
      return sum + unitPrice * item.quantity * discount;
    }, 0);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const exportQuote = () => {
    alert('견적서 PDF가 다운로드됩니다.');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

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
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => {
            const product = productsMap[item.productId];
            if (!product) return null;

            const unitPrice = getTierPrice(item);
            const subDiscount = (product?.subscriptionDiscount || 0) / 100;
            const itemTotal = unitPrice * item.quantity * (item.isSubscription ? (1 - subDiscount) : 1);

            return (
              <div
                key={getItemKey(item)}
                className="bg-white border border-neutral-200 p-6"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  <Link
                    to={`/products/${product.id}`}
                    className="w-full sm:w-24 aspect-square sm:aspect-auto sm:h-24 bg-neutral-100 overflow-hidden flex-shrink-0"
                  >
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-neutral-500 mb-2 tracking-wide uppercase">{product.sku}</p>
                        <Link
                          to={`/products/${product.id}`}
                          className="text-lg font-bold tracking-tight text-neutral-900 hover:text-neutral-700 block mb-2"
                        >
                          {product.name}
                        </Link>
                        
                        <div className="text-sm mb-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-neutral-900">
                                ₩{itemTotal.toLocaleString()}
                              </span>
                              <span className="text-sm text-neutral-500 font-medium">
                                ({unitPrice.toLocaleString()}원 × {item.quantity}개)
                              </span>
                            </div>
                            {unitPrice < (product.price / (product.salesUnit || 1)) && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-neutral-400 line-through">정상가(개당): ₩{(product.price / (product.salesUnit || 1)).toLocaleString()}</span>
                                <span className="text-red-500 font-bold">
                                  {Math.round((1 - unitPrice / (product.price / (product.salesUnit || 1))) * 100)}% 할인 적용
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {item.selectedProductIds && item.selectedProductIds.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-semibold text-neutral-900">패키지 구성:</p>
                            <ul className="text-xs text-neutral-600 space-y-0.5">
                              {(() => {
                                const counts: Record<string, number> = {};
                                item.selectedProductIds?.forEach(id => {
                                  counts[id] = (counts[id] || 0) + 1;
                                });
                                
                                return Object.entries(counts).map(([id, count], idx) => {
                                  const name = productsMap[id]?.name || '로딩 중...';
                                  return (
                                    <li key={idx} className="flex items-center gap-1">
                                      <span>• {name}</span>
                                      <span className="font-bold text-neutral-900">x {count} ea</span>
                                    </li>
                                  );
                                });
                              })()}
                            </ul>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item)}
                        className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
                      {!item.optionId && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item, item.quantity - (product.salesUnit || 1))}
                            disabled={item.quantity <= (product.minOrderQuantity || 1) || (product.maxOrderQuantity !== undefined && product.minOrderQuantity === product.maxOrderQuantity)}
                            className={`w-10 h-10 border border-neutral-300 flex items-center justify-center transition-colors ${
                              item.quantity <= (product.minOrderQuantity || 1) || (product.maxOrderQuantity !== undefined && product.minOrderQuantity === product.maxOrderQuantity)
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:border-neutral-900 group-hover:bg-neutral-50'
                            }`}
                          >
                            <Minus className="w-4 h-4 text-neutral-700" />
                          </button>
                          <span className="w-12 text-center text-sm font-medium text-neutral-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item, item.quantity + (product.salesUnit || 1))}
                            disabled={(product.maxOrderQuantity !== undefined && item.quantity >= product.maxOrderQuantity) || (product.maxOrderQuantity !== undefined && product.minOrderQuantity === product.maxOrderQuantity)}
                            className={`w-10 h-10 flex items-center justify-center transition-colors ${
                              (product.maxOrderQuantity !== undefined && item.quantity >= product.maxOrderQuantity) || (product.maxOrderQuantity !== undefined && product.minOrderQuantity === product.maxOrderQuantity)
                                ? 'bg-neutral-200 cursor-not-allowed opacity-50' 
                                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                            }`}
                          >
                            <Plus className={`w-4 h-4 ${((product.maxOrderQuantity !== undefined && item.quantity >= product.maxOrderQuantity) || (product.maxOrderQuantity !== undefined && product.minOrderQuantity === product.maxOrderQuantity)) ? 'text-neutral-500' : 'text-white'}`} />
                          </button>
                        </div>
                      )}
                    </div>

                    {product.bonusItems && product.bonusItems.filter(bi => bi.optionId === (item.optionId || null)).length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-sm">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Package className="w-3.5 h-3.5 text-blue-600" />
                          <h4 className="text-xs font-bold text-blue-900">
                            {item.optionId ? 'SET 전용 추가 증정' : '추가 증정 혜택'}
                          </h4>
                        </div>
                        <ul className="space-y-1">
                          {product.bonusItems
                            .filter(bi => bi.optionId === (item.optionId || null))
                            .map((bi) => {
                              const displayQuantity = bi.calculationMethod === 'ratio'
                                ? Math.ceil(item.quantity * (bi.percentage || 0) / 100)
                                : bi.quantity;
                                
                              return (
                                <li key={bi.id} className="text-[11px] text-blue-800 flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <Check className="w-3 h-3 text-blue-500" />
                                    <span>{bi.product?.name}</span>
                                  </div>
                                  <span className="font-bold ml-2">
                                    {displayQuantity} EA
                                    {bi.calculationMethod === 'ratio' && (
                                      <span className="text-[9px] ml-1 opacity-70">(비율)</span>
                                    )}
                                  </span>
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    )}

                    {(product.subscriptionDiscount ?? 0) > 0 && (
                      <label className="flex items-center gap-2 mb-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isSubscription}
                          onChange={() => toggleSubscription(item)}
                          className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                        />
                        <span className="text-sm text-neutral-700">
                          정기 배송 ({product.subscriptionDiscount}% 추가 할인)
                        </span>
                      </label>
                    )}

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