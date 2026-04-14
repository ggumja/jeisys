import { useState, useEffect } from 'react';
import { MapPin, Plus, Pencil, Trash2, Star, Check, X } from 'lucide-react';
import { ShippingAddress } from '../types';
import { addressService } from '../services/addressService';
import { authService } from '../services/authService';
import { toast } from 'sonner';

interface AddressForm {
  label: string;
  recipient: string;
  phone: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  isDefault: boolean;
}

const emptyForm: AddressForm = {
  label: '',
  recipient: '',
  phone: '',
  zipCode: '',
  address: '',
  addressDetail: '',
  isDefault: false,
};

export function ShippingAddressPage() {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // 삭제 확인
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (!user) return;
      setUserId(user.id);
      // 배송지 목록이 없으면 사업장주소를 기본배송지로 자동 등록
      const list = await addressService.syncFromUserProfile(user.id, {
        name: user.name,
        phone: user.phone,
        mobile: user.mobile,
        hospitalName: user.hospitalName,
        address: user.address,
        addressDetail: user.addressDetail,
        zipCode: user.zipCode,
      });
      setAddresses(list);
    } catch (e) {
      toast.error('배송지 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, isDefault: addresses.length === 0 });
    setShowModal(true);
  };

  const openEdit = (addr: ShippingAddress) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      recipient: addr.recipient,
      phone: addr.phone,
      zipCode: addr.zipCode,
      address: addr.address,
      addressDetail: addr.addressDetail,
      isDefault: addr.isDefault,
    });
    setShowModal(true);
  };

  const handleAddressSearch = () => {
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        let fullAddress = data.roadAddress;
        let extraAddress = '';
        if (data.addressType === 'R') {
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) extraAddress += data.bname;
          if (data.buildingName !== '')
            extraAddress += extraAddress !== '' ? ', ' + data.buildingName : data.buildingName;
          fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
        }
        setForm(prev => ({ ...prev, zipCode: data.zonecode, address: fullAddress, addressDetail: '' }));
      },
    }).open();
  };

  const handleSave = async () => {
    if (!userId) return;
    if (!form.recipient.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error('수령인, 연락처, 주소는 필수 항목입니다.');
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        const updated = await addressService.updateAddress(editingId, userId, form);
        setAddresses(prev => prev.map(a => (a.id === editingId ? updated : a)));
        toast.success('배송지가 수정되었습니다.');
      } else {
        const created = await addressService.addAddress(userId, form);
        setAddresses(prev => {
          const list = form.isDefault ? prev.map(a => ({ ...a, isDefault: false })) : prev;
          return [created, ...list];
        });
        toast.success('배송지가 등록되었습니다.');
      }
      setShowModal(false);
    } catch (e) {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!userId) return;
    try {
      await addressService.setDefault(id, userId);
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
      toast.success('기본 배송지가 변경되었습니다.');
    } catch {
      toast.error('변경에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await addressService.deleteAddress(deleteId);
      setAddresses(prev => prev.filter(a => a.id !== deleteId));
      toast.success('배송지가 삭제되었습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">배송지 관리</h2>
          <p className="text-sm text-neutral-500 mt-0.5">자주 사용하는 배송지를 등록하고 관리하세요.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          배송지 추가
        </button>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="flex justify-center py-16 text-neutral-400 text-sm">불러오는 중...</div>
      ) : addresses.length === 0 ? (
        <div className="border border-dashed border-neutral-200 p-16 text-center">
          <MapPin className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
          <p className="text-sm font-semibold text-neutral-500 mb-1">등록된 배송지가 없습니다.</p>
          <p className="text-xs text-neutral-400 mb-6">배송지를 추가하면 결제 시 빠르게 선택할 수 있습니다.</p>
          <button
            onClick={openAdd}
            className="px-6 py-2.5 bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-700 transition-colors"
          >
            첫 배송지 등록하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`bg-white border p-6 flex items-start gap-5 transition-all ${
                addr.isDefault ? 'border-neutral-900' : 'border-neutral-200'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                <MapPin
                  className={`w-5 h-5 ${addr.isDefault ? 'text-neutral-900' : 'text-neutral-400'}`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-bold text-neutral-900 text-sm">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 bg-neutral-900 text-white uppercase tracking-tight">
                      기본
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-700 font-medium">{addr.recipient}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{addr.phone}</p>
                <p className="text-sm text-neutral-700 mt-1.5">
                  [{addr.zipCode}] {addr.address}
                  {addr.addressDetail && ` ${addr.addressDetail}`}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    title="기본 배송지로 설정"
                    className="p-2 text-neutral-400 hover:text-amber-500 hover:bg-amber-50 transition-colors rounded"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => openEdit(addr)}
                  className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors rounded"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(addr.id)}
                  className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 배송지 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white w-full max-w-lg mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h3 className="text-base font-black text-neutral-900">
                {editingId ? '배송지 수정' : '새 배송지 추가'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-neutral-100 rounded transition-colors">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="px-6 py-5 space-y-4">
              {/* 배송지명 */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5">배송지명</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="예: 병원, 분원, 창고"
                  className="w-full px-4 py-2.5 border border-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              {/* 수령인 / 연락처 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5">수령인</label>
                  <input
                    type="text"
                    value={form.recipient}
                    onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5">연락처</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="010-0000-0000"
                    className="w-full px-4 py-2.5 border border-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              {/* 주소 */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5">주소</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.zipCode}
                    readOnly
                    placeholder="우편번호"
                    className="w-28 px-3 py-2.5 border border-neutral-200 bg-neutral-50 text-sm text-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-700 transition-colors"
                  >
                    주소 검색
                  </button>
                </div>
                <input
                  type="text"
                  value={form.address}
                  readOnly
                  placeholder="기본 주소"
                  className="w-full px-4 py-2.5 border border-neutral-200 bg-neutral-50 text-sm text-neutral-500"
                />
                <input
                  type="text"
                  value={form.addressDetail}
                  onChange={e => setForm(f => ({ ...f, addressDetail: e.target.value }))}
                  placeholder="상세 주소 (층, 호수 등)"
                  className="w-full px-4 py-2.5 border border-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              {/* 기본 배송지 체크 */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                    form.isDefault ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-300'
                  }`}
                  onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
                >
                  {form.isDefault && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-neutral-700 font-medium">기본 배송지로 설정</span>
              </label>
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-sm font-bold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 text-sm font-bold bg-neutral-900 text-white hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                {saving ? '저장 중...' : editingId ? '수정 완료' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setDeleteId(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white w-full max-w-sm mx-4 shadow-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-neutral-900 mb-2">배송지 삭제</h3>
            <p className="text-sm text-neutral-600 mb-6">이 배송지를 삭제하시겠습니까? 삭제된 배송지는 복구할 수 없습니다.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-5 py-2.5 text-sm font-bold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
