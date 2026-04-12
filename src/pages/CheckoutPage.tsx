import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { CreditCard, Wallet, Plus, ChevronDown, ArrowLeft, MapPin, Loader2, Package, Check, AlertCircle, Trash2 } from 'lucide-react';
import { cartService } from '../services/cartService';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';
import { paymentService } from '../services/paymentService';
import { CartItem, Product, PaymentMethod } from '../types';
import { ProductImage } from '../components/ui/ProductImage';
import { CardRegistrationModal } from '../components/CardRegistrationModal';
import { toast } from 'sonner';
import cardLogos from '../assets/card-logos.png';
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
  const [address, setAddress] = useState({
    recipient: '',
    phone: '',
    zipCode: '',
    address: '',
    detail: '',
  });

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
        setAddress({
          recipient: user.name || '',
          phone: user.phone || user.mobile || '',
          zipCode: user.zipCode || '',
          address: user.address || '',
          detail: user.addressDetail || '',
        });

        // Load User Cards
        const cards = await paymentService.getPaymentMethods(user.id);
        setUserCards(cards);
        if (cards.length > 0) {
          const defaultCard = cards.find(c => c.isDefault) || cards[0];
          setSelectedCardId(defaultCard.id);
        }
      }

      if (items.length > 0) {
        const productPromises = items.map(item => productService.getProductById(item.productId));
        const products = await Promise.all(productPromises);

        const map: Record<string, Product> = {};
        products.forEach(p => {
          if (p) map[p.id] = p;
        });
        setProductsMap(map);
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

  const handleAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        let fullAddress = data.roadAddress;
        let extraAddress = '';

        if (data.addressType === 'R') {
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraAddress += data.bname;
          }
          if (data.buildingName !== '') {
            extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
        }

        setAddress(prev => ({
          ...prev,
          zipCode: data.zonecode,
          address: fullAddress,
          detail: '',
        }));
      },
    }).open();
  };

  const getTierPrice = (item: CartItem) => {
    const product = productsMap[item.productId];
    if (!product) return 0;
    const salesUnit = product.salesUnit || 1;

    if (item.optionId) {
      const option = product.options?.find(opt => opt.id === item.optionId);
      if (option) {
        const discountRate = option.discountRate / 100;
        return (product.price * (1 - discountRate)) / salesUnit;
      }
    }

    const tier = [...product.tierPricing]
      .reverse()
      .find(t => item.quantity >= t.quantity);

    const basePrice = tier?.unitPrice || product.price;
    return basePrice / salesUnit;
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
        totalAmount: calculateTotal(),
        paymentMethod: paymentMethod,
        deliveryAddress: fullAddress,
        billingKeyId: selectedCard?.id,
        billingKey: selectedCard?.billingKey,
        subscriptionCycle: hasSubscriptionItems ? subscriptionCycle : undefined
      });

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

          {/* Delivery Address */}
          <div className="bg-white border border-neutral-200 p-8 shadow-sm">
            <h2 className="text-xl tracking-tight text-neutral-900 mb-6 flex items-center gap-2 font-bold">
              <MapPin className="w-5 h-5" />
              배송지 정보
            </h2>
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

          {/* User Order Items */}
          <div className="bg-white border border-neutral-200 p-8 shadow-sm">
            <h2 className="text-xl tracking-tight text-neutral-900 mb-6 font-bold">주문 상품 정보</h2>
            <div className="divide-y divide-neutral-100">
              {cart.map(item => {
                const product = productsMap[item.productId];
                if (!product) return null;

                const unitPrice = getTierPrice(item);
                const subDiscount = (product?.subscriptionDiscount || 0) / 100;
                const itemTotal = unitPrice * item.quantity * (item.isSubscription ? (1 - subDiscount) : 1);

                return (
                  <div key={item.productId} className="flex gap-6 py-6 first:pt-0 last:pb-0">
                    <div className="w-24 h-24 bg-neutral-50 border border-neutral-100 overflow-hidden flex-shrink-0">
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="text-[10px] text-neutral-400 mb-0.5 tracking-wider font-bold">{product.sku}</p>
                          <h3 className="text-sm font-bold tracking-tight text-neutral-900">{product.name}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-neutral-900">₩{itemTotal.toLocaleString()}</p>
                          <p className="text-[10px] text-neutral-500 font-medium">{item.quantity}개 / ₩{unitPrice.toLocaleString()}</p>
                        </div>
                      </div>

                      {item.isSubscription && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-[10px] font-bold uppercase tracking-tight">Recurring Order (-{product.subscriptionDiscount}%)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-neutral-200 p-8 sticky top-24 shadow-md">
            <h2 className="text-xl tracking-tight text-neutral-900 mb-6 font-bold">결제 정보 요약</h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm text-neutral-500 font-medium">
                <span>총 상품 금액</span>
                <span>₩{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-500 font-medium">
                <span>배송비</span>
                <span className="text-green-600 font-bold uppercase text-[10px] tracking-tight border border-green-200 px-1.5 py-0.5 bg-green-50">Free Shipping</span>
              </div>
              <div className="pt-6 border-t border-neutral-100">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-tighter">Total Amount</span>
                  <span className="text-3xl font-black tracking-tight text-neutral-900 leading-none">
                    ₩{total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleOrder}
              disabled={placingOrder}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-5 font-bold transition-all text-sm tracking-widest uppercase mb-4 disabled:opacity-50 shadow-lg"
            >
              {placingOrder ? 'Processing...' : (paymentMethod === 'credit' ? `₩${total.toLocaleString()} 카드 결제하기` : '가상계좌 주문 완료')}
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
    </div>
  );
}