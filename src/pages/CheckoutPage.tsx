import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { CreditCard, Wallet, Plus, ChevronDown, ArrowLeft, MapPin, Loader2, Package, Check, AlertCircle, Trash2, Coins } from 'lucide-react';
import { cartService } from '../services/cartService';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';
import { paymentService } from '../services/paymentService';
import { CartItem, Product, PaymentMethod, ShippingAddress, User } from '../types';
import { addressService } from '../services/addressService';
import { ProductImage } from '../components/ui/ProductImage';
import { CartItemCard } from '../components/CartItemCard';
import { CardRegistrationModal } from '../components/CardRegistrationModal';
import { AddressSearchModal } from '../components/AddressSearchModal';
import { toast } from 'sonner';
import cardLogos from '../assets/card-logos.png';
import { adminService } from '../services/adminService';
import { SplitShipmentModal } from '../components/SplitShipmentModal';
import { creditService, CreditSummary } from '../services/creditService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

declare global {
  interface Window {
    daum: any;
  }
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'virtual'>('credit');
  const [userCards, setUserCards] = useState<PaymentMethod[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [subscriptionCycle, setSubscriptionCycle] = useState<number>(30);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  
  const [deliveryMemo, setDeliveryMemo] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [address, setAddress] = useState({
    recipient: '',
    phone: '',
    zipCode: '',
    address: '',
    detail: '',
  });

  const [isPartialShipAllowed, setIsPartialShipAllowed] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [pendingBundles, setPendingBundles] = useState<any[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // 크레딧 (상품별)
  const [equipmentCreditMap, setEquipmentCreditMap] = useState<Record<string, number>>({});
  const [itemCredits, setItemCredits] = useState<Record<string, number>>({});
  const [creditLoading, setCreditLoading] = useState(false);

  const splitShipOrder = useMemo(() => {
    if (!userProfile) return null;
    return {
      id: '',
      userId: userProfile.id,
      orderNumber: 'PRE-ORDER',
      pendingBundles,
      items: cart.map(item => {
        const p = productsMap[item.productId];
        const alreadyAllocated = pendingBundles.reduce((sum, b) => {
          const bi = b.items?.find((i: any) => i.orderItemId === item.id && i.productId === item.productId);
          return sum + (bi?.shipQty || 0);
        }, 0);

        return {
          id: item.id || '',
          productId: item.productId,
          product: p,
          productName: p?.name || '상품 정보 로딩 중...',
          quantity: item.quantity,
          shippedQuantity: 0,
          selectedProductIds: item.selectedProductIds || [],
          // 이미 등록된 번들들에서 할당된 수량 제외한 진짜 잔여 수량
          remaining: Math.max(0, item.quantity - alreadyAllocated)
        };
      })
    };
  }, [cart, productsMap, pendingBundles, userProfile]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [items, user] = await Promise.all([
        cartService.getCart(),
        authService.getCurrentUser()
      ]);

      if (!user) {
        navigate('/login');
        return;
      }

      setCart(items);

      if (user) {
        setUserProfile(user);
        
        // 분할배송 권한 체크
        const types = await adminService.getMemberTypes();
        const userTypes = user.memberType?.split(',').map(t => t.trim()) || [];
        const allowed = user.role === 'admin' || (types as any[]).some(t => userTypes.includes(t.name) && t.partial_shipment);
        setIsPartialShipAllowed(allowed);

        // 저장된 배송지 목록 로드
        const savedAddrs = await addressService.getAddresses(user.id);
        setSavedAddresses(savedAddrs);
        const defaultAddr = savedAddrs.find(a => a.isDefault) || savedAddrs[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setAddress({
            recipient: defaultAddr.recipient,
            phone: defaultAddr.phone,
            zipCode: defaultAddr.zipCode,
            address: defaultAddr.address,
            detail: defaultAddr.addressDetail,
          });
        } else {
          // 저장된 배송지 없으면 회원정보 주소를 폼에 채움
          setAddress({
            recipient: user.name || '',
            phone: user.phone || user.mobile || '',
            zipCode: user.zipCode || '',
            address: user.address || '',
            detail: user.addressDetail || '',
          });
        }

        // Load User Cards
        const cards = await paymentService.getPaymentMethods(user.id);
        setUserCards(cards);
        if (cards.length > 0) {
          const defaultCard = cards.find(c => c.isDefault) || cards[0];
          setSelectedCardId(defaultCard.id);
        }
      }

      if (items.length > 0) {
        const allProductIds = new Set<string>();
        items.forEach(item => {
          allProductIds.add(item.productId);
          item.selectedProductIds?.forEach(id => allProductIds.add(id));
        });

        const productPromises = Array.from(allProductIds).map(id => productService.getProductById(id));
        const products = await Promise.all(productPromises);

        const map: Record<string, Product> = {};
        products.forEach(p => {
          if (p) map[p.id] = p;
        });
        setProductsMap(map);

        // 크레딧 가능 상품이 있으면 장비별 잔액 로딩
        const hasCreditItems = products.some(p => p?.creditAvailable);
        if (hasCreditItems && user) {
          setCreditLoading(true);
          creditService.getCreditSummary(user.id)
            .then(summaries => {
              const map: Record<string, number> = {};
              summaries.forEach(s => { map[s.equipmentType] = s.remaining; });
              setEquipmentCreditMap(map);
            })
            .catch(console.error)
            .finally(() => setCreditLoading(false));
        }
      } else {
        navigate('/cart');
      }
    } catch (error) {
      console.error('Failed to load checkout data', error);
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = () => {
    setIsCardModalOpen(true);
  };

  const handleRegisterCardSuccess = async (cardDetail: { cardName: string; lastFour: string; alias?: string }) => {
    const user = await authService.getCurrentUser();
    if (!user) return;

    try {
      const newCard = await paymentService.registerCard(user.id, cardDetail);
      setUserCards(prev => [newCard, ...prev]);
      setSelectedCardId(newCard.id);
    } catch (error) {
      toast.error('카드 등록에 실패했습니다.');
      throw error;
    }
  };

  const handleDeleteCard = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    setCardToDelete(cardId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCard = async () => {
    if (!cardToDelete) return;

    try {
      await paymentService.deletePaymentMethod(cardToDelete);
      setUserCards(prev => prev.filter(c => c.id !== cardToDelete));
      if (selectedCardId === cardToDelete) {
        setSelectedCardId('');
      }
      toast.success('카드가 삭제되었습니다.');
    } catch (error) {
      console.error('Delete card error:', error);
      toast.error('카드 삭제에 실패했습니다.');
    } finally {
      setIsDeleteDialogOpen(false);
      setCardToDelete(null);
    }
  };

  /** 사업장주소를 배송지로 1회 등록 후 자동 선택 */
  const handleRegisterProfileAddress = async () => {
    if (!userProfile?.id || !userProfile.address) return;
    try {
      setSyncing(true);
      const created = await addressService.addAddress(userProfile.id, {
        label: userProfile.hospitalName || '사업장 주소',
        recipient: userProfile.name || '',
        phone: userProfile.phone || userProfile.mobile || '',
        zipCode: userProfile.zipCode || '',
        address: userProfile.address,
        addressDetail: userProfile.addressDetail || '',
        isDefault: true,
      });
      setSavedAddresses([created]);
      setSelectedAddressId(created.id);
      setAddress({
        recipient: created.recipient,
        phone: created.phone,
        zipCode: created.zipCode,
        address: created.address,
        detail: created.addressDetail,
      });
      toast.success('사업장주소가 배송지로 등록되었습니다.');
    } catch {
      toast.error('배송지 등록에 실패했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  const handleAddressSearch = () => {
    setShowAddressModal(true);
  };

  const getTierPrice = (item: CartItem) => {
    // 어드민 협의 단가 우선 적용
    if (item.customPrice != null) return item.customPrice;

    const product = productsMap[item.productId];
    if (!product) return 0;

    if (product.isPromotion && item.selectedProductIds) {
      const buyQty = product.buyQuantity || 0;
      const paidItemIds = item.selectedProductIds.slice(0, buyQty);
      const paidTotal = paidItemIds.reduce((sum, id) => {
        const subProduct = productsMap[id];
        return sum + (subProduct?.price || 0);
      }, 0);
      return paidTotal;
    }

    if (item.optionId) {
      const option = product.options?.find(opt => opt.id === item.optionId);
      if (option) {
        const discountRate = (option.discountRate || 0) / 100;
        const basePrice = (option.price && option.price > 0) ? option.price : (product.price * (option.quantity || 1));
        return (basePrice * (1 - discountRate)) / (option.quantity || 1);
      }
    }

    const tier = [...product.tierPricing]
      .sort((a, b) => b.quantity - a.quantity)
      .find(t => item.quantity >= t.quantity);

    const basePrice = tier?.unitPrice || product.price;
    const productDiscountRate = (product.discountRate || 0) / 100;
    return basePrice * (1 - productDiscountRate);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const product = productsMap[item.productId];
      const unitPrice = getTierPrice(item);
      const subDiscount = (product?.subscriptionDiscount || 0) / 100;
      const discount = item.isSubscription ? (1 - subDiscount) : 1;
      return sum + unitPrice * item.quantity * discount;
    }, 0);
  };

  const hasSubscriptionItems = cart.some(i => i.isSubscription);
  const hasCreditProducts = cart.some(i => productsMap[i.productId]?.creditAvailable);

  // 상품별 크레딧 사용 합계
  const totalCreditUsed = Object.values(itemCredits).reduce((a, b) => a + b, 0);
  const finalTotal = Math.max(0, calculateTotal() - totalCreditUsed);

  /** 상품의 호환 장비 코드 기반 총 가용 크레딧 */
  const getAvailableForProduct = (product: Product): number =>
    (product.compatibleEquipment || []).reduce(
      (sum, code) => sum + (equipmentCreditMap[code] || 0), 0
    );

  /** 해당 상품에 현재 사용 가능한 잔여 크레딧
   *  → 같은 장비 풀을 공유하는 다른 상품의 사용분만 차감 (다른 장비 풀은 영향 없음) */
  const getRemainingCredit = (cartItemId: string, product: Product): number => {
    const productEquipments = new Set(product.compatibleEquipment || []);

    // 같은 장비를 공유하는 다른 상품이 사용 중인 크레딧 합산
    let usedByOthersInSamePool = 0;
    cart.forEach(ci => {
      const key = ci.id || ci.productId;
      if (key === cartItemId) return;
      const otherProduct = productsMap[ci.productId];
      if (!otherProduct?.compatibleEquipment) return;
      const hasOverlap = otherProduct.compatibleEquipment.some(eq => productEquipments.has(eq));
      if (hasOverlap) usedByOthersInSamePool += itemCredits[key] || 0;
    });

    const poolTotal = getAvailableForProduct(product);
    return Math.max(0, poolTotal - usedByOthersInSamePool);
  };

  const handleItemCreditChange = (cartItemId: string, amount: number) => {
    setItemCredits(prev => ({ ...prev, [cartItemId]: amount }));
  };

  const handleOrder = async () => {
    if (!address.address || !address.recipient || !address.phone) {
      toast.error('배송지 정보를 모두 입력해주세요.');
      return;
    }

    if (paymentMethod === 'credit' && !selectedCardId) {
      toast.error('결제할 카드를 선택하거나 새로 등록해주세요.');
      return;
    }

    try {
      setPlacingOrder(true);
      const user = await authService.getCurrentUser();

      if (!user) {
        throw new Error('User not logged in');
      }

      const selectedCard = userCards.find(c => c.id === selectedCardId);
      const fullAddress = `(${address.zipCode}) ${address.address} ${address.detail} (수령인: ${address.recipient}, 연락처: ${address.phone}) ${deliveryMemo ? `[메모: ${deliveryMemo}]` : ''}`;

      const order = await orderService.createOrder({
        userId: user.id,
        items: cart,
        totalAmount: finalTotal,
        paymentMethod: paymentMethod,
        deliveryAddress: fullAddress,
        billingKeyId: selectedCard?.id,
        billingKey: selectedCard?.billingKey,
        subscriptionCycle: hasSubscriptionItems ? subscriptionCycle : undefined
      });

      // 크레딧 사용 처리 - 상품별 장비 타입으로 분리 차감
      if (totalCreditUsed > 0) {
        for (const cartItem of cart) {
          const key = cartItem.id || cartItem.productId;
          const creditAmt = itemCredits[key] || 0;
          if (creditAmt <= 0) continue;

          const product = productsMap[cartItem.productId];
          const equipmentType = product?.compatibleEquipment?.[0];

          try {
            if (equipmentType) {
              // 장비 타입별 차감
              await creditService.useEquipmentCredits({
                userId: user.id,
                equipmentType,
                amount: creditAmt,
                orderId: order.id,
                description: `${equipmentType} 크레딧 사용 (${order.order_number || order.id.slice(0, 8)})`,
              });
            } else {
              // 장비 정보 없을 때 기존 RPC 사용
              await creditService.useCredits({
                userId: user.id,
                amount: creditAmt,
                orderId: order.id,
                description: `주문 크레딧 사용 (${order.order_number || order.id.slice(0, 8)})`,
              });
            }
          } catch (creditError: any) {
            console.error('Credit deduction failed:', creditError);
            toast.error(`크레딧 차감 중 오류가 발생했습니다. (${equipmentType || '알 수 없음'})`);
          }
        }
      }

      // 사전 등록된 분할 배송 번들 생성
      if (pendingBundles.length > 0) {
        for (const bundle of pendingBundles) {
          // order.items에서 일치하는 order_item_id 매칭
          const matchedItems = bundle.items.map((bi: any) => {
            const oi = order.items.find((i: any) => i.productId === bi.productId);
            return {
              ...bi,
              orderItemId: oi?.id || bi.orderItemId
            };
          });

          await adminService.createShippingBundle({
            orderId: order.id,
            label: bundle.label,
            shippingInfo: bundle.shippingInfo,
            items: matchedItems,
            bonusItems: bundle.bonusItems
          });
        }
      }

      navigate(`/order-complete/${order.id}`);
    } catch (error: any) {
      console.error('Order failed', error);
      toast.error('주문 처리에 실패했습니다: ' + (error.message || 'Error'));
    } finally {
      setPlacingOrder(false);
    }
  };

  const getCardBrandStyles = (cardName: string) => {
    const brands: Record<string, { bg: string, text: string, short: string, pos: string }> = {
      '신한카드': { bg: 'bg-white', text: 'text-transparent', short: 'SH', pos: '0% 0%' },
      '국민카드': { bg: 'bg-white', text: 'text-transparent', short: 'KB', pos: '33.33% 0%' },
      '현대카드': { bg: 'bg-white', text: 'text-transparent', short: 'HD', pos: '66.66% 0%' },
      '삼성카드': { bg: 'bg-white', text: 'text-transparent', short: 'SS', pos: '100% 0%' },
      '우리카드': { bg: 'bg-white', text: 'text-transparent', short: 'WR', pos: '0% 45%' },
      '하나카드': { bg: 'bg-white', text: 'text-transparent', short: 'HN', pos: '33.33% 45%' },
      '롯데카드': { bg: 'bg-white', text: 'text-transparent', short: 'LT', pos: '66.66% 45%' },
      'BC카드': { bg: 'bg-white', text: 'text-transparent', short: 'BC', pos: '100% 45%' },
      'NH농협카드': { bg: 'bg-[#004A95]', text: 'text-white', short: 'NH', pos: '' },
      '카카오뱅크': { bg: 'bg-[#FFE600]', text: 'text-black', short: 'KK', pos: '' },
      '토스뱅크': { bg: 'bg-[#0064FF]', text: 'text-white', short: 'TS', pos: '' },
      '케이뱅크': { bg: 'bg-[#000000]', text: 'text-white', short: 'K', pos: '' },
      '씨티카드': { bg: 'bg-[#003B71]', text: 'text-white', short: 'CT', pos: '' },
      '우체국': { bg: 'bg-[#E60012]', text: 'text-white', short: 'EP', pos: '' },
      'MG새마을금고': { bg: 'bg-[#00529B]', text: 'text-white', short: 'MG', pos: '' },
      '신협': { bg: 'bg-[#005193]', text: 'text-white', short: 'CU', pos: '' },
    };

    return brands[cardName] || { bg: 'bg-neutral-200', text: 'text-neutral-500', short: cardName.slice(0, 1), pos: '' };
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (cart.length === 0) return null;

  const total = calculateTotal();

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 lg:py-12">
      <button
        onClick={() => navigate('/cart')}
        className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        장바구니로 돌아가기
      </button>

      <div className="mb-8 lg:mb-12">
        <h1 className="text-3xl lg:text-4xl tracking-tight text-neutral-900 mb-2">결제하기</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* User Order Items */}
          <div className="bg-white border border-neutral-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl tracking-tight text-neutral-900 font-bold">주문 상품 정보</h2>
              {isPartialShipAllowed && (
                <button
                  onClick={() => setIsSplitModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  분할배송등록
                </button>
              )}
            </div>
            <div className="space-y-4">
              {cart.map(item => {
                const product = productsMap[item.productId];
                if (!product) return null;
                const unitPrice = getTierPrice(item);
                const subDiscount = (product?.subscriptionDiscount || 0) / 100;
                const itemTotal = unitPrice * item.quantity * (item.isSubscription ? (1 - subDiscount) : 1);
                return (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    product={product}
                    productsMap={productsMap}
                    unitPrice={unitPrice}
                    itemTotal={itemTotal}
                    readonly
                    creditAvailable={product.creditAvailable}
                    availableCredit={product.creditAvailable ? getRemainingCredit(item.id || item.productId, product) : 0}
                    creditUsed={itemCredits[item.id || item.productId] || 0}
                    onCreditChange={product.creditAvailable && getAvailableForProduct(product) > 0
                      ? (val) => handleItemCreditChange(item.id || item.productId, val)
                      : undefined
                    }
                  />
                );
              })}
            </div>
            {/* Registered Bundles Summary */}
            {pendingBundles.length > 0 && (
              <div className="mt-8 pt-6 border-t border-neutral-100 space-y-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Package className="w-4 h-4" />
                  <p className="text-sm font-bold uppercase tracking-tight">사전 등록된 분할 배송 번들 ({pendingBundles.length})</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {pendingBundles.map((bundle, idx) => (
                    <div key={idx} className="p-4 bg-blue-50/30 border border-blue-100 rounded-lg relative group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">번들 {idx + 1}</span>
                          <p className="text-sm font-bold text-neutral-900">{bundle.label}</p>
                        </div>
                        <button 
                          onClick={() => setPendingBundles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-neutral-400 hover:text-red-500 transition-colors"
                          title="번들 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="bg-white p-3 rounded-md border border-blue-50 text-xs mb-3">
                        <p className="font-bold text-neutral-900 mb-2 border-b border-neutral-100 pb-1">발송 품목</p>
                        <ul className="space-y-1.5">
                          {bundle.items.map((item: any, i: number) => (
                            <li key={i} className="flex justify-between text-neutral-600">
                              <span className="truncate pr-2">- {item.productName}</span>
                              <span className="font-medium flex-shrink-0">{item.shipQty}개</span>
                            </li>
                          ))}
                          {bundle.bonusItems?.map((bonus: any, i: number) => (
                            <li key={`b-${i}`} className="flex justify-between text-amber-600">
                              <span className="truncate pr-2">- [증정] {bonus.productName}</span>
                              <span className="font-medium flex-shrink-0">{bonus.quantity}개</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="text-xs text-neutral-600 space-y-1">
                        <div className="flex gap-2">
                          <span className="font-bold text-neutral-900 w-12 flex-shrink-0">수령인</span>
                          <span>{bundle.shippingInfo.recipient} <span className="text-neutral-400">({bundle.shippingInfo.phone})</span></span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-bold text-neutral-900 w-12 flex-shrink-0">배송지</span>
                          <span className="break-all">{bundle.shippingInfo.address} {bundle.shippingInfo.addressDetail} [{bundle.shippingInfo.zipCode}]</span>
                        </div>
                        {bundle.shippingInfo.deliveryMemo && (
                          <div className="flex gap-2 text-blue-600 mt-1">
                            <span className="font-bold w-12 flex-shrink-0">메모</span>
                            <span>{bundle.shippingInfo.deliveryMemo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-blue-500 bg-blue-50/50 p-2 rounded">
                  * 위 품목들은 결제 완료 후 지정된 배송지로 별도 발송 예약됩니다.
                </p>
              </div>
            )}
          </div>


          {/* Delivery Address - Hide if split bundles are being registered */}
          {pendingBundles.length === 0 && (
            <div className="bg-white border border-neutral-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl tracking-tight text-neutral-900 flex items-center gap-2 font-bold">
                <MapPin className="w-5 h-5" />
                배송지 정보
              </h2>
              <a
                href="/mypage/addresses"
                target="_blank"
                className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
              >
                배송지 관리 →
              </a>
            </div>

            {/* 사업장주소 → 배송지 등록 배너 (저장된 배송지 없을 때만) */}
            {savedAddresses.length === 0 && userProfile?.address && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-100 px-4 py-3 mb-5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-blue-900">📦 사업장주소를 배송지로 등록할까요?</p>
                  <p className="text-xs text-blue-600 mt-0.5 truncate">
                    {userProfile.address}{userProfile.addressDetail ? ` ${userProfile.addressDetail}` : ''}
                  </p>
                </div>
                <button
                  onClick={handleRegisterProfileAddress}
                  disabled={syncing}
                  className="ml-3 flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {syncing ? '등록 중...' : '배송지로 등록'}
                </button>
              </div>
            )}

            {/* 저장된 배송지 선택 */}
            {savedAddresses.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">저장된 배송지</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedAddresses.map(addr => (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        setAddress({
                          recipient: addr.recipient,
                          phone: addr.phone,
                          zipCode: addr.zipCode,
                          address: addr.address,
                          detail: addr.addressDetail,
                        });
                      }}
                      className={`p-3 border-2 cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? 'border-neutral-900 bg-neutral-50'
                          : 'border-neutral-100 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-black text-neutral-900">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-[9px] font-black px-1 py-0.5 bg-neutral-900 text-white">기본</span>
                        )}
                        {selectedAddressId === addr.id && (
                          <Check className="w-3 h-3 text-neutral-900 ml-auto" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-700 font-medium">{addr.recipient} · {addr.phone}</p>
                      <p className="text-xs text-neutral-500 truncate mt-0.5">{addr.address} {addr.addressDetail}</p>
                    </div>
                  ))}
                  {/* 직접 입력 */}
                  <div
                    onClick={() => {
                      setSelectedAddressId(null);
                      setAddress({ recipient: '', phone: '', zipCode: '', address: '', detail: '' });
                    }}
                    className={`p-3 border-2 cursor-pointer transition-all flex items-center gap-2 ${
                      selectedAddressId === null
                        ? 'border-neutral-900 bg-neutral-50'
                        : 'border-dashed border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-xs font-bold text-neutral-500">새 배송지 직접 입력</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">수령인</label>
                <input
                  type="text"
                  value={address.recipient}
                  onChange={e => setAddress({ ...address, recipient: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-200 focus:ring-1 focus:ring-neutral-900 text-sm bg-neutral-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">연락처</label>
                <input
                  type="text"
                  value={address.phone}
                  onChange={e => setAddress({ ...address, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-200 focus:ring-1 focus:ring-neutral-900 text-sm bg-neutral-50"
                />
              </div>
              <div className="md:col-span-2 space-y-3 pt-2">
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">주소</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={address.zipCode}
                    readOnly
                    className="w-32 px-4 py-3 border border-neutral-200 bg-neutral-100 text-sm text-neutral-500"
                    placeholder="우편번호"
                  />
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    className="bg-neutral-900 text-white px-6 py-3 font-medium hover:bg-neutral-800 transition-colors text-sm"
                  >
                    주소검색
                  </button>
                </div>
                <input
                  type="text"
                  value={address.address}
                  readOnly
                  className="w-full px-4 py-3 border border-neutral-200 bg-neutral-100 text-sm text-neutral-500"
                  placeholder="기본 주소"
                />
                <input
                  type="text"
                  value={address.detail}
                  onChange={e => setAddress({ ...address, detail: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-200 focus:ring-1 focus:ring-neutral-900 text-sm"
                  placeholder="상세 주소를 입력해주세요"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-100">
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
        )}

          {/* Payment Methods */}
          <div className="bg-white border border-neutral-200 p-8 shadow-sm">
            <h2 className="text-xl tracking-tight text-neutral-900 mb-6 font-bold">결제 수단</h2>
            <div className="space-y-4">
              {/* KICC EasyPay Billing */}
              <div
                className={`border-2 transition-all ${paymentMethod === 'credit'
                  ? 'border-neutral-900 bg-white'
                  : 'border-neutral-100 bg-neutral-50'
                  }`}
              >
                <label className="flex items-start gap-4 p-6 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="credit"
                    checked={paymentMethod === 'credit'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="mt-0.5 w-5 h-5 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-5 h-5 text-neutral-700" />
                      <span className="font-bold text-neutral-900">등록 법인카드 (이지페이)</span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-4">등록된 카드로 비밀번호 입력 없이 간편하게 결제하세요.</p>

                    {paymentMethod === 'credit' && (
                      <div className="mt-4 space-y-4">
                        {userCards.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {userCards.map(card => {
                              const brandStyle = getCardBrandStyles(card.cardName);
                              return (
                                <div
                                  key={card.id}
                                  onClick={() => setSelectedCardId(card.id)}
                                  className={`p-4 border-2 cursor-pointer transition-all relative ${
                                    selectedCardId === card.id 
                                      ? 'border-neutral-900 bg-neutral-50 shadow-sm' 
                                      : 'border-neutral-200 hover:border-neutral-300'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-3 group/card">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className={`w-12 h-8 ${brandStyle.bg} rounded-sm border border-neutral-100 shadow-sm shrink-0`}
                                        style={brandStyle.pos ? {
                                          backgroundImage: `url(${cardLogos})`,
                                          backgroundSize: '400% 300%',
                                          backgroundPosition: brandStyle.pos,
                                          backgroundRepeat: 'no-repeat'
                                        } : {}}
                                      >
                                        {!brandStyle.pos && (
                                          <span className={`${brandStyle.text} text-[10px] font-black flex items-center justify-center h-full`}>
                                            {brandStyle.short}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs font-bold text-neutral-900 uppercase truncate max-w-[100px]">
                                        {card.alias || card.cardName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {card.isDefault && <span className="text-[10px] bg-neutral-900 text-white px-1.5 py-0.5 font-bold uppercase shrink-0">Basic</span>}
                                      <button
                                        onClick={(e) => handleDeleteCard(e, card.id)}
                                        className="p-1 hover:bg-neutral-200 rounded-sm text-neutral-400 hover:text-red-500 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-end">
                                    <p className="text-sm font-medium text-neutral-900 tracking-wider">
                                      {card.cardNumberMasked}
                                    </p>
                                    {card.alias && (
                                      <span className="text-[10px] text-neutral-400">{card.cardName}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-neutral-50 border border-neutral-200 p-6 text-center">
                            <AlertCircle className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                            <p className="text-sm text-neutral-600 mb-1">등록된 카드가 없습니다.</p>
                            <p className="text-xs text-neutral-400">최초 1회 카드 등록이 필요합니다.</p>
                          </div>
                        )}

                        <button 
                          onClick={handleAddCard}
                          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-colors text-sm font-bold text-neutral-900"
                        >
                          <Plus className="w-4 h-4" />
                          새 법인카드 등록하기
                        </button>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Recurring Payment Cycle Selection */}
              {hasSubscriptionItems && paymentMethod === 'credit' && (
                <div className="bg-blue-50 border border-blue-100 p-6 mt-4">
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-full font-bold text-xs">
                        {subscriptionCycle / 30}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-blue-900 mb-1">정기 배송 주기 선택</h3>
                      <p className="text-[11px] text-blue-700 mb-4 opacity-80">선택하신 주기에 따라 등록된 카드로 자동 결제 및 배송이 진행됩니다.</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {[30, 60, 90].map(days => (
                          <button
                            key={days}
                            onClick={() => setSubscriptionCycle(days)}
                            className={`px-6 py-2.5 text-xs font-bold transition-all border ${
                              subscriptionCycle === days 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                : 'bg-white border-blue-200 text-blue-700 hover:border-blue-400'
                            }`}
                          >
                            {days / 30}개월 마다 (매 {days}일)
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Virtual Account */}
              <label
                className={`flex items-start gap-4 p-6 border-2 cursor-pointer transition-all ${paymentMethod === 'virtual'
                  ? 'border-neutral-900 bg-white'
                  : 'border-neutral-100 bg-neutral-50'
                  }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="virtual"
                  checked={paymentMethod === 'virtual'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mt-0.5 w-5 h-5 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-5 h-5 text-neutral-700" />
                    <span className="font-bold text-neutral-900">가상계좌 (무통장 입금)</span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    입금 확인 후 배송이 시작됩니다. (발행된 계좌번호로 입금해주세요)
                  </p>
                </div>
              </label>
            </div>
          </div>


        </div>{/* /lg:col-span-2 */}


        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-neutral-200 p-8 sticky top-24 shadow-md">
            <h2 className="text-xl tracking-tight text-neutral-900 mb-6 font-bold">결제 정보 요약</h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm text-neutral-500 font-medium">
                <span>총 상품 금액</span>
                <span>₩{calculateTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-500 font-medium">
                <span>배송비</span>
                <span className="text-green-600 font-bold uppercase text-[10px] tracking-tight border border-green-200 px-1.5 py-0.5 bg-green-50">Free Shipping</span>
              </div>
              {totalCreditUsed > 0 && (
                <div className="flex justify-between text-sm font-semibold" style={{ color: '#059669' }}>
                  <span className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    크레딧 차감
                  </span>
                  <span>- ₩{totalCreditUsed.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-6 border-t border-neutral-100">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-tighter">Total Amount</span>
                  <span className="text-3xl font-black tracking-tight text-neutral-900 leading-none">
                    ₩{finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleOrder}
              disabled={placingOrder}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-5 font-bold transition-all text-sm tracking-widest uppercase mb-4 disabled:opacity-50 shadow-lg"
            >
              {placingOrder ? 'Processing...' : (paymentMethod === 'credit' ? `₩${finalTotal.toLocaleString()} 카드 결제하기` : '가상계좌 주문 완료')}
            </button>

            <div className="flex items-start gap-2 p-3 bg-neutral-50 border border-neutral-100">
              <Check className="w-4 h-4 text-green-600 mt-0.5" />
              <p className="text-[10px] text-neutral-500 leading-relaxed font-medium">
                결제 즉시 주문이 접수되며, 배송 및 결제 내역은 <span className="underline cursor-pointer">마이페이지</span>에서 확인 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CardRegistrationModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onSuccess={handleRegisterCardSuccess}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle>등록 카드를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 카드는 다시 복구할 수 없으며, 결제 시 새로 등록해야 합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCard}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              삭제하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Split Shipment Modal */}
      {showAddressModal && (
        <AddressSearchModal
          onSelect={({ zipCode, address: addr }) => {
            setAddress(prev => ({ ...prev, zipCode, address: addr, detail: '' }));
          }}
          onClose={() => setShowAddressModal(false)}
        />
      )}

      {isSplitModalOpen && splitShipOrder && (
        <SplitShipmentModal
          onClose={() => setIsSplitModalOpen(false)}
          isPreOrder={true}
          order={splitShipOrder}
          onSuccess={(bundleData) => {
            if (bundleData) {
              setPendingBundles(prev => [...prev, bundleData]);
              toast.success('배송 번들이 사전 등록되었습니다.');
            }
            setIsSplitModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
