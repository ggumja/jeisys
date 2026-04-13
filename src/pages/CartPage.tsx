import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Trash2, Plus, Minus, Printer, ShoppingBag, Loader2, Package, Check } from 'lucide-react';
import { cartService } from '../services/cartService';
import { productService } from '../services/productService';
import { CartItem, Product } from '../types';
import { ProductImage } from '../components/ui/ProductImage';
import { useModal } from '../context/ModalContext';

export function CartPage() {
  const { alert } = useModal();
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
      await alert(`최소 주문 수량이 ${minQty}개인 상품입니다.`);
      return;
    }
    if (maxQty !== undefined && newQuantity > maxQty) {
      await alert(`최대 주문 수량이 ${maxQty}개인 상품입니다.`);
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

    // Promotion Product: Price is sum of selected paid items
    if (product.isPromotion && item.selectedProductIds) {
      const buyQty = product.buyQuantity || 0;
      // The first buyQty items in selectedProductIds are the paid ones
      const paidItemIds = item.selectedProductIds.slice(0, buyQty);
      const paidTotal = paidItemIds.reduce((sum, id) => {
        const subProduct = productsMap[id];
        return sum + (subProduct?.price || 0);
      }, 0);
      return paidTotal;
    }

    if (item.optionId) {
      const option = product.options?.find(opt => opt.id === item.optionId);
      if (option) {
        // option에 discountRate가 없으면 product 레벨 discountRate로 폴백
        const discountRate = ((option.discountRate || 0) > 0
          ? option.discountRate
          : (product.discountRate || 0)) / 100;
        const basePrice = (option.price && option.price > 0) ? option.price : (product.price * (option.quantity || 1));
        return (basePrice * (1 - discountRate)) / (option.quantity || 1);
      }
    }

    const tier = [...product.tierPricing]
      .sort((a, b) => b.quantity - a.quantity)
      .find(t => item.quantity >= t.quantity);

    const basePrice = tier?.unitPrice || product.price;
    // product-level discountRate 적용 (패키지 또는 일반 상품)
    const productDiscountRate = (product.discountRate || 0) / 100;
    return basePrice * (1 - productDiscountRate);
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

  const printQuote = () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;
    const quoteNo = `JES-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${String(today.getHours()).padStart(2,'0')}${String(today.getMinutes()).padStart(2,'0')}`;

    const rowsHtml = cart.map((item, idx) => {
      const product = productsMap[item.productId];
      if (!product) return '';
      const unitPrice = getTierPrice(item);
      const subDiscount = (product.subscriptionDiscount || 0) / 100;
      const itemTotal = Math.round(unitPrice * item.quantity * (item.isSubscription ? (1 - subDiscount) : 1));

      // option discount rate
      let mainDiscountRate = 0;
      let baseUnitPrice = product.price;
      if (item.optionId) {
        const opt = product.options?.find(o => o.id === item.optionId);
        if (opt) {
          const bt = (opt.price && opt.price > 0) ? opt.price : (product.price * (opt.quantity || 1));
          baseUnitPrice = Math.round(bt / (opt.quantity || 1));
          mainDiscountRate = (opt.discountRate || 0) > 0 ? (opt.discountRate || 0) : (product.discountRate || 0);
        }
      } else {
        mainDiscountRate = product.discountRate || 0;
      }

      // sub-rows for bundle
      const hasBundle = item.selectedProductIds && item.selectedProductIds.length > 0;
      const buyQty = product.buyQuantity || 0;
      const paidIds = item.selectedProductIds?.slice(0, buyQty > 0 ? buyQty : (item.selectedProductIds?.length || 0)) || [];
      const freeIds = buyQty > 0 ? (item.selectedProductIds?.slice(buyQty) || []) : [];
      const grouped = paidIds.reduce((acc, id) => { acc[id] = (acc[id] || 0) + 1; return acc; }, {} as Record<string, number>);
      const freeGrouped = freeIds.reduce((acc, id) => { acc[id] = (acc[id] || 0) + 1; return acc; }, {} as Record<string, number>);

      // 구성 행
      const subRowsHtml = Object.entries(grouped).map(([id, count]) => {
        const sub = productsMap[id];
        const sp = sub?.price ?? 0;
        return `<tr class="sub-row">
          <td></td>
          <td>${sub?.name || id} <span class="badge badge-comp">구성</span></td>
          <td class="center">${count}</td>
          <td class="right">${sp > 0 ? '\u20a9'+sp.toLocaleString() : '-'}</td>
          <td class="right bold">${sp > 0 ? '\u20a9'+(sp * count).toLocaleString() : '-'}</td>
        </tr>`;
      }).join('');

      // 프로모션 무료 증정 행
      const freeRowsHtml = Object.entries(freeGrouped).map(([id, count]) => {
        const sub = productsMap[id];
        return `<tr class="gift-row">
          <td></td>
          <td>${sub?.name || id} <span class="badge badge-gift">증정</span></td>
          <td class="center">${count}</td>
          <td class="right gray">-</td>
          <td class="right bold gray">-</td>
        </tr>`;
      }).join('');

      // 보너스 증정 행 (product.bonusItems)
      const relevantBonus = (product.bonusItems || []).filter(bi => bi.optionId === (item.optionId || null));
      const bonusRowsHtml = relevantBonus.map(bi => {
        const qty = bi.calculationMethod === 'ratio'
          ? Math.ceil(item.quantity * (bi.percentage || 0) / 100)
          : bi.quantity;
        return `<tr class="gift-row">
          <td></td>
          <td>${bi.product?.name || '증정품'} <span class="badge badge-gift">증정</span></td>
          <td class="center">${qty}</td>
          <td class="right gray">-</td>
          <td class="right bold gray">-</td>
        </tr>`;
      }).join('');

      // tfoot discount
      let tfBaseUnitPrice = product.price;
      let tfDiscountRate = 0;
      if (item.optionId) {
        const opt = product.options?.find(o => o.id === item.optionId);
        if (opt) {
          const bt = (opt.price && opt.price > 0) ? opt.price : (product.price * (opt.quantity || 1));
          tfBaseUnitPrice = Math.round(bt / (opt.quantity || 1));
          tfDiscountRate = (opt.discountRate || 0) > 0 ? (opt.discountRate || 0) : (product.discountRate || 0);
        }
      } else {
        tfDiscountRate = product.discountRate || 0;
      }
      const tfNormalTotal = tfBaseUnitPrice * item.quantity;
      const tfDiscountAmt = tfNormalTotal - itemTotal;

      const discountRowHtml = tfDiscountAmt > 0 ? `
        <tr class="discount-row">
          <td colspan="4" class="right">정상가</td>
          <td class="right bold">\u20a9${tfNormalTotal.toLocaleString()}</td>
        </tr>
        <tr class="discount-row">
          <td colspan="4" class="right red bold">-${tfDiscountRate > 0 ? tfDiscountRate : Math.round(tfDiscountAmt / tfNormalTotal * 100)}% 할인</td>
          <td class="right red bold">-\u20a9${tfDiscountAmt.toLocaleString()}</td>
        </tr>` : '';

      const unitPriceDisplay = hasBundle ? '-' :
        mainDiscountRate > 0
          ? `<span class="line-through gray">\u20a9${baseUnitPrice.toLocaleString()}</span><br>\u20a9${unitPrice.toLocaleString()} <span class="red small">(-${mainDiscountRate}%)</span>`
          : `\u20a9${unitPrice.toLocaleString()}`;

      return `
        <tr class="main-row">
          <td class="center">${idx + 1}</td>
          <td>${product.name}${item.optionName ? ` (${item.optionName})` : ''} <span class="badge badge-buy">구매</span></td>
          <td class="center bold">${item.quantity}</td>
          <td class="right">${hasBundle ? '' : unitPriceDisplay}</td>
          <td class="right bold">${hasBundle ? '' : '\u20a9'+itemTotal.toLocaleString()}</td>
        </tr>
        ${subRowsHtml}
        ${freeRowsHtml}
        ${bonusRowsHtml}
        ${discountRowHtml}
        <tr class="total-row">
          <td colspan="4" class="right bold">합계</td>
          <td class="right bold large">\u20a9${itemTotal.toLocaleString()}</td>
        </tr>`;
    }).join('');

    const grandTotal = calculateTotal();

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>견적서 ${quoteNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 12px; color: #111; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 40px 60px; }
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
    .company-name { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .company-sub { font-size: 11px; color: #555; margin-top: 2px; }
    .quote-meta { text-align: right; }
    .quote-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .quote-no { font-size: 11px; color: #555; }
    /* Info box */
    .info-box { display: flex; gap: 24px; margin-bottom: 24px; padding: 14px 16px; background: #f9f9f9; border: 1px solid #e0e0e0; }
    .info-box .label { font-size: 10px; color: #666; margin-bottom: 2px; }
    .info-box .value { font-size: 12px; font-weight: 600; }
    /* Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    thead tr { background: #111; color: #fff; }
    thead th { padding: 8px 10px; font-size: 11px; font-weight: 600; text-align: left; }
    thead th.center { text-align: center; }
    thead th.right { text-align: right; }
    tbody tr { border-bottom: 1px solid #e8e8e8; }
    tbody td { padding: 8px 10px; font-size: 11px; vertical-align: middle; }
    td.center { text-align: center; }
    td.right { text-align: right; }
    td.bold { font-weight: 700; }
    td.large { font-size: 13px; }
    td.red { color: #ef4444; }
    td.gray { color: #999; }
    span.red { color: #ef4444; }
    span.gray { color: #999; }
    span.small { font-size: 10px; }
    span.line-through { text-decoration: line-through; }
    .main-row { background: #fff; }
    .sub-row { background: #f9f9f9; color: #444; }
    .discount-row { background: #fafafa; }
    .total-row { background: #f0f0f0; border-top: 2px solid #ccc; }
    .badge { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 9px; font-weight: 700; margin-left: 4px; }
    .badge-buy { background: #111; color: #fff; }
    .badge-comp { background: #e5e7eb; color: #374151; border: 1px solid #d1d5db; }
    .badge-gift { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .gift-row { background: #f0f9ff; color: #1e40af; }
    /* Grand total */
    .grand-total { border-top: 3px solid #111; padding-top: 16px; display: flex; justify-content: flex-end; align-items: center; gap: 24px; margin-bottom: 32px; }
    .grand-total .label { font-size: 13px; font-weight: 700; }
    .grand-total .amount { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    /* Footer */
    .footer { border-top: 1px solid #e0e0e0; padding-top: 16px; font-size: 10px; color: #888; line-height: 1.8; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 0; }
      thead tr { background: #111 !important; -webkit-print-color-adjust: exact; }
      .total-row { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="company-name">JEISYS MEDICAL</div>
      <div class="company-sub">제이시스메디컬 주식회사</div>
    </div>
    <div class="quote-meta">
      <div class="quote-title">견 적 서</div>
      <div class="quote-no">No. ${quoteNo}</div>
    </div>
  </div>

  <div class="info-box">
    <div>
      <div class="label">견적일</div>
      <div class="value">${dateStr}</div>
    </div>
    <div>
      <div class="label">유효기간</div>
      <div class="value">견적일로부터 30일</div>
    </div>
    <div>
      <div class="label">담당자</div>
      <div class="value">제이시스메디컬 영업팀</div>
    </div>
    <div>
      <div class="label">연락처</div>
      <div class="value">02-000-0000</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="center" style="width:40px">No.</th>
        <th>상품명</th>
        <th class="center" style="width:60px">수량</th>
        <th class="right" style="width:120px">단가</th>
        <th class="right" style="width:120px">소계</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="grand-total">
    <div class="label">총 합계 금액 (VAT 포함)</div>
    <div class="amount">\u20a9${grandTotal.toLocaleString()}</div>
  </div>

  <div class="footer">
    <p>• 본 견적서는 재고 상황에 따라 납기가 변동될 수 있습니다.</p>
    <p>• 표시된 금액은 부가세(VAT 10%) 포함 금액입니다.</p>
    <p>• 50만원 이상 구매 시 무료 배송 (도서·산간 지역 제외)</p>
    <p>• 유효기간 경과 시 가격이 변동될 수 있으니 재문의 바랍니다.</p>
  </div>
</div>
<script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
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
              <div key={getItemKey(item)} className="bg-white border border-neutral-200 p-6">

                {/* ── Row 1: 썸네일 + 정보 + 휴지통 ── */}
                <div className="flex items-start gap-5">
                  <Link
                    to={`/products/${product.id}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 bg-neutral-100 overflow-hidden flex-shrink-0"
                  >
                    <ProductImage src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-500 mb-1 tracking-wide uppercase">{product.sku}</p>
                    <Link
                      to={`/products/${product.id}`}
                      className="text-base font-bold tracking-tight text-neutral-900 hover:text-neutral-700 block mb-2"
                    >
                      {product.name}
                    </Link>

                    <div className="flex flex-col gap-1 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-neutral-900">₩{itemTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* 수량 컨트롤: optionId나 selectedProductIds가 있는 상품은 구성이 고정이므로 숨김 */}
                    {!item.optionId && !(item.selectedProductIds && item.selectedProductIds.length > 0) && (
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => updateQuantity(item, item.quantity - (product.salesUnit || 1))}
                          disabled={item.quantity <= (product.minOrderQuantity || 1) || (product.maxOrderQuantity !== undefined && product.minOrderQuantity === product.maxOrderQuantity)}
                          className={`w-8 h-8 border border-neutral-300 flex items-center justify-center transition-colors flex-shrink-0 ${
                            item.quantity <= (product.minOrderQuantity || 1) || (product.maxOrderQuantity !== undefined && product.minOrderQuantity === product.maxOrderQuantity)
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:border-neutral-900'
                          }`}
                        >
                          <Minus className="w-3 h-3 text-neutral-700" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-neutral-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item, item.quantity + (product.salesUnit || 1))}
                          disabled={(product.maxOrderQuantity !== undefined && item.quantity >= product.maxOrderQuantity) || (product.maxOrderQuantity !== undefined && product.minOrderQuantity === product.maxOrderQuantity)}
                          className={`w-8 h-8 flex items-center justify-center transition-colors flex-shrink-0 ${
                            (product.maxOrderQuantity !== undefined && item.quantity >= product.maxOrderQuantity) || (product.maxOrderQuantity !== undefined && product.minOrderQuantity === product.maxOrderQuantity)
                              ? 'bg-neutral-200 cursor-not-allowed opacity-50'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                          }`}
                        >
                          <Plus className={`w-3 h-3 ${((product.maxOrderQuantity !== undefined && item.quantity >= product.maxOrderQuantity) || (product.maxOrderQuantity !== undefined && product.minOrderQuantity === product.maxOrderQuantity)) ? 'text-neutral-500' : 'text-white'}`} />
                        </button>
                        {(product.salesUnit || 1) > 1 && (
                          <span className="text-xs text-neutral-400 ml-1">(구매단위: {product.salesUnit}개)</span>
                        )}
                      </div>
                    )}

                    {/* 정기배송 */}
                    {(product.subscriptionDiscount ?? 0) > 0 && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isSubscription}
                          onChange={() => toggleSubscription(item)}
                          className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                        />
                        <span className="text-xs text-neutral-700">정기 배송 ({product.subscriptionDiscount}% 추가 할인)</span>
                      </label>
                    )}
                  </div>

                  {/* 휴지통 */}
                  <button onClick={() => removeItem(item)} className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* ── Row 2: 번들 구성 테이블 (전폭) ── */}
                {(() => {
                   const hasBundle = item.selectedProductIds && item.selectedProductIds.length > 0;
                  const relevantBonus = (product.bonusItems || []).filter(bi => bi.optionId === (item.optionId || null));
                  // 항상 테이블 표시 (일반 상품도 동일 레이아웃)

                  const buyQty = product.buyQuantity || 0;
                  const paidIds = item.selectedProductIds?.slice(0, buyQty > 0 ? buyQty : (item.selectedProductIds?.length || 0)) || [];
                  const freeIds = buyQty > 0 ? (item.selectedProductIds?.slice(buyQty) || []) : [];
                  const groupIds = (ids: string[]) =>
                    ids.reduce((acc, id) => { acc[id] = (acc[id] || 0) + 1; return acc; }, {} as Record<string, number>);
                  const paidGrouped = groupIds(paidIds);
                  const freeGrouped = groupIds(freeIds);

                  let counter = 0;
                  const paidRows = Object.entries(paidGrouped).map(([id, count]) => {
                    counter++;
                    const sub = productsMap[id];
                    const subPrice = sub?.price ?? 0;
                    return (
                      <tr key={`paid-${id}`} className="bg-neutral-50">
                        <td className="px-3 py-1.5 text-center text-neutral-300 text-[11px]"></td>
                        <td className="px-3 py-1.5 text-[11px]">
                          <div className="flex items-center gap-1.5 text-neutral-700">
                            <span>{sub?.name || '로딩 중...'}</span>
                            <span className="px-1 py-0.5 bg-neutral-100 text-neutral-500 border border-neutral-200 text-[9px] font-medium rounded">
                              {product.isPromotion ? '구매' : '구성'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-center font-bold text-neutral-700 text-[11px]">{count}</td>
                        <td className="px-3 py-1.5 text-right text-neutral-600 text-[11px]">
                          {subPrice > 0 ? `₩${subPrice.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-3 py-1.5 text-right font-bold text-neutral-800 text-[11px]">
                          {subPrice > 0 ? `₩${(subPrice * count).toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    );
                  });
                  const freeRows = Object.entries(freeGrouped).map(([id, count]) => {
                    counter++;
                    const sub = productsMap[id];
                    return (
                      <tr key={`free-${id}`} className="bg-blue-50">
                        <td className="px-3 py-1.5 text-center text-blue-200 text-[11px]"></td>
                        <td className="px-3 py-1.5 text-[11px]">
                          <div className="flex items-center gap-1.5 text-blue-700">
                            <span>{sub?.name || '로딩 중...'}</span>
                            <span className="px-1 py-0.5 bg-blue-100 text-blue-700 border border-blue-300 text-[9px] font-bold rounded">증정</span>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-center font-bold text-blue-700 text-[11px]">{count}</td>
                        <td className="px-3 py-1.5 text-right text-neutral-400 text-[11px]">-</td>
                        <td className="px-3 py-1.5 text-right font-bold text-neutral-400 text-[11px]">-</td>
                      </tr>
                    );
                  });
                  const bonusRows = relevantBonus.map((bi) => {
                    counter++;
                    const qty = bi.calculationMethod === 'ratio'
                      ? Math.ceil(item.quantity * (bi.percentage || 0) / 100)
                      : bi.quantity;
                    return (
                      <tr key={`bonus-${bi.id}`} className="bg-amber-50">
                        <td className="px-3 py-1.5 text-center text-amber-200 text-[11px]"></td>
                        <td className="px-3 py-1.5 text-[11px]">
                          <div className="flex items-center gap-1.5 text-amber-800">
                            <span>{bi.product?.name}</span>
                            <span className="px-1 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 text-[9px] font-bold rounded">증정</span>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-center font-bold text-amber-800 text-[11px]">{qty}</td>
                        <td className="px-3 py-1.5 text-right text-neutral-400 text-[11px]">-</td>
                        <td className="px-3 py-1.5 text-right font-bold text-neutral-400 text-[11px]">-</td>
                      </tr>
                    );
                  });

                  return (
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
                          {/* ── 메인 상품 행 (1.) ── */}
                          {(() => {
                            let baseUnitPrice = product.price;
                            let mainDiscountRate = 0;
                            if (item.optionId) {
                              const opt = product.options?.find(o => o.id === item.optionId);
                              if (opt) {
                                const baseTotal = (opt.price && opt.price > 0) ? opt.price : (product.price * (opt.quantity || 1));
                                baseUnitPrice = Math.round(baseTotal / (opt.quantity || 1));
                                // option에 discountRate가 없으면 product 레벨로 폴백
                                mainDiscountRate = (opt.discountRate || 0) > 0
                                  ? (opt.discountRate || 0)
                                  : (product.discountRate || 0);
                              }
                            } else {
                              mainDiscountRate = product.discountRate || 0;
                            }
                            return (
                              <tr className="bg-white">
                                <td className="px-3 py-2 text-center text-neutral-500 text-[11px] font-bold">1</td>
                                <td className="px-3 py-2 text-[11px]">
                                  <div className="flex items-center gap-1.5 text-neutral-900 font-semibold">
                                    <span>{product.name}{item.optionName ? ` (${item.optionName})` : ''}</span>
                                    <span className="px-1 py-0.5 bg-neutral-900 text-white text-[9px] font-bold rounded">구매</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center font-bold text-neutral-900 text-[11px]">{item.quantity}</td>
                                {hasBundle ? (
                                  /* 번들/프로모션: 단가·소계 빈칸 (하위행+tfoot에서 표시) */
                                  <>
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2"></td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-3 py-2 text-right text-[11px]">
                                      {mainDiscountRate > 0 ? (
                                        <div className="flex flex-col items-end gap-0.5">
                                          <span className="text-neutral-400 line-through text-[10px]">₩{baseUnitPrice.toLocaleString()}</span>
                                          <span className="text-neutral-700 font-medium">₩{unitPrice.toLocaleString()} <span className="text-red-500 text-[9px] font-black">(-{mainDiscountRate}%)</span></span>
                                        </div>
                                      ) : (
                                        <span className="text-neutral-600">₩{unitPrice.toLocaleString()}</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold text-neutral-900 text-xs">₩{itemTotal.toLocaleString()}</td>
                                  </>
                                )}
                              </tr>
                            );
                          })()}
                          {paidRows}
                          {freeRows}
                          {bonusRows}
                        </tbody>
                        <tfoot>
                          {(() => {
                            let tfBaseUnitPrice = product.price;
                            let tfDiscountRate = 0;
                            if (item.optionId) {
                              const opt = product.options?.find(o => o.id === item.optionId);
                              if (opt) {
                                const bt = (opt.price && opt.price > 0) ? opt.price : (product.price * (opt.quantity || 1));
                                tfBaseUnitPrice = Math.round(bt / (opt.quantity || 1));
                                // option에 discountRate가 없으면 product 레벨로 폴백
                                tfDiscountRate = (opt.discountRate || 0) > 0
                                  ? (opt.discountRate || 0)
                                  : (product.discountRate || 0);
                              }
                            } else {
                              tfDiscountRate = product.discountRate || 0;
                            }
                            const tfNormalTotal = tfBaseUnitPrice * item.quantity;
                            const tfDiscountAmt = tfNormalTotal - itemTotal;
                            return (
                              <>
                                {tfDiscountAmt > 0 && (
                                  <>
                                    <tr className="border-t border-neutral-200 bg-neutral-50">
                                      <td colSpan={4} className="px-3 py-1.5 text-right font-bold text-neutral-700 text-[11px]">정상가</td>
                                      <td colSpan={1} className="px-3 py-1.5 text-right font-bold text-neutral-700 text-[11px]">₩{tfNormalTotal.toLocaleString()}</td>
                                    </tr>
                                    <tr className="bg-neutral-50">
                                      <td colSpan={4} className="px-3 py-1.5 text-right font-bold text-[11px]" style={{color:'#ef4444'}}>-{tfDiscountRate > 0 ? tfDiscountRate : Math.round(tfDiscountAmt / tfNormalTotal * 100)}% 할인</td>
                                      <td colSpan={1} className="px-3 py-1.5 text-right font-bold text-[11px]" style={{color:'#ef4444'}}>-₩{tfDiscountAmt.toLocaleString()}</td>
                                    </tr>
                                  </>
                                )}
                                <tr className="bg-neutral-100 border-t-2 border-neutral-300">
                                  <td colSpan={4} className="px-3 py-2 text-right font-bold text-neutral-900 text-xs">합계</td>
                                  <td colSpan={1} className="px-3 py-2 text-right font-bold text-neutral-900 text-base">₩{itemTotal.toLocaleString()}</td>
                                </tr>
                              </>
                            );
                          })()}
                        </tfoot>
                      </table>
                    </div>
                  );
                })()}


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
              onClick={printQuote}
              className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 py-3 font-medium flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <Printer className="w-5 h-5" />
              견적서 인쇄하기
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