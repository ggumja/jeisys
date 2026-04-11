import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, Trash2, Loader2, Check, Upload, ImageIcon, X, Plus, Package } from 'lucide-react';
import { RichTextEditor } from '../../components/RichTextEditor';

import { useProduct, useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { productService, ProductInput } from '../../services/productService';
import { Product, PackageItem } from '../../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

const formatWithCommas = (value: string | number) => {
  if (value === undefined || value === null || value === '') return '';
  const stringValue = value.toString().replace(/,/g, '');
  if (isNaN(Number(stringValue))) return stringValue;
  return Number(stringValue).toLocaleString('ko-KR');
};

const unformatNumber = (value: string) => {
  return value.replace(/,/g, '');
};

interface PackageFormData {
  name: string;
  category: string;
  productCode: string;
  sapSku: string;
  manufacturer: string;
  price: string;
  stock: string;
  status: 'active' | 'inactive';
  isVisible: boolean;
  selectableCount: string;
  itemInputType: 'select' | 'input';
  creditAvailable: boolean;
  pointsAvailable: boolean;
  minOrderQuantity: string;
  maxOrderQuantity: string;
  description: string;
  bonusProducts: BonusProductData[];
  options: QuantityOptionData[];
}

interface BonusProductData {
  id: string;
  sku: string;
  name: string;
  price: string;
  quantity: string;
  calculationMethod: 'fixed' | 'ratio';
  percentage: string;
}

interface QuantityOptionData {
  id: string;
  name: string;
  quantity: string;
  discountRate: string;
  price: string;
  items: PackageItemData[];
}

interface PackageItemData {
  id: string;
  productId: string;
  name: string;
  sku: string;
  priceOverride: string;
  maxQuantity: string;
}

export function PackageRegisterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const { data: existingProduct, isLoading: isLoadingProduct } = useProduct(id || '');
  const isInitialized = useRef<string | null>(null);
  const { data: categories = [] } = useCategories();
  
  const [productsList, setProductsList] = useState<Product[]>([]);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [formData, setFormData] = useState<PackageFormData>({
    name: '',
    category: '',
    productCode: '',
    sapSku: '',
    manufacturer: '',
    price: '',
    stock: '',
    status: 'active',
    isVisible: true,
    selectableCount: '100',
    itemInputType: 'input',
    creditAvailable: true,
    pointsAvailable: true,
    minOrderQuantity: '1',
    maxOrderQuantity: '',
    description: '',
    salesUnit: '1',
    bonusProducts: [],
    options: [],
  });

  const [optionSearchTerms, setOptionSearchTerms] = useState<Record<string, string>>({});
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const [isOptionSearchDropdownOpen, setIsOptionSearchDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [bonusSearchResults, setBonusSearchResults] = useState<Product[]>([]);
  const [bonusSearchTerm, setBonusSearchTerm] = useState('');
  const [isBonusDropdownOpen, setIsBonusDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
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
    type: 'success',
  });

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
    const initializeData = async () => {
      // 이미 이 ID로 초기화가 완료되었다면 중복 실행 방지
      if (!isEditMode || !existingProduct || isInitialized.current === existingProduct.id) {
        return;
      }

      try {
        console.log('Initializing package data for:', existingProduct.id);
        
        // Fetch package items first
        const items = await productService.getPackageItems(existingProduct.id);
        
        // Map options and attach their items
        const mappedOptions: QuantityOptionData[] = (existingProduct.options || []).map((opt, idx) => {
          const optionId = String(opt.id);
          return {
            id: optionId,
            name: opt.name,
            quantity: opt.quantity.toString(),
            discountRate: opt.discountRate.toString(),
            price: formatWithCommas(opt.price || 0),
            items: items
              .filter(item => {
                const itemOptionId = item.optionId ? String(item.optionId) : null;
                // 매칭되거나, (아이템에 optionId가 없고 이 옵션이 첫 번째 옵션인 경우) 구제
                return itemOptionId === optionId || (itemOptionId === null && idx === 0);
              })
              .map(item => ({
                id: item.id,
                productId: item.productId,
                name: item.product?.name || '알 수 없는 상품',
                sku: item.product?.sku || '-',
                priceOverride: formatWithCommas(item.priceOverride || 0),
                maxQuantity: (item.maxQuantity || 0).toString()
              }))
          };
        });

        // Set all form data at once
        setFormData({
          name: existingProduct.name,
          category: existingProduct.category,
          productCode: existingProduct.sku,
          sapSku: existingProduct.sapSku || '',
          manufacturer: existingProduct.manufacturer || '', 
          price: formatWithCommas(existingProduct.price || 0),
          stock: formatWithCommas(existingProduct.stock || 0),
          status: existingProduct.isActive !== false ? 'active' : 'inactive',
          isVisible: existingProduct.isVisible !== false,
          selectableCount: formatWithCommas(existingProduct.selectableCount || 1),
          salesUnit: formatWithCommas(existingProduct.salesUnit || 1),
          itemInputType: existingProduct.itemInputType || 'select',
          creditAvailable: existingProduct.creditAvailable ?? true,
          pointsAvailable: existingProduct.pointsAvailable ?? true,
          minOrderQuantity: formatWithCommas(existingProduct.minOrderQuantity || 1),
          maxOrderQuantity: formatWithCommas(existingProduct.maxOrderQuantity || 0),
          description: existingProduct.description || '',
          bonusProducts: (existingProduct.bonusItems || []).map(bi => ({
            id: bi.productId,
            sku: bi.product?.sku || '',
            name: bi.product?.name || '',
            price: formatWithCommas(bi.priceOverride || 0),
            quantity: formatWithCommas(bi.quantity || 1),
            calculationMethod: bi.calculationMethod || 'fixed',
            percentage: (bi.percentage || 0).toString()
          })),
          options: mappedOptions,
        });

        if (existingProduct.imageUrl) {
          setThumbnailPreview(existingProduct.imageUrl);
        }
        if (existingProduct.additionalImages) {
          setAdditionalImages(existingProduct.additionalImages);
        }

        // 초기화 완료 표시
        isInitialized.current = existingProduct.id;
        console.log('Package initialization complete');
      } catch (err) {
        console.error('Error initializing package data:', err);
      }
    };

    initializeData();
  }, [isEditMode, existingProduct?.id, existingProduct]);

  useEffect(() => {
    // Option-specific search logic
    if (activeOptionId && optionSearchTerms[activeOptionId]?.trim()) {
      const term = optionSearchTerms[activeOptionId].toLowerCase();
      const results = productsList.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
      ).slice(0, 20);
      setSearchResults(results);
      setIsOptionSearchDropdownOpen(true);
    } else {
      setSearchResults([]);
      setIsOptionSearchDropdownOpen(false);
    }
  }, [optionSearchTerms, activeOptionId, productsList]);

  useEffect(() => {
    if (bonusSearchTerm.trim().length > 0) {
      const termLower = bonusSearchTerm.toLowerCase();
      const results = productsList.filter(p => 
        p.name.toLowerCase().includes(termLower) ||
        p.sku.toLowerCase().includes(termLower)
      ).slice(0, 20);
      setBonusSearchResults(results);
      setIsBonusDropdownOpen(true);
    } else {
      setBonusSearchResults([]);
      setIsBonusDropdownOpen(false);
    }
  }, [bonusSearchTerm, productsList]);


  useEffect(() => {
    if ((formData.options || []).length > 0) {
      const optionPrices = (formData.options || [])
        .map(opt => parseFloat(unformatNumber(opt.price || '0')))
        .filter(price => price > 0);
      
      if (optionPrices.length > 0) {
        // Use the minimum price among options as the representative price
        const minPrice = Math.min(...optionPrices);
        setFormData(prev => ({
          ...prev,
          price: formatWithCommas(minPrice)
        }));
      }

      // Also sync salesUnit with the quantity of the first option if it's not set
      if ((formData.options || []).length > 0 && formData.options[0].quantity && formData.options[0].quantity !== '0') {
        setFormData(prev => ({
          ...prev,
          salesUnit: formatWithCommas(formData.options[0].quantity)
        }));
      }
    }
  }, [formData.options]);


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // List of numeric fields to format with commas
    const numericFields = ['price', 'stock', 'selectableCount', 'minOrderQuantity', 'maxOrderQuantity', 'salesUnit'];
    
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
      
      // Limit to 5 images
      if (additionalImages.length + fileList.length > 5) {
        setResultModal({
          isOpen: true,
          title: '이미지 초과',
          description: '추가 이미지는 최대 5개까지만 등록 가능합니다.',
          type: 'error'
        });
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

  const addItemToOption = (optionId: string, product: Product) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => {
        if (opt.id !== optionId) return opt;
        
        if (opt.items.find(item => item.productId === product.id)) {
          setResultModal({
            isOpen: true,
            title: '중복 상품',
            description: '이미 추가된 상품입니다.',
            type: 'error'
          });
          return opt;
        }

        const newItem: PackageItemData = {
          id: crypto.randomUUID(),
          productId: product.id,
          name: product.name,
          sku: product.sku,
          priceOverride: product.price.toString(),
          maxQuantity: '1'
        };

        const newItems = [...opt.items, newItem];
        const totalQty = newItems.reduce((sum, i) => sum + (parseInt(i.maxQuantity) || 0), 0);
        const totalPrice = newItems.reduce((sum, i) => {
          const qty = parseInt(i.maxQuantity) || 0;
          const price = parseFloat(unformatNumber(i.priceOverride)) || 0;
          return sum + (qty * price);
        }, 0);

        return { 
          ...opt, 
          items: newItems,
          quantity: totalQty.toString(),
          price: totalPrice.toString()
        };
      })
    }));
    setActiveOptionId(null);
    setIsOptionSearchDropdownOpen(false);
    setOptionSearchTerms(prev => ({ ...prev, [optionId]: '' }));
  };

  const updateItemInOption = (optionId: string, itemId: string, field: keyof PackageItemData, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => {
        if (opt.id !== optionId) return opt;
        const newItems = opt.items.map(item => item.id === itemId ? { ...item, [field]: value } : item);
        const totalQty = newItems.reduce((sum, i) => sum + (parseInt(i.maxQuantity) || 0), 0);
        const totalPrice = newItems.reduce((sum, i) => {
          const qty = parseInt(i.maxQuantity) || 0;
          const price = parseFloat(unformatNumber(i.priceOverride)) || 0;
          return sum + (qty * price);
        }, 0);

        return { 
          ...opt, 
          items: newItems,
          quantity: totalQty.toString(),
          price: totalPrice.toString()
        };
      })
    }));
  };

  const removeItemFromOption = (optionId: string, itemId: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => {
        if (opt.id !== optionId) return opt;
        const newItems = opt.items.filter(item => item.id !== itemId);
        const totalQty = newItems.reduce((sum, i) => sum + (parseInt(i.maxQuantity) || 0), 0);
        const totalPrice = newItems.reduce((sum, i) => {
          const qty = parseInt(i.maxQuantity) || 0;
          const price = parseFloat(unformatNumber(i.priceOverride)) || 0;
          return sum + (qty * price);
        }, 0);

        return { 
          ...opt, 
          items: newItems,
          quantity: totalQty.toString(),
          price: totalPrice.toString()
        };
      })
    }));
  };

  const addQuantityOption = () => {
    const newOption: QuantityOptionData = {
      id: crypto.randomUUID(),
      name: '',
      quantity: '0',
      discountRate: '0',
      price: '0',
      items: []
    };
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, newOption]
    }));
  };

  const updateQuantityOption = (id: string, field: keyof QuantityOptionData, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => 
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const removeQuantityOption = (id: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== id)
    }));
  };

  const addBonusProduct = (product: Product) => {
    if (formData.bonusProducts.some(p => p.id === product.id)) {
      alert('이미 추가된 상품입니다.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      bonusProducts: [
        ...prev.bonusProducts,
        {
          id: product.id,
          sku: product.sku,
          name: product.name,
          price: '0',
          quantity: '1',
          calculationMethod: 'fixed',
          percentage: '0'
        }
      ]
    }));
    setBonusSearchTerm('');
    setIsBonusDropdownOpen(false);
  };

  const removeBonusProduct = (id: string) => {
    setFormData(prev => ({
      ...prev,
      bonusProducts: prev.bonusProducts.filter(p => p.id !== id)
    }));
  };

  const updateBonusProduct = (id: string, field: keyof BonusProductData, value: string) => {
    setFormData(prev => ({
      ...prev,
      bonusProducts: prev.bonusProducts.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price) {
      setResultModal({
        isOpen: true,
        title: '입력 정보 부족',
        description: '패키지 명, 카테고리, 가격 등 필수 항목을 모두 입력해주세요.',
        type: 'error'
      });
      return;
    }

    if (formData.options.length === 0) {
      setResultModal({
        isOpen: true,
        title: '옵션 설정 필요',
        description: '최소 하나 이상의 세트 옵션을 설정해주세요.',
        type: 'error'
      });
      return;
    }

    // Check if each option has at least one item
    for (const opt of formData.options) {
      if (opt.items.length === 0) {
        setResultModal({
          isOpen: true,
          title: '구성 상품 미포함',
          description: `[${opt.name || '미지정'}] 옵션의 구성 상품을 추가해주세요.`,
          type: 'error'
        });
        return;
      }
    }

    const minQty = parseInt(formData.minOrderQuantity) || 1;
    const maxQtyString = formData.maxOrderQuantity?.toString().trim();
    const maxQty = maxQtyString && maxQtyString !== '' ? parseInt(maxQtyString) : null;

    if (maxQty !== null && maxQty > 0 && maxQty < minQty) {
      setResultModal({
        isOpen: true,
        title: '주문 수량 설정 오류',
        description: '최대 주문 수량은 최소 주문 수량보다 크거나 같아야 합니다. (설정하지 않으려면 비워두세요)',
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
        sap_sku: formData.sapSku,
        manufacturer: formData.manufacturer,
        name: formData.name,
        category: finalCategory,
        subcategory: finalSubcategory,
        price: parseFloat(unformatNumber(formData.price)),
        stock: parseInt(unformatNumber(formData.stock)) || 0,
        is_active: formData.status === 'active',
        is_visible: formData.isVisible,
        is_package: true,
        selectable_count: parseInt(unformatNumber(formData.selectableCount)) || 1,
        item_input_type: formData.itemInputType,
        credit_available: formData.creditAvailable,
        points_available: formData.pointsAvailable,
        min_order_quantity: parseInt(unformatNumber(formData.minOrderQuantity)) || 1,
        max_order_quantity: formData.maxOrderQuantity ? parseInt(unformatNumber(formData.maxOrderQuantity)) : undefined,
        description: formData.description,
        image_url: finalImageUrl,
        sales_unit: parseInt(unformatNumber(formData.salesUnit)) || 1,
      };

      let packageId: string;
      if (isEditMode && id) {
        await updateProduct.mutateAsync({ id, data: productData });
        packageId = id;
      } else {
        const newPackage = await createProduct.mutateAsync(productData);
        packageId = newPackage.id;
      }

      // Save Options and get their IDs
      const savedOptions = await productService.addOptions(packageId, formData.options.map(opt => ({
        name: opt.name,
        quantity: parseInt(opt.quantity),
        discountRate: parseFloat(opt.discountRate),
        price: parseFloat(unformatNumber(opt.price || '0'))
      })));

      // Map items to their saved option IDs and save
      const allPackageItems: any[] = [];
      formData.options.forEach((opt, index) => {
        const optionId = savedOptions[index].id;
        opt.items.forEach(item => {
          allPackageItems.push({
            productId: item.productId,
            priceOverride: parseFloat(unformatNumber(item.priceOverride)),
            maxQuantity: parseInt(unformatNumber(item.maxQuantity)),
            optionId: optionId
          });
        });
      });

      await productService.addPackageItems(packageId, allPackageItems);

      // 2. Upload and save additional images
      const existingUrls = additionalImages.filter(img => img.startsWith('http'));
      const newUploadedUrls = await Promise.all(
        additionalFiles.map(file => productService.uploadProductImage(file))
      );
      const allUrls = [...existingUrls, ...newUploadedUrls];

      if (isEditMode) {
        await productService.deleteProductImages(packageId);
      }
      if (allUrls.length > 0) {
        await productService.addProductImages(packageId, allUrls);
      }

      // 3. Save bonus products
      await productService.addBonusItems(
        packageId,
        formData.bonusProducts.map(bp => ({
          bonusProductId: bp.id,
          quantity: parseInt(unformatNumber(bp.quantity)) || 0,
          priceOverride: parseFloat(unformatNumber(bp.price)) || 0,
          optionId: null,
          calculationMethod: bp.calculationMethod,
          percentage: parseFloat(unformatNumber(bp.percentage)) || 0
        }))
      );

      setResultModal({
        isOpen: true,
        title: isEditMode ? '패키지 수정 완료' : '패키지 등록 완료',
        description: isEditMode ? '패키지 정보가 성공적으로 수정되었습니다.' : '새로운 패키지가 성공적으로 등록되었습니다.',
        type: 'success'
      });

      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error('Error saving package:', error);
      setResultModal({
        isOpen: true,
        title: '저장 실패',
        description: '패키지 저장 중 오류가 발생했습니다. 다시 시도해주세요.',
        type: 'error'
      });
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

  // Show error state if product not found in edit mode
  if (isEditMode && !existingProduct && !isLoadingProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-neutral-200">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">상품 정보를 찾을 수 없습니다</h3>
          <p className="text-neutral-500 mb-6">존재하지 않거나 이미 삭제된 상품일 수 있습니다.</p>
          <button
            onClick={() => navigate('/admin/products')}
            className="px-6 py-2 bg-neutral-900 text-white font-bold hover:bg-neutral-800 transition-colors"
          >
            상품 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-8 py-8 space-y-8 pb-32">
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
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-all z-10 shadow-md ring-2 ring-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="text-center group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto mb-1 group-hover:text-neutral-900" />
                  <p className="text-[10px] text-neutral-400 font-bold group-hover:text-neutral-900 leading-tight">패키지 대표<br />이미지 업로드</p>
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
                <div className="absolute top-0 left-0 bg-neutral-400/80 text-white text-[9px] px-1.5 py-0.5 font-bold tracking-tighter shadow-sm">View {index + 1}</div>
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

        {/* Form Grid */}
        <div className="bg-white border border-neutral-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-lg font-bold text-neutral-900 border-l-4 border-neutral-900 pl-3">기본 정보</h3>
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
                <label className="block text-sm font-medium text-neutral-700">SAP SKU (ERP 매핑용)</label>
                <input
                  type="text"
                  name="sapSku"
                  value={formData.sapSku}
                  onChange={handleInputChange}
                  placeholder="SAP 품번을 입력하세요"
                  className="w-full px-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
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

              <div className="space-y-4">
                <label className="block text-sm font-medium text-neutral-700">노출 여부 (고객 화면)</label>
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

              <div className="space-y-4">
                <label className="block text-sm font-medium text-neutral-700">판매 상태</label>
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
              </div>
            </div>
          </div>
        </div>

        {/* Package Set Options Section */}
        <div className="bg-white border border-neutral-200 overflow-visible">
          <div className="px-8 py-6 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-neutral-900 border-l-4 border-neutral-900 pl-3">패키지 상품 구성옵션 <span className="text-red-500">*</span></h3>
            <button
              type="button"
              onClick={addQuantityOption}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              옵션 추가
            </button>
          </div>
          
          <div className="p-8 flex flex-col gap-12">
            {(formData.options || []).length === 0 ? (
              <div className="text-center py-20 bg-neutral-50 border border-dashed border-neutral-200">
                <p className="text-neutral-500 text-sm mb-4">설정된 구성 옵션이 없습니다. [옵션 추가] 버튼을 눌러주세요.</p>
              </div>
            ) : (
              (formData.options || []).map((opt, optIndex) => (
                <div key={opt.id} className="border border-neutral-200 bg-neutral-50 p-6 relative">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-sm text-neutral-900">옵션 {optIndex + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeQuantityOption(opt.id)}
                      className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">옵션 표기명 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="예) 20개 패키지"
                        value={opt.name}
                        onChange={(e) => updateQuantityOption(opt.id, 'name', e.target.value)}
                        className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-900 text-sm bg-white h-[40px] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">패키지 총 구성 갯수 <span className="text-red-500">*</span></label>
                      <div className="flex items-center border border-neutral-300 bg-white focus-within:border-neutral-900 transition-colors overflow-hidden h-[40px]">
                        <input
                          type="text"
                          placeholder="20"
                          value={opt.quantity}
                          onChange={(e) => updateQuantityOption(opt.id, 'quantity', e.target.value.replace(/[^0-9]/g, ''))}
                          className="flex-1 w-full pl-4 pr-2 py-2 text-right border-0 focus:ring-0 text-sm bg-transparent outline-none font-medium"
                        />
                        <span className="text-[10px] text-neutral-500 font-bold whitespace-nowrap bg-neutral-100 flex items-center px-4 h-full border-l border-neutral-200 select-none min-w-[3rem] justify-center uppercase">개</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">패키지 확정 상품금액 <span className="text-red-500">*</span></label>
                      <div className="flex items-center border border-neutral-300 bg-white focus-within:border-neutral-900 transition-colors overflow-hidden h-[40px]">
                        <input
                          type="text"
                          placeholder="10,000,000"
                          value={formatWithCommas(opt.price)}
                          onChange={(e) => updateQuantityOption(opt.id, 'price', e.target.value)}
                          className="flex-1 w-full pl-4 pr-2 py-2 text-right border-0 focus:ring-0 text-sm bg-transparent outline-none font-medium"
                        />
                        <span className="text-[10px] text-neutral-500 font-bold whitespace-nowrap bg-neutral-100 flex items-center px-4 h-full border-l border-neutral-200 select-none min-w-[3rem] justify-center uppercase">원</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">옵션별 할인율</label>
                      <div className="flex items-center border border-neutral-300 bg-white focus-within:border-neutral-900 transition-colors overflow-hidden h-[40px]">
                        <input
                          type="text"
                          placeholder="0"
                          value={opt.discountRate}
                          onChange={(e) => updateQuantityOption(opt.id, 'discountRate', e.target.value.replace(/[^0-9]/g, ''))}
                          className="flex-1 w-full pl-4 pr-2 py-2 text-right border-0 focus:ring-0 text-sm bg-transparent outline-none font-medium text-blue-600"
                        />
                        <span className="text-[10px] text-blue-600 font-bold whitespace-nowrap bg-blue-50 flex items-center px-4 h-full border-l border-blue-100 select-none min-w-[3rem] justify-center uppercase">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Option Specific Item Search */}
                  <div className="bg-white p-6 border border-neutral-200">
                    <h5 className="text-xs font-bold text-neutral-900 mb-4 uppercase tracking-tight">옵션별 구성 상품 설정</h5>
                    
                    <div className="mb-6 relative group">
                      <div className="flex items-center border border-neutral-300 bg-white focus-within:border-neutral-900 transition-colors overflow-hidden h-[40px]">
                        <div className="pl-3 flex-shrink-0">
                          <Search className="w-4 h-4 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" />
                        </div>
                        <input
                          type="text"
                          value={optionSearchTerms[opt.id] || ''}
                          onFocus={() => {
                            setActiveOptionId(opt.id);
                            setIsOptionSearchDropdownOpen(true);
                          }}
                          onChange={(e) => {
                            setActiveOptionId(opt.id);
                            setOptionSearchTerms(prev => ({ ...prev, [opt.id]: e.target.value }));
                          }}
                          placeholder="구성 상품명 또는 SKU로 검색하여 추가"
                          className="flex-1 w-full px-3 py-2 border-0 focus:ring-0 text-sm bg-transparent placeholder:text-neutral-400 outline-none"
                        />
                      </div>

                      {activeOptionId === opt.id && isOptionSearchDropdownOpen && (searchResults || []).length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 shadow-2xl z-50 overflow-hidden max-h-[400px] overflow-y-auto">
                          {(searchResults || []).map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => addItemToOption(opt.id, product)}
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
                          ))}
                        </div>
                      )}
                    </div>


                    {/* Items Table for this Option */}
                    <div className="overflow-hidden border border-neutral-200">
                      <table className="w-full text-xs">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-bold text-neutral-700 uppercase tracking-tight">옵션 구성 상품명</th>
                            <th className="px-4 py-3 text-right font-bold text-neutral-700 uppercase tracking-tight w-40 pr-6">금액 설정</th>
                            <th className="px-4 py-3 text-center font-bold text-neutral-700 uppercase tracking-tight w-32">선택수량</th>
                            <th className="px-4 py-3 text-center font-bold text-neutral-700 uppercase tracking-tight w-12">삭제</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 border-b border-neutral-100">
                          {(opt.items || []).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-10 text-center text-xs text-neutral-400">검색을 호출하여 상품을 추가해 주세요.</td>
                            </tr>
                          ) : (
                            (opt.items || []).map((item) => (
                              <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-neutral-900 text-[13px]">{item.name}</span>
                                    <span className="text-[10px] text-neutral-500">{item.sku}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors overflow-hidden h-[34px]">
                                    <input
                                      type="text"
                                      value={formatWithCommas(item.priceOverride)}
                                      onChange={(e) => updateItemInOption(opt.id, item.id, 'priceOverride', e.target.value)}
                                      className="flex-1 w-full pl-3 pr-1 py-1 text-right border-0 focus:ring-0 text-xs bg-transparent outline-none font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-500 font-bold whitespace-nowrap bg-neutral-100 flex items-center px-3 h-full border-l border-neutral-200 select-none min-w-[2.5rem] justify-center uppercase">원</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors overflow-hidden h-[34px]">
                                    <input
                                      type="text"
                                      value={item.maxQuantity}
                                      onChange={(e) => updateItemInOption(opt.id, item.id, 'maxQuantity', e.target.value.replace(/[^0-9]/g, ''))}
                                      className="flex-1 w-full pl-2 pr-1 py-1 text-center border-0 focus:ring-0 text-xs bg-transparent outline-none font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-500 font-bold whitespace-nowrap bg-neutral-100 flex items-center px-3 h-full border-l border-neutral-200 select-none min-w-[2.5rem] justify-center uppercase">개</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeItemFromOption(opt.id, item.id)}
                                    className="text-neutral-400 hover:text-red-500 transition-colors"
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
              ))
            )}
          </div>
        </div>

        {/* Bonus Products Section */}
        <div className="bg-white border border-neutral-200 overflow-visible">
          <div className="px-8 py-6 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-lg font-bold text-neutral-900 border-l-4 border-neutral-900 pl-3">추가 증정 상품</h3>
          </div>
          <div className="p-8 space-y-8">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">상품 검색 및 추가</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={bonusSearchTerm}
                  onChange={(e) => setBonusSearchTerm(e.target.value)}
                  placeholder="상품명, 상품코드로 검색"
                  className="w-full pl-12 pr-4 py-3 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                />
                
                {isBonusDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 shadow-2xl z-50 overflow-hidden max-h-[500px] overflow-y-auto">
                    {(bonusSearchResults || []).length > 0 ? (
                      (bonusSearchResults || []).map((product) => (
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
            </div>

            <div>
              <h4 className="text-sm font-medium text-neutral-900 mb-2">추가된 상품 목록</h4>
              <div className="border border-neutral-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 font-medium text-neutral-700">상품 정보</th>
                    <th className="px-4 py-3 font-medium text-neutral-700 w-32">금액</th>
                    <th className="px-4 py-3 font-medium text-neutral-700 w-48 text-center">계산 방법</th>
                    <th className="px-4 py-3 font-medium text-neutral-700 w-32 text-center">증정 수량</th>
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
                              className="w-24 text-right px-2 py-1 border border-neutral-300 focus:border-neutral-900 focus:outline-none rounded-sm text-sm"
                            />
                            <span className="text-neutral-500 text-xs">원</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2 items-center justify-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={item.calculationMethod === 'fixed'}
                                onChange={() => updateBonusProduct(item.id, 'calculationMethod', 'fixed')}
                                className="w-3.5 h-3.5 accent-neutral-900"
                              />
                              <span className="text-xs">직접입력</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={item.calculationMethod === 'ratio'}
                                onChange={() => updateBonusProduct(item.id, 'calculationMethod', 'ratio')}
                                className="w-3.5 h-3.5 accent-neutral-900"
                              />
                              <span className="text-xs">비율계산</span>
                            </label>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center justify-center gap-1">
                            {item.calculationMethod === 'fixed' ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={item.quantity}
                                  onChange={(e) => updateBonusProduct(item.id, 'quantity', e.target.value)}
                                  className="w-16 text-center py-1 border border-neutral-300 focus:border-neutral-900 focus:outline-none rounded-sm"
                                />
                                <span className="text-neutral-500 text-xs">개</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={item.percentage}
                                    onChange={(e) => updateBonusProduct(item.id, 'percentage', e.target.value)}
                                    className="w-16 text-center py-1 border border-neutral-300 focus:border-neutral-900 focus:outline-none rounded-sm"
                                  />
                                  <span className="text-neutral-500 text-xs">%</span>
                                </div>
                                <span className="text-[10px] text-blue-600 font-medium">구매량 비례</span>
                              </div>
                            )}
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
        </div>

        {/* Product Description Section */}
        <div className="bg-white border border-neutral-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-lg font-bold text-neutral-900 border-l-4 border-neutral-900 pl-3">상품 설명</h3>
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

        {/* Action Buttons - Sticky Layer at the bottom */}
        <div className="sticky bottom-0 z-50 bg-white/90 backdrop-blur-md border-t border-neutral-200 py-8 px-8 -mx-8 mt-12 flex items-center justify-end gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={() => navigate('/admin/products/package')}
            disabled={isSubmitting}
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
            <span>{isEditMode ? '수정 완료' : '등록 완료'}</span>
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
                    navigate('/admin/products/package');
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
