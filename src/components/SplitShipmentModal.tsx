import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Package, Truck, Plus, Trash2, MapPin, Loader2, AlertCircle, Check } from 'lucide-react';
import { adminService } from '../services/adminService';
import { productService } from '../services/productService';
import { addressService } from '../services/addressService';
import { toast } from 'sonner';
import { ShippingAddress } from '../types';

interface SplitShipmentModalProps {
  order: any;
  onClose: () => void;
  onSuccess: (bundleData?: any) => void;
  isPreOrder?: boolean;
}

export function SplitShipmentModal({ order, onClose, onSuccess, isPreOrder = false }: SplitShipmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [subProductsMap, setSubProductsMap] = useState<Record<string, any>>({});
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string>('');
  
  // 주소 입력 상태
  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [deliveryMemo, setDeliveryMemo] = useState('');
  const [bundleLabel, setBundleLabel] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const flat: any[] = [];
        const subProductIds = new Set<string>();
        const itemsToProcess = order?.items || (order as any)?.orderItems || [];

        for (const orderItem of itemsToProcess) {
          const product = orderItem.product;
          const selectedIds = orderItem.selectedProductIds || (orderItem as any).selected_product_ids || [];
          const isBundle = selectedIds.length > 0;

          if (isBundle) {
            // ── 번들/패키지 상품 구성품 ──
            selectedIds.forEach((pid: string) => { if (pid) subProductIds.add(pid); });
            
            let alreadyShippedIndices = (orderItem as any).shipped_selected_indices || [];
            
            if (isPreOrder) {
              const pendingBundles = (order as any).pendingBundles || [];
              pendingBundles.forEach((b: any) => {
                b.items?.forEach((bi: any) => {
                  if (bi.orderItemId === orderItem.id && bi.productId !== orderItem.productId) {
                    if (bi.shippedSelectedIndices) {
                      alreadyShippedIndices = [...alreadyShippedIndices, ...bi.shippedSelectedIndices];
                    }
                  }
                });
              });
            }

            const grouped: Record<string, { pid: string; indices: number[] }> = {};
            selectedIds.forEach((pid: string, idx: number) => {
              if (alreadyShippedIndices.includes(idx)) return;
              if (!grouped[pid]) grouped[pid] = { pid, indices: [] };
              grouped[pid].indices.push(idx);
            });

            Object.values(grouped).forEach(group => {
              flat.push({
                type: 'BUNDLE_ITEM',
                orderItemId: orderItem.id || '',
                productId: group.pid,
                indices: group.indices,
                remaining: group.indices.length,
                selectedQty: 0,
                parentName: product?.name
              });
            });
          } else {
            // ── 일반 메인 상품 ──
            const shippedQty = orderItem.shippedQuantity || (orderItem as any).shipped_quantity || 0;
            const remaining = isPreOrder && typeof orderItem.remaining === 'number' 
              ? orderItem.remaining 
              : (orderItem.quantity || 0) - shippedQty;

            if (remaining > 0) {
              flat.push({
                type: 'MAIN',
                orderItemId: orderItem.id || '',
                productId: orderItem.productId || product?.id,
                name: product?.name || orderItem.productName || '상품명 없음',
                remaining,
                selectedQty: 0,
                imageUrl: product?.imageUrl
              });
            }
          }

          // ── 증정 상품 ──
          const bonusItems = product?.bonusItems || (orderItem as any).bonusItems || [];
          bonusItems.forEach((bonus: any, bIdx: number) => {
            if (bonus.productId) subProductIds.add(bonus.productId);
            
            const itemQty = orderItem.quantity || 0;
            const bTotal = bonus.calculationMethod === 'ratio'
              ? Math.ceil(itemQty * (bonus.percentage || 0) / 100)
              : (bonus.quantity ?? 1) * itemQty;
            
            let bShipped = 0;
            if (isPreOrder) {
              const pendingBundles = (order as any).pendingBundles || [];
              pendingBundles.forEach((b: any) => {
                b.bonusItems?.forEach((bb: any) => {
                  if (bb.productId === bonus.productId) {
                    bShipped += (bb.quantity || 0);
                  }
                });
              });
            } else {
              (order.shipments || []).forEach((s: any) => {
                (s.bonusItems || []).forEach((sb: any) => {
                  if (sb.productId === bonus.productId) bShipped += (sb.quantity || 0);
                });
              });
            }

            const bRemain = Math.max(0, bTotal - bShipped);
            if (bRemain > 0) {
              flat.push({
                type: 'BONUS',
                orderItemId: orderItem.id || '',
                productId: bonus.productId,
                name: bonus.productName || bonus.product?.name || '증정품',
                remaining: bRemain,
                selectedQty: 0,
                bonusIdx: bIdx,
                parentName: product?.name
              });
            }
          });
        }

        setItems(flat);

        if (subProductIds.size > 0) {
          const promises = Array.from(subProductIds).map(pid => productService.getProductById(pid));
          const products = await Promise.all(promises);
          const map: Record<string, any> = {};
          products.forEach(p => { if (p) map[p.id] = p; });
          setSubProductsMap(map);
        }
      } catch (err) {
        console.error('Failed to load split shipment items:', err);
        setItems([]);
      }
    };

    const loadAddresses = async () => {
      if (!order.userId) return;
      try {
        const list = await addressService.getAddresses(order.userId);
        setSavedAddresses(list);
        const def = list.find(a => a.isDefault);
        if (def) applyAddress(def);
      } catch (e) {
        console.error('Failed to load addresses:', e);
      }
    };

    loadData();
    loadAddresses();
  }, [order]);

  const applyAddress = (addr: ShippingAddress) => {
    setSelectedAddrId(addr.id);
    setRecipient(addr.recipient);
    setPhone(addr.phone);
    setZipCode(addr.zipCode);
    setAddress(addr.address);
    setAddressDetail(addr.addressDetail || '');
  };

  const handleAddBundle = async () => {
    const selectedItems = items.filter(i => i.selectedQty > 0);
    if (selectedItems.length === 0) {
      toast.error('번들에 포함할 상품을 1개 이상 선택해주세요.');
      return;
    }
    if (!recipient || !phone || !zipCode || !address) {
      toast.error('배송지 정보를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const bundleData: any = {
        label: bundleLabel || `배송지: ${recipient}`,
        shippingInfo: {
          recipient,
          phone,
          zipCode,
          address,
          addressDetail,
          deliveryMemo
        },
        items: [],
        bonusItems: []
      };

      items.forEach(item => {
        if (item.selectedQty <= 0) return;

        if (item.type === 'MAIN') {
          bundleData.items.push({
            orderItemId: item.orderItemId,
            productId: item.productId,
            shipQty: item.selectedQty,
            productName: item.name
          });
        } else if (item.type === 'BUNDLE_ITEM') {
          bundleData.items.push({
            orderItemId: item.orderItemId,
            productId: item.productId,
            shipQty: item.selectedQty,
            shippedSelectedIndices: item.indices.slice(0, item.selectedQty),
            productName: subProductsMap[item.productId]?.name
          });
        } else if (item.type === 'BONUS') {
          bundleData.bonusItems.push({
            productId: item.productId,
            productName: item.name || subProductsMap[item.productId]?.name,
            quantity: item.selectedQty
          });
        }
      });

      if (!isPreOrder) {
        await adminService.createShippingBundle({
          orderId: order.id,
          ...bundleData
        });
        toast.success('배송 번들이 등록되었습니다.');
      }
      
      onSuccess(bundleData);
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error('번들 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (flatIdx: number, val: number) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx === flatIdx) {
        return { ...item, selectedQty: Math.min(item.remaining, Math.max(0, val)) };
      }
      return item;
    }));
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              분할 배송 번들 등록
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">원하는 상품 수량을 선택하고 배송지를 지정하여 배송 묶음을 생성합니다.</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 transition-colors text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 상품 선택 섹션 */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2 pb-2 border-b">
              <Package className="w-4 h-4" />
              1. 발송 대상 상품 및 수량 선택
            </h4>
            {items.length === 0 ? (
              <div className="py-12 text-center border border-dashed rounded-lg bg-neutral-50">
                <AlertCircle className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">발송 가능한 잔여 상품이 없습니다.</p>
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-sm overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-3 text-[11px] font-semibold text-neutral-600 uppercase tracking-tight">상품 정보</th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-neutral-600 text-center w-20 uppercase tracking-tight">잔여</th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-neutral-600 text-right w-36 uppercase tracking-tight">번들 포함 수량</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {items.map((item, idx) => {
                      const pInfo = item.type === 'MAIN' ? item : subProductsMap[item.productId];
                      const displayName = item.type === 'MAIN' ? item.name : (pInfo?.name || item.name || '상품 정보 로딩 중...');
                      const typeLabel = item.type === 'MAIN' ? '기본' : item.type === 'BUNDLE_ITEM' ? '구성' : '증정';
                      const typeColor = item.type === 'MAIN' ? 'bg-neutral-100 text-neutral-600 border-neutral-200' : item.type === 'BUNDLE_ITEM' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100';
                      const isSubRow = item.type !== 'MAIN';

                      return (
                        <tr key={`${item.orderItemId}-${item.productId}-${item.type}-${idx}`} className={`hover:bg-neutral-50/50 transition-colors ${isSubRow ? 'bg-neutral-50/20' : ''}`}>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-neutral-100 rounded-sm border border-neutral-200 flex-shrink-0 overflow-hidden hidden sm:block">
                                <img src={item.imageUrl || pInfo?.imageUrl} alt={displayName} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm border ${typeColor}`}>{typeLabel}</span>
                                  <p className="text-sm font-medium text-neutral-900 truncate">{displayName}</p>
                                </div>
                                {item.parentName && (
                                  <p className="text-[10px] text-neutral-400 font-medium">[{item.parentName}]</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="text-sm font-bold text-neutral-900 whitespace-nowrap">{item.remaining}개</span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                              <input
                                type="number"
                                min={0}
                                max={item.remaining}
                                value={item.selectedQty}
                                onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 0)}
                                className="w-16 h-8 px-2 border border-neutral-200 text-sm text-right focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm bg-neutral-50 rounded-sm flex-shrink-0"
                              />
                              <span className="text-[11px] text-neutral-400 font-medium flex-shrink-0">/ {item.remaining}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 배송지 입력 섹션 */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2 pb-2 border-b">
              <MapPin className="w-4 h-4" />
              2. 배송지 정보 입력
            </h4>
            
            <div className="space-y-6">
              {/* 저장된 배송지 선택 리스트박스 영역 */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">저장된 배송지</label>
                <div className="relative">
                  <select
                    value={selectedAddrId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setSelectedAddrId('');
                        setRecipient('');
                        setPhone('');
                        setZipCode('');
                        setAddress('');
                        setAddressDetail('');
                      } else {
                        const addr = savedAddresses.find(a => a.id === val);
                        if (addr) applyAddress(addr);
                      }
                    }}
                    className="w-full px-4 py-3 border border-neutral-200 focus:ring-1 focus:ring-neutral-900 focus:outline-none text-sm bg-neutral-50 appearance-none pr-10"
                  >
                    {savedAddresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        [{addr.label}{addr.isDefault ? ' - 기본' : ''}] {addr.recipient} ({addr.phone}) / {addr.address}
                      </option>
                    ))}
                    <option value="">새 배송지 직접 입력</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* 입력 폼 영역 (CheckoutPage 스타일) */}
              <div className="pt-6 border-t border-neutral-100 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">번들 별칭 (관리용)</label>
                  <input
                    type="text"
                    value={bundleLabel}
                    onChange={e => setBundleLabel(e.target.value)}
                    placeholder="예: 3층 창고 배송분"
                    className="w-full px-4 py-3 border border-neutral-200 focus:ring-1 focus:ring-neutral-900 text-sm bg-neutral-50"
                  />
                </div>
                {selectedAddrId === '' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">수령인</label>
                        <input
                          type="text"
                          value={recipient}
                          onChange={e => setRecipient(e.target.value)}
                          className="w-full px-4 py-3 border border-neutral-200 focus:ring-1 focus:ring-neutral-900 text-sm bg-neutral-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">연락처</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="w-full px-4 py-3 border border-neutral-200 focus:ring-1 focus:ring-neutral-900 text-sm bg-neutral-50"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">주소</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={zipCode}
                          readOnly
                          placeholder="우편번호"
                          className="w-24 sm:w-32 px-4 py-3 border border-neutral-200 bg-neutral-100 text-sm text-neutral-500"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            new (window as any).daum.Postcode({
                              oncomplete: (data: any) => {
                                setZipCode(data.zonecode);
                                setAddress(data.roadAddress);
                              },
                            }).open();
                          }}
                          className="bg-neutral-900 text-white px-4 sm:px-6 py-3 font-medium hover:bg-neutral-800 transition-colors text-sm whitespace-nowrap"
                        >
                          주소검색
                        </button>
                      </div>
                      <input
                        type="text"
                        value={address}
                        readOnly
                        placeholder="기본 주소"
                        className="w-full px-4 py-3 border border-neutral-200 bg-neutral-100 text-sm text-neutral-500"
                      />
                      <input
                        type="text"
                        value={addressDetail}
                        onChange={e => setAddressDetail(e.target.value)}
                        placeholder="상세 주소를 입력해주세요"
                        className="w-full px-4 py-3 border border-neutral-200 focus:ring-1 focus:ring-neutral-900 text-sm"
                      />
                    </div>
                  </>
                )}

                <div className="pt-4">
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">배송 메모</label>
                  <textarea
                    value={deliveryMemo}
                    onChange={(e) => setDeliveryMemo(e.target.value)}
                    placeholder="배송 시 요청사항을 입력해주세요 (선택)"
                    rows={2}
                    className="w-full px-4 py-3 border border-neutral-200 focus:ring-1 focus:ring-neutral-900 resize-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50">
          <div className="text-xs text-neutral-500">
            <span className="font-bold text-neutral-900">주의:</span> 번들 등록 후에는 관리자가 발송 처리를 시작하기 전까지만 수정이 가능합니다.
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-neutral-300 text-neutral-900 text-sm font-bold hover:bg-neutral-100 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleAddBundle}
              disabled={loading || items.filter(i => i.selectedQty > 0).length === 0}
              className="px-6 py-2.5 bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              배송 번들 만들기
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
