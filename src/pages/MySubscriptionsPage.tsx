import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Calendar, Package, Play, Pause, XCircle, Edit2,
  MapPin, Clock, CreditCard, ChevronRight, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Loader2, Plus,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { useModal } from '../context/ModalContext';
import { authService } from '../services/authService';
import {
  subscriptionService,
  SubscriptionRow,
  SubscriptionScheduleRow,
  CancellationRequest,
} from '../services/subscriptionService';
import { paymentService } from '../services/paymentService';
import { addressService } from '../services/addressService';
import { shopSettingsService } from '../services/shopSettingsService';
import { PaymentMethod, ShippingAddress } from '../types';

// ─────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────

function getStatusBadge(status: SubscriptionRow['status']) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          <Play className="w-3 h-3 mr-1" />진행중
        </Badge>
      );
    case 'paused':
      return (
        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
          <Pause className="w-3 h-3 mr-1" />일시정지
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />해지완료
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="outline" className="bg-neutral-200 text-neutral-600 border-neutral-300">
          만료
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          <CheckCircle className="w-3 h-3 mr-1" />정기공급완료
        </Badge>
      );
  }
}

function getShipmentStatusBadge(status: SubscriptionScheduleRow['status']) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: '예정', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    paid: { label: '결제완료', className: 'bg-green-100 text-green-700 border-green-200' },
    shipped: { label: '출고완료', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    failed: { label: '결제실패', className: 'bg-red-100 text-red-700 border-red-200' },
    skipped: { label: '건너뜀', className: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
    cancelled: { label: '취소', className: 'bg-neutral-100 text-neutral-500 border-neutral-200 line-through' },
  };
  const s = map[status] ?? { label: status, className: 'bg-neutral-100 text-neutral-600' };
  return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return dateStr.replace(/-/g, '.');
}

// ─────────────────────────────────────────
// 위약금 확인 모달
// ─────────────────────────────────────────

interface PenaltyModalProps {
  open: boolean;
  sub: SubscriptionRow;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  processing?: boolean;
}

function PenaltyModal({ open, sub, onConfirm, onClose, processing = false }: PenaltyModalProps) {
  const [reason, setReason] = useState('');
  const penalty = subscriptionService.calculatePenaltyPreview(sub);

  const hasPenalty = penalty.penaltyAmount > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            정기공급 해지 신청
          </DialogTitle>
          <DialogDescription>
            해지 전 아래 내용을 반드시 확인해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 위약금 안내 */}
          <div className={`rounded border p-4 ${hasPenalty ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <p className={`text-sm font-medium mb-3 ${hasPenalty ? 'text-red-700' : 'text-green-700'}`}>
              {hasPenalty ? '⚠️ 중도 해지시 추가정산이 필요합니다' : '✅ 추가정산이 없습니다'}
            </p>

            {/* 요약 */}
            <div className="space-y-1 text-sm mb-3">
              <div className="flex justify-between text-neutral-700">
                <span>기출고 수량</span>
                <span className="font-medium">{penalty.shippedQuantity}개</span>
              </div>
              <div className="flex justify-between text-neutral-700">
                <span>기납부 총액</span>
                <span className="font-medium">{penalty.paidAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-neutral-700">
                <span>
                  단가 재산정액 ({penalty.shippedQuantity}개 기준, 단가{' '}
                  {penalty.shippedQuantity > 0
                    ? Math.round(penalty.regularAmount / penalty.shippedQuantity).toLocaleString()
                    : 0}원)
                </span>
                <span className="font-medium">{penalty.regularAmount.toLocaleString()}원</span>
              </div>
              <div className={`flex justify-between font-semibold border-t pt-1 mt-1 ${hasPenalty ? 'text-red-700' : 'text-green-700'}`}>
                <span>추가정산금액</span>
                <span>{hasPenalty ? `${penalty.penaltyAmount.toLocaleString()}원` : '없음'}</span>
              </div>
            </div>

            {/* 구간별 단가표 */}
            {sub.quantityDiscountTiers && sub.quantityDiscountTiers.length > 0 && (
              <div className="mt-3 p-3 bg-white border border-neutral-200 rounded">
                <p className="text-xs font-semibold text-neutral-700 mb-2">📊 구간별 단가표</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-neutral-50">
                      <th className="px-2 py-1.5 text-left font-medium text-neutral-500 border-b border-neutral-100">수량 구간</th>
                      <th className="px-2 py-1.5 text-right font-medium text-neutral-500 border-b border-neutral-100">단가 (개당)</th>
                      <th className="px-2 py-1.5 text-right font-medium text-neutral-500 border-b border-neutral-100">적용 구간</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {[...sub.quantityDiscountTiers]
                      .sort((a, b) => a.minQty - b.minQty)
                      .map((tier, idx) => {
                        const isApplied =
                          penalty.shippedQuantity >= tier.minQty &&
                          penalty.shippedQuantity <= tier.maxQty;
                        // 구간 단가 = 원가 × (1 - 할인율/100)
                        const tierUnitPrice = Math.round(sub.regularUnitPrice * (1 - tier.discountRate / 100));
                        return (
                          <tr
                            key={idx}
                            className={isApplied ? 'bg-blue-50' : ''}
                          >
                            <td className={`px-2 py-1.5 ${isApplied ? 'font-semibold text-blue-800' : 'text-neutral-600'}`}>
                              {tier.minQty} ~ {tier.maxQty}개
                            </td>
                            <td className={`px-2 py-1.5 text-right font-medium ${isApplied ? 'text-blue-800' : 'text-neutral-600'}`}>
                              {tierUnitPrice.toLocaleString()}원
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              {isApplied ? (
                                <span className="text-blue-700 text-[11px] font-semibold">적용구간</span>
                              ) : (
                                <span className="text-neutral-300">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {penalty.shippedQuantity > 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    ※ 기출고 {penalty.shippedQuantity}개 → {penalty.appliedDiscountRate > 0 ? `${penalty.appliedDiscountRate}% 할인 구간 (${Math.round(sub.regularUnitPrice * (1 - penalty.appliedDiscountRate / 100)).toLocaleString()}원/개)` : `기본 단가 (${sub.regularUnitPrice.toLocaleString()}원/개)`} 적용
                  </p>
                )}
              </div>
            )}

            {/* 추가정산 계산식 */}
            {hasPenalty && (() => {
              // ① 실제 납부 단가 (개당)
              const paidUnitPrice = penalty.shippedQuantity > 0
                ? Math.round(penalty.paidAmount / penalty.shippedQuantity)
                : 0;
              // ② 재산정 단가 (개당)
              const regularUnitPrice = penalty.shippedQuantity > 0
                ? Math.round(penalty.regularAmount / penalty.shippedQuantity)
                : 0;
              return (
                <div className="mt-3 p-3 bg-white border border-red-100 rounded text-xs text-neutral-600 space-y-2">
                  <p className="font-semibold text-neutral-700 mb-2">📐 추가정산 계산식</p>

                  {/* ① 실제 납부금액 */}
                  <div>
                    <p className="text-neutral-500 mb-0.5">① 실제 납부금액 (단가 {paidUnitPrice.toLocaleString()}원)</p>
                    <div className="flex items-center justify-between pl-2">
                      <span className="text-neutral-400">
                        {penalty.shippedQuantity}개 × {paidUnitPrice.toLocaleString()}원
                      </span>
                      <span className="font-medium text-neutral-800">{penalty.paidAmount.toLocaleString()}원</span>
                    </div>
                  </div>

                  {/* ② 단가 재산정액 */}
                  <div>
                    <p className="text-neutral-500 mb-0.5">
                      ② 단가 재산정액 ({penalty.shippedQuantity}개 기준 단가 {regularUnitPrice.toLocaleString()}원)
                    </p>
                    <div className="flex items-center justify-between pl-2">
                      <span className="text-neutral-400">
                        {penalty.shippedQuantity}개 × {regularUnitPrice.toLocaleString()}원
                      </span>
                      <span className="font-medium text-neutral-800">{penalty.regularAmount.toLocaleString()}원</span>
                    </div>
                  </div>

                  {/* 추가정산 */}
                  <div className="border-t border-dashed border-red-200 pt-1.5 flex items-center justify-between font-semibold">
                    <span className="text-red-700">추가정산금액 (② − ①)</span>
                    <span className="text-red-700">{penalty.penaltyAmount.toLocaleString()}원</span>
                  </div>

                  <p className="text-[11px] text-neutral-400 pt-0.5">
                    * 정기공급으로 적용된 단가를 기존 구간별 단가로 재 정산한 차액
                  </p>
                </div>
              );
            })()}

            {hasPenalty && (
              <p className="text-xs text-red-600 mt-2">
                * 추가 정산 금액은 해지 신청 승인 시 청구될 수 있습니다.
              </p>
            )}
          </div>

          {/* 해지 사유 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              해지 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="해지 사유를 입력해주세요"
              className="w-full h-24 px-3 py-2 border border-neutral-300 text-sm text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={processing} className="border-neutral-300">
            취소
          </Button>
          <Button
            onClick={() => !processing && reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || processing}
            className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {processing ? '신청 중...' : '해지 신청'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// 회차 스케줄 아코디언
// ─────────────────────────────────────────

function ShipmentSchedule({
  shipments,
  subStatus,
  isPendingCancellation = false,
}: {
  shipments: SubscriptionScheduleRow[];
  subStatus?: string;
  isPendingCancellation?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const sorted = [...shipments].sort((a, b) => a.roundNo - b.roundNo);

  // 구독 해지 완료 시 출고완료 제외 모든 회차(1회차 포함) 스케줄 '취소'로 표기
  const displayStatus = (s: SubscriptionScheduleRow) => {
    if (subStatus === 'cancelled') {
      return s.status === 'shipped' ? 'shipped' : 'cancelled';
    }
    if (isPendingCancellation && s.status === 'cancelled') {
      return 'pending';
    }
    return s.status;
  };

  return (
    <div className="border border-neutral-200 rounded">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-400" />
          회차별 출고 스케줄 ({shipments.length}회)
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="border-t border-neutral-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600">회차</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600">예정일</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-neutral-600">수량</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-neutral-600">금액</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sorted.map((s) => (
                  <tr key={s.id} className={displayStatus(s) === 'cancelled' ? 'opacity-40' : ''}>
                    <td className="px-4 py-2 text-neutral-900 font-medium">{s.roundNo}회차</td>
                    <td className="px-4 py-2 text-neutral-700">{formatDate(s.scheduledDate)}</td>
                    <td className="px-4 py-2 text-right text-neutral-700">{s.quantity}개</td>
                    <td className="px-4 py-2 text-right text-neutral-700">{s.amount.toLocaleString()}원</td>
                    <td className="px-4 py-2 text-center">{getShipmentStatusBadge(displayStatus(s))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// 주소지 변경 모달
// ─────────────────────────────────────────

interface UpdateDeliveryAddressModalProps {
  sub: SubscriptionRow;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function UpdateDeliveryAddressModal({ sub, open, onClose, onSaved }: UpdateDeliveryAddressModalProps) {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: '', recipient: '', phone: '', zipCode: '', address: '', addressDetail: '' });
  const { alert: globalAlert } = useModal();

  useEffect(() => {
    if (!open) return;
    const fetchAddr = async () => {
      setLoading(true);
      try {
        const user = await authService.getCurrentUser();
        if (!user) return;
        const list = await addressService.getAddresses(user.id);
        setAddresses(list);
        const effectiveAddress = sub.deliveryAddress ?? sub.orderDeliveryAddress;
        const matched = list.find((a) => `${a.address} ${a.addressDetail}`.trim() === effectiveAddress?.trim())
          ?? list.find((a) => a.isDefault) ?? list[0];
        if (matched) setSelectedId(matched.id);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchAddr();
  }, [open, sub.deliveryAddress]);

  const handleAddAddress = async () => {
    if (!newAddr.recipient || !newAddr.address) { await globalAlert('수령인과 주소는 필수 입력사항입니다.'); return; }
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;
      const added = await addressService.addAddress(user.id, { ...newAddr, isDefault: addresses.length === 0 });
      setAddresses((prev) => [...prev, added]);
      setSelectedId(added.id);
      setShowAddForm(false);
      setNewAddr({ label: '', recipient: '', phone: '', zipCode: '', address: '', addressDetail: '' });
    } catch { await globalAlert('배송지 추가 중 오류가 발생했습니다.'); }
  };

  const handleSave = async () => {
    const selected = addresses.find((a) => a.id === selectedId);
    if (!selected) { await globalAlert('배송지를 선택해 주세요.'); return; }
    setSaving(true);
    try {
      const fullAddress = [selected.address, selected.addressDetail].filter(Boolean).join(' ');
      await subscriptionService.updateDeliveryAddress(sub.id, fullAddress);
      await globalAlert('배송지가 변경되었습니다.');
      onSaved(); onClose();
    } catch { await globalAlert('저장 중 오류가 발생했습니다.'); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />주소지 변경
          </DialogTitle>
          <DialogDescription>{sub.product?.name ?? '정기공급'} 구독의 배송지를 변경합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-1">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
          ) : (
            <>
              {addresses.length === 0 && !showAddForm && (
                <p className="text-sm text-neutral-500 text-center py-4">등록된 배송지가 없습니다.</p>
              )}
              {addresses.map((addr) => (
                <label key={addr.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedId === addr.id ? 'border-blue-500 bg-blue-50' : 'border-neutral-200 hover:border-neutral-300'}`}>
                  <input type="radio" name="address" value={addr.id} checked={selectedId === addr.id}
                    onChange={() => setSelectedId(addr.id)} className="accent-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <p className="text-sm font-medium text-neutral-800">{addr.label || '배송지'}</p>
                      {addr.isDefault && <span className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">기본</span>}
                      {((`${addr.address} ${addr.addressDetail}`.trim() === (sub.deliveryAddress ?? sub.orderDeliveryAddress)?.trim())) && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 bg-green-100 text-green-700 rounded">현재</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600">{addr.recipient} · {addr.phone}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">({addr.zipCode}) {addr.address} {addr.addressDetail}</p>
                  </div>
                </label>
              ))}
              {showAddForm ? (
                <div className="border border-dashed border-neutral-300 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-neutral-600">새 배송지 추가</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="별칭 (예: 병원)" value={newAddr.label}
                      onChange={(e) => setNewAddr((p) => ({ ...p, label: e.target.value }))}
                      className="text-sm border border-neutral-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" />
                    <input type="text" placeholder="수령인 *" value={newAddr.recipient}
                      onChange={(e) => setNewAddr((p) => ({ ...p, recipient: e.target.value }))}
                      className="text-sm border border-neutral-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="연락처" value={newAddr.phone}
                      onChange={(e) => setNewAddr((p) => ({ ...p, phone: e.target.value }))}
                      className="text-sm border border-neutral-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" />
                    <input type="text" placeholder="우편번호" value={newAddr.zipCode}
                      onChange={(e) => setNewAddr((p) => ({ ...p, zipCode: e.target.value }))}
                      className="text-sm border border-neutral-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" />
                  </div>
                  <input type="text" placeholder="주소 *" value={newAddr.address}
                    onChange={(e) => setNewAddr((p) => ({ ...p, address: e.target.value }))}
                    className="w-full text-sm border border-neutral-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" />
                  <input type="text" placeholder="상세주소" value={newAddr.addressDetail}
                    onChange={(e) => setNewAddr((p) => ({ ...p, addressDetail: e.target.value }))}
                    className="w-full text-sm border border-neutral-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" />
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleAddAddress} style={{ backgroundColor: '#1d4ed8', color: '#fff' }} className="text-xs hover:opacity-90">추가</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)} className="text-xs">취소</Button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-1.5 p-3 border border-dashed border-neutral-300 rounded-lg text-sm text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 transition-colors">
                  <Plus className="w-4 h-4" />+ 새 배송지 추가하기
                </button>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>닫기</Button>
          <Button onClick={handleSave} disabled={saving || !selectedId}
            style={{ backgroundColor: '#1d4ed8', color: '#fff' }} className="hover:opacity-90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// 구독 카드
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// 결제정보 업데이트 모달
// ─────────────────────────────────────────

interface UpdatePaymentModalProps {
  sub: SubscriptionRow;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function UpdatePaymentModal({ sub, open, onClose, onSaved }: UpdatePaymentModalProps) {
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({ cardName: '', lastFour: '' });
  const { alert: globalAlert } = useModal();

  useEffect(() => {
    if (!open) return;
    const fetchCards = async () => {
      setLoading(true);
      try {
        const user = await authService.getCurrentUser();
        if (!user) return;
        const methods = await paymentService.getPaymentMethods(user.id);
        setCards(methods);
        // 현재 구독에 연결된 결제수단 선택
        const current = methods.find((m) => m.id === sub.billingKeyId) ?? methods[0];
        if (current) setSelectedCardId(current.id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [open, sub.billingKeyId]);

  const handleAddCard = async () => {
    if (!newCard.cardName || newCard.lastFour.length !== 4) {
      await globalAlert('카드사 이름과 카드 번호 끝 4자리를 입력해 주세요.');
      return;
    }
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;
      const added = await paymentService.registerCard(user.id, {
        cardName: newCard.cardName,
        lastFour: newCard.lastFour,
      });
      setCards((prev) => [...prev, added]);
      setSelectedCardId(added.id);
      setShowAddCard(false);
      setNewCard({ cardName: '', lastFour: '' });
    } catch {
      await globalAlert('카드 등록 중 오류가 발생했습니다.');
    }
  };

  const handleSave = async () => {
    if (!selectedCardId) {
      await globalAlert('결제 카드를 선택해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const selectedCard = cards.find((c) => c.id === selectedCardId);
      if (!selectedCard) return;
      // 구독의 billing_key_id 업데이트
      await subscriptionService.updateBillingKey(sub.id, selectedCardId);
      await globalAlert('결제 정보가 업데이트되었습니다.\n다음 결제일에 새 카드로 결제가 진행됩니다.');
      onSaved();
      onClose();
    } catch {
      await globalAlert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const failedShipment = (sub.shipments ?? []).find((s) => s.status === 'failed');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            결제정보 업데이트
          </DialogTitle>
          <DialogDescription>
            {sub.product?.name ?? '정기공급'} 구독의 결제 카드를 변경합니다.
          </DialogDescription>
        </DialogHeader>

        {/* 실패 사유 안내 */}
        {failedShipment && (
          <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">
                {failedShipment.roundNo}회차 결제카드 오류(한도초과)로 결제가 실패되었습니다.
              </p>
              <p className="text-xs text-red-500 mt-0.5">
                실패 사유에 따른 조치를 하시거나 카드정보를 업데이트하신 후 재개하기 버튼을 눌러주세요.
              </p>
            </div>
          </div>
        )}

        {/* 카드 목록 */}
        <div className="space-y-2 mt-1">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          ) : (
            <>
              {cards.map((card) => (
                <label
                  key={card.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedCardId === card.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="card"
                    value={card.id}
                    checked={selectedCardId === card.id}
                    onChange={() => setSelectedCardId(card.id)}
                    className="accent-blue-600"
                  />
                  <CreditCard className="w-4 h-4 text-neutral-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800">
                      {card.alias || card.cardName}
                    </p>
                    <p className="text-xs text-neutral-500">{card.cardNumberMasked}</p>
                  </div>
                  {card.isDefault && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                      기본
                    </span>
                  )}
                  {/* 오류 카드 표시 */}
                  {card.id === sub.billingKeyId && failedShipment && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                      오류
                    </span>
                  )}
                </label>
              ))}

              {/* 새 카드 추가 */}
              {showAddCard ? (
                <div className="border border-dashed border-neutral-300 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-neutral-600">새 신용카드 등록</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="카드사명 (예: 신한)"
                      value={newCard.cardName}
                      onChange={(e) => setNewCard((p) => ({ ...p, cardName: e.target.value }))}
                      className="flex-1 text-sm border border-neutral-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
                    />
                    <input
                      type="text"
                      placeholder="끝 4자리"
                      maxLength={4}
                      value={newCard.lastFour}
                      onChange={(e) => setNewCard((p) => ({ ...p, lastFour: e.target.value.replace(/\D/g, '') }))}
                      className="w-24 text-sm border border-neutral-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddCard} className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
                      등록
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddCard(false)} className="text-xs">
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddCard(true)}
                  className="w-full flex items-center justify-center gap-1.5 p-3 border border-dashed border-neutral-300 rounded-lg text-sm text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />+ 새 신용카드 등록하기
                </button>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            닫기
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !selectedCardId}
            style={{ backgroundColor: '#1d4ed8', color: '#fff' }}
            className="hover:opacity-90"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// 일시정지 확인 모달
// ─────────────────────────────────────────

interface PauseModalProps {
  open: boolean;
  sub: SubscriptionRow;
  pauseMaxCount: number;
  pauseMaxDays: number;
  onClose: () => void;
  onConfirm: () => void;
  processing?: boolean;
}

function PauseModal({ open, sub, pauseMaxCount, pauseMaxDays, onClose, onConfirm, processing = false }: PauseModalProps) {
  // 일시정지 후 자동 재개 예정일 = 오늘 + pauseMaxDays
  const autoResumeDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + pauseMaxDays);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  })();

  const remaining = pauseMaxCount - sub.pauseCount;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pause className="w-5 h-5 text-amber-500" />
            정기공급 일시정지
          </DialogTitle>
          <DialogDescription>
            일시정지 전 아래 내용을 확인해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* 횟수 안내 */}
          <div className={`p-4 rounded border ${remaining <= 1 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className={`flex items-center justify-between text-sm font-semibold ${remaining <= 1 ? 'text-red-700' : 'text-amber-800'}`}>
              <span>일시정지 사용 횟수</span>
              <span>{sub.pauseCount}회 / {pauseMaxCount}회</span>
            </div>
            {remaining <= 1 && (
              <p className="text-xs text-red-600 mt-1">
                {remaining === 0 ? '사용 가능한 횟수를 모두 소진했습니다.' : '마지막 일시정지 횟수입니다.'}
              </p>
            )}
          </div>
          {/* 자동 재개 예정일 안내 */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            <p>일시정지는 도래하는 결제일로부터 최대 <span className="font-semibold">{pauseMaxDays}일</span>간 적용됩니다.</p>
            <p className="mt-1">자동 재개 예정일: <span className="font-semibold">{autoResumeDate}</span></p>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={processing} className="border-neutral-300">
            취소
          </Button>
          <Button
            onClick={() => !processing && onConfirm()}
            disabled={processing}
            style={{ backgroundColor: '#d97706', color: '#fff' }}
            className="hover:opacity-90 disabled:opacity-50"
          >
            {processing ? '처리 중...' : '일시정지'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// 재개 옵션 모달
// ─────────────────────────────────────────

interface ResumeModalProps {
  open: boolean;
  sub: SubscriptionRow;
  pauseMaxDays: number;
  onClose: () => void;
  onResume: (immediate: boolean) => void;
  processing?: boolean;
}

function ResumeModal({ open, sub, pauseMaxDays, onClose, onResume, processing = false }: ResumeModalProps) {
  // 자동 재개 예정일 계산: pausedAt + pauseMaxDays
  const autoResumeDate = (() => {
    if (!sub.pausedAt) return null;
    const d = new Date(sub.pausedAt);
    d.setDate(d.getDate() + pauseMaxDays);
    return d;
  })();
  const autoResumeDateStr = autoResumeDate
    ? `${autoResumeDate.getFullYear()}.${String(autoResumeDate.getMonth()+1).padStart(2,'0')}.${String(autoResumeDate.getDate()).padStart(2,'0')}`
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-green-600" />
            정기공급 재개
          </DialogTitle>
          <DialogDescription>
            재개 방식을 선택해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* 자동 재개 안내 */}
          {autoResumeDateStr && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              현재 자동 재개 예정일: <span className="font-semibold">{autoResumeDateStr}</span>
            </div>
          )}
          {/* 옵션 카드 */}
          <button
            onClick={() => !processing && onResume(false)}
            disabled={processing}
            className="w-full text-left p-4 border border-neutral-200 rounded hover:border-neutral-400 hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            <p className="font-medium text-neutral-900 mb-0.5">📅 다음 결제일에 재개</p>
            <p className="text-xs text-neutral-500">도래하는 정기 결제일부터 정상 진행됩니다.</p>
          </button>
          <button
            onClick={() => !processing && onResume(true)}
            disabled={processing}
            className="w-full text-left p-4 border border-green-200 rounded hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            <p className="font-medium text-green-700 mb-0.5">⚡ 즉시 결제 후 재개</p>
            <p className="text-xs text-neutral-500">지금 바로 다음 회차 결제를 진행하고 정기공급을 재개합니다.</p>
          </button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={processing} className="border-neutral-300 w-full">
            {processing ? '처리 중...' : '취소'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// 구독 카드
// ─────────────────────────────────────────

interface SubscriptionCardProps {
  sub: SubscriptionRow;
  cancellationRequest?: CancellationRequest;
  pauseMaxCount: number;
  pauseMaxDays: number;
  onPause: (sub: SubscriptionRow) => void;
  onResume: (sub: SubscriptionRow) => void;
  onCancel: (sub: SubscriptionRow) => void;
  onUpdatePayment: (sub: SubscriptionRow) => void;
  onChangeAddress: (sub: SubscriptionRow) => void;
  onRetryPayment: (sub: SubscriptionRow) => void;
}

function SubscriptionCard({ sub, cancellationRequest, pauseMaxCount, pauseMaxDays, onPause, onResume, onCancel, onUpdatePayment, onChangeAddress, onRetryPayment }: SubscriptionCardProps) {
  const isActive = sub.status === 'active';
  const isPaused = sub.status === 'paused';
  const isCancelled = sub.status === 'cancelled' || sub.status === 'expired';
  const hasFailedPayment = isActive && (sub.shipments ?? []).some((sh) => sh.status === 'failed');
  const failedRound = hasFailedPayment
    ? (sub.shipments ?? []).find((sh) => sh.status === 'failed')
    : null;

  return (
    <div className={`bg-white border ${hasFailedPayment ? 'border-red-200' : 'border-neutral-200'} p-6 space-y-4 ${isCancelled ? 'opacity-60' : ''}`}>
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-medium text-neutral-900">
              {sub.product?.name ?? '상품명 로딩 중'}
            </h4>
            {cancellationRequest?.status === 'pending' ? (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                <AlertTriangle className="w-3 h-3 mr-1" />해지신청중
              </Badge>
            ) : hasFailedPayment ? (
              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                <AlertTriangle className="w-3 h-3 mr-1" />결제실패
              </Badge>
            ) : (
              getStatusBadge(sub.status)
            )}
          </div>
          <p className="text-sm text-neutral-500">
            총 {sub.totalQuantity}개 · {sub.cycleMonths}개월 주기 · 총 {sub.totalRounds}회
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">
            구독번호: {sub.subscriptionNo || (sub.id ? `SUB-${sub.id.slice(0, 8).toUpperCase()}` : '-')}
          </p>
          {hasFailedPayment && failedRound && (
            <p className="text-xs font-semibold mt-1" style={{ color: '#dc2626' }}>
              ⚠ {failedRound.roundNo}회차 결제가 실패하였습니다. 결제 수단을 확인해 주세요.
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-500">회차별 결제금액</p>
          <p className="text-base font-semibold text-neutral-900">
            {sub.unitPrice.toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 진행 정보 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded">
          <RefreshCw className="w-4 h-4 text-neutral-400 shrink-0" />
          <div>
            <p className="text-xs text-neutral-500">진행 회차</p>
            <p className="text-sm font-medium text-neutral-900">
              {sub.currentRound} / {sub.totalRounds}회
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded">
          <Package className="w-4 h-4 text-neutral-400 shrink-0" />
          <div>
            <p className="text-xs text-neutral-500">회차별 출고</p>
            <p className="text-sm font-medium text-neutral-900">{sub.qtyPerRound}개</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded">
          <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
          <div>
            <p className="text-xs text-neutral-500">다음 결제일</p>
            <p className="text-sm font-medium text-neutral-900">
              {isActive ? formatDate(sub.nextBillingDate) : '-'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded">
          <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
          <div>
            <p className="text-xs text-neutral-500">최근 결제일</p>
            <p className="text-sm font-medium text-neutral-900">
              {formatDate(sub.lastBillingDate)}
            </p>
          </div>
        </div>
      </div>

      {/* 배송지 */}
      <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-100 rounded">
        <div className="flex items-start gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-neutral-500 mb-0.5 flex items-center gap-1.5">
              배송지
              {sub.deliveryAddress ? (
                <span className="text-[10px] font-medium px-1 py-0.5 bg-blue-100 text-blue-600 rounded">변경됨</span>
              ) : sub.orderDeliveryAddress ? (
                <span className="text-[10px] font-medium px-1 py-0.5 bg-neutral-100 text-neutral-500 rounded">주문시점 배송지</span>
              ) : null}
            </p>
            <p className="text-sm text-neutral-800 truncate">
              {sub.deliveryAddress ?? sub.orderDeliveryAddress ?? '배송지 정보 없음'}
            </p>
          </div>
        </div>
        {!isCancelled && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 ml-2 text-xs border-neutral-300 text-neutral-600 hover:bg-neutral-100"
            onClick={() => onChangeAddress(sub)}
          >
            <Edit2 className="w-3 h-3 mr-1" />주소지 변경
          </Button>
        )}
      </div>

      {/* 회차 스케줄 */}
      {sub.shipments && sub.shipments.length > 0 && (
        <ShipmentSchedule
          shipments={sub.shipments}
          subStatus={sub.status}
          isPendingCancellation={cancellationRequest?.status === 'pending'}
        />
      )}

      {/* 해지 안내 */}
      {isCancelled && sub.cancelledAt && (
        <div className="flex items-start gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded text-sm text-neutral-600">
          <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <span>
            {formatDate(sub.cancelledAt.split('T')[0])} 해지됨
            {sub.cancelReason && ` · ${sub.cancelReason}`}
          </span>
        </div>
      )}

      {/* 추가정산 안내 */}
      {isCancelled && cancellationRequest && (
        <div className={`p-4 rounded border space-y-3 ${
          cancellationRequest.status === 'pending'
            ? 'bg-amber-50 border-amber-200'
            : cancellationRequest.adminAction === 'charge' && cancellationRequest.penaltyAmount > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <p className={`text-sm font-medium flex items-center gap-1.5 ${
            cancellationRequest.status === 'pending'
              ? 'text-amber-700'
              : cancellationRequest.adminAction === 'charge' && cancellationRequest.penaltyAmount > 0
              ? 'text-red-700'
              : 'text-green-700'
          }`}>
            {cancellationRequest.status === 'pending' && (
              <><AlertTriangle className="w-4 h-4" />추가정산 검토 중</>)}
            {cancellationRequest.status === 'processed' && cancellationRequest.adminAction === 'charge' && cancellationRequest.penaltyAmount > 0 && (
              <><AlertTriangle className="w-4 h-4" />추가정산 청구됨</>)}
            {cancellationRequest.status === 'processed' && (cancellationRequest.adminAction === 'waive' || cancellationRequest.penaltyAmount <= 0) && (
              <><CheckCircle className="w-4 h-4" />추가정산 없음</>)}
          </p>

          {/* 산출 근거 */}
          <div className="space-y-1.5 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>기출고 수량</span>
              <span className="font-medium">{cancellationRequest.shippedQuantity}개</span>
            </div>
            <div className="flex justify-between">
              <span>실제 납부금액</span>
              <span className="font-medium">{cancellationRequest.paidAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span>단가 재산정액</span>
              <span className="font-medium">{cancellationRequest.regularAmount.toLocaleString()}원</span>
            </div>
            {cancellationRequest.penaltyAmount > 0 && (
              <div className="flex justify-between pt-1.5 border-t border-current border-opacity-20">
                <span className="font-medium">추가정산 금액</span>
                <span className="font-semibold text-red-600">
                  {cancellationRequest.penaltyAmount.toLocaleString()}원
                </span>
              </div>
            )}
          </div>

          {/* 결제 스케줄 */}
          {cancellationRequest.penaltyAmount > 0 && (
            <div className="border-t border-current border-opacity-20 pt-3">
              <p className="text-xs font-medium text-neutral-600 mb-2">추가정산 결제 내역</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-neutral-500">
                    <th className="text-left font-medium py-1 pr-3">구분</th>
                    <th className="text-left font-medium py-1 pr-3">일자</th>
                    <th className="text-right font-medium py-1 pr-3">금액</th>
                    <th className="text-center font-medium py-1">상태</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1.5 pr-3 text-neutral-700">추가정산</td>
                    <td className="py-1.5 pr-3 text-neutral-600">
                      {cancellationRequest.status === 'processed' && cancellationRequest.processedAt
                        ? formatDate(cancellationRequest.processedAt.split('T')[0])
                        : formatDate(cancellationRequest.createdAt.split('T')[0])}
                    </td>
                    <td className="py-1.5 pr-3 text-right font-medium text-red-600">
                      {cancellationRequest.penaltyAmount.toLocaleString()}원
                    </td>
                    <td className="py-1.5 text-center">
                      {cancellationRequest.status === 'pending' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                          청구예정
                        </span>
                      )}
                      {cancellationRequest.status === 'processed' && cancellationRequest.adminAction === 'charge' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                          결제완료
                        </span>
                      )}
                      {cancellationRequest.status === 'processed' && cancellationRequest.adminAction === 'waive' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                          면제
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {cancellationRequest.status === 'pending' && (
            <p className="text-xs text-amber-600">
              * 추가 정산 금액은 해지 신청 후 승인 시 청구될 수 있습니다.
            </p>
          )}
        </div>
      )}

      {/* 버튼 */}
      {!isCancelled && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {/* 처리대기 중인 해지신청이 있을 때 */}
          {cancellationRequest?.status === 'pending' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium">해지신청 처리대기 중</span>
              <span className="text-xs text-amber-500">· 관리자 검토 후 처리됩니다</span>
            </div>
          ) : (
            <>
              {isActive && (
                <>
                  {/* 결제실패 건: 결제정보 업데이트 버튼 우선 노출 */}
                  {hasFailedPayment ? (
                    <>
                      {/* 재개하기 버튼 */}
                      <Button
                        size="sm"
                        onClick={() => onRetryPayment(sub)}
                        style={{ backgroundColor: '#16a34a', color: '#fff' }}
                        className="hover:opacity-90"
                      >
                        <Play className="w-3.5 h-3.5 mr-1" />재개하기
                      </Button>
                      {/* 결제정보 업데이트 */}
                      <Button
                        size="sm"
                        onClick={() => onUpdatePayment(sub)}
                        style={{ backgroundColor: '#1d4ed8', color: '#fff' }}
                        className="hover:opacity-90"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1" />결제정보 업데이트
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* 일시정지 안내 */}
                      <div className="w-full mb-2 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 space-y-1">
                        <p>
                          일시정지는 도래하는 결제일로부터 최대 {pauseMaxDays}일간 가능하며,
                          일시정지 후 자동으로 다시 재개됩니다.
                        </p>
                        <div className="flex items-center gap-1 font-semibold">
                          <span>일시정지 횟수:</span>
                          <span className={sub.pauseCount >= pauseMaxCount ? 'text-red-600' : 'text-amber-700'}>
                            {sub.pauseCount}회 / {pauseMaxCount}회
                          </span>
                          {sub.pauseCount >= pauseMaxCount && (
                            <span className="text-red-600 font-medium">(사용 횟수 초과)</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPause(sub)}
                        disabled={sub.pauseCount >= pauseMaxCount}
                        className="border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Pause className="w-3.5 h-3.5 mr-1" />일시정지
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancel(sub)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />해지 신청
                  </Button>
                </>
              )}
              {isPaused && (
                <>
                  {/* 자동 재개일 안내 */}
                  {sub.pausedAt && (() => {
                    const d = new Date(sub.pausedAt);
                    d.setDate(d.getDate() + pauseMaxDays);
                    const str = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
                    return (
                      <div className="w-full mb-2 p-4 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        자동 재개 예정일: <span className="font-semibold">{str}</span>
                      </div>
                    );
                  })()}
                  <Button
                    size="sm"
                    onClick={() => hasFailedPayment ? onRetryPayment(sub) : onResume(sub)}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />재개하기
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────

export function MySubscriptionsPage() {
  const { alert: globalAlert, confirm: globalConfirm } = useModal();

  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [cancellationMap, setCancellationMap] = useState<Record<string, CancellationRequest>>({});
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState<'all' | 'active' | 'failed' | 'paused' | 'completed' | 'cancelled'>('all');

  // 해지 신청 모달
  const [cancelTarget, setCancelTarget] = useState<SubscriptionRow | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pauseMaxCount, setPauseMaxCount] = useState(2);
  const [pauseMaxDays, setPauseMaxDays] = useState(30);
  // 일시정지 모달
  const [pauseTarget, setPauseTarget] = useState<SubscriptionRow | null>(null);
  const [pauseProcessing, setPauseProcessing] = useState(false);
  // 재개 모달
  const [resumeTarget, setResumeTarget] = useState<SubscriptionRow | null>(null);
  const [resumeProcessing, setResumeProcessing] = useState(false);

  // 결제정보 업데이트 모달
  const [updatePaymentTarget, setUpdatePaymentTarget] = useState<SubscriptionRow | null>(null);

  // 주소지 변경 모달
  const [updateAddressTarget, setUpdateAddressTarget] = useState<SubscriptionRow | null>(null);
  const [retryingSubId, setRetryingSubId] = useState<string | null>(null);

  // ── 데이터 로드 ──
  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = (await authService.getCurrentUser()) || storage.getUser();
      const userId = currentUser?.id || '';
      const [data, cancellations] = await Promise.all([
        subscriptionService.getMySubscriptions(userId),
        subscriptionService.getMyCancellationRequests(userId),
      ]);
      setSubscriptions(data);
      // subscriptionId 기준으로 가장 최근 해지신청 1건씩 매핑
      const map: Record<string, CancellationRequest> = {};
      cancellations.forEach((c) => {
        if (!map[c.subscriptionId]) map[c.subscriptionId] = c;
      });
      setCancellationMap(map);
    } catch (e) {
      console.error(e);
      setSubscriptions([]);
      setCancellationMap({});
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetryPayment = useCallback(async (sub: SubscriptionRow) => {
    if (retryingSubId) return;
    const ok = await globalConfirm('변경된 결제수단으로 결제를 진행합니다.\n진행하시겠습니까?');
    if (!ok) return;
    setRetryingSubId(sub.id);
    try {
      const result = await subscriptionService.retryFailedPayment(sub);
      if (result.success) {
        await globalAlert(result.message);
        await loadSubscriptions();
      } else {
        await globalAlert(result.message);
      }
    } catch (e: any) {
      await globalAlert(e?.message ?? '결제 재시도 중 오류가 발생했습니다.');
    } finally {
      setRetryingSubId(null);
    }
  }, [retryingSubId, loadSubscriptions, globalConfirm]);

  useEffect(() => {
    loadSubscriptions();
    // 정기공급 설정 로드
    shopSettingsService.getAll().then((settings) => {
      const count = Number(settings['sub_pause_max_count'] ?? 2);
      const days = Number(settings['sub_pause_max_days'] ?? 30);
      if (!isNaN(count) && count > 0) setPauseMaxCount(count);
      if (!isNaN(days) && days > 0) setPauseMaxDays(days);
    }).catch(() => {});
  }, [loadSubscriptions]);

  // ── 일시정지 (모달에서 확인 후 호출) ──
  const handlePause = (sub: SubscriptionRow) => {
    setPauseTarget(sub);
  };

  const handlePauseConfirm = async () => {
    if (!pauseTarget) return;
    setPauseProcessing(true);
    try {
      await subscriptionService.pauseSubscription(pauseTarget.id);
      setPauseTarget(null);
      await globalAlert('일시정지되었습니다.');
      loadSubscriptions();
    } catch {
      await globalAlert('처리 중 오류가 발생했습니다.');
    } finally {
      setPauseProcessing(false);
    }
  };

  // ── 재개 (모달에서 옵션 선택 후 호출) ──
  const handleResume = (sub: SubscriptionRow) => {
    setResumeTarget(sub);
  };

  const handleResumeConfirm = async (immediate: boolean) => {
    if (!resumeTarget) return;
    setResumeProcessing(true);
    try {
      await subscriptionService.resumeSubscription(resumeTarget.id, immediate);
      setResumeTarget(null);
      await globalAlert(
        immediate
          ? '즉시 재개되었습니다. 다음 회차 결제를 진행합니다.'
          : '재개되었습니다. 다음 결제일부터 진행됩니다.'
      );
      loadSubscriptions();
    } catch {
      await globalAlert('처리 중 오류가 발생했습니다.');
    } finally {
      setResumeProcessing(false);
    }
  };

  // ── 해지 신청 (위약금 모달에서 확인 후 호출) ──
  const handleCancelConfirm = async (reason: string) => {
    if (!cancelTarget) return;
    setProcessing(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;
      await subscriptionService.requestCancellation({
        subscriptionId: cancelTarget.id,
        userId: user.id,
        cancelReason: reason,
        sub: cancelTarget,
      });
      setCancelTarget(null);
      await globalAlert(
        '해지 신청이 접수되었습니다.\n관리자 검토 후 처리 결과를 안내드립니다.'
      );
      loadSubscriptions();
    } catch {
      await globalAlert('처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  // ── 집계 ──
  const isPaymentFailed = (s: SubscriptionRow) =>
    s.status === 'active' && (s.shipments ?? []).some((sh) => sh.status === 'failed');

  const failed   = subscriptions.filter(isPaymentFailed);
  const active   = subscriptions.filter((s) => s.status === 'active' && !isPaymentFailed(s));
  const paused   = subscriptions.filter((s) => s.status === 'paused');
  const cancelled = subscriptions.filter((s) => s.status === 'cancelled');
  const completed = subscriptions.filter((s) => s.status === 'completed' || s.status === 'expired');

  const tabs = [
    { key: 'all' as const,       label: '전체',     count: subscriptions.length, color: 'text-neutral-900' },
    { key: 'active' as const,    label: '진행중',   count: active.length,        color: 'text-green-600' },
    { key: 'failed' as const,    label: '결제실패', count: failed.length,        color: 'text-red-600' },
    { key: 'paused' as const,    label: '일시정지', count: paused.length,        color: 'text-orange-500' },
    { key: 'completed' as const, label: '완료',     count: completed.length,     color: 'text-blue-600' },
    { key: 'cancelled' as const, label: '해지',     count: cancelled.length,     color: 'text-red-500' },
  ];

  const filtered =
    tabFilter === 'active'    ? active :
    tabFilter === 'failed'    ? failed :
    tabFilter === 'paused'    ? paused :
    tabFilter === 'cancelled' ? cancelled :
    tabFilter === 'completed' ? completed :
    subscriptions;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl tracking-tight text-neutral-900 mb-1">정기공급 관리</h2>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTabFilter(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tabFilter === tab.key
                ? `border-neutral-900 ${tab.color}`
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs px-2 py-0.5 rounded-full ${
              tabFilter === tab.key ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-neutral-200 p-16 text-center">
          <RefreshCw className="w-14 h-14 text-neutral-200 mx-auto mb-4" />
          <h3 className="text-base font-medium text-neutral-700 mb-1">
            {tabFilter === 'cancelled' ? '해지된 구독이 없습니다' :
             tabFilter === 'active' ? '진행중인 구독이 없습니다' :
             tabFilter === 'failed' ? '결제실패 구독이 없습니다' :
             '정기공급 내역이 없습니다'}
          </h3>
          <p className="text-sm text-neutral-500">자주 사용하는 소모품을 정기공급으로 편리하게 받아보세요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              cancellationRequest={cancellationMap[sub.id]}
              pauseMaxCount={pauseMaxCount}
              pauseMaxDays={pauseMaxDays}
              onPause={handlePause}
              onResume={handleResume}
              onCancel={setCancelTarget}
              onUpdatePayment={setUpdatePaymentTarget}
              onChangeAddress={setUpdateAddressTarget}
              onRetryPayment={handleRetryPayment}
            />
          ))}
        </div>
      )}

      {/* 일시정지 확인 모달 */}
      {pauseTarget && (
        <PauseModal
          open={!!pauseTarget}
          sub={pauseTarget}
          pauseMaxCount={pauseMaxCount}
          pauseMaxDays={pauseMaxDays}
          onClose={() => !pauseProcessing && setPauseTarget(null)}
          onConfirm={handlePauseConfirm}
          processing={pauseProcessing}
        />
      )}

      {/* 위약금 확인 + 해지신청 모달 */}
      {cancelTarget && (
        <PenaltyModal
          open={!!cancelTarget}
          sub={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => !processing && setCancelTarget(null)}
          processing={processing}
        />
      )}

      {/* 결제정보 업데이트 모달 */}
      {updatePaymentTarget && (
        <UpdatePaymentModal
          open={!!updatePaymentTarget}
          sub={updatePaymentTarget}
          onClose={() => setUpdatePaymentTarget(null)}
          onSaved={loadSubscriptions}
        />
      )}

      {/* 주소지 변경 모달 */}
      {updateAddressTarget && (
        <UpdateDeliveryAddressModal
          open={!!updateAddressTarget}
          sub={updateAddressTarget}
          onClose={() => setUpdateAddressTarget(null)}
          onSaved={loadSubscriptions}
        />
      )}

      {/* 재개 옵션 모달 */}
      {resumeTarget && (
        <ResumeModal
          open={!!resumeTarget}
          sub={resumeTarget}
          pauseMaxDays={pauseMaxDays}
          onClose={() => !resumeProcessing && setResumeTarget(null)}
          onResume={handleResumeConfirm}
          processing={resumeProcessing}
        />
      )}
    </div>
  );
}