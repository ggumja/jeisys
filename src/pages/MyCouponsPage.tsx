import React, { useState, useEffect } from 'react';
import { Tag, Calendar, AlertCircle, ArrowDownCircle, CheckCircle2, Clock } from 'lucide-react';
import { couponService } from '../services/couponService';
import { Coupon, UserCoupon } from '../types/coupon';
import { storage } from '../lib/storage';
import { toast } from 'sonner';

export function MyCouponsPage() {
  const user = storage.getUser();
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [activeTab, setActiveTab] = useState<'MY_COUPONS' | 'DOWNLOADABLE'>('MY_COUPONS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNUSED' | 'USED' | 'EXPIRED'>('UNUSED');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    if (!user) return;
    let list = couponService.getUserCoupons(user.id);
    if (list.length === 0) {
      list = couponService.getUserCoupons('');
    }
    setUserCoupons(list);

    const availableAll = couponService.getCoupons().filter(c => c.isActive);
    setAllCoupons(availableAll);
  };

  const handleDownloadCoupon = (coupon: Coupon) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    try {
      couponService.issueCouponToUser(coupon.id, user.id);
      toast.success(`[${coupon.name}] 쿠폰을 다운로드했습니다!`);
      loadData();
    } catch (e: any) {
      toast.error(e?.message || '쿠폰 다운로드 실패');
    }
  };

  // 현재 사용자가 이미 발급받아 보유 중인 쿠폰 ID 목록
  const myCouponIds = new Set(
    (user ? couponService.getUserCoupons(user.id) : []).map(uc => uc.couponId)
  );

  // 다운로드 가능한 쿠폰 필터링 (DOWNLOAD 타입 중 현재 사용자가 미보유한 쿠폰만)
  const downloadableCoupons = allCoupons.filter(c => {
    if (c.issueType !== 'DOWNLOAD') return false;
    return !myCouponIds.has(c.id);
  });

  const filteredMyCoupons = userCoupons.filter(uc => {
    if (statusFilter === 'ALL') return true;
    return uc.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white p-6 border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-6 h-6 text-[#D9534F]" />
            <h1 className="text-2xl font-bold text-neutral-900">마이 쿠폰함</h1>
          </div>
          <p className="text-xs text-neutral-500">
            보유하신 쿠폰 목록을 확인하고, 다운로드 가능한 프로모션 쿠폰을 받아보세요.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-neutral-50 p-3 border border-neutral-200 rounded-sm">
          <div className="text-center px-3 border-r border-neutral-200">
            <span className="block text-[10px] text-neutral-400 font-bold uppercase">사용 가능 쿠폰</span>
            <span className="text-lg font-black text-[#D9534F]">
              {userCoupons.filter(uc => uc.status === 'UNUSED').length}장
            </span>
          </div>
          <div className="text-center px-3">
            <span className="block text-[10px] text-neutral-400 font-bold uppercase">다운로드 가능</span>
            <span className="text-lg font-black text-blue-600">
              {downloadableCoupons.length}장
            </span>
          </div>
        </div>
      </div>

      {/* 탭 구분 */}
      <div className="flex border-b border-neutral-200 bg-white">
        <button
          onClick={() => setActiveTab('MY_COUPONS')}
          className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'MY_COUPONS'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>보유 쿠폰함 ({userCoupons.filter(uc => uc.status === 'UNUSED').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('DOWNLOADABLE')}
          className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'DOWNLOADABLE'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4 text-blue-600" />
          <span>쿠폰 다운로드 존 ({downloadableCoupons.length})</span>
        </button>
      </div>

      {/* 보유 쿠폰 탭 */}
      {activeTab === 'MY_COUPONS' && (
        <div className="space-y-4">
          {/* 상태 필터 */}
          <div className="flex items-center gap-2">
            {[
              { key: 'UNUSED', label: '사용가능' },
              { key: 'USED', label: '사용완료' },
              { key: 'EXPIRED', label: '기간만료' },
              { key: 'ALL', label: '전체보기' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key as any)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                  statusFilter === f.key
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredMyCoupons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMyCoupons.map(uc => {
                const coupon = uc.coupon;
                const isUnused = uc.status === 'UNUSED';
                return (
                  <div
                    key={uc.id}
                    className={`bg-white border p-5 shadow-sm relative overflow-hidden flex flex-col justify-between ${
                      isUnused ? 'border-neutral-300' : 'border-neutral-200 bg-neutral-50 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm ${
                          coupon?.targetScope === 'ALL' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          coupon?.targetScope === 'CATEGORY' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          coupon?.targetScope === 'EQUIPMENT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {coupon?.targetScope === 'ALL' && '전체 상품 적용'}
                          {coupon?.targetScope === 'CATEGORY' && `카테고리: ${coupon.targets?.[0]?.targetName || coupon.targets?.[0]?.targetId}`}
                          {coupon?.targetScope === 'EQUIPMENT' && `장비: ${coupon.targets?.[0]?.targetName || coupon.targets?.[0]?.targetId}`}
                          {coupon?.targetScope === 'PRODUCT' && `상품: ${coupon.targets?.[0]?.targetName || coupon.targets?.[0]?.targetId}`}
                        </span>

                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm ${
                          uc.status === 'UNUSED' ? 'bg-emerald-100 text-emerald-800' :
                          uc.status === 'USED' ? 'bg-neutral-200 text-neutral-600' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {uc.status === 'UNUSED' ? '사용가능' : uc.status === 'USED' ? '사용완료' : '기간만료'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-neutral-900 mb-1">{coupon?.name || '쿠폰'}</h3>

                      <div className="text-xl font-black text-[#D9534F] my-2">
                        {coupon?.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% 할인` : `₩${coupon?.discountValue.toLocaleString()} 할인`}
                        {coupon?.discountType === 'PERCENTAGE' && coupon.maxDiscountAmount && (
                          <span className="text-xs text-neutral-500 font-normal ml-1">(최대 ₩{coupon.maxDiscountAmount.toLocaleString()})</span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-500 font-medium">
                        • {coupon?.minOrderAmount ? `₩${coupon.minOrderAmount.toLocaleString()} 이상 주문 시 사용가능` : '최소 주문금액 없음'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        유효기간: ~{uc.expiresAt.substring(0, 10)}
                      </span>
                      {coupon?.code && <span className="font-mono bg-neutral-100 px-1.5 py-0.5 text-neutral-600 border border-neutral-200">{coupon.code}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 p-12 text-center text-neutral-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-sm font-bold text-neutral-600">보유하신 쿠폰 내역이 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 다운로드 가능 쿠폰 탭 */}
      {activeTab === 'DOWNLOADABLE' && (
        <div className="space-y-4">
          {downloadableCoupons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {downloadableCoupons.map(coupon => (
                <div
                  key={coupon.id}
                  className="bg-white border border-blue-200 p-5 shadow-sm relative flex flex-col justify-between hover:border-blue-400 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-sm">
                        다운로드 전용 쿠폰
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {coupon.validityType === 'DAYS_FROM_ISSUE' ? `발급 후 ${coupon.validDays}일간` : `${coupon.startDate} ~ ${coupon.endDate}`}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-neutral-900 mb-1">{coupon.name}</h3>

                    <div className="text-xl font-black text-[#D9534F] my-2">
                      {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% 할인` : `₩${coupon.discountValue.toLocaleString()} 할인`}
                    </div>

                    <p className="text-xs text-neutral-500 font-medium">
                      • {coupon.minOrderAmount ? `₩${coupon.minOrderAmount.toLocaleString()} 이상 주문 시 사용가능` : '최소 주문금액 없음'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDownloadCoupon(coupon)}
                    className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    <span>쿠폰 다운로드 받기</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 p-12 text-center text-neutral-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-60" />
              <p className="text-sm font-bold text-neutral-700">현재 받으실 수 있는 신규 다운로드 쿠폰이 없습니다.</p>
              <p className="text-xs text-neutral-400">새로운 프로모션 쿠폰이 추가되면 안내해 드리겠습니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
