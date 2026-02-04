import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus, Edit, Trash2, Eye, X, FolderTree, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryManager } from '../../components/CategoryManager';
import { ProductPreviewModal } from '../../components/ProductPreviewModal';
import { useProducts, useDeleteProduct } from '../../hooks/useProducts';
import { useCategories, useSaveCategories } from '../../hooks/useCategories';
import { Category } from '../../services/categoryService';



interface Product {
  id: string;
  displayNo?: number;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  createdDate: string;
  productCode?: string;
  manufacturer?: string;
  description?: string;
  images?: string[];
  regularDiscount?: number;
  bulkDiscounts?: Array<{ quantity: number; discount: number }>;
}

export function ProductManagementPage() {
  const navigate = useNavigate();
  const { data: productsData = [], isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();

  const { data: dbCategories = [] } = useCategories();
  const saveCategories = useSaveCategories();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [tempCategoryList, setTempCategoryList] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Transform DB products to match UI Product interface
  const products: Product[] = productsData.map(p => ({
    id: p.id,
    displayNo: p.displayNo,
    name: p.name,
    category: p.category,
    subcategory: p.subcategory,
    price: p.price,
    stock: p.stock,
    status: 'active' as const,
    createdDate: new Date().toISOString().split('T')[0], // Placeholder
    productCode: p.sku,
    description: p.description,
  }));

  // Helper to get full category path (e.g., Parent > Child)
  const getFullCategoryPath = (categoryName: string, subcategoryName?: string) => {
    if (subcategoryName) {
      return `${categoryName} > ${subcategoryName}`;
    }

    // Find if the category is actually a subcategory in our DB
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
    return matchesSearch && matchesCategory;
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

  const handleOpenCategoryModal = () => {
    // Calculate product counts for each category
    const categoriesWithCounts = dbCategories.map(cat => ({
      ...cat,
      productCount: products.filter(p =>
        p.category && cat.name &&
        p.category.trim().toLowerCase() === cat.name.trim().toLowerCase()
      ).length
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
            상품관리
          </h2>
          <p className="text-sm text-neutral-600">
            판매 상품을 등록하고 관리합니다
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
          <button
            onClick={() => navigate('/admin/products/register')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>상품 등록</span>
          </button>
        </div>
      </div>

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
                      재고
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
                    <tr key={product.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 font-medium">
                        {product.displayNo || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-neutral-900">
                          {product.name}
                        </div>
                        <div className="text-xs text-neutral-500">
                          등록일: {product.createdDate}
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
                        <span className={`text-sm font-medium ${product.stock === 0 ? 'text-red-600' : 'text-neutral-900'}`}>
                          {product.stock}개
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium ${product.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {product.status === 'active' ? '판매중' : '판매중지'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setPreviewProduct(product);
                              setIsPreviewModalOpen(true);
                            }}
                            className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                            title="미리보기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                            className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                            title="수정"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`'${product.name}' 상품을 삭제하시겠습니까?`)) {
                                try {
                                  await deleteProduct.mutateAsync(product.id);
                                  alert('상품이 삭제되었습니다.');
                                } catch (err) {
                                  console.error('Error deleting product:', err);
                                  alert('상품 삭제 중 오류가 발생했습니다.');
                                }
                              }
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

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 상품</div>
          <div className="text-2xl font-medium text-neutral-900">{products.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">판매중</div>
          <div className="text-2xl font-medium text-green-600">
            {products.filter((p) => p.status === 'active').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">품절</div>
          <div className="text-2xl font-medium text-red-600">
            {products.filter((p) => p.stock === 0).length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 재고</div>
          <div className="text-2xl font-medium text-neutral-900">
            {products.reduce((sum, p) => sum + p.stock, 0)}
          </div>
        </div>
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

      {/* Product Preview Modal */}
      {isPreviewModalOpen && previewProduct && (
        <ProductPreviewModal
          product={previewProduct}
          onClose={() => setIsPreviewModalOpen(false)}
          onEdit={() => {
            setIsPreviewModalOpen(false);
            navigate(`/admin/products/edit/${previewProduct.id}`);
          }}
        />
      )}
    </div>
  );
}