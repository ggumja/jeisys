import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ShoppingCart, Check, Minus, Plus, Package, Loader2, CreditCard, X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import { equipmentService, EquipmentModel } from '../services/equipmentService';
import { Product, PackageItem, ProductOptionGroup, SubscriptionProductOption, RoundCombination } from '../types';
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
import { useModal } from '../context/ModalContext';
import { calculateSchedule } from '../services/subscriptionService';

export function ProductDetailPage() {
  const { alert: globalAlert, confirm: globalConfirm } = useModal();
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isSubscription, setIsSubscription] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [packageItems, setPackageItems] = useState<PackageItem[]>([]);
  const [selections, setSelections] = useState<string[]>([]);
  const [inputQuantities, setInputQuantities] = useState<Record<string, number>>({});
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [activeImage, setActiveImage] = useState<string>('');
  // 정기구독 전용 상품 선택 상태 (product_type === 'subscription')
  const [selectedSubOption, setSelectedSubOption] = useState<SubscriptionProductOption | null>(null);
  const [selectedCycleMonths, setSelectedCycleMonths] = useState<number | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<RoundCombination | null>(null);
  const [subScheduleOpen, setSubScheduleOpen] = useState(true);
  const [subTermsAgreed, setSubTermsAgreed] = useState(false);
  const [selectedBillingDay, setSelectedBillingDay] = useState<number>(new Date().getDate()); // 결제일 (1~28)
  // 기존 플래그형 정기배송 (is_subscription_product, 구버전)
  const [subQty, setSubQty] = useState<number>(100);
  const [subCycle, setSubCycle] = useState<1 | 2 | 3 | 6>(1);
  
  // Promotion States
  const [promotionPool, setPromotionPool] = useState<Product[]>([]);
  const [selectedPromotionPaid, setSelectedPromotionPaid] = useState<string[]>([]);
  const [selectedPromotionFree, setSelectedPromotionFree] = useState<string[]>([]);

  const [compatibleModels, setCompatibleModels] = useState<EquipmentModel[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  // 상품 옵션 그룹 (색상/사이즈 등)
  const [variantGroups, setVariantGroups] = useState<ProductOptionGroup[]>([]);
  // 선택된 옵션 그룹별 값 ID: { [groupId]: valueId }
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  
  // 추가 구성 상품 목록 및 선택 수량
  const [addOnProducts, setAddOnProducts] = useState<Product[]>([]);
  const [selectedAddOnQtys, setSelectedAddOnQtys] = useState<Record<string, number>>({});

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
      if (fetchedProduct?.imageUrl) {
        setActiveImage(fetchedProduct.imageUrl);
      }

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

        // Filter add-on products (actual configured add-on products)
        const addOns = (fetchedProduct.addOnItems?.map(item => item.product).filter(Boolean) as Product[]) || [];
        setAddOnProducts(addOns);
        setSelectedAddOnQtys({});

        // Filter compatible equipment
        // Note: fetchedProduct.compatibleEquipment stores codes. equipmentService returns models with codes.
        const compatible = allModels.filter(m =>
          fetchedProduct.compatibleEquipment.includes(m.code)
        );
        setCompatibleModels(compatible);

        // Load package items if this is a package
        if (fetchedProduct.isPackage) {
          // If product has options, items will be loaded when an option is selected
          if (!fetchedProduct.options || fetchedProduct.options.length === 0) {
            const items = await productService.getPackageItems(productId);
            setPackageItems(items);
            if (fetchedProduct.itemInputType === 'input') {
              const initQtys: Record<string, number> = {};
              items.forEach(item => {
                initQtys[item.productId] = 0;
              });
              setInputQuantities(initQtys);
            } else {
              setSelections(Array(fetchedProduct.selectableCount || 1).fill(''));
            }
          } else {
            // Options exist, wait for selection
            setPackageItems([]);
            setInputQuantities({});
          }
        }

        if (fetchedProduct.isPromotion) {
          const items = await productService.getPromotionItems(productId);
          setPromotionPool(items);
          setSelectedPromotionPaid([]);
          setSelectedPromotionFree([]);
        }

        // 상품 옵션 그룹 (색상/사이즈) 로드
        try {
          const groups = await productService.getProductOptionGroups(productId);
          setVariantGroups(groups);
          setSelectedVariants({});
        } catch {
          setVariantGroups([]);
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

  const addPromotionSelection = (productId: string, type: 'paid' | 'free') => {
    if (!product) return;
    
    if (type === 'paid') {
      const max = product.buyQuantity || 0;
      setSelectedPromotionPaid(prev => {
        if (prev.length < max) {
          return [...prev, productId];
        }
        return prev;
      });
    } else {
      const max = product.getQuantity || 0;
      setSelectedPromotionFree(prev => {
        if (prev.length < max) {
          return [...prev, productId];
        }
        return prev;
      });
    }
  };

  const removePromotionSelection = (productId: string, type: 'paid' | 'free') => {
    if (type === 'paid') {
      setSelectedPromotionPaid(prev => {
        const index = prev.lastIndexOf(productId);
        if (index !== -1) {
          const next = [...prev];
          next.splice(index, 1);
          return next;
        }
        return prev;
      });
    } else {
      setSelectedPromotionFree(prev => {
        const index = prev.lastIndexOf(productId);
        if (index !== -1) {
          const next = [...prev];
          next.splice(index, 1);
          return next;
        }
        return prev;
      });
    }
  };

  const handleOptionChange = async (optionId: string) => {
    setSelectedOptionId(optionId);
    if (!product) return;
    
    if (optionId) {
      const option = product.options?.find(opt => opt.id === optionId);
      if (option) {
        setQuantity(option.quantity);
        
        // Fetch specific items for this option
        try {
          const items = await productService.getPackageItems(product.id, optionId);
          setPackageItems(items);
          
          if (product.itemInputType === 'input') {
            const initQtys: Record<string, number> = {};
            items.forEach(item => {
              initQtys[item.productId] = item.maxQuantity || 0; // 옵션별 고정 수량 자동 채움
            });
            setInputQuantities(initQtys);
          } else {
            setSelections(Array(option.quantity || 1).fill(''));
          }
        } catch (error) {
          console.error('Failed to load option items', error);
          setPackageItems([]);
        }
      }
    } else {
      setQuantity(product.minOrderQuantity || 1);
      if (product.isPackage) {
        setPackageItems([]);
        setInputQuantities({});
      }
    }
  };

  const currentOption = product?.options?.find(opt => opt.id === selectedOptionId);
  // 상품 레벨(global) 증정품만 필터링
  const currentBonusItems = product?.bonusItems?.filter(item => !item.optionId) || [];

  // 선택된 옵션의 추가 금액 합산
  const variantAdditionalPrice = variantGroups.reduce((sum, group) => {
    const selectedValueId = selectedVariants[group.id];
    if (!selectedValueId) return sum;
    const val = group.values.find(v => v.id === selectedValueId);
    return sum + (val?.additionalPrice || 0);
  }, 0);

  // 선택된 추가 구성 상품 총액
  const addOnProductsTotalPrice = addOnProducts.reduce((sum, item) => {
    const qty = selectedAddOnQtys[item.id] || 0;
    return sum + (item.price * qty);
  }, 0);

  // 필수 옵션 그룹 중 단 하나도 선택된 값이 없는 그룹
  const unselectedRequiredGroups = variantGroups.filter(g => {
    if (!g.isRequired) return false;
    return !selectedVariants[g.id];
  });

  const currentUnitPrice = (() => {
    if (!product) return 0;
    const salesUnit = product.salesUnit || 1;
    
    // 1. If this is a promotion product, calculate sum of selected paid items
    if (product?.isPromotion) {
      if (selectedPromotionPaid.length === 0) return 0;
      return selectedPromotionPaid.reduce((sum, id) => {
        const item = promotionPool.find(p => p.id === id);
        return sum + (item?.price || 0);
      }, 0);
    }

    // 2. If an option is selected, use that option's price
    if (currentOption) {
      const baseOptionPrice = (currentOption.price && currentOption.price > 0) 
        ? currentOption.price 
        : (product.price * (currentOption.quantity || 1));
      return baseOptionPrice * (1 - (currentOption.discountRate || 0) / 100) + variantAdditionalPrice;
    }
    
    // 3. Otherwise, check for tier pricing based on quantity
    const tier = [...product.tierPricing]
      .reverse()
      .find((t) => quantity >= t.quantity);
    
    if (tier) {
      return tier.unitPrice + variantAdditionalPrice;
    }
    
    return product.price + variantAdditionalPrice;
  })();


  const handleAddToCart = async () => {
    if (!product) return;

    // 필수 옵션 미선택 검증
    if (unselectedRequiredGroups.length > 0) {
      await globalAlert({
        title: '옵션 선택 필요',
        description: `'${unselectedRequiredGroups.map(g => g.name).join(', ')}' 옵션을 선택해주세요.`
      });
      return;
    }

    // Validation for package products
    if (product.isPackage) {
      const targetCount = currentOption ? currentOption.quantity : product.selectableCount;

      if (product.itemInputType === 'input') {
        const totalSelected = Object.values(inputQuantities).reduce((a, b) => a + b, 0);
        if (totalSelected === 0) {
          await globalAlert({
            title: '상품 선택 필요',
            description: '최소 하나 이상의 상품을 선택해주세요.'
          });
          return;
        }
        if (totalSelected !== targetCount) {
          await globalAlert({
            title: '선택 수량 확인',
            description: `총 ${targetCount}개의 상품을 선택해야 합니다. (현재: ${totalSelected}개)`
          });
          return;
        }
      } else {
        if (selections.some(s => !s)) {
          await globalAlert({
            title: '상품 옵션 선택',
            description: '모든 상품 옵션을 선택해주세요.'
          });
          return;
        }
      }
    }

    const currentUser = storage.getUser();
    if (!currentUser) {
      if (await globalConfirm('로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login', { state: { from: location.pathname } });
      }
      return;
    }

      if (product.isPackage) {
        if (product.itemInputType === 'input') {
          const totalInputQty = Object.values(inputQuantities).reduce((a, b) => a + b, 0);
          const targetQty = currentOption ? (currentOption.quantity || 0) : (product.selectableCount || 0);
          if (totalInputQty !== targetQty) {
            toast.error(`총 ${targetQty}개의 상품을 선택해야 합니다.`);
            return;
          }
        } else if (selections.some(id => !id)) {
        toast.error('모든 패키지 구성을 선택해주세요.');
        return;
      }
    }

    if (product.isPromotion) {
      if (selectedPromotionPaid.length !== product.buyQuantity) {
        toast.error(`구매하실 상품을 ${product.buyQuantity}개 선택해주세요.`);
        return;
      }
      if (selectedPromotionFree.length !== product.getQuantity) {
        toast.error(`무료 증정 상품을 ${product.getQuantity}개 선택해주세요.`);
        return;
      }
    }

    try {
      let finalSelections: string[] | undefined = undefined;
      if (product.isPackage) {
        if (product.itemInputType === 'input') {
          finalSelections = Object.entries(inputQuantities).flatMap(([id, qty]) => Array(qty).fill(id));
        } else {
          finalSelections = selections;
        }
      } else if (product.isPromotion) {
        finalSelections = [...selectedPromotionPaid, ...selectedPromotionFree];
      }

      // JSON 객체로 옵션 구성
      let finalOptionName: string | undefined = undefined;
      const selectedVariantList = variantGroups.map(group => {
        const valueId = selectedVariants[group.id];
        if (!valueId) return null;
        const val = group.values.find(v => v.id === valueId);
        if (!val) return null;
        return {
          groupId: group.id,
          groupName: group.name,
          valueId: val.id,
          valueName: val.name,
          additionalPrice: val.additionalPrice
        };
      }).filter(Boolean);

      const labels = [];
      if (currentOption) {
        labels.push(currentOption.name);
      }
      selectedVariantList.forEach(v => {
        if (v) labels.push(v.valueName);
      });

      if (labels.length > 0 || selectedVariantList.length > 0) {
        finalOptionName = JSON.stringify({
          label: labels.join(' / '),
          variants: selectedVariantList
        });
      }

      await cartService.addToCart(
        product.id, 
        quantity, 
        isSubscription, 
        finalSelections,
        selectedOptionId || undefined,
        finalOptionName
      );

      // 추가 구성 상품 담기
      for (const item of addOnProducts) {
        const qty = selectedAddOnQtys[item.id] || 0;
        if (qty > 0) {
          await cartService.addToCart(item.id, qty, false);
        }
      }

      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      
      const proceedToCart = await globalConfirm({
          title: "장바구니에 담았습니다",
          description: "장바구니로 이동하시겠습니까?"
      });
      if (proceedToCart) {
          navigate('/cart');
      }
    } catch (error: any) {
      console.error('Failed to add to cart', error);
      
      if (error.message === 'User not authenticated') {
        storage.clearAll();
        if (await globalConfirm('세션이 만료되었습니다. 다시 로그인 해주시겠습니까?')) {
          navigate('/login', { state: { from: location.pathname } });
        }
      } else {
        await globalAlert({
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
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h1>
        <Link to="/products" className="text-blue-600 hover:text-blue-700">
          상품 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-8 lg:py-12">
      {/* Breadcrumb */}
      <div className="text-sm text-neutral-600 mb-8">
        <Link to="/products" className="hover:text-neutral-900">상품</Link>
        <span className="mx-2">/</span>
        <span>{product.category}</span>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Product Image & Gallery */}
        <div className="space-y-4">
          <div className="bg-neutral-100 overflow-hidden aspect-square border border-neutral-200">
            <ProductImage
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>
          
          {/* Thumbnails */}
          {product.additionalImages && product.additionalImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveImage(product.imageUrl)}
                className={`w-20 h-20 flex-shrink-0 border-2 transition-all ${activeImage === product.imageUrl ? 'border-neutral-900' : 'border-neutral-200 hover:border-neutral-400'}`}
              >
                <img src={product.imageUrl} alt="thumbnail main" className="w-full h-full object-cover" />
              </button>
              {product.additionalImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`w-20 h-20 flex-shrink-0 border-2 transition-all ${activeImage === imgUrl ? 'border-neutral-900' : 'border-neutral-200 hover:border-neutral-400'}`}
                >
                  <img src={imgUrl} alt={`thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <p className="text-xs text-neutral-500 mb-3 tracking-wide uppercase">{product.sku}</p>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-neutral-900 mb-4">
            {product.name}
          </h1>
          <div className="mb-4 leading-none flex items-center gap-1">
            {product.creditAvailable && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider transform scale-[0.7] origin-left">
                크레딧 사용가능
              </span>
            )}
            {( (product.salesUnit && product.salesUnit > 1) || (product.options && product.options.length > 0) || product.isPackage ) && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-green-600 text-white uppercase tracking-wider transform scale-[0.7] origin-left">
                SET
              </span>
            )}
          </div>

          <div className="mb-12">
            <div className="flex flex-col gap-2">
              <div className="space-y-1">
                {currentOption ? (() => {
                  const basePrice = (currentOption.price && currentOption.price > 0) ? currentOption.price : (product.price * (currentOption.quantity || 1));
                  const discountRate = currentOption.discountRate || 0;
                  const discountedTotal = Math.round(basePrice * (1 - discountRate / 100));
                  const unitPrice = Math.round(discountedTotal / (currentOption.quantity || 1));
                  const regUnitPrice = Math.round(basePrice / (currentOption.quantity || 1));

                  return (
                    <>
                      <div className="text-sm text-neutral-600 font-medium font-outfit">
                        <span className="line-through decoration-neutral-400">₩{basePrice.toLocaleString()}원</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-2xl lg:text-4xl tracking-tight text-red-600 font-black flex items-center gap-2">
                          ₩{discountedTotal.toLocaleString()}
                          <span className="text-sm lg:text-base font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-sm border border-blue-100 uppercase">
                            {currentOption.quantity}개 SET할인-{discountRate}% 적용
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 font-medium mt-1">
                          (개당 단가: ₩{unitPrice.toLocaleString()}원)
                        </div>
                      </div>
                    </>
                  );
                })() : (
                  <>
                    {(() => {
                      // If it's a package or has options, but nothing is selected yet, show 0 won
                      if (((product.options && product.options.length > 0) || product.isPackage || product.isPromotion) && !currentOption && selectedPromotionPaid.length === 0) {
                        return (
                          <div className="text-4xl lg:text-5xl tracking-tighter text-red-600 font-black font-outfit">
                            ₩0
                          </div>
                        );
                      }

                      const listPricePerPiece = product.price;
                      const discountRate = product.discountRate || 0;
                      
                      // ── 정기구독 전용 상품: 선택된 옵션의 할인 단가 표시 ──
                      if (product.product_type === 'subscription') {
                        if (selectedSubOption && selectedSubOption.discountRate > 0) {
                          const discountedUnit = Math.round(product.price * (1 - selectedSubOption.discountRate / 100));
                          return (
                            <>
                              <div className="text-sm text-neutral-500 font-medium font-outfit">
                                <span className="line-through decoration-neutral-400">₩{product.price.toLocaleString()}원</span>
                              </div>
                              <div className="text-4xl lg:text-5xl tracking-tighter text-red-600 font-black font-outfit">
                                ₩{discountedUnit.toLocaleString()}
                              </div>

                            </>
                          );
                        }
                        // 옵션 미선택 시 기본가
                        return (
                          <div className="text-4xl lg:text-5xl tracking-tighter text-red-600 font-black font-outfit">
                            ₩{product.price.toLocaleString()}
                          </div>
                        );
                      }

                      const totalListPrice = listPricePerPiece * quantity;
                      const totalDiscountedPrice = currentUnitPrice * quantity;
                      const finalAmount = isSubscription ? Math.round(totalDiscountedPrice * (1 - (product.subscriptionDiscount || 0) / 100)) : totalDiscountedPrice;

                      return (
                        <>
                          <div className="text-sm text-neutral-600 font-medium font-outfit">
                            <span className="line-through decoration-neutral-400">₩{totalListPrice.toLocaleString()}원</span>
                          </div>
                          <div className="text-4xl lg:text-5xl tracking-tighter text-red-600 font-black font-outfit">
                            ₩{finalAmount.toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-400 font-medium mt-1">
                            (개당 단가: ₩{currentUnitPrice.toLocaleString()}원)
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
                  {isSubscription && !currentOption && (
                    <div className="text-xs text-blue-600 font-bold mt-1">
                      [정기배송 {product.subscriptionDiscount}% 할인 적용 가능]
                    </div>
                  )}
                  {isSubscription && currentOption && (
                    <div className="text-xs text-blue-600 font-bold mt-1">
                      [정기배송 시 +{product.subscriptionDiscount}% 추가 할인]
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tier Pricing Information Banner */}
              {product.tierPricing && product.tierPricing.length > 0 && (
                <div className="mt-4 p-4 bg-red-50/50 border border-red-100 rounded-sm">
                  <div className="flex items-center gap-2 mb-1.5 border-l-2 border-red-500 pl-2">
                    <span className="text-xs font-black text-red-600 uppercase tracking-widest">다량할인 안내</span>
                  </div>
                  <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                    {product.tierPricing.length === 1 ? (
                      <span className="text-neutral-900">
                        {product.tierPricing[0].quantity}개 이상 구매 시 <strong>{Math.round((1 - product.tierPricing[0].unitPrice / product.price) * 100)}%</strong> 할인이 됩니다.
                      </span>
                    ) : (
                      <span className="text-neutral-900 flex flex-wrap gap-x-3 gap-y-1">
                        {product.tierPricing.map((t, i) => (
                          <span key={i} className="whitespace-nowrap">
                            {t.quantity}개 이상 <span className="text-red-600 font-black">{Math.round((1 - t.unitPrice / product.price) * 100)}%</span>할인{i < product.tierPricing.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>




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


          {/* Promotion Selector UI - Transformed to Professional Vertical List */}
          {product.isPromotion && (
            <div className="space-y-12 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Paid Items Selection (List View) */}
              <div className="space-y-4">
                <div className="flex items-end justify-between border-b-2 border-neutral-900 pb-4 text-neutral-900">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black uppercase">구매 상품 구성 <span className="text-sm font-bold text-neutral-400 ml-2">필수 선택</span></h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black">{selectedPromotionPaid.length}</span>
                    <span className="text-sm font-bold text-neutral-400 mx-1">/</span>
                    <span className="text-xl font-black text-neutral-400">{product.buyQuantity}</span>
                  </div>
                </div>
                
                <div className="border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
                  {promotionPool.map((item) => {
                    const count = selectedPromotionPaid.filter(id => id === item.id).length;
                    const canAdd = selectedPromotionPaid.length < (product.buyQuantity || 0);
                    
                    return (
                      <div
                        key={`paid-${item.id}`}
                        className={`flex items-center py-2.5 px-4 transition-all ${count > 0 ? 'bg-neutral-50' : 'bg-white'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <h4 className="text-sm font-bold text-neutral-900 truncate">{item.name}</h4>
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter flex-shrink-0">{item.sku}</span>
                          </div>
                        </div>
                        <div className="text-right px-4">
                          <p className="text-sm font-black text-red-500">₩{item.price.toLocaleString()}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 ml-4">
                          {count > 0 && (
                            <button
                              onClick={() => removePromotionSelection(item.id, 'paid')}
                              className="w-8 h-8 flex items-center justify-center border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 active:scale-95 transition-all font-bold"
                            >
                              -
                            </button>
                          )}
                          <span className={`w-6 text-center text-sm font-black tabular-nums ${count > 0 ? 'text-neutral-900' : 'text-neutral-300'}`}>
                            {count}
                          </span>
                          <button
                            onClick={() => addPromotionSelection(item.id, 'paid')}
                            disabled={!canAdd}
                            className={`w-8 h-8 flex items-center justify-center font-bold transition-all active:scale-95 border ${
                              canAdd ? 'border-neutral-900 bg-neutral-900 text-white hover:bg-black' : 'border-neutral-200 bg-white text-neutral-200 cursor-not-allowed'
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Free Items Selection (List View) */}
              <div className="space-y-4">
                <div className="flex items-end justify-between border-b-2 border-blue-600 pb-4 text-blue-600">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black uppercase">무료 증정 구성 <span className="text-sm font-bold text-blue-300 ml-2">보너스 혜택</span></h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black">{selectedPromotionFree.length}</span>
                    <span className="text-sm font-bold text-blue-300 mx-1">/</span>
                    <span className="text-xl font-black text-blue-300">{product.getQuantity}</span>
                  </div>
                </div>
                
                <div className="border border-blue-100 divide-y divide-blue-50 overflow-hidden">
                  {promotionPool.map((item) => {
                    const count = selectedPromotionFree.filter(id => id === item.id).length;
                    const canAdd = selectedPromotionFree.length < (product.getQuantity || 0);
                    
                    return (
                      <div
                        key={`free-${item.id}`}
                        className={`flex items-center py-2.5 px-4 transition-all ${count > 0 ? 'bg-blue-50/50' : 'bg-white'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <h4 className="text-sm font-bold text-neutral-900 truncate">{item.name}</h4>
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter flex-shrink-0">{item.sku}</span>
                          </div>
                        </div>
                        <div className="text-right px-4">
                          <p className="text-sm font-black text-blue-600 uppercase tracking-tighter italic">Free Gift</p>
                        </div>
                        
                        <div className="flex items-center gap-3 ml-4">
                          {count > 0 && (
                            <button
                              onClick={() => removePromotionSelection(item.id, 'free')}
                              className="w-8 h-8 flex items-center justify-center border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 active:scale-95 transition-all font-bold"
                            >
                              -
                            </button>
                          )}
                          <span className={`w-6 text-center text-sm font-black tabular-nums ${count > 0 ? 'text-blue-600' : 'text-neutral-300'}`}>
                            {count}
                          </span>
                          <button
                            onClick={() => addPromotionSelection(item.id, 'free')}
                            disabled={!canAdd}
                            className={`w-8 h-8 flex items-center justify-center font-bold transition-all active:scale-95 border ${
                              canAdd ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'border-neutral-200 bg-white text-neutral-200 cursor-not-allowed'
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── 상품 옵션 선택 (색상/사이즈 등) ── */}
          {variantGroups.length > 0 && (
            <div className="mb-8 space-y-6">
              {variantGroups.map(group => {
                return (
                  <div key={group.id}>
                    {/* 그룹 라벨 */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <label className="text-sm tracking-wide text-neutral-700 uppercase font-medium">
                        {group.name}
                        {group.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </label>
                    </div>

                    {/* 옵션 값 목록 */}
                    <div className="space-y-2">
                      {group.values.filter(v => v.isActive).map(val => {
                        const isSelected = selectedVariants[group.id] === val.id;
                        const hasColor = !!val.colorHex;

                        return (
                          <div
                            key={val.id}
                            className={`flex items-center justify-between border-2 transition-all ${
                              isSelected
                                ? 'border-neutral-900 bg-neutral-50'
                                : 'border-neutral-200 bg-white hover:border-neutral-300'
                            }`}
                          >
                            {/* 옵션명 + 색상 + 추가금액 */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVariants(prev => {
                                  const next = { ...prev };
                                  if (isSelected) {
                                    delete next[group.id];
                                  } else {
                                    next[group.id] = val.id;
                                  }
                                  return next;
                                });
                              }}
                              className="flex-1 flex items-center gap-3 px-4 py-3 text-left font-medium"
                            >
                              {hasColor && (
                                <span
                                  className={`w-5 h-5 rounded-full flex-shrink-0 border-2 ${isSelected ? 'border-neutral-900' : 'border-neutral-200'}`}
                                  style={{ backgroundColor: val.colorHex }}
                                />
                              )}
                              <span className={`text-sm ${isSelected ? 'text-neutral-900 font-bold' : 'text-neutral-600'}`}>
                                {val.name}
                              </span>
                              {val.additionalPrice > 0 && (
                                <span className={`text-xs font-semibold ${isSelected ? 'text-red-500' : 'text-neutral-400'}`}>
                                  +{val.additionalPrice.toLocaleString()}원
                                </span>
                              )}
                              {isSelected && (
                                <span className="ml-auto text-xs text-neutral-900 font-bold flex items-center gap-1">
                                  <Check className="w-4 h-4" /> 선택됨
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* 옵션 추가금액 합계 표시 */}
              {variantAdditionalPrice > 0 && (
                <div className="flex items-center justify-between py-2 border-t border-neutral-100">
                  <span className="text-xs text-neutral-500">옵션 추가금액</span>
                  <span className="text-sm font-bold text-red-500">+{variantAdditionalPrice.toLocaleString()}원</span>
                </div>
              )}
            </div>
          )}

          {/* Regular Option/Quantity Selectors - Hidden for Promotions & Subscription products */}
          {!product.isPromotion && product.product_type !== 'subscription' && (
            <>
              {product.options && product.options.length > 0 ? (

                <div className="mb-8">
                  <label className="block text-sm tracking-wide text-neutral-700 mb-4 uppercase font-medium">
                    구매 세트 선택 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <select
                      value={selectedOptionId}
                      onChange={(e) => handleOptionChange(e.target.value)}
                      className="w-full py-4 px-4 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white transition-all text-base font-medium"
                    >
                      <option value="">세트 구성을 선택하세요</option>
                      {product.options.map((opt) => {
                        const basePrice = opt.price > 0 ? opt.price : (product.price * (opt.quantity || 1));
                        const discountRate = opt.discountRate || 0;
                        const totalPrice = basePrice * (1 - discountRate / 100);
                        
                        return (
                          <option key={opt.id} value={opt.id}>
                            {opt.name} {discountRate > 0 ? `(${discountRate}% 할인)` : ''} - ₩{totalPrice.toLocaleString()}
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
                  <label className="block text-sm tracking-wide text-neutral-700 mb-4 uppercase font-medium">
                    수량 {product.salesUnit && product.salesUnit > 1 && (
                      <span className="text-neutral-500 lowercase font-normal ml-1">
                        (판매단위: {product.salesUnit}개)
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-6">
                    {product.quantityInputType === 'list' ? (
                      <div className="relative w-full max-w-[200px]">
                          <select
                            value={quantity}
                            onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                            className="w-full py-4 px-4 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white text-base font-medium"
                          >
                          {(() => {
                            const opts = [];
                            const unit = product.salesUnit || 1;
                            const minQty = product.minOrderQuantity || 1;
                            const maxQty = product.maxOrderQuantity || Math.min(product.stock, 100);
                            for (let i = minQty; i <= maxQty; i += unit) {
                              opts.push(<option key={i} value={i}>{i}개</option>);
                            }
                            return opts;
                          })()}
                          </select>
                        </div>
                    ) : (
                      <div className="flex items-center border border-neutral-300">
                        <button 
                          onClick={() => handleQuantityChange(quantity - (product.salesUnit || 1))}
                          className="w-12 h-12 flex items-center justify-center hover:bg-neutral-50 border-r border-neutral-300 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="w-16 h-12 flex items-center justify-center font-medium">
                          {quantity}
                        </div>
                        <button 
                          onClick={() => handleQuantityChange(quantity + (product.salesUnit || 1))}
                          className="w-12 h-12 flex items-center justify-center hover:bg-neutral-50 border-l border-neutral-300 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}



          {/* Package Composition Info - Condensed Static List */}
          {product.isPackage && selectedOptionId && (
            <div className="mb-6 p-4 bg-neutral-50 border border-neutral-200">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-3 bg-neutral-900" />
                  <h3 className="text-sm font-bold text-neutral-900 tracking-tight uppercase">패키지 구성 안내</h3>
                </div>
                <div className="text-xs font-bold text-neutral-500">
                  총 <span className="text-neutral-900">{currentOption?.quantity || 0}</span>개 구성
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-1.5">
                {packageItems.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-2">구성 정보가 없습니다.</p>
                ) : (
                  (() => {
                    const priceAfterDiscount = (currentOption?.price || 0) * (1 - (currentOption?.discountRate || 0) / 100);
                    const totalQty = currentOption?.quantity || 1;
                    const averageUnitPrice = Math.round(priceAfterDiscount / totalQty);

                    return packageItems.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-100/50 last:border-0">
                        <div className="flex items-center gap-2 text-neutral-800 min-w-0">
                          <span className="text-[10px] text-neutral-300">●</span>
                          <span className="truncate font-medium">{item.product?.name || '상품 정보 없음'}</span>
                        </div>
                        <div className="flex-shrink-0 font-black text-neutral-900 ml-4">
                          {item.maxQuantity || 0}개
                        </div>
                      </div>
                    ));
                  })()
                )}
              </div>

              {/* Package Price Summary - Added Breakdown */}
              <div className="mt-6 pt-6 border-t border-neutral-900/10 space-y-3">
                {(() => {
                  const listPriceTotal = currentOption?.price || 0;
                  const discountRate = currentOption?.discountRate || 0;
                  const finalTotal = Math.round(listPriceTotal * (1 - discountRate / 100));
                  const totalQty = currentOption?.quantity || 1;
                  const avgListPrice = Math.round(listPriceTotal / totalQty);
                  const avgDiscountPrice = Math.round(finalTotal / totalQty);

                  return (
                    <>
                      <div className="flex items-center justify-between text-neutral-500">
                        <span className="text-[10px] font-bold uppercase tracking-tighter">패키지 정가 합계</span>
                        <span className="text-sm font-medium line-through decoration-neutral-300">₩{listPriceTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-500 text-[10px] font-medium pl-2">
                        <span>ㄴ 평균 구성 정가 (1개 기준)</span>
                        <span>₩{avgListPrice.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-1">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">할인 적용 평균가</span>
                        <div className="flex items-baseline gap-1">
                          <div className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-sm mr-1 font-bold">SALE</div>
                          <span className="text-base font-black text-blue-600">₩{avgDiscountPrice.toLocaleString()}</span>
                          <span className="text-[10px] text-blue-400 font-bold">/ 개</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-neutral-900">
                        <span className="text-xs font-black text-neutral-900 uppercase">패키지 구매 합계</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-neutral-900 tracking-tighter">₩{finalTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 추가 구성 상품 (Add-on items selection) */}
          {addOnProducts.length > 0 && (
            <div className="mb-8 p-6 bg-neutral-50 border border-neutral-200 rounded-sm">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-neutral-600" />
                <h3 className="text-base font-bold text-neutral-900 tracking-tight">
                  추가 구성 상품
                </h3>
              </div>
              <ul className="space-y-3">
                {addOnProducts.map((item) => {
                  const qty = selectedAddOnQtys[item.id] || 0;
                  
                  return (
                    <li key={item.id} className="text-sm text-neutral-800 flex items-center justify-between bg-white p-3 rounded-sm border border-neutral-200">
                      <div className="flex-1 min-w-0 pr-4">
                        <span className="font-bold text-neutral-900 truncate block">{item.name}</span>
                        <span className="text-xs text-neutral-500 font-semibold block mt-0.5">
                          ₩{item.price.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center border border-neutral-300 bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedAddOnQtys(prev => ({
                                ...prev,
                                [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
                              }))
                            }
                            className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors border-r border-neutral-300 text-lg font-bold"
                          >
                            −
                          </button>
                          <span className="w-9 text-center text-xs font-bold tabular-nums text-neutral-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedAddOnQtys(prev => ({
                                ...prev,
                                [item.id]: (prev[item.id] || 0) + 1,
                              }))
                            }
                            className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors border-l border-neutral-300 text-lg font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Bonus Items Display */}
          {(product.itemInputType === 'input' || selectedOptionId) && currentBonusItems && currentBonusItems.length > 0 && (
            <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-sm">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-blue-900 tracking-tight">
                  추가 증정 상품 안내
                </h3>
              </div>
              <ul className="space-y-2">
                {currentBonusItems.map((item) => {
                  const displayQuantity = (!selectedOptionId && product.options && product.options.length > 0)
                    ? 0 
                    : (item.calculationMethod === 'ratio' 
                        ? Math.ceil(quantity * (item.percentage || 0) / 100)
                        : item.quantity);
                  
                  return (
                    <li key={item.id} className="text-sm text-blue-800 flex items-center justify-between bg-white/50 p-2 rounded-sm border border-blue-100/50">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{item.product?.name}</span>
                      </div>
                      <span className="font-bold whitespace-nowrap ml-4">
                        {displayQuantity} EA
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* ═══ 정기구독 전용 상품 (product_type='subscription') ═══ */}
          {product.product_type === 'subscription' && (product.subscriptionOptions ?? []).length > 0 ? (
            <div className="mb-8 space-y-6">

              {/* ① 구매 세트 선택 */}
              <div>
                <p className="text-sm font-bold text-neutral-800 mb-1">
                  구매 세트 선택 <span className="text-red-500">*</span>
                </p>
                <div className="border-t-2 border-neutral-900 mt-2">
                  {(product.subscriptionOptions ?? [])
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((opt) => {
                      const isSelected = selectedSubOption?.id === opt.id;
                      const totalPrice = Math.round(product.price * (1 - (opt.discountRate || 0) / 100)) * opt.totalQuantity;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            setSelectedSubOption(opt);
                            setSelectedCycleMonths(null);
                            setSelectedCombo(null);
                          }}
                          className="flex items-center justify-between px-4 py-4 border-b border-neutral-200 cursor-pointer transition-colors"
                          style={isSelected
                            ? { backgroundColor: '#EEF2FF' }
                            : { backgroundColor: '#ffffff' }
                          }
                        >
                          <div className="flex items-center gap-3">
                            {/* 라디오 버튼 */}
                            <div
                              className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                              style={isSelected
                                ? { borderColor: '#21358D', backgroundColor: '#21358D' }
                                : { borderColor: '#9ca3af', backgroundColor: '#ffffff' }
                              }
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-neutral-900">{opt.optionLabel}</p>

                            </div>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <p className="font-bold text-base text-red-600">
                              ₩{totalPrice.toLocaleString()}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              단가 ₩{Math.round(product.price * (1 - (opt.discountRate || 0) / 100)).toLocaleString()}/개
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* ② 결제 주기 선택 */}
              {selectedSubOption && (() => {
                const availableCycles = [...new Set(
                  selectedSubOption.roundCombinations.map(c => c.cycleMonths)
                )].sort((a, b) => a - b);
                const CYCLE_LABELS: Record<number, string> = { 1: '1개월마다', 2: '2개월마다', 3: '3개월마다', 4: '4개월마다', 6: '6개월마다' };
                return (
                  <div>
                    <p className="text-sm font-bold text-neutral-800 mb-1">
                      결제 주기 <span className="text-red-500">*</span>
                    </p>
                    <div className="border-t-2 border-neutral-900 mt-2 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {availableCycles.map(m => {
                          const isActive = selectedCycleMonths === m;
                          return (
                            <button
                              key={m}
                              onClick={() => { setSelectedCycleMonths(m); setSelectedCombo(null); }}
                              className="px-5 py-2.5 rounded-full border-2 text-sm font-semibold transition-all"
                              style={isActive
                                ? { borderColor: '#21358D', backgroundColor: '#21358D', color: '#ffffff' }
                                : { borderColor: '#d1d5db', backgroundColor: '#ffffff', color: '#374151' }
                              }
                            >
                              {CYCLE_LABELS[m] ?? `${m}개월마다`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ③ 회차 선택 */}
              {selectedSubOption && selectedCycleMonths && (() => {
                const combos = selectedSubOption.roundCombinations
                  .filter(c => c.cycleMonths === selectedCycleMonths)
                  .sort((a, b) => a.qtyPerRound - b.qtyPerRound);
                const unitPrice = Math.round(product.price * (1 - (selectedSubOption.discountRate || 0) / 100));
                return (
                  <div>
                    <p className="text-sm font-bold text-neutral-800 mb-1">
                      회차 선택 <span className="text-red-500">*</span>
                    </p>
                    <div className="border-t-2 border-neutral-900 mt-2">
                      {combos.map(c => {
                        const isSelected = selectedCombo?.cycleMonths === c.cycleMonths &&
                          selectedCombo?.qtyPerRound === c.qtyPerRound &&
                          selectedCombo?.totalRounds === c.totalRounds;
                        const roundPrice = unitPrice * c.qtyPerRound;
                        return (
                          <div
                            key={`${c.cycleMonths}-${c.qtyPerRound}`}
                            onClick={() => setSelectedCombo(c)}
                            className="flex items-center justify-between px-4 py-4 border-b border-neutral-200 cursor-pointer transition-colors"
                            style={isSelected ? { backgroundColor: '#EEF2FF' } : { backgroundColor: '#ffffff' }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                style={isSelected
                                  ? { borderColor: '#21358D', backgroundColor: '#21358D' }
                                  : { borderColor: '#9ca3af', backgroundColor: '#ffffff' }
                                }
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-neutral-900">
                                  회당 {c.qtyPerRound}개 × {c.totalRounds}회
                                </p>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  총 {c.totalRounds * c.cycleMonths}개월분 공급
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-neutral-500">회차</p>
                              <p className="font-bold text-sm text-neutral-900">₩{roundPrice.toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* 결제일 선택 (회차 선택 후 바로 표시) */}
              {selectedSubOption && selectedCombo && (
                <div className="mb-2 px-4 py-3 border border-neutral-200 bg-neutral-50">
                  <p className="text-sm font-bold text-neutral-800 mb-2">
                    결제일 선택 <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-neutral-400 ml-2">(2회차부터 적용)</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedBillingDay}
                      onChange={e => setSelectedBillingDay(Number(e.target.value))}
                      className="border border-neutral-300 text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#21358D]"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{d}일</option>
                      ))}
                    </select>
                    <span className="text-xs text-neutral-500">
                      1회차: 오늘({new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}) 결제<br />
                      2회차~: 매월 <strong>{selectedBillingDay}일</strong> 결제
                    </span>
                  </div>
                </div>
              )}

              {/* ④ 출고 스케줄 프리뷰 */}
              {selectedSubOption && selectedCombo && (() => {
                const unitPrice = Math.round(product.price * (1 - (selectedSubOption.discountRate || 0) / 100));
                const today = new Date();
                const rounds = Array.from({ length: selectedCombo.totalRounds }, (_, i) => {
                  const d = new Date(today);
                  if (i === 0) {
                    // 1회차: 오늘 날짜
                  } else {
                    // 2회차~: billingDay 기준으로 cycleMonths 후
                    d.setMonth(d.getMonth() + i * selectedCombo!.cycleMonths);
                    d.setDate(selectedBillingDay);
                    // 말일 오버 방지 (e.g. 31일 지정인데 2월 등)
                    const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                    if (selectedBillingDay > maxDay) d.setDate(maxDay);
                  }
                  return {
                    no: i + 1,
                    label: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`,
                    qty: selectedCombo!.qtyPerRound,
                    amount: selectedCombo!.qtyPerRound * unitPrice,
                  };
                });
                const total = rounds.reduce((s, r) => s + r.amount, 0);
                return (
                  <div className="border border-neutral-200">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                      onClick={() => setSubScheduleOpen(v => !v)}
                    >
                      <span>📦 회차별 출고 스케줄 ({rounds.length}회)</span>
                      {subScheduleOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {subScheduleOpen && (
                      <div className="border-t border-neutral-200 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs text-neutral-500">회차</th>
                              <th className="px-4 py-2 text-left text-xs text-neutral-500">출고 예정</th>
                              <th className="px-4 py-2 text-right text-xs text-neutral-500">수량</th>
                              <th className="px-4 py-2 text-right text-xs text-neutral-500">결제금액</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {rounds.map(r => (
                              <tr key={r.no}>
                                <td className="px-4 py-2 text-neutral-700 font-medium">{r.no}회차</td>
                                <td className="px-4 py-2 text-neutral-600">{r.label}</td>
                                <td className="px-4 py-2 text-right text-neutral-700">{r.qty}개</td>
                                <td className="px-4 py-2 text-right font-medium text-neutral-900">{r.amount.toLocaleString()}원</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-neutral-50 border-t">
                            <tr>
                              <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-neutral-600">총계</td>
                              <td className="px-4 py-2 text-right text-xs font-semibold text-neutral-600">{selectedSubOption.totalQuantity}개</td>
                              <td className="px-4 py-2 text-right text-xs font-semibold text-[#21358D]">
                                {(selectedSubOption.totalQuantity * unitPrice).toLocaleString()}원
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>

          ) : (product.is_subscription_product) ? (
            /* ── 구버전: 플래그형 정기구독 UI (수량/주기 직접 선택) ── */
            <div className="mb-8 space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-[#21358D] pl-3">
                <RefreshCw className="w-4 h-4 text-[#21358D]" />
                <span className="text-sm font-semibold text-neutral-900">정기구독 설정</span>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">구독 수량</p>
                <div className="flex gap-2">
                  {[100, 200].map((q) => (
                    <button key={q} onClick={() => setSubQty(q)}
                      className={`flex-1 py-3 border text-sm font-medium transition-colors ${subQty === q ? 'border-[#21358D] bg-[#21358D] text-white' : 'border-neutral-300 text-neutral-700 hover:border-[#21358D]'}`}
                    >{q}개</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">결제 주기</p>
                <div className="grid grid-cols-4 gap-2">
                  {([1, 2, 3, 6] as const).map((m) => (
                    <button key={m} onClick={() => setSubCycle(m)}
                      className={`py-3 border text-sm font-medium transition-colors ${subCycle === m ? 'border-[#21358D] bg-[#21358D] text-white' : 'border-neutral-300 text-neutral-700 hover:border-[#21358D]'}`}
                    >{m}개월</button>
                  ))}
                </div>
              </div>
            </div>
          ) : (product.subscriptionDiscount ?? 0) > 0 ? (
            /* ── 일반 정기배송 체크박스 ── */
            <div className="mb-8">
              <label className="flex items-center gap-4 p-6 border border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-colors">
                <input type="checkbox" checked={isSubscription} onChange={(e) => setIsSubscription(e.target.checked)}
                  className="w-5 h-5 text-neutral-900 border-neutral-300 focus:ring-neutral-900" />
                <div>
                  <p className="text-base font-medium text-neutral-900">정기 배송 ({product.subscriptionDiscount}% 추가 할인)</p>
                  <p className="text-sm text-neutral-600 mt-1">매달 자동으로 배송받으세요</p>
                </div>
              </label>
            </div>
          ) : null}


          {/* Total Amount Summary Section */}
          <div className="py-8 border-t border-neutral-200 mt-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-neutral-900 uppercase tracking-widest">총 합계</span>
              <div className="text-right">
                <div className="text-4xl font-black tracking-tighter text-red-600">
                  ₩{(() => {
                    // ── 정기구독 전용 상품 계산 ──
                    if (product.product_type === 'subscription') {
                      if (!selectedSubOption) {
                        return product.price.toLocaleString();
                      }
                      // 세트 총 금액 표시 (단가 × 총 수량)
                      const discountedUnitPrice = Math.round(product.price * (1 - (selectedSubOption.discountRate || 0) / 100));
                      return (discountedUnitPrice * selectedSubOption.totalQuantity).toLocaleString();
                    }

                    // ── 일반 상품 계산 ──
                    if (!selectedOptionId && product.options && product.options.length > 0) return "0";
                    
                    let total = 0;
                    if (currentOption) {
                      const base = (currentOption.price && currentOption.price > 0) ? currentOption.price : (product.price * (currentOption.quantity || 1));
                      total = Math.round(base * (1 - (currentOption.discountRate || 0) / 100)) + variantAdditionalPrice + addOnProductsTotalPrice;
                    } else {
                      total = currentUnitPrice * quantity + addOnProductsTotalPrice;
                    }
                    
                    const finalAmount = isSubscription ? Math.round(total * (1 - (product.subscriptionDiscount || 0) / 100)) : total;
                    return finalAmount.toLocaleString();
                  })()}
                </div>
                {/* 정기구독: 선택된 옵션 요약 */}

              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {(product.product_type === 'subscription' || product.isSubscriptionProduct) && (product.subscriptionOptions ?? []).length > 0 ? (
            /* 정기구독 전용: 바로구매만 */
            <div className="flex flex-col gap-3 mb-6 mt-4">

              {/* 정기구독 약관 동의 */}
              <div className="border border-neutral-200 rounded-sm">
                {/* 약관 내용 영역 */}
                <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                  <p className="text-xs font-bold text-neutral-700 mb-2">정기구독 서비스 이용 약관</p>
                  <div className="h-28 overflow-y-auto text-[11px] text-neutral-500 leading-relaxed space-y-1.5 pr-1">
                    <p><strong>제1조 (목적)</strong> 본 약관은 제이시스메디칼(이하 "회사")이 제공하는 정기구독 서비스 이용에 관한 기본적인 사항을 규정합니다.</p>
                    <p><strong>제2조 (서비스 내용)</strong> 회사는 고객이 선택한 수량 및 결제 주기에 따라 상품을 정기적으로 배송합니다. 구독 계약 기간 동안 매 회차마다 지정된 금액이 등록된 신용카드에서 자동 청구됩니다.</p>
                    <p><strong>제3조 (결제)</strong> 결제는 등록된 신용카드를 통해 각 회차 배송일 기준으로 자동 청구됩니다. 결제 실패 시 배송이 보류될 수 있습니다.</p>
                    <p><strong>제4조 (중도해지)</strong> 고객은 언제든지 구독을 해지 신청할 수 있으나, 중도 해지 시 잔여 회차에 대해 위약금이 발생할 수 있습니다. 위약금은 관리자가 심사 후 별도 통보합니다.</p>
                    <p><strong>제5조 (개인정보)</strong> 회사는 서비스 제공을 위해 필요한 최소한의 개인정보를 수집·이용하며, 관련 법령에 따라 보호합니다.</p>
                    <p><strong>제6조 (면책)</strong> 천재지변, 제조사 사정 등 불가피한 사유로 인한 배송 지연은 회사의 귀책사유가 아닙니다.</p>
                  </div>
                </div>
                {/* 동의 체크박스 */}
                <label className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none">
                  <div
                    onClick={() => setSubTermsAgreed(v => !v)}
                    className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={subTermsAgreed
                      ? { borderColor: '#21358D', backgroundColor: '#21358D' }
                      : { borderColor: '#9ca3af', backgroundColor: '#ffffff' }
                    }
                  >
                    {subTermsAgreed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span
                    onClick={() => setSubTermsAgreed(v => !v)}
                    className="text-sm font-medium text-neutral-800"
                  >
                    정기구독 서비스 이용 약관에 <span className="text-[#21358D] font-bold">동의합니다</span>
                  </span>
                </label>
              </div>

              {/* 바로구매 버튼 */}
              {(() => {
                const canBuy = !!selectedSubOption && !!selectedCycleMonths && !!selectedCombo && subTermsAgreed;
                return (
                <button
                 disabled={!canBuy}
                 onClick={async () => {
                  try {
                    if (!selectedSubOption) {
                      toast.error('구독 옵션(수량 세트)을 먼저 선택해주세요.');
                      return;
                    }
                    if (!selectedCombo) {
                      toast.error('결제 주기 & 회차 조합을 선택해주세요.');
                      return;
                    }
                    const discountedPrice = Math.round(product.price * (1 - (selectedSubOption.discountRate || 0) / 100));
                    console.log('[바로구매] productId:', product.id, 'qty:', selectedCombo.qtyPerRound);

                    // 장바구니 비우기
                    try { await cartService.clearCart(); } catch (_) { /* 비로그인 무시 */ }

                    // 장바구니에 추가 (is_subscription=true)
                    await cartService.addToCart(
                      product.id,
                      selectedCombo.qtyPerRound,
                      true, // isSubscription
                    );

                    // 구독 세부 정보는 navigate state로 전달
                    navigate('/checkout', {
                      state: {
                        subscriptionMeta: {
                          optionId: selectedSubOption.id,
                          optionLabel: selectedSubOption.optionLabel,
                          discountRate: selectedSubOption.discountRate,
                          regularPrice: product.price,  // 할인 전 원가 (개당)
                          discountedPrice,
                          totalQuantity: selectedSubOption.totalQuantity,
                          cycleMonths: selectedCombo.cycleMonths,
                          qtyPerRound: selectedCombo.qtyPerRound,
                          totalRounds: selectedCombo.totalRounds,
                          billingDay: selectedBillingDay,  // 결제일
                        },
                      },
                    });
                  } catch (err: any) {
                    console.error('[바로구매] error:', err);
                    toast.error(`구매 처리 중 오류가 발생했습니다: ${err.message || err}`);
                  }
                }}
                style={canBuy
                  ? { backgroundColor: '#21358D', color: '#ffffff', cursor: 'pointer' }
                  : { backgroundColor: '#d1d5db', color: '#9ca3af', cursor: 'not-allowed' }
                }
                className="w-full py-4 font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all"
              >
                <CreditCard className="w-5 h-5" />
                바로 구매
              </button>
              );
              })()}
              <p className="text-xs text-center text-neutral-400">정기구독 상품은 바로 구매만 가능합니다.</p>
            </div>
          ) : (
            /* 일반 상품: 장바구니 + 바로구매 */
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-4 font-medium flex items-center justify-center gap-2 transition-colors text-sm tracking-wide uppercase cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
                {addedToCart ? '장바구니에 담김!' : '장바구니'}
              </button>
              <button
                onClick={async () => {
                  await handleAddToCart();
                  navigate('/cart');
                }}
                className="flex-1 bg-[#1e3a8a] hover:bg-[#1e40af] text-white py-4 font-medium transition-colors text-sm tracking-wide uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                바로 구매
              </button>
            </div>
          )}

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
                  <h3 className="text-sm font-medium text-neutral-900 mb-1 line-clamp-2">
                    {p.name}
                  </h3>
                  <div className="mb-1 leading-none flex items-center gap-1">
                    {p.creditAvailable && (
                      <span className="inline-flex items-center px-1 py-0.5 rounded-[2px] text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider transform scale-[0.65] origin-left">
                        크레딧 사용가능
                      </span>
                    )}
                    {( (p.salesUnit && p.salesUnit > 1) || (p.options && p.options.length > 0) || p.isPackage ) && (
                      <span className="inline-flex items-center px-1 py-0.5 rounded-[2px] text-[10px] font-bold bg-green-600 text-white uppercase tracking-wider transform scale-[0.65] origin-left">
                        SET
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold tracking-tight text-neutral-900">
                    ₩{p.price.toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}