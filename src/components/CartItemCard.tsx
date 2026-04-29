import { Link } from 'react-router';
import { Trash2, Minus, Plus } from 'lucide-react';
import { CartItem, Product } from '../types';
import { ProductImage } from './ui/ProductImage';

interface CartItemCardProps {
  item: CartItem;
  product: Product;
  productsMap: Record<string, Product>;
  unitPrice: number;
  itemTotal: number;
  /** true이면 삭제/수량/구독 컨트롤 숨김 (체크아웃용) */
  readonly?: boolean;
  onRemove?: () => void;
  onQtyChange?: (newQty: number) => void;
  onToggleSubscription?: () => void;
  /** 크레딧 관련 (체크아웃용) */
  creditAvailable?: boolean;
  availableCredit?: number;   // 이 상품에 사용 가능한 잔여 크레딧
  creditUsed?: number;        // 현재 입력된 크레딧 사용액
  onCreditChange?: (amount: number) => void;
}

export function CartItemCard({
  item,
  product,
  productsMap,
  unitPrice,
  itemTotal,
  readonly = false,
  onRemove,
  onQtyChange,
  onToggleSubscription,
  creditAvailable = false,
  availableCredit = 0,
  creditUsed = 0,
  onCreditChange,
}: CartItemCardProps) {
  // ── 번들 구성 계산 ────────────────────────────────────────
  const hasBundle = item.selectedProductIds && item.selectedProductIds.length > 0;
  const relevantBonus = (product.bonusItems || []).filter(
    (bi) => !bi.optionId || bi.optionId === item.optionId
  );

  const buyQty = product.buyQuantity || 0;
  const paidIds =
    item.selectedProductIds?.slice(0, buyQty > 0 ? buyQty : item.selectedProductIds?.length || 0) || [];
  const freeIds = buyQty > 0 ? (item.selectedProductIds?.slice(buyQty) || []) : [];

  const groupIds = (ids: string[]) =>
    ids.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const paidGrouped = groupIds(paidIds);
  const freeGrouped = groupIds(freeIds);

  // ── 단가/할인 계산 ────────────────────────────────────────
  let baseUnitPrice = product.price;
  let mainDiscountRate = 0;
  if (item.optionId) {
    const opt = product.options?.find((o) => o.id === item.optionId);
    if (opt) {
      const baseTotal =
        opt.price && opt.price > 0
          ? opt.price
          : product.price * (opt.quantity || 1);
      baseUnitPrice = Math.round(baseTotal / (opt.quantity || 1));
      mainDiscountRate =
        (opt.discountRate || 0) > 0
          ? opt.discountRate || 0
          : product.discountRate || 0;
    }
  } else {
    mainDiscountRate = product.discountRate || 0;
  }
  const tfNormalTotal = baseUnitPrice * item.quantity;
  const tfDiscountAmt = tfNormalTotal - itemTotal;

  return (
    <div className="bg-white border border-neutral-200 p-6">
      {/* ── Row 1: 썸네일 + 정보 + (삭제버튼) ── */}
      <div className="flex items-start gap-5">
        <Link
          to={`/products/${product.id}`}
          className="w-20 h-20 sm:w-24 sm:h-24 bg-neutral-100 overflow-hidden flex-shrink-0"
        >
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-neutral-500 mb-1 tracking-wide uppercase">{product.sku}</p>
          <Link
            to={`/products/${product.id}`}
            className="text-base font-bold tracking-tight text-neutral-900 hover:text-neutral-700 block mb-2"
          >
            {product.name}
            {item.optionName ? ` (${item.optionName})` : ''}
          </Link>

          <div className="flex flex-col gap-1 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-neutral-900">
                ₩{itemTotal.toLocaleString()}
              </span>
              {item.customPrice != null && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">
                  협의 단가 적용
                </span>
              )}
            </div>
          </div>

          {/* 수량 컨트롤 — readonly 아닐 때만 */}
          {!readonly &&
            !item.optionId &&
            !(item.selectedProductIds && item.selectedProductIds.length > 0) && (
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => onQtyChange?.(item.quantity - (product.salesUnit || 1))}
                  disabled={
                    item.quantity <= (product.minOrderQuantity || 1) ||
                    (product.maxOrderQuantity !== undefined &&
                      product.minOrderQuantity === product.maxOrderQuantity)
                  }
                  className={`w-8 h-8 border border-neutral-300 flex items-center justify-center transition-colors flex-shrink-0 ${
                    item.quantity <= (product.minOrderQuantity || 1) ||
                    (product.maxOrderQuantity !== undefined &&
                      product.minOrderQuantity === product.maxOrderQuantity)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-neutral-900'
                  }`}
                >
                  <Minus className="w-3 h-3 text-neutral-700" />
                </button>
                <span className="w-8 text-center text-sm font-medium text-neutral-900">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onQtyChange?.(item.quantity + (product.salesUnit || 1))}
                  disabled={
                    (product.maxOrderQuantity !== undefined &&
                      item.quantity >= product.maxOrderQuantity) ||
                    (product.maxOrderQuantity !== undefined &&
                      product.minOrderQuantity === product.maxOrderQuantity)
                  }
                  className={`w-8 h-8 flex items-center justify-center transition-colors flex-shrink-0 ${
                    (product.maxOrderQuantity !== undefined &&
                      item.quantity >= product.maxOrderQuantity) ||
                    (product.maxOrderQuantity !== undefined &&
                      product.minOrderQuantity === product.maxOrderQuantity)
                      ? 'bg-neutral-200 cursor-not-allowed opacity-50'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                  }`}
                >
                  <Plus
                    className={`w-3 h-3 ${
                      (product.maxOrderQuantity !== undefined &&
                        item.quantity >= product.maxOrderQuantity) ||
                      (product.maxOrderQuantity !== undefined &&
                        product.minOrderQuantity === product.maxOrderQuantity)
                        ? 'text-neutral-500'
                        : 'text-white'
                    }`}
                  />
                </button>
                {(product.salesUnit || 1) > 1 && (
                  <span className="text-xs text-neutral-400 ml-1">
                    (구매단위: {product.salesUnit}개)
                  </span>
                )}
              </div>
            )}

          {/* 정기배송 토글 — readonly 아닐 때만 */}
          {!readonly && (product.subscriptionDiscount ?? 0) > 0 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={item.isSubscription}
                onChange={() => onToggleSubscription?.()}
                className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
              />
              <span className="text-xs text-neutral-700">
                정기 배송 ({product.subscriptionDiscount}% 추가 할인)
              </span>
            </label>
          )}

          {/* readonly 일 때 수량 표시 */}
          {readonly && (
            <p className="text-xs text-neutral-500">
              수량: <strong>{item.quantity}</strong>
              {item.isSubscription && (product.subscriptionDiscount ?? 0) > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold">
                  정기배송 -{product.subscriptionDiscount}%
                </span>
              )}
            </p>
          )}
        </div>

        {/* 삭제 버튼 — readonly 아닐 때만 */}
        {!readonly && (
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Row 2: 번들 구성 테이블 (전폭) ── */}
      <div className="mt-4 border border-neutral-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-3 py-2 text-left font-medium text-neutral-500 w-10">No.</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-500">상품명</th>
              <th className="px-3 py-2 text-center font-medium text-neutral-500 w-14">수량</th>
              <th className="px-3 py-2 text-right font-medium text-neutral-500 w-28">단가</th>
              <th className="px-3 py-2 text-right font-medium text-neutral-500 w-28">소계</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {/* 메인 상품 행 */}
            <tr className="bg-white">
              <td className="px-3 py-2 text-center text-neutral-500 text-[11px] font-bold">1</td>
              <td className="px-3 py-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-neutral-900 font-semibold">
                  <span>
                    {product.name}
                    {item.optionName ? ` (${item.optionName})` : ''}
                  </span>
                  {creditAvailable && (
                    <span className="px-1 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded">
                      크레딧
                    </span>
                  )}
                  <span className="px-1 py-0.5 bg-neutral-900 text-white text-[9px] font-bold rounded">
                    구매
                  </span>
                </div>
              </td>
              <td className="px-3 py-2 text-center font-bold text-neutral-900 text-[11px]">
                {item.quantity}
              </td>
              {hasBundle ? (
                <>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2" />
                </>
              ) : (
                <>
                  <td className="px-3 py-2 text-right text-[11px]">
                    {mainDiscountRate > 0 ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-neutral-400 line-through text-[10px]">
                          ₩{baseUnitPrice.toLocaleString()}
                        </span>
                        <span className="text-neutral-700 font-medium">
                          ₩{unitPrice.toLocaleString()}{' '}
                          <span className="text-red-500 text-[9px] font-black">
                            (-{mainDiscountRate}%)
                          </span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-neutral-600">₩{unitPrice.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-neutral-900 text-xs">
                    ₩{itemTotal.toLocaleString()}
                  </td>
                </>
              )}
            </tr>

            {/* 구매 구성 행 */}
            {Object.entries(paidGrouped).map(([id, count]) => {
              const sub = productsMap[id];
              const subPrice = sub?.price ?? 0;
              return (
                <tr key={`paid-${id}`} className="bg-neutral-50">
                  <td className="px-3 py-1.5 text-center text-neutral-300 text-[11px]" />
                  <td className="px-3 py-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-neutral-700">
                      <span>{sub?.name || '로딩 중...'}</span>
                      <span className="px-1 py-0.5 bg-neutral-100 text-neutral-500 border border-neutral-200 text-[9px] font-medium rounded">
                        {product.isPromotion ? '구매' : '구성'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-center font-bold text-neutral-700 text-[11px]">
                    {count}
                  </td>
                  <td className="px-3 py-1.5 text-right text-neutral-600 text-[11px]">
                    {subPrice > 0 ? `₩${subPrice.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-3 py-1.5 text-right font-bold text-neutral-800 text-[11px]">
                    {subPrice > 0 ? `₩${(subPrice * count).toLocaleString()}` : '-'}
                  </td>
                </tr>
              );
            })}

            {/* 증정 행 (프로모션) */}
            {Object.entries(freeGrouped).map(([id, count]) => {
              const sub = productsMap[id];
              return (
                <tr key={`free-${id}`} className="bg-blue-50">
                  <td className="px-3 py-1.5 text-center text-blue-200 text-[11px]" />
                  <td className="px-3 py-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-blue-700">
                      <span>{sub?.name || '로딩 중...'}</span>
                      <span className="px-1 py-0.5 bg-blue-100 text-blue-700 border border-blue-300 text-[9px] font-bold rounded">
                        증정
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-center font-bold text-blue-700 text-[11px]">
                    {count}
                  </td>
                  <td className="px-3 py-1.5 text-right text-neutral-400 text-[11px]">-</td>
                  <td className="px-3 py-1.5 text-right font-bold text-neutral-400 text-[11px]">-</td>
                </tr>
              );
            })}

            {/* 보너스 증정 행 */}
            {relevantBonus.map((bi) => {
              const qty =
                bi.calculationMethod === 'ratio'
                  ? Math.ceil((item.quantity * (bi.percentage || 0)) / 100)
                  : bi.quantity;
              return (
                <tr key={`bonus-${bi.id}`} className="bg-amber-50">
                  <td className="px-3 py-1.5 text-center text-amber-200 text-[11px]" />
                  <td className="px-3 py-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-amber-800">
                      <span>{bi.product?.name}</span>
                      <span className="px-1 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 text-[9px] font-bold rounded">
                        증정
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-center font-bold text-amber-800 text-[11px]">
                    {qty}
                  </td>
                  <td className="px-3 py-1.5 text-right text-neutral-400 text-[11px]">-</td>
                  <td className="px-3 py-1.5 text-right font-bold text-neutral-400 text-[11px]">-</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {tfDiscountAmt > 0 && (
              <>
                <tr className="border-t border-neutral-200 bg-neutral-50">
                  <td colSpan={4} className="px-3 py-1.5 text-right font-bold text-neutral-700 text-[11px]">
                    정상가
                  </td>
                  <td colSpan={1} className="px-3 py-1.5 text-right font-bold text-neutral-700 text-[11px]">
                    ₩{tfNormalTotal.toLocaleString()}
                  </td>
                </tr>
                <tr className="bg-neutral-50">
                  <td colSpan={4} className="px-3 py-1.5 text-right font-bold text-[11px]" style={{ color: '#ef4444' }}>
                    -{mainDiscountRate > 0 ? mainDiscountRate : Math.round((tfDiscountAmt / tfNormalTotal) * 100)}% 할인
                  </td>
                  <td colSpan={1} className="px-3 py-1.5 text-right font-bold text-[11px]" style={{ color: '#ef4444' }}>
                    -₩{tfDiscountAmt.toLocaleString()}
                  </td>
                </tr>
              </>
            )}
            <tr className="bg-neutral-100 border-t-2 border-neutral-300">
              <td colSpan={4} className="px-3 py-2 text-right font-bold text-neutral-900 text-xs">
                합계
              </td>
              <td colSpan={1} className="px-3 py-2 text-right font-bold text-neutral-900 text-base">
                ₩{itemTotal.toLocaleString()}
              </td>
            </tr>
          </tfoot>
          {/* 크레딧 사용 행 (합계 위) */}
          {creditAvailable && onCreditChange && (
            <tfoot>
              <tr className="bg-emerald-50 border-t border-emerald-200">
                <td colSpan={3} className="px-3 py-2 text-right text-[11px] text-emerald-700 font-medium">
                  사용가능 크레딧
                </td>
                <td colSpan={2} className="px-3 py-2 text-right text-[11px] text-emerald-700 font-bold">
                  {availableCredit > 0
                    ? `₩${availableCredit.toLocaleString()}`
                    : <span className="text-emerald-400">잔액 없음</span>
                  }
                </td>
              </tr>
              {availableCredit > 0 && (
                <tr className="bg-emerald-50">
                  <td colSpan={3} className="px-3 py-1.5 text-right text-[11px] text-emerald-800 font-bold">
                    크레딧 사용
                  </td>
                  <td colSpan={2} className="px-3 py-1.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={creditUsed > 0 ? creditUsed.toLocaleString() : ''}
                        onChange={e => {
                          const num = Number(e.target.value.replace(/[^0-9]/g, ''));
                          const capped = Math.min(num, availableCredit, itemTotal);
                          onCreditChange(isNaN(capped) ? 0 : capped);
                        }}
                        placeholder="0"
                        className="w-28 text-right border border-emerald-300 bg-white px-2 py-1 text-xs font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => onCreditChange(Math.min(availableCredit, itemTotal))}
                        className="text-[10px] px-2 py-1 bg-emerald-600 text-white font-bold hover:bg-emerald-700 whitespace-nowrap"
                      >
                        전액
                      </button>
                      {creditUsed > 0 && (
                        <button
                          type="button"
                          onClick={() => onCreditChange(0)}
                          className="text-[10px] px-2 py-1 border border-neutral-200 text-neutral-500 hover:bg-neutral-100 font-bold"
                        >
                          취소
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tfoot>
          )}
          <tfoot>
            <tr className="bg-neutral-100 border-t-2 border-neutral-300">
              <td colSpan={4} className="px-3 py-2 text-right font-bold text-neutral-900 text-xs">합계</td>
              <td colSpan={1} className="px-3 py-2 text-right font-bold text-neutral-900 text-base">
                ₩{Math.max(0, itemTotal - creditUsed).toLocaleString()}
                {creditUsed > 0 && (
                  <div className="text-[10px] font-bold text-emerald-600">
                    크레딧 -₩{creditUsed.toLocaleString()}
                  </div>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
