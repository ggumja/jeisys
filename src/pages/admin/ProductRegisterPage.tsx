import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Upload, ImageIcon, X, Plus, Trash2 } from 'lucide-react';
import { RichTextEditor } from '../../components/RichTextEditor';

interface BulkDiscount {
  id: string;
  quantity: string;
  discountRate: string;
}

interface FormData {
  name: string;
  category: string;
  productCode: string;
  manufacturer: string;
  price: string;
  stock: string;
  status: 'active' | 'inactive';
  description: string;
  subscriptionDiscount: string;
  bulkDiscounts: BulkDiscount[];
}

const categoryList = [
  'Density',
  'DLiv',
  'POTENZA',
  'INTRAcel',
  'LinearZ',
  'LinearFirm',
  'ULTRAcel II',
  'LIPOcel II',
  'IntraGen',
  '기타소모품',
];

// Mock data for editing
const mockProducts = [
  {
    id: '1',
    name: 'Density HIGH 스킨부스터',
    category: 'Density',
    productCode: 'DNS-001',
    manufacturer: '제이시스메디칼',
    price: '450000',
    stock: '50',
    status: 'active' as const,
    description: 'Density HIGH는 피부 깊숙이 보습과 탄력을 제공하는 프리미엄 스킨부스터입니다.',
    thumbnail: null,
  },
  {
    id: '2',
    name: 'POTENZA 니들 팁 16핀',
    category: 'POTENZA',
    productCode: 'POT-016',
    manufacturer: '제이시스메디칼',
    price: '500000',
    stock: '100',
    status: 'active' as const,
    description: 'POTENZA 전용 16핀 니들 팁으로 정밀한 시술이 가능합니다.',
    thumbnail: null,
  },
  {
    id: '3',
    name: 'ULTRAcel II 카트리지 3.0mm',
    category: 'ULTRAcel II',
    productCode: 'ULT-030',
    manufacturer: '제이시스메디칼',
    price: '250000',
    stock: '80',
    status: 'active' as const,
    description: '3.0mm 깊이의 초음파 에너지를 전달하는 카트리지입니다.',
    thumbnail: null,
  },
  {
    id: '4',
    name: 'LinearZ 앰플 세트',
    category: 'LinearZ',
    productCode: 'LNZ-AMP-SET',
    manufacturer: '제이시스메디칼',
    price: '400000',
    stock: '30',
    status: 'active' as const,
    description: 'LinearZ 시술 후 사용하는 전용 앰플 세트입니다.',
    thumbnail: null,
  },
];

export function ProductRegisterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    productCode: '',
    manufacturer: '',
    price: '',
    stock: '',
    status: 'active',
    description: '',
    subscriptionDiscount: '',
    bulkDiscounts: [],
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);

  useEffect(() => {
    if (isEditMode) {
      const product = mockProducts.find((p) => p.id === id);
      if (product) {
        setFormData({
          name: product.name,
          category: product.category,
          productCode: product.productCode,
          manufacturer: product.manufacturer,
          price: product.price,
          stock: product.stock,
          status: product.status,
          description: product.description,
          subscriptionDiscount: '',
          bulkDiscounts: [],
        });
        if (product.thumbnail) {
          setThumbnailPreview(product.thumbnail);
        }
      }
    }
  }, [id, isEditMode]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      const newImages: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            setAdditionalImages((prev) => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addBulkDiscount = () => {
    const newDiscount: BulkDiscount = {
      id: Date.now().toString(),
      quantity: '',
      discountRate: '',
    };
    setFormData((prev) => ({
      ...prev,
      bulkDiscounts: [...prev.bulkDiscounts, newDiscount],
    }));
  };

  const removeBulkDiscount = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      bulkDiscounts: prev.bulkDiscounts.filter((d) => d.id !== id),
    }));
  };

  const updateBulkDiscount = (id: string, field: 'quantity' | 'discountRate', value: string) => {
    setFormData((prev) => ({
      ...prev,
      bulkDiscounts: prev.bulkDiscounts.map((d) =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.category || !formData.price) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    console.log('Submit:', formData);
    alert(isEditMode ? '상품이 수정되었습니다.' : '상품이 등록되었습니다.');
    navigate('/admin/products');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/products')}
          className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
            {isEditMode ? '상품 수정' : '상품 등록'}
          </h2>
          <p className="text-sm text-neutral-600">
            {isEditMode ? '상품 정보를 수정합니다' : '새로운 상품을 등록합니다'}
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

        {/* Basic Info */}
        <div className="bg-white border border-neutral-200 p-6">
          <h3 className="text-sm font-medium text-neutral-900 mb-4">기본 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                상품명 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="상품명을 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                카테고리 <span className="text-red-600">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              >
                <option value="">카테고리 선택</option>
                {categoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                상품코드
              </label>
              <input
                type="text"
                name="productCode"
                value={formData.productCode}
                onChange={handleInputChange}
                placeholder="상품코드를 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                제조사
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                placeholder="제조사를 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                판매가 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="판매가를 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                재고 수량
              </label>
              <input
                type="text"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="재고 수량을 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                판매 상태
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="active">판매중</option>
                <option value="inactive">판매중지</option>
              </select>
            </div>
          </div>
        </div>

        {/* Discount Settings */}
        <div className="bg-white border border-neutral-200 p-6">
          <h3 className="text-sm font-medium text-neutral-900 mb-6">할인 설정</h3>
          
          {/* Subscription Discount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              정기주문 할인률
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="subscriptionDiscount"
                value={formData.subscriptionDiscount}
                onChange={handleInputChange}
                placeholder="0"
                className="w-32 px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <span className="text-neutral-600">%</span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              정기주문 시 적용되는 할인률을 입력하세요
            </p>
          </div>

          {/* Bulk Discounts */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-3">
              다량주문 할인률
            </label>
            <div className="space-y-3">
              {formData.bulkDiscounts.map((discount, index) => (
                <div key={discount.id} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={discount.quantity}
                    onChange={(e) => updateBulkDiscount(discount.id, 'quantity', e.target.value)}
                    placeholder="0"
                    className="w-32 px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <span className="text-neutral-600">개 이상</span>
                  <input
                    type="text"
                    value={discount.discountRate}
                    onChange={(e) => updateBulkDiscount(discount.id, 'discountRate', e.target.value)}
                    placeholder="0"
                    className="w-32 px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <span className="text-neutral-600">%</span>
                  <button
                    type="button"
                    onClick={() => removeBulkDiscount(discount.id)}
                    className="p-2 border border-neutral-300 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addBulkDiscount}
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>할인 조건 추가</span>
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              구매 수량에 따른 할인률을 설정하세요
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white border border-neutral-200 p-6">
          <h3 className="text-sm font-medium text-neutral-900 mb-4">상품 설명</h3>
          <RichTextEditor
            value={formData.description}
            onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-3 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            {isEditMode ? '수정 완료' : '등록 완료'}
          </button>
        </div>
      </form>
    </div>
  );
}