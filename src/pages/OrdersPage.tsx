import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { Package, Copy, Loader2, AlertTriangle, RefreshCw, Truck, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { ProductImage } from '../components/ui/ProductImage';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { Product, ClaimInfo } from '../types';

// ─── 클레임 신청 모달 ────────────────────────────────────────────────────────
interface ClaimModalProps {
  orderId: string;
  type: 'RETURN' | 'EXCHANGE';
  onClose: () => void;
  onSuccess: () => void;
}

function ClaimModal({ orderId, type, onClose, onSuccess }: ClaimModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const title = type === 'RETURN' ? '반품 신청' : '교환 신청';

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('사유를 입력해주세요.');
      return;
    }
    try {
      setIsSubmitting(true);
      await orderService.requestClaim(orderId, type, reason);
      onSuccess();
    } catch (e) {
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md mx-4 shadow-2xl">
        <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-neutral-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 transition-colors text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              {title} 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={`${title} 사유를 상세히 입력해주세요.`}
              rows={4}
              className="w-full px-4 py-3 border border-neutral-300 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all resize-none placeholder:text-neutral-300"
            />
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            신청 후 영업일 기준 1~3일 이내 담당자가 확인 후 연락드립니다.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-neutral-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-900 text-sm font-bold hover:bg-neutral-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? '신청 중...' : `${title} 신청`}
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
    pending:            { label: '입금대기',   className: 'bg-yellow-50 text-yellow-900 border-yellow-200',   icon: <Clock className="w-3 h-3" /> },
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
  const [subProductsMap, setSubProductsMap] = useState<Record<string, Product>>({});
  const [claimModal, setClaimModal] = useState<{ orderId: string; type: 'RETURN' | 'EXCHANGE' } | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

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

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => {
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
          onClose={() => setClaimModal(null)}
          onSuccess={() => {
            setClaimModal(null);
            refetch();
          }}
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
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="text-base font-bold tracking-tight text-neutral-900">{order.orderNumber}</h3>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-neutral-500">{order.date}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* 재주문 */}
                  <button
                    onClick={() => alert(`재주문: ${order.id}`)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    재주문
                  </button>
                  {/* 반품/교환 버튼 (배송완료 && 클레임 없을 때만) */}
                  {canClaim && !hasClaim && (
                    <>
                      <button
                        onClick={() => setClaimModal({ orderId: order.id, type: 'RETURN' })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-semibold border border-red-200 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        반품신청
                      </button>
                      <button
                        onClick={() => setClaimModal({ orderId: order.id, type: 'EXCHANGE' })}
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
                  <div className="border border-neutral-200 overflow-hidden">
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
                      {order.items.slice(0, isExpanded ? undefined : 2).flatMap((item, index) => {
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
                        // 번들 구성 하위 행
                        (item.selectedProductIds || []).forEach((id, idx) => {
                          const subProd = subProductsMap[id];
                          const isPaid = idx < (item.product?.buyQuantity || 0);
                          const subPrice = subProd?.price;
                          rows.push(
                            <tr key={`bundle-${index}-${idx}`} className={isPaid ? 'bg-neutral-50' : 'bg-blue-50'}>
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
                              <td className={`px-3 py-2 text-center font-bold text-[11px] ${isPaid ? 'text-neutral-600' : 'text-blue-600'}`}>{item.quantity}</td>
                              <td className={`px-3 py-2 text-right text-[11px] ${isPaid ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                {isPaid && subPrice ? `₩${subPrice.toLocaleString()}` : '-'}
                              </td>
                              <td className="px-3 py-2 text-right text-[11px]">
                                {isPaid && subPrice
                                  ? <span className="font-bold text-neutral-800">₩{(subPrice * item.quantity).toLocaleString()}</span>
                                  : <span className="text-neutral-400">-</span>
                                }
                              </td>
                            </tr>
                          );
                        });
                        // 추가 증정 상품 행 (bonus items)
                        const bundleCount = (item.selectedProductIds || []).length;
                        (item.bonusItems || []).forEach((bonus, bIdx) => {
                          rows.push(
                            <tr key={`bonus-${index}-${bIdx}`} className="bg-amber-50">
                              <td className="px-3 py-2"></td>
                              <td className="px-3 py-2 text-amber-800 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <span>{bonus.productName}</span>
                                  <span className="px-1 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 text-[9px] font-bold rounded">증정</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-amber-800 text-[11px]">{bonus.quantity}</td>
                              <td className="px-3 py-2 text-right text-[11px] text-neutral-400">-</td>
                              <td className="px-3 py-2 text-right text-[11px] text-neutral-400">-</td>
                            </tr>
                          );
                        });
                        return rows;
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-50 border-t-2 border-neutral-200">
                        <td colSpan={4} className="px-3 py-3 text-right text-sm font-bold text-neutral-900">합계금액</td>
                        <td className="px-3 py-3 text-right text-base font-black text-neutral-900">
                          ₩{order.items.reduce((sum, it) => sum + it.quantity * (it.price ?? it.product?.price ?? 0), 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  {order.items.length > 2 && (
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="w-full py-2.5 flex items-center justify-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 border-t border-neutral-100 bg-white transition-colors"
                    >
                      {isExpanded ? (
                        <><ChevronUp className="w-3.5 h-3.5" /> 접기</>
                      ) : (
                        <><ChevronDown className="w-3.5 h-3.5" /> 상품 {order.items.length - 2}개 더보기</>
                      )}
                    </button>
                  )}
                  </div>
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
                  <div className="divide-y divide-neutral-100">
                    {order.shipments.map((shipment, i) => (
                      <div key={shipment.id} className="px-6 py-4">
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
                  }[order.paymentMethod] ?? order.paymentMethod}
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500 mb-0.5">총 결제 금액</p>
                  <p className="text-xl font-bold tracking-tight text-neutral-900">₩{order.items.reduce((sum, it) => sum + it.quantity * (it.price ?? it.product?.price ?? 0), 0).toLocaleString()}</p>
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