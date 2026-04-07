import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Search, Trash2, Loader2, Check, Upload, ImageIcon, X } from 'lucide-react';
import { RichTextEditor } from '../../components/RichTextEditor';
import { ProductImage } from '../../components/ui/ProductImage';
import { useProduct, useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { productService, ProductInput } from '../../services/productService';
import { Product, PackageItem } from '../../types';

interface PackageFormData {
  name: string;
  category: string;
  productCode: string;
  manufacturer: string;
  price: string;
  stock: string;
  status: 'active' | 'inactive';
  selectableCount: string;
  itemInputType: 'select' | 'input';
  creditAvailable: boolean;
  minOrderQuantity: string;
  maxOrderQuantity: string;
  description: string;
}

export function PackageRegisterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const { data: existingProduct, isLoading: isLoadingProduct } = useProduct(id || '');
  const { data: categories = [] } = useCategories();
  
  const [productsList, setProductsList] = useState<Product[]>([]);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [formData, setFormData] = useState<PackageFormData>({
    name: '',
    category: '',
    productCode: '',
    manufacturer: '',
    price: '',
    stock: '',
    status: 'active',
    selectableCount: '1',
    itemInputType: 'select',
    creditAvailable: true,
    minOrderQuantity: '1',
    maxOrderQuantity: '',
    description: '',
  });

  const [selectedItems, setSelectedItems] = useState<Partial<PackageItem>[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);

  // Load all products for the component search
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getProducts();
        setProductsList(data.filter(p => !p.isPackage)); // Don't allow packages inside packages for now
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  // Load existing package data in edit mode
  useEffect(() => {
    if (isEditMode && existingProduct) {
      setFormData({
        name: existingProduct.name,
        category: existingProduct.category,
        productCode: existingProduct.sku,
        manufacturer: '', 
        price: existingProduct.price.toString(),
        stock: existingProduct.stock.toString(),
        status: existingProduct.isActive !== false ? 'active' : 'inactive',
        selectableCount: existingProduct.selectableCount?.toString() || '1',
        itemInputType: existingProduct.itemInputType || 'select',
        creditAvailable: existingProduct.creditAvailable ?? true,
        minOrderQuantity: (existingProduct.minOrderQuantity || 1).toString(),
        maxOrderQuantity: existingProduct.maxOrderQuantity?.toString() || '',
        description: existingProduct.description || '',
      });
      if (existingProduct.imageUrl) {
        setThumbnailPreview(existingProduct.imageUrl);
      }
      if (existingProduct.additionalImages) {
        setAdditionalImages(existingProduct.additionalImages);
      }

      const fetchItems = async () => {
        try {
          const items = await productService.getPackageItems(existingProduct.id);
          setSelectedItems(items.map(item => ({
            id: item.id,
            productId: item.productId,
            product: item.product,
            priceOverride: item.priceOverride,
            maxQuantity: item.maxQuantity || 0,
          })));
        } catch (err) {
          console.error('Error fetching package items:', err);
        }
      };
      fetchItems();
    }
  }, [isEditMode, existingProduct]);

  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const results = productsList.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, productsList]);

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

  const addItemToPackage = (product: Product) => {
    if (selectedItems.some(item => item.productId === product.id)) {
      alert('이미 추가된 상품입니다.');
      return;
    }

    setSelectedItems(prev => [
      ...prev,
      {
        productId: product.id,
        product: product,
        priceOverride: product.price,
        maxQuantity: 1,
      }
    ]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeItemFromPackage = (productId: string) => {
    setSelectedItems(prev => prev.filter(item => item.productId !== productId));
  };

  const updateItemPrice = (productId: string, price: string) => {
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
    setSelectedItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, priceOverride: numericPrice } : item
    ));
  };

  const updateItemMaxQuantity = (productId: string, qty: string) => {
    const numericQty = parseInt(qty.replace(/[^0-9]/g, '')) || 1;
    setSelectedItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, maxQuantity: numericQty } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (selectedItems.length === 0) {
      alert('최소 하나 이상의 구성 상품을 추가해주세요.');
      return;
    }

    const minQty = parseInt(formData.minOrderQuantity) || 1;
    const maxQty = formData.maxOrderQuantity ? parseInt(formData.maxOrderQuantity) : null;

    if (maxQty !== null && maxQty < minQty) {
      alert('최대 주문 수량은 최소 주문 수량보다 크거나 같아야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload thumbnail image if changed
      let finalImageUrl: string | undefined = thumbnailPreview || undefined;
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

      const productData: ProductInput = {
        sku: formData.productCode || `PKG-${Date.now()}`,
        name: formData.name,
        category: finalCategory,
        subcategory: finalSubcategory,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        is_active: formData.status === 'active',
        is_package: true,
        selectable_count: parseInt(formData.selectableCount) || 1,
        item_input_type: formData.itemInputType,
        credit_available: formData.creditAvailable,
        min_order_quantity: parseInt(formData.minOrderQuantity) || 1,
        max_order_quantity: formData.maxOrderQuantity ? parseInt(formData.maxOrderQuantity) : undefined,
        description: formData.description,
        image_url: finalImageUrl,
      };

      let packageId: string;
      if (isEditMode && id) {
        await updateProduct.mutateAsync({ id, data: productData });
        packageId = id;
      } else {
        const newPackage = await createProduct.mutateAsync(productData);
        packageId = newPackage.id;
      }

      // Save package items
      await productService.addPackageItems(
        packageId, 
        selectedItems.map(item => ({
          productId: item.productId!,
          priceOverride: item.priceOverride,
          maxQuantity: item.maxQuantity
        }))
      );

      // 2. Upload and save additional images
      if (additionalFiles.length > 0) {
        const uploadedUrls = await Promise.all(
          additionalFiles.map(file => productService.uploadProductImage(file))
        );

        if (isEditMode) {
          await productService.deleteProductImages(packageId);
        }
        await productService.addProductImages(packageId, uploadedUrls);
      }

      alert(isEditMode ? '패키지가 수정되었습니다.' : '패키지가 등록되었습니다.');
      navigate('/admin/products/package');
    } catch (error) {
      console.error('Error saving package:', error);
      alert('패키지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render categories in a hierarchical select (copied from ProductRegisterPage)
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

  if (isEditMode && isLoadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/products/package')}
          className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-1 font-medium">
            {isEditMode ? '패키지 상품 수정' : '패키지 상품 등록'}
          </h2>
          <p className="text-sm text-neutral-500">
            {isEditMode ? '기존 패키지 정보를 수정합니다' : '새로운 상품 구성을 패키지로 등록합니다'}
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

        {/* Form Grid */}
        <div className="bg-white border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">기본 정보</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  패키지 상품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="패키지 상품명을 입력하세요"
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white transition-all"
                  required
                >
                  <option value="">카테고리 선택</option>
                  {renderCategoryOptions()}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">상품코드 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="productCode"
                  value={formData.productCode}
                  onChange={handleInputChange}
                  placeholder="상품코드를 입력하세요"
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">제조사</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  placeholder="제조사를 입력하세요"
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  패키지 가격 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="패키지 가격을 입력하세요"
                    className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all pr-10"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">원</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">재고 수량</label>
                <div className="relative">
                  <input
                    type="text"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="재고 수량을 입력하세요"
                    className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">개</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">판매 상태</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white transition-all"
                >
                  <option value="active">판매중</option>
                  <option value="inactive">판매중지</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  선택 가능한 상품 종류 개수 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="selectableCount"
                  value={formData.selectableCount}
                  onChange={handleInputChange}
                  placeholder="예: 3"
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                  required
                />
                <p className="text-xs text-neutral-400 mt-1">고객이 선택할 수 있는 상품의 종류 개수를 입력하세요</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">상품갯수 입력방법</label>
                <select
                  name="itemInputType"
                  value={formData.itemInputType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white transition-all"
                >
                  <option value="select">옵션리스트 선택</option>
                  <option value="input">상품갯수 직접입력</option>
                </select>
                <p className="text-xs text-neutral-400 mt-1">사용자가 상품 상세보기에서 상품을 선택하는 방식을 결정합니다</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">크레딧 사용 가능여부</label>
                <select
                  name="creditAvailable"
                  value={formData.creditAvailable.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, creditAvailable: e.target.value === 'true' }))}
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white transition-all"
                >
                  <option value="true">가능</option>
                  <option value="false">불가능</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">최소 주문 수량</label>
                <input
                  type="number"
                  name="minOrderQuantity"
                  value={formData.minOrderQuantity}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="1"
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                />
                <p className="text-xs text-neutral-400 mt-1">패키지 주문 시 필요한 최소 수량을 설정하세요</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">최대 주문 수량</label>
                <input
                  type="number"
                  name="maxOrderQuantity"
                  value={formData.maxOrderQuantity}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="제한 없음"
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                />
                <p className="text-xs text-neutral-400 mt-1">패키지 주문 시 허용되는 최대 수량을 설정하세요 (비워두면 제한 없음)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Package Components Section */}
        <div className="bg-white border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">패키지 구성 상품 <span className="text-red-500">*</span></h3>
          </div>
          <div className="p-8 space-y-8">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">상품 검색 및 추가</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="상품명, 카테고리, 상품코드로 검색"
                  className="w-full pl-12 pr-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                />
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 shadow-xl z-20 overflow-hidden">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addItemToPackage(product)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 text-left transition-colors border-b border-neutral-100 last:border-0"
                      >
                        <div className="flex gap-4 items-center">
                          <div className="w-10 h-10 bg-neutral-100 flex items-center justify-center overflow-hidden">
                            <ProductImage
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-neutral-900">{product.name}</div>
                            <div className="text-xs text-neutral-500">{product.category} | {product.sku}</div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-neutral-900">{product.price.toLocaleString()}원</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-1">패키지에 포함할 상품을 검색하여 추가하세요</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-neutral-700">추가된 상품 목록 ({selectedItems.length}개)</label>
              </div>
              
              <div className="border border-neutral-200">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">상품 정보</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">금액</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider w-32">최대구매갯수</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider w-20">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {selectedItems.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-neutral-500 text-sm bg-neutral-50/30">
                          추가된 구성 상품이 없습니다
                        </td>
                      </tr>
                    ) : (
                      selectedItems.map((item, index) => (
                        <tr key={item.productId} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex gap-4 items-center">
                              <span className="text-sm font-bold text-neutral-400">{index + 1}.</span>
                              <div>
                                <div className="text-sm font-bold text-neutral-900">{item.product?.name}</div>
                                <div className="text-xs text-neutral-500">{item.product?.category} | {item.product?.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="relative inline-block w-full">
                              <input
                                type="text"
                                value={item.priceOverride}
                                onChange={(e) => updateItemPrice(item.productId!, e.target.value)}
                                className="w-full text-right pr-6 py-2 border-b border-transparent hover:border-neutral-300 focus:border-neutral-900 focus:outline-none transition-all text-sm font-semibold"
                              />
                              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-normal">원</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="relative inline-block w-20">
                              <input
                                type="text"
                                value={item.maxQuantity}
                                onChange={(e) => updateItemMaxQuantity(item.productId!, e.target.value)}
                                className="w-full text-right pr-4 py-2 border-b border-transparent hover:border-neutral-300 focus:border-neutral-900 focus:outline-none transition-all text-sm font-semibold"
                              />
                              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-normal">개</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemFromPackage(item.productId!)}
                              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
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
              <p className="text-xs text-neutral-400">각 상품의 가격을 입력하세요. 고객은 이 중에서 선택한 개수만큼 상품을 선택할 수 있습니다.</p>
            </div>
          </div>
        </div>

        {/* Product Description Section */}
        <div className="bg-white border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">상품 설명</h3>
          </div>
          <div className="p-8">
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              onImageUpload={(file) => productService.uploadProductImage(file)}
              placeholder="상세 내용을 입력해 주세요"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 sticky bottom-6 z-10">
          <button
            type="button"
            onClick={() => navigate('/admin/products/package')}
            disabled={isSubmitting}
            className="px-8 py-4 bg-white border border-neutral-300 text-neutral-900 hover:bg-neutral-50 font-medium transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-10 py-4 bg-blue-600 text-white hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            {isEditMode ? '수정 완료' : '등록 완료'}
          </button>
        </div>
      </form>
    </div>
  );
}
