import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  Save, 
  Plus, 
  Search, 
  Package, 
  X,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Info,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { productService } from '../../services/productService';
import { Product } from '../../types/product';
import { useCategories } from '../../hooks/useCategories';
import { formatWithCommas, unformatNumber } from '../../lib/utils';
import { ADMIN_STYLES } from '../../constants/adminStyles';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Upload, ImageIcon } from 'lucide-react';

interface PromotionItemData {
  id: string; // client-side ID
  productId: string;
  name: string;
  sku: string;
  price: number;
}

interface PromotionFormData {
  name: string;
  sku: string;
  category: string;
  buyQuantity: number;
  getQuantity: number;
  items: PromotionItemData[];
  imageUrl: string;
  stock: number;
}

export function PromotionRegisterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  
  const { data: categories = [] } = useCategories();

  const [isLoading, setIsLoading] = useState(isEdit);
  const [formData, setFormData] = useState<PromotionFormData>({
    name: '',
    sku: '',
    category: '',
    buyQuantity: 3,
    getQuantity: 1,
    items: [],
    imageUrl: '',
    stock: 0
  });

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);

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

  useEffect(() => {
    if (isEdit && id) {
      loadPromotionData(id);
    }
    loadProducts();
  }, [isEdit, id]);

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const data = await productService.getProducts();
      // Only include simple products
      setProductsList(data.filter(p => !p.isPackage && !p.isPromotion && (!p.options || p.options.length === 0)));
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadPromotionData = async (promotionId: string) => {
    try {
      const product = await productService.getProductById(promotionId);
      if (product) {
        // Fetch promotion items
        const promotionItems = await productService.getPromotionItems(promotionId);
        setFormData({
          name: product.name,
          sku: product.sku,
          category: product.category || '의료기기',
          buyQuantity: product.buyQuantity || 3,
          getQuantity: product.getQuantity || 1,
          items: promotionItems.map(item => ({
            id: crypto.randomUUID(),
            productId: item.id,
            name: item.name,
            sku: item.sku,
            price: item.price
          })),
          imageUrl: product.imageUrl || '',
          stock: product.stock || 0
        });
        if (product.imageUrl) {
          setThumbnailPreview(product.imageUrl);
        }
        
        if (product.additionalImages) {
          setAdditionalImages(product.additionalImages);
        }
      }
    } catch (error) {
      console.error('Failed to load promotion data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setProductSearch(term);
    const trimmedTerm = term.trim().toLowerCase();
    
    if (trimmedTerm.length < 1) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setShowSearchDropdown(true);
    const filtered = productsList.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(trimmedTerm) || 
                            p.sku.toLowerCase().includes(trimmedTerm);
      const notInList = !formData.items.some(item => item.productId === p.id);
      return matchesSearch && notInList;
    }).slice(0, 20);
    
    setSearchResults(filtered);
  };

  const addItem = (product: Product) => {
    if (formData.items.find(item => item.productId === product.id)) {
      return;
    }

    const newItem: PromotionItemData = {
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setProductSearch('');
    setShowSearchDropdown(false);
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
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
        alert('추가 이미지는 최대 5개까지만 등록 가능합니다.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sku) {
      alert('기본 정보를 모두 입력해주세요.');
      return;
    }

    if (formData.items.length === 0) {
      alert('프로모션 대상 상품을 최소 1개 이상 추가해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload thumbnail image if changed
      let finalImageUrl: string | null = formData.imageUrl || null;
      if (thumbnailFile) {
        finalImageUrl = await productService.uploadProductImage(thumbnailFile);
      }

      // Determine final category and subcategory based on hierarchy
      const selectedCat = categories.find(c => c.name === formData.category);
      let finalCategory = formData.category;
      let finalSubcategory = '';

      if (selectedCat && selectedCat.parentId) {
        const parentCat = categories.find(c => c.id === selectedCat.parentId);
        if (parentCat) {
          finalCategory = parentCat.name;
          finalSubcategory = selectedCat.name;
        }
      }

      const promotionData = {
        name: formData.name,
        sku: formData.sku,
        category: finalCategory,
        subcategory: finalSubcategory,
        is_promotion: true,
        buy_quantity: formData.buyQuantity,
        get_quantity: formData.getQuantity,
        price: 0, 
        image_url: finalImageUrl,
        is_active: true,
        is_visible: true,
        stock: formData.stock,
        promotion_item_ids: formData.items.map(item => item.productId)
      };

      let productId: string;

      if (isEdit && id) {
        await productService.updatePromotionProduct(id, promotionData);
        productId = id;
      } else {
        const newProduct = await productService.createPromotionProduct(promotionData);
        productId = newProduct.id;
      }

      // 2. Upload and save additional images
      const existingUrls = additionalImages.filter(img => img.startsWith('http'));
      const newUploadedUrls = await Promise.all(
        additionalFiles.map(file => productService.uploadProductImage(file))
      );
      const allUrls = [...existingUrls, ...newUploadedUrls];

      if (isEdit) {
        await productService.deleteProductImages(productId);
      }
      if (allUrls.length > 0) {
        await productService.addProductImages(productId, allUrls);
      }

      setResultModal({
        isOpen: true,
        title: isEdit ? '수정 완료' : '등록 완료',
        description: `프로모션 상품이 성공적으로 ${isEdit ? '수정' : '등록'}되었습니다.`,
        type: 'success'
      });

      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error('Failed to save promotion', error);
      setResultModal({
        isOpen: true,
        title: '저장 실패',
        description: '서버 오류가 발생했습니다. 다시 시도해주세요.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render categories in a hierarchical select
  const renderCategoryOptions = (parentId: string | null = null, level: number = 0): JSX.Element[] => {
    return categories
      .filter(cat => cat.parentId === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .flatMap(cat => [
        <option key={cat.id} value={cat.name}>
          {'\u00A0'.repeat(level * 4)}{level > 0 ? '└ ' : ''}{cat.name}
        </option>,
        ...renderCategoryOptions(cat.id, level + 1)
      ]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  return (
    <div className={ADMIN_STYLES.PAGE_CONTAINER}>
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/products/promotion')}
          className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
            {isEdit ? '프로모션 번들 상품 수정' : '프로모션 번들 상품 등록'}
          </h2>
          <p className="text-sm text-neutral-600">
            {isEdit ? '기존 프로모션 번들 구성을 수정합니다' : '"N+1" 같은 프로모션 번들 상품을 등록합니다'}
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
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-all z-10 shadow-md ring-2 ring-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="text-center group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto mb-1 group-hover:text-neutral-900" />
                  <p className="text-[10px] text-neutral-400 font-bold group-hover:text-neutral-900 leading-tight">프로모션 대표<br />이미지 업로드</p>
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
                <div className="absolute top-0 left-0 bg-neutral-400/80 text-white text-[9px] px-1.5 py-0.5 font-bold tracking-tighter shadow-sm">Gallery {index + 1}</div>
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
        {/* Basic Info Section */}
        <div className={ADMIN_STYLES.CARD}>
          <h3 className={ADMIN_STYLES.SECTION_TITLE}>기본 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="md:col-span-2">
              <label className={ADMIN_STYLES.SECTION_LABEL}>프로모션 번들 명칭 <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="예) 필러 3+1 프로모션"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={ADMIN_STYLES.INPUT + " text-base font-bold"}
              />
            </div>
            
            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>상품 코드 (SKU) <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="PROM-3PLUS1-001"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                className={ADMIN_STYLES.INPUT + " font-bold bg-neutral-50 disabled:opacity-50"}
                readOnly={isEdit}
              />
            </div>

            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>카테고리</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={ADMIN_STYLES.INPUT + " font-bold bg-white"}
              >
                <option value="">카테고리 선택</option>
                {renderCategoryOptions()}
              </select>
            </div>

            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>재고 수량 (Stock)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0"
                  value={formatWithCommas(formData.stock)}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: unformatNumber(e.target.value) }))}
                  className={ADMIN_STYLES.INPUT + " text-right pr-16 font-bold tabular-nums bg-white"}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 font-bold uppercase">개</span>
              </div>
            </div>
          </div>
        </div>

        <div className={ADMIN_STYLES.CARD}>
          <h3 className={ADMIN_STYLES.SECTION_TITLE}>프로모션 규칙 설정</h3>
          <div className="flex flex-col items-center px-10 pb-4">
            <div className="w-full max-w-2xl flex items-center justify-between py-12 px-16 bg-neutral-50/50 border border-neutral-200">
              <div className="flex-1 text-center">
                <label className="block text-[10px] font-black text-neutral-400 mb-6 uppercase tracking-[0.2em]">구매 수량 (Paid)</label>
                <div className="flex items-center justify-center gap-6">
                  <button 
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, buyQuantity: Math.max(1, p.buyQuantity - 1) }))}
                    className="w-12 h-12 border border-neutral-300 flex items-center justify-center bg-white hover:bg-neutral-50 active:scale-95 transition-all text-xl font-bold rounded-sm shadow-sm"
                  >
                   -
                  </button>
                  <span className="text-5xl font-black text-neutral-900 w-20 tabular-nums">{formData.buyQuantity}</span>
                  <button 
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, buyQuantity: p.buyQuantity + 1 }))}
                    className="w-12 h-12 border border-neutral-300 flex items-center justify-center bg-white hover:bg-neutral-50 active:scale-95 transition-all text-xl font-bold rounded-sm shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="px-6 text-4xl font-black text-neutral-300 transform translate-y-2">+</div>

              <div className="flex-1 text-center">
                <label className="block text-[10px] font-black text-blue-500 mb-6 uppercase tracking-[0.2em]">증정 수량 (Free)</label>
                <div className="flex items-center justify-center gap-6">
                  <button 
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, getQuantity: Math.max(1, p.getQuantity - 1) }))}
                    className="w-12 h-12 border border-blue-200 bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-white active:scale-95 transition-all text-xl font-bold rounded-sm shadow-sm"
                  >
                    -
                  </button>
                  <span className="text-5xl font-black text-blue-600 w-20 tabular-nums">{formData.getQuantity}</span>
                  <button 
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, getQuantity: p.getQuantity + 1 }))}
                    className="w-12 h-12 border border-blue-200 bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-white active:scale-95 transition-all text-xl font-bold rounded-sm shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-10 text-[11px] text-neutral-500 flex items-center gap-2 font-medium bg-neutral-50 px-4 py-2 border border-neutral-100 italic">
              <Info className="w-4 h-4 text-neutral-400" />
              <span>사용자가 <strong className="text-neutral-900">{formData.buyQuantity}개</strong>를 선택하면, 추가로 <strong className="text-blue-600">{formData.getQuantity}개</strong>를 무료로 증정합니다.</span>
            </p>
          </div>
        </div>

        {/* Promotion Items Pool Section (Matched with ProductRegisterPage Bonus Section CSS) */}
        <div className={ADMIN_STYLES.CARD}>
          <div className={ADMIN_STYLES.SECTION_TITLE}>
            <h3 className="text-lg font-bold">프로모션 대상 상품 풀 (POOL)</h3>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3 relative">
              <label className={ADMIN_STYLES.SECTION_LABEL}>상품 검색 및 추가</label>
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-neutral-400 absolute left-3" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => {
                    if (productSearch.trim()) setShowSearchDropdown(true);
                  }}
                  placeholder="프로모션 대상에 포함할 상품을 검색하여 추가해 주세요"
                  className={ADMIN_STYLES.INPUT + " pl-10 h-12"}
                />
              </div>

              {showSearchDropdown && productSearch.trim() && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-neutral-200 shadow-2xl max-h-[400px] overflow-y-auto rounded-sm">
                  {isLoadingProducts ? (
                    <div className="px-4 py-8 text-center text-neutral-500">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      <p className="text-sm">상품 정보를 불러오고 있습니다...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          addItem(product);
                          setProductSearch('');
                          setShowSearchDropdown(false);
                        }}
                        className="w-full px-4 py-2 flex items-center justify-between hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0 text-left group"
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900 truncate">{product.name}</span>
                          <span className="text-[10px] text-neutral-400 font-medium flex-shrink-0">({product.sku})</span>
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
                    <th className={ADMIN_STYLES.TABLE_HEADER + " w-32 text-right"}>기준 단가</th>
                    <th className={ADMIN_STYLES.TABLE_HEADER + " w-20 text-center"}>관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {formData.items.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center text-neutral-500 font-medium italic">
                        추가된 대상 상품이 없습니다. 위에서 검색하여 추가해 주세요.
                      </td>
                    </tr>
                  ) : (
                    formData.items.map((item) => (
                      <tr key={item.productId} className={ADMIN_STYLES.TABLE_ROW_HOVER}>
                        <td className={ADMIN_STYLES.TABLE_CELL}>
                          <div className="flex flex-col">
                            <span className="font-bold text-neutral-900">{item.name}</span>
                            <span className="text-[10px] text-neutral-400 font-medium mt-0.5">{item.sku}</span>
                          </div>
                        </td>
                        <td className={ADMIN_STYLES.TABLE_CELL + " text-right"}>
                          <span className="text-neutral-900 font-bold tabular-nums">₩{item.price.toLocaleString()}</span>
                        </td>
                        <td className={ADMIN_STYLES.TABLE_CELL + " text-center"}>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className={ADMIN_STYLES.BTN_GHOST}
                          >
                            <Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-500 transition-colors" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Buttons - Sticky Layer at the bottom */}
        <div className="sticky bottom-0 z-50 bg-white/90 backdrop-blur-md border-t border-neutral-200 py-8 px-8 -mx-8 mt-12 flex items-center justify-end gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={() => navigate('/admin/products/promotion')}
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
            <span>{isEdit ? '프로모션 번들 수정하기' : '프로모션 번들 등록하기'}</span>
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
                    navigate('/admin/products/promotion');
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
