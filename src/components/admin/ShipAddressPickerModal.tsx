import { useState, useEffect } from 'react';
import { MapPin, X, Check, Loader2, Edit2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';

export interface SelectedShipAddress {
  recipient: string;
  phone: string;
  zipCode: string;
  address: string;
  addressDetail: string;
}

interface ShipAddressPickerModalProps {
  /** 주문의 원래 배송지 (기본 선택) */
  orderShippingInfo: {
    recipient?: string;
    phone?: string;
    zipCode?: string;
    address?: string;
    addressDetail?: string;
  };
  /** 고객 user_id (저장 배송지 조회용) */
  userId?: string;
  /** 확인 클릭 → 선택된 배송지 반환 */
  onConfirm: (address: SelectedShipAddress) => void;
  onClose: () => void;
}

type SelectMode = 'order' | string | 'custom';

export function ShipAddressPickerModal({
  orderShippingInfo,
  userId,
  onConfirm,
  onClose,
}: ShipAddressPickerModalProps) {
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [loadingAddrs, setLoadingAddrs] = useState(false);
  const [selected, setSelected] = useState<SelectMode>('order');

  // 직접 입력 폼
  const [custom, setCustom] = useState<SelectedShipAddress>({
    recipient: '',
    phone: '',
    zipCode: '',
    address: '',
    addressDetail: '',
  });

  useEffect(() => {
    if (userId) {
      setLoadingAddrs(true);
      adminService
        .getOrderShippingAddresses(userId)
        .then(setSavedAddresses)
        .catch(() => toast.error('배송지 목록을 불러오지 못했습니다.'))
        .finally(() => setLoadingAddrs(false));
    }
  }, [userId]);

  const handleConfirm = () => {
    let addr: SelectedShipAddress;

    if (selected === 'order') {
      addr = {
        recipient: orderShippingInfo.recipient || '',
        phone: orderShippingInfo.phone || '',
        zipCode: orderShippingInfo.zipCode || '',
        address: orderShippingInfo.address || '',
        addressDetail: orderShippingInfo.addressDetail || '',
      };
    } else if (selected === 'custom') {
      if (!custom.phone || !custom.address) {
        toast.error('연락처와 주소는 필수 입력 항목입니다.');
        return;
      }
      addr = custom;
    } else {
      const found = savedAddresses.find(a => a.id === selected);
      if (!found) return;
      addr = {
        recipient: found.recipient,
        phone: found.phone,
        zipCode: found.zipCode,
        address: found.address,
        addressDetail: found.addressDetail,
      };
    }

    onConfirm(addr);
  };

  const handleAddressSearch = () => {
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        let fullAddress = data.roadAddress;
        let extraAddress = '';
        if (data.addressType === 'R') {
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) extraAddress += data.bname;
          if (data.buildingName !== '')
            extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
          fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
        }
        setCustom(p => ({ ...p, zipCode: data.zonecode, address: fullAddress, addressDetail: '' }));
      },
    }).open();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-neutral-700" />
            <h3 className="text-base font-black text-neutral-900">발송 배송지 선택</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* 바디 */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3">
          {/* 주문 원래 배송지 */}
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
            주문 원래 배송지
          </p>
          <AddressCard
            label="주문 배송지"
            recipient={orderShippingInfo.recipient}
            phone={orderShippingInfo.phone}
            address={orderShippingInfo.address}
            addressDetail={orderShippingInfo.addressDetail}
            zipCode={orderShippingInfo.zipCode}
            isSelected={selected === 'order'}
            isDefault
            onClick={() => setSelected('order')}
          />

          {/* 저장 배송지 */}
          {userId && (
            <>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-4 mb-1">
                저장된 배송지
              </p>
              {loadingAddrs ? (
                <div className="flex items-center gap-2 py-4 text-sm text-neutral-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  불러오는 중...
                </div>
              ) : savedAddresses.length === 0 ? (
                <p className="text-sm text-neutral-400 py-2">등록된 배송지가 없습니다.</p>
              ) : (
                savedAddresses.map(addr => (
                  <AddressCard
                    key={addr.id}
                    label={addr.label}
                    recipient={addr.recipient}
                    phone={addr.phone}
                    address={addr.address}
                    addressDetail={addr.addressDetail}
                    zipCode={addr.zipCode}
                    isSelected={selected === addr.id}
                    isDefault={addr.isDefault}
                    onClick={() => setSelected(addr.id)}
                  />
                ))
              )}
            </>
          )}

          {/* 직접 입력 */}
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-4 mb-1">
            직접 입력
          </p>
          <div
            className={`border-2 p-4 cursor-pointer transition-all ${
              selected === 'custom'
                ? 'border-neutral-900 bg-neutral-50'
                : 'border-neutral-100 hover:border-neutral-300'
            }`}
            onClick={() => setSelected('custom')}
          >
            <div className="flex items-center gap-2 mb-3">
              <Edit2 className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-bold text-neutral-700">다른 주소로 발송</span>
              {selected === 'custom' && (
                <Check className="w-4 h-4 text-neutral-900 ml-auto" />
              )}
            </div>
            {selected === 'custom' && (
              <div className="space-y-3" onClick={e => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                      수령인
                    </label>
                    <input
                      type="text"
                      value={custom.recipient}
                      onChange={e => setCustom(p => ({ ...p, recipient: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                      연락처 *
                    </label>
                    <input
                      type="text"
                      value={custom.phone}
                      onChange={e => setCustom(p => ({ ...p, phone: e.target.value }))}
                      placeholder="010-0000-0000"
                      className="w-full px-3 py-2 border border-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={custom.zipCode}
                    readOnly
                    placeholder="우편번호"
                    className="w-28 px-3 py-2 border border-neutral-200 bg-neutral-50 text-sm text-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-700 transition-colors"
                  >
                    주소 검색
                  </button>
                </div>
                <input
                  type="text"
                  value={custom.address}
                  readOnly
                  placeholder="기본 주소"
                  className="w-full px-3 py-2 border border-neutral-200 bg-neutral-50 text-sm text-neutral-500"
                />
                <input
                  type="text"
                  value={custom.addressDetail}
                  onChange={e => setCustom(p => ({ ...p, addressDetail: e.target.value }))}
                  placeholder="상세 주소"
                  className="w-full px-3 py-2 border border-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 text-sm font-bold bg-neutral-900 text-white hover:bg-neutral-700 transition-colors flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            이 배송지로 발송하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 내부 주소 카드 컴포넌트 ───────────────────────────────────────────────────
function AddressCard({
  label,
  recipient,
  phone,
  address,
  addressDetail,
  zipCode,
  isSelected,
  isDefault,
  onClick,
}: {
  label: string;
  recipient?: string;
  phone?: string;
  address?: string;
  addressDetail?: string;
  zipCode?: string;
  isSelected: boolean;
  isDefault?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`border-2 p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-neutral-900 bg-neutral-50'
          : 'border-neutral-100 hover:border-neutral-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-black text-neutral-900">{label}</span>
            {isDefault && (
              <span className="text-[9px] font-black px-1 py-0.5 bg-neutral-900 text-white">
                기본
              </span>
            )}
          </div>
          {recipient && (
            <p className="text-sm font-medium text-neutral-800">{recipient}</p>
          )}
          {phone && <p className="text-xs text-neutral-500 mt-0.5">{phone}</p>}
          {address && (
            <p className="text-xs text-neutral-700 mt-1">
              {zipCode && `[${zipCode}] `}{address}
              {addressDetail && ` ${addressDetail}`}
            </p>
          )}
        </div>
        {isSelected && (
          <Check className="w-5 h-5 text-neutral-900 flex-shrink-0 ml-3 mt-0.5" />
        )}
      </div>
    </div>
  );
}
