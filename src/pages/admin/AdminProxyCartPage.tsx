import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, Trash2, Loader2, ShoppingCart, CheckCircle,
  User, Package, PencilLine, Save, X, ArrowLeft
} from 'lucide-react';
import { cartService, proxyOrderService } from '../../services/cartService';
import { productService } from '../../services/productService';
import { CartItem, Product } from '../../types';
import { ProductImage } from '../../components/ui/ProductImage';
import { toast } from 'sonner';

// 편집 중인 custom_price 상태
interface PriceEdit {
  [cartItemId: string]: string;
}

export function AdminProxyCartPage() {
  const navigate = useNavigate();

  const customerId = proxyOrderService.getProxyCustomerId();
  const customerName = proxyOrderService.getProxyCustomerName();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [cartLoading, setCartLoading] = useState(true);

  // 상품 검색
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // 가격 편집
  const [priceEdits, setPriceEdits] = useState<PriceEdit>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingPrice, setSavingPrice] = useState<string | null>(null);

  // ── 초기 진입 체크 ────────────────────────────────────────
  useEffect(() => {
    if (!customerId) {
      navigate('/admin/members');
      return;
    }
    loadCart();
  }, [customerId]);

  const loadCart = useCallback(async () => {
    setCartLoading(true);
    try {
      const items = await cartService.getCart();
      setCart(items);

      if (items.length > 0) {
        const ids = [...new Set(items.map(i => i.productId))];
        const products = await Promise.all(ids.map(id => productService.getProductById(id)));
        const map: Record<string, Product> = {};
        products.forEach(p => { if (p) map[p.id] = p; });
        setProductsMap(map);
      }
    } catch (e) {
      toast.error('장바구니 로딩 실패');
    } finally {
      setCartLoading(false);
    }
  }, []);

  // ── 상품 검색 ─────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await productService.searchProducts(searchTerm);
        setSearchResults(results.slice(0, 8));
        setShowResults(true);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleAddProduct = async (product: Product) => {
    try {
      await cartService.addToCart(product.id, 1);
      setSearchTerm('');
      setShowResults(false);
      await loadCart();
      toast.success(`${product.name} 추가됨`);
    } catch (e) {
      toast.error('상품 추가 실패');
    }
  };

  // ── 수량 변경 ─────────────────────────────────────────────
  const handleQtyChange = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    try {
      await cartService.updateQuantity(item.id, newQty);
      await loadCart();
    } catch {
      toast.error('수량 변경 실패');
    }
  };

  // ── 항목 제거 ─────────────────────────────────────────────
  const handleRemove = async (cartItemId: string) => {
    try {
      await cartService.removeItem(cartItemId);
      await loadCart();
    } catch {
      toast.error('항목 제거 실패');
    }
  };

  // ── 협의 단가 저장 ────────────────────────────────────────
  const handleSavePrice = async (item: CartItem) => {
    const raw = priceEdits[item.id];
    const price = raw === '' || raw === undefined ? null : Number(raw.replace(/,/g, ''));

    if (price !== null && (isNaN(price) || price < 0)) {
      toast.error('올바른 금액을 입력하세요');
      return;
    }

    setSavingPrice(item.id);
    try {
      await cartService.updateCustomPrice(item.id, price);
      await loadCart();
      setEditingId(null);
      toast.success('협의 단가 저장됨');
    } catch {
      toast.error('단가 저장 실패');
    } finally {
      setSavingPrice(null);
    }
  };

  // ── 대리주문 완료 ─────────────────────────────────────────
  const handleComplete = () => {
    proxyOrderService.endProxy();
    toast.success(`${customerName}님 대리주문이 완료됐습니다. 고객에게 장바구니를 확인하도록 안내해주세요.`);
    navigate('/admin/members');
  };

  // ── 모드 종료 ─────────────────────────────────────────────
  const handleEndProxy = () => {
    proxyOrderService.endProxy();
    navigate('/admin/members');
  };

  // ── 합계 계산 ─────────────────────────────────────────────
  const calcTotal = () => cart.reduce((sum, item) => {
    const product = productsMap[item.productId];
    const price = item.customPrice ?? product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  if (!customerId) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/members')}
            className="p-2 hover:bg-neutral-100 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">대리주문</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{customerName}</span>
              <span className="text-xs text-neutral-400">고객의 장바구니에 상품을 담아드립니다</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleEndProxy}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-neutral-300 text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <X className="w-4 h-4" />
          대리주문 취소
        </button>
      </div>

      {/* 상품 검색 */}
      <div className="bg-white border border-neutral-200 p-6">
        <h3 className="text-sm font-bold text-neutral-700 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" />
          상품 추가
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="상품명 또는 SKU 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 text-sm focus:outline-none focus:border-neutral-900"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-neutral-400" />
          )}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 bg-white border border-neutral-200 shadow-lg mt-1 max-h-72 overflow-y-auto">
              {searchResults.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors text-left border-b border-neutral-100 last:border-0"
                >
                  <div className="w-10 h-10 bg-neutral-100 flex-shrink-0 overflow-hidden">
                    <ProductImage src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-neutral-400 font-mono">{product.sku}</div>
                    <div className="text-sm font-medium text-neutral-900 truncate">{product.name}</div>
                  </div>
                  <div className="text-sm font-bold text-neutral-900 shrink-0">
                    ₩{product.price.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 장바구니 */}
      <div className="bg-white border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-neutral-600" />
          <h3 className="text-sm font-bold text-neutral-700">담긴 상품</h3>
          <span className="text-xs text-neutral-400">({cart.length}종)</span>
        </div>

        {cartLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : cart.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-sm">
            담긴 상품이 없습니다. 위에서 상품을 검색해 추가하세요.
          </div>
        ) : (
          <>
            {/* 테이블 헤더 */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-2.5 bg-neutral-50 border-b border-neutral-100 text-xs font-bold text-neutral-500 uppercase tracking-wider">
              <span>상품</span>
              <span className="text-right">정상 단가</span>
              <span className="text-center">수량</span>
              <span className="text-right">협의 단가</span>
              <span />
            </div>

            <div className="divide-y divide-neutral-100">
              {cart.map(item => {
                const product = productsMap[item.productId];
                const basePrice = product?.price ?? 0;
                const effectivePrice = item.customPrice ?? basePrice;
                const isEditing = editingId === item.id;

                return (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-6 py-4">
                    {/* 상품 정보 */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-neutral-50 border border-neutral-100 flex-shrink-0 overflow-hidden">
                        {product && (
                          <ProductImage src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-1" />
                        )}
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-400 font-mono">{product?.sku}</div>
                        <div className="text-sm font-medium text-neutral-900">{product?.name ?? item.productId}</div>
                      </div>
                    </div>

                    {/* 정상 단가 */}
                    <div className="text-right text-sm text-neutral-500">
                      ₩{basePrice.toLocaleString()}
                    </div>

                    {/* 수량 */}
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleQtyChange(item, -1)}
                        className="w-7 h-7 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 flex items-center justify-center text-sm"
                      >−</button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQtyChange(item, 1)}
                        className="w-7 h-7 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 flex items-center justify-center text-sm"
                      >+</button>
                    </div>

                    {/* 협의 단가 */}
                    <div className="flex items-center justify-end gap-1.5">
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            autoFocus
                            defaultValue={item.customPrice ?? basePrice}
                            onChange={e => setPriceEdits(p => ({ ...p, [item.id]: e.target.value }))}
                            className="w-28 border border-blue-300 px-2 py-1 text-sm text-right focus:outline-none focus:border-blue-500"
                            placeholder="단가"
                          />
                          <button
                            onClick={() => handleSavePrice(item)}
                            disabled={savingPrice === item.id}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            {savingPrice === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-neutral-400 hover:bg-neutral-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setEditingId(item.id); setPriceEdits(p => ({ ...p, [item.id]: String(item.customPrice ?? '') })); }}
                          className="flex items-center gap-1.5 group"
                        >
                          <span className={`text-sm font-bold ${item.customPrice != null ? 'text-blue-700' : 'text-neutral-900'}`}>
                            ₩{effectivePrice.toLocaleString()}
                          </span>
                          {item.customPrice != null && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 font-bold">협의가</span>
                          )}
                          <PencilLine className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-600 transition-colors" />
                        </button>
                      )}
                    </div>

                    {/* 삭제 */}
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 합계 + 완료 버튼 */}
            <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div>
                <span className="text-xs text-neutral-500 mr-2">예상 합계</span>
                <span className="text-xl font-black text-neutral-900">₩{calcTotal().toLocaleString()}</span>
              </div>
              <button
                onClick={handleComplete}
                disabled={cart.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-700 transition-colors disabled:opacity-40"
              >
                <CheckCircle className="w-4 h-4" />
                대리주문 완료 · 고객 안내
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
