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
  // 정기공급 전용 상품 선택 상태 (product_type === 'subscription')
  const [selectedSubOption, setSelectedSubOption] = useState<SubscriptionProductOption | null>(null);
  const [selectedCycleMonths, setSelectedCycleMonths] = useState<number | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<RoundCombination | null>(null);
  const [subScheduleOpen, setSubScheduleOpen] = useState(true);
  const [subTermsAgreed, setSubTermsAgreed] = useState(false);
  const [isTermsExpanded, setIsTermsExpanded] = useState(false);
  const [subContractTermsAgreed, setSubContractTermsAgreed] = useState(false);
  const [isContractTermsExpanded, setIsContractTermsExpanded] = useState(false);
  const [selectedBillingDay, setSelectedBillingDay] = useState<number>(new Date().getDate()); // 결제일 (1~28)
  // 기존 플래그형 정기공급 (is_subscription_product, 구버전)
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
                      
                      // ── 정기공급 전용 상품: 선택된 옵션의 할인 단가 표시 ──
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
                      [정기공급 {product.subscriptionDiscount}% 할인 적용 가능]
                    </div>
                  )}
                  {isSubscription && currentOption && (
                    <div className="text-xs text-blue-600 font-bold mt-1">
                      [정기공급 시 +{product.subscriptionDiscount}% 추가 할인]
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

          {/* ═══ 정기공급 전용 상품 (product_type='subscription') ═══ */}
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
                      결제 및 출고 주기 <span className="text-red-500">*</span>
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
            /* ── 구버전: 플래그형 정기공급 UI (수량/주기 직접 선택) ── */
            <div className="mb-8 space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-[#21358D] pl-3">
                <RefreshCw className="w-4 h-4 text-[#21358D]" />
                <span className="text-sm font-semibold text-neutral-900">정기공급 설정</span>
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
                <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">결제 및 출고 주기</p>
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
            /* ── 일반 정기공급 체크박스 ── */
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
                    // ── 정기공급 전용 상품 계산 ──
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
                {/* 정기공급: 선택된 옵션 요약 */}

              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {(product.product_type === 'subscription' || product.isSubscriptionProduct) && (product.subscriptionOptions ?? []).length > 0 ? (
            /* 정기공급 전용: 바로구매만 */
            <div className="flex flex-col gap-3 mb-6 mt-4">

              {/* 1. 정기 공급 서비스 이용 약관 (아코디언 형태) */}
              <div className="border border-neutral-200 rounded-sm">
                {/* 약관 헤더 */}
                <button
                  type="button"
                  onClick={() => setIsContractTermsExpanded(v => !v)}
                  className="w-full px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-left cursor-pointer hover:bg-neutral-100 transition-colors"
                >
                  <span className="text-xs font-bold text-neutral-700">정기 공급 서비스 이용 약관</span>
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <span>{isContractTermsExpanded ? '접기' : '자세히 보기'}</span>
                    {isContractTermsExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-600" />
                    )}
                  </div>
                </button>

                {/* 약관 내용 영역 */}
                {isContractTermsExpanded && (
                  <div className="px-4 py-3 bg-white border-b border-neutral-200">
                    <div
                      style={{ height: '250px', maxHeight: '250px', overflowY: 'scroll' }}
                      className="text-[11px] text-neutral-600 leading-relaxed space-y-3 pr-2 always-visible-scrollbar"
                    >
                      <p className="font-bold text-xs text-neutral-800 border-b pb-1">“제이시스몰” 정기공급(분할결제) 서비스 이용약관</p>
                      
                      <div>
                        <p className="font-semibold text-neutral-700">제1조(목적)</p>
                        <p>1. 본 약관은 주식회사 제이시스메디칼(이하 “회사”라 합니다)이 운영하는 제이시스 쇼핑몰(이하 “제이시스몰”이라 합니다)을 통해 제공하는 정기공급(분할결제) 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무, 책임 및 기타 필요한 사항을 정하는 것을 목적으로 합니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제2조(용어의 정의)</p>
                        <p>1. “정기공급 서비스”란 회원이 일정한 총수량의 상품을 구매하기로 약정하고, 그 대금의 지급과 상품의 공급을 여러 회차로 나누어 진행하는 서비스를 말합니다.</p>
                        <p>2. “정기공급 계약”이란 회원이 상품, 총 약정수량, 계약 적용단가, 공급기간, 결제·출고 주기 및 회차별 출고수량 등을 선택하여 회사와 체결하는 하나의 총수량 공급계약을 말합니다.</p>
                        <p>3. “회원”이란 “제이시스몰” 회원 중 사업자등록을 보유한 의료기관, 의료기관 개설자 또는 기타 회사가 정한 사업자 회원으로서 본 약관에 동의하고 정기공급 계약을 체결한 자를 말합니다.</p>
                        <p>4. “총 약정수량”이란 회원이 정기공급 계약에 따라 구매하기로 확정한 전체 상품수량을 말합니다.</p>
                        <p>5. “기출고수량”이란 정기공급 계약에 따라 회원에게 출고 완료된 상품의 누적수량을 말합니다.</p>
                        <p>6. “미출고수량”이란 총 약정수량에서 기출고수량을 차감한 미출고 상품수량을 말합니다.</p>
                        <p>7. “정기공급 적용단가”란 회원이 총 약정수량을 구매하는 조건으로 정기공급 계약에 적용받는 상품 1개당 가격을 말합니다.</p>
                        <p>8. “수량별 단가”란 회사가 계약 체결 당시 고지한 수량별 단가표에 따라 실제 구매수량 구간별로 적용되는 상품 1개당 가격을 말합니다.</p>
                        <p>9. “개당 기준단가”란 수량별 단가표가 별도로 운영되지 않는 상품에 대하여 계약 체결 당시 상품페이지 또는 주문서에 별도로 고지된 상품 1개당 기준가격을 말합니다.</p>
                        <p>10. “재산정 단가”란 중도해지 시 기출고수량에 적용되는 수량별 단가 또는 개당 기준단가를 말합니다.</p>
                        <p>11. “출고 완료”란 상품이 회사의 물류처리 과정을 거쳐 택배사 또는 운송인에게 인계된 상태를 말합니다.</p>
                        <p>12. “개별 계약조건”이란 상품페이지, 주문서 또는 계약확인서에 표시된 상품명, 상품코드, 총 약정수량, 가격, 결제·출고 주기, 회차별 출고수량, 총 공급회차 및 중도해지 재산정 기준 등을 말합니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제3조(약관의 적용 및 계약조건의 우선순위)</p>
                        <p>1. 본 약관은 정기공급 서비스를 이용하는 모든 회원에게 적용됩니다.</p>
                        <p>2. 본 약관에서 정하지 않은 사항은 “제이시스몰” 이용약관, 개별 계약조건, 개인정보처리방침, 관계 법령 및 일반적인 상관례에 따릅니다.</p>
                        <p>3. 회사와 회원이 본 약관의 내용과 다르게 계약 체결 전에 개별적으로 합의한 사항이 있는 경우 해당 개별 합의가 우선합니다. 다만, 계약 체결 후 제12조 제1항에서 정한 계약조건은 별도의 합의가 있더라도 변경할 수 없습니다.</p>
                        <p>4. 본 약관과 상품페이지, 주문서 또는 계약확인서의 내용이 다른 경우 계약 체결 당시 확정된 주문서 또는 계약확인서의 내용이 우선합니다.</p>
                        <p>5. 본 약관의 내용이 명확하지 않은 경우에는 관계 법령과 신의성실의 원칙에 따라 해석합니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제4조(이용 대상)</p>
                        <p>1. 정기공급 서비스는 원칙적으로 “제이시스몰” 회원을 대상으로 합니다.</p>
                        <p>2. 회원이 허위 또는 부정확한 정보를 제출한 경우 회사는 계약 체결을 거절하거나 서비스 이용을 제한할 수 있습니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제5조(서비스의 성격)</p>
                        <p>1. 본 서비스는 총 약정수량을 확정하여 구매하는 하나의 계약으로서, 상품대금의 지급과 상품의 공급만 여러 회차로 나누어 진행하는 분할결제·분할공급 계약입니다.</p>
                        <p>2. 계약기간이 종료되거나 총 약정수량의 공급이 완료되더라도 계약은 자동으로 갱신되지 않습니다.</p>
                        <p>3. 계약 종료 후 정기공급 서비스를 계속 이용하려는 회원은 새로운 계약을 체결하여야 합니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제6조(계약 체결 전 고지사항)</p>
                        <p>1. 회사는 계약 체결 전에 회원이 다음 내용을 확인할 수 있도록 상품페이지, 주문서 또는 계약확인서에 표시합니다.</p>
                        <p className="pl-2">1) 상품명 및 상품코드<br/>2) 상품의 규격과 포장단위<br/>3) 총 약정수량<br/>4) 정기공급 적용단가<br/>5) 총 계약금액<br/>6) 회차별 결제금액<br/>7) 회차별 출고수량<br/>8) 총 공급회차<br/>9) 결제·출고 주기<br/>10) 전체 공급기간<br/>11) 최초 결제일 및 다음 결제 예정일<br/>12) 자동결제 조건<br/>13) 수량별 단가표 적용 여부<br/>14) 중도해지 시 적용되는 수량별 단가 또는 개당 기준단가<br/>15) 중도해지 정산방법<br/>16) 교환 기준<br/>17) 계약 체결 후 변경할 수 없는 계약조건<br/>18) 계약조건 변경이 필요한 경우 중도해지 후 신규 계약을 체결해야 한다는 사항<br/>19) 기타 계약의 중요한 내용</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제7조(정기공급 계약의 체결)</p>
                        <p>1. 회원은 “제이시스몰”에서 다음 사항을 선택하거나 확인한 후 계약을 신청합니다.</p>
                        <p className="pl-2">1) 대상 상품<br/>2) 총 약정수량<br/>3) 공급기간<br/>4) 결제·출고 주기<br/>5) 회차별 출고수량<br/>6) 총 공급회차<br/>7) 결제수단<br/>8) 배송지<br/>9) 본 약관 및 필수동의사항</p>
                        <p>2. 정기공급 계약은 회원이 계약을 신청하고 최초 결제가 정상적으로 완료된 후 회사가 이를 승인한 때 성립합니다.</p>
                        <p>3. 회사는 다음의 경우 계약 신청을 승인하지 않거나 승인을 취소할 수 있습니다.</p>
                        <p className="pl-2">1) 신청내용에 허위, 누락 또는 오류가 있는 경우<br/>2) 유효하지 않은 결제수단을 등록한 경우<br/>3) 상품 공급이 불가능하거나 현저히 곤란한 경우<br/>4) 기존 계약에 따른 미납금액이 있는 경우<br/>5) 회원이 관계 법령 또는 본 약관을 위반한 이력이 있는 경우<br/>6) 정기공급 가격조건을 부당하게 이용할 목적으로 계약을 신청한 것으로 합리적으로 판단되는 경우</p>
                        <p>4. 회사는 계약 체결 후 주문내역, 결제조건 및 공급계획을 회원에게 전자문서 등의 방법으로 제공합니다.</p>
                        <p>5. 회원이 선택하거나 확인한 총 약정수량, 결제·출고 주기, 회차별 출고수량, 총 공급회차, 결제일 및 공급기간은 계약 체결과 동시에 확정되며, 계약 체결 이후에는 변경할 수 없습니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제8조(상품 및 공급조건)</p>
                        <p>1. 정기공급 서비스의 대상 상품은 “제이시스몰”에 표시합니다.</p>
                        <p>2. 상품별 총 약정수량은 상품페이지 또는 주문서에서 정한 수량으로 합니다.</p>
                        <p>3. 회원은 회사가 제공하는 범위에서 다음 결제·출고 주기 중 하나를 선택할 수 있습니다.</p>
                        <p className="pl-2">1) 1개월<br/>2) 2개월<br/>3) 3개월<br/>4) 4개월<br/>5) 6개월</p>
                        <p>4. 전체 공급기간은 최초 결제일로부터 최대 12개월 이내로 합니다.</p>
                        <p>5. 회차별 출고수량은 계약 체결 당시 확정된 공급계획에 따릅니다.</p>
                        <p>6. 회차별 출고수량에 총 공급회차를 곱한 수량은 총 약정수량과 일치하여야 하며, 회차 구성상 별도의 미배정 수량은 발생하지 않습니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제9조(상품가격 및 준법기준)</p>
                        <p>1. 정기공급 적용단가와 상품별 가격조건은 관계 법령과 회사의 내부 준법기준에 따라 사전 승인된 범위에서 적용합니다.</p>
                        <p>2. 정기공급 적용단가는 총 약정수량, 주문·출고 조건, 물류 및 운영조건 등을 반영한 개별 계약상 거래가격입니다.</p>
                        <p>3. 회사는 동일한 상품과 동일한 거래조건에 대하여 합리적인 이유 없이 회원별로 다른 가격기준을 적용하지 않습니다.</p>
                        <p>4. 계약 체결 이후 상품가격 또는 가격정책이 변경되더라도 기존 계약에는 계약 체결 당시의 정기공급 적용단가와 중도해지 재산정 기준을 적용합니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제10조(결제수단 및 자동결제)</p>
                        <p>1. 정기공급 서비스의 결제수단은 자동결제를 위해 제이시스몰에 등록한 카드로 제한됩니다.</p>
                        <p>2. 회원은 계약기간 동안 정상적으로 결제 가능한 결제수단을 등록하고 유지하여야 합니다.</p>
                        <p>3. 회원은 계약 체결 시 다음 금액이 등록된 결제수단으로 자동결제되는 것에 동의합니다.</p>
                        <p className="pl-2">1) 각 회차의 상품대금<br/>2) 회원이 별도로 동의한 배송비 또는 기타 비용<br/>3) 제16조에 따라 사전 안내되고 회원이 자동결제에 별도로 동의한 중도해지 정산금액</p>
                        <p>4. 회사는 각 회차 자동결제 전에 결제 예정일과 예정금액을 문자메시지, 알림톡, 전자우편 또는 “제이시스몰” 내 알림으로 안내합니다.</p>
                        <p>5. 정기공급 계약이 유지 중이거나 미납 또는 미정산금액이 있는 경우 회원은 등록된 결제수단을 삭제할 수 없습니다.</p>
                        <p>6. 회원은 기존 결제수단을 다른 유효한 결제수단으로 변경할 수 있습니다.</p>
                        <p>7. 카드사, 금융기관 또는 결제대행사의 사유로 결제가 승인되지 않은 경우 회사는 책임을 부담하지 않습니다. 다만, 회사의 시스템 오류로 인한 경우는 제외합니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제11조(결제 및 상품 출고)</p>
                        <p>1. 회사는 각 회차의 자동결제가 정상적으로 완료된 후 해당 회차의 상품을 출고합니다.</p>
                        <p>2. 결제가 완료되지 않은 상품은 출고하지 않는 것을 원칙으로 합니다.</p>
                        <p>3. 상품의 출고 예정일은 주문내역 또는 회원에게 별도로 안내한 일정에 따릅니다.</p>
                        <p>4. 재고 부족, 생산 지연, 물류장애, 천재지변 또는 기타 불가피한 사유가 있는 경우 출고일정이 변경될 수 있습니다.</p>
                        <p>5. 회사는 출고일정이 변경되는 경우 지체 없이 변경사유와 예상 출고일을 회원에게 안내합니다.</p>
                        <p>6. 회사의 사유로 상품을 공급하기 어려운 경우 회사는 회원과 협의하여 다음 중 하나의 방법으로 처리합니다.</p>
                        <p className="pl-2">1) 불가피한 사유에 따른 출고일정 조정<br/>2) 해당 회차 결제 승인 취소<br/>3) 정기공급 계약 종료</p>
                        <p>7. 회사는 회원의 동의 없이 계약상품을 다른 상품으로 임의 변경하지 않습니다.</p>
                        <p>8. 본 조에 따른 출고일정 조정은 불가피한 공급사유에 따른 일시적인 일정 조정으로서 총 약정수량, 적용단가, 회차별 출고수량 및 총 결제금액을 변경하는 것은 아닙니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제12조(계약조건의 변경 제한)</p>
                        <p>1. 정기공급 계약 체결 후 총 약정수량, 결제·출고 주기, 회차별 출고수량, 총 공급회차, 결제일 및 공급기간은 변경할 수 없습니다.</p>
                        <p>2. 회원이 제1항의 계약조건과 다른 조건으로 정기공급 서비스를 이용하려는 경우에는 기존 계약을 중도해지하고, 제20조에서 정한 재가입 및 계약승인 기준에 따라 새로운 정기공급 계약을 신청하여야 합니다.</p>
                        <p>3. 기존 계약의 중도해지 및 정산은 제14조부터 제16조까지의 기준에 따릅니다.</p>
                        <p>4. 회사의 귀책사유 또는 재고 부족, 생산 지연, 물류장애 등 불가피한 사유로 출고일정의 조정이 필요한 경우에는 제11조에 따릅니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제13조(자동결제 실패)</p>
                        <p>1. 자동결제가 실패한 경우 회사는 회원에게 결제 실패 사실을 안내합니다.</p>
                        <p>2. 회사는 최초 결제 실패일을 기준으로 다음과 같이 총 2회의 재결제를 시도할 수 있습니다.</p>
                        <p className="pl-2">1) 최초 결제 실패일 다음 날: D+1<br/>2) 최초 결제 실패일로부터 3일째 되는 날: D+3</p>
                        <p>3. 자동결제가 최종적으로 실패한 경우 해당 회차의 상품 출고는 보류됩니다.</p>
                        <p>4. 회원은 유효한 결제수단을 등록하거나 회사가 안내한 방법으로 미납금액을 지급하여야 합니다.</p>
                        <p>5. 최종 결제 실패일로부터 7일 이내에 미납금액이 지급되지 않는 경우 회사는 상당한 기간을 정하여 회원에게 이행을 요청할 수 있습니다.</p>
                        <p>6. 회원이 회사가 정한 기간 내에도 미납금액을 지급하지 않는 경우 회사는 해당 회차의 출고를 계속 보류하거나 계약을 해지할 수 있습니다.</p>
                        <p>7. 결제 실패로 계약이 해지되는 경우 기출고 상품의 정산은 제15조에 따릅니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제14조(회원의 중도해지 신청)</p>
                        <p>1. 회원은 정기공급 계약기간 중 “제이시스몰” 또는 고객센터를 통해 중도해지를 신청할 수 있습니다.</p>
                        <p>2. 다음 회차의 결제와 출고를 중단하려는 회원은 원칙적으로 다음 결제 예정일 전일까지 중도해지를 신청하여야 합니다.</p>
                        <p>3. 중도해지 신청이 접수되면 회사는 다음 정보를 확인하여 예상 정산내역을 회원에게 안내합니다.</p>
                        <p className="pl-2">1) 총 약정수량<br/>2) 기출고수량<br/>3) 미출고수량<br/>4) 결제 완료금액<br/>5) 정기공급 적용단가<br/>6) 중도해지 재산정 단가<br/>7) 예상 추가 납부금액</p>
                        <p>4. 중도해지 신청 접수 시점 이후 예정된 회차의 결제와 출고는 중단합니다. 다만, 이미 결제가 완료된 회차는 중도해지 대상에서 제외하고 해당 회차 상품을 출고하며, 상품이 택배사 또는 운송인에게 인계된 때 기출고수량에 포함합니다.</p>
                        <p>5. 중도해지는 회사가 출고상태와 결제상태를 확인하고 최종 정산내역을 확정한 때 완료됩니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제15조(중도해지 시 금액 재산정)</p>
                        <p>1. 회원의 사유로 정기공급 계약이 중도해지되는 경우 기출고 상품의 대금은 계약 체결 당시 고지된 상품별 재산정 기준에 따라 계산합니다.</p>
                        <p>2. 중도해지 정산의 기준수량은 중도해지 확정 시점까지 출고 완료된 기출고수량으로 합니다.</p>
                        <p>3. 상품별 재산정 단가는 다음과 같이 적용합니다.</p>
                        <p className="pl-2">1) 수량별 단가표가 있는 상품: 기출고수량이 속하는 수량구간의 개당 단가를 적용합니다.<br/>2) 수량별 단가표가 없는 상품: 계약 체결 당시 상품페이지 또는 주문서에 표시된 개당 기준단가를 적용합니다.</p>
                        <p>4. 규격 또는 상품코드별 가격이 다른 경우에는 각 상품코드별로 재산정합니다.</p>
                        <p>5. 묶음 또는 포장단위로 판매되는 상품은 계약 체결 당시 고지된 상품 1개당 환산 기준단가를 적용할 수 있습니다.</p>
                        <p>6. 기출고분 재산정 금액은 기출고수량에 개당 적용 단가를 곱하여 산정합니다.</p>
                        <p>7. 여러 상품 또는 상품코드가 포함된 경우에는 각 상품별 재산정 금액을 합산합니다.</p>
                        <p>8. 최종 정산금액은 기출고분 재산정 금액에서 기결제금액을 차감하여 계산합니다.</p>
                        <p>9. 재산정 결과에 따라 추가 납부액이 발생할 수 있습니다.</p>
                        <p>10. 추가 납부금액은 회원이 기출고 상품에 대해 실제로 적용받은 정기공급 단가와 재산정 단가의 차액을 초과하지 않습니다.</p>
                        <p>11. 회사는 미출고수량 상품대금, 예상 이익, 위약금 등을 부과하지 않습니다.</p>
                        <p>12. 상품가격 정책 변경 시에도 계약 체결일 당시 고지된 단가를 적용합니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제16조(중도해지 정산금의 결제)</p>
                        <p>1. 회사는 중도해지 정산 전에 기출고수량, 재산정 금액, 최종 추가 납부금액 및 결제 예정일을 안내합니다.</p>
                        <p>2. 추가 납부금액은 등록 카드 또는 계좌이체로 지급할 수 있습니다.</p>
                        <p>3. 회사는 별도 동의 없이 정산금액을 임의 결제하지 않습니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제17조(기출고 상품의 교환)</p>
                        <p>1. 출고 완료된 상품은 단순변심 사유로 취소/교환이 불가하나 하자, 오배송, 배송 중 파손 등 회사의 귀책 사유 시 교환이 가능합니다.</p>
                        <p>2. 회사는 교환 대상 확인 후 동일한 상품으로 교환 조치하며 귀책사유 시 회수/재배송 비용을 부담합니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제18조(회사의 귀책사유에 따른 계약해지)</p>
                        <p>1. 회사의 반복적인 공급 지연 또는 중대한 하자 발생 시 회원은 계약을 해지할 수 있습니다.</p>
                        <p>2. 회사의 귀책사유 해지 시 단가 재산정 차액이나 중도해지 비용은 부과되지 않습니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제19조(회사의 공급보류 및 계약해지)</p>
                        <p>1. 자동결제 최종 실패, 배송정보 불명확 시 출고가 보류될 수 있으며 미납 지속 시 계약이 해지될 수 있습니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제20조(재가입)</p>
                        <p>1. 계약 종료 후 재가입이 가능하나 반복적인 부당 해지/미납 회원에 대해서는 최대 6개월간 재가입이 제한될 수 있습니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제21조(회원의 의무)</p>
                        <p>1. 회원은 정확한 사업자/결제/배송 정보를 유지하고 적법한 의료 및 사업 목적으로 상품을 사용하여야 합니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제22조(금지행위)</p>
                        <p>1. 명의 도용, 부당한 계약 반복 체결/해지, 무단 재판매 및 유통 행위를 금지합니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제23조(회원정보 변경)</p>
                        <p>1. 변경 사항 발생 시 즉시 정보를 수정하여야 하며 미통지로 인한 불이익은 회원이 부담합니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제24조(약관의 변경 및 기존 계약의 적용)</p>
                        <p>1. 약관 변경 시 게시판 고지 및 개별 통지하며, 기존 체결 계약 조건은 소급하여 불리하게 변경되지 않습니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제25조(회사의 책임)</p>
                        <p>1. 회사는 회사 귀책 사유로 발생한 직접 손해를 배상하며 불가항력적 사유에 대해서는 책임이 제한됩니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제26조(통지)</p>
                        <p>1. 개별 통지는 문자, 알림톡, 이메일, 쇼핑몰 내 알림을 이용합니다.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-700">제27조(분쟁해결)</p>
                        <p>1. 본 약관은 대한민국 법률에 따라 해석되며 분쟁 발생 시 관할 법원에 따릅니다.</p>
                      </div>

                    </div>
                  </div>
                )}
                {/* 동의 체크박스 */}
                <label className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none">
                  <div
                    onClick={() => setSubContractTermsAgreed(v => !v)}
                    className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={subContractTermsAgreed
                      ? { borderColor: '#21358D', backgroundColor: '#21358D' }
                      : { borderColor: '#9ca3af', backgroundColor: '#ffffff' }
                    }
                  >
                    {subContractTermsAgreed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span
                    onClick={() => setSubContractTermsAgreed(v => !v)}
                    className="text-sm font-medium text-neutral-800"
                  >
                    정기 공급 서비스 이용 약관에 <span className="text-[#21358D] font-bold">동의합니다</span>
                  </span>
                </label>
              </div>

              {/* 2. 정기공급 계약 필수 확인 및 별도 동의사항 (아코디언 형태) */}
              <div className="border border-neutral-200 rounded-sm">
                {/* 약관 헤더 */}
                <button
                  type="button"
                  onClick={() => setIsTermsExpanded(v => !v)}
                  className="w-full px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-left cursor-pointer hover:bg-neutral-100 transition-colors"
                >
                  <span className="text-xs font-bold text-neutral-700">정기공급 계약 필수 확인 및 별도 동의사항</span>
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <span>{isTermsExpanded ? '접기' : '자세히 보기'}</span>
                    {isTermsExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-600" />
                    )}
                  </div>
                </button>

                {/* 약관 내용 영역 */}
                {isTermsExpanded && (
                  <div className="px-4 py-3 bg-white border-b border-neutral-200">
                    <div
                      style={{ height: '250px', maxHeight: '250px', overflowY: 'scroll' }}
                      className="text-[11px] text-neutral-600 leading-relaxed space-y-2 pr-2 always-visible-scrollbar"
                    >
                      <p>□ 본 상품은 총 약정수량을 확정하고 결제와 상품 공급을 여러 회차로 나누어 진행하는 정기공급·분할결제 계약입니다.</p>
                      <p>□ 계약 종료 후 자동으로 갱신되지 않으며, 계속 이용하려면 새로운 계약을 체결해야 합니다.</p>
                      <p>□ 각 회차 결제 예정일에 등록된 결제수단으로 회차별 상품대금이 자동결제됩니다.</p>
                      <p>□ 자동결제가 실패하면 D+1 및 D+3에 재결제가 진행되며, 최종 결제 실패 시 해당 회차의 출고가 보류될 수 있습니다.</p>
                      <p>□ 출고 완료된 상품은 단순변심, 주문착오 또는 사용계획 변경 등의 사유로 계약을 취소하거나 교환할 수 없습니다.</p>
                      <p>□ 상품에 하자, 오배송 또는 배송 중 파손이 있는 경우 회사의 확인 후 동일한 상품으로 교환을 기본으로 합니다.</p>
                      <p>□ 총 약정수량, 결제·출고 주기, 회차별 출고수량, 총 공급회차, 결제일 및 공급기간은 계약 체결 후 변경할 수 없습니다.</p>
                      <p>□ 다른 조건으로 정기공급 서비스를 이용하려는 경우 기존 계약을 중도해지하고 새로운 계약을 신청해야 하며, 기존 계약의 기출고 상품은 중도해지 재산정 기준에 따라 정산됩니다.</p>
                      <p>□ 회원의 사유로 중도해지하는 경우 기출고 상품의 대금은 기출고수량에 따라 다시 계산됩니다.</p>
                      <p>□ 수량별 단가표가 있는 상품은 기출고수량에 해당하는 구간단가를 적용합니다.</p>
                      <p>□ 수량별 단가표가 없는 상품은 계약 체결 당시 고지된 개당 기준단가를 적용합니다.</p>
                      <p>□ 중도해지 시 정기공급 적용단가와 재산정 단가 간의 차액이 추가로 청구될 수 있습니다.</p>
                      <p>□ 중도해지 후 미출고 수량에 대한 결제와 출고는 중단되며, 해당 미출고 수량의 상품대금은 청구하지 않습니다.</p>
                      <p>□ 회사의 귀책사유로 계약이 해지되는 경우 단가 재산정 차액 또는 중도해지 비용은 부과되지 않습니다.</p>
                      <p>□ 중도해지 정산금액은 결제 전에 세부내역과 결제 예정금액을 안내받습니다.</p>
                      <p>□ 중도해지 정산금액이 발생하는 경우, 확정된 추가 납부금액을 등록된 결제수단으로 자동 결제하는 것에 동의합니다.</p>
                    </div>
                  </div>
                )}
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
                    정기공급 계약 필수 확인 및 별도 동의사항에 <span className="text-[#21358D] font-bold">동의합니다</span>
                  </span>
                </label>
              </div>

              {/* 바로구매 버튼 */}
              {(() => {
                const canBuy = !!selectedSubOption && !!selectedCycleMonths && !!selectedCombo && subTermsAgreed && subContractTermsAgreed;
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
                      toast.error('결제 및 출고 주기 & 회차 조합을 선택해주세요.');
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
                        productId: product.id,
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
              <p className="text-xs text-center text-neutral-400">정기공급 상품은 바로 구매만 가능합니다.</p>
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