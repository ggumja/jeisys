import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle, Truck, Clock, Building2, CreditCard, Star, Award, Bell, Mail, MessageCircle, ToggleLeft, ToggleRight, Tag, Plus, Trash2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';
import { useModal } from '../../context/ModalContext';
import { shopSettingsService } from '../../services/shopSettingsService';

type TabId = 'delivery' | 'order' | 'company' | 'bank' | 'credit' | 'grade' | 'member_type' | 'notification';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'delivery', label: '배송 정책', icon: Truck },
  { id: 'order', label: '주문/운영', icon: Clock },
  { id: 'company', label: '회사 정보', icon: Building2 },
  { id: 'bank', label: '입금 계좌', icon: CreditCard },
  { id: 'credit', label: '적립금', icon: Star },
  { id: 'grade', label: '회원 등급', icon: Award },
  { id: 'member_type', label: '회원 분류', icon: Tag },
  { id: 'notification', label: '알림 설정', icon: Bell },
];

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'time';
  suffix?: string;
  placeholder?: string;
}

const TAB_FIELDS: Record<TabId, FieldDef[]> = {
  delivery: [
    { key: 'free_shipping_threshold', label: '무료배송 기준금액', type: 'number', suffix: '원' },
    { key: 'base_shipping_fee', label: '기본 배송비', type: 'number', suffix: '원' },
    { key: 'jeju_shipping_fee', label: '제주/도서 추가 배송비', type: 'number', suffix: '원' },
    { key: 'return_shipping_fee_buyer', label: '반품 배송비 (구매자 귀책)', type: 'number', suffix: '원' },
    { key: 'exchange_shipping_fee', label: '교환 배송비 (왕복)', type: 'number', suffix: '원' },
  ],
  order: [
    { key: 'order_deadline_time', label: '당일 주문 마감 시각', type: 'time' },
    { key: 'jeju_deadline_time', label: '제주/배달 마감 시각', type: 'time' },
    { key: 'biz_hours_open', label: '고객센터 오픈 시각', type: 'time' },
    { key: 'biz_hours_close', label: '고객센터 마감 시각', type: 'time' },
    { key: 'vact_deadline_days', label: '가상계좌 입금 기한', type: 'number', suffix: '일' },
    { key: 'min_order_amount', label: '최소 주문 금액', type: 'number', suffix: '원' },
  ],
  company: [
    { key: 'company_name', label: '회사명', type: 'text' },
    { key: 'cs_phone', label: '고객지원 전화번호', type: 'text' },
    { key: 'as_phone', label: 'AS 고객센터 번호', type: 'text' },
    { key: 'ceo_name', label: '대표자명', type: 'text' },
    { key: 'business_number', label: '사업자등록번호', type: 'text' },
    { key: 'commerce_number', label: '통신판매업 신고번호', type: 'text' },
    { key: 'privacy_officer', label: '개인정보관리책임자', type: 'text' },
    { key: 'company_address', label: '회사 주소', type: 'text' },
    { key: 'email', label: '대표 이메일', type: 'text' },
  ],
  bank: [
    { key: 'bank_name', label: '은행명', type: 'text' },
    { key: 'bank_account', label: '계좌번호', type: 'text' },
    { key: 'bank_holder', label: '예금주', type: 'text' },
    { key: 'vact_deadline_days', label: '가상계좌 입금 기한', type: 'number', suffix: '일' },
  ],
  credit: [
    { key: 'credit_enabled', label: '적립금 기능 활성화', type: 'boolean' },
    { key: 'credit_earn_rate', label: '구매 적립률', type: 'number', suffix: '%' },
    { key: 'credit_min_use', label: '최소 사용 금액', type: 'number', suffix: '원' },
    { key: 'credit_expiry_days', label: '유효 기간 (0=무제한)', type: 'number', suffix: '일' },
  ],
  grade: [
    { key: 'grades_enabled', label: '회원 등급제 사용 여부', type: 'boolean' },
    { key: 'grade_vip_label', label: 'VIP 등급 표시명', type: 'text' },
    { key: 'grade_vip_threshold', label: 'VIP 기준 연간 구매액', type: 'number', suffix: '원' },
    { key: 'grade_gold_label', label: 'Gold 등급 표시명', type: 'text' },
    { key: 'grade_gold_threshold', label: 'Gold 기준 연간 구매액', type: 'number', suffix: '원' },
    { key: 'grade_silver_label', label: 'Silver 등급 표시명', type: 'text' },
    { key: 'grade_silver_threshold', label: 'Silver 기준 연간 구매액', type: 'number', suffix: '원' },
  ],
  // notification, member_type tab은 별도 렌더링
  member_type: [],
  notification: [],
};

// 알림 설정 구조 정의
interface NotificationItem { key: string; label: string; }
interface NotificationSection { title: string; items: NotificationItem[]; }

const EMAIL_ADMIN: NotificationSection = {
  title: '관리자 알림',
  items: [
    { key: 'email_admin_new_order', label: '새 주문 접수' },
    { key: 'email_admin_cancel_order', label: '주문 취소' },
    { key: 'email_admin_failed_order', label: '주문/결제 실패' },
    { key: 'email_admin_exchange_request', label: '교환 요청' },
    { key: 'email_admin_return_request', label: '반품 요청' },
  ],
};
const EMAIL_CUST_PAYMENT: NotificationSection = {
  title: '고객 알림 — 결제',
  items: [
    { key: 'email_cust_vact_waiting', label: '가상계좌 입금 대기 안내' },
    { key: 'email_cust_order_complete_card', label: '주문완료 (신용카드)' },
    { key: 'email_cust_order_complete_vact', label: '주문완료 (입금확인 후 상품준비중)' },
    { key: 'email_cust_exchange_received', label: '교환 요청 접수' },
    { key: 'email_cust_return_received', label: '반품 요청 접수' },
    { key: 'email_cust_exchange_done', label: '교환 처리 완료' },
    { key: 'email_cust_return_done', label: '반품 접수 완료' },
  ],
};
const EMAIL_CUST_MEMBER: NotificationSection = {
  title: '고객 알림 — 회원',
  items: [
    { key: 'email_cust_signup', label: '회원가입 완료' },
    { key: 'email_cust_password_reset', label: '비밀번호 초기화' },
  ],
};

const SMS_ADMIN: NotificationSection = {
  title: '관리자 알림',
  items: [
    { key: 'sms_admin_new_order', label: '새 주문 접수' },
    { key: 'sms_admin_cancel_order', label: '주문 취소' },
    { key: 'sms_admin_failed_order', label: '주문/결제 실패' },
    { key: 'sms_admin_exchange_request', label: '교환 요청' },
    { key: 'sms_admin_return_request', label: '반품 요청' },
  ],
};
const SMS_CUST_PAYMENT: NotificationSection = {
  title: '고객 알림 — 결제',
  items: [
    { key: 'sms_cust_vact_waiting', label: '가상계좌 입금 대기 안내' },
    { key: 'sms_cust_order_complete_card', label: '주문완료 (신용카드)' },
    { key: 'sms_cust_order_complete_vact', label: '주문완료 (입금확인 후 상품준비중)' },
    { key: 'sms_cust_exchange_received', label: '교환 요청 접수' },
    { key: 'sms_cust_return_received', label: '반품 요청 접수' },
    { key: 'sms_cust_exchange_done', label: '교환 처리 완료' },
    { key: 'sms_cust_return_done', label: '반품 접수 완료' },
  ],
};
const SMS_CUST_MEMBER: NotificationSection = {
  title: '고객 알림 — 회원',
  items: [
    { key: 'sms_cust_signup', label: '회원가입 완료' },
    { key: 'sms_cust_password_reset', label: '비밀번호 초기화' },
  ],
};

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#EF4444', '#14B8A6', '#F97316',
  '#6366F1', '#64748B',
];

// 숫자 포맷
const fmt = (v: string) => {
  const n = Number(v);
  return isNaN(n) ? v : n.toLocaleString('ko-KR');
};

// ── 컴포넌트 ────────────────────────────────────────────────
export function ShopSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('delivery');
  const [form, setForm] = useState<Record<string, string>>({});
  const [loadingInit, setLoadingInit] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── 회원 분류 관련
  const { confirm: globalConfirm } = useModal();
  interface MemberTypeItem { id: string; name: string; color: string; sort_order: number; }
  const [memberTypes, setMemberTypes] = useState<MemberTypeItem[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState(PRESET_COLORS[0]);
  const [isAddingType, setIsAddingType] = useState(false);

  const loadMemberTypes = async () => {
    try { setMemberTypes((await adminService.getMemberTypes()) as MemberTypeItem[]); } catch {}
  };
  const handleCreateType = async () => {
    if (!newTypeName.trim()) { toast.error('분류명을 입력해주세요.'); return; }
    setIsAddingType(true);
    try {
      await adminService.createMemberType(newTypeName.trim(), newTypeColor);
      await loadMemberTypes();
      setNewTypeName(''); setNewTypeColor(PRESET_COLORS[0]);
      toast.success(`'${newTypeName}' 분류가 추가되었습니다.`);
    } catch (e: any) {
      toast.error(e.message?.includes('unique') ? '이미 존재하는 분류명입니다.' : '분류 추가에 실패했습니다.');
    } finally { setIsAddingType(false); }
  };
  const handleDeleteType = async (type: MemberTypeItem) => {
    if (!(await globalConfirm(`'${type.name}' 분류를 삭제하시겠습니까?`))) return;
    try {
      await adminService.deleteMemberType(type.id);
      await loadMemberTypes();
      toast.success(`'${type.name}' 분류가 삭제되었습니다.`);
    } catch { toast.error('분류 삭제에 실패했습니다.'); }
  };

  useEffect(() => {
    shopSettingsService.getAll().then((data) => {
      setForm(data);
      setLoadingInit(false);
    });
    loadMemberTypes();
  }, []);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleToggle = (key: string) => {
    setForm((prev) => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await shopSettingsService.updateMany(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const currentFields = TAB_FIELDS[activeTab];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">쇼핑몰 기본 설정</h2>
          <p className="text-sm text-neutral-500 mt-1">쇼핑몰 전반에 적용되는 기본 설정을 관리합니다.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? '저장 완료' : '저장'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-neutral-200 p-6">
        {activeTab === 'member_type' ? (
          <MemberTypeTab
            memberTypes={memberTypes}
            newTypeName={newTypeName}
            newTypeColor={newTypeColor}
            isAddingType={isAddingType}
            onNameChange={setNewTypeName}
            onColorChange={setNewTypeColor}
            onCreate={handleCreateType}
            onDelete={handleDeleteType}
          />
        ) : activeTab === 'notification' ? (
          <NotificationTab form={form} onToggle={handleToggle} onChange={handleChange} />
        ) : (
          <div className="space-y-4 max-w-xl">
            {currentFields.map((field) => (
              <FieldRow
                key={field.key}
                field={field}
                value={form[field.key] ?? ''}
                onChange={handleChange}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FieldRow ─────────────────────────────────────────────
function FieldRow({
  field,
  value,
  onChange,
  onToggle,
}: {
  field: FieldDef;
  value: string;
  onChange: (key: string, val: string) => void;
  onToggle: (key: string) => void;
}) {
  if (field.type === 'boolean') {
    const on = value === 'true';
    return (
      <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
        <span className="text-sm font-medium text-neutral-700">{field.label}</span>
        <button
          onClick={() => onToggle(field.key)}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            on ? 'text-green-600' : 'text-neutral-400'
          }`}
        >
          {on ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
          {on ? 'ON' : 'OFF'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-neutral-100 last:border-0">
      <label className="w-48 shrink-0 text-sm font-medium text-neutral-700">{field.label}</label>
      <div className="flex items-center gap-2 flex-1">
        <input
          type={field.type === 'number' ? 'number' : field.type === 'time' ? 'time' : 'text'}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="flex-1 border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
        />
        {field.suffix && (
          <span className="text-sm text-neutral-500 shrink-0">{field.suffix}</span>
        )}
        {field.type === 'number' && value && (
          <span className="text-xs text-neutral-400 shrink-0 min-w-[60px] text-right">
            {fmt(value)}
          </span>
        )}
      </div>
    </div>
  );
}

// ── NotificationTab ───────────────────────────────────────
function NotificationTab({
  form,
  onToggle,
  onChange,
}: {
  form: Record<string, string>;
  onToggle: (key: string) => void;
  onChange: (key: string, val: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 이메일 */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-200">
          <Mail className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-neutral-900">이메일 알림</h3>
        </div>
        {/* 발신자 정보 */}
        <div className="space-y-2 mb-6">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">발신자 정보</p>
          {[
            { key: 'email_sender_name', label: '보내는 사람 이름' },
            { key: 'email_sender_address', label: '보내는 사람 주소' },
          ].map((f) => (
            <div key={f.key} className="flex items-center gap-2">
              <label className="w-36 shrink-0 text-sm text-neutral-600">{f.label}</label>
              <input
                type="text"
                value={form[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="flex-1 border border-neutral-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-neutral-900"
              />
            </div>
          ))}
        </div>
        {[EMAIL_ADMIN, EMAIL_CUST_PAYMENT, EMAIL_CUST_MEMBER].map((section) => (
          <NotificationSection key={section.title} section={section} form={form} onToggle={onToggle} />
        ))}
      </div>

      {/* SMS */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-200">
          <MessageCircle className="w-5 h-5 text-green-600" />
          <h3 className="text-base font-bold text-neutral-900">문자(SMS) 알림</h3>
        </div>
        {/* 발신자 정보 */}
        <div className="space-y-2 mb-6">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">발신자 정보</p>
          {[
            { key: 'sms_sender_name', label: '발신자 이름' },
            { key: 'sms_sender_phone', label: '발신자 전화번호' },
          ].map((f) => (
            <div key={f.key} className="flex items-center gap-2">
              <label className="w-36 shrink-0 text-sm text-neutral-600">{f.label}</label>
              <input
                type="text"
                value={form[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="flex-1 border border-neutral-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-neutral-900"
              />
            </div>
          ))}
        </div>
        {[SMS_ADMIN, SMS_CUST_PAYMENT, SMS_CUST_MEMBER].map((section) => (
          <NotificationSection key={section.title} section={section} form={form} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

function NotificationSection({
  section,
  form,
  onToggle,
}: {
  section: NotificationSection;
  form: Record<string, string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">{section.title}</p>
      <div className="space-y-1">
        {section.items.map((item) => {
          const on = form[item.key] !== 'false';
          return (
            <div
              key={item.key}
              className="flex items-center justify-between px-3 py-2 rounded hover:bg-neutral-50 transition-colors"
            >
              <span className="text-sm text-neutral-700">{item.label}</span>
              <button
                onClick={() => onToggle(item.key)}
                className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                  on ? 'text-green-600' : 'text-neutral-400'
                }`}
              >
                {on ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {on ? 'ON' : 'OFF'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MemberTypeTab ─────────────────────────────────────────
function MemberTypeTab({
  memberTypes,
  newTypeName,
  newTypeColor,
  isAddingType,
  onNameChange,
  onColorChange,
  onCreate,
  onDelete,
}: {
  memberTypes: { id: string; name: string; color: string }[];
  newTypeName: string;
  newTypeColor: string;
  isAddingType: boolean;
  onNameChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onCreate: () => void;
  onDelete: (type: { id: string; name: string; color: string }) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
      {/* 현재 분류 목록 */}
      <div>
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">현재 분류 목록</p>
        {memberTypes.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-8 border border-dashed">등록된 분류가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {memberTypes.map(type => (
              <div key={type.id} className="flex items-center justify-between px-4 py-3 border border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: type.color }} />
                  <span className="text-sm font-medium text-neutral-900">{type.name}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: type.color }}>
                    미리보기
                  </span>
                </div>
                <button
                  onClick={() => onDelete(type)}
                  className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 새 분류 추가 */}
      <div>
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">새 분류 추가</p>
        <div className="border border-neutral-200 p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">분류명 *</label>
            <input
              type="text"
              value={newTypeName}
              onChange={e => onNameChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onCreate(); }}
              placeholder="예: 병원, 도매, 대리점..."
              className="w-full px-3 py-2 border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-2">뱃지 색상</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${newTypeColor === c ? 'border-neutral-900 scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            {newTypeName && (
              <div className="mt-2">
                <span className="text-xs text-neutral-500 mr-2">미리보기:</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: newTypeColor }}>
                  {newTypeName}
                </span>
              </div>
            )}
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50"
            onClick={onCreate}
            disabled={isAddingType || !newTypeName.trim()}
          >
            {isAddingType ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            분류 추가
          </button>
        </div>
      </div>
    </div>
  );
}
