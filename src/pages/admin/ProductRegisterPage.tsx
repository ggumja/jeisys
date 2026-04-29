import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, ImageIcon, X, Plus, Trash2, Search, Loader2, ShieldAlert, Package, Save } from 'lucide-react';
import { RichTextEditor } from '../../components/RichTextEditor';
import { useProduct, useProducts, useCreateProduct, useUpdateProduct, useAddPricingTiers } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { productService, ProductInput } from '../../services/productService';
import { equipmentService, EquipmentModel } from '../../services/equipmentService';
import { Product } from '../../types';

const formatWithCommas = (value: string | number) => {
  if (value === undefined || value === null || value === '') return '';
  const stringValue = value.toString().replace(/,/g, '');
  if (isNaN(Number(stringValue))) return stringValue;
  return Number(stringValue).toLocaleString('ko-KR');
};

const unformatNumber = (value: string) => {
  return value.replace(/,/g, '');
};

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { ADMIN_STYLES } from '../../constants/adminStyles';

interface BulkDiscount {
  id: string;
  quantity: string;
  discountRate: string;
}

interface BonusProductData {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: string;
  quantity: string;
  imageUrl: string;
  calculationMethod: 'fixed' | 'ratio';
  percentage: string;
}

interface FormData {
  name: string;
  category: string;
  productCode: string;
  sapSku: string;
  manufacturer: string;
  price: string;
  stock: string;
  status: 'active' | 'inactive';
  isVisible: boolean;
  itemInputType: 'select' | 'input';
  selectableCount: string;
  creditAvailable: boolean;
  pointsAvailable: boolean;
  description: string;
  useSubscriptionDiscount: boolean;
  subscriptionDiscount: string;
  minOrderQuantity: string;
  maxOrderQuantity: string;
  quantityInputType: 'button' | 'list';
  bulkDiscounts: BulkDiscount[];
  bonusProducts: BonusProductData[];
}



export function ProductRegisterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  // React Query hooks
  const { data: existingProduct, isLoading: isLoadingProduct } = useProduct(id || '');
  const { data: categories = [] } = useCategories();
  const { data: allProducts = [], isLoading: isLoadingProducts } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const addPricingTiers = useAddPricingTiers();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    productCode: '',
    sapSku: '',
    manufacturer: '',
    price: '',
    stock: '',
    status: 'active',
    isVisible: true,
    itemInputType: 'input',
    selectableCount: '1',
    creditAvailable: true,
    pointsAvailable: true,
    description: '',
    useSubscriptionDiscount: false,
    subscriptionDiscount: '',
    minOrderQuantity: '1',
    maxOrderQuantity: '0',
    salesUnit: '1',
    quantityInputType: 'button',
    baseProductId: '',
    stockMultiplier: '1',
    isShareStock: false,
    bulkDiscounts: [],
    bonusProducts: [],

  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 장비 호환성
  const [equipmentModels, setEquipmentModels] = useState<EquipmentModel[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);

  // Search state for Master Product Linkage
  const [masterSearchTerm, setMasterSearchTerm] = useState('');
  const [isMasterSearchOpen, setIsMasterSearchOpen] = useState(false);

  // Existing search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Result Modal state
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'success' | 'error';
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'success'
  });

  // 장비 모델 목록 로드
  useEffect(() => {
    equipmentService.getEquipmentModels().then(setEquipmentModels).catch(console.error);
  }, []);

  // 수정 모드: 기존 장비 호환성 로드
  useEffect(() => {
    if (isEditMode && id) {
      productService.getProductCompatibilityIds(id)
        .then(setSelectedEquipmentIds)
        .catch(console.error);
    }
  }, [isEditMode, id]);

  // Load existing product data in edit mode
  useEffect(() => {
    if (isEditMode && existingProduct) {
      setFormData({
        name: existingProduct.name || '',
        category: existingProduct.category || '',
        productCode: existingProduct.sku || '',
        sapSku: existingProduct.sapSku || '',
        manufacturer: existingProduct.manufacturer || '', 
        price: formatWithCommas(existingProduct.price || 0),
        stock: formatWithCommas(existingProduct.stock || 0),
        status: existingProduct.isActive !== false ? 'active' : 'inactive',
        isVisible: existingProduct.isVisible !== false,
        itemInputType: existingProduct.itemInputType || 'input',
        selectableCount: formatWithCommas(existingProduct.selectableCount || 1),
        salesUnit: formatWithCommas(existingProduct.salesUnit || 1),
        baseProductId: existingProduct.baseProductId || '',
        stockMultiplier: formatWithCommas(existingProduct.stockMultiplier || 1),
        isShareStock: !!existingProduct.baseProductId,
        creditAvailable: existingProduct.creditAvailable ?? true,
        pointsAvailable: existingProduct.pointsAvailable ?? true,
        description: existingProduct.description || '',
        useSubscriptionDiscount: (existingProduct.subscriptionDiscount ?? 0) > 0,
        subscriptionDiscount: formatWithCommas(existingProduct.subscriptionDiscount || 0),
        minOrderQuantity: formatWithCommas(existingProduct.minOrderQuantity || 1),
        maxOrderQuantity: formatWithCommas(existingProduct.maxOrderQuantity || 0),
        quantityInputType: existingProduct.quantityInputType || 'button',
        bulkDiscounts: existingProduct.tierPricing?.map((tier, index) => ({
          id: index.toString(),
          quantity: formatWithCommas(tier.quantity || 0),
          discountRate: ((1 - tier.unitPrice / existingProduct.price) * 100).toFixed(0),
        })) || [],
        bonusProducts: existingProduct.bonusItems?.filter(item => !item.optionId).map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.product?.name || '',
          sku: item.product?.sku || '',
          price: formatWithCommas(item.priceOverride ?? item.product?.price ?? 0),
          quantity: formatWithCommas(item.quantity || 0),
          imageUrl: item.product?.imageUrl || '',
          calculationMethod: item.calculationMethod || 'fixed',
          percentage: formatWithCommas(item.percentage || 0),
        })) || [],

      });
      if (existingProduct.imageUrl) {
        setThumbnailPreview(existingProduct.imageUrl);
      }
      if (existingProduct.additionalImages) {
        setAdditionalImages(existingProduct.additionalImages);
      }
    }
  }, [isEditMode, existingProduct]);

  // Bonus Products Handlers
  const filteredSearchProducts = (allProducts || []).filter(p => {
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return false;
    
    return (
      p.id !== id && 
      (
        (p.name || '').toLowerCase().includes(searchLower) || 
        (p.sku || '').toLowerCase().includes(searchLower) ||
        (p.category || '').toLowerCase().includes(searchLower)
      ) &&
      !formData.bonusProducts.some(bp => bp.productId === p.id) &&
      !p.isPackage &&
      !p.isPromotion &&
      (!p.options || p.options.length === 0)
    );
  }).slice(0, 20);

  const addBonusProduct = (product: Product) => {
    const newBonus: BonusProductData = {
      id: Date.now().toString(),
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: '0',
      quantity: '1',
      imageUrl: product.imageUrl,
      calculationMethod: 'fixed',
      percentage: '0',
    };
    setFormData(prev => ({
      ...prev,
      bonusProducts: [...prev.bonusProducts, newBonus],
    }));
    setSearchTerm('');
    setIsSearchDropdownOpen(false);
  };

  const removeBonusProduct = (id: string) => {
    setFormData(prev => ({
      ...prev,
      bonusProducts: prev.bonusProducts.filter(p => p.id !== id),
    }));
  };

  const updateBonusProduct = (id: string, field: keyof BonusProductData, value: string) => {
    // Format if it's a numeric field
    const numericFields: string[] = ['quantity', 'price', 'percentage'];
    let processedValue = value;
    
    if (numericFields.includes(field)) {
      processedValue = formatWithCommas(value.replace(/[^0-9]/g, ''));
    }

    setFormData(prev => ({
      ...prev,
      bonusProducts: prev.bonusProducts.map(p => 
        p.id === id ? { ...p, [field]: processedValue } : p
      ),
    }));
  };




  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // List of numeric fields to format with commas
    const numericFields = ['price', 'stock', 'selectableCount', 'subscriptionDiscount', 'minOrderQuantity', 'maxOrderQuantity', 'salesUnit', 'stockMultiplier'];
    
    if (numericFields.includes(name)) {
      // Allow only numbers and format with commas
      const numericValue = value.replace(/[^0-9]/g, '');
      const formattedValue = formatWithCommas(numericValue);
      
      setFormData((prev) => {
        const next = { ...prev, [name]: formattedValue };
        // Sync minOrderQuantity with salesUnit when salesUnit changes
        if (name === 'salesUnit') {
          next.minOrderQuantity = formattedValue;
        }
        return next;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files);
      
      // Limit to 5 images
      if (additionalImages.length + fileList.length > 5) {
        setResultModal({
          isOpen: true,
          title: '이미지 초과',
          description: '추가 이미지는 최대 5개까지만 등록 가능합니다.',
          type: 'error'
        });
        return;
      }

      setAdditionalFiles((prev) => [...prev, ...fileList]);

      fileList.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAdditionalImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
    setAdditionalFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addBulkDiscount = () => {
    const newDiscount: BulkDiscount = {
      id: Date.now().toString(),
      quantity: '',
      discountRate: '',
    };
    setFormData((prev) => ({
      ...prev,
      bulkDiscounts: [...prev.bulkDiscounts, newDiscount],
    }));
  };

  const removeBulkDiscount = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      bulkDiscounts: prev.bulkDiscounts.filter((d) => d.id !== id),
    }));
  };

  const updateBulkDiscount = (id: string, field: 'quantity' | 'discountRate', value: string) => {
    setFormData((prev) => ({
      ...prev,
      bulkDiscounts: prev.bulkDiscounts.map((d) =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    }));
  };

  // Helper function to render categories in a hierarchical select
  const renderCategoryOptions = (parentId: string | null = null, level: number = 0): JSX.Element[] => {
    return categories
      .filter(cat => cat.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .flatMap(cat => [
        <option key={cat.id} value={cat.name}>
          {'\u00A0'.repeat(level * 4)}{level > 0 ? '└ ' : ''}{cat.name}
        </option>,
        ...renderCategoryOptions(cat.id, level + 1)
      ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price) {
      setResultModal({
        isOpen: true,
        title: '필수 항목 누락',
        description: '상품명, 카테고리, 가격은 필수 입력 항목입니다.',
        type: 'error'
      });
      return;
    }

    const minQty = parseInt(unformatNumber(formData.salesUnit)) || 1;
    const maxQty = parseInt(unformatNumber(formData.maxOrderQuantity)) || 0;

    if (maxQty > 0 && maxQty < minQty) {
      setResultModal({
        isOpen: true,
        title: '수량 설정 오류',
        description: '최대 주문 수량은 최소 주문 수량보다 크거나 같아야 합니다.',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload thumbnail image if changed
      let finalImageUrl: string | null = thumbnailPreview || null;
      if (thumbnailFile) {
        finalImageUrl = await productService.uploadProductImage(thumbnailFile);
      }

      // Determine final category and subcategory based on hierarchy
      const selectedCat = categories.find(c => c.name === formData.category);
      let finalCategory = formData.category;
      let finalSubcategory = undefined;

      if (selectedCat && selectedCat.parentId) {
        const parentCat = categories.find(c => c.id === selectedCat.parentId);
        if (parentCat) {
          finalCategory = parentCat.name;
          finalSubcategory = selectedCat.name;
        }
      }

      const productData: ProductInput = {
        sku: formData.productCode || `PROD-${Date.now()}`,
        sap_sku: formData.sapSku,
        manufacturer: formData.manufacturer,
        name: formData.name,
        category: finalCategory,
        subcategory: finalSubcategory,
        price: parseFloat(unformatNumber(formData.price)),
        stock: parseInt(unformatNumber(formData.stock)) || 0,
        description: formData.description,
        image_url: finalImageUrl,
        is_active: formData.status === 'active',
        is_visible: formData.isVisible,
        item_input_type: formData.itemInputType,
        selectable_count: parseInt(unformatNumber(formData.selectableCount)) || 1,
        credit_available: formData.creditAvailable,
        points_available: formData.pointsAvailable,
        subscription_discount: formData.useSubscriptionDiscount ? parseFloat(unformatNumber(formData.subscriptionDiscount)) || 0 : 0,
        min_order_quantity: minQty,
        max_order_quantity: maxQty > 0 ? maxQty : undefined,
        quantity_input_type: formData.quantityInputType,
        sales_unit: parseInt(unformatNumber(formData.salesUnit)) || 1,
        base_product_id: formData.isShareStock ? formData.baseProductId : null,
        stock_multiplier: formData.isShareStock ? parseInt(unformatNumber(formData.stockMultiplier)) : 1,
      };

      let productId: string;

      if (isEditMode && id) {
        // Update existing product
        await updateProduct.mutateAsync({ id, data: productData });
        productId = id;
      } else {
        // Create new product
        const newProduct = await createProduct.mutateAsync(productData);
        productId = newProduct.id;
      }

      // 2. Upload and save additional images
      const existingUrls = additionalImages.filter(img => img.startsWith('http'));
      const newUploadedUrls = await Promise.all(
        additionalFiles.map(file => productService.uploadProductImage(file))
      );
      const allUrls = [...existingUrls, ...newUploadedUrls];

      if (isEditMode) {
        await productService.deleteProductImages(productId);
      }
      if (allUrls.length > 0) {
        await productService.addProductImages(productId, allUrls);
      }

      // 3. Update Pricing Tiers
      const tiers = formData.bulkDiscounts
        .filter(d => d.quantity && d.discountRate)
        .map(d => {
          const basePrice = parseFloat(unformatNumber(formData.price));
          const discountRate = parseFloat(unformatNumber(d.discountRate)) / 100;
          const discountedPrice = basePrice * (1 - discountRate);

          return {
            min_quantity: parseInt(unformatNumber(d.quantity)),
            unit_price: discountedPrice,
          };
        });

      await addPricingTiers.mutateAsync({ productId, tiers });


      // 5. Update Bonus Items (Main + Options)
      const allBonusItems: { bonusProductId: string; quantity: number; priceOverride: number; optionId: string | null; calculationMethod: string; percentage: number }[] = [];
      
      formData.bonusProducts.forEach(bp => {
        allBonusItems.push({
          bonusProductId: bp.productId,
          quantity: parseInt(unformatNumber(bp.quantity)) || 1,
          priceOverride: Number(unformatNumber(bp.price)) || 0,
          optionId: null,
          calculationMethod: bp.calculationMethod,
          percentage: parseFloat(unformatNumber(bp.percentage)) || 0
        });
      });

      
      await productService.addBonusItems(productId, allBonusItems);

      // 6. 장비 호환성 저장
      await productService.saveProductCompatibility(productId, selectedEquipmentIds);

      setResultModal({
        isOpen: true,
        title: isEditMode ? '수정 완료' : '등록 완료',
        description: `상품이 성공적으로 ${isEditMode ? '수정' : '등록'}되었습니다.`,
        type: 'success'
      });

      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error: any) {
      console.error('Error saving product:', error);
      let errorMessage = error.message || '상품 저장 중 오류가 발생했습니다. 데이터 연결 상태를 확인해주세요.';
      
      if (error.code === '23505') {
        errorMessage = '이미 존재하는 상품 코드(SKU)입니다. 다른 코드를 입력해주세요.';
      }

      setResultModal({
        isOpen: true,
        title: '저장 실패',
        description: errorMessage,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && isLoadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className={ADMIN_STYLES.PAGE_CONTAINER}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/products')}
          className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
            {isEditMode ? '일반 상품 수정' : '일반 상품 등록'}
          </h2>
          <p className="text-sm text-neutral-600">
            {isEditMode ? '상품 정보를 수정합니다' : '새로운 상품을 등록합니다'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Combined Product Images Section - Compact Single Line */}
        <div className={ADMIN_STYLES.CARD}>
          <div className={ADMIN_STYLES.SECTION_TITLE}>
            <h3 className="text-lg font-bold">상품 이미지 설정</h3>
            <span className="text-xs text-neutral-500 font-medium font-normal tracking-normal border-none p-0 inline-block">대표 이미지 1장 + 추가 이미지 최대 5장</span>
          </div>
          
          <div className="flex flex-row flex-wrap gap-4 items-start">
            {/* Primary Image Slot */}
            <div 
              className={ADMIN_STYLES.IMAGE_UPLOAD_BOX}
              onClick={() => document.getElementById('thumbnail-upload')?.click()}
            >
              {thumbnailPreview ? (
                <>
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 left-0 px-2 py-0.5 bg-neutral-900 text-white text-[9px] font-black uppercase tracking-widest shadow-md">Main</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setThumbnailPreview(null);
                      setThumbnailFile(null);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-all z-10 shadow-md ring-2 ring-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="text-center group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto mb-1 group-hover:text-neutral-900" />
                  <p className="text-[10px] text-neutral-400 font-bold group-hover:text-neutral-900 leading-tight">대표 이미지<br />업로드</p>
                </div>
              )}
              <input
                id="thumbnail-upload"
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
            </div>

            {/* Additional Images Grid - Directly Following */}
            {additionalImages.map((image, index) => (
              <div
                key={index}
                className="w-40 h-40 border border-neutral-200 relative overflow-hidden group bg-neutral-50 shadow-sm"
              >
                <img
                  src={image}
                  alt={`Additional ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                <button
                  type="button"
                  onClick={() => removeAdditionalImage(index)}
                  className="absolute top-1 right-1 w-5 h-5 bg-neutral-900/80 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all z-10 backdrop-blur-sm shadow-md ring-2 ring-white"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute top-0 left-0 bg-neutral-400/80 text-white text-[9px] px-1.5 py-0.5 font-bold tracking-tighter shadow-sm">Slide {index + 1}</div>
              </div>
            ))}
            
            {/* Add Button Slot */}
            {additionalImages.length < 5 && (
              <label className="w-40 h-40 border-2 border-dashed border-neutral-200 flex items-center justify-center bg-neutral-50/30 cursor-pointer hover:bg-white hover:border-neutral-900 transition-all group shadow-inner">
                <div className="text-center group-hover:scale-105 transition-transform">
                  <Plus className="w-6 h-6 text-neutral-300 mx-auto mb-1 group-hover:text-neutral-900" />
                  <p className="text-[10px] text-neutral-400 font-bold group-hover:text-neutral-900 leading-tight">추가 이미지<br />업로드</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAdditionalImagesChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          
          <div className="mt-4 flex items-center gap-6 text-[10px] text-neutral-400 italic bg-neutral-50 p-2 border border-neutral-100">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-neutral-300 rounded-full" /> 800x800px 권장, 최대 5MB</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-neutral-300 rounded-full" /> 상세페이지 갤러리에 순서대로 노출됩니다 (최대 5장)</span>
          </div>
        </div>

        {/* Basic Info */}
        <div className={ADMIN_STYLES.CARD}>
          <h3 className={ADMIN_STYLES.SECTION_TITLE}>기본 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>
                상품명 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="상품명을 입력하세요"
                className={ADMIN_STYLES.INPUT}
                required
              />
            </div>

            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>
                카테고리 <span className="text-red-600">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={ADMIN_STYLES.SELECT}
                required
              >
                <option value="">카테고리 선택</option>
                {renderCategoryOptions()}
              </select>
            </div>

            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>
                상품코드 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="productCode"
                value={formData.productCode}
                onChange={handleInputChange}
                placeholder="상품코드를 입력하세요"
                className={ADMIN_STYLES.INPUT}
                required
              />
            </div>

            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>
                SAP SKU (ERP 매핑용)
              </label>
              <input
                type="text"
                name="sapSku"
                value={formData.sapSku}
                onChange={handleInputChange}
                placeholder="SAP 품번을 입력하세요"
                className={ADMIN_STYLES.INPUT}
              />
            </div>

            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>
                제조사
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                placeholder="제조사를 입력하세요"
                className={ADMIN_STYLES.INPUT}
              />
            </div>

            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>
                판매가 <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="판매가를 입력하세요"
                  className={ADMIN_STYLES.INPUT + " text-right pr-16 font-bold"}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 font-bold uppercase">원</span>
              </div>
            </div>


            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>
                재고 수량
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="재고 수량을 입력하세요"
                  className={`${ADMIN_STYLES.INPUT} text-right pr-16 font-bold`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 font-bold uppercase">개</span>
              </div>
            </div>

            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>
                판매 상태
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === 'active'}
                    onChange={handleInputChange}
                    className="w-4 h-4 accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-900">판매중</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={formData.status === 'inactive'}
                    onChange={handleInputChange}
                    className="w-4 h-4 accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-900">판매중지</span>
                </label>
              </div>
            </div>

            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>
                노출 여부 (고객 화면)
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isVisible"
                    value="true"
                    checked={formData.isVisible === true}
                    onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.value === 'true' }))}
                    className="w-4 h-4 accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-900">노출</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isVisible"
                    value="false"
                    checked={formData.isVisible === false}
                    onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.value === 'true' }))}
                    className="w-4 h-4 accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-900">미노출</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 호환 장비 설정 */}
        <div className={ADMIN_STYLES.CARD}>
          <div className={ADMIN_STYLES.SECTION_TITLE}>
            <h3 className="text-lg font-bold">호환 장비 설정</h3>
            <span className="text-xs text-neutral-500 font-normal">크레딧 장비별 적용 대상을 지정합니다</span>
          </div>

          {equipmentModels.length === 0 ? (
            <p className="text-sm text-neutral-400">등록된 장비 모델이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {equipmentModels.map(eq => {
                const checked = selectedEquipmentIds.includes(eq.id);
                return (
                  <label
                    key={eq.id}
                    className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${
                      checked
                        ? 'border-neutral-900 bg-neutral-50'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => {
                        setSelectedEquipmentIds(prev =>
                          e.target.checked
                            ? [...prev, eq.id]
                            : prev.filter(i => i !== eq.id)
                        );
                      }}
                      className="w-4 h-4 accent-neutral-900 cursor-pointer flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-neutral-900 truncate">{eq.model_name}</div>
                      <div className="text-[11px] text-neutral-400 truncate">{eq.code}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          <p className="text-xs text-neutral-400 mt-3">선택한 장비의 크레딧을 해당 상품 구매 시 사용할 수 있습니다.</p>
        </div>

        {/* Order Options */}
        <div className={ADMIN_STYLES.CARD}>
            <h3 className={ADMIN_STYLES.SECTION_TITLE}>주문 옵션</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className={ADMIN_STYLES.SECTION_LABEL}>
                  판매 단위 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="salesUnit"
                  value={formData.salesUnit}
                  onChange={handleInputChange}
                  placeholder="예: 10 (10개 묶음)"
                  className={ADMIN_STYLES.INPUT}
                  required
                />
              </div>

              <div className="space-y-4">
                <label className={ADMIN_STYLES.SECTION_LABEL}>수량 입력방법</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="quantityInputType"
                      value="list"
                      checked={formData.quantityInputType === 'list'}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantityInputType: 'list' }))}
                      className="w-4 h-4 accent-neutral-900 cursor-pointer"
                    />
                    <span className="text-sm text-neutral-900">리스트형</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="quantityInputType"
                      value="button"
                      checked={formData.quantityInputType === 'button'}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantityInputType: 'button' }))}
                      className="w-4 h-4 accent-neutral-900 cursor-pointer"
                    />
                    <span className="text-sm text-neutral-900">버튼형</span>
                  </label>
                </div>
                <p className={ADMIN_STYLES.HELPER_TEXT}>수량입력 방법을 선택합니다.</p>
              </div>
            </div>
        </div>

        {/* Discount Settings */}
        <div className={ADMIN_STYLES.CARD}>
          <h3 className={ADMIN_STYLES.SECTION_TITLE}>할인 및 크레딧/적립금 설정</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-neutral-100 pb-8">
            <div className="space-y-4">
              <label className={ADMIN_STYLES.SECTION_LABEL}>크레딧 사용 가능여부</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="creditAvailable"
                    value="true"
                    checked={formData.creditAvailable === true}
                    onChange={(e) => setFormData(prev => ({ ...prev, creditAvailable: e.target.value === 'true' }))}
                    className="w-4 h-4 accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-900">가능</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="creditAvailable"
                    value="false"
                    checked={formData.creditAvailable === false}
                    onChange={(e) => setFormData(prev => ({ ...prev, creditAvailable: e.target.value === 'true' }))}
                    className="w-4 h-4 accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-900">불가능</span>
                </label>
              </div>
              <p className={ADMIN_STYLES.HELPER_TEXT}>해당 상품 구매 시 크레딧 사용 가능 여부를 설정합니다</p>
            </div>

            <div className="space-y-4">
              <label className={ADMIN_STYLES.SECTION_LABEL}>적립금 사용 가능여부</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pointsAvailable"
                    value="true"
                    checked={formData.pointsAvailable === true}
                    onChange={(e) => setFormData(prev => ({ ...prev, pointsAvailable: e.target.value === 'true' }))}
                    className="w-4 h-4 accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-900">가능</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pointsAvailable"
                    value="false"
                    checked={formData.pointsAvailable === false}
                    onChange={(e) => setFormData(prev => ({ ...prev, pointsAvailable: e.target.value === 'true' }))}
                    className="w-4 h-4 accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-900">불가능</span>
                </label>
              </div>
              <p className={ADMIN_STYLES.HELPER_TEXT}>해당 상품 구매 시 적립금 사용 가능 여부를 설정합니다</p>
            </div>
          </div>

          {/* Subscription Discount */}
          <div className="mb-8 p-4 bg-neutral-50/50 border border-neutral-100">
            <div className="flex flex-col gap-4">
              <div>
                <label className={ADMIN_STYLES.SECTION_LABEL}>
                  정기주문 할인 설정
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="useSubscriptionDiscount"
                      checked={!formData.useSubscriptionDiscount}
                      onChange={() => setFormData(prev => ({ ...prev, useSubscriptionDiscount: false }))}
                      className="w-4 h-4 text-neutral-900 focus:ring-neutral-900"
                    />
                    <span className="text-sm text-neutral-800">미사용</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="useSubscriptionDiscount"
                      checked={formData.useSubscriptionDiscount}
                      onChange={() => setFormData(prev => ({ ...prev, useSubscriptionDiscount: true }))}
                      className="w-4 h-4 text-neutral-900 focus:ring-neutral-900"
                    />
                    <span className="text-sm text-neutral-800">사용</span>
                  </label>
                </div>
              </div>

              {formData.useSubscriptionDiscount && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className={ADMIN_STYLES.SECTION_LABEL}>
                    정기주문 할인률 (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="subscriptionDiscount"
                      value={formData.subscriptionDiscount}
                      onChange={handleInputChange}
                      placeholder="0"
                      className={`${ADMIN_STYLES.INPUT} w-32`}
                    />
                    <span className="text-neutral-600 font-medium">%</span>
                  </div>
                  <p className={ADMIN_STYLES.HELPER_TEXT}>
                    정기주문 시 적용될 할인율을 숫자로 입력하세요.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bulk Discounts */}
          <div>
            <label className={ADMIN_STYLES.SECTION_LABEL}>
              다량주문 할인률
            </label>
            <div className="space-y-3">
              {formData.bulkDiscounts.map((discount) => (
                <div key={discount.id} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={discount.quantity}
                    onChange={(e) => updateBulkDiscount(discount.id, 'quantity', e.target.value)}
                    placeholder="0"
                    className={`${ADMIN_STYLES.INPUT} w-32`}
                  />
                  <span className="text-neutral-600 text-sm">개 이상</span>
                  <input
                    type="text"
                    value={discount.discountRate}
                    onChange={(e) => updateBulkDiscount(discount.id, 'discountRate', e.target.value)}
                    placeholder="0"
                    className={`${ADMIN_STYLES.INPUT} w-32`}
                  />
                  <span className="text-neutral-600 text-sm">%</span>
                  <button
                    type="button"
                    onClick={() => removeBulkDiscount(discount.id)}
                    className="p-2 border border-neutral-300 text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addBulkDiscount}
                className={ADMIN_STYLES.BTN_OUTLINE + " py-2 flex items-center gap-2"}
              >
                <Plus className="w-4 h-4" />
                <span>할인 조건 추가</span>
              </button>
            </div>
            <p className={ADMIN_STYLES.HELPER_TEXT}>
              구매 수량에 따른 할인률을 설정하세요
            </p>
          </div>
        </div>

        {/* 추가 증정 상품 섹터 */}
        <div className={ADMIN_STYLES.CARD}>
          <h3 className={ADMIN_STYLES.SECTION_TITLE}>추가 증정 상품</h3>
          
          <div className="mb-6">
            <label className={ADMIN_STYLES.SECTION_LABEL}>
              상품 검색 및 추가
            </label>
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-neutral-400 absolute left-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsSearchDropdownOpen(true);
                  }}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  placeholder="추가 증정상품에 포함할 상품을 검색하여 추가해 주세요"
                  className={`${ADMIN_STYLES.INPUT} pl-10`}
                />
              </div>

              {isSearchDropdownOpen && searchTerm.trim() && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 shadow-2xl max-h-[500px] overflow-y-auto rounded-sm">
                  {isLoadingProducts ? (
                    <div className="px-4 py-8 text-center text-neutral-500">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      <p className="text-sm">상품 정보를 불러오고 있습니다...</p>
                    </div>
                  ) : filteredSearchProducts.length > 0 ? (
                    filteredSearchProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addBonusProduct(product)}
                        className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0 text-left group"
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900 truncate">{product.name}</span>
                          <span className="text-xs text-neutral-500 flex-shrink-0">({product.sku})</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-sm text-neutral-500 text-center">
                      검색 결과가 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className={ADMIN_STYLES.SECTION_LABEL}>추가된 상품 목록</h4>
            <div className="border border-neutral-200">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-neutral-50/50">
                    <th className={ADMIN_STYLES.TABLE_HEADER}>상품 정보</th>
                    <th className={ADMIN_STYLES.TABLE_HEADER + " w-32"}>금액</th>
                    <th className={ADMIN_STYLES.TABLE_HEADER + " w-48 text-center"}>계산 방법</th>
                    <th className={ADMIN_STYLES.TABLE_HEADER + " w-32 text-center"}>증정 수량</th>
                    <th className={ADMIN_STYLES.TABLE_HEADER + " w-20 text-center"}>관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {formData.bonusProducts.length > 0 ? (
                    formData.bonusProducts.map((item) => (
                      <tr key={item.id} className={ADMIN_STYLES.TABLE_ROW_HOVER}>
                        <td className={ADMIN_STYLES.TABLE_CELL}>
                          <div className="flex flex-col">
                            <span className="font-bold text-neutral-900">{item.name}</span>
                            <span className="text-[10px] text-neutral-400 font-medium">{item.sku}</span>
                          </div>
                        </td>
                        <td className={ADMIN_STYLES.TABLE_CELL}>
                          <div className="flex items-center justify-end gap-2 text-right">
                            <input
                              type="text"
                              value={item.price}
                              onChange={(e) => updateBonusProduct(item.id, 'price', e.target.value)}
                              className={`${ADMIN_STYLES.INPUT} h-8 w-24 text-right px-2 font-bold`}
                            />
                            <span className="text-neutral-500 text-[10px] font-bold">원</span>
                          </div>
                        </td>
                        <td className={ADMIN_STYLES.TABLE_CELL}>
                          <div className="flex flex-col gap-2 items-center justify-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={item.calculationMethod === 'fixed'}
                                onChange={() => updateBonusProduct(item.id, 'calculationMethod', 'fixed')}
                                className="w-3.5 h-3.5 accent-neutral-900"
                              />
                              <span className="text-[10px] font-bold text-neutral-700">고정수량</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={item.calculationMethod === 'ratio'}
                                onChange={() => updateBonusProduct(item.id, 'calculationMethod', 'ratio')}
                                className="w-3.5 h-3.5 accent-neutral-900"
                              />
                              <span className="text-[10px] font-bold text-neutral-700">비율계산</span>
                            </label>
                          </div>
                        </td>
                        <td className={ADMIN_STYLES.TABLE_CELL}>
                          <div className="flex flex-col items-center justify-center gap-1">
                            {item.calculationMethod === 'fixed' ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={item.quantity}
                                  onChange={(e) => updateBonusProduct(item.id, 'quantity', e.target.value)}
                                  className={`${ADMIN_STYLES.INPUT} h-8 w-16 text-center font-bold`}
                                />
                                <span className="text-neutral-500 text-[10px] font-bold">개</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={item.percentage}
                                    onChange={(e) => updateBonusProduct(item.id, 'percentage', e.target.value)}
                                    className={`${ADMIN_STYLES.INPUT} h-8 w-16 text-center font-bold`}
                                  />
                                  <span className="text-neutral-500 text-[10px] font-bold">%</span>
                                </div>
                                <span className="text-[9px] text-blue-600 font-black uppercase tracking-tighter">Purchase Ratio</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={ADMIN_STYLES.TABLE_CELL + " text-center"}>
                          <button
                            type="button"
                            onClick={() => removeBonusProduct(item.id)}
                            className={ADMIN_STYLES.BTN_GHOST}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                        추가된 증정 상품이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className={ADMIN_STYLES.CARD}>
          <h3 className={ADMIN_STYLES.SECTION_TITLE}>상품 설명</h3>
          <RichTextEditor
            value={formData.description}
            onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
            onImageUpload={(file) => productService.uploadProductImage(file)}
          />
        </div>

        {/* Action Buttons - Sticky Layer at the bottom */}
        <div className="sticky bottom-0 z-50 bg-white/90 backdrop-blur-md border-t border-neutral-200 py-8 px-8 -mx-8 mt-12 flex items-center justify-end gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            disabled={isSubmitting}
            className={ADMIN_STYLES.BTN_OUTLINE + " flex items-center gap-2"}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>취소</span>
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={ADMIN_STYLES.BTN_PRIMARY + " flex items-center gap-2"}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Package className="w-5 h-5" />
            )}
            <span>{isEditMode ? '상품 수정하기' : '상품 등록하기'}</span>
          </button>
        </div>
      </form>

      {/* Result Layer Popup */}
      <Dialog open={resultModal.isOpen} onOpenChange={(open) => setResultModal(prev => ({...prev, isOpen: open}))}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl">
          <div className={`h-2 ${resultModal.type === 'error' ? 'bg-red-500' : 'bg-neutral-900'}`} />
          <div className="p-8">
            <DialogHeader>
              <DialogTitle className={`text-2xl font-black tracking-tight ${resultModal.type === 'error' ? 'text-red-600' : 'text-neutral-900'}`}>
                {resultModal.title}
              </DialogTitle>
              <DialogDescription className="text-base text-neutral-600 pt-4 leading-relaxed whitespace-pre-wrap font-medium">
                {resultModal.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-8 flex sm:justify-center">
              <button
                onClick={() => {
                  setResultModal(prev => ({...prev, isOpen: false}));
                  if (resultModal.type === 'success' && !isEditMode) {
                    navigate('/admin/products');
                  }
                }}
                className={`w-full py-4 px-6 font-bold transition-all text-sm tracking-widest uppercase rounded-sm shadow-md hover:shadow-lg active:scale-[0.98] ${
                  resultModal.type === 'error' 
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-200' 
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                }`}
              >
                확인
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
