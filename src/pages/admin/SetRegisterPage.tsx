import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, ImageIcon, X, Plus, Trash2, Search, Loader2, ShieldAlert, Package } from 'lucide-react';
import { RichTextEditor } from '../../components/RichTextEditor';
import { useProduct, useProducts, useCreateProduct, useUpdateProduct, useAddPricingTiers } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { productService, ProductInput } from '../../services/productService';
import { Product } from '../../types';
import { ADMIN_STYLES } from '../../constants/adminStyles';

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

interface QuantityOptionData {
  id: string;
  name: string;
  quantity: string;
  discountRate: string;
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
  bulkDiscounts: BulkDiscount[];
  bonusProducts: BonusProductData[];
  quantityOptions: QuantityOptionData[];
}



export function SetRegisterPage() {
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
    baseProductId: '',
    stockMultiplier: '1',
    isShareStock: false,
    bulkDiscounts: [],
    bonusProducts: [],
    quantityOptions: [],
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        quantityOptions: existingProduct.options?.map(opt => ({
          id: opt.id,
          name: opt.name,
          quantity: opt.quantity.toString(),
          discountRate: opt.discountRate.toString(),
        })) || [],
      });
      if (existingProduct.imageUrl) {
        setThumbnailPreview(existingProduct.imageUrl);
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
      !formData.bonusProducts.some(bp => bp.productId === p.id) 
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

  // --- Quantity Options Handlers ---
  const addQuantityOption = () => {
    const newOption: QuantityOptionData = {
      id: Date.now().toString(),
      name: '',
      quantity: '1',
      discountRate: '0',
    };
    setFormData(prev => ({
      ...prev,
      quantityOptions: [...prev.quantityOptions, newOption],
    }));
  };

  const removeQuantityOption = (id: string) => {
    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.filter(o => o.id !== id),
    }));
  };

  const updateQuantityOption = (id: string, field: 'name' | 'quantity' | 'discountRate', value: string) => {
    let processedValue = value;
    if (field === 'quantity') {
      const numericValue = value.replace(/[^0-9]/g, '');
      processedValue = formatWithCommas(numericValue);
    } else if (field === 'discountRate') {
      // Allow only numbers and a single dot
      processedValue = value.replace(/[^0-9.]/g, '');
      const parts = processedValue.split('.');
      if (parts.length > 2) {
        processedValue = parts[0] + '.' + parts.slice(1).join('');
      }
    }

    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.map(o => 
        o.id === id ? { ...o, [field]: processedValue } : o
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
        is_package: false,
        is_active: formData.status === 'active',
        is_visible: formData.isVisible,
        item_input_type: formData.itemInputType,
        selectable_count: parseInt(unformatNumber(formData.selectableCount)) || 1,
        credit_available: formData.creditAvailable,
        points_available: formData.pointsAvailable,
        subscription_discount: formData.useSubscriptionDiscount ? parseFloat(unformatNumber(formData.subscriptionDiscount)) || 0 : 0,
        min_order_quantity: minQty,
        max_order_quantity: maxQty > 0 ? maxQty : undefined,
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


      // 4. Update Options
      const optionsData = formData.quantityOptions.map(opt => ({
        name: opt.name,
        quantity: parseInt(unformatNumber(opt.quantity)) || 1,
        discountRate: parseFloat(unformatNumber(opt.discountRate)) || 0
      }));
      await productService.addOptions(productId, optionsData);

      // 5. Update Bonus Items (Main Only)
      const allBonusItems: { bonusProductId: string; quantity: number; priceOverride: number; optionId: string | null }[] = [];
      
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
      <div className={ADMIN_STYLES.PAGE_HEADER}>
        <button
          onClick={() => navigate('/admin/products')}
          className={ADMIN_STYLES.BTN_GHOST}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className={ADMIN_STYLES.PAGE_TITLE}>
            {isEditMode ? '셋트 상품 수정' : '셋트 상품 등록'}
          </h2>
          <p className={ADMIN_STYLES.PAGE_SUBTITLE}>
            {isEditMode ? '셋트 상품 정보를 수정합니다' : '새로운 상품 세트를 등록합니다'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Combined Product Images Section - Compact Single Line */}
        <div className={ADMIN_STYLES.CARD}>
          <div className={ADMIN_STYLES.SECTION_TITLE}>
            <h3 className="text-lg font-bold">상품 이미지 설정</h3>
            <span className="text-xs text-neutral-500 font-medium ml-4">대표 이미지 1장 + 추가 이미지 최대 5장</span>
          </div>
          
          <div className="flex flex-row flex-wrap gap-4 items-start">
            {/* Primary Image Slot */}
            <div 
              className="w-40 h-40 border-2 border-dashed border-neutral-200 flex items-center justify-center bg-neutral-50 relative overflow-hidden cursor-pointer hover:bg-white hover:border-neutral-900 transition-all group shadow-sm"
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
                  <p className="text-[10px] text-neutral-400 font-bold group-hover:text-neutral-900 leading-tight">세트 대표<br />이미지 업로드</p>
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
                <div className="absolute top-0 left-0 bg-neutral-400/80 text-white text-[9px] px-1.5 py-0.5 font-bold tracking-tighter shadow-sm">Detail {index + 1}</div>
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
                상품명 <span className="text-red-500">*</span>
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
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={ADMIN_STYLES.INPUT}
                required
              >
                <option value="">카테고리 선택</option>
                {renderCategoryOptions()}
              </select>
            </div>

            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>
                상품코드 <span className="text-red-500">*</span>
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
                판매가 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="판매가를 입력하세요"
                  className={ADMIN_STYLES.INPUT + " text-right pr-12 font-bold"}
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-bold">원</span>
              </div>
            </div>


            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={ADMIN_STYLES.SECTION_LABEL}>최대 주문 수량</label>
                <div className="relative">
                  <input
                    type="text"
                    name="maxOrderQuantity"
                    value={formData.maxOrderQuantity}
                    onChange={handleInputChange}
                    className={ADMIN_STYLES.INPUT + " text-right pr-12 font-bold"}
                    placeholder="제한 없음"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-bold uppercase">개</span>
                </div>
                <p className="text-[10px] text-neutral-400 mt-2 italic">* 주문 시 허용되는 최대 수량 (0 입력 시 제한 없음)</p>
              </div>
            </div>

            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>재고 수량</label>
              <div className="relative">
                <input
                  type="text"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  disabled={formData.isShareStock}
                  placeholder={formData.isShareStock ? "마스터 재고를 공유 중입니다" : "재고 수량을 입력하세요"}
                  className={ADMIN_STYLES.INPUT + ` text-right pr-12 font-bold ${formData.isShareStock ? 'bg-neutral-50 text-neutral-400 cursor-not-allowed border-dashed' : ''}`}
                />
                {!formData.isShareStock && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-bold uppercase">개</span>}
              </div>
              {formData.isShareStock && <p className="text-[10px] text-blue-600 font-black mt-2 uppercase tracking-tighter">Shared via Master Resource</p>}
            </div>

            {/* 재고 공유 설정 추가 */}
            <div className="col-span-2 pt-6 border-t border-neutral-100">
              <label className="flex items-center gap-3 cursor-pointer group mb-6">
                <input
                  type="checkbox"
                  checked={formData.isShareStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, isShareStock: e.target.checked }))}
                  className="w-5 h-5 accent-neutral-900 cursor-pointer"
                />
                <span className="text-sm font-bold text-neutral-900 group-hover:text-black transition-colors">다른 상품과 재고를 공유하시겠습니까? (세트 상품 등)</span>
              </label>

              {formData.isShareStock && (
                <div className="bg-neutral-50/50 p-8 border border-neutral-200">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="relative">
                      <label className={ADMIN_STYLES.SECTION_LABEL}>마스터 상품 (낱개/재고 보유 상품) 검색</label>
                      <div className="relative flex items-center">
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3" />
                        <input
                          type="text"
                          placeholder="상품명 또는 SKU 검색"
                          value={masterSearchTerm}
                          onChange={(e) => {
                            setMasterSearchTerm(e.target.value);
                            setIsMasterSearchOpen(true);
                          }}
                          className={ADMIN_STYLES.INPUT + " pl-10 h-10 text-sm"}
                        />
                        {isMasterSearchOpen && masterSearchTerm.trim() && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 shadow-2xl z-50 max-h-60 overflow-y-auto">
                            {allProducts
                              .filter(p => !p.baseProductId && p.id !== id && (p.name.toLowerCase().includes(masterSearchTerm.toLowerCase()) || p.sku.toLowerCase().includes(masterSearchTerm.toLowerCase())))
                              .map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, baseProductId: p.id }));
                                    setMasterSearchTerm(p.name);
                                    setIsMasterSearchOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-sm border-b border-neutral-100 flex justify-between items-center transition-colors"
                                >
                                  <span className="font-medium text-neutral-900">{p.name} <span className="text-[10px] text-neutral-400 ml-1 font-normal tracking-tight">{p.sku}</span></span>
                                  <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5">재고: {p.stock}</span>
                                </button>
                              ))
                            }
                          </div>
                        )}
                      </div>
                      {formData.baseProductId && (
                        <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-neutral-900 text-white rounded-sm shadow-sm animate-in fade-in duration-300 w-fit">
                          <Check className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest mr-1 opacity-60">Linked:</span>
                          <span className="text-[11px] font-bold">
                            {allProducts.find(p => p.id === formData.baseProductId)?.name || "선택된 상품"}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, baseProductId: '' }))}
                            className="ml-2 p-0.5 hover:bg-white/20 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={ADMIN_STYLES.SECTION_LABEL}>재고 차감 배수 (판매 1개당 차감량)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={formData.stockMultiplier}
                          onChange={(e) => setFormData(prev => ({ ...prev, stockMultiplier: e.target.value }))}
                          className={ADMIN_STYLES.INPUT + " h-10 text-right pr-12 font-bold"}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-bold uppercase">배</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-2 italic">* 예: 5개 세트면 5 입력 (1개 판매 시 마스터 재고 5개 차감)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>판매 상태</label>
              <div className="flex gap-6 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === 'active'}
                    onChange={() => setFormData(prev => ({ ...prev, status: 'active' }))}
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
                    onChange={() => setFormData(prev => ({ ...prev, status: 'inactive' }))}
                    className="w-4 h-4 accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-900">판매중지</span>
                </label>
              </div>
            </div>

            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>노출 여부 (고객 화면)</label>
              <div className="flex gap-6 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isVisible"
                    value="true"
                    checked={formData.isVisible === true}
                    onChange={() => setFormData(prev => ({ ...prev, isVisible: true }))}
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
                    onChange={() => setFormData(prev => ({ ...prev, isVisible: false }))}
                    className="w-4 h-4 accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-900">미노출</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Order Options */}
        <div className={ADMIN_STYLES.CARD}>
          <h3 className={ADMIN_STYLES.SECTION_TITLE}>주문 옵션</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className={ADMIN_STYLES.SECTION_LABEL}>크레딧 사용 가능여부</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="creditAvailable"
                    value="true"
                    checked={formData.creditAvailable === true}
                    onChange={() => setFormData(prev => ({ ...prev, creditAvailable: true }))}
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
                    onChange={() => setFormData(prev => ({ ...prev, creditAvailable: false }))}
                    className="w-4 h-4 accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-900">불가능</span>
                </label>
              </div>
              <p className="text-[10px] text-neutral-400 italic">해당 상품 구매 시 크레딧 사용 가능 여부를 설정합니다</p>
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
                    onChange={() => setFormData(prev => ({ ...prev, pointsAvailable: true }))}
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
                    onChange={() => setFormData(prev => ({ ...prev, pointsAvailable: false }))}
                    className="w-4 h-4 accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-900">불가능</span>
                </label>
              </div>
              <p className="text-[10px] text-neutral-400 italic">해당 상품 구매 시 적립금 사용 가능 여부를 설정합니다</p>
            </div>
          </div>
        </div>

        {/* Discount Settings */}
        <div className={ADMIN_STYLES.CARD}>
          <h3 className={ADMIN_STYLES.SECTION_TITLE}>할인 설정</h3>

          {/* Subscription Discount */}
          <div className="p-6 bg-neutral-50/50 border border-neutral-200">
            <div className="flex flex-col gap-6">
              <div>
                <label className={ADMIN_STYLES.SECTION_LABEL}>정기주문 할인 설정</label>
                <div className="flex gap-6 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="useSubscriptionDiscount"
                      checked={!formData.useSubscriptionDiscount}
                      onChange={() => setFormData(prev => ({ ...prev, useSubscriptionDiscount: false }))}
                      className="w-4 h-4 accent-neutral-900 cursor-pointer"
                    />
                    <span className="text-sm text-neutral-700 group-hover:text-black font-medium">미사용</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="useSubscriptionDiscount"
                      checked={formData.useSubscriptionDiscount}
                      onChange={() => setFormData(prev => ({ ...prev, useSubscriptionDiscount: true }))}
                      className="w-4 h-4 accent-neutral-900 cursor-pointer"
                    />
                    <span className="text-sm text-neutral-700 group-hover:text-black font-medium">사용</span>
                  </label>
                </div>
              </div>

              {formData.useSubscriptionDiscount && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className={ADMIN_STYLES.SECTION_LABEL}>정기주문 할인율 (%)</label>
                  <div className="relative w-40 mt-2">
                    <input
                      type="text"
                      name="subscriptionDiscount"
                      value={formData.subscriptionDiscount}
                      onChange={handleInputChange}
                      placeholder="0"
                      className={ADMIN_STYLES.INPUT + " text-right pr-12 font-bold"}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-2 italic">
                    * 정기주문 시 적용될 할인율을 숫자로 입력하세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 세트 옵션 설정 섹터 */}
        <div className={ADMIN_STYLES.CARD}>
          <div className={ADMIN_STYLES.SECTION_TITLE}>
            <h3 className="text-lg font-bold">세트 옵션 설정</h3>
            <button
              type="button"
              onClick={addQuantityOption}
              className={ADMIN_STYLES.BTN_PRIMARY}
            >
              <Plus className="w-4 h-4" />
              세트 옵션 추가
            </button>
          </div>
          
          <div className="space-y-6">
            <p className="text-[10px] text-neutral-400 italic mb-6">
              * 고객이 선택할 수 있는 지정 갯수 세트(예: 3개 SET, 50개 SET)를 만듭니다. 포함수량과 할인적용률을 지정할 수 있습니다. 
              <br />* 주의: 세트 옵션이 하나라도 존재하는 경우, 고객 상세 화면에서는 낱개 수량 입력창이 사라지고 옵션 선택 드롭다운만 나타납니다.
            </p>
            
            {formData.quantityOptions.map((opt, index) => (
                <div key={opt.id} className="border border-neutral-200 bg-neutral-50/50 p-6 relative">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-widest">옵션 {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeQuantityOption(opt.id)}
                      className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className={ADMIN_STYLES.SECTION_LABEL}>옵션 표기명 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="예) 5개 SET"
                        value={opt.name}
                        onChange={(e) => updateQuantityOption(opt.id, 'name', e.target.value)}
                        className={ADMIN_STYLES.INPUT}
                      />
                    </div>
                    <div>
                      <label className={ADMIN_STYLES.SECTION_LABEL}>포함 수량 (실제 제품 갯수) <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="5"
                          value={opt.quantity}
                          onChange={(e) => updateQuantityOption(opt.id, 'quantity', e.target.value.replace(/[^0-9]/g, ''))}
                          className={ADMIN_STYLES.INPUT + " text-right pr-12 font-bold"}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-bold uppercase">개</span>
                      </div>
                    </div>
                    <div>
                      <label className={ADMIN_STYLES.SECTION_LABEL}>할인 적용률 (기본가 대비)</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="20"
                          value={opt.discountRate}
                          onChange={(e) => updateQuantityOption(opt.id, 'discountRate', e.target.value.replace(/[^0-9.]/g, ''))}
                          className={ADMIN_STYLES.INPUT + " text-right pr-12 font-bold text-blue-600"}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-blue-600 font-bold uppercase">％</span>
                      </div>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* 추가 증정 상품 섹터 */}
        <div className={ADMIN_STYLES.CARD}>
          <h3 className={ADMIN_STYLES.SECTION_TITLE}>추가 증정 상품</h3>
          
          <div className="space-y-6">
            <div className="space-y-3 relative">
              <label className={ADMIN_STYLES.SECTION_LABEL}>상품 검색 및 추가</label>
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
                  className={ADMIN_STYLES.INPUT + " pl-10 h-12"}
                />
              </div>

              {isSearchDropdownOpen && searchTerm.trim() && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-neutral-200 shadow-2xl max-h-[400px] overflow-y-auto rounded-sm">
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
                        className="w-full px-4 py-2 flex items-center justify-between hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0 text-left group"
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900 truncate">{product.name}</span>
                          <span className="text-[10px] text-neutral-400 font-medium flex-shrink-0">({product.sku})</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <span className="text-[10px] text-blue-600 font-black bg-blue-50 px-2 py-0.5 uppercase tracking-tighter">Bonus Ready</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-sm text-neutral-500 text-center font-medium">
                      검색 결과가 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h4 className={ADMIN_STYLES.SECTION_LABEL}>추가된 상품 목록</h4>
            <div className="border border-neutral-200 mt-3 overflow-hidden">
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
                      <td colSpan={5} className="px-4 py-8 text-center text-neutral-500 font-medium">
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
          <div className="border border-neutral-200">
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              onImageUpload={(file) => productService.uploadProductImage(file)}
            />
          </div>
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
                  if (resultModal.type === 'success') {
                    navigate('/admin/products/set');
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
