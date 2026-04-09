import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ShoppingCart, Check, Minus, Plus, Package, Loader2 } from 'lucide-react';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import { equipmentService, EquipmentModel } from '../services/equipmentService';
import { Product, PackageItem } from '../types';
import { storage } from '../lib/storage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { ProductImage } from '../components/ui/ProductImage';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isSubscription, setIsSubscription] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showCartDialog, setShowCartDialog] = useState(false);
  const [packageItems, setPackageItems] = useState<PackageItem[]>([]);
  const [selections, setSelections] = useState<string[]>([]);
  const [inputQuantities, setInputQuantities] = useState<Record<string, number>>({});
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');

  const [compatibleModels, setCompatibleModels] = useState<EquipmentModel[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [alertDialog, setAlertDialog] = useState<{isOpen: boolean; title: string; description: string}>({
    isOpen: false,
    title: '',
    description: ''
  });

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      const fetchedProduct = await productService.getProductById(productId);
      setProduct(fetchedProduct);

      if (fetchedProduct) {
        // Load related data parallel
        const [allProducts, allModels] = await Promise.all([
          productService.getProducts(),
          equipmentService.getEquipmentModels()
        ]);

        // Filter related products
        const related = allProducts
          .filter(p => p.category === fetchedProduct.category && p.id !== fetchedProduct.id && p.isVisible !== false)
          .slice(0, 4);
        setRelatedProducts(related);

        // Filter compatible equipment
        // Note: fetchedProduct.compatibleEquipment stores codes. equipmentService returns models with codes.
        const compatible = allModels.filter(m =>
          fetchedProduct.compatibleEquipment.includes(m.code)
        );
        setCompatibleModels(compatible);

        // Load package items if this is a package
        if (fetchedProduct.isPackage) {
          const items = await productService.getPackageItems(productId);
          setPackageItems(items);
          if (fetchedProduct.itemInputType === 'input') {
            const initQtys: Record<string, number> = {};
            items.forEach(item => {
              initQtys[item.productId] = 0;
            });
            setInputQuantities(initQtys);
          } else {
            // Initialize selections with empty strings for each slot
            setSelections(Array(fetchedProduct.selectableCount || 1).fill(''));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load product details', error);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    if (product) {
      setQuantity(product.minOrderQuantity || 1);
    }
  }, [product]);

  const handleQuantityChange = (newQuantity: number) => {
    const minQty = product?.minOrderQuantity || 1;
    if (newQuantity < minQty) {
      toast.error(`최소 주문 수량이 ${minQty}개인 상품입니다.`);
      return;
    }
    if (product?.maxOrderQuantity && newQuantity > product.maxOrderQuantity) {
      toast.error(`최대 주문 수량이 ${product.maxOrderQuantity}개인 상품입니다.`);
      return;
    }
    if (newQuantity > (product?.stock || 0)) {
      toast.error('재고가 부족합니다.');
      return;
    }
    setQuantity(newQuantity);
  };

  const handleOptionChange = (optionId: string) => {
    setSelectedOptionId(optionId);
    if (!product) return;
    
    if (optionId) {
      const option = product.options?.find(opt => opt.id === optionId);
      if (option) {
        setQuantity(option.quantity);
      }
    } else {
      setQuantity(product.minOrderQuantity || 1);
    }
  };

  const currentOption = product?.options?.find(opt => opt.id === selectedOptionId);
  const currentBonusItems = selectedOptionId && currentOption
    ? product?.bonusItems?.filter(item => item.optionId === selectedOptionId)
    : product?.bonusItems?.filter(item => !item.optionId);

  const currentUnitPrice = (() => {
    if (!product) return 0;
    
    // 1. If an option is selected, use that option's discount
    if (currentOption) {
      return product.price * (1 - currentOption.discountRate / 100);
    }
    
    // 2. Otherwise, check for tier pricing based on quantity
    const tier = [...product.tierPricing]
      .sort((a, b) => b.quantity - a.quantity)
      .find(t => quantity >= t.quantity);
      
    return tier ? tier.unitPrice : product.price;
  })();


  const handleAddToCart = async () => {
    if (!product) return;

    // Validation for package products
    if (product.isPackage) {
      if (product.itemInputType === 'input') {
        const totalSelected = Object.values(inputQuantities).reduce((a, b) => a + b, 0);
        if (totalSelected === 0) {
          setAlertDialog({
            isOpen: true,
            title: '상품 선택 필요',
            description: '최소 하나 이상의 상품을 선택해주세요.'
          });
          return;
        }
        if (totalSelected !== product.selectableCount) {
          setAlertDialog({
            isOpen: true,
            title: '선택 수량 확인',
            description: `총 ${product.selectableCount}개의 상품을 선택해야 합니다. (현재: ${totalSelected}개)`
          });
          return;
        }
      } else {
        if (selections.some(s => !s)) {
          setAlertDialog({
            isOpen: true,
            title: '상품 옵션 선택',
            description: '모든 상품 옵션을 선택해주세요.'
          });
          return;
        }
      }
    }

    const currentUser = storage.getUser();
    if (!currentUser) {
      if (window.confirm('로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login', { state: { from: location.pathname } });
      }
      return;
    }

    try {
      let finalSelections = undefined;
      if (product.isPackage) {
        if (product.itemInputType === 'input') {
          // Flatten inputQuantities to array of IDs: {A:2, B:1} -> [A, A, B]
          finalSelections = Object.entries(inputQuantities).flatMap(([id, qty]) => Array(qty).fill(id));
        } else {
          finalSelections = selections;
        }
      }
      await cartService.addToCart(
        product.id, 
        quantity, 
        isSubscription, 
        finalSelections,
        selectedOptionId || undefined,
        currentOption?.name
      );
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      setShowCartDialog(true);
    } catch (error: any) {
      console.error('Failed to add to cart', error);
      
      if (error.message === 'User not authenticated') {
        storage.clearAll();
        if (window.confirm('세션이 만료되었습니다. 다시 로그인 해주시겠습니까?')) {
          navigate('/login', { state: { from: location.pathname } });
        }
      } else {
        setAlertDialog({
          isOpen: true,
          title: '장바구니 담기 실패',
          description: '장바구니 담기에 실패했습니다. 잠시 후 다시 시도해주세요.'
        });
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

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
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div>
          <p className="text-xs text-neutral-500 mb-3 tracking-wide uppercase">{product.sku}</p>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 mb-6">{product.name}</h1>

          <div className="mb-12">
            {(() => {
              if (currentOption) {
                // Option-based Pricing
                const discountRate = currentOption.discountRate / 100;
                const unitPrice = product.price * (1 - discountRate);
                const totalPrice = unitPrice * currentOption.quantity;

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="text-sm mb-2">
                        <span className="text-neutral-600">정상가(개당): {product.price.toLocaleString()}</span>
                        {currentOption.discountRate > 0 ? (
                          <>
                            <span className="text-neutral-600">, </span>
                            <span className="text-red-600 font-bold">할인가({currentOption.discountRate}%적용)</span>
                            <span className="text-neutral-600">: {unitPrice.toLocaleString()} * {currentOption.quantity} EA</span>
                          </>
                        ) : (
                          <span className="text-neutral-600"> * {currentOption.quantity} EA</span>
                        )}
                      </div>
                      <div className="text-4xl tracking-tight text-[#1a2b4b] font-bold">
                        ₩{totalPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              }

              const currentTier = [...product.tierPricing]
                .sort((a, b) => b.quantity - a.quantity)
                .find(tier => quantity >= tier.quantity);
              
              if (currentTier) {
                const discountPercent = Math.round((1 - currentTier.unitPrice / product.price) * 100);
                return (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="text-sm mb-2">
                        <span className="text-neutral-600">정상가(개당): {product.price.toLocaleString()}</span>
                        {discountPercent > 0 ? (
                          <>
                            <span className="text-neutral-600">, </span>
                            <span className="text-red-600 font-bold">할인가({discountPercent}%적용)</span>
                            <span className="text-neutral-600">: {currentTier.unitPrice.toLocaleString()} * {quantity} EA</span>
                          </>
                        ) : (
                          <span className="text-neutral-600"> * {quantity} EA</span>
                        )}
                      </div>
                      <div className="text-4xl tracking-tight text-[#1a2b4b] font-bold">
                        ₩{(currentTier.unitPrice * quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div className="flex flex-col gap-2">
                  <div className="text-sm mb-1">
                    <span className="text-neutral-600">정상가(개당): {product.price.toLocaleString()} * {quantity} EA</span>
                  </div>
                  <div className="text-4xl tracking-tight text-[#1a2b4b] font-bold">
                    ₩{(product.price * quantity).toLocaleString()}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Bonus Items Display */}
          {currentBonusItems && currentBonusItems.length > 0 && (
            <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-sm">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-blue-900 tracking-tight">
                  {selectedOptionId ? `${currentOption?.name} 전용 추가 증정` : '입급 시 추가 증정 혜택'}
                </h3>
              </div>
              <ul className="space-y-2">
                {currentBonusItems.map((item) => (
                  <li key={item.id} className="text-sm text-blue-800 flex items-center justify-between bg-white/50 p-2 rounded-sm border border-blue-100/50">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{item.product?.name}</span>
                    </div>
                    <span className="font-bold whitespace-nowrap ml-4">{item.quantity} EA</span>
                  </li>
                ))}
              </ul>
            </div>
          )}



          {/* Compatible Equipment */}
          {compatibleModels.length > 0 && (
            <div className="bg-green-50 border border-green-200 p-6 mb-8">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-base font-medium text-green-900 mb-3">
                    보유 장비와 호환됩니다
                  </p>
                  <ul className="space-y-1">
                    {compatibleModels.map(model => (
                      <li key={model.id} className="text-sm text-green-700">
                        • {model.model_name} (Code: {model.code})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Package Selections */}
          {product.isPackage && (
            <div className="mb-8 space-y-6">
              <div className="border-b border-neutral-200 pb-4 flex justify-between items-end">
                <div>
                  <h3 className="text-base font-medium text-neutral-900 mb-1">패키지 구성 선택</h3>
                  <p className="text-sm text-neutral-500">지정된 수량만큼 상품을 선택해 주세요 ({product.selectableCount}개)</p>
                </div>
                {product.itemInputType === 'input' && (
                  <div className="text-sm font-semibold">
                    선택됨: <span className={Object.values(inputQuantities).reduce((a, b) => a + b, 0) === product.selectableCount ? 'text-green-600' : 'text-blue-600'}>
                      {Object.values(inputQuantities).reduce((a, b) => a + b, 0)}
                    </span> / {product.selectableCount}
                  </div>
                )}
              </div>

              {product.itemInputType === 'input' ? (
                /* Direct Quantity Input Mode */
                <div className="space-y-3">
                  {packageItems.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between p-4 border border-neutral-200 hover:border-neutral-300 transition-colors bg-white">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neutral-900">{item.product?.name}</div>
                        <div className="text-xs text-neutral-500 mt-1">최대 {item.maxQuantity || '제한없음'}개 선택 가능</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const current = inputQuantities[item.productId] || 0;
                            if (current > 0) {
                              setInputQuantities(prev => ({ ...prev, [item.productId]: current - 1 }));
                            }
                          }}
                          className="w-8 h-8 border border-neutral-300 flex items-center justify-center hover:bg-neutral-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="w-8 text-center text-sm font-medium">{inputQuantities[item.productId] || 0}</div>
                        <button
                          type="button"
                          onClick={() => {
                            const current = inputQuantities[item.productId] || 0;
                            const total = Object.values(inputQuantities).reduce((a, b) => a + b, 0);
                            
                            // Check item max quantity
                            if (item.maxQuantity && current >= item.maxQuantity) {
                              setAlertDialog({
                                isOpen: true,
                                title: '최대 수량 초과',
                                description: `이 상품은 최대 ${item.maxQuantity}개까지 선택 가능합니다.`
                              });
                              return;
                            }
                            
                            // Check package total selectable count
                            if (total >= (product.selectableCount || 0)) {
                              setAlertDialog({
                                isOpen: true,
                                title: '선택 가능 개수 초과',
                                description: `총 ${product.selectableCount}개까지만 선택 가능합니다.`
                              });
                              return;
                            }
                            
                            setInputQuantities(prev => ({ ...prev, [item.productId]: current + 1 }));
                          }}
                          className="w-8 h-8 bg-neutral-100 flex items-center justify-center hover:bg-neutral-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Option List Selection Mode (Original) */
                <div className="space-y-4">
                  {selections.map((selectedId, index) => (
                    <div key={index} className="space-y-2">
                      <label className="block text-xs tracking-wide text-neutral-700 uppercase font-medium">
                        옵션 {index + 1}
                      </label>
                      <select
                        value={selectedId}
                        onChange={(e) => {
                          const newSelections = [...selections];
                          newSelections[index] = e.target.value;
                          setSelections(newSelections);
                        }}
                        className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white transition-all text-sm"
                      >
                        <option value="">상품을 선택하세요</option>
                        {packageItems.map((item) => (
                          <option key={item.productId} value={item.productId}>
                            {item.product?.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Option Selector or Quantity Selector */}
          {product.options && product.options.length > 0 ? (
            <div className="mb-8">
              <label className="block text-xs tracking-wide text-neutral-700 mb-4 uppercase font-medium">
                구매 세트 선택 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <select
                  value={selectedOptionId}
                  onChange={(e) => handleOptionChange(e.target.value)}
                  className="w-full px-4 py-4 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white transition-all text-base font-medium"
                >
                  <option value="">세트 구성을 선택하세요</option>
                  {product.options.map((opt) => {
                    const discountRate = opt.discountRate / 100;
                    const unitPrice = product.price * (1 - discountRate);
                    const totalPrice = unitPrice * opt.quantity;
                    return (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} (수량: {opt.quantity}개 / ₩{totalPrice.toLocaleString()})
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-neutral-500">
                  세트 옵션 상품은 지정된 수량 단위로만 구매 가능합니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <label className="block text-xs tracking-wide text-neutral-700 mb-4 uppercase font-medium">
                수량
              </label>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={product.minOrderQuantity === product.maxOrderQuantity}
                    className={`w-12 h-12 border border-neutral-300 flex items-center justify-center transition-colors ${
                      product.minOrderQuantity === product.maxOrderQuantity 
                        ? 'bg-neutral-50 cursor-not-allowed opacity-50' 
                        : 'hover:border-neutral-900'
                    }`}
                  >
                    <Minus className="w-5 h-5 text-neutral-700" />
                  </button>
                  <div className="w-20 text-center">
                    <span className="text-2xl font-light tracking-tight text-neutral-900">{quantity}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={product.minOrderQuantity === product.maxOrderQuantity}
                    className={`w-12 h-12 flex items-center justify-center transition-colors ${
                      product.minOrderQuantity === product.maxOrderQuantity 
                        ? 'bg-neutral-50 border border-neutral-200 cursor-not-allowed opacity-50 text-neutral-400' 
                        : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {/* 재고 표시 제거됨 */}
              </div>
            </div>
          )}

          {/* Subscription Option */}
          {(product.subscriptionDiscount ?? 0) > 0 && (
            <div className="mb-8">
              <label className="flex items-center gap-4 p-6 border border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-colors">
                <input
                  type="checkbox"
                  checked={isSubscription}
                  onChange={(e) => setIsSubscription(e.target.checked)}
                  className="w-5 h-5 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                />
                <div>
                  <p className="text-base font-medium text-neutral-900">정기 배송 ({product.subscriptionDiscount}% 추가 할인)</p>
                  <p className="text-sm text-neutral-600 mt-1">매달 자동으로 배송받으세요</p>
                </div>
              </label>
            </div>
          )}

          {/* Total Price */}
          <div className="bg-neutral-50 border border-neutral-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-neutral-700">총 금액</span>
              <span className="text-3xl tracking-tight text-neutral-900 font-bold">
                ₩{(currentUnitPrice * quantity * (isSubscription ? (1 - (product.subscriptionDiscount || 0) / 100) : 1)).toLocaleString()}
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
              onClick={async () => {
                await handleAddToCart();
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
      <div className="mb-16">
        <div className="border-t border-neutral-200 pt-12 mb-8">
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-8">상품설명</h2>
        </div>

        {/* Text Description (Rendered as HTML) */}
        <div className="mb-12">
          <div
            className="prose prose-neutral max-w-none text-lg text-neutral-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>

        {/* Additional Images */}
        {product.additionalImages && product.additionalImages.length > 0 && (
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
        )}
      </div>

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
                  반품/교환 안내<br />A/S안내
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
                  교환 및 반품이<br />불가능한 경우
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
                  <ProductImage
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

      {/* Alert Dialog */}
      <Dialog open={alertDialog.isOpen} onOpenChange={(open) => setAlertDialog(prev => ({...prev, isOpen: open}))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-neutral-900">{alertDialog.title}</DialogTitle>
            <DialogDescription className="text-base text-neutral-600">
              {alertDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setAlertDialog(prev => ({...prev, isOpen: false}))}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3 px-6 font-medium transition-colors text-sm tracking-wide uppercase"
            >
              확인
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}