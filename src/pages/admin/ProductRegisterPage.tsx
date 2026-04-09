import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Upload, ImageIcon, X, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { RichTextEditor } from '../../components/RichTextEditor';
import { useProduct, useProducts, useCreateProduct, useUpdateProduct, useAddPricingTiers } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { productService, ProductInput } from '../../services/productService';
import { Product } from '../../types';

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
}

interface QuantityOptionData {
  id: string;
  name: string;
  quantity: string;
  discountRate: string;
  bonusProducts: BonusProductData[];
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



export function ProductRegisterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
          price: formatWithCommas(item.priceOverride || item.product?.price || 0),
          quantity: formatWithCommas(item.quantity || 0),
          imageUrl: item.product?.imageUrl || '',
        })) || [],
        quantityOptions: existingProduct.options?.map(opt => {
          const matchedBonusItems = existingProduct.bonusItems?.filter(item => {
            if (!item.optionId || !opt.id) return false;
            return String(item.optionId).toLowerCase() === String(opt.id).toLowerCase();
          });

          return {
            id: opt.id,
            name: opt.name,
            quantity: opt.quantity.toString(),
            discountRate: opt.discountRate.toString(),
            bonusProducts: matchedBonusItems?.map(item => ({
              id: item.id,
              productId: item.productId,
              name: item.product?.name || '상품 정보 없음',
              sku: item.product?.sku || '',
              price: formatWithCommas(item.priceOverride || item.product?.price || 0),
              quantity: formatWithCommas(item.quantity || 0),
              imageUrl: item.product?.imageUrl || '',
            })) || []
          };
        }) || [],
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
      price: product.price.toString(),
      quantity: '1',
      imageUrl: product.imageUrl,
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

  const updateBonusProduct = (id: string, field: 'quantity' | 'price', value: string) => {
    // Format if it's a numeric field
    const numericValue = value.replace(/[^0-9]/g, '');
    const processedValue = formatWithCommas(numericValue);

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
      bonusProducts: [],
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
    if (field === 'quantity' || field === 'discountRate') {
      const numericValue = value.replace(/[^0-9]/g, '');
      processedValue = formatWithCommas(numericValue);
    }

    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.map(o => 
        o.id === id ? { ...o, [field]: processedValue } : o
      ),
    }));
  };

  const [optionSearchTerm, setOptionSearchTerm] = useState('');
  const [activeOptionIdForSearch, setActiveOptionIdForSearch] = useState<string | null>(null);

  const filteredOptionSearchProducts = (allProducts || []).filter(p => {
    const searchLower = optionSearchTerm.toLowerCase().trim();
    if (!searchLower) return false;
    
    return (
      p.id !== id &&
      (
        (p.name || '').toLowerCase().includes(searchLower) || 
        (p.sku || '').toLowerCase().includes(searchLower) ||
        (p.category || '').toLowerCase().includes(searchLower)
      ) &&
      activeOptionIdForSearch && 
      !formData.quantityOptions.find(o => o.id === activeOptionIdForSearch)?.bonusProducts.some(bp => bp.productId === p.id)
    );
  }).slice(0, 20);

  const addBonusProductToOption = (optionId: string, product: Product) => {
    const newBonus: BonusProductData = {
      id: Date.now().toString(),
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      quantity: '1',
      imageUrl: product.imageUrl,
    };
    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.map(o => 
        o.id === optionId ? { ...o, bonusProducts: [...o.bonusProducts, newBonus] } : o
      ),
    }));
    setOptionSearchTerm('');
    setActiveOptionIdForSearch(null);
  };
  
  const removeBonusProductFromOption = (optionId: string, bonusId: string) => {
    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.map(o => 
        o.id === optionId ? { ...o, bonusProducts: o.bonusProducts.filter(bp => bp.id !== bonusId) } : o
      ),
    }));
  };

  const updateBonusProductInOption = (optionId: string, bonusId: string, field: 'quantity' | 'price', value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const processedValue = formatWithCommas(numericValue);

    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.map(o => 
        o.id === optionId ? {
          ...o,
          bonusProducts: o.bonusProducts.map(bp => bp.id === bonusId ? { ...bp, [field]: processedValue } : bp)
        } : o
      ),
    }));
  };


  const formatWithCommas = (value: string | number) => {
    if (value === undefined || value === null || value === '') return '';
    const stringValue = value.toString().replace(/,/g, '');
    if (isNaN(Number(stringValue))) return stringValue;
    return Number(stringValue).toLocaleString('ko-KR');
  };

  const unformatNumber = (value: string) => {
    return value.replace(/,/g, '');
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
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
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

    const minQty = parseInt(unformatNumber(formData.minOrderQuantity)) || 1;
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

      // 4. Update Options
      const optionsData = formData.quantityOptions.map(opt => ({
        name: opt.name,
        quantity: parseInt(unformatNumber(opt.quantity)) || 1,
        discountRate: parseFloat(unformatNumber(opt.discountRate)) || 0
      }));
      const savedOptions = await productService.addOptions(productId, optionsData);

      // 5. Update Bonus Items (Main + Options)
      const allBonusItems: { bonusProductId: string; quantity: number; priceOverride: number; optionId: string | null }[] = [];
      
      formData.bonusProducts.forEach(bp => {
        allBonusItems.push({
          bonusProductId: bp.productId,
          quantity: parseInt(unformatNumber(bp.quantity)) || 1,
          priceOverride: parseFloat(unformatNumber(bp.price)) || 0,
          optionId: null
        });
      });

      formData.quantityOptions.forEach((opt, index) => {
        const dbOption = savedOptions[index];
        if (dbOption) {
          opt.bonusProducts.forEach(bp => {
            allBonusItems.push({
              bonusProductId: bp.productId,
              quantity: parseInt(unformatNumber(bp.quantity)) || 1,
              priceOverride: parseFloat(unformatNumber(bp.price)) || 0,
              optionId: dbOption.id
            });
          });
        }
      });
      
      await productService.addBonusItems(productId, allBonusItems);

      setResultModal({
        isOpen: true,
        title: isEditMode ? '수정 완료' : '등록 완료',
        description: `상품이 성공적으로 ${isEditMode ? '수정' : '등록'}되었습니다.`,
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error saving product:', error);
      setResultModal({
        isOpen: true,
        title: '저장 실패',
        description: error.message || '상품 저장 중 오류가 발생했습니다. 데이터 연결 상태를 확인해주세요.',
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
    <div className="space-y-6">
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
            {isEditMode ? '상품 수정' : '상품 등록'}
          </h2>
          <p className="text-sm text-neutral-600">
            {isEditMode ? '상품 정보를 수정합니다' : '새로운 상품을 등록합니다'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Image Upload */}
        <div className="bg-white border border-neutral-200 p-8">
          <h3 className="text-lg font-bold text-neutral-900 mb-6 border-l-4 border-neutral-900 pl-3">대표 이미지</h3>
          <div className="flex items-start gap-4">
            <div className="w-40 h-40 border-2 border-dashed border-neutral-300 flex items-center justify-center bg-neutral-50 relative overflow-hidden">
              {thumbnailPreview ? (
                <>
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnailPreview(null)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500">대표 이미지</p>
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>이미지 업로드</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-neutral-500 mt-2">
                권장 크기: 800x800px, 최대 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Additional Images */}
        <div className="bg-white border border-neutral-200 p-8">
          <h3 className="text-lg font-bold text-neutral-900 mb-6 border-l-4 border-neutral-900 pl-3">추가 이미지</h3>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {additionalImages.map((image, index) => (
                <div
                  key={index}
                  className="w-32 h-32 border border-neutral-300 relative overflow-hidden"
                >
                  <img
                    src={image}
                    alt={`Additional ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeAdditionalImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-32 h-32 border-2 border-dashed border-neutral-300 flex items-center justify-center bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition-colors">
                <div className="text-center">
                  <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
                  <p className="text-xs text-neutral-500">추가</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAdditionalImagesChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-neutral-500">
              최대 10개까지 추가 가능합니다
            </p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white border border-neutral-200 p-8">
          <h3 className="text-lg font-bold text-neutral-900 mb-6 border-l-4 border-neutral-900 pl-3">기본 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                상품명 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="상품명을 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                카테고리 <span className="text-red-600">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              >
                <option value="">카테고리 선택</option>
                {renderCategoryOptions()}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                상품코드 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="productCode"
                value={formData.productCode}
                onChange={handleInputChange}
                placeholder="상품코드를 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                SAP SKU (ERP 매핑용)
              </label>
              <input
                type="text"
                name="sapSku"
                value={formData.sapSku}
                onChange={handleInputChange}
                placeholder="SAP 품번을 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                제조사
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                placeholder="제조사를 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  판매가 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="판매가를 입력하세요"
                  className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  판매 단위 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="salesUnit"
                  value={formData.salesUnit}
                  onChange={handleInputChange}
                  placeholder="예: 10 (10개 묶음)"
                  className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
                <p className="text-[10px] text-neutral-400 mt-1">* 개당 단가 계산의 기준이 됩니다 (기본값: 1)</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2 uppercase">
                개당 단가 (자동계산)
              </label>
              <div className="w-full px-4 py-3 border border-neutral-200 bg-neutral-50 text-neutral-500 font-medium tracking-tight">
                {(() => {
                  const price = Number(formData.price.replace(/[^0-9]/g, '')) || 0;
                  const unit = Number(formData.salesUnit.replace(/[^0-9]/g, '')) || 1;
                  return (Math.floor(price / unit)).toLocaleString();
                })()} 원
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">* 판매가 / 판매 단위</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                재고 수량
              </label>
              <input
                type="text"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                disabled={formData.isShareStock}
                placeholder={formData.isShareStock ? "마스터 재고를 공유 중입니다" : "재고 수량을 입력하세요"}
                className={`w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 ${formData.isShareStock ? 'bg-neutral-50 text-neutral-400 cursor-not-allowed' : ''}`}
              />
              {formData.isShareStock && <p className="text-[10px] text-neutral-500 mt-1">* 마스터 상품의 실제 재고를 추적합니다.</p>}
            </div>

            {/* 재고 공유 설정 추가 */}
            <div className="col-span-2 pt-4 border-t border-neutral-100">
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={formData.isShareStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, isShareStock: e.target.checked }))}
                  className="w-4 h-4 accent-neutral-900"
                />
                <span className="text-sm font-bold text-neutral-900">다른 상품과 재고를 공유하시겠습니까? (세트 상품 등)</span>
              </label>

              {formData.isShareStock && (
                <div className="bg-neutral-50 p-6 space-y-4 border border-neutral-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">마스터 상품 (낱개/재고 보유 상품) 검색</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="상품명 또는 SKU 검색"
                          value={masterSearchTerm}
                          onChange={(e) => {
                            setMasterSearchTerm(e.target.value);
                            setIsMasterSearchOpen(true);
                          }}
                          className="w-full px-4 py-2 text-sm border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        />
                        {isMasterSearchOpen && masterSearchTerm.trim() && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 shadow-xl z-50 max-h-60 overflow-y-auto">
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
                                  className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-sm border-b border-neutral-100 flex justify-between items-center"
                                >
                                  <span>{p.name} <span className="text-[10px] text-neutral-400 ml-1">{p.sku}</span></span>
                                  <span className="text-xs text-neutral-500">재고: {p.stock}</span>
                                </button>
                              ))
                            }
                          </div>
                        )}
                      </div>
                      {formData.baseProductId && (
                        <div className="mt-2 p-2 bg-white border border-neutral-900 inline-flex items-center gap-2 rounded-sm shadow-sm">
                          <span className="text-xs font-bold">연결됨:</span>
                          <span className="text-xs text-neutral-700">
                            {allProducts.find(p => p.id === formData.baseProductId)?.name || "선택된 상품"}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, baseProductId: '' }))}
                            className="text-neutral-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">재고 차감 배수 (판매 1개당 차감량)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.stockMultiplier}
                        onChange={(e) => setFormData(prev => ({ ...prev, stockMultiplier: e.target.value }))}
                        className="w-full px-4 py-2 text-sm border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                      <p className="text-[10px] text-neutral-400 mt-1">* 예: 5개 세트면 5 입력 (1개 판매 시 마스터 재고 5개 차감)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-4">
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
              <label className="block text-sm font-medium text-neutral-900 mb-4">
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

        {/* Order Options */}
        <div className="bg-white border border-neutral-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-lg font-bold text-neutral-900 border-l-4 border-neutral-900 pl-3">주문 옵션</h3>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-neutral-700">상품갯수 입력방법</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="itemInputType"
                      value="select"
                      checked={formData.itemInputType === 'select'}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-neutral-900 cursor-pointer"
                    />
                    <span className="text-sm text-neutral-900">리스트선택</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="itemInputType"
                      value="input"
                      checked={formData.itemInputType === 'input'}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-neutral-900 cursor-pointer"
                    />
                    <span className="text-sm text-neutral-900">직접입력</span>
                  </label>
                </div>
                <p className="text-xs text-neutral-400">사용자가 상품 상세보기에서 상품을 선택하는 방식을 결정합니다</p>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-neutral-700">크레딧 사용 가능여부</label>
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
                <p className="text-xs text-neutral-400">해당 상품 구매 시 크레딧 사용 가능 여부를 설정합니다</p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-neutral-700">적립금 사용 가능여부</label>
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
                <p className="text-xs text-neutral-400">해당 상품 구매 시 적립금 사용 가능 여부를 설정합니다</p>
              </div>
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">최소 주문 수량</label>
                <input
                  type="number"
                  name="minOrderQuantity"
                  value={formData.minOrderQuantity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white transition-all text-sm"
                  min="1"
                />
                <p className="text-xs text-neutral-400">주문 시 필요한 최소 수량을 설정하세요</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">최대 주문 수량</label>
                <input
                  type="number"
                  name="maxOrderQuantity"
                  value={formData.maxOrderQuantity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white transition-all text-sm"
                  min="0"
                  placeholder="제한 없음"
                />
                <p className="text-xs text-neutral-400">주문 시 허용되는 최대 수량을 설정하세요 (비워두면 제한 없음)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Discount Settings */}
        <div className="bg-white border border-neutral-200 p-8">
          <h3 className="text-lg font-bold text-neutral-900 mb-6 border-l-4 border-neutral-900 pl-3">할인 설정</h3>

          {/* Subscription Discount */}
          <div className="mb-8 p-4 bg-neutral-50 border border-neutral-200">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-3">
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
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    정기주문 할인률 (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="subscriptionDiscount"
                      value={formData.subscriptionDiscount}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-32 px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                    />
                    <span className="text-neutral-600 font-medium">%</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    정기주문 시 적용될 할인율을 숫자로 입력하세요.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bulk Discounts */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-3">
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
                    className="w-32 px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <span className="text-neutral-600">개 이상</span>
                  <input
                    type="text"
                    value={discount.discountRate}
                    onChange={(e) => updateBulkDiscount(discount.id, 'discountRate', e.target.value)}
                    placeholder="0"
                    className="w-32 px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <span className="text-neutral-600">%</span>
                  <button
                    type="button"
                    onClick={() => removeBulkDiscount(discount.id)}
                    className="p-2 border border-neutral-300 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addBulkDiscount}
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>할인 조건 추가</span>
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              구매 수량에 따른 할인률을 설정하세요
            </p>
          </div>
        </div>

        {/* 추가 증정 상품 섹터 */}
        <div className="bg-white border border-neutral-200 p-8">
          <h3 className="text-lg font-bold text-neutral-900 mb-6 border-l-4 border-neutral-900 pl-3">추가 증정 상품</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              상품 검색 및 추가
            </label>
            <div className="flex items-center w-full border border-neutral-300 bg-white focus-within:ring-2 focus-within:ring-neutral-900 focus-within:border-neutral-900 shadow-sm transition-all overflow-hidden group">
              <div className="pl-4 flex-shrink-0">
                <Search className="w-5 h-5 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                onFocus={() => setIsSearchDropdownOpen(true)}
                placeholder="추가 증정상품에 포함할 상품을 검색하여 추가해 주세요"
                className="w-full px-4 py-3 border-0 focus:ring-0 text-neutral-900 placeholder:text-neutral-400 bg-transparent"
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
                        <div className="text-right flex-shrink-0 ml-4">
                          <span className="text-sm font-medium text-neutral-900">{product.price.toLocaleString()}원</span>
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

          <div>
            <h4 className="text-sm font-medium text-neutral-900 mb-2">추가된 상품 목록</h4>
            <div className="border border-neutral-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 font-medium text-neutral-700">상품 정보</th>
                    <th className="px-4 py-3 font-medium text-neutral-700 w-32">금액</th>
                    <th className="px-4 py-3 font-medium text-neutral-700 w-32 text-center">증정갯수</th>
                    <th className="px-4 py-3 font-medium text-neutral-700 w-20 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {formData.bonusProducts.length > 0 ? (
                    formData.bonusProducts.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-neutral-900">{item.name}</span>
                            <span className="text-xs text-neutral-500">{item.sku}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="text"
                              value={item.price}
                              onChange={(e) => updateBonusProduct(item.id, 'price', e.target.value)}
                              className="w-24 text-right px-2 py-1 border border-neutral-300 focus:border-neutral-900 focus:outline-none rounded-sm"
                            />
                            <span className="text-neutral-500 ml-2">원</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => updateBonusProduct(item.id, 'quantity', e.target.value)}
                              className="w-16 text-center py-1 border border-neutral-300 focus:border-neutral-900 focus:outline-none rounded-sm"
                            />
                            <span className="text-neutral-500 ml-2">개</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeBonusProduct(item.id)}
                            className="text-neutral-400 hover:text-red-600 transition-colors"
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

        {/* 세트 옵션 설정 섹터 */}
        <div className="bg-white border border-neutral-200 p-8">
          <div className="flex items-center justify-between mb-6 border-l-4 border-neutral-900 pl-3">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">세트 옵션 설정 (선택사항)</h3>
            </div>
            <button
              type="button"
              onClick={addQuantityOption}
              className="px-4 py-2 text-sm font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              세트 옵션 추가
            </button>
          </div>
          <p className="text-xs text-neutral-500 mb-6">
            고객이 선택할 수 있는 지정 갯수 세트(예: 3개 SET, 50개 SET)를 만듭니다. 이 옵션별로 고유의 할인률과 전용 추가증정상품을 지정할 수 있습니다. 
            <br />* 주의: 세트 옵션이 하나라도 존재하는 경우, 고객 상세 화면에서는 낱개 수량 입력창이 사라지고 옵션 선택 드롭다운만 나타납니다.
          </p>
          <div className="space-y-6">
            {formData.quantityOptions.map((opt, index) => (
              <div key={opt.id} className="border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-sm">옵션 {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeQuantityOption(opt.id)}
                    className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">옵션 표기명 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="예) 5개 SET"
                      value={opt.name}
                      onChange={(e) => updateQuantityOption(opt.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-900 text-sm bg-white h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">포함 수량 (실제 제품 갯수) <span className="text-red-500">*</span></label>
                    <div className="flex items-center border border-neutral-300 bg-white focus-within:border-neutral-900 transition-colors overflow-hidden h-[40px]">
                      <input
                        type="text"
                        placeholder="5"
                        value={opt.quantity}
                        onChange={(e) => updateQuantityOption(opt.id, 'quantity', e.target.value.replace(/[^0-9]/g, ''))}
                        className="flex-1 w-full pl-3 pr-2 py-2 text-right border-0 focus:ring-0 text-sm bg-transparent outline-none"
                      />
                      <span className="text-[10px] text-neutral-500 font-bold whitespace-nowrap bg-neutral-100 flex items-center px-3 h-full border-l border-neutral-200 select-none min-w-[3rem] justify-center">개</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">할인 적용률 (기본가 대비)</label>
                    <div className="flex items-center border border-neutral-300 bg-white focus-within:border-neutral-900 transition-colors overflow-hidden h-[40px]">
                      <input
                        type="text"
                        placeholder="20"
                        value={opt.discountRate}
                        onChange={(e) => updateQuantityOption(opt.id, 'discountRate', e.target.value.replace(/[^0-9.]/g, ''))}
                        className="flex-1 w-full pl-3 pr-2 py-2 text-right border-0 focus:ring-0 text-sm bg-transparent outline-none"
                      />
                      <span className="text-[10px] text-neutral-500 font-bold whitespace-nowrap bg-neutral-100 flex items-center px-3 h-full border-l border-neutral-200 select-none min-w-[3rem] justify-center">％</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 border border-neutral-200">
                  <h5 className="text-xs font-medium text-neutral-900 mb-3">옵션 전용 추가 증정 상품</h5>
                  
                  <div className="mb-4 relative group">
                    <div className="flex items-center border border-neutral-300 bg-white focus-within:border-neutral-900 transition-colors overflow-hidden h-[40px]">
                      <div className="pl-3 flex-shrink-0">
                        <Search className="w-4 h-4 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={activeOptionIdForSearch === opt.id ? optionSearchTerm : ''}
                        onChange={(e) => {
                          setActiveOptionIdForSearch(opt.id);
                          setOptionSearchTerm(e.target.value);
                        }}
                        onFocus={() => setActiveOptionIdForSearch(opt.id)}
                        placeholder="증정할 상품명, 카테고리, SKU 검색"
                        className="flex-1 w-full px-3 py-2 border-0 focus:ring-0 text-sm bg-transparent placeholder:text-neutral-400"
                      />
                    </div>
                    
                    {activeOptionIdForSearch === opt.id && optionSearchTerm.trim() && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto">
                        {filteredOptionSearchProducts.length > 0 ? (
                          filteredOptionSearchProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => addBonusProductToOption(opt.id, p)}
                              className="w-full text-left px-4 py-3 hover:bg-neutral-50 flex items-center justify-between border-b border-neutral-100 last:border-0"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-neutral-900 text-sm">{p.name}</span>
                                <span className="text-[10px] text-neutral-500">{p.sku}</span>
                              </div>
                              <span className="text-xs font-semibold text-neutral-700">
                                {p.price.toLocaleString()}원
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-neutral-500">
                            검색 결과가 없습니다
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {opt.bonusProducts.length > 0 && (
                    <table className="w-full text-xs text-left border border-neutral-200">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-3 py-2 font-medium text-neutral-700">추가 증정 상품 정보</th>
                          <th className="px-3 py-2 font-medium text-neutral-700 w-28 text-right pr-6">금액 설정</th>
                          <th className="px-3 py-2 font-medium text-neutral-700 w-24 text-center">증정 갯수</th>
                          <th className="px-3 py-2 font-medium text-neutral-700 w-12 text-center">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {opt.bonusProducts.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">
                              <div className="flex flex-col">
                                <span className="font-medium text-neutral-900 text-[13px]">{item.name}</span>
                                <span className="text-[10px] text-neutral-500">{item.sku}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center border border-neutral-300 bg-white focus-within:border-neutral-900 transition-colors overflow-hidden h-[32px]">
                                <input
                                  type="text"
                                  value={item.price}
                                  onChange={(e) => updateBonusProductInOption(opt.id, item.id, 'price', e.target.value.replace(/[^0-9]/g, ''))}
                                  className="flex-1 w-full pl-2 pr-1 py-1 text-right border-0 focus:ring-0 text-xs bg-transparent outline-none"
                                />
                                <span className="text-[10px] text-neutral-500 font-bold whitespace-nowrap bg-neutral-100 flex items-center px-2 h-full border-l border-neutral-200 select-none min-w-[2.5rem] justify-center">원</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center border border-neutral-300 bg-white focus-within:border-neutral-900 transition-colors overflow-hidden h-[32px]">
                                <input
                                  type="text"
                                  value={item.quantity}
                                  onChange={(e) => updateBonusProductInOption(opt.id, item.id, 'quantity', e.target.value.replace(/[^0-9]/g, ''))}
                                  className="flex-1 w-full pl-2 pr-1 py-1 text-center border-0 focus:ring-0 text-xs bg-transparent outline-none"
                                />
                                <span className="text-[10px] text-neutral-500 font-bold whitespace-nowrap bg-neutral-100 flex items-center px-2 h-full border-l border-neutral-200 select-none min-w-[2.5rem] justify-center">개</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeBonusProductFromOption(opt.id, item.id)}
                                className="text-neutral-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white border border-neutral-200 p-8">
          <h3 className="text-lg font-bold text-neutral-900 mb-6 border-l-4 border-neutral-900 pl-3">상품 설명</h3>
          <RichTextEditor
            value={formData.description}
            onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
            onImageUpload={(file) => productService.uploadProductImage(file)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 py-10">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            disabled={isSubmitting}
            className="px-8 py-3.5 border border-neutral-300 text-neutral-900 font-medium hover:bg-neutral-50 transition-all disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-10 py-3.5 bg-neutral-900 text-white font-bold hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditMode ? '상품 수정하기' : '상품 등록하기'}
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
