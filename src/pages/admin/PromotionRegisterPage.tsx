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
      setProductsList(data.filter(p => !p.isPackage && !p.isPromotion));
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
    <div className="max-w-[1600px] mx-auto px-8 py-8 space-y-6 pb-32">
      {/* Standard Header Format Matched with ProductRegisterPage */}
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
        <div className="bg-white border border-neutral-200 p-8">
          <div className="flex items-center justify-between mb-6 border-l-4 border-neutral-900 pl-3">
            <h3 className="text-lg font-bold text-neutral-900">상품 이미지 설정</h3>
            <span className="text-xs text-neutral-500 font-medium">대표 이미지 1장 + 추가 이미지 최대 5장</span>
          </div>
          
          <div className="flex flex-row flex-wrap gap-4 items-start">
            {/* Primary Image Slot */}
            <div 
              className="w-40 h-40 border-2 border-dashed border-neutral-300 flex items-center justify-center bg-neutral-50 relative overflow-hidden cursor-pointer hover:bg-neutral-100 transition-all group shadow-sm"
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
        <div className="bg-white border border-neutral-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-l-4 border-neutral-900 pl-3">
            <h3 className="text-lg font-bold text-neutral-900">기본 정보</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">프로모션 번들 명칭 <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="예) 필러 3+1 프로모션"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:border-neutral-900 text-base font-bold"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">상품 코드 (SKU) <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="PROM-3PLUS1-001"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:border-neutral-900 text-sm font-bold bg-neutral-50"
                readOnly={isEdit}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">카테고리</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:border-neutral-900 text-sm font-bold bg-white"
              >
                <option value="">카테고리 선택</option>
                {renderCategoryOptions()}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">재고 수량 (Stock)</label>
              <input
                type="text"
                placeholder="0"
                value={formatWithCommas(formData.stock)}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: unformatNumber(e.target.value) }))}
                className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:border-neutral-900 text-sm font-bold text-right tabular-nums bg-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-8">
          <h3 className="text-lg font-bold text-neutral-900 mb-10 border-l-4 border-neutral-900 pl-3">프로모션 규칙 설정</h3>
          <div className="flex flex-col items-center px-10 pb-4">
            <div className="w-full max-w-2xl flex items-center justify-between py-12 px-16 bg-neutral-50 border border-neutral-200 shadow-sm">
              <div className="flex-1 text-center">
                <label className="block text-xs font-bold text-neutral-400 mb-5 uppercase tracking-wider">구매 수량 (Paid)</label>
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
                <label className="block text-xs font-bold text-blue-400 mb-5 uppercase tracking-wider">증정 수량 (Free)</label>
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
            <p className="mt-10 text-sm text-neutral-500 flex items-center gap-2">
              <Info className="w-4 h-4 text-neutral-400" />
              <span>사용자가 <strong>{formData.buyQuantity}개</strong>를 선택하면, 추가로 <strong>{formData.getQuantity}개</strong>를 무료로 증정합니다.</span>
            </p>
          </div>
        </div>

          {/* Promotion Items Pool Section (Matched with ProductRegisterPage Bonus Section CSS) */}
          <div className="bg-white border border-neutral-200 p-8">
            <h3 className="text-lg font-bold text-neutral-900 mb-6 border-l-4 border-neutral-900 pl-3">프로모션 대상 상품 풀 (POOL)</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                상품 검색 및 추가
              </label>
              <div className="relative group">
                <div className="flex items-center w-full border border-neutral-300 bg-white focus-within:ring-2 focus-within:ring-neutral-900 focus-within:border-neutral-900 shadow-sm transition-all overflow-hidden group">
                  <div className="pl-4 flex-shrink-0">
                    <Search className="w-5 h-5 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => {
                      if (productSearch.trim()) setShowSearchDropdown(true);
                    }}
                    placeholder="프로모션 대상에 포함할 상품을 검색하여 추가해 주세요"
                    className="w-full px-4 py-3 border-0 focus:ring-0 text-neutral-900 placeholder:text-neutral-400 bg-transparent outline-none"
                  />
                </div>

                {showSearchDropdown && productSearch.trim() && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 shadow-2xl max-h-[500px] overflow-y-auto rounded-sm">
                    {isLoadingProducts ? (
                      <div className="px-4 py-8 text-center text-neutral-500">
                        <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent animate-spin mx-auto mb-2"></div>
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
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0 text-left group"
                        >
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-900 truncate">{product.name}</span>
                            <span className="text-xs text-neutral-400 flex-shrink-0 font-normal">({product.sku})</span>
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
                      <th className="px-4 py-3 font-medium text-neutral-700 w-32">기준 단가</th>
                      <th className="px-4 py-3 font-medium text-neutral-700 w-20 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {formData.items.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-12 text-center text-neutral-500 italic">
                          추가된 대상 상품이 없습니다. 위에서 검색하여 추가해 주세요.
                        </td>
                      </tr>
                    ) : (
                      formData.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-neutral-900">{item.name}</span>
                              <span className="text-xs text-neutral-500 mt-0.5">{item.sku}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-neutral-900 font-medium">₩{item.price.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-neutral-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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
              className="inline-flex items-center gap-2 py-3 px-6 border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 font-medium text-xl tracking-tight transition-all active:scale-95 disabled:opacity-50"
            >
              <ArrowLeft className="w-6 h-6 stroke-[1.5]" />
              <span>취소</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 py-3 px-6 bg-neutral-900 text-white hover:bg-black font-medium text-xl tracking-tight transition-all active:scale-95 shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Package className="w-6 h-6 stroke-[1.5]" />
              )}
              <span>{isEdit ? '프로모션 번들 수정하기' : '프로모션 번들 등록하기'}</span>
            </button>
          </div>
        </form>

        {/* Result Modal */}
      {resultModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              {resultModal.type === 'success' ? (
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              )}
              <h3 className="text-xl font-black text-neutral-900 mb-3">{resultModal.title}</h3>
              <p className="text-sm text-neutral-500 font-medium mb-8 leading-relaxed">
                {resultModal.description}
              </p>
              <button
                onClick={() => {
                  setResultModal(prev => ({ ...prev, isOpen: false }));
                  if (resultModal.type === 'success') {
                    navigate('/admin/products/promotion');
                  }
                }}
                className={`w-full py-4 text-sm font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                  resultModal.type === 'success' ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
