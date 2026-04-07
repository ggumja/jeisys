import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Upload, ImageIcon, X, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { RichTextEditor } from '../../components/RichTextEditor';
import { useProduct, useProducts, useCreateProduct, useUpdateProduct, useAddPricingTiers } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { productService, ProductInput } from '../../services/productService';
import { Product } from '../../types';

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

interface FormData {
  name: string;
  category: string;
  productCode: string;
  manufacturer: string;
  price: string;
  stock: string;
  status: 'active' | 'inactive';
  itemInputType: 'select' | 'input';
  selectableCount: string;
  creditAvailable: boolean;
  description: string;
  useSubscriptionDiscount: boolean;
  subscriptionDiscount: string;
  minOrderQuantity: string;
  maxOrderQuantity: string;
  bulkDiscounts: BulkDiscount[];
  bonusProducts: BonusProductData[];
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
    manufacturer: '',
    price: '',
    stock: '',
    status: 'active',
    itemInputType: 'input',
    selectableCount: '1',
    creditAvailable: true,
    description: '',
    useSubscriptionDiscount: false,
    subscriptionDiscount: '',
    minOrderQuantity: '1',
    maxOrderQuantity: '0',
    bulkDiscounts: [],
    bonusProducts: [],
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Load existing product data in edit mode
  useEffect(() => {
    if (isEditMode && existingProduct) {
      setFormData({
        name: existingProduct.name || '',
        category: existingProduct.category || '',
        productCode: existingProduct.sku || '',
        manufacturer: '', // Not in Product type, will need to add if needed
        price: (existingProduct.price || 0).toString(),
        stock: (existingProduct.stock || 0).toString(),
        status: existingProduct.isActive !== false ? 'active' : 'inactive',
        itemInputType: existingProduct.itemInputType || 'input',
        selectableCount: (existingProduct.selectableCount || 1).toString(),
        creditAvailable: existingProduct.creditAvailable ?? true,
        description: existingProduct.description || '',
        useSubscriptionDiscount: (existingProduct.subscriptionDiscount ?? 0) > 0,
        subscriptionDiscount: existingProduct.subscriptionDiscount?.toString() || '',
        minOrderQuantity: (existingProduct.minOrderQuantity || 1).toString(),
        maxOrderQuantity: (existingProduct.maxOrderQuantity || 0).toString(),
        bulkDiscounts: existingProduct.tierPricing?.map((tier, index) => ({
          id: index.toString(),
          quantity: tier.quantity.toString(),
          discountRate: ((1 - tier.unitPrice / existingProduct.price) * 100).toFixed(0),
        })) || [],
        bonusProducts: existingProduct.bonusItems?.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.product?.name || '',
          sku: item.product?.sku || '',
          price: (item.priceOverride || item.product?.price || 0).toString(),
          quantity: item.quantity.toString(),
          imageUrl: item.product?.imageUrl || '',
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
      p.id !== id && // Exclude current product
      (
        (p.name || '').toLowerCase().includes(searchLower) || 
        (p.sku || '').toLowerCase().includes(searchLower)
      ) &&
      !formData.bonusProducts.some(bp => bp.productId === p.id) // Exclude already added
    );
  }).slice(0, 10);

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
    setFormData(prev => ({
      ...prev,
      bonusProducts: prev.bonusProducts.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      ),
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    // Validation
    if (!formData.name || !formData.category || !formData.price) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    const minQty = parseInt(formData.minOrderQuantity) || 1;
    const maxQty = parseInt(formData.maxOrderQuantity) || 0;

    if (maxQty > 0 && maxQty < minQty) {
      alert('최대 주문 수량은 최소 주문 수량보다 크거나 같아야 합니다.');
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
        name: formData.name,
        category: finalCategory,
        subcategory: finalSubcategory,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        description: formData.description,
        image_url: finalImageUrl,
        is_active: formData.status === 'active',
        item_input_type: formData.itemInputType,
        selectable_count: parseInt(formData.selectableCount) || 1,
        credit_available: formData.creditAvailable,
        subscription_discount: formData.useSubscriptionDiscount ? parseFloat(formData.subscriptionDiscount) || 0 : 0,
        min_order_quantity: minQty,
        max_order_quantity: maxQty > 0 ? maxQty : undefined,
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
      if (formData.bulkDiscounts.length > 0) {
        const tiers = formData.bulkDiscounts
          .filter(d => d.quantity && d.discountRate)
          .map(d => {
            const basePrice = parseFloat(formData.price);
            const discountRate = parseFloat(d.discountRate) / 100;
            const discountedPrice = basePrice * (1 - discountRate);

            return {
              min_quantity: parseInt(d.quantity),
              unit_price: discountedPrice,
            };
          });

        if (tiers.length > 0) {
          await addPricingTiers.mutateAsync({ productId, tiers });
        }
      }

      // 4. Update Bonus Items
      const bonusItems = formData.bonusProducts.map(bp => ({
        bonusProductId: bp.productId,
        quantity: parseInt(bp.quantity) || 1,
        priceOverride: parseFloat(bp.price) || 0,
      }));
      await productService.addBonusItems(productId, bonusItems);

      alert(isEditMode ? '상품이 수정되었습니다.' : '상품이 등록되었습니다.');
      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('상품 저장 중 오류가 발생했습니다.');
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
        <div className="bg-white border border-neutral-200 p-6">
          <h3 className="text-sm font-medium text-neutral-900 mb-4">대표 이미지</h3>
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
        <div className="bg-white border border-neutral-200 p-6">
          <h3 className="text-sm font-medium text-neutral-900 mb-4">추가 이미지</h3>
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
        <div className="bg-white border border-neutral-200 p-6">
          <h3 className="text-sm font-medium text-neutral-900 mb-4">기본 정보</h3>
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
                재고 수량
              </label>
              <input
                type="text"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="재고 수량을 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

             <div>
              <label className="block text-sm font-medium text-neutral-900 mb-3">
                판매 상태
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
              >
                <option value="active">판매중</option>
                <option value="inactive">판매중지</option>
              </select>
            </div>
          </div>
        </div>

        {/* Order Options */}
        <div className="bg-white border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">주문 옵션</h3>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">상품갯수 입력방법</label>
                <select
                  name="itemInputType"
                  value={formData.itemInputType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white transition-all text-sm"
                >
                  <option value="input">상품갯수 직접입력</option>
                  <option value="select">리스트 선택방식</option>
                </select>
                <p className="text-xs text-neutral-400">사용자가 상품 상세보기에서 상품을 선택하는 방식을 결정합니다</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">크레딧 사용 가능여부</label>
                <select
                  name="creditAvailable"
                  value={formData.creditAvailable.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, creditAvailable: e.target.value === 'true' }))}
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white transition-all text-sm"
                >
                  <option value="true">사용가능</option>
                  <option value="false">사용불가능</option>
                </select>
                <p className="text-xs text-neutral-400">해당 상품 구매 시 크레딧 사용 가능 여부를 설정합니다</p>
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
        <div className="bg-white border border-neutral-200 p-6">
          <h3 className="text-sm font-medium text-neutral-900 mb-6">할인 설정</h3>

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
        <div className="bg-white border border-neutral-200 p-6">
          <h3 className="text-sm font-medium text-neutral-900 mb-4">추가 증정 상품</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              상품 검색 및 추가
            </label>
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsSearchDropdownOpen(true);
                  }}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  placeholder="추가 증정상품에 포함할 상품을 검색하여 추가해 주세요"
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              </div>

              {isSearchDropdownOpen && searchTerm.trim() && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 shadow-xl max-h-60 overflow-y-auto rounded-sm">
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
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0 text-left group"
                      >
                        <div className="w-10 h-10 border border-neutral-200 flex-shrink-0 group-hover:border-neutral-400 transition-colors">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">{product.name}</p>
                          <p className="text-xs text-neutral-500 truncate">{product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-neutral-900">{product.price.toLocaleString()}원</p>
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
                            <span className="text-neutral-500">원</span>
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
                            <span className="text-neutral-500">개</span>
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

        {/* Description */}
        <div className="bg-white border border-neutral-200 p-6">
          <h3 className="text-sm font-medium text-neutral-900 mb-4">상품 설명</h3>
          <RichTextEditor
            value={formData.description}
            onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
            onImageUpload={(file) => productService.uploadProductImage(file)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            disabled={isSubmitting}
            className="px-6 py-3 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditMode ? '수정 완료' : '등록 완료'}
          </button>
        </div>
      </form>
    </div>
  );
}