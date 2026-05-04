import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Search, Filter, ScanLine, ChevronDown, Menu, ChevronRight, Package, Loader2, Home } from 'lucide-react';
import { mockEquipment } from '../lib/mockData';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { Product } from '../types';
import { ProductImage } from '../components/ui/ProductImage';

export function ProductListPage() {
  const [searchParams] = useSearchParams();
  const { data: products = [], isLoading: loading } = useProducts();
  const { data: dbCategories = [] } = useCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // 최상위 카테고리 객체만 추출 (parentId가 없거나 빈 값인 항목)
  const rootCategories = dbCategories
    .filter(cat => !cat.parentId || cat.parentId === '');

  // 선택된 카테고리의 중분류 추출 (DB 마스터 데이터 기준)
  const getSubcategories = (category: string) => {
    const parentCat = dbCategories.find(c => c.name.trim() === category.trim());
    
    // DB 마스터에서 하위 항목 추출
    let subcategories: string[] = [];
    if (parentCat) {
      subcategories = dbCategories
        .filter(c => c.parentId === parentCat.id)
        .map(c => c.name.trim());
    }
    
    return Array.from(new Set(subcategories));
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    let matchesSubcategory = selectedSubcategory === 'all' || product.subcategory === selectedSubcategory;

    const matchesEquipment =
      selectedEquipment === 'all' ||
      product.compatibleEquipment.includes(selectedEquipment);

    const isVisible = product.isVisible !== false;

    return matchesSearch && matchesCategory && matchesSubcategory && matchesEquipment && isVisible;
  });

  // 카테고리별로 상품 그룹화
  const groupedByCategory: { [key: string]: Product[] } = {};
  filteredProducts.forEach(product => {
    const displayCategory = product.category?.trim() || '기타';

    if (!groupedByCategory[displayCategory]) {
      groupedByCategory[displayCategory] = [];
    }
    groupedByCategory[displayCategory].push(product);
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-8 lg:py-12">
      {/* Header - Moved to top */}
      <div className="mb-8 lg:mb-12">
        <h1 className="text-3xl lg:text-4xl tracking-tight text-neutral-900 mb-2">전체 상품</h1>
        <p className="text-base text-neutral-600">
          의료 미용 기기 및 소모품을 찾아보세요
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white border border-neutral-200 p-6 sticky top-24">
            <nav className="space-y-1">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSubcategory('all');
                  setExpandedCategory(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-sm ${selectedCategory === 'all' 
                  ? 'bg-neutral-900 text-white font-medium' 
                  : 'text-neutral-700 hover:bg-neutral-100'}`}
              >
                <span>전체 상품</span>
              </button>

              {rootCategories.map(categoryObj => {
                const category = categoryObj.name;
                const displayName = category.trim();
                const subcategories = getSubcategories(category);
                const hasSubcategories = subcategories.length > 0;
                const isMainCategoryActive = selectedCategory === category;

                return (
                  <div 
                    key={category} 
                    className="flex flex-col relative group"
                    onMouseEnter={() => hasSubcategories && setExpandedCategory(category)}
                    onMouseLeave={() => setExpandedCategory(null)}
                  >
                    <button
                      onClick={() => {
                        setSelectedCategory(category);
                        setSelectedSubcategory('all');
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-sm ${isMainCategoryActive
                        ? 'bg-neutral-900 text-white font-medium' 
                        : 'text-neutral-700 hover:bg-neutral-100'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span>{displayName}</span>
                      </div>
                    </button>

                    {/* Accordion Subcategory List */}
                    {isMainCategoryActive && hasSubcategories && (
                      <div className="bg-neutral-50 flex flex-col border-y border-neutral-200 animate-in slide-in-from-top-2 duration-300 overflow-hidden my-1">
                        {subcategories.map(subcategory => {
                          const isSubActive = selectedSubcategory === subcategory;
                          return (
                            <button
                              key={subcategory}
                              onClick={() => setSelectedSubcategory(subcategory)}
                              className={`w-full flex items-center gap-2 px-8 py-2.5 transition-colors text-xs ${isSubActive 
                                ? 'text-neutral-900 font-bold' 
                                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'}`}
                            >
                              <span>{subcategory}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Help Info (Matches Communication Layout) */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-xs text-neutral-600 mb-2">고객지원센터</p>
              <a
                href="tel:070-7435-4927"
                className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
              >
                070-7435-4927
              </a>
              <p className="text-xs text-neutral-500 mt-2">
                평일 오전 9시 ~ 오후 5시
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 min-w-0">

          {/* Search and Filter Bar */}
          <div className="bg-white border border-neutral-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="상품명, SKU로 검색"
                  className="w-full pl-12 pr-4 py-3 border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 text-sm"
                />
              </div>

              <div className="flex gap-3">
                {/* Barcode Scan Button */}
                <button className="flex-1 sm:flex-none bg-neutral-100 hover:bg-neutral-200 px-6 py-3 font-medium flex items-center justify-center gap-2 transition-colors text-sm">
                  <ScanLine className="w-5 h-5" />
                  <span>스캔</span>
                </button>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-1 sm:flex-none bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <Filter className="w-5 h-5" />
                  <span>필터</span>
                </button>
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-xs tracking-wide text-neutral-700 mb-2 uppercase font-medium">
                      카테고리
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 text-sm"
                    >
                      <option value="all">전체</option>
                      {rootCategories.map(cat => (
                        <option key={cat.name} value={cat.name}>{cat.name.trim()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory Filter */}
                  <div>
                    <label className="block text-xs tracking-wide text-neutral-700 mb-2 uppercase font-medium">
                      중분류
                    </label>
                    <select
                      value={selectedSubcategory}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 text-sm"
                    >
                      <option value="all">전체 보기</option>
                      {getSubcategories(selectedCategory).map(subcat => (
                        <option key={subcat} value={subcat}>{subcat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Equipment Filter */}
                  <div>
                    <label className="block text-xs tracking-wide text-neutral-700 mb-2 uppercase font-medium">
                      보유 기기 필터
                    </label>
                    <select
                      value={selectedEquipment}
                      onChange={(e) => setSelectedEquipment(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 text-sm"
                    >
                      <option value="all">전체 보기</option>
                      {mockEquipment.map(eq => (
                        <option key={eq.id} value={eq.serialNumber}>
                          {eq.modelName} ({eq.serialNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mb-8">
            <p className="text-sm text-neutral-600">
              총 <span className="font-medium text-neutral-900">{filteredProducts.length}</span>개 상품
            </p>
          </div>

          {/* Grouped Products */}
          {Object.keys(groupedByCategory).map(category => (
            <div key={category} className="mb-16">
              <div className="border-b-2 border-neutral-900 pb-3 mb-8">
                <h2 className="text-2xl tracking-tight text-neutral-900 font-bold">{category}</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {groupedByCategory[category].map(product => (
                  <div key={product.id} className="bg-white border border-neutral-200 overflow-hidden group hover:border-neutral-900 transition-all">
                    <Link to={`/products/${product.id}`} className="block">
                      <div className="aspect-square bg-neutral-100 overflow-hidden">
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-6">
                        <p className="text-xs text-neutral-500 mb-2 tracking-wide uppercase">{product.sku}</p>
                        <h3 className="text-lg font-bold tracking-tight text-neutral-900 mb-1 line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="mb-1 leading-none flex items-center gap-1">
                          {product.creditAvailable && (
                            <span className="inline-flex items-center px-1 py-0.5 rounded-[2px] text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider transform scale-[0.65] origin-left">
                              크레딧 사용가능
                            </span>
                          )}
                          {( (product.salesUnit && product.salesUnit > 1) || (product.options && product.options.length > 0) || product.isPackage ) && (
                            <span className="inline-flex items-center px-1 py-0.5 rounded-[2px] text-[10px] font-bold bg-green-600 text-white uppercase tracking-wider transform scale-[0.65] origin-left">
                              SET
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold tracking-tight text-neutral-900 mb-4">
                          ₩{product.price.toLocaleString()}
                        </p>
                        {/* 
                        <div className="flex items-center justify-between text-xs text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            재고 {product.stock}개
                          </span>
                          <span className={product.stock > 0 ? 'text-green-700' : 'text-red-700'}>
                            {product.stock > 0 ? '구매 가능' : '품절'}
                          </span>
                        </div>
                        */}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-neutral-400" />
              </div>
              <h3 className="text-xl tracking-tight text-neutral-900 mb-2">
                검색 결과가 없습니다
              </h3>
              <p className="text-sm text-neutral-600">
                다른 검색어나 필터를 사용해보세요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}