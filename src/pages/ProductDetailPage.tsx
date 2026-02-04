import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ShoppingCart, Check, FileText, Minus, Plus, Package } from 'lucide-react';
import { mockProducts, mockEquipment } from '../lib/mockData';
import { storage } from '../lib/storage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = mockProducts.find(p => p.id === id);
  const [quantity, setQuantity] = useState(1);
  const [isSubscription, setIsSubscription] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showCartDialog, setShowCartDialog] = useState(false);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h1>
        <Link to="/products" className="text-blue-600 hover:text-blue-700">
          상품 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const compatibleEquipment = mockEquipment.filter(eq =>
    product.compatibleEquipment.includes(eq.serialNumber)
  );

  // 연관 상품 (같은 카테고리, 현재 상품 제외)
  const relatedProducts = mockProducts.filter(
    p => p.category === product.category && p.id !== product.id
  ).slice(0, 4); // 최대 4개만 표시

  const currentTierPrice = [...product.tierPricing]
    .reverse()
    .find(tier => quantity >= tier.quantity)?.unitPrice || product.price;

  const handleAddToCart = () => {
    const cart = storage.getCart();
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.isSubscription = isSubscription;
    } else {
      cart.push({
        productId: product.id,
        quantity,
        isSubscription,
      });
    }

    storage.setCart(cart);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    setShowCartDialog(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 lg:py-12">
      {/* Breadcrumb */}
      <div className="text-sm text-neutral-600 mb-8">
        <Link to="/products" className="hover:text-neutral-900">상품</Link>
        <span className="mx-2">/</span>
        <span>{product.category}</span>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Product Image */}
        <div className="bg-neutral-100 overflow-hidden aspect-square">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div>
          <p className="text-xs text-neutral-500 mb-3 tracking-wide uppercase">{product.sku}</p>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 mb-6">{product.name}</h1>
          
          <div className="bg-neutral-50 border border-neutral-200 p-8 mb-8">
            <p className="text-4xl tracking-tight text-neutral-900 mb-2">
              ₩{currentTierPrice.toLocaleString()}
            </p>
            {currentTierPrice !== product.price && (
              <p className="text-sm text-neutral-600">
                정가: <span className="line-through">₩{product.price.toLocaleString()}</span>
              </p>
            )}
          </div>

          <div className="mb-8">
            <p className="text-base text-neutral-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Compatible Equipment */}
          {compatibleEquipment.length > 0 && (
            <div className="bg-green-50 border border-green-200 p-6 mb-8">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-base font-medium text-green-900 mb-3">
                    보유 장비와 호환됩니다
                  </p>
                  <ul className="space-y-1">
                    {compatibleEquipment.map(eq => (
                      <li key={eq.id} className="text-sm text-green-700">
                        • {eq.modelName} ({eq.serialNumber})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-8">
            <label className="block text-xs tracking-wide text-neutral-700 mb-4 uppercase font-medium">
              수량
            </label>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 border border-neutral-300 hover:border-neutral-900 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-5 h-5 text-neutral-700" />
                </button>
                <div className="w-20 text-center">
                  <span className="text-2xl font-light tracking-tight text-neutral-900">{quantity}</span>
                </div>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="text-sm text-neutral-600">
                재고: {product.stock}개
              </div>
            </div>
          </div>

          {/* Subscription Option */}
          <div className="mb-8">
            <label className="flex items-center gap-4 p-6 border border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-colors">
              <input
                type="checkbox"
                checked={isSubscription}
                onChange={(e) => setIsSubscription(e.target.checked)}
                className="w-5 h-5 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
              />
              <div>
                <p className="text-base font-medium text-neutral-900">정기 배송 (5% 추가 할인)</p>
                <p className="text-sm text-neutral-600 mt-1">매달 자동으로 배송받으세요</p>
              </div>
            </label>
          </div>

          {/* Total Price */}
          <div className="bg-neutral-50 border border-neutral-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-neutral-700">총 금액</span>
              <span className="text-3xl tracking-tight text-neutral-900">
                ₩{(currentTierPrice * quantity * (isSubscription ? 0.95 : 1)).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-4 font-medium flex items-center justify-center gap-2 transition-colors text-sm tracking-wide uppercase"
            >
              <ShoppingCart className="w-5 h-5" />
              {addedToCart ? '장바구니에 담김!' : '장바구니'}
            </button>
            <button
              onClick={() => {
                handleAddToCart();
                navigate('/cart');
              }}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 py-4 font-medium transition-colors text-sm tracking-wide uppercase"
            >
              바로 구매
            </button>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-neutral-600" />
            <span className="text-neutral-600">
              평일 오후 2시 이전 주문 시 당일 출고
            </span>
          </div>
        </div>
      </div>

      {/* Product Description Section */}
      {product.additionalImages && product.additionalImages.length > 0 && (
        <div className="mb-16">
          <div className="border-t border-neutral-200 pt-12 mb-8">
            <h2 className="text-2xl tracking-tight text-neutral-900 mb-8">상품설명</h2>
          </div>
          <div className="space-y-0">
            {product.additionalImages.map((imgUrl, index) => (
              <div key={index} className="w-full">
                <img
                  src={imgUrl}
                  alt={`${product.name} 상세 이미지 ${index + 1}`}
                  className="w-full h-auto"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipping & Return Policy */}
      <div className="mb-16">
        <div className="border-t border-neutral-200 pt-12 mb-8">
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">배송/반품/교환 안내</h2>
        </div>
        <div className="border border-neutral-200">
          <table className="w-full">
            <tbody className="divide-y divide-neutral-200">
              <tr>
                <td className="bg-neutral-50 px-6 py-4 text-sm font-medium text-neutral-900 w-1/5 align-top">
                  반품/교환 배송비
                </td>
                <td className="px-6 py-4 text-sm text-neutral-700">
                  (구매자귀책) 3,500원 / 7,000원 / 초기배송비 무료시 편결배송비 부과방법 : 왕복(편도x2)
                </td>
              </tr>
              <tr>
                <td className="bg-neutral-50 px-6 py-4 text-sm font-medium text-neutral-900 align-top">
                  반품/교환지 주소
                </td>
                <td className="px-6 py-4 text-sm text-neutral-700">
                  <div className="space-y-1">
                    <p>보내실 곳 : 서울특별시 금천구 가산디로 96 대륭테크노타운8 513호 제이시스메디칼</p>
                    <p>보내실 곳 : 서울특별시 금천구 가산디로 96 대륭테크노타운8 1007호 (주)사치바이오</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="bg-neutral-50 px-6 py-4 text-sm font-medium text-neutral-900 align-top">
                  반품/교환 안내<br/>A/S안내
                </td>
                <td className="px-6 py-4 text-sm text-neutral-700">
                  <div className="space-y-1">
                    <p>070-7435-4927 주식회사 제이시스메디칼</p>
                    <p>070-7727-4007 주식회사 사치바이오</p>
                    <p>1544-1639(A/S고객센터)</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="bg-neutral-50 px-6 py-4 text-sm font-medium text-neutral-900 align-top">
                  반품 및 교환
                </td>
                <td className="px-6 py-4 text-sm text-neutral-700">
                  <div className="space-y-1">
                    <p>주문 상품 수량 후 미 개봉된 상품에 한하여 수령 후 일주일(7일)이내 교환 또는 반품이 가능합니다.</p>
                    <p>상품불량이나 배송 등 하자, 오배송에 의한 반송 비용은 제이시스를주에서 부담합니다.</p>
                    <p>고객변심으로 인한 반송비용은 고객님께서 부담하셔야 하며, 고객님이 직접 발송하셔도서야 합니다.</p>
                    <p>의 대, 발생하는 배송료는 교환 & 반품 옵션에 같이 동봉 부탁드립니다.</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="bg-neutral-50 px-6 py-4 text-sm font-medium text-neutral-900 align-top">
                  교환 및 반품이 가능한 경우
                </td>
                <td className="px-6 py-4 text-sm text-neutral-700">
                  상품을 공급받으신 날로부터 7일 이내 (단, 포장박스를 개봉하셔거나 포장이 훼손되어 상품가치가 상실된 경우 교환/반품이 불가합니다)
                </td>
              </tr>
              <tr>
                <td className="bg-neutral-50 px-6 py-4 text-sm font-medium text-neutral-900 align-top">
                  교환 및 반품이<br/>불가능한 경우
                </td>
                <td className="px-6 py-4 text-sm text-neutral-700">
                  <div className="space-y-1">
                    <p>-공정거래, 표준약관 제 15조 2항에 의거여</p>
                    <p>고객님의 책임 있는 사유로 상품이 훼손된 경우</p>
                    <p>상품 고유의 포장이 훼손되어 상품가치가 상실된 경우</p>
                    <p>보관 부실로 재판매가 곤란할 정도로 상품가치가 상실된 경우</p>
                    <p>고객님의 사용 또는 일부 소비에 의하여 상품의 가치가 현저히 감소된 경우</p>
                    <p>(** 신촌에 하급 등 구매 투태드립니다)</p>
                    <p className="text-red-700 font-medium mt-2">
                      교환 및 반품 접수 1:1 문의 게시판에 남겨 주시면 접수 내용을 확인 후 담당자가 신속히 교환 및 반품 처리를 도와드리도록 하겠습니다.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mb-16">
          <div className="border-t border-neutral-200 pt-12 mb-8">
            <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">연관 상품</h2>
            <p className="text-sm text-neutral-600">같은 카테고리의 다른 상품</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="bg-white border border-neutral-200 overflow-hidden group hover:border-neutral-900 transition-all"
              >
                <div className="aspect-square bg-neutral-100 overflow-hidden">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs text-neutral-500 mb-1 tracking-wide uppercase">{p.sku}</p>
                  <h3 className="text-sm font-medium text-neutral-900 mb-2 line-clamp-2">{p.name}</h3>
                  <p className="text-base tracking-tight text-neutral-900">
                    ₩{p.price.toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Materials */}
      <div>
        <h2 className="text-2xl tracking-tight text-neutral-900 mb-8">제품 자료</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { title: '제품 사용 가이드', pages: 12 },
            { title: '제품 연구 결과', pages: 24 },
            { title: '안전 사용 매뉴얼', pages: 8 },
          ].map((doc, index) => (
            <button
              key={index}
              className="bg-white border border-neutral-200 p-6 hover:border-neutral-900 transition-all text-left"
            >
              <FileText className="w-10 h-10 text-neutral-900 mb-4" />
              <h3 className="text-base font-medium text-neutral-900 mb-1">{doc.title}</h3>
              <p className="text-sm text-neutral-600">{doc.pages} pages • PDF</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Dialog */}
      <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-neutral-900">장바구니에 담았습니다</DialogTitle>
            <DialogDescription className="text-base text-neutral-600">
              장바구니로 이동하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-3">
            <button
              onClick={() => setShowCartDialog(false)}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 py-3 px-6 font-medium transition-colors text-sm tracking-wide uppercase"
            >
              닫기
            </button>
            <button
              onClick={() => {
                setShowCartDialog(false);
                navigate('/cart');
              }}
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-3 px-6 font-medium transition-colors text-sm tracking-wide uppercase"
            >
              장바구니 보기
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}