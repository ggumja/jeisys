import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ShoppingCart, Check, Minus, Plus, Package, Loader2, CreditCard } from 'lucide-react';
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
  const [activeImage, setActiveImage] = useState<string>('');
  
  // Promotion States
  const [promotionPool, setPromotionPool] = useState<Product[]>([]);
  const [selectedPromotionPaid, setSelectedPromotionPaid] = useState<string[]>([]);
  const [selectedPromotionFree, setSelectedPromotionFree] = useState<string[]>([]);

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
              initQtys[item.productId] = 0;
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
  // 상품 레벨(global) 증정품만 필터링 (옵션 전용 증정은 더 이상 관리자에서 등록하지 않음)
  const currentBonusItems = product?.bonusItems?.filter(item => !item.optionId) || [];

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

    // 2. If an option is selected, use that option's price (if any) or apply discount to base price
    if (currentOption) {
      const baseOptionPrice = (currentOption.price && currentOption.price > 0) 
        ? currentOption.price 
        : (product.price * (currentOption.quantity || 1));
      
      // Apply option-specific discount rate
      return baseOptionPrice * (1 - (currentOption.discountRate || 0) / 100);
    }
    
    // 2. Otherwise, check for tier pricing based on quantity
    const tier = [...product.tierPricing]
      .reverse()
      .find((t) => quantity >= t.quantity);
    
    if (tier) {
      return tier.unitPrice;
    }
    
    return product.price;
  })();


  const handleAddToCart = async () => {
    if (!product) return;

    // Validation for package products
    if (product.isPackage) {
      const targetCount = currentOption ? currentOption.quantity : product.selectableCount;

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
        if (totalSelected !== targetCount) {
          setAlertDialog({
            isOpen: true,
            title: '선택 수량 확인',
            description: `총 ${targetCount}개의 상품을 선택해야 합니다. (현재: ${totalSelected}개)`
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

    if (product.isPackage) {
      if (product.itemInputType === 'input') {
        const totalInputQty = Object.values(inputQuantities).reduce((a, b) => a + b, 0);
        if (totalInputQty !== (product.selectableCount || 0)) {
          toast.error(`총 ${product.selectableCount}개의 상품을 선택해야 합니다.`);
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

      await cartService.addToCart(
        product.id, 
        quantity, 
        isSubscription, 
        finalSelections,
        selectedOptionId || undefined,
        currentOption ? currentOption.name : undefined
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

          {/* Regular Option/Quantity Selectors - Hidden for Promotions */}
          {!product.isPromotion && (
            <>
              {product.options && product.options.length > 0 ? (
                <div className="mb-8">
                  <label className="block text-xs tracking-wide text-neutral-700 mb-4 uppercase font-medium">
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
                  <label className="block text-xs tracking-wide text-neutral-700 mb-4 uppercase font-medium">
                    수량
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


          {/* Total Amount Summary Section */}
          <div className="py-8 border-t border-neutral-200 mt-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-neutral-900 uppercase tracking-widest">총 합계</span>
              <div className="text-right">
                <div className="text-4xl font-black tracking-tighter text-red-600">
                  ₩{(() => {
                    if (!selectedOptionId && product.options && product.options.length > 0) return "0";
                    
                    let total = 0;
                    if (currentOption) {
                      const base = (currentOption.price && currentOption.price > 0) ? currentOption.price : (product.price * (currentOption.quantity || 1));
                      total = Math.round(base * (1 - (currentOption.discountRate || 0) / 100));
                    } else {
                      total = currentUnitPrice * quantity;
                    }
                    
                    // Apply subscription discount if active
                    const finalAmount = isSubscription ? Math.round(total * (1 - (product.subscriptionDiscount || 0) / 100)) : total;
                    return finalAmount.toLocaleString();
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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