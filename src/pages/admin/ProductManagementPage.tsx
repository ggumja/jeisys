import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Search, Plus, Edit, Trash2, Eye, X, FolderTree, Loader2, ChevronLeft, ChevronRight, Package, Copy } from 'lucide-react';
import { CategoryManager } from '../../components/CategoryManager';
import { useProducts, useDeleteProduct } from '../../hooks/useProducts';
import { useCategories, useSaveCategories } from '../../hooks/useCategories';
import { Category } from '../../services/categoryService';
import { ConfirmModal } from '../../components/ConfirmModal';
import { productService } from '../../services/productService';
import { useQueryClient } from '@tanstack/react-query';



interface Product {
  id: string;
  displayNo?: number;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  isVisible: boolean;
  createdDate: string;
  productCode?: string;
  manufacturer?: string;
  description?: string;
  images?: string[];
  regularDiscount?: number;
  bulkDiscounts?: Array<{ quantity: number; discount: number }>;
  isPackage?: boolean;
  isPromotion?: boolean;
  quantityOptions?: any[];
}

export function ProductManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: productsData = [], isLoading } = useProducts();
  
  const isPackageView = location.pathname.includes('/admin/products/package');
  const isPromotionView = location.pathname.includes('/admin/products/promotion');
  const isSetView = location.pathname.includes('/admin/products/set');
  const isSingleView = location.pathname.includes('/admin/products/single');
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();

  const { data: dbCategories = [] } = useCategories();
  const saveCategories = useSaveCategories();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [copyConfirmInfo, setCopyConfirmInfo] = useState({
    isOpen: false,
    title: '',
    description: '',
    isResult: false
  });

  const [tempCategoryList, setTempCategoryList] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Modal states
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{
    isOpen: boolean;
    productId?: string;
    isBulk: boolean;
    title: string;
    description: string;
  }>({
    isOpen: false,
    isBulk: false,
    title: '',
    description: ''
  });

  // Transform DB products to match UI Product interface
  const products: Product[] = productsData.map(p => ({
    id: p.id,
    displayNo: p.displayNo,
    name: p.name,
    category: p.category,
    subcategory: p.subcategory,
    price: p.price,
    stock: p.stock,
    status: p.isActive !== false ? ('active' as const) : ('inactive' as const),
    isVisible: p.isVisible !== false,
    createdDate: new Date().toISOString().split('T')[0], // Placeholder
    sku: p.sku,
    productCode: p.sku,
    sapSku: p.sap_sku,
    description: p.description,
    isPackage: p.isPackage,
    isPromotion: p.isPromotion,
    quantityOptions: p.options || [],
    selectableCount: p.selectable_count || 1,
    salesUnit: p.sales_unit || 1,
  }));

  // Helper to get full category path (e.g., Parent > Child)
  const getFullCategoryPath = (categoryName: string, subcategoryName?: string) => {
    if (subcategoryName) {
      return `${categoryName} > ${subcategoryName}`;
    }

    // Find if the category is actually a subcategory in our DB (Legacy Handling)
    const category = dbCategories.find(c => c.name === categoryName);
    if (category && category.parentId) {
      const parent = dbCategories.find(c => c.id === category.parentId);
      if (parent) {
        return `${parent.name} > ${category.name}`;
      }
    }

    return categoryName;
  };

  const categories = ['all', ...dbCategories.map(cat => cat.name)];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.productCode && product.productCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    let matchesType = false;
    if (isPackageView) {
      matchesType = !!product.isPackage && !product.isPromotion;
    } else if (isPromotionView) {
      matchesType = !!product.isPromotion;
    } else if (isSetView) {
      matchesType = !product.isPackage && !product.isPromotion && (product.quantityOptions?.length || 0) > 0;
    } else {
      matchesType = !product.isPackage && !product.isPromotion && (product.quantityOptions?.length || 0) === 0;
    }

    return matchesSearch && matchesCategory && matchesType;
  });

  // Pagination Logic
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Stats Logic
  const currentViewProducts = products.filter(p => {
    if (isPackageView) return !!p.isPackage && !p.isPromotion;
    if (isPromotionView) return !!p.isPromotion;
    if (isSetView) return !p.isPackage && !p.isPromotion && (p.quantityOptions?.length || 0) > 0;
    return !p.isPackage && !p.isPromotion && (p.quantityOptions?.length || 0) === 0;
  });
  const totalCount = currentViewProducts.length;
  const activeCount = currentViewProducts.filter(p => p.status === 'active').length;
  const outOfStockCount = currentViewProducts.filter(p => p.stock === 0).length;
  const lowStockCount = currentViewProducts.filter(p => p.stock > 0 && p.stock < 100).length;

  const handleOpenCategoryModal = () => {
    // Calculate product counts for each category
    const categoriesWithCounts = dbCategories.map(cat => ({
      ...cat,
      productCount: products.filter(p => {
        const isParent = !cat.parentId;
        if (isParent) {
          return p.category && cat.name && p.category.trim().toLowerCase() === cat.name.trim().toLowerCase();
        } else {
          return p.subcategory && cat.name && p.subcategory.trim().toLowerCase() === cat.name.trim().toLowerCase();
        }
      }).length
    }));
    setTempCategoryList(JSON.parse(JSON.stringify(categoriesWithCounts)));
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategoryChanges = async () => {
    try {
      await saveCategories.mutateAsync(tempCategoryList);
      setIsCategoryModalOpen(false);
      setNewCategoryName('');
      alert('카테고리 정보가 저장되었습니다.');
    } catch (err) {
      console.error('Error saving categories:', err);
      alert('카테고리 저장 중 오류가 발생했습니다.');
    }
  };

  const handleCancelCategoryChanges = () => {
    setIsCategoryModalOpen(false);
    setTempCategoryList([]);
    setNewCategoryName('');
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const maxOrder = Math.max(...tempCategoryList.map(c => c.order), 0);
      const newCategory: Category = {
        id: Date.now().toString(),
        name: newCategoryName,
        productCount: 0,
        parentId: null,
        order: maxOrder + 1,
      };
      setTempCategoryList([...tempCategoryList, newCategory]);
      setNewCategoryName('');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(currentProducts.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleDeleteBulk = () => {
    if (selectedProductIds.length === 0) return;

    setDeleteConfirmInfo({
      isOpen: true,
      isBulk: true,
      title: '선택 상품 삭제',
      description: `선택한 ${selectedProductIds.length}개의 상품을 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
    });
  };

  const handleCopyBulk = () => {
    if (selectedProductIds.length === 0) return;
    
    setCopyConfirmInfo({
      isOpen: true,
      title: '선택 상품 복사',
      description: `선택한 ${selectedProductIds.length}개의 상품을 복사하시겠습니까?\n상품명과 상품코드를 제외한 모든 정보가 복사됩니다.`,
      isResult: false
    });
  };

  const executeCopyBulk = async () => {
    setCopyConfirmInfo(prev => ({ ...prev, isOpen: false }));
    setIsDeletingBulk(true); // Reusing UI loading state
    
    try {
      for (const id of selectedProductIds) {
        // 1. Get original product details
        const original = await productService.getProductById(id);
        if (!original) continue;

        // 2. Prepare new product data
        const newProductData = {
          sku: `${original.sku}_COPY_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          sap_sku: original.sapSku,
          manufacturer: original.manufacturer,
          name: `${original.name} (복사본)`,
          category: original.category,
          subcategory: original.subcategory,
          price: original.price,
          stock: original.stock,
          description: original.description,
          image_url: original.imageUrl,
          is_active: false,
          is_visible: original.isVisible,
          is_package: original.isPackage,
          selectable_count: original.selectableCount,
          item_input_type: original.itemInputType,
          sales_unit: original.salesUnit,
          base_product_id: original.baseProductId,
          stock_multiplier: original.stockMultiplier,
          credit_available: original.creditAvailable,
          points_available: original.pointsAvailable,
          subscription_discount: original.subscriptionDiscount,
          min_order_quantity: original.minOrderQuantity,
          max_order_quantity: original.maxOrderQuantity,
          quantity_input_type: original.quantityInputType,
        };

        // 3. Create product
        const created = await productService.createProduct(newProductData);
        const newId = created.id;

        // 4. Copy Additional Images
        if (original.additionalImages && original.additionalImages.length > 0) {
          await productService.addProductImages(newId, original.additionalImages);
        }

        // 5. Copy Options (for Sets)
        if (original.options && original.options.length > 0) {
          const optionsData = original.options.map(opt => ({
            name: opt.name,
            quantity: opt.quantity,
            discountRate: opt.discountRate,
            price: opt.price
          }));
          await productService.addOptions(newId, optionsData);
        }

        // 6. Copy Bonus Items
        if (original.bonusItems && original.bonusItems.length > 0) {
          const bonusItemsData = original.bonusItems.map(bi => ({
            bonusProductId: bi.productId,
            quantity: bi.quantity,
            priceOverride: Number(bi.priceOverride) || 0,
            optionId: null,
            calculationMethod: bi.calculationMethod || 'fixed',
            percentage: Number(bi.percentage) || 0
          }));
          await productService.addBonusItems(newId, bonusItemsData);
        }
        
        // 7. Copy Pricing Tiers
        if (original.tierPricing && original.tierPricing.length > 0) {
          const tiers = original.tierPricing.map(t => ({
            min_quantity: t.quantity,
            unit_price: t.unitPrice
          }));
          await productService.addPricingTiers(newId, tiers);
        }
      }

      setSelectedProductIds([]);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      setCopyConfirmInfo({
        isOpen: true,
        title: '복사 완료',
        description: '선택한 상품들이 성공적으로 복사되었습니다.',
        isResult: true
      });
    } catch (err) {
      console.error('Error copying products:', err);
      setCopyConfirmInfo({
        isOpen: true,
        title: '복사 실패',
        description: '상품 복사 도중 오류가 발생했습니다.',
        isResult: true
      });
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const executeDeleteBulk = async () => {
    setIsDeletingBulk(true);
    try {
      await Promise.all(selectedProductIds.map(id => deleteProduct.mutateAsync(id)));
      setSelectedProductIds([]);
      setDeleteConfirmInfo(prev => ({ ...prev, isOpen: false }));
      // alert('선택한 상품들이 삭제되었습니다.'); // Optional: Can use a snackbar instead
    } catch (err) {
      console.error('Error deleting products:', err);
      alert('일부 상품 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
            {isPromotionView ? '프로모션번들관리' : isPackageView ? '복합상품관리' : isSetView ? '셋트상품관리' : '일반상품관리'}
          </h2>
          <p className="text-sm text-neutral-600">
            {isPromotionView 
              ? '상품 유료 구매 시 무료 증정 구성인 프로모션 번들을 등록하고 관리합니다'
              : isPackageView 
                ? '복합(패키지) 상품 구성을 등록하고 관리합니다' 
                : isSetView 
                  ? '수량별 옵션이 포함된 셋트 상품을 등록하고 관리합니다' 
                  : '개별 단품 상품을 등록하고 관리합니다'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCategoryModal}
            className="inline-flex items-center gap-2 px-6 py-3 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
          >
            <FolderTree className="w-5 h-5" />
            <span>카테고리 관리</span>
          </button>
          
          {isSingleView && (
            <button
              onClick={() => navigate('/admin/products/register')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>일반상품 등록</span>
            </button>
          )}

          {isSetView && (
            <button
              onClick={() => navigate('/admin/products/set-register')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-sm"
            >
              <Package className="w-5 h-5" />
              <span>셋트상품 등록</span>
            </button>
          )}

          {isPackageView && (
            <button
              onClick={() => navigate('/admin/products/package-register')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              <Package className="w-5 h-5" />
              <span>복합상품 등록</span>
            </button>
          )}
          
          {isPromotionView && (
            <button
              onClick={() => navigate('/admin/products/promotion-register')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-sm"
            >
              <Package className="w-5 h-5" />
              <span>프로모션번들 등록</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-500">
        <div className="bg-white border border-neutral-200 p-3 shadow-sm flex justify-between items-center">
          <p className="text-sm font-bold text-neutral-600 tracking-tight">전체 상품</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-bold text-neutral-900">{totalCount}</h3>
            <span className="text-xs text-neutral-500">개</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-3 shadow-sm flex justify-between items-center">
          <p className="text-sm font-bold text-neutral-600 tracking-tight">판매중</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-bold text-green-600">{activeCount}</h3>
            <span className="text-xs text-green-500">개</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-3 shadow-sm flex justify-between items-center">
          <p className="text-sm font-bold text-neutral-600 tracking-tight">품절</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-bold text-red-600">{outOfStockCount}</h3>
            <span className="text-xs text-red-500">개</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-3 shadow-sm flex justify-between items-center">
          <p className="text-sm font-bold text-neutral-600 tracking-tight">품절임박</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-bold text-orange-500">{lowStockCount}</h3>
            <span className="text-xs text-orange-400">개</span>
          </div>
        </div>
      </div>

      {selectedProductIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-red-900">
              {selectedProductIds.length}개의 상품이 선택되었습니다
            </span>
          </div>
          <button
            onClick={handleCopyBulk}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 font-medium text-sm"
          >
            <Copy className="w-4 h-4" />
            <span>선택 복제</span>
          </button>
          <button
            onClick={handleDeleteBulk}
            disabled={isDeletingBulk}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 font-medium text-sm"
          >
            {isDeletingBulk ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>선택 삭제</span>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-neutral-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="상품명, SKU, 카테고리 검색"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? '전체 카테고리' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white border border-neutral-200">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider w-10">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.length === currentProducts.length && currentProducts.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider w-16">
                      No.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      상품명
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider w-32">
                      카테고리
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      가격
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {currentProducts.map((product, index) => (
                      <tr 
                        key={product.id} 
                        className={`hover:bg-neutral-50 cursor-pointer ${selectedProductIds.includes(product.id) ? 'bg-neutral-50' : ''}`}
                        onClick={() => navigate(
                          isPackageView ? `/admin/products/package-edit/${product.id}` : 
                          isSetView ? `/admin/products/set-edit/${product.id}` : 
                          isPromotionView ? `/admin/products/promotion-edit/${product.id}` :
                          `/admin/products/edit/${product.id}`
                        )}
                      >
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 font-medium">
                        {totalItems - ((currentPage - 1) * itemsPerPage + index)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900">
                            {product.name}
                          </span>
                          {!product.isVisible && (
                            <span 
                              className="px-1 py-0 text-[10px] bg-orange-50 text-orange-600 border border-orange-200 rounded-sm font-bold whitespace-nowrap inline-flex items-center"
                              style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}
                            >
                              비노출
                            </span>
                          )}
                          {product.baseProductId && (
                            <span 
                              className="px-1 py-0 text-[10px] bg-blue-50 text-blue-600 border border-blue-100 rounded-sm font-bold whitespace-nowrap inline-flex items-center"
                              style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}
                            >
                              재고 연동
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {product.sku}
                        </div>
                      </td>
                      <td className="px-4 py-4 w-32 min-w-[128px]">
                        <div className="flex flex-col gap-0.5">
                          {getFullCategoryPath(product.category, product.subcategory).split(' > ').map((part, i) => (
                            <span
                              key={i}
                              className={`block truncate text-xs leading-tight ${i === 0
                                  ? 'text-neutral-400 font-normal mb-0.5'
                                  : 'text-neutral-900 font-medium'
                                }`}
                              title={part}
                            >
                              {part}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                        {product.price.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex overflow-visible">
                          <span 
                            className={`inline-flex px-1 py-0 text-[10px] font-bold rounded-sm whitespace-nowrap items-center ${product.status === 'active'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                            style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}
                          >
                            {product.status === 'active' ? '판매중' : '판매중지'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/products/${product.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors inline-flex items-center justify-center"
                            title="미리보기"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                isPackageView ? `/admin/products/package-edit/${product.id}` : 
                                isSetView ? `/admin/products/set-edit/${product.id}` : 
                                isPromotionView ? `/admin/products/promotion-edit/${product.id}` :
                                `/admin/products/edit/${product.id}`
                              );
                            }}
                            className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                            title="수정"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmInfo({
                                isOpen: true,
                                productId: product.id,
                                isBulk: false,
                                title: '상품 삭제',
                                description: `'${product.name}' 상품을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
                              });
                            }}
                            disabled={deleteProduct.isPending}
                            className="p-2 border border-neutral-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="삭제"
                          >
                            {deleteProduct.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isLoading && totalItems > 0 && (
              <div className="px-6 py-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-50">
                <div className="text-sm text-neutral-600">
                  전체 {totalItems}개 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}개 표시
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages;
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-neutral-400">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 border text-sm font-medium transition-colors ${currentPage === page
                              ? 'bg-neutral-900 border-neutral-900 text-white'
                              : 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                              }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))
                    }
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="py-16 text-center border-t border-neutral-200">
            <p className="text-neutral-600">조회된 상품이 없습니다</p>
          </div>
        )}
      </div>


      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-medium text-neutral-900">카테고리 관리</h3>
              <button
                onClick={handleCancelCategoryChanges}
                className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-neutral-50 border border-neutral-200 p-4 mb-6">
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  새 카테고리 추가
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="카테고리 이름을 입력하세요"
                    className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors whitespace-nowrap"
                  >
                    추가
                  </button>
                </div>
              </div>

              <CategoryManager
                categories={tempCategoryList}
                onUpdate={setTempCategoryList}
              />
            </div>

            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex items-center justify-end gap-3 z-10">
              <button
                onClick={handleCancelCategoryChanges}
                className="px-6 py-3 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveCategoryChanges}
                className="px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Copy Confirmation Modal */}
      <ConfirmModal
        isOpen={copyConfirmInfo.isOpen}
        onClose={() => setCopyConfirmInfo(prev => ({ ...prev, isOpen: false }))}
        onConfirm={copyConfirmInfo.isResult ? () => setCopyConfirmInfo(prev => ({ ...prev, isOpen: false })) : executeCopyBulk}
        title={copyConfirmInfo.title}
        description={copyConfirmInfo.description}
        confirmText={copyConfirmInfo.isResult ? "확인" : "복사하기"}
        showCancel={!copyConfirmInfo.isResult}
        isLoading={isDeletingBulk}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmInfo.isOpen}
        onClose={() => setDeleteConfirmInfo(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirmInfo.isBulk ? executeDeleteBulk : async () => {
          if (deleteConfirmInfo.productId) {
            try {
              await deleteProduct.mutateAsync(deleteConfirmInfo.productId);
              setDeleteConfirmInfo(prev => ({ ...prev, isOpen: false }));
            } catch (err) {
              console.error('Error deleting product:', err);
              alert('삭제 중 오류가 발생했습니다.');
            }
          }
        }}
        title={deleteConfirmInfo.title}
        description={deleteConfirmInfo.description}
        confirmText="삭제하기"
        isLoading={deleteProduct.isPending || isDeletingBulk}
        type="danger"
      />
    </div>
  );
}