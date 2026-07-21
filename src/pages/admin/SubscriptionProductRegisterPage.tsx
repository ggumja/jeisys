import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, ImageIcon, X, Plus, Trash2, Search, Loader2, Package, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { RichTextEditor } from '../../components/RichTextEditor';
import { useProduct, useProducts, useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { productService, ProductInput } from '../../services/productService';
import { equipmentService, EquipmentModel } from '../../services/equipmentService';
import { Product, RoundCombination, SubscriptionProductOption, QuantityDiscountTier } from '../../types';
import { ADMIN_STYLES } from '../../constants/adminStyles';
import {
  subscriptionProductOptionService,
  generateRoundCombinations,
  combinationLabel,
} from '../../services/subscriptionProductOptionService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

// ─────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────
const formatWithCommas = (value: string | number) => {
  if (value === undefined || value === null || value === '') return '';
  const s = value.toString().replace(/,/g, '');
  if (isNaN(Number(s))) return s;
  return Number(s).toLocaleString('ko-KR');
};
const unformat = (v: string) => v.replace(/,/g, '');

const CYCLE_LABELS: Record<number, string> = { 1: '1개월', 2: '2개월', 3: '3개월', 4: '4개월', 6: '6개월' };

// ─────────────────────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────────────────────
interface BonusProductData {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: string;
  quantity: string;
  imageUrl: string;
  calculationMethod: 'fixed' | 'ratio';
  percentage: string;
}

interface OptionDraft {
  id: string;
  optionLabel: string;
  totalQuantity: number | '';
  discountRate: number | '';
  selectedCombinations: RoundCombination[];
  isExpanded: boolean;
}

function newOption(): OptionDraft {
  return {
    id: crypto.randomUUID(),
    optionLabel: '',
    totalQuantity: '',
    discountRate: 0,
    selectedCombinations: [],
    isExpanded: true,
  };
}

// 기본 구간 할인율
const DEFAULT_TIERS: QuantityDiscountTier[] = [
  { minQty: 0,   maxQty: 49,  discountRate: 0  },
  { minQty: 50,  maxQty: 99,  discountRate: 10 },
  { minQty: 100, maxQty: 199, discountRate: 15 },
  { minQty: 200, maxQty: 299, discountRate: 18 },
];

// 수량으로 해당 구간 할인율 조회
function getDiscountRateForQty(qty: number, tiers: QuantityDiscountTier[]): number {
  if (!qty || tiers.length === 0) return 0;
  const tier = [...tiers].sort((a, b) => a.minQty - b.minQty)
    .find(t => qty >= t.minQty && qty <= t.maxQty);
  return tier?.discountRate ?? 0;
}

interface FormData {
  name: string;
  category: string;
  productCode: string;
  sapSku: string;
  manufacturer: string;
  price: string;
  stock: string;
  status: 'active' | 'inactive';
  isVisible: boolean;
  creditAvailable: boolean;
  pointsAvailable: boolean;
  description: string;
  useSubscriptionDiscount: boolean;
  subscriptionDiscount: string;
  minOrderQuantity: string;
  maxOrderQuantity: string;
  bonusProducts: BonusProductData[];
}

// ─────────────────────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────────────────────
export function SubscriptionProductRegisterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const { data: existingProduct, isLoading: isLoadingProduct } = useProduct(id || '');
  const { data: categories = [] } = useCategories();
  const { data: allProducts = [], isLoading: isLoadingProducts } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    productCode: '',
    sapSku: '',
    manufacturer: '',
    price: '',
    stock: '9999',
    status: 'active',
    isVisible: true,
    creditAvailable: false,
    pointsAvailable: false,
    description: '',
    useSubscriptionDiscount: false,
    subscriptionDiscount: '',
    minOrderQuantity: '1',
    maxOrderQuantity: '0',
    bonusProducts: [],
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [equipmentModels, setEquipmentModels] = useState<EquipmentModel[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // 구독 옵션
  const [subOptions, setSubOptions] = useState<OptionDraft[]>([newOption()]);

  // 수량 구간별 할인율
  const [discountTiers, setDiscountTiers] = useState<QuantityDiscountTier[]>(DEFAULT_TIERS);

  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'success' | 'error';
  }>({ isOpen: false, title: '', description: '', type: 'success' });

  // 장비 모델 로드
  useEffect(() => {
    equipmentService.getEquipmentModels().then(setEquipmentModels).catch(console.error);
  }, []);

  // 수정 모드: 장비 호환성 로드
  useEffect(() => {
    if (isEditMode && id) {
      productService.getProductCompatibilityIds(id).then(setSelectedEquipmentIds).catch(console.error);
    }
  }, [isEditMode, id]);

  // 수정 모드: 기존 상품 로드
  useEffect(() => {
    if (isEditMode && existingProduct) {
      setFormData({
        name: existingProduct.name || '',
        category: existingProduct.category || '',
        productCode: existingProduct.sku || '',
        sapSku: existingProduct.sapSku || '',
        manufacturer: existingProduct.manufacturer || '',
        price: formatWithCommas(existingProduct.price || 0),
        stock: formatWithCommas(existingProduct.stock || 9999),
        status: existingProduct.isActive !== false ? 'active' : 'inactive',
        isVisible: existingProduct.isVisible !== false,
        creditAvailable: existingProduct.creditAvailable ?? false,
        pointsAvailable: existingProduct.pointsAvailable ?? false,
        description: existingProduct.description || '',
        useSubscriptionDiscount: (existingProduct.subscriptionDiscount ?? 0) > 0,
        subscriptionDiscount: formatWithCommas(existingProduct.subscriptionDiscount || 0),
        minOrderQuantity: formatWithCommas(existingProduct.minOrderQuantity || 1),
        maxOrderQuantity: formatWithCommas(existingProduct.maxOrderQuantity || 0),
        bonusProducts: existingProduct.bonusItems?.filter((item: any) => !item.optionId).map((item: any) => ({
          id: item.id,
          productId: item.productId,
          name: item.product?.name || '',
          sku: item.product?.sku || '',
          price: formatWithCommas(item.priceOverride ?? item.product?.price ?? 0),
          quantity: formatWithCommas(item.quantity || 0),
          imageUrl: item.product?.imageUrl || '',
          calculationMethod: item.calculationMethod || 'fixed',
          percentage: formatWithCommas(item.percentage || 0),
        })) || [],
      });
      if (existingProduct.imageUrl) setThumbnailPreview(existingProduct.imageUrl);
    }
  }, [isEditMode, existingProduct]);

  // 수정 모드: 기존 구독 옵션 로드
  useEffect(() => {
    if (isEditMode && id) {
      subscriptionProductOptionService.getOptionsByProduct(id).then((opts) => {
        if (opts.length > 0) {
          setSubOptions(opts.map((o) => ({
            id: crypto.randomUUID(),
            optionLabel: o.optionLabel,
            totalQuantity: o.totalQuantity,
            discountRate: o.discountRate,
            selectedCombinations: o.roundCombinations,
            isExpanded: false,
          })));
        }
      }).catch(console.error);
    }
  }, [isEditMode, id]);

  // 수정 모드: 기존 수량 구간 할인율 로드
  useEffect(() => {
    if (isEditMode && existingProduct?.quantityDiscountTiers && existingProduct.quantityDiscountTiers.length > 0) {
      setDiscountTiers(existingProduct.quantityDiscountTiers);
    }
  }, [isEditMode, existingProduct]);

  // 구간 할인율 CRUD
  const addTier = () => setDiscountTiers(prev => [...prev, { minQty: 0, maxQty: 999, discountRate: 0 }]);
  const removeTier = (idx: number) => setDiscountTiers(prev => prev.filter((_, i) => i !== idx));
  const updateTier = (idx: number, key: keyof QuantityDiscountTier, val: number) =>
    setDiscountTiers(prev => prev.map((t, i) => i === idx ? { ...t, [key]: val } : t));

  // 총수량 변경 핸들러: 구간 할인율 자동 계산 후 옵션 업데이트
  const handleTotalQtyChange = (optId: string, qty: number | '') => {
    const numQty = typeof qty === 'number' ? qty : 0;
    const autoRate = numQty > 0 ? getDiscountRateForQty(numQty, discountTiers) : 0;
    setSubOptions(prev => prev.map(o =>
      o.id === optId ? { ...o, totalQuantity: qty, discountRate: autoRate, selectedCombinations: [] } : o
    ));
  };

  // ─── 상품 검색 ───
  const filteredSearchProducts = (allProducts || []).filter((p) => {
    const s = searchTerm.toLowerCase().trim();
    if (!s) return false;
    return (
      p.id !== id &&
      ((p.name || '').toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s)) &&
      !formData.bonusProducts.some((bp) => bp.productId === p.id)
    );
  }).slice(0, 20);

  const addBonusProduct = (product: Product) => {
    setFormData((prev) => ({
      ...prev,
      bonusProducts: [...prev.bonusProducts, {
        id: Date.now().toString(),
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: '0',
        quantity: '1',
        imageUrl: product.imageUrl,
        calculationMethod: 'fixed',
        percentage: '0',
      }],
    }));
    setSearchTerm('');
    setIsSearchDropdownOpen(false);
  };

  const removeBonusProduct = (bId: string) =>
    setFormData((prev) => ({ ...prev, bonusProducts: prev.bonusProducts.filter((p) => p.id !== bId) }));

  const updateBonusProduct = (bId: string, field: keyof BonusProductData, value: string) => {
    const numericFields = ['quantity', 'price', 'percentage'];
    const processed = numericFields.includes(field) ? formatWithCommas(value.replace(/[^0-9]/g, '')) : value;
    setFormData((prev) => ({
      ...prev,
      bonusProducts: prev.bonusProducts.map((p) => (p.id === bId ? { ...p, [field]: processed } : p)),
    }));
  };

  // ─── Input handler ───
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = ['price', 'stock', 'subscriptionDiscount', 'minOrderQuantity', 'maxOrderQuantity'];
    if (numericFields.includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: formatWithCommas(value.replace(/[^0-9]/g, '')) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ─── 이미지 ───
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileList = Array.from(files);
    if (additionalImages.length + fileList.length > 5) {
      setResultModal({ isOpen: true, title: '이미지 초과', description: '추가 이미지는 최대 5개까지 등록 가능합니다.', type: 'error' });
      return;
    }
    setAdditionalFiles((prev) => [...prev, ...fileList]);
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setAdditionalImages((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
    setAdditionalFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── 구독 옵션 ───
  const addSubOption = () => setSubOptions((prev) => [...prev, newOption()]);
  const removeSubOption = (optId: string) => setSubOptions((prev) => prev.filter((o) => o.id !== optId));
  const updateSubOption = <K extends keyof OptionDraft>(optId: string, key: K, val: OptionDraft[K]) =>
    setSubOptions((prev) => prev.map((o) => (o.id === optId ? { ...o, [key]: val } : o)));

  const toggleCombination = (optId: string, combo: { cycleMonths: number; qtyPerRound: number; totalRounds: number }) => {
    setSubOptions((prev) =>
      prev.map((o) => {
        if (o.id !== optId) return o;
        const exists = o.selectedCombinations.some(
          (c) => c.cycleMonths === combo.cycleMonths && c.qtyPerRound === combo.qtyPerRound && c.totalRounds === combo.totalRounds,
        );
        const next = exists
          ? o.selectedCombinations.filter(
              (c) => !(c.cycleMonths === combo.cycleMonths && c.qtyPerRound === combo.qtyPerRound && c.totalRounds === combo.totalRounds),
            )
          : [...o.selectedCombinations, combo as RoundCombination];
        return { ...o, selectedCombinations: next };
      }),
    );
  };

  // ─── 카테고리 렌더 ───
  const renderCategoryOptions = (parentId: string | null = null, level: number = 0): JSX.Element[] =>
    categories
      .filter((cat) => cat.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .flatMap((cat) => [
        <option key={cat.id} value={cat.name}>
          {'\u00A0'.repeat(level * 4)}{level > 0 ? '└ ' : ''}{cat.name}
        </option>,
        ...renderCategoryOptions(cat.id, level + 1),
      ]);

  // ─── 저장 ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price) {
      setResultModal({ isOpen: true, title: '필수 항목 누락', description: '상품명, 카테고리, 가격은 필수 입력 항목입니다.', type: 'error' });
      return;
    }
    if (subOptions.some((o) => !o.optionLabel.trim())) {
      setResultModal({ isOpen: true, title: '옵션 오류', description: '모든 구독 옵션의 표기명을 입력해주세요.', type: 'error' });
      return;
    }
    if (subOptions.some((o) => !o.totalQuantity || Number(o.totalQuantity) <= 0)) {
      setResultModal({ isOpen: true, title: '옵션 오류', description: '모든 구독 옵션의 총 수량을 입력해주세요.', type: 'error' });
      return;
    }
    if (subOptions.some((o) => o.selectedCombinations.length === 0)) {
      setResultModal({ isOpen: true, title: '옵션 오류', description: '각 옵션에 회차 조합을 1개 이상 선택해주세요.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    let newlyCreatedProductId: string | null = null; // 롤백용 추적

    try {
      // 1. 대표 이미지
      let finalImageUrl: string | null = thumbnailPreview || null;
      if (thumbnailFile) {
        finalImageUrl = await productService.uploadProductImage(thumbnailFile);
      }

      // 2. 카테고리 계층
      const selectedCat = categories.find((c) => c.name === formData.category);
      let finalCategory = formData.category;
      let finalSubcategory: string | undefined;
      if (selectedCat?.parentId) {
        const parentCat = categories.find((c) => c.id === selectedCat.parentId);
        if (parentCat) { finalCategory = parentCat.name; finalSubcategory = selectedCat.name; }
      }

      const productData: ProductInput = {
        sku: formData.productCode || `SUB-${Date.now()}`,
        sap_sku: formData.sapSku,
        manufacturer: formData.manufacturer,
        name: formData.name,
        category: finalCategory,
        subcategory: finalSubcategory,
        price: parseFloat(unformat(formData.price)),
        stock: parseInt(unformat(formData.stock)) || 9999,
        description: formData.description,
        image_url: finalImageUrl,
        is_package: false,
        is_active: formData.status === 'active',
        is_visible: formData.isVisible,
        credit_available: formData.creditAvailable,
        points_available: formData.pointsAvailable,
        subscription_discount: formData.useSubscriptionDiscount ? parseFloat(unformat(formData.subscriptionDiscount)) || 0 : 0,
        min_order_quantity: parseInt(unformat(formData.minOrderQuantity)) || 1,
        max_order_quantity: parseInt(unformat(formData.maxOrderQuantity)) > 0 ? parseInt(unformat(formData.maxOrderQuantity)) : undefined,
        is_subscription_product: true,
        product_type: 'subscription',
        quantity_discount_tiers: discountTiers,
      };

      let productId: string;
      if (isEditMode && id) {
        await updateProduct.mutateAsync({ id, data: productData });
        productId = id;
      } else {
        const newProduct = await createProduct.mutateAsync(productData);
        productId = newProduct.id;
        newlyCreatedProductId = productId; // 롤백 대상 추적
      }

      // 3. 추가 이미지
      const existingUrls = additionalImages.filter((img) => img.startsWith('http'));
      const newUploadedUrls = await Promise.all(additionalFiles.map((f) => productService.uploadProductImage(f)));
      const allUrls = [...existingUrls, ...newUploadedUrls];
      if (isEditMode) await productService.deleteProductImages(productId);
      if (allUrls.length > 0) await productService.addProductImages(productId, allUrls);

      // 4. 추가 증정 상품
      const allBonusItems = formData.bonusProducts.map((bp) => ({
        bonusProductId: bp.productId,
        quantity: parseInt(unformat(bp.quantity)) || 1,
        priceOverride: Number(unformat(bp.price)) || null, // 0이면 null로
        optionId: null,
        calculationMethod: bp.calculationMethod,
        percentage: parseFloat(unformat(bp.percentage)) || 0,
      }));
      console.log('[SubscriptionRegister] bonusItems to save:', allBonusItems);
      try {
        await productService.addBonusItems(productId, allBonusItems);
      } catch (bonusErr: any) {
        console.error('[SubscriptionRegister] addBonusItems error:', bonusErr);
        throw new Error(`추가 증정 상품 저장 실패: ${bonusErr.message || bonusErr}`);
      }

      // 5. 장비 호환성
      await productService.saveProductCompatibility(productId, selectedEquipmentIds);

      // 6. 구독 옵션
      await subscriptionProductOptionService.saveOptions(
        productId,
        subOptions.map((opt, idx) => ({
          optionLabel: opt.optionLabel,
          totalQuantity: Number(opt.totalQuantity),
          discountRate: Number(opt.discountRate) || 0,
          roundCombinations: opt.selectedCombinations,
          displayOrder: idx,
          isActive: true,
        })),
      );

      // 모두 성공 → 롤백 불필요
      newlyCreatedProductId = null;

      queryClient.invalidateQueries({ queryKey: ['products'] });

      if (isEditMode) {
        navigate('/admin/products/subscription');
      } else {
        setResultModal({ isOpen: true, title: '등록 완료', description: '정기구독 상품이 등록되었습니다.', type: 'success' });
      }
    } catch (error: any) {
      console.error('[SubscriptionProductRegister] error:', error);

      // ── 신규 등록 중 실패 시 생성된 상품 롤백 ──
      if (newlyCreatedProductId) {
        try {
          await productService.deleteProduct(newlyCreatedProductId);
          console.info('[Rollback] 상품 삭제 완료:', newlyCreatedProductId);
        } catch (rollbackErr) {
          console.error('[Rollback] 상품 삭제 실패:', rollbackErr);
        }
      }

      let msg = error.message || '저장 중 오류가 발생했습니다.';
      if (error.code === '23505') msg = '이미 존재하는 상품 코드(SKU)입니다. 다른 코드를 입력해주세요.';
      if (msg.includes('subscription_product_options') || msg.includes('does not exist')) {
        msg = 'DB 테이블이 준비되지 않았습니다.\nSupabase SQL Editor에서 20260721_subscription_product_options.sql을 실행해주세요.';
      }
      setResultModal({ isOpen: true, title: '저장 실패', description: msg, type: 'error' });
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
    <div className={ADMIN_STYLES.PAGE_CONTAINER}>
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/products/subscription')} className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2 font-medium">
            {isEditMode ? '정기구독 상품 수정' : '정기구독 상품 등록'}
          </h2>
          <p className="text-sm text-neutral-600">
            {isEditMode ? '기존 구독 상품 정보를 수정합니다' : '구독 옵션과 회차 조합을 설정합니다'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ══════ 상품 이미지 설정 ══════ */}
        <div className={ADMIN_STYLES.CARD}>
          <div className={ADMIN_STYLES.SECTION_TITLE}>
            <h3 className="text-lg font-bold">상품 이미지 설정</h3>
            <span className="text-xs text-neutral-500 font-medium ml-4">대표 이미지 1장 + 추가 이미지 최대 5장</span>
          </div>

          <div className="flex flex-row flex-wrap gap-4 items-start">
            {/* 대표 이미지 */}
            <div
              className="w-40 h-40 border-2 border-dashed border-neutral-200 flex items-center justify-center bg-neutral-50 relative overflow-hidden cursor-pointer hover:bg-white hover:border-neutral-900 transition-all group shadow-sm"
              onClick={() => document.getElementById('thumbnail-upload')?.click()}
            >
              {thumbnailPreview ? (
                <>
                  <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 left-0 px-2 py-0.5 bg-neutral-900 text-white text-[9px] font-black uppercase tracking-widest shadow-md">Main</div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setThumbnailPreview(null); setThumbnailFile(null); }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 z-10 shadow-md ring-2 ring-white">
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="text-center group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto mb-1 group-hover:text-neutral-900" />
                  <p className="text-[10px] text-neutral-400 font-bold group-hover:text-neutral-900 leading-tight">대표<br />이미지 업로드</p>
                </div>
              )}
              <input id="thumbnail-upload" type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
            </div>

            {/* 추가 이미지 */}
            {additionalImages.map((image, index) => (
              <div key={index} className="w-40 h-40 border border-neutral-200 relative overflow-hidden group bg-neutral-50 shadow-sm">
                <img src={image} alt={`Detail ${index + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <button type="button" onClick={() => removeAdditionalImage(index)}
                  className="absolute top-1 right-1 w-5 h-5 bg-neutral-900/80 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10 ring-2 ring-white">
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute top-0 left-0 bg-neutral-400/80 text-white text-[9px] px-1.5 py-0.5 font-bold">Detail {index + 1}</div>
              </div>
            ))}

            {additionalImages.length < 5 && (
              <label className="w-40 h-40 border-2 border-dashed border-neutral-200 flex items-center justify-center bg-neutral-50/30 cursor-pointer hover:bg-white hover:border-neutral-900 transition-all group shadow-inner">
                <div className="text-center group-hover:scale-105 transition-transform">
                  <Plus className="w-6 h-6 text-neutral-300 mx-auto mb-1 group-hover:text-neutral-900" />
                  <p className="text-[10px] text-neutral-400 font-bold group-hover:text-neutral-900 leading-tight">추가 이미지<br />업로드</p>
                </div>
                <input type="file" accept="image/*" multiple onChange={handleAdditionalImagesChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="mt-4 flex items-center gap-6 text-[10px] text-neutral-400 italic bg-neutral-50 p-2 border border-neutral-100">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-neutral-300 rounded-full" /> 800×800px 권장, 최대 5MB</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-neutral-300 rounded-full" /> 상세페이지 갤러리에 순서대로 노출됩니다 (최대 5장)</span>
          </div>
        </div>

        {/* ══════ 기본 정보 ══════ */}
        <div className={ADMIN_STYLES.CARD}>
          <h3 className={ADMIN_STYLES.SECTION_TITLE}>기본 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>상품명 <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="상품명을 입력하세요" className={ADMIN_STYLES.INPUT} required />
            </div>
            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>카테고리 <span className="text-red-500">*</span></label>
              <select name="category" value={formData.category} onChange={handleInputChange} className={ADMIN_STYLES.INPUT} required>
                <option value="">카테고리 선택</option>
                {renderCategoryOptions()}
              </select>
            </div>
            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>상품코드 <span className="text-red-500">*</span></label>
              <input type="text" name="productCode" value={formData.productCode} onChange={handleInputChange} placeholder="상품코드를 입력하세요" className={ADMIN_STYLES.INPUT} required />
            </div>
            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>SAP SKU (ERP 매핑용)</label>
              <input type="text" name="sapSku" value={formData.sapSku} onChange={handleInputChange} placeholder="SAP 품번을 입력하세요" className={ADMIN_STYLES.INPUT} />
            </div>
            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>제조사</label>
              <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleInputChange} placeholder="제조사를 입력하세요" className={ADMIN_STYLES.INPUT} />
            </div>
            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>판매가 <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type="text" name="price" value={formData.price} onChange={handleInputChange} placeholder="판매가를 입력하세요" className={ADMIN_STYLES.INPUT + ' text-right pr-16 font-bold'} required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 font-bold">원</span>
              </div>
            </div>
            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>최대 주문 수량</label>
              <div className="relative">
                <input type="text" name="maxOrderQuantity" value={formData.maxOrderQuantity} onChange={handleInputChange} className={ADMIN_STYLES.INPUT + ' text-right pr-16 font-bold'} placeholder="제한 없음" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 font-bold uppercase">개</span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 italic">* 주문 시 허용되는 최대 수량 (0 입력 시 제한 없음)</p>
            </div>
            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>재고 수량</label>
              <div className="relative">
                <input type="text" name="stock" value={formData.stock} onChange={handleInputChange} placeholder="재고 수량을 입력하세요" className={ADMIN_STYLES.INPUT + ' text-right pr-16 font-bold'} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 font-bold uppercase">개</span>
              </div>
            </div>
            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>판매 상태</label>
              <div className="flex gap-6 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="status" value="active" checked={formData.status === 'active'} onChange={() => setFormData((p) => ({ ...p, status: 'active' }))} className="w-4 h-4 accent-neutral-900 cursor-pointer" />
                  <span className="text-sm text-neutral-900">판매중</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="status" value="inactive" checked={formData.status === 'inactive'} onChange={() => setFormData((p) => ({ ...p, status: 'inactive' }))} className="w-4 h-4 accent-neutral-900 cursor-pointer" />
                  <span className="text-sm text-neutral-900">판매중지</span>
                </label>
              </div>
            </div>
            <div>
              <label className={ADMIN_STYLES.SECTION_LABEL}>노출 여부 (고객 화면)</label>
              <div className="flex gap-6 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="isVisible" value="true" checked={formData.isVisible === true} onChange={() => setFormData((p) => ({ ...p, isVisible: true }))} className="w-4 h-4 accent-neutral-900 cursor-pointer" />
                  <span className="text-sm text-neutral-900">노출</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="isVisible" value="false" checked={formData.isVisible === false} onChange={() => setFormData((p) => ({ ...p, isVisible: false }))} className="w-4 h-4 accent-neutral-900 cursor-pointer" />
                  <span className="text-sm text-neutral-900">미노출</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ══════ 호환 장비 설정 ══════ */}
        <div className={ADMIN_STYLES.CARD}>
          <div className={ADMIN_STYLES.SECTION_TITLE}>
            <h3 className="text-lg font-bold">호환 장비 설정</h3>
            <span className="text-xs text-neutral-500 font-normal">크레딧 장비별 적용 대상을 지정합니다</span>
          </div>
          {equipmentModels.length === 0 ? (
            <p className="text-sm text-neutral-400">등록된 장비 모델이 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {equipmentModels.map((eq) => {
                const checked = selectedEquipmentIds.includes(eq.id);
                return (
                  <label key={eq.id} className={`flex items-center gap-1.5 px-3 py-1.5 border cursor-pointer transition-all select-none ${checked ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-700 hover:border-neutral-500'}`}>
                    <input type="checkbox" checked={checked} onChange={(e) => setSelectedEquipmentIds((prev) => e.target.checked ? [...prev, eq.id] : prev.filter((i) => i !== eq.id))} className="sr-only" />
                    <span className="text-xs font-bold">{eq.model_name}</span>
                  </label>
                );
              })}
            </div>
          )}
          <p className="text-xs text-neutral-400 mt-3">선택한 장비의 크레딧을 해당 상품 구매 시 사용할 수 있습니다.</p>
        </div>

        {/* ══════ 주문 옵션 ══════ */}
        <div className={ADMIN_STYLES.CARD}>
          <h3 className={ADMIN_STYLES.SECTION_TITLE}>주문 옵션</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className={ADMIN_STYLES.SECTION_LABEL}>크레딧 사용 가능여부</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="creditAvailable" checked={formData.creditAvailable === true} onChange={() => setFormData((p) => ({ ...p, creditAvailable: true }))} className="w-4 h-4 accent-neutral-900 cursor-pointer" /><span className="text-sm text-neutral-900">가능</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="creditAvailable" checked={formData.creditAvailable === false} onChange={() => setFormData((p) => ({ ...p, creditAvailable: false }))} className="w-4 h-4 accent-neutral-900 cursor-pointer" /><span className="text-sm text-neutral-900">불가능</span></label>
              </div>
              <p className="text-[10px] text-neutral-400 italic">해당 상품 구매 시 크레딧 사용 가능 여부를 설정합니다</p>
            </div>
            <div className="space-y-4">
              <label className={ADMIN_STYLES.SECTION_LABEL}>적립금 사용 가능여부</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="pointsAvailable" checked={formData.pointsAvailable === true} onChange={() => setFormData((p) => ({ ...p, pointsAvailable: true }))} className="w-4 h-4 accent-neutral-900 cursor-pointer" /><span className="text-sm text-neutral-900">가능</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="pointsAvailable" checked={formData.pointsAvailable === false} onChange={() => setFormData((p) => ({ ...p, pointsAvailable: false }))} className="w-4 h-4 accent-neutral-900 cursor-pointer" /><span className="text-sm text-neutral-900">불가능</span></label>
              </div>
              <p className="text-[10px] text-neutral-400 italic">해당 상품 구매 시 적립금 사용 가능 여부를 설정합니다</p>
            </div>
          </div>
        </div>


        {/* ══════ 수량 구간별 할인율 설정 ══════ */}
        <div className={ADMIN_STYLES.CARD}>
          <div className={ADMIN_STYLES.SECTION_TITLE}>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#21358D]" />
              <h3 className="text-lg font-bold">구매 수량별 할인율</h3>
            </div>
            <button type="button" onClick={addTier} className={ADMIN_STYLES.BTN_PRIMARY}>
              <Plus className="w-4 h-4" />
              구간 추가
            </button>
          </div>

          <p className="text-[10px] text-neutral-400 italic mb-4">
            * 구독 옵션의 총 수량 입력 시 해당 구간 할인율이 자동 적용됩니다.<br />
            * 해지 위약금 계산 시 최종 수령 수량 구간의 할인율로 정가가 재산정됩니다.
          </p>

          <div className="border border-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">최소 수량</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">최대 수량</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">할인율 (%)</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {discountTiers.map((tier, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2">
                      <input
                        type="number" min="0"
                        value={tier.minQty}
                        onChange={(e) => updateTier(idx, 'minQty', Number(e.target.value))}
                        className={`${ADMIN_STYLES.INPUT} w-24`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number" min="0"
                        value={tier.maxQty}
                        onChange={(e) => updateTier(idx, 'maxQty', Number(e.target.value))}
                        className={`${ADMIN_STYLES.INPUT} w-24`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number" min="0" max="100"
                          value={tier.discountRate}
                          onChange={(e) => updateTier(idx, 'discountRate', Number(e.target.value))}
                          className={`${ADMIN_STYLES.INPUT} w-20`}
                        />
                        <span className="text-neutral-500 text-xs">%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {discountTiers.length > 1 && (
                        <button type="button" onClick={() => removeTier(idx)} className="text-neutral-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ══════ 구독 옵션 설정 ══════ */}
        <div className={ADMIN_STYLES.CARD}>
          <div className={ADMIN_STYLES.SECTION_TITLE}>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#21358D]" />
              <h3 className="text-lg font-bold">구독 옵션 설정</h3>
            </div>
            <button type="button" onClick={addSubOption} className={ADMIN_STYLES.BTN_PRIMARY}>
              <Plus className="w-4 h-4" />
              옵션 추가
            </button>
          </div>

          <p className="text-[10px] text-neutral-400 italic mb-6">
            * 총 수량을 입력하면 회차 조합(예: 20개 × 10회, 25개 × 8회)이 자동 계산됩니다. 체크박스로 노출할 조합을 선택하세요.<br />
            * 옵션 추가 버튼으로 100개 세트, 200개 세트 등 여러 수량 옵션을 등록할 수 있습니다.
          </p>

          <div className="space-y-4">
            {subOptions.map((opt, optIdx) => {
              const qty = Number(opt.totalQuantity) || 0;
              const combos = qty > 0 ? generateRoundCombinations(qty) : [];

              return (
                <div key={opt.id} className="border border-neutral-200 bg-neutral-50/50">
                  {/* 옵션 헤더 */}
                  <div className="flex items-center gap-3 p-4 border-b border-neutral-100">
                    <span className="text-xs font-semibold text-neutral-500 flex-shrink-0">옵션 {optIdx + 1}</span>
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <label className={ADMIN_STYLES.SECTION_LABEL}>옵션 표기명 <span className="text-red-500">*</span></label>
                        <input value={opt.optionLabel} onChange={(e) => updateSubOption(opt.id, 'optionLabel', e.target.value)} placeholder="예) 200개 세트" className={ADMIN_STYLES.INPUT} />
                      </div>
                      <div>
                        <label className={ADMIN_STYLES.SECTION_LABEL}>총 수량 (개) <span className="text-red-500">*</span></label>
                        <input
                          value={opt.totalQuantity}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9]/g, '');
                            handleTotalQtyChange(opt.id, v === '' ? '' : Number(v));
                          }}
                          placeholder="200"
                          className={ADMIN_STYLES.INPUT}
                        />
                      </div>
                      <div>
                        <label className={ADMIN_STYLES.SECTION_LABEL}>
                          할인율 (%)
                          <span className="text-blue-600 font-normal ml-1 text-[10px]">구간 자동계산</span>
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            value={opt.discountRate}
                            onChange={(e) => updateSubOption(opt.id, 'discountRate', Number(e.target.value.replace(/[^0-9.]/g, '')) as any)}
                            placeholder="0"
                            className={`${ADMIN_STYLES.INPUT} bg-blue-50 border-blue-200`}
                          />
                          <span className="text-neutral-500 text-xs">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <button type="button" onClick={() => updateSubOption(opt.id, 'isExpanded', !opt.isExpanded)} className="text-neutral-400 hover:text-neutral-700">
                        {opt.isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {subOptions.length > 1 && (
                        <button type="button" onClick={() => removeSubOption(opt.id)} className="text-neutral-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 회차 조합 선택 그리드 */}
                  {opt.isExpanded && (
                    <div className="p-4">
                      {qty === 0 ? (
                        <p className="text-xs text-neutral-400 text-center py-4">총 수량을 입력하면 회차 조합이 표시됩니다.</p>
                      ) : combos.length === 0 ? (
                        <p className="text-xs text-neutral-400 text-center py-4">해당 수량으로 가능한 조합이 없습니다.</p>
                      ) : (
                        <div>
                          <p className="text-xs font-medium text-neutral-600 mb-3">
                            회차 조합 선택 (고객 화면에 노출됩니다)
                            <span className="text-neutral-400 ml-2 font-normal">· 총 운영기간 12개월 이하 자동 필터</span>
                          </p>
                          <div className="border border-neutral-200 overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-neutral-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 w-20">주기</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">선택 가능한 조합</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100">
                                {combos.map(({ cycleMonths, combinations }) => (
                                  <tr key={cycleMonths}>
                                    <td className="px-3 py-3 text-xs font-medium text-neutral-700 align-top whitespace-nowrap">
                                      {CYCLE_LABELS[cycleMonths]}
                                    </td>
                                    <td className="px-3 py-3">
                                      <div className="flex flex-wrap gap-2">
                                        {combinations.map((combo) => {
                                          const isSelected = opt.selectedCombinations.some(
                                            (c) => c.cycleMonths === cycleMonths && c.qtyPerRound === combo.qtyPerRound && c.totalRounds === combo.totalRounds,
                                          );
                                          return (
                                            <label key={`${cycleMonths}-${combo.qtyPerRound}`} className="flex items-center gap-1.5 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleCombination(opt.id, { cycleMonths: cycleMonths as any, ...combo })}
                                                className="w-3.5 h-3.5 text-[#21358D] border-neutral-300 focus:ring-[#21358D]"
                                              />
                                              <span className={`text-xs ${isSelected ? 'text-[#21358D] font-medium' : 'text-neutral-600'}`}>
                                                {combinationLabel(combo, cycleMonths)}
                                              </span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {opt.selectedCombinations.length > 0 && (
                            <p className="text-xs text-[#21358D] mt-2">✓ {opt.selectedCombinations.length}개 조합 선택됨</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════ 추가 증정 상품 ══════ */}
        <div className={ADMIN_STYLES.CARD}>
          <h3 className={ADMIN_STYLES.SECTION_TITLE}>추가 증정 상품</h3>
          <div className="space-y-6">
            <div className="space-y-3 relative">
              <label className={ADMIN_STYLES.SECTION_LABEL}>상품 검색 및 추가</label>
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-neutral-400 absolute left-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setIsSearchDropdownOpen(true); }}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  placeholder="추가 증정상품에 포함할 상품을 검색하여 추가해 주세요"
                  className={ADMIN_STYLES.INPUT + ' pl-10 h-12'}
                />
              </div>
              {isSearchDropdownOpen && searchTerm.trim() && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-neutral-200 shadow-2xl max-h-[400px] overflow-y-auto">
                  {isLoadingProducts ? (
                    <div className="px-4 py-8 text-center text-neutral-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /><p className="text-sm">상품 정보를 불러오고 있습니다...</p></div>
                  ) : filteredSearchProducts.length > 0 ? (
                    filteredSearchProducts.map((product) => (
                      <button key={product.id} type="button" onClick={() => addBonusProduct(product)}
                        className="w-full px-4 py-2 flex items-center justify-between hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0 text-left">
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900 truncate">{product.name}</span>
                          <span className="text-[10px] text-neutral-400 font-medium flex-shrink-0">({product.sku})</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-sm text-neutral-500 text-center font-medium">검색 결과가 없습니다.</div>
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
                    <th className={ADMIN_STYLES.TABLE_HEADER + ' w-32'}>금액</th>
                    <th className={ADMIN_STYLES.TABLE_HEADER + ' w-48 text-center'}>계산 방법</th>
                    <th className={ADMIN_STYLES.TABLE_HEADER + ' w-32 text-center'}>증정 수량</th>
                    <th className={ADMIN_STYLES.TABLE_HEADER + ' w-20 text-center'}>관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {formData.bonusProducts.length > 0 ? (
                    formData.bonusProducts.map((item) => (
                      <tr key={item.id} className={ADMIN_STYLES.TABLE_ROW_HOVER}>
                        <td className={ADMIN_STYLES.TABLE_CELL}>
                          <div className="flex flex-col">
                            <span className="font-bold text-neutral-900">{item.name}</span>
                            <span className="text-[10px] text-neutral-400 font-medium">{item.sku}</span>
                          </div>
                        </td>
                        <td className={ADMIN_STYLES.TABLE_CELL}>
                          <div className="flex items-center justify-end gap-2">
                            <input type="text" value={item.price} onChange={(e) => updateBonusProduct(item.id, 'price', e.target.value)} className={`${ADMIN_STYLES.INPUT} h-8 w-24 text-right px-2 font-bold`} />
                            <span className="text-neutral-500 text-[10px] font-bold">원</span>
                          </div>
                        </td>
                        <td className={ADMIN_STYLES.TABLE_CELL}>
                          <div className="flex flex-col gap-2 items-center justify-center">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={item.calculationMethod === 'fixed'} onChange={() => updateBonusProduct(item.id, 'calculationMethod', 'fixed')} className="w-3.5 h-3.5 accent-neutral-900" /><span className="text-[10px] font-bold text-neutral-700">고정수량</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={item.calculationMethod === 'ratio'} onChange={() => updateBonusProduct(item.id, 'calculationMethod', 'ratio')} className="w-3.5 h-3.5 accent-neutral-900" /><span className="text-[10px] font-bold text-neutral-700">비율계산</span></label>
                          </div>
                        </td>
                        <td className={ADMIN_STYLES.TABLE_CELL}>
                          <div className="flex flex-col items-center justify-center gap-1">
                            {item.calculationMethod === 'fixed' ? (
                              <div className="flex items-center gap-1">
                                <input type="text" value={item.quantity} onChange={(e) => updateBonusProduct(item.id, 'quantity', e.target.value)} className={`${ADMIN_STYLES.INPUT} h-8 w-16 text-center font-bold`} />
                                <span className="text-neutral-500 text-[10px] font-bold">개</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1">
                                  <input type="text" value={item.percentage} onChange={(e) => updateBonusProduct(item.id, 'percentage', e.target.value)} className={`${ADMIN_STYLES.INPUT} h-8 w-16 text-center font-bold`} />
                                  <span className="text-neutral-500 text-[10px] font-bold">%</span>
                                </div>
                                <span className="text-[9px] text-blue-600 font-black uppercase tracking-tighter">Purchase Ratio</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={ADMIN_STYLES.TABLE_CELL + ' text-center'}>
                          <button type="button" onClick={() => removeBonusProduct(item.id)} className={ADMIN_STYLES.BTN_GHOST}><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500 font-medium">추가된 증정 상품이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ══════ 상품 설명 ══════ */}
        <div className={ADMIN_STYLES.CARD}>
          <h3 className={ADMIN_STYLES.SECTION_TITLE}>상품 설명</h3>
          <div className="border border-neutral-200">
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              onImageUpload={(file) => productService.uploadProductImage(file)}
            />
          </div>
        </div>

        {/* ══════ 하단 버튼 ══════ */}
        <div className="sticky bottom-0 z-50 bg-white/90 backdrop-blur-md border-t border-neutral-200 py-8 px-8 -mx-8 mt-12 flex items-center justify-end gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button type="button" onClick={() => navigate('/admin/products/subscription')} disabled={isSubmitting} className={ADMIN_STYLES.BTN_OUTLINE + ' flex items-center gap-2'}>
            <ArrowLeft className="w-5 h-5" />
            <span>취소</span>
          </button>
          <button type="submit" disabled={isSubmitting} className={ADMIN_STYLES.BTN_PRIMARY + ' flex items-center gap-2'}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
            <span>{isEditMode ? '상품 수정하기' : '상품 등록하기'}</span>
          </button>
        </div>
      </form>

      {/* 결과 모달 */}
      <Dialog open={resultModal.isOpen} onOpenChange={(open) => setResultModal((prev) => ({ ...prev, isOpen: open }))}>
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
                  setResultModal((prev) => ({ ...prev, isOpen: false }));
                  if (resultModal.type === 'success') navigate('/admin/products/subscription');
                }}
                className={`w-full py-4 px-6 font-bold transition-all text-sm tracking-widest uppercase shadow-md hover:shadow-lg active:scale-[0.98] ${
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
