import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus, Edit, Trash2, Eye, X, FolderTree } from 'lucide-react';
import { CategoryManager } from '../../components/CategoryManager';
import { ProductPreviewModal } from '../../components/ProductPreviewModal';

interface Category {
  id: string;
  name: string;
  productCount: number;
  parentId: string | null;
  order: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
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

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'POTENZA 니들 팁 16핀',
    category: 'POTENZA',
    price: 85000,
    stock: 45,
    status: 'active',
    createdDate: '2026-01-15',
    productCode: 'POT-TIP-16',
    manufacturer: '제이시스메디칼',
    description: 'POTENZA 전용 니들 팁입니다. 16핀으로 구성되어 있으며, 정밀한 시술이 가능합니다.',
    regularDiscount: 5,
    bulkDiscounts: [
      { quantity: 10, discount: 10 },
      { quantity: 20, discount: 15 },
    ],
  },
  {
    id: '2',
    name: 'ULTRAcel II 카트리지 3.0mm',
    category: 'ULTRAcel II',
    price: 120000,
    stock: 28,
    status: 'active',
    createdDate: '2026-01-10',
    productCode: 'ULT-CAR-30',
    manufacturer: '제이시스메디칼',
    description: 'ULTRAcel II 전용 3.0mm 카트리지입니다. 리프팅 시술에 최적화되어 있습니다.',
    regularDiscount: 3,
    bulkDiscounts: [
      { quantity: 5, discount: 8 },
      { quantity: 10, discount: 12 },
    ],
  },
  {
    id: '3',
    name: 'LinearZ 앰플 세트',
    category: 'LinearZ',
    price: 65000,
    stock: 0,
    status: 'inactive',
    createdDate: '2025-12-20',
    productCode: 'LIN-AMP-SET',
    manufacturer: '제이시스메디칼',
    description: 'LinearZ 전용 앰플 세트입니다. 5개입으로 구성되어 있습니다.',
  },
  {
    id: '4',
    name: 'Density HIGH 스킨부스터',
    category: 'Density',
    price: 95000,
    stock: 62,
    status: 'active',
    createdDate: '2026-01-05',
    productCode: 'DEN-HIGH-01',
    manufacturer: '제이시스메디칼',
    description: 'Density HIGH 농도의 스킨부스터입니다. 피부 보습과 탄력 개선에 효과적입니다.',
    regularDiscount: 7,
    bulkDiscounts: [
      { quantity: 10, discount: 12 },
      { quantity: 30, discount: 18 },
    ],
  },
];

export function ProductManagementPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [categoryList, setCategoryList] = useState<Category[]>([
    { id: '1', name: 'Density', productCount: 1, parentId: null, order: 1 },
    { id: '2', name: 'DLiv', productCount: 0, parentId: null, order: 2 },
    { id: '3', name: 'POTENZA', productCount: 1, parentId: null, order: 3 },
    { id: '4', name: 'INTRAcel', productCount: 0, parentId: null, order: 4 },
    { id: '5', name: 'LinearZ', productCount: 1, parentId: null, order: 5 },
    { id: '6', name: 'LinearFirm', productCount: 0, parentId: null, order: 6 },
    { id: '7', name: 'ULTRAcel II', productCount: 1, parentId: null, order: 7 },
    { id: '8', name: 'LIPOcel II', productCount: 0, parentId: null, order: 8 },
    { id: '9', name: 'IntraGen', productCount: 0, parentId: null, order: 9 },
    { id: '10', name: '기타소모품', productCount: 0, parentId: null, order: 10 },
  ]);
  const [tempCategoryList, setTempCategoryList] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const categories = ['all', ...categoryList.map(cat => cat.name)];

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenCategoryModal = () => {
    setTempCategoryList(JSON.parse(JSON.stringify(categoryList)));
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategoryChanges = () => {
    setCategoryList(tempCategoryList);
    setIsCategoryModalOpen(false);
    setNewCategoryName('');
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  상품명
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
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
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900">
                      {product.name}
                    </div>
                    <div className="text-xs text-neutral-500">
                      등록일: {product.createdDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium">
                      {product.category}
                    </span>
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
                    <span className={`inline-flex px-3 py-1 text-xs font-medium ${
                      product.status === 'active'
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
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                        className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-neutral-600">조회된 상품이 없습니다</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 상품</div>
          <div className="text-2xl font-medium text-neutral-900">{mockProducts.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">판매중</div>
          <div className="text-2xl font-medium text-green-600">
            {mockProducts.filter((p) => p.status === 'active').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">품절</div>
          <div className="text-2xl font-medium text-red-600">
            {mockProducts.filter((p) => p.stock === 0).length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 재고</div>
          <div className="text-2xl font-medium text-neutral-900">
            {mockProducts.reduce((sum, p) => sum + p.stock, 0)}
          </div>
        </div>
      </div>

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-medium text-neutral-900">카테고리 관리</h3>
              <button
                onClick={handleCancelCategoryChanges}
                className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Add Category Form */}
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
                <p className="text-xs text-neutral-500 mt-2">
                  각 카테고리에서 <Plus className="inline w-3 h-3" /> 버튼을 클릭하여 하위 카테고리를 추가할 수 있습니다.
                  <br />
                  카테고리를 드래그하여 순서를 변경할 수 있습니다.
                </p>
              </div>

              {/* Category List */}
              <CategoryManager
                categories={tempCategoryList}
                onUpdate={setTempCategoryList}
              />
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex items-center justify-end gap-3">
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