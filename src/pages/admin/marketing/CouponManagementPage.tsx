import React, { useState, useEffect } from 'react';
import { Tag, Plus, Search, Filter, Edit, Trash2, CheckCircle2, XCircle, Users, Calendar, AlertCircle, Check } from 'lucide-react';
import { couponService } from '../../../services/couponService';
import { Coupon, DiscountType, TargetScope, IssueType, ValidityType } from '../../../types/coupon';
import { useCategories } from '../../../hooks/useCategories';
import { useProducts } from '../../../hooks/useProducts';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';

export function CouponManagementPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('ALL_FILTER');
  const [selectedType, setSelectedType] = useState<string>('ALL_TYPES');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [targetCoupon, setTargetCoupon] = useState<Coupon | null>(null);

  // 등록/수정 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    discountType: 'PERCENTAGE' as DiscountType,
    discountValue: 10,
    targetScope: 'ALL' as TargetScope,
    targetId: '',
    targetName: '',
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    issueType: 'DOWNLOAD' as IssueType,
    validityType: 'DAYS_FROM_ISSUE' as ValidityType,
    startDate: '',
    endDate: '',
    validDays: 30,
  });

  const { data: dbCategories = [] } = useCategories();
  const { data: dbProducts = [] } = useProducts();
  const [equipmentsList, setEquipmentsList] = useState<{ id: string; model_name: string; code: string }[]>([]);
  const [targetSearchTerm, setTargetSearchTerm] = useState('');

  useEffect(() => {
    loadCoupons();
    supabase
      .from('equipments')
      .select('id, model_name, code')
      .order('model_name')
      .then(({ data }) => {
        if (data) setEquipmentsList(data);
      })
      .catch(console.error);
  }, []);

  const handleSelectTargetItem = (id: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      targetId: id,
      targetName: name
    }));
    setTargetSearchTerm(''); // 선택 시 검색 결과 닫힘
  };

  const loadCoupons = () => {
    const list = couponService.getCoupons();
    setCoupons(list);
  };

  const handleOpenRegister = (coupon?: Coupon) => {
    if (coupon) {
      setTargetCoupon(coupon);
      setFormData({
        name: coupon.name,
        code: coupon.code || '',
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        targetScope: coupon.targetScope,
        targetId: coupon.targets?.[0]?.targetId || '',
        targetName: coupon.targets?.[0]?.targetName || '',
        minOrderAmount: coupon.minOrderAmount || 0,
        maxDiscountAmount: coupon.maxDiscountAmount || 0,
        issueType: coupon.issueType,
        validityType: coupon.validityType,
        startDate: coupon.startDate || '',
        endDate: coupon.endDate || '',
        validDays: coupon.validDays || 30,
      });
    } else {
      setTargetCoupon(null);
      setFormData({
        name: '',
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        targetScope: 'ALL',
        targetId: '',
        targetName: '',
        minOrderAmount: 0,
        maxDiscountAmount: 0,
        issueType: 'DOWNLOAD',
        validityType: 'DAYS_FROM_ISSUE',
        startDate: '',
        endDate: '',
        validDays: 30,
      });
    }
    setIsRegisterModalOpen(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('쿠폰명을 입력해주세요.');
      return;
    }

    let targets = undefined;
    if (formData.targetScope !== 'ALL' && formData.targetId) {
      targets = [
        {
          id: `t-${Date.now()}`,
          couponId: targetCoupon ? targetCoupon.id : '',
          targetType: formData.targetScope as any,
          targetId: formData.targetId,
          targetName: formData.targetName || formData.targetId,
          createdAt: new Date().toISOString()
        }
      ];
    }

    if (targetCoupon) {
      couponService.updateCoupon(targetCoupon.id, {
        name: formData.name,
        code: formData.code || undefined,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        targetScope: formData.targetScope,
        minOrderAmount: Number(formData.minOrderAmount),
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
        issueType: formData.issueType,
        validityType: formData.validityType,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        validDays: formData.validDays ? Number(formData.validDays) : undefined,
        targets
      });
      toast.success('쿠폰 정보가 수정되었습니다.');
    } else {
      couponService.createCoupon({
        name: formData.name,
        code: formData.code || undefined,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        targetScope: formData.targetScope,
        minOrderAmount: Number(formData.minOrderAmount),
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
        issueType: formData.issueType,
        validityType: formData.validityType,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        validDays: formData.validDays ? Number(formData.validDays) : undefined,
        isActive: true,
        targets
      });
      toast.success('신규 쿠폰이 등록되었습니다.');
    }

    setIsRegisterModalOpen(false);
    loadCoupons();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('정말 이 쿠폰을 삭제하시겠습니까?')) {
      couponService.deleteCoupon(id);
      toast.success('쿠폰이 삭제되었습니다.');
      loadCoupons();
    }
  };

  const handleToggleActive = (coupon: Coupon) => {
    couponService.updateCoupon(coupon.id, { isActive: !coupon.isActive });
    toast.success(`쿠폰이 ${!coupon.isActive ? '활성화' : '비활성화'} 되었습니다.`);
    loadCoupons();
  };

  const handleIssueToUser = (coupon: Coupon) => {
    setTargetCoupon(coupon);
    setIsIssueModalOpen(true);
  };

  const handleConfirmIssue = (userId: string) => {
    if (!targetCoupon) return;
    couponService.issueCouponToUser(targetCoupon.id, userId);
    toast.success(`회원(${userId})에게 쿠폰이 발급되었습니다.`);
    setIsIssueModalOpen(false);
    loadCoupons();
  };

  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesScope = selectedScope === 'ALL_FILTER' || c.targetScope === selectedScope;
    const matchesType = selectedType === 'ALL_TYPES' || c.discountType === selectedType;
    return matchesSearch && matchesScope && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-neutral-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#21358D]" />
            <h1 className="text-2xl font-bold text-neutral-900">쿠폰 관리</h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            특정 카테고리/장비/상품 한정 할인 쿠폰 등록, 정률/정액 할인 및 유효기간/최소주문금액 조건을 관리합니다.
          </p>
        </div>
        <button
          onClick={() => handleOpenRegister()}
          className="inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 text-sm font-bold transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>신규 쿠폰 등록</span>
        </button>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white p-4 border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="쿠폰명 또는 쿠폰코드로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="px-3 py-2 border border-neutral-200 text-sm bg-neutral-50 font-medium"
          >
            <option value="ALL_FILTER">전체 타겟 범위</option>
            <option value="ALL">전체 상품 적용</option>
            <option value="CATEGORY">특정 카테고리 한정</option>
            <option value="EQUIPMENT">특정 장비 한정</option>
            <option value="PRODUCT">특정 상품 한정</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-neutral-200 text-sm bg-neutral-50 font-medium"
          >
            <option value="ALL_TYPES">전체 할인 방식</option>
            <option value="PERCENTAGE">정률 할인 (%)</option>
            <option value="FIXED_AMOUNT">정액 할인 (원)</option>
          </select>
        </div>
      </div>

      {/* 쿠폰 목록 테이블 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">쿠폰명 / 코드</th>
              <th className="p-4">타겟 범위</th>
              <th className="p-4">할인 혜택</th>
              <th className="p-4">최소 주문금액</th>
              <th className="p-4">최대 할인금액</th>
              <th className="p-4">사용기한 (유효기간)</th>
              <th className="p-4 text-center">발급 수량</th>
              <th className="p-4 text-center">상태</th>
              <th className="p-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredCoupons.length > 0 ? (
              filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-neutral-900 text-sm">{coupon.name}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm ${
                        coupon.issueType === 'AUTO' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        coupon.issueType === 'DOWNLOAD' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        'bg-neutral-100 text-neutral-700 border border-neutral-200'
                      }`}>
                        {coupon.issueType === 'AUTO' ? '신규회원 자동발급' : coupon.issueType === 'DOWNLOAD' ? '다운로드 쿠폰' : '지정회원 직접발급'}
                      </span>
                      {coupon.code && (
                        <span className="text-[10px] font-mono bg-neutral-100 px-1.5 py-0.5 border border-neutral-200 text-neutral-600">
                          {coupon.code}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-sm ${
                      coupon.targetScope === 'ALL' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      coupon.targetScope === 'CATEGORY' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      coupon.targetScope === 'EQUIPMENT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {coupon.targetScope === 'ALL' && '전체 상품'}
                      {coupon.targetScope === 'CATEGORY' && `카테고리: ${coupon.targets?.[0]?.targetName || coupon.targets?.[0]?.targetId || '지정'}`}
                      {coupon.targetScope === 'EQUIPMENT' && `장비: ${coupon.targets?.[0]?.targetName || coupon.targets?.[0]?.targetId || '지정'}`}
                      {coupon.targetScope === 'PRODUCT' && `상품: ${coupon.targets?.[0]?.targetName || coupon.targets?.[0]?.targetId || '지정'}`}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-sm text-[#D9534F]">
                      {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% 할인` : `${coupon.discountValue.toLocaleString()}원 할인`}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-neutral-700">
                    {coupon.minOrderAmount > 0 ? `${coupon.minOrderAmount.toLocaleString()}원 이상` : '제한 없음'}
                  </td>
                  <td className="p-4 font-medium text-neutral-700">
                    {coupon.discountType === 'PERCENTAGE' && coupon.maxDiscountAmount
                      ? `${coupon.maxDiscountAmount.toLocaleString()}원 한도`
                      : '-'}
                  </td>
                  <td className="p-4 text-neutral-600">
                    {coupon.validityType === 'DAYS_FROM_ISSUE' ? (
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        발급 후 {coupon.validDays}일간
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {coupon.startDate || '시작'} ~ {coupon.endDate || '종료'}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center font-bold text-neutral-800">
                    {coupon.issuedQuantity}건
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-colors ${
                        coupon.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                      }`}
                    >
                      {coupon.isActive ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <button
                      onClick={() => handleIssueToUser(coupon)}
                      title="회원 발급"
                      className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenRegister(coupon)}
                      title="수정"
                      className="p-1.5 hover:bg-neutral-100 text-neutral-600 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      title="삭제"
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="p-12 text-center text-neutral-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  등록된 쿠폰이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 쿠폰 등록/수정 모달 */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col rounded-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-200 shrink-0">
              <h2 className="text-lg font-bold text-neutral-900">
                {targetCoupon ? '쿠폰 정보 수정' : '신규 쿠폰 등록'}
              </h2>
            </div>
            <form onSubmit={handleSaveCoupon} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">쿠폰명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: [Potenza] 소모품 20% 특별 할인쿠폰"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">쿠폰 코드 (선택)</label>
                <input
                  type="text"
                  placeholder="예: POTENZA20"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border text-sm font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">발급 구분 *</label>
                <select
                  value={formData.issueType}
                  onChange={e => setFormData({ ...formData, issueType: e.target.value as IssueType })}
                  className="w-full px-3 py-2 border text-sm bg-white"
                >
                  <option value="AUTO">신규회원 가입시 자동발급</option>
                  <option value="DOWNLOAD">고객 직접 다운로드</option>
                  <option value="MANUAL">관리자 지정 회원 직접 발급</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">할인 방식 *</label>
                  <select
                    value={formData.discountType}
                    onChange={e => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                    className="w-full px-3 py-2 border text-sm bg-white"
                  >
                    <option value="PERCENTAGE">정률 할인 (%)</option>
                    <option value="FIXED_AMOUNT">정액 할인 (원)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    {formData.discountType === 'PERCENTAGE' ? '할인율 (%)' : '할인금액 (원)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">최소 주문 금액 (원)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0이면 제한없음"
                    value={formData.minOrderAmount}
                    onChange={e => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">최대 할인 금액 (원)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={formData.discountType !== 'PERCENTAGE'}
                    placeholder={formData.discountType === 'PERCENTAGE' ? '정률할인 시 최대한도' : '정액할인 미적용'}
                    value={formData.maxDiscountAmount}
                    onChange={e => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border text-sm disabled:bg-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">타겟 범위 *</label>
                <select
                  value={formData.targetScope}
                  onChange={e => setFormData({ ...formData, targetScope: e.target.value as TargetScope })}
                  className="w-full px-3 py-2 border text-sm bg-white"
                >
                  <option value="ALL">전체 상품 대상</option>
                  <option value="CATEGORY">특정 카테고리 한정</option>
                  <option value="EQUIPMENT">특정 장비 한정</option>
                  <option value="PRODUCT">특정 상품 한정</option>
                </select>
              </div>

              {formData.targetScope !== 'ALL' && (
                <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-sm space-y-3">
                  {/* 특정 장비 선택 - 셀렉트 리스트박스 드롭다운 UI */}
                  {formData.targetScope === 'EQUIPMENT' ? (
                    <div className="space-y-2">
                      <label className="block font-bold text-neutral-800 text-xs">⚡ 적용 장비 선택 (리스트박스)</label>
                      <select
                        value={formData.targetId}
                        onChange={(e) => {
                          const selectedCode = e.target.value;
                          const eq = equipmentsList.find(item => (item.code || item.id) === selectedCode);
                          setFormData(prev => ({
                            ...prev,
                            targetId: selectedCode,
                            targetName: eq ? eq.model_name : selectedCode
                          }));
                        }}
                        className="w-full px-3 py-2 border border-neutral-300 text-xs bg-white font-medium focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                      >
                        <option value="">-- 장비를 선택하세요 --</option>
                        {equipmentsList.map(eq => (
                          <option key={eq.id} value={eq.code || eq.id}>
                            {eq.model_name} ({eq.code || eq.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-neutral-800 text-xs">
                          {formData.targetScope === 'CATEGORY' && '📂 적용 카테고리 선택'}
                          {formData.targetScope === 'PRODUCT' && '📦 적용 상품 선택'}
                        </label>
                        {formData.targetId && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-sm flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              선택됨: {formData.targetName || '선택한 항목'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, targetId: '', targetName: '' }));
                                setTargetSearchTerm('');
                              }}
                              className="text-[11px] text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
                            >
                              변경
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 상품/카테고리가 미선택 상태이거나 재검색 클릭 시에만 검색리스트 노출 (선택 시 자동 닫힘) */}
                      {(!formData.targetId || targetSearchTerm !== '') && (
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input
                              type="text"
                              placeholder={
                                formData.targetScope === 'CATEGORY' ? '카테고리명 검색...' : '상품명으로 검색...'
                              }
                              value={targetSearchTerm}
                              onChange={e => setTargetSearchTerm(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 border border-neutral-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                            />
                          </div>

                          <div className="max-h-40 overflow-y-auto border border-neutral-200 bg-white divide-y divide-neutral-100 rounded-sm">
                            {formData.targetScope === 'CATEGORY' && (
                              dbCategories
                                .filter(c => c.name.toLowerCase().includes(targetSearchTerm.toLowerCase()) || c.id.toLowerCase().includes(targetSearchTerm.toLowerCase()))
                                .map(cat => {
                                  const isSelected = formData.targetId === cat.id;
                                  return (
                                    <div
                                      key={cat.id}
                                      onClick={() => handleSelectTargetItem(cat.id, cat.name)}
                                      className={`p-2.5 flex items-center justify-between cursor-pointer text-xs transition-colors ${
                                        isSelected ? 'bg-blue-50/80 text-blue-900 font-bold' : 'hover:bg-neutral-50 text-neutral-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-neutral-300 bg-white'}`}>
                                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                        </span>
                                        <span>{cat.name}</span>
                                      </div>
                                    </div>
                                  );
                                })
                            )}

                            {formData.targetScope === 'PRODUCT' && (
                              dbProducts
                                .filter(p => (p.name && p.name.toLowerCase().includes(targetSearchTerm.toLowerCase())) || (p.sku && p.sku.toLowerCase().includes(targetSearchTerm.toLowerCase())))
                                .slice(0, 50)
                                .map(p => {
                                  const isSelected = formData.targetId === p.id || formData.targetId === p.sku;
                                  return (
                                    <div
                                      key={p.id}
                                      onClick={() => handleSelectTargetItem(p.id, p.name)}
                                      className={`p-2.5 flex items-center justify-between cursor-pointer text-xs transition-colors ${
                                        isSelected ? 'bg-emerald-50/80 text-emerald-900 font-bold' : 'hover:bg-neutral-50 text-neutral-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0 pr-2">
                                        <span className={`w-3.5 h-3.5 shrink-0 rounded-full border flex items-center justify-center ${isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-neutral-300 bg-white'}`}>
                                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                        </span>
                                        <span className="truncate">{p.name}</span>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-[11px] font-bold text-neutral-800">₩{p.price?.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="block font-bold text-neutral-700 mb-1">사용기한 설정 방식 *</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-1 font-medium">
                    <input
                      type="radio"
                      name="validityType"
                      value="DAYS_FROM_ISSUE"
                      checked={formData.validityType === 'DAYS_FROM_ISSUE'}
                      onChange={() => setFormData({ ...formData, validityType: 'DAYS_FROM_ISSUE' })}
                    />
                    발급일 기준 N일간
                  </label>
                  <label className="flex items-center gap-1 font-medium">
                    <input
                      type="radio"
                      name="validityType"
                      value="DATE_RANGE"
                      checked={formData.validityType === 'DATE_RANGE'}
                      onChange={() => setFormData({ ...formData, validityType: 'DATE_RANGE' })}
                    />
                    고정 사용 기간
                  </label>
                </div>

                {formData.validityType === 'DAYS_FROM_ISSUE' ? (
                  <div>
                    <label className="block text-neutral-600 mb-1">유효 일수 (일)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.validDays}
                      onChange={e => setFormData({ ...formData, validDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 border text-sm"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-600 mb-1">시작일</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 border text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 mb-1">종료일</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 border text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
              </div>

              <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-5 py-2 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-bold text-sm rounded-sm transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm rounded-sm shadow-md transition-colors cursor-pointer"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 회원 직접 발급 모달 */}
      {isIssueModalOpen && targetCoupon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-neutral-900 border-b pb-2">회원 쿠폰 발급</h2>
            <p className="text-xs text-neutral-600">
              <strong>[{targetCoupon.name}]</strong> 쿠폰을 지정 회원에게 즉시 발급합니다.
            </p>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">회원 ID</label>
              <input
                type="text"
                id="issueTargetUserId"
                defaultValue="usr-1"
                placeholder="발급할 회원 ID (예: usr-1)"
                className="w-full px-3 py-2 border text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('issueTargetUserId') as HTMLInputElement;
                  handleConfirmIssue(input?.value || 'usr-1');
                }}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                발급하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
