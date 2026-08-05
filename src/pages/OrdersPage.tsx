import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { Package, Copy, Loader2, AlertTriangle, RefreshCw, Truck, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Plus, FileText, Printer } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { useShopSettings } from '../hooks/useShopSettings';
import { ProductImage } from '../components/ui/ProductImage';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { Product, ClaimInfo, User, Order } from '../types';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import { creditService } from '../services/creditService';
import { paymentService } from '../services/paymentService';
import { subscriptionService } from '../services/subscriptionService';
import { PaymentMethod } from '../types';
import { printReceipt } from '../utils/printUtils';

import { toast } from 'sonner';

// ─── 클레임 신청 모달 ────────────────────────────────────────────────────────
interface ClaimModalProps {
  orderId: string;
  type: 'RETURN' | 'EXCHANGE' | 'CANCEL';
  paymentMethod: string;
  status: string;
  onClose: () => void;
  onSuccess: () => void;
}

function ClaimModal({ orderId, type, paymentMethod, status, onClose, onSuccess }: ClaimModalProps) {
  const [reason, setReason] = useState('');
  const [refundBank, setRefundBank] = useState('');
  const [refundAccount, setRefundAccount] = useState('');
  const [refundHolder, setRefundHolder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const title = type === 'RETURN' ? '반품 신청' : type === 'EXCHANGE' ? '교환 신청' : '결제 취소';

  const isCreditImmediate = ['credit', 'split'].includes(paymentMethod) && ['pending', 'paid'].includes(status);
  const isBankImmediate = ['transfer', 'virtual'].includes(paymentMethod) && status === 'pending';
  const isImmediate = type === 'CANCEL' && (isCreditImmediate || isBankImmediate);

  const isManualRefund = ['transfer', 'virtual'].includes(paymentMethod) && (type === 'CANCEL' || type === 'RETURN') && !isImmediate;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('사유를 입력해주세요.');
      return;
    }
    if (isManualRefund && (!refundBank || !refundAccount || !refundHolder)) {
      alert('환불 받으실 계좌 정보를 모두 입력해주세요.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const refundInfo = isManualRefund ? { bank: refundBank, account: refundAccount, holder: refundHolder } : undefined;
      await orderService.requestClaim(orderId, type, reason, refundInfo);
      if (type === 'CANCEL') {
        try {
          await subscriptionService.cancelSubscriptionByOrderId(orderId, reason);
        } catch (subErr) {
          console.error('Failed to cancel connected subscription record:', subErr);
        }
      }
      onSuccess();
    } catch (e) {
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm mx-4 shadow-2xl">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 transition-colors text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              {title} 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={`${title} 사유를 상세히 입력해주세요.`}
              rows={3}
              className="w-full px-3 py-2.5 border border-neutral-300 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all resize-none placeholder:text-neutral-300"
            />
          </div>
          
          {isManualRefund && (
            <div className="pt-4 border-t border-neutral-100 space-y-3">
              <label className="block text-sm font-semibold text-neutral-900">
                환불 계좌 정보 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="은행명"
                  value={refundBank}
                  onChange={e => setRefundBank(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <input
                  type="text"
                  placeholder="예금주"
                  value={refundHolder}
                  onChange={e => setRefundHolder(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <input
                type="text"
                placeholder="계좌번호 (- 제외)"
                value={refundAccount}
                onChange={e => setRefundAccount(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3 py-2 border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <p className="text-[11px] text-orange-600">
                * 무통장입금 취소/반품 시 환불받을 본인 명의의 계좌를 입력해주세요.
              </p>
            </div>
          )}
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            {type === 'CANCEL' ? (
              ['pending', 'paid'].includes(status)
                ? '* [결제 취소] 클릭 시 결제 카드 승인 취소 및 환불 처리가 즉시 진행됩니다.'
                : '* 배송준비중 상태의 주문 취소 신청은 담당자가 확인 후 처리해 드립니다.'
            ) : (
              '* 신청 후 영업일 기준 1~3일 이내 담당자가 확인 후 연락드립니다.'
            )}
          </p>
        </div>
        <div className="px-5 py-3 border-t border-neutral-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2.5 border border-neutral-300 text-neutral-900 text-sm font-bold hover:bg-neutral-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-3 py-2.5 bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? '처리 중...' : type === 'CANCEL' ? '결제 취소' : `${title} 신청`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── 잔여금액 결제 모달 ────────────────────────────────────────────────────────
interface RemainingPaymentModalProps {
  orderId: string;
  remainingAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

function RemainingPaymentModal({ orderId, remainingAmount, onClose, onSuccess }: RemainingPaymentModalProps) {
  const [method, setMethod] = useState<'credit' | 'general'>('credit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCards, setUserCards] = useState<PaymentMethod[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<number>(remainingAmount);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          const cards = await paymentService.getPaymentMethods(user.id);
          setUserCards(cards);
          if (cards.length > 0) setSelectedCardId(cards[0].id);
        }
      } catch (e) {
        console.error('Failed to load cards:', e);
      }
    };
    loadCards();
  }, []);

  const handleSubmit = async () => {
    if (payAmount <= 0 || payAmount > remainingAmount) {
      toast.error(`결제 금액을 정확히 입력해주세요. (최대 ₩${remainingAmount.toLocaleString()})`);
      return;
    }
    if (method === 'credit' && !selectedCardId) {
      toast.error('결제할 등록된 카드를 선택해주세요.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await orderService.payRemainingBalance(orderId, payAmount, method, method === 'credit' ? selectedCardId : undefined);
      toast.success('잔여금액 결제가 완료되었습니다.');
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || '결제 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm mx-4 shadow-2xl">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900 tracking-tight">잔여금액 결제</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 transition-colors text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-neutral-50 p-4 border border-neutral-200">
             <div className="flex justify-between items-center mb-2">
               <label className="text-xs font-bold text-neutral-700">결제할 금액</label>
               <span className="text-xs text-neutral-500">잔여: ₩{remainingAmount.toLocaleString()}</span>
             </div>
             <div className="flex gap-2">
               <input
                 type="text"
                 value={payAmount ? payAmount.toLocaleString() : ''}
                 onChange={(e) => {
                   const val = Number(e.target.value.replace(/[^0-9]/g, ''));
                   setPayAmount(val > remainingAmount ? remainingAmount : val);
                 }}
                 className="w-full px-3 py-2 border border-neutral-300 text-lg font-bold text-right focus:outline-none focus:border-neutral-900 bg-white"
               />
               <span className="flex items-center font-bold text-neutral-500">원</span>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
             <button onClick={() => setMethod('credit')} className={`py-3 text-xs font-bold border-2 ${method === 'credit' ? 'border-neutral-900 text-neutral-900' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'}`}>등록된 신용카드</button>
             <button onClick={() => setMethod('general')} className={`py-3 text-xs font-bold border-2 ${method === 'general' ? 'border-neutral-900 text-neutral-900' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'}`}>일반결제</button>
          </div>

          {method === 'credit' && (
            <div className="mt-4">
              <label className="block text-xs font-bold text-neutral-700 mb-2">결제할 카드 선택</label>
              {userCards.length > 0 ? (
                <select
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 text-sm focus:ring-1 focus:ring-neutral-900 bg-white outline-none"
                >
                  {userCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.alias || card.cardName} ({card.cardNumberMasked})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-red-500 p-2 bg-red-50 border border-red-100 mt-2">
                  등록된 카드가 없습니다. 마이페이지 &gt; 결제수단 관리에서 카드를 먼저 등록해주세요.
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-neutral-100 flex gap-2">
          <button onClick={onClose} className="flex-1 px-3 py-2.5 border border-neutral-300 text-neutral-900 text-sm font-bold hover:bg-neutral-50 transition-colors">취소</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || (method === 'credit' && userCards.length === 0)} 
            className="flex-1 px-3 py-2.5 bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? '처리 중...' : '결제하기'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── 영수증 모달 ──────────────────────────────────────────────────────────────
interface ReceiptModalProps {
  order: Order;
  userProfile: User | null;
  creditUsed?: number;
  subProductsMap: Record<string, Product>;
  shopSettings?: Record<string, string>;
  onClose: () => void;
}

function ReceiptModal({ order, userProfile, creditUsed = 0, subProductsMap, shopSettings, onClose }: ReceiptModalProps) {
  const companyName = shopSettings?.company_name || '(주)제이시스메디칼';
  const businessNumber = shopSettings?.business_number || '424-87-00852';
  const ceoName = shopSettings?.ceo_name || '이라미';
  const phone = shopSettings?.cs_phone || shopSettings?.as_phone || '070-7435-4927';
  const companyAddress = shopSettings?.company_address || '서울특별시 금천구 가마산로 96';

  let paidTotal = 0;
  order.items.forEach(it => {
    const isBundle = (it.selectedProductIds || []).length > 0;
    if (isBundle) {
      const buyQty = it.product?.buyQuantity ?? 0;
      let paidSub = 0;
      const grouped: Record<string, { count: number; isPaid: boolean }> = {};
      (it.selectedProductIds || []).forEach((id: string, idx: number) => {
        const isPaid = buyQty === 0 || idx < buyQty;
        if (!grouped[id]) grouped[id] = { count: 0, isPaid };
        grouped[id].count += 1;
      });
      Object.entries(grouped).forEach(([id, { count, isPaid }]) => {
        const subP = subProductsMap[id];
        if (isPaid && subP?.price) paidSub += subP.price * count;
      });
      const bundleOrig = (it as any).originalPrice;
      const dispOrig = paidSub > 0 ? paidSub : (bundleOrig ?? null);
      const rate = (it as any).discountRate || 0;
      const dRate = rate > 0 ? rate : (dispOrig && dispOrig > it.price ? Math.round((1 - it.price / dispOrig) * 100) : 0);
      const effTotal = (dispOrig && dRate > 0) ? Math.round(dispOrig * (1 - dRate / 100)) : (paidSub > 0 ? paidSub : it.price);
      paidTotal += effTotal;
    } else {
      const unitPrice = it.price ?? it.product?.price ?? 0;
      paidTotal += it.quantity * unitPrice;
    }
  });

  const pointsUsed = order.pointsUsed || 0;
  const finalTotal = Math.max(0, Math.round(paidTotal) - creditUsed - pointsUsed);
  const vat = Math.round(finalTotal - (finalTotal / 1.1));
  const taxable = finalTotal - vat;

  const isCard = ['credit', 'split', 'partial_card'].includes(order.paymentMethod);
  const receiptTypeTitle = isCard ? '신용카드 매출전표' : '영 수 증';

  const paymentMethodMap: Record<string, string> = {
    virtual: '가상계좌',
    credit: '신용카드',
    bank: '계좌이체',
    cash: '현금',
    transfer: '무통장 입금',
    split: '카드분할결제',
    partial_card: '카드일부결제',
  };
  const paymentMethodText = paymentMethodMap[order.paymentMethod] || order.paymentMethod;

  const handlePrint = () => {
    printReceipt(order, userProfile, creditUsed, subProductsMap, shopSettings);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-[400px] max-w-[400px] max-h-[92vh] flex flex-col shadow-2xl border-t-4 border-[#21358D]">
        {/* Header toolbar */}
        <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold tracking-tight">영수증</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors text-xl leading-none">&times;</button>
        </div>

        {/* Receipt Thermal Strip Content */}
        <div className="p-5 overflow-y-auto flex-1 font-mono text-[11px] leading-relaxed text-neutral-900 bg-white">
          <div className="text-center mb-3">
            <h2 className="text-base font-black tracking-tight">[ {receiptTypeTitle} ]</h2>
            <p className="text-[10px] text-neutral-500">(고객 보관용)</p>
            <p className="text-xs font-black text-[#21358D] mt-1">{companyName}</p>
          </div>

          <div className="border-t border-dashed border-neutral-400 my-2.5"></div>

          <div className="space-y-0.5 text-neutral-700">
            <div className="flex justify-between"><span className="text-neutral-500">사업자번호:</span> <span className="font-bold">{businessNumber}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">대표자명:</span> <span className="font-bold">{ceoName}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">가맹점TEL:</span> <span className="font-bold">{phone}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">주소:</span> <span className="font-bold truncate max-w-[220px]">{companyAddress}</span></div>
          </div>

          <div className="border-t border-dashed border-neutral-400 my-2.5"></div>

          <div className="space-y-0.5 text-neutral-700">
            <div className="flex justify-between"><span className="text-neutral-500">주문번호:</span> <span className="font-bold">{order.orderNumber}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">거래일시:</span> <span className="font-bold">{order.date}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">구매자/병원:</span> <span className="font-bold">{userProfile?.hospitalName || userProfile?.name || '회원'}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">결제수단:</span> <span className="font-bold">{paymentMethodText}</span></div>
            {isCard && (
              <>
                <div className="flex justify-between"><span className="text-neutral-500">카드종류:</span> <span className="font-bold">국민카드 (체크/신용)</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">카드번호:</span> <span className="font-bold">9410-****-****-1234</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">승인번호:</span> <span className="font-bold">30094182 (일시불)</span></div>
              </>
            )}
          </div>

          <div className="border-t border-dashed border-neutral-400 my-2.5"></div>

          <p className="font-bold mb-1.5 text-neutral-900">[ 구매 상품 내역 ]</p>
          <div className="space-y-2">
            {order.items.map((it, idx) => {
              const unitPrice = it.price ?? it.product?.price ?? 0;
              const itemTotal = it.quantity * unitPrice;
              return (
                <div key={idx} className="space-y-0.5">
                  <p className="font-bold text-neutral-900 leading-tight">{it.product?.name || '상품 정보 없음'}{it.optionName ? ` (${it.optionName})` : ''}</p>
                  <div className="flex justify-between text-neutral-600">
                    <span>{it.quantity} x ₩{Math.round(unitPrice).toLocaleString()}</span>
                    <span className="font-bold text-neutral-900">₩{Math.round(itemTotal).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-dashed border-neutral-400 my-2.5"></div>

          <div className="space-y-0.5 text-neutral-700">
            <div className="flex justify-between"><span>주문 소계</span><span>₩{Math.round(paidTotal).toLocaleString()}</span></div>
            {creditUsed > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>크레딧 차감</span>
                <span>-₩{creditUsed.toLocaleString()}</span>
              </div>
            )}
            {pointsUsed > 0 && (
              <div className="flex justify-between text-amber-600 font-bold">
                <span>포인트 차감</span>
                <span>-{pointsUsed.toLocaleString()} P</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-neutral-400 my-2.5"></div>

          <div className="space-y-0.5 text-neutral-600">
            <div className="flex justify-between"><span>과세 물품 가액</span><span>₩{taxable.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>부 가 세 (VAT 10%)</span><span>₩{vat.toLocaleString()}</span></div>
          </div>

          <div className="border-t-2 border-neutral-900 my-2.5"></div>

          <div className="flex justify-between items-center text-sm font-black text-[#21358D]">
            <span>합계 금액</span>
            <span className="text-base">₩{finalTotal.toLocaleString()}</span>
          </div>

          <div className="border-t-2 border-neutral-900 my-2.5"></div>

          <div className="text-center text-[10px] text-neutral-500 leading-relaxed mt-3 space-y-0.5">
            <p>* 전자상거래 신용카드 매출전표</p>
            <p>* 부가가치세법 시행령 제57조에 의거 세금계산서의 효력을 가집니다.</p>
            <p className="font-bold text-neutral-800 mt-1">[ 서명: 본인서명 생략 ]</p>
            <p className="font-bold text-[#21358D] mt-1">감사합니다. {companyName}</p>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-100 transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white text-xs font-bold transition-opacity hover:opacity-90 shadow-sm"
            style={{ backgroundColor: '#21358D' }}
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            영수증 인쇄
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── 상태 뱃지 ────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
    pending:            { label: '입금대기/결제대기', className: 'bg-yellow-50 text-yellow-900 border-yellow-200',   icon: <Clock className="w-3 h-3" /> },
    paid:               { label: '결제완료',   className: 'bg-blue-50 text-blue-900 border-blue-200',         icon: <CheckCircle className="w-3 h-3" /> },
    processing:         { label: '상품준비중', className: 'bg-blue-50 text-blue-900 border-blue-200',         icon: <Package className="w-3 h-3" /> },
    partially_shipped:  { label: '부분발송',   className: 'bg-orange-50 text-orange-900 border-orange-200',   icon: <Truck className="w-3 h-3" /> },
    shipped:            { label: '배송중',     className: 'bg-purple-50 text-purple-900 border-purple-200',   icon: <Truck className="w-3 h-3" /> },
    delivered:          { label: '배송완료',   className: 'bg-green-50 text-green-900 border-green-200',      icon: <CheckCircle className="w-3 h-3" /> },
    cancel_requested:   { label: '취소요청',   className: 'bg-red-50 text-red-900 border-red-200 animate-pulse', icon: <AlertTriangle className="w-3 h-3" /> },
    return_requested:   { label: '반품요청',   className: 'bg-orange-50 text-orange-900 border-orange-200 animate-pulse', icon: <RefreshCw className="w-3 h-3" /> },
    returning:          { label: '반품수거중', className: 'bg-orange-50 text-orange-900 border-orange-200',   icon: <RefreshCw className="w-3 h-3" /> },
    returned:           { label: '반품완료',   className: 'bg-neutral-100 text-neutral-600 border-neutral-300', icon: <CheckCircle className="w-3 h-3" /> },
    exchange_requested: { label: '교환요청',   className: 'bg-blue-50 text-blue-900 border-blue-200 animate-pulse', icon: <RefreshCw className="w-3 h-3" /> },
    partially_refunded: { label: '부분환불',   className: 'bg-orange-50 text-orange-900 border-orange-200',   icon: <RefreshCw className="w-3 h-3" /> },
    cancelled:          { label: '취소완료',   className: 'bg-red-50 text-red-900 border-red-200',            icon: <XCircle className="w-3 h-3" /> },
  };

  const config = map[status] ?? { label: status, className: 'bg-neutral-100 text-neutral-600 border-neutral-300' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── 클레임 결과 표시 ─────────────────────────────────────────────────────────
function ClaimInfoBanner({ claimInfo, status }: { claimInfo: ClaimInfo; status: string }) {
  const typeLabel = claimInfo.type === 'CANCEL' ? '취소' : claimInfo.type === 'RETURN' ? '반품' : '교환';
  const isRejected = !!claimInfo.rejectedReason;
  const isProcessed = !!claimInfo.processedAt;

  return (
    <div className={`p-4 border text-sm ${isRejected ? 'bg-red-50 border-red-200' : isProcessed ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
      <div className="flex items-center gap-2 mb-2 font-bold text-neutral-900">
        <AlertTriangle className="w-4 h-4 text-orange-600" />
        {typeLabel} 요청 정보
      </div>
      <p className="text-neutral-700 mb-1"><span className="font-semibold">사유:</span> {claimInfo.reason}</p>
      <p className="text-neutral-500 text-xs">요청일: {new Date(claimInfo.requestedAt).toLocaleDateString('ko-KR')}</p>
      {isRejected && (
        <div className="mt-3 p-3 bg-red-100 border border-red-200">
          <p className="font-bold text-red-800 text-xs mb-1">요청이 거절되었습니다</p>
          <p className="text-red-700 text-xs">{claimInfo.rejectedReason}</p>
        </div>
      )}
      {isProcessed && !isRejected && (
        <div className="mt-3 p-3 bg-green-100 border border-green-200">
          <p className="font-bold text-green-800 text-xs">요청이 승인되어 처리 중입니다.</p>
          {claimInfo.exchangeTrackingNumber && (
            <p className="text-green-700 text-xs mt-1">교환 송장: {claimInfo.exchangeTrackingNumber}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
export function OrdersPage() {
  const { data: orders = [], isLoading, refetch } = useOrders();
  const { settings: shopSettings } = useShopSettings();
  const [subProductsMap, setSubProductsMap] = useState<Record<string, Product>>({});
  const [claimModal, setClaimModal] = useState<{ orderId: string; type: 'RETURN' | 'EXCHANGE' | 'CANCEL'; paymentMethod: string; status: string } | null>(null);
  const [partialPaymentModal, setPartialPaymentModal] = useState<{ orderId: string; remainingAmount: number } | null>(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState<Order | null>(null);

  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set());
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isPartialShipAllowed, setIsPartialShipAllowed] = useState(false);
  const [orderCreditMap, setOrderCreditMap] = useState<Record<string, number>>({});
  const [userCards, setUserCards] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUserProfile(user);
        if (user) {
          const types = await adminService.getMemberTypes();
          const userTypes = user.memberType?.split(',').map(t => t.trim()) || [];
          const allowed = user.role === 'admin' || (types as any[]).some(t => userTypes.includes(t.name) && t.partial_shipment);
          setIsPartialShipAllowed(allowed);
          
          const cards = await paymentService.getPaymentMethods(user.id);
          setUserCards(cards);
        }
      } catch (e) {
        console.error('Error checking partial shipment permission:', e);
      }
    };
    checkPermission();
  }, []);

  useEffect(() => {
    const loadSubProducts = async () => {
      const allSubProductIds = new Set<string>();
      orders.forEach(order => {
        order.items.forEach(item => {
          item.selectedProductIds?.forEach(id => allSubProductIds.add(id));
        });
      });
      if (allSubProductIds.size > 0) {
        const productPromises = Array.from(allSubProductIds).map(id => productService.getProductById(id));
        const products = await Promise.all(productPromises);
        const map: Record<string, Product> = {};
        products.forEach(p => { if (p) map[p.id] = p; });
        setSubProductsMap(prev => ({ ...prev, ...map }));
      }
    };
    if (orders.length > 0) loadSubProducts();
  }, [orders]);

  // 주문별 크레딧 사용 내역 로딩
  useEffect(() => {
    if (orders.length === 0) return;
    const loadCredits = async () => {
      const entries = await Promise.all(
        orders.map(async (o) => {
          try {
            const used = await creditService.getOrderCreditUsed(o.id);
            return [o.id, used] as [string, number];
          } catch { return [o.id, 0] as [string, number]; }
        })
      );
      setOrderCreditMap(Object.fromEntries(entries.filter(([, v]) => v > 0)));
    };
    loadCredits();
  }, [orders]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const toggleShipmentExpand = (orderId: string) => {
    setExpandedShipments(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div>
      {/* 클레임 모달 */}
      {claimModal && (
        <ClaimModal
          orderId={claimModal.orderId}
          type={claimModal.type}
          paymentMethod={claimModal.paymentMethod}
          status={claimModal.status}
          onClose={() => setClaimModal(null)}
          onSuccess={() => {
            setClaimModal(null);
            refetch();
          }}
        />
      )}

      {/* 잔여금액 결제 모달 */}
      {partialPaymentModal && (
        <RemainingPaymentModal
          orderId={partialPaymentModal.orderId}
          remainingAmount={partialPaymentModal.remainingAmount}
          onClose={() => setPartialPaymentModal(null)}
          onSuccess={() => {
            setPartialPaymentModal(null);
            refetch();
          }}
        />
      )}

      {/* 영수증 모달 */}
      {receiptModalOrder && (
        <ReceiptModal
          order={receiptModalOrder}
          userProfile={userProfile}
          creditUsed={orderCreditMap[receiptModalOrder.id] || 0}
          subProductsMap={subProductsMap}
          shopSettings={shopSettings}
          onClose={() => setReceiptModalOrder(null)}
        />
      )}


      <div className="mb-8">
        <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">주문/배송 관리</h2>
        <p className="text-sm text-neutral-600">주문 내역과 배송 현황을 확인하세요</p>
      </div>

      <div className="space-y-6">
        {orders.map(order => {
          const isExpanded = expandedOrders.has(order.id);
          const hasClaim = !!order.claimInfo;
          const isVact = order.status === 'pending' && !!order.vactNum;
          const canClaim = order.status === 'delivered';
          const isClaimPending = ['cancel_requested', 'return_requested', 'exchange_requested'].includes(order.status);
          const isSubOrder =
            Boolean(order.isSubscription) ||
            Boolean((order as any).is_subscription) ||
            Boolean((order as any).subscriptionId) ||
            Boolean((order as any).subscription_id) ||
            (order as any).orderType === 'subscription' ||
            (order as any).order_type === 'subscription' ||
            (order.orderNumber && (order.orderNumber.startsWith('SUB') || order.orderNumber.includes('SUB'))) ||
            ((order as any).order_number && ((order as any).order_number.startsWith('SUB') || (order as any).order_number.includes('SUB'))) ||
            (order.items && order.items.some((i: any) =>
              i.isSubscription ||
              i.is_subscription ||
              (i.product as any)?.productType === 'subscription' ||
              (i.product as any)?.product_type === 'subscription' ||
              (i.product as any)?.isSubscriptionProduct ||
              (i.product as any)?.is_subscription_product ||
              (i.product as any)?.isSubscription ||
              (i.product as any)?.is_subscription ||
              (i.productName && (i.productName.includes('정기공급') || i.productName.includes('정기구독') || i.productName.includes('정기'))) ||
              (i.product_name && (i.product_name.includes('정기공급') || i.product_name.includes('정기구독') || i.product_name.includes('정기'))) ||
              (i.name && (i.name.includes('정기공급') || i.name.includes('정기구독') || i.name.includes('정기'))) ||
              (i.product?.name && (i.product.name.includes('정기공급') || i.product.name.includes('정기구독') || i.product.name.includes('정기')))
            ));

          return (
            <div key={order.id} className="bg-white border border-neutral-200 shadow-sm">
              {/* ── 가상계좌 입금 안내 ── */}
              {isVact && (
                <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-yellow-900 mb-2">입금 계좌 안내</p>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                        <div><span className="text-yellow-700">은행:</span> <span className="font-semibold text-yellow-900">{order.vactBankName}</span></div>
                        <div><span className="text-yellow-700">예금주:</span> <span className="font-semibold text-yellow-900">{order.vactName}</span></div>
                        <div className="col-span-2"><span className="text-yellow-700">계좌번호:</span> <span className="font-bold text-yellow-900 text-base tracking-widest ml-1">{order.vactNum}</span></div>
                      </div>
                      {order.vactInputDeadline && (
                        <p className="mt-2 text-xs text-yellow-700">입금기한: <span className="font-bold">{new Date(order.vactInputDeadline).toLocaleString('ko-KR')}</span> 까지</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── 클레임 결과 배너 ── */}
              {hasClaim && (
                <div className="border-b border-neutral-200">
                  <ClaimInfoBanner claimInfo={order.claimInfo!} status={order.status} />
                </div>
              )}

              {/* ── 주문 헤더 ── */}
              <div className="px-6 py-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      isSubOrder
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                    }`}>
                      {isSubOrder ? '정기공급' : '일반'}
                    </span>
                    <h3 className="text-base font-bold tracking-tight text-neutral-900">{order.orderNumber}</h3>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-neutral-500">{order.date}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* 영수증 출력 버튼 */}
                  <button
                    onClick={() => setReceiptModalOrder(order)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold border border-neutral-300 transition-colors shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-neutral-600" />
                    영수증
                  </button>
                  {(() => {
                    const isPartialCardPending = order.paymentMethod === 'partial_card' && order.status === 'pending';
                    const partialRemaining = isPartialCardPending ? Math.max(0, order.totalAmount - (order.paymentHistory?.reduce((sum, ph) => sum + (ph.status === 'SUCCESS' ? ph.amount : 0), 0) || 0)) : 0;
                    return isPartialCardPending && partialRemaining > 0 ? (
                      <button
                        onClick={() => setPartialPaymentModal({ orderId: order.id, remainingAmount: partialRemaining })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-colors"
                      >
                        잔여금액 결제
                      </button>
                    ) : null;
                  })()}
                  {/* 재주문 & 결제 취소: 정기공급 상품 주문에는 미표시 */}
                  {(() => {
                    const isSubOrder =
                      Boolean(order.isSubscription) ||
                      Boolean((order as any).is_subscription) ||
                      Boolean((order as any).subscriptionId) ||
                      Boolean((order as any).subscription_id) ||
                      (order as any).orderType === 'subscription' ||
                      (order as any).order_type === 'subscription' ||
                      (order.orderNumber && (order.orderNumber.startsWith('SUB') || order.orderNumber.includes('SUB'))) ||
                      ((order as any).order_number && ((order as any).order_number.startsWith('SUB') || (order as any).order_number.includes('SUB'))) ||
                      (order.items && order.items.some((i: any) =>
                        i.isSubscription ||
                        i.is_subscription ||
                        (i.product as any)?.productType === 'subscription' ||
                        (i.product as any)?.product_type === 'subscription' ||
                        (i.product as any)?.isSubscriptionProduct ||
                        (i.product as any)?.is_subscription_product ||
                        (i.product as any)?.isSubscription ||
                        (i.product as any)?.is_subscription ||
                        (i.productName && (i.productName.includes('정기공급') || i.productName.includes('정기구독') || i.productName.includes('정기'))) ||
                        (i.product_name && (i.product_name.includes('정기공급') || i.product_name.includes('정기구독') || i.product_name.includes('정기'))) ||
                        (i.name && (i.name.includes('정기공급') || i.name.includes('정기구독') || i.name.includes('정기'))) ||
                        (i.product?.name && (i.product.name.includes('정기공급') || i.product.name.includes('정기구독') || i.product.name.includes('정기')))
                      ));

                    if (isSubOrder) {
                      const roundNo = (order as any).roundNo || (order as any).currentRound || 1;
                      const isFirstRound = roundNo === 1;

                      // 1회차 정기공급 주문
                      if (isFirstRound && !hasClaim) {
                        // 상품준비중 전 (pending/paid): 즉시 [결제 취소]
                        if (['pending', 'paid'].includes(order.status)) {
                          return (
                            <button
                              onClick={() => setClaimModal({ orderId: order.id, type: 'CANCEL', paymentMethod: order.paymentMethod, status: order.status })}
                              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold border border-neutral-300 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              결제 취소
                            </button>
                          );
                        }
                        // 상품준비중 (processing): 즉시 취소 불가 ➔ [취소 신청] (주문취소요청)만 가능
                        if (order.status === 'processing') {
                          return (
                            <button
                              onClick={() => setClaimModal({ orderId: order.id, type: 'CANCEL', paymentMethod: order.paymentMethod, status: order.status })}
                              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300 transition-colors"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              취소 신청
                            </button>
                          );
                        }
                      }
                      return null;
                    }

                    return (
                      <>
                        {/* 재주문 */}
                        <button
                          onClick={() => alert(`재주문: ${order.id}`)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          재주문
                        </button>
                        {/* 결제 취소 버튼 (입금대기, 결제완료, 상품준비중 상태 && 클레임 없을 때) */}
                        {['pending', 'paid', 'processing'].includes(order.status) && !hasClaim && (
                          <button
                            onClick={() => setClaimModal({ orderId: order.id, type: 'CANCEL', paymentMethod: order.paymentMethod, status: order.status })}
                            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold border border-neutral-300 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {order.status === 'processing' ? '취소 신청' : '결제 취소'}
                          </button>
                        )}
                      </>
                    );
                  })()}
                  {/* 반품/교환 버튼 (배송완료 && 클레임 없을 때만) */}
                  {canClaim && !hasClaim && (
                    <>
                      <button
                        onClick={() => setClaimModal({ orderId: order.id, type: 'RETURN', paymentMethod: order.paymentMethod, status: order.status })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-semibold border border-red-200 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        반품신청
                      </button>
                      <button
                        onClick={() => setClaimModal({ orderId: order.id, type: 'EXCHANGE', paymentMethod: order.paymentMethod, status: order.status })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold border border-blue-200 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        교환신청
                      </button>
                    </>
                  )}


                  {/* 클레임 진행 중 안내 */}
                  {isClaimPending && (
                    <span className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-700 text-xs font-semibold border border-orange-200">
                      <Clock className="w-3.5 h-3.5" />
                      처리 중
                    </span>
                  )}
                </div>
              </div>

              {/* ── 주문 상품 목록 ── */}
              <div className="border-t border-neutral-100">
                <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
                  <p className="text-sm font-bold text-neutral-700">주문내역</p>
                  <span className="text-xs text-neutral-500">
                    <span className="font-bold text-neutral-900">{order.items.length}</span>
                    <span className="text-neutral-400">개 상품</span>
                  </span>
                </div>
                <div className="px-6 py-4">
                  {!isExpanded ? (
                    <div 
                      onClick={() => toggleExpand(order.id)}
                      className="flex items-center justify-between bg-white border border-neutral-200 px-5 py-4 cursor-pointer hover:border-neutral-400 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {order.items[0]?.product ? (
                            <ProductImage src={order.items[0].product.imageUrl} alt={order.items[0].product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-neutral-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 text-sm mb-1">
                            {order.items[0]?.product?.name || '상품 정보 없음'}
                            {order.items.length > 1 && <span className="text-blue-600 font-black ml-1.5">외 {order.items.length - 1}건</span>}
                          </p>
                          <p className="text-xs text-neutral-500">
                            상세보기를 눌러 전체 주문 품목과 할인 내역을 확인하세요.
                          </p>
                        </div>
                      </div>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors">
                        상세보기 <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-neutral-200 overflow-hidden shadow-sm">
                      <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200">
                          <th className="px-3 py-2 text-left font-medium text-neutral-500 w-8">No.</th>
                          <th className="px-3 py-2 text-left font-medium text-neutral-500">상품명</th>
                          <th className="px-3 py-2 text-center font-medium text-neutral-500 w-14">수량</th>
                          <th className="px-3 py-2 text-right font-medium text-neutral-500 w-24">단가</th>
                          <th className="px-3 py-2 text-right font-medium text-neutral-500 w-24">합계</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {order.items.flatMap((item, index) => {
                        if (!item.product) return [];
                        const unitPrice = item.price ?? item.product.price;
                        const rowNum = index + 1;
                        const isBundle = (item.selectedProductIds || []).length > 0;
                        const rows: React.ReactNode[] = [
                          <tr key={`item-${index}`} className="bg-white hover:bg-neutral-50 transition-colors">
                            <td className="px-3 py-3 text-neutral-400 text-center align-top">{rowNum}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200">
                                  <ProductImage src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                                </div>
                                <Link to={`/products/${item.product.id}`} className="font-semibold text-neutral-900 hover:text-neutral-600 leading-tight">
                                  {item.product.name}
                                </Link>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center font-bold text-neutral-900 align-middle">{item.quantity}</td>
                            <td className="px-3 py-3 text-right text-neutral-400 align-middle">
                              {isBundle ? <span className="text-[11px]">-</span> : `₩${unitPrice.toLocaleString()}`}
                            </td>
                            <td className="px-3 py-3 text-right font-bold align-middle">
                              {isBundle ? <span className="text-neutral-400 text-[11px]">-</span> : <span className="text-neutral-900">₩{(item.quantity * unitPrice).toLocaleString()}</span>}
                            </td>
                          </tr>
                        ];
                        // 번들 구성 하위 행 — product ID별 그룹화
                        const bundleIdList: string[] = item.selectedProductIds || [];
                        const buyQty: number = item.product?.buyQuantity ?? 0;

                        // 그룹화: { [productId]: { count, isPaid } }
                        // buyQty = 0 → 전체 구성(paid), buyQty > 0 → 앞 buyQty개만 paid
                        const grouped: Record<string, { count: number; isPaid: boolean }> = {};
                        bundleIdList.forEach((id, idx) => {
                          const isPaid = buyQty === 0 || idx < buyQty;
                          if (!grouped[id]) grouped[id] = { count: 0, isPaid };
                          grouped[id].count += 1;
                        });

                        Object.entries(grouped).forEach(([id, { count, isPaid }], gIdx) => {
                          const subProd = subProductsMap[id];
                          const subPrice = subProd?.price;
                          rows.push(
                            <tr key={`bundle-${index}-${gIdx}`} className={isPaid ? 'bg-neutral-50' : 'bg-blue-50'}>
                              <td className="px-3 py-2"></td>
                              <td className={`px-3 py-2 text-[11px] ${isPaid ? 'text-neutral-600' : 'text-blue-700'}`}>
                                <div className="flex items-center gap-1.5">
                                  <span>{subProd?.name || '로딩 중...'}</span>
                                  {isPaid
                                    ? <span className="px-1 py-0.5 bg-neutral-100 text-neutral-500 border border-neutral-200 text-[9px] font-medium rounded">구성</span>
                                    : <span className="px-1 py-0.5 bg-blue-100 text-blue-700 border border-blue-300 text-[9px] font-bold rounded">증정</span>
                                  }
                                </div>
                              </td>
                              <td className={`px-3 py-2 text-center font-bold text-[11px] ${isPaid ? 'text-neutral-600' : 'text-blue-600'}`}>{count}</td>
                              <td className={`px-3 py-2 text-right text-[11px] ${isPaid ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                {isPaid && subPrice ? `₩${subPrice.toLocaleString()}` : '-'}
                              </td>
                              <td className="px-3 py-2 text-right text-[11px]">
                                {isPaid && subPrice
                                  ? <span className="font-bold text-neutral-800">₩{(subPrice * count).toLocaleString()}</span>
                                  : <span className="text-neutral-400">-</span>
                                }
                              </td>
                            </tr>
                          );
                        });
                        // 추가 증정 상품 행 (bonus items)
                        // ratio: ceil(주문수량 × percentage%), fixed: quantity × 주문수량
                        (item.bonusItems || []).forEach((bonus, bIdx) => {
                          const totalBonusQty = bonus.calculationMethod === 'ratio'
                            ? Math.ceil(item.quantity * (bonus.percentage || 0) / 100)
                            : (bonus.quantity ?? 1) * item.quantity;
                          rows.push(
                            <tr key={`bonus-${index}-${bIdx}`} className="bg-amber-50">
                              <td className="px-3 py-2"></td>
                              <td className="px-3 py-2 text-amber-800 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <span>{bonus.productName}</span>
                                  <span className="px-1 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 text-[9px] font-bold rounded">증정</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-amber-800 text-[11px]">{totalBonusQty}</td>
                              <td className="px-3 py-2 text-right text-[11px] text-neutral-400">-</td>
                              <td className="px-3 py-2 text-right text-[11px] text-neutral-400">-</td>
                            </tr>
                          );
                        });

                        // ── 일반 상품 소계 행 ──
                        if (!isBundle) {
                          const lineTotal = item.quantity * unitPrice;
                          const itemDiscRate = (item as any).discountRate || 0;
                          const itemOrigPrice = (item as any).originalPrice;
                          const origLineTotal = itemOrigPrice
                            ? itemOrigPrice * item.quantity
                            : lineTotal;
                          const hasItemDiscount = itemDiscRate > 0 && origLineTotal > lineTotal;

                          if (hasItemDiscount) {
                            rows.push(
                              <tr key={`reg-orig-${index}`} className="bg-neutral-50 border-t border-neutral-200">
                                <td className="px-3 py-1"></td>
                                <td colSpan={2} className="px-3 py-1 text-right text-[11px] text-neutral-400">정상가</td>
                                <td></td>
                                <td className="px-3 py-1 text-right text-[11px] text-neutral-400">
                                  ₩{Math.round(origLineTotal).toLocaleString()}원
                                </td>
                              </tr>
                            );
                            rows.push(
                              <tr key={`reg-disc-${index}`} className="bg-neutral-50">
                                <td className="px-3 py-1"></td>
                                <td colSpan={2} className="px-3 py-1 text-right text-[11px] text-red-500 font-medium">{itemDiscRate}% 할인</td>
                                <td></td>
                                <td className="px-3 py-1 text-right text-[11px] text-red-500 font-bold">
                                  -₩{Math.round(origLineTotal - lineTotal).toLocaleString()}원
                                </td>
                              </tr>
                            );
                          }
                          rows.push(
                            <tr key={`reg-subtotal-${index}`} className="bg-neutral-100 border-t border-neutral-200">
                              <td className="px-3 py-1.5"></td>
                              <td colSpan={2} className="px-3 py-1.5 text-right text-[11px] font-bold text-neutral-700">소계 금액</td>
                              <td></td>
                              <td className="px-3 py-1.5 text-right text-[11px] font-black text-neutral-900">
                                ₩{Math.round(lineTotal).toLocaleString()}원
                              </td>
                            </tr>
                          );
                        }

                        // 번들: 소계 행 추가 (3줄 레이아웃)
                        if (isBundle) {
                          const bundleDiscountRate = (item as any).discountRate || 0;

                          // ① 구성품 합산 = 가장 신뢰도 높은 정상가 기준
                          let paidSubTotal = 0;
                          Object.entries(grouped).forEach(([id, { count, isPaid }]) => {
                            const subP = subProductsMap[id];
                            if (isPaid && subP?.price) paidSubTotal += subP.price * count;
                          });

                          // ② 정상가: paidSubTotal > 0 이면 우선, 아니면 DB originalPrice
                          const bundleOriginalPrice = (item as any).originalPrice;
                          const displayOriginal =
                            paidSubTotal > 0 ? paidSubTotal
                            : (bundleOriginalPrice ?? null);

                          // ③ 할인율: DB > 역산 순
                          const displayRate = bundleDiscountRate > 0
                            ? bundleDiscountRate
                            : (displayOriginal && displayOriginal > item.price
                              ? Math.round((1 - item.price / displayOriginal) * 100)
                              : 0);

                          // ④ 소계금액: displayOriginal × (1 - rate%) 로 정확하게 역산
                          const effectiveBundleTotal = (displayOriginal && displayRate > 0)
                            ? Math.round(displayOriginal * (1 - displayRate / 100))
                            : (paidSubTotal > 0 ? paidSubTotal : item.price);

                          const discountAmt = displayOriginal && displayRate > 0
                            ? Math.round(displayOriginal - effectiveBundleTotal)
                            : 0;

                          if (displayRate > 0 && displayOriginal) {
                            // 3줄: 정상가 / 할인 / 소계금액
                            rows.push(
                              <tr key={`bundle-orig-${index}`} className="bg-neutral-50 border-t border-neutral-200">
                                <td className="px-3 py-1"></td>
                                <td colSpan={2} className="px-3 py-1 text-right text-[11px] text-neutral-400">정상가</td>
                                <td></td>
                                <td className="px-3 py-1 text-right text-[11px] text-neutral-400">
                                  ₩{Math.round(displayOriginal).toLocaleString()}원
                                </td>
                              </tr>
                            );
                            rows.push(
                              <tr key={`bundle-disc-${index}`} className="bg-neutral-50">
                                <td className="px-3 py-1"></td>
                                <td colSpan={2} className="px-3 py-1 text-right text-[11px] text-red-500 font-medium">{displayRate}% 할인</td>
                                <td></td>
                                <td className="px-3 py-1 text-right text-[11px] text-red-500 font-bold">
                                  -₩{discountAmt.toLocaleString()}원
                                </td>
                              </tr>
                            );
                            rows.push(
                              <tr key={`bundle-subtotal-${index}`} className="bg-neutral-100 border-b border-neutral-200">
                                <td className="px-3 py-1.5"></td>
                                <td colSpan={2} className="px-3 py-1.5 text-right text-[11px] font-bold text-neutral-700">소계 금액</td>
                                <td></td>
                                <td className="px-3 py-1.5 text-right text-[11px] font-black text-neutral-900">
                                  ₩{effectiveBundleTotal.toLocaleString()}원
                                </td>
                              </tr>
                            );
                          } else {
                            // 할인 없음: 단일 행
                            rows.push(
                              <tr key={`bundle-subtotal-${index}`} className="bg-neutral-100 border-t border-neutral-200">
                                <td className="px-3 py-1.5"></td>
                                <td colSpan={2} className="px-3 py-1.5 text-right text-[11px] text-neutral-500 font-medium">번들 소계</td>
                                <td className="px-3 py-1.5 text-right text-[11px] text-neutral-400">-</td>
                                <td className="px-3 py-1.5 text-right text-[11px] font-bold text-neutral-800">
                                  ₩{effectiveBundleTotal.toLocaleString()}원
                                </td>
                              </tr>
                            );
                          }
                        }

                        return rows;
                      })}
                    </tbody>
                    <tfoot>
                      {(() => {
                        // 렌더링된 각 항목의 소계(effectiveBundleTotal / lineTotal)와 동일한 로직으로 paidTotal 합산
                        let paidTotal = 0;
                        order.items.forEach(it => {
                          const isBundle = (it.selectedProductIds || []).length > 0;
                          if (isBundle) {
                            const buyQty = it.product?.buyQuantity ?? 0;
                            let paidSub = 0;
                            const grouped: Record<string, {count:number, isPaid:boolean}> = {};
                            (it.selectedProductIds || []).forEach((id: string, idx: number) => {
                              const isPaid = buyQty === 0 || idx < buyQty;
                              if (!grouped[id]) grouped[id] = { count: 0, isPaid };
                              grouped[id].count += 1;
                            });
                            Object.entries(grouped).forEach(([id, {count, isPaid}]) => {
                              const subP = subProductsMap[id];
                              if (isPaid && subP?.price) paidSub += subP.price * count;
                            });
                            
                            const bundleOrig = (it as any).originalPrice;
                            const dispOrig = paidSub > 0 ? paidSub : (bundleOrig ?? null);
                            const rate = (it as any).discountRate || 0;
                            const dRate = rate > 0 ? rate : (dispOrig && dispOrig > it.price ? Math.round((1 - it.price/dispOrig)*100) : 0);
                            const effTotal = (dispOrig && dRate > 0) ? Math.round(dispOrig * (1 - dRate/100)) : (paidSub > 0 ? paidSub : it.price);
                            
                            paidTotal += effTotal;
                          } else {
                            const unitPrice = it.price ?? it.product?.price ?? 0;
                            paidTotal += it.quantity * unitPrice;
                          }
                        });

                        return (
                          <>
                            <tr className="bg-neutral-50 border-t-2 border-neutral-200">
                              <td colSpan={4} className="px-3 py-3 text-right text-sm font-bold text-neutral-900">합계금액</td>
                              <td className="px-3 py-3 text-right text-base font-black text-neutral-900">
                                ₩{Math.round(paidTotal).toLocaleString()}
                              </td>
                            </tr>
                            {(orderCreditMap[order.id] ?? 0) > 0 && (
                              <tr className="bg-emerald-50">
                                <td colSpan={4} className="px-3 py-2 text-right text-xs font-bold text-emerald-700">크레딧 차감</td>
                                <td className="px-3 py-2 text-right text-xs font-bold text-emerald-700">
                                  -₩{(orderCreditMap[order.id]).toLocaleString()}
                                </td>
                              </tr>
                            )}
                            {(order.pointsUsed ?? 0) > 0 && (
                              <tr className="bg-amber-50">
                                <td colSpan={4} className="px-3 py-2 text-right text-xs font-bold text-amber-700">포인트 차감</td>
                                <td className="px-3 py-2 text-right text-xs font-bold text-amber-700">
                                  -{(order.pointsUsed!).toLocaleString()} P
                                </td>
                              </tr>
                            )}
                            {((orderCreditMap[order.id] ?? 0) > 0 || (order.pointsUsed ?? 0) > 0) && (
                              <tr className="bg-neutral-100 border-t border-neutral-200">
                                <td colSpan={4} className="px-3 py-2 text-right text-sm font-bold text-neutral-900">실 결제 금액</td>
                                <td className="px-3 py-2 text-right text-base font-black text-neutral-900">
                                  ₩{Math.max(0, Math.round(paidTotal) - (orderCreditMap[order.id] ?? 0) - (order.pointsUsed ?? 0)).toLocaleString()}
                                </td>
                              </tr>
                            )}
                          </>
                        );

                      })()}
                    </tfoot>
                  </table>
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full py-3 flex items-center justify-center gap-1 text-xs font-bold text-neutral-500 bg-neutral-50 hover:bg-neutral-100 transition-colors border-t border-neutral-200"
                  >
                    <ChevronUp className="w-3.5 h-3.5" /> 상세내역 접기
                  </button>
                  </div>
                  )}
                </div>
              </div>


              {/* ── 발송 내역 (부분발송 포함) ── */}
              {order.shipments && order.shipments.length > 0 ? (
                <div className="border-t border-neutral-100">
                  <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-neutral-700">발송내역</p>
                    {(() => {
                      const totalQty = order.items.reduce((sum, it) => sum + it.quantity, 0);
                      const shippedQty = order.items.reduce((sum, it) => sum + (it.shippedQuantity ?? 0), 0);
                      return (
                        <span className="text-xs text-neutral-500">
                          <span className="font-bold text-neutral-900">{shippedQty}</span>
                          <span className="text-neutral-400">/{totalQty}개 발송됨</span>
                        </span>
                      );
                    })()}
                  </div>
                  <div className="px-6 py-4">
                    {!expandedShipments.has(order.id) ? (
                      <div 
                        onClick={() => toggleShipmentExpand(order.id)}
                        className="flex items-center justify-between bg-white border border-neutral-200 px-5 py-4 cursor-pointer hover:border-neutral-400 transition-colors shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-full">
                            <Truck className="w-6 h-6 text-neutral-400" />
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 text-sm mb-1">
                              총 {order.shipments.length}건의 발송 내역이 있습니다.
                            </p>
                            <p className="text-xs text-neutral-500">
                              상세보기를 눌러 송장번호와 배송 품목을 확인하세요.
                            </p>
                          </div>
                        </div>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors">
                          상세보기 <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="border border-neutral-200 overflow-hidden shadow-sm">
                        <div className="divide-y divide-neutral-100 bg-white">
                          {order.shipments.map((shipment, i) => (
                            <div key={shipment.id} className="p-5">
                              {/* 발송 헤더 */}
                              <div className="flex items-center justify-between gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-neutral-900">
                                    발송 {i + 1}{shipment.isPartial && ' · 부분'}
                                  </span>
                                  <span className="text-xs text-neutral-500">
                                    {new Date(shipment.shippedAt).toLocaleDateString('ko-KR')}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-neutral-400 mb-0.5">송장번호</p>
                                  <p className="text-xs font-bold text-neutral-900 tracking-wider">{shipment.trackingNumber}</p>
                                </div>
                              </div>
                              {/* 발송 상품 테이블 */}
                              {shipment.items && shipment.items.length > 0 && (
                                <div className="border border-neutral-200 overflow-hidden">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="bg-neutral-50 border-b border-neutral-200">
                                        <th className="px-3 py-2 text-left font-medium text-neutral-500 w-8">No.</th>
                                        <th className="px-3 py-2 text-left font-medium text-neutral-500">상품명</th>
                                        <th className="px-3 py-2 text-center font-medium text-neutral-500 w-14">수량</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                      {shipment.items.flatMap((it, idx) => {
                                        const rows = [];
                                        const rowNum = idx + 1;
                                        rows.push(
                                          <tr key={`main-${idx}`} className="bg-white">
                                            <td className="px-3 py-2 text-neutral-400 text-center">{rowNum}</td>
                                            <td className="px-3 py-2">
                                              <div className="flex items-center gap-1.5 text-neutral-900 font-medium">
                                                <span>{it.productName}</span>
                                                <span className="px-1 py-0.5 bg-neutral-100 text-neutral-500 border border-neutral-200 text-[9px] font-medium rounded">구매</span>
                                              </div>
                                            </td>
                                            <td className="px-3 py-2 text-center font-bold text-neutral-900">{it.quantity}</td>
                                          </tr>
                                        );
                                        if (it.bonusItems && it.bonusItems.length > 0) {
                                          it.bonusItems.forEach((bonus, bIdx) => {
                                            rows.push(
                                              <tr key={`bonus-${idx}-${bIdx}`} className="bg-amber-50">
                                                <td className="px-3 py-1.5"></td>
                                                <td className="px-3 py-1.5">
                                                  <div className="flex items-center gap-1.5 text-amber-800">
                                                    <span>{bonus.productName}</span>
                                                    <span className="px-1 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 text-[9px] font-bold rounded">증정</span>
                                                  </div>
                                                </td>
                                                <td className="px-3 py-1.5 text-center font-bold text-amber-800">{bonus.quantity}</td>
                                              </tr>
                                            );
                                          });
                                        }
                                        return rows;
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => toggleShipmentExpand(order.id)}
                          className="w-full py-3 flex items-center justify-center gap-1 text-xs font-bold text-neutral-500 bg-neutral-50 hover:bg-neutral-100 transition-colors border-t border-neutral-200"
                        >
                          <ChevronUp className="w-3.5 h-3.5" /> 발송내역 접기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : order.deliveryTrackingNumber ? (
                <div className="px-6 py-3 border-t border-neutral-100 bg-neutral-50">
                  <span className="text-xs text-neutral-500">
                    <span className="font-medium text-neutral-700">송장번호:</span> {order.deliveryTrackingNumber}
                  </span>
                </div>
              ) : null}

              {/* ── 주문 푸터 ── */}
              <div className="px-6 py-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 bg-neutral-50">
                <div className="text-sm text-neutral-500">
                  <span className="font-medium text-neutral-700">결제수단:</span> {{
                    virtual: '가상계좌',
                    credit: '신용카드',
                    bank: '계좌이체',
                    cash: '현금',
                    transfer: '무통장 입금',
                    split: '카드분할결제',
                    partial_card: '카드일부결제',
                  }[order.paymentMethod] ?? order.paymentMethod}
                  {(order.paymentMethod === 'split' || order.paymentMethod === 'partial_card') && order.paymentHistory && order.paymentHistory.length > 0 && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      {order.paymentHistory.filter((p: any) => p.transaction_type === 'PAYMENT').map((p: any, idx: number) => {
                        let cardName = null;
                        if (p.method === 'credit') {
                          if (p.reason && p.reason.includes(' - ') && !p.reason.endsWith(' - credit')) {
                            const parts = p.reason.split(' - ');
                            if (parts.length > 1) cardName = parts[1];
                          } else if (p.pg_tid) {
                            const card = userCards.find(c => c.id === p.pg_tid);
                            if (card) {
                              cardName = card.alias ? card.alias : `${card.cardName} (***${card.cardNumberMasked?.slice(-3) || ''})`;
                            }
                          }
                        }
                        const timeStr = order.paymentMethod === 'partial_card' && p.created_at 
                          ? new Date(p.created_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : null;
                          
                        return (
                          <div key={idx} className="text-xs text-neutral-500 flex items-center gap-2">
                            <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
                            <span>
                              {{ virtual: '가상계좌', credit: '신용카드', transfer: '무통장 입금', general: '일반결제' }[p.method as string] || p.method}
                              {cardName ? ` (${cardName})` : ''}
                              {timeStr ? ` [${timeStr}]` : ''}
                            </span>
                            <span className="font-medium">₩{p.amount.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {(() => {
                    let total = 0;
                    order.items.forEach(it => {
                      const isBundle = (it.selectedProductIds || []).length > 0;
                      if (isBundle) {
                        const buyQty = it.product?.buyQuantity ?? 0;
                        let paidSub = 0;
                        const grouped: Record<string, {count:number, isPaid:boolean}> = {};
                        (it.selectedProductIds || []).forEach((id: string, idx: number) => {
                          const isPaid = buyQty === 0 || idx < buyQty;
                          if (!grouped[id]) grouped[id] = { count: 0, isPaid };
                          grouped[id].count += 1;
                        });
                        Object.entries(grouped).forEach(([id, {count, isPaid}]) => {
                          const subP = subProductsMap[id];
                          if (isPaid && subP?.price) paidSub += subP.price * count;
                        });
                        
                        const bundleOrig = (it as any).originalPrice;
                        const dispOrig = paidSub > 0 ? paidSub : (bundleOrig ?? null);
                        const rate = (it as any).discountRate || 0;
                        const dRate = rate > 0 ? rate : (dispOrig && dispOrig > it.price ? Math.round((1 - it.price/dispOrig)*100) : 0);
                        const effTotal = (dispOrig && dRate > 0) ? Math.round(dispOrig * (1 - dRate/100)) : (paidSub > 0 ? paidSub : it.price);
                        
                        total += effTotal;
                      } else {
                        const unitPrice = it.price ?? it.product?.price ?? 0;
                        total += it.quantity * unitPrice;
                      }
                    });

                    const finalTotal = Math.max(0, Math.round(total) - (orderCreditMap[order.id] ?? 0) - (order.pointsUsed ?? 0));
                    const paidAmount = order.paymentHistory?.filter((p: any) => p.status === 'SUCCESS').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
                    const remainingAmount = finalTotal - paidAmount;

                    return (
                      <>
                        {(orderCreditMap[order.id] ?? 0) > 0 && (
                          <p className="text-xs text-emerald-600 font-bold mb-0.5">
                            크레딧 차감 -₩{(orderCreditMap[order.id]).toLocaleString()}
                          </p>
                        )}
                        {(order.pointsUsed ?? 0) > 0 && (
                          <p className="text-xs text-amber-600 font-bold mb-0.5">
                            포인트 차감 -{(order.pointsUsed!).toLocaleString()} P
                          </p>
                        )}
                        <p className="text-xs text-neutral-500 mb-0.5">{order.paymentMethod === 'partial_card' ? '총 주문 금액' : '총 결제 금액'}</p>
                        <p className="text-xl font-bold tracking-tight text-neutral-900">
                          ₩{finalTotal.toLocaleString()}
                        </p>
                        {order.paymentMethod === 'partial_card' && (
                          <div className="mt-2 text-right border-t border-neutral-200 pt-2 border-dashed">
                            <div className="flex justify-between items-center gap-4 text-xs mb-1">
                              <span className="text-neutral-500">결제 금액</span>
                              <span className="font-bold text-neutral-700">₩{paidAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4 text-sm">
                              <span className="text-neutral-500 font-medium">남은 결제 금액</span>
                              <span className="font-bold text-red-600">₩{remainingAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="bg-white border border-neutral-200 p-20 text-center">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-xl font-medium text-neutral-900 mb-2">주문 내역이 없습니다</h3>
          <p className="text-neutral-500 mb-6">첫 주문을 시작해보세요</p>
          <Link to="/products" className="inline-block bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 text-sm font-bold transition-colors">
            상품 둘러보기
          </Link>
        </div>
      )}
    </div>
  );
}