import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Search, Filter, ScanLine, ChevronDown, Menu, ChevronRight, Package, Loader2 } from 'lucide-react';
import { mockEquipment } from '../lib/mockData';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { Product } from '../types';

export function ProductListPage() {
  const [searchParams] = useSearchParams();
  const { data: products = [], isLoading: loading } = useProducts();
  const { data: dbCategories = [] } = useCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // 모든 카테고리 추출 (중복 제거)
  // DB에서 카테고리 가져오기 (이름 목록)
  const allCategories = dbCategories.map(cat => cat.name);

  // 선택된 카테고리의 중분류 추출
  const getSubcategories = (category: string) => {
    const subcategories = products
      .filter(p => p.category === category && p.subcategory)
      .map(p => p.subcategory as string);
    return Array.from(new Set(subcategories));
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;

    const matchesSubcategory =
      selectedSubcategory === 'all' || product.subcategory === selectedSubcategory;

    const matchesEquipment =
      selectedEquipment === 'all' ||
      product.compatibleEquipment.includes(selectedEquipment);

    return matchesSearch && matchesCategory && matchesSubcategory && matchesEquipment;
  });

  // 카테고리별로 상품 그룹화
  const groupedByCategory: { [key: string]: Product[] } = {};
  filteredProducts.forEach(product => {
    if (!groupedByCategory[product.category]) {
      groupedByCategory[product.category] = [];
    }
    groupedByCategory[product.category].push(product);
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex gap-6">
        {/* Left Sidebar - Category Dropdown */}
        <div className="w-[200px] flex-shrink-0 hidden lg:block relative z-40">
          <div className="sticky top-8">
            {/* Category Dropdown Button */}
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-4 py-3 flex items-center justify-between transition-colors text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <Menu className="w-4 h-4" />
                <span>보유장비</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Category List */}
            {showCategoryDropdown && (
              <div className="bg-white border border-neutral-200 border-t-0 relative">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedSubcategory('all');
                    setExpandedCategory(null);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 transition-colors ${selectedCategory === 'all' ? 'bg-neutral-100 font-medium' : ''
                    }`}
                >
                  전체
                </button>
                {allCategories.map(category => {
                  const subcategories = getSubcategories(category);
                  const hasSubcategories = subcategories.length > 0;

                  return (
                    <div
                      key={category}
                      className="relative"
                      onMouseEnter={() => {
                        if (hasSubcategories) {
                          setExpandedCategory(category);
                        } else {
                          setExpandedCategory(null);
                        }
                      }}
                    >
                      <button
                        onClick={() => {
                          if (hasSubcategories) {
                            setExpandedCategory(expandedCategory === category ? null : category);
                          } else {
                            setSelectedCategory(category);
                            setSelectedSubcategory('all');
                            setExpandedCategory(null);
                          }
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 transition-colors border-t border-neutral-100 flex items-center justify-between ${selectedCategory === category && !expandedCategory ? 'bg-neutral-100 font-medium' : ''
                          }`}
                      >
                        <span>{category}</span>
                        {hasSubcategories && (
                          <ChevronRight className={`w-4 h-4 text-neutral-400`} />
                        )}
                      </button>

                      {/* Subcategory Panel - Positioned to the right */}
                      {expandedCategory === category && hasSubcategories && (
                        <div
                          className="absolute left-full top-0 ml-0 w-[250px] bg-white border border-neutral-200 shadow-xl z-50"
                          onMouseEnter={() => setExpandedCategory(category)}
                          onMouseLeave={() => setExpandedCategory(null)}
                        >
                          <div className="px-4 py-2 bg-neutral-100 border-b border-neutral-200">
                            <h3 className="text-xs font-medium text-neutral-700 uppercase">{category}</h3>
                          </div>
                          <div>
                            {subcategories.map(subcategory => (
                              <button
                                key={subcategory}
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setSelectedSubcategory(subcategory);
                                  setExpandedCategory(null);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 transition-colors border-t border-neutral-100 first:border-t-0 ${selectedCategory === category && selectedSubcategory === subcategory ? 'bg-neutral-100 font-medium' : ''
                                  }`}
                              >
                                {subcategory}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Optional Tab - 데모신청 */}
            <div className="mt-4">
              <button className="w-full bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-900 px-4 py-3 text-sm font-medium transition-colors">
                데모신청
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-8 lg:mb-12">
            <h1 className="text-3xl lg:text-4xl tracking-tight text-neutral-900 mb-2">전체 상품</h1>
            <p className="text-base text-neutral-600">
              의료 미용 기기 및 소모품을 찾아보세요
            </p>
          </div>

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
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
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
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-6">
                        <p className="text-xs text-neutral-500 mb-2 tracking-wide uppercase">{product.sku}</p>
                        <h3 className="text-lg font-bold tracking-tight text-neutral-900 mb-3 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-base tracking-tight text-neutral-900 mb-4">
                          ₩{product.price.toLocaleString()}
                        </p>
                        <div className="flex items-center justify-between text-xs text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            재고 {product.stock}개
                          </span>
                          <span className={product.stock > 0 ? 'text-green-700' : 'text-red-700'}>
                            {product.stock > 0 ? '구매 가능' : '품절'}
                          </span>
                        </div>
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