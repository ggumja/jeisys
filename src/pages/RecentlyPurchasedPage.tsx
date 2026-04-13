import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import {
  ShoppingCart, Loader2, Package, Clock,
  ChevronRight, Search, BarChart2, Check
} from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { ProductImage } from '../components/ui/ProductImage';
import { cartService } from '../services/cartService';
import { Product } from '../types';
import { useModal } from '../context/ModalContext';

// 유효 구매로 인정할 주문 상태
const VALID_STATUSES = new Set([
  'paid', 'processing', 'partially_shipped', 'shipped', 'delivered',
  'return_requested', 'returning', 'exchange_requested', 'partially_refunded',
]);

interface RecentProduct {
  product: Product;
  lastOrderDate: string;
  lastOrderNumber: string;
  totalQty: number;
  purchaseCount: number;
  optionId?: string;
  optionName?: string;
  selectedProductIds?: string[];
}

export function RecentlyPurchasedPage() {
  const { alert } = useModal();
  const { data: orders, isLoading } = useOrders();
  const [search, setSearch] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);

  // 주문 이력에서 고유 상품 추출 (상품 ID + 옵션 ID 기준)
  const recentProducts = useMemo<RecentProduct[]>(() => {
    if (!orders) return [];

    const map = new Map<string, RecentProduct>();

    // 최신순 정렬
    const sorted = [...orders]
      .filter(o => VALID_STATUSES.has(o.status))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sorted.forEach(order => {
      order.items.forEach(item => {
        if (!item.product) return;
        const key = `${item.product.id}__${item.optionId || ''}`;
        if (map.has(key)) {
          const existing = map.get(key)!;
          existing.totalQty += item.quantity;
          existing.purchaseCount += 1;
        } else {
          map.set(key, {
            product: item.product,
            lastOrderDate: order.date,
            lastOrderNumber: order.orderNumber,
            totalQty: item.quantity,
            purchaseCount: 1,
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
    if (!search.trim()) return recentProducts;
    const q = search.toLowerCase();
    return recentProducts.filter(
      rp => rp.product.name.toLowerCase().includes(q) || rp.product.sku.toLowerCase().includes(q)
    );
  }, [recentProducts, search]);

  const handleAddToCart = async (rp: RecentProduct) => {
    const key = `${rp.product.id}__${rp.optionId || ''}`;
    try {
      setAddingId(key);
      const qty = rp.product.minOrderQuantity || rp.product.salesUnit || 1;
      await cartService.addToCart(
        rp.product.id,
        qty,
        false,
        rp.selectedProductIds,
        rp.optionId,
        rp.optionName,
      );
      setAddedIds(prev => new Set([...prev, key]));
      setTimeout(() => {
        setAddedIds(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 2000);
    } catch {
      await alert('장바구니 추가에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setAddingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl tracking-tight text-neutral-900 font-bold">최근 구매 상품</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            구매 이력 기반 {recentProducts.length}개 상품
          </p>
        </div>

        {/* 검색 */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="상품명 또는 SKU 검색"
            className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all placeholder:text-neutral-300"
          />
        </div>
      </div>

      {/* 통계 배너 */}
      {recentProducts.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              label: '구매 상품 종류',
              value: `${recentProducts.length}종`,
              icon: Package,
            },
            {
              label: '최근 구매일',
              value: recentProducts[0] ? formatDate(recentProducts[0].lastOrderDate) : '-',
              icon: Clock,
            },
            {
              label: '총 구매 횟수',
              value: `${recentProducts.reduce((s, r) => s + r.purchaseCount, 0)}회`,
              icon: BarChart2,
            },
          ].map(stat => (
            <div key={stat.label} className="bg-neutral-50 border border-neutral-200 px-4 py-3 flex items-center gap-3">
              <stat.icon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wide">{stat.label}</p>
                <p className="text-sm font-bold text-neutral-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상품 없음 */}
      {recentProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
            <Package className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-2">구매 이력이 없습니다</h3>
          <p className="text-sm text-neutral-500 mb-6">상품을 구매하시면 이곳에서 빠르게 재주문할 수 있습니다.</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 text-sm font-medium transition-colors"
          >
            상품 둘러보기 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 text-sm">검색 결과가 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(rp => {
            const key = `${rp.product.id}__${rp.optionId || ''}`;
            const isAdded = addedIds.has(key);
            const isAdding = addingId === key;

            return (
              <div
                key={key}
                className="bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-sm transition-all group"
              >
                <div className="flex gap-4 p-4">
                  {/* 썸네일 */}
                  <Link
                    to={`/products/${rp.product.id}`}
                    className="w-20 h-20 flex-shrink-0 bg-neutral-50 border border-neutral-100 overflow-hidden"
                  >
                    <ProductImage
                      src={rp.product.imageUrl}
                      alt={rp.product.name}
                      className="w-full h-full object-contain"
                    />
                  </Link>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-neutral-400 tracking-wide uppercase mb-0.5">{rp.product.sku}</p>
                    <Link
                      to={`/products/${rp.product.id}`}
                      className="text-sm font-bold text-neutral-900 hover:text-neutral-600 transition-colors block leading-snug mb-1.5 truncate"
                    >
                      {rp.product.name}
                      {rp.optionName && (
                        <span className="ml-1.5 text-[10px] font-normal text-neutral-500">({rp.optionName})</span>
                      )}
                    </Link>

                    {/* 가격 */}
                    <p className="text-sm font-bold text-neutral-900 mb-2">
                      ₩{rp.product.price.toLocaleString()}
                    </p>

                    {/* 구매 통계 */}
                    <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(rp.lastOrderDate)}
                      </span>
                      <span className="text-neutral-200">·</span>
                      <span>{rp.purchaseCount}회 구매</span>
                      <span className="text-neutral-200">·</span>
                      <span>총 {rp.totalQty}개</span>
                    </div>
                  </div>
                </div>

                {/* 하단 버튼 영역 */}
                <div className="border-t border-neutral-100 flex">
                  <Link
                    to={`/products/${rp.product.id}`}
                    className="flex-1 py-2.5 text-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors text-center flex items-center justify-center gap-1.5"
                  >
                    상품 상세 <ChevronRight className="w-3 h-3" />
                  </Link>
                  <div className="w-px bg-neutral-100" />
                  <button
                    onClick={() => handleAddToCart(rp)}
                    disabled={isAdding || isAdded}
                    className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isAdded
                        ? 'bg-green-50 text-green-600'
                        : 'bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-50'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> 담김
                      </>
                    ) : isAdding ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5" /> 장바구니
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
