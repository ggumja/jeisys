import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Clock, TrendingUp, Plus, Minus, ShoppingCart,
  Loader2, RotateCcw, Search, Package
} from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { ProductImage } from '../components/ui/ProductImage';
import { cartService } from '../services/cartService';
import { Product } from '../types';

// 유효 구매 상태
const VALID_STATUSES = new Set([
  'paid', 'processing', 'partially_shipped', 'shipped', 'delivered',
  'return_requested', 'exchange_requested', 'partially_refunded',
]);

interface RecentItem {
  key: string;
  product: Product;
  lastOrderDate: string;
  purchaseCount: number;
  lastQty: number;
  optionId?: string;
  optionName?: string;
  selectedProductIds?: string[];
}

export function QuickOrderPage() {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useOrders();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');

  // 주문 이력에서 고유 상품 추출
  const recentItems = useMemo<RecentItem[]>(() => {
    if (!orders) return [];

    const map = new Map<string, RecentItem>();

    const sorted = [...orders]
      .filter(o => VALID_STATUSES.has(o.status))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sorted.forEach(order => {
      order.items.forEach(item => {
        if (!item.product) return;
        const key = `${item.product.id}__${item.optionId || ''}`;
        if (map.has(key)) {
          const ex = map.get(key)!;
          ex.purchaseCount += 1;
        } else {
          map.set(key, {
            key,
            product: item.product,
            lastOrderDate: order.date,
            purchaseCount: 1,
            lastQty: item.quantity,
            optionId: item.optionId,
            optionName: item.optionName,
            selectedProductIds: item.selectedProductIds,
          });
        }
      });
    });

    return Array.from(map.values());
  }, [orders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return recentItems;
    const q = search.toLowerCase();
    return recentItems.filter(
      r => r.product.name.toLowerCase().includes(q) || r.product.sku.toLowerCase().includes(q)
    );
  }, [recentItems, search]);

  const updateQty = (key: string, delta: number, min = 0) => {
    setQuantities(prev => {
      const cur = prev[key] ?? 0;
      return { ...prev, [key]: Math.max(min, cur + delta) };
    });
  };

  const setDefault = (key: string, rp: RecentItem) => {
    const unit = rp.product.salesUnit || 1;
    const min = rp.product.minOrderQuantity || unit;
    setQuantities(prev => ({ ...prev, [key]: prev[key] ?? min }));
  };

  const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0);
  const totalAmount = filtered.reduce((s, rp) => {
    const q = quantities[rp.key] || 0;
    return s + q * rp.product.price;
  }, 0);

  const handleAddAll = async () => {
    const toAdd = filtered.filter(rp => (quantities[rp.key] || 0) > 0);
    if (toAdd.length === 0) return;

    try {
      setIsAdding(true);
      for (const rp of toAdd) {
        await cartService.addToCart(
          rp.product.id,
          quantities[rp.key],
          false,
          rp.selectedProductIds,
          rp.optionId,
          rp.optionName,
        );
      }
      navigate('/cart');
    } catch {
      alert('장바구니 추가 중 오류가 발생했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-8 lg:py-12">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-10">
        <div>
          <h1 className="text-3xl lg:text-4xl tracking-tight text-neutral-900 mb-2">최근 구매 상품</h1>
          <p className="text-base text-neutral-600">
            구매 이력 기반으로 소모품을 빠르게 재주문하세요
          </p>
        </div>

        {/* 검색 */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="상품명 또는 SKU"
            className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all placeholder:text-neutral-300"
          />
        </div>
      </div>

      {/* 빈 상태 */}
      {recentItems.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShoppingCart className="w-12 h-12 text-neutral-400" />
          </div>
          <h3 className="text-xl tracking-tight text-neutral-900 mb-3">구매 이력이 없습니다</h3>
          <p className="text-sm text-neutral-600 mb-8">첫 주문을 시작해보세요</p>
          <Link
            to="/products"
            className="inline-block bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 font-medium transition-colors text-sm tracking-wide uppercase"
          >
            상품 둘러보기
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-neutral-400 text-sm">검색 결과가 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(rp => {
            const qty = quantities[rp.key] ?? 0;
            const unit = rp.product.salesUnit || 1;
            const minQty = rp.product.minOrderQuantity || unit;
            const maxQty = rp.product.maxOrderQuantity;

            return (
              <div
                key={rp.key}
                className="bg-white border border-neutral-200 hover:border-neutral-400 transition-all"
              >
                <div className="flex items-start gap-5 p-5">
                  {/* 썸네일 */}
                  <Link
                    to={`/products/${rp.product.id}`}
                    className="w-24 h-24 flex-shrink-0 bg-neutral-50 border border-neutral-100 overflow-hidden"
                  >
                    <ProductImage
                      src={rp.product.imageUrl}
                      alt={rp.product.name}
                      className="w-full h-full object-contain"
                    />
                  </Link>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-400 tracking-wide uppercase mb-0.5">{rp.product.sku}</p>
                    <Link
                      to={`/products/${rp.product.id}`}
                      className="text-base font-bold tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors block mb-0.5 leading-snug"
                    >
                      {rp.product.name}
                    </Link>
                    {rp.optionName && (
                      <p className="text-xs text-neutral-500 mb-1">{rp.optionName}</p>
                    )}
                    <p className="text-base font-bold text-neutral-900 mb-3">
                      ₩{rp.product.price.toLocaleString()}
                    </p>

                    {/* 구매 통계 */}
                    <div className="flex flex-wrap gap-3 text-xs text-neutral-500 mb-4">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> {rp.purchaseCount}회 구매
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {formatDate(rp.lastOrderDate)}
                      </span>
                      {unit > 1 && (
                        <span className="text-neutral-400">(구매단위: {unit}개)</span>
                      )}
                    </div>

                    {/* 수량 컨트롤 */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQty(rp.key, -unit, minQty)}
                        disabled={qty <= minQty || qty === 0}
                        className="w-9 h-9 border border-neutral-300 hover:border-neutral-900 flex items-center justify-center transition-colors disabled:opacity-30 flex-shrink-0"
                      >
                        <Minus className="w-3.5 h-3.5 text-neutral-700" />
                      </button>
                      <span
                        className="w-10 text-center text-lg font-medium tracking-tight text-neutral-900 cursor-default"
                        onClick={() => setDefault(rp.key, rp)}
                      >
                        {qty}
                      </span>
                      <button
                        onClick={() => {
                          if (qty === 0) setDefault(rp.key, rp);
                          else updateQty(rp.key, unit);
                        }}
                        disabled={!!maxQty && qty >= maxQty}
                        className="w-9 h-9 bg-neutral-900 hover:bg-neutral-700 flex items-center justify-center transition-colors disabled:opacity-30 flex-shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 text-white" />
                      </button>

                      {qty > 0 && (
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <span className="font-bold text-neutral-900">
                            ₩{(qty * rp.product.price).toLocaleString()}
                          </span>
                          <button
                            onClick={() => setQuantities(p => ({ ...p, [rp.key]: 0 }))}
                            className="text-neutral-300 hover:text-red-400 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 하단 한 개 바로 담기 */}
                {qty === 0 && (
                  <div
                    className="border-t border-neutral-100 px-5 py-2.5 flex items-center justify-end cursor-pointer hover:bg-neutral-50 transition-colors"
                    onClick={() => setDefault(rp.key, rp)}
                  >
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> 수량 선택
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 하단 일괄 담기 바 */}
      {totalItems > 0 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-xl z-40">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-neutral-500 mb-0.5">
                  {filtered.filter(r => (quantities[r.key] || 0) > 0).length}종 {totalItems}개 선택
                </p>
                <p className="text-2xl font-bold tracking-tight text-neutral-900">
                  ₩{totalAmount.toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleAddAll}
                disabled={isAdding}
                className="bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white px-8 py-4 font-medium flex items-center gap-2 transition-colors text-sm tracking-wide uppercase"
              >
                {isAdding
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <ShoppingCart className="w-5 h-5" />}
                장바구니에 담기
              </button>
            </div>
          </div>
        </div>
      )}

      {totalItems > 0 && <div className="h-32" />}
    </div>
  );
}