import { useState } from 'react';
import { RefreshCw, Calendar, Package, Play, Pause, XCircle, Edit2, MapPin, Clock, CreditCard, ChevronRight } from 'lucide-react';
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

interface Subscription {
  id: string;
  orderNumber: string;
  productName: string;
  category: string;
  quantity: number;
  totalAmount: number;
  subscriptionCycle: string;
  nextDeliveryDate: string;
  subscriptionStatus: 'active' | 'paused' | 'cancelled';
  subscriptionStartDate: string;
  deliveryCount: number;
  autoPaymentMethod: string;
  lastDeliveryDate?: string;
  shippingInfo: {
    recipient: string;
    phone: string;
    address: string;
    addressDetail: string;
    zipCode: string;
  };
  deliveryHistory: Array<{
    deliveryDate: string;
    status: string;
    trackingNumber?: string;
  }>;
}

const mockSubscriptions: Subscription[] = [
  {
    id: 'SUB-1',
    orderNumber: 'SUB-2026-0001',
    productName: 'POTENZA 니들 팁 16핀',
    category: 'POTENZA',
    quantity: 2,
    totalAmount: 500000,
    subscriptionCycle: '1개월',
    nextDeliveryDate: '2026-03-15',
    subscriptionStatus: 'active',
    subscriptionStartDate: '2026-01-15',
    deliveryCount: 2,
    autoPaymentMethod: '신용카드 자동결제 (****-****-****-1234)',
    lastDeliveryDate: '2026-02-15',
    shippingInfo: {
      recipient: '김민종 원장',
      phone: '010-1234-5678',
      address: '서울특별시 강남구 논현동 123-456',
      addressDetail: '서울피부과의원 1층',
      zipCode: '06234',
    },
    deliveryHistory: [
      { deliveryDate: '2026-02-15', status: '배송완료', trackingNumber: '123456789012' },
      { deliveryDate: '2026-01-15', status: '배송완료', trackingNumber: '123456789011' },
    ],
  },
  {
    id: 'SUB-2',
    orderNumber: 'SUB-2026-0002',
    productName: 'Density HIGH 스킨부스터',
    category: 'Density',
    quantity: 1,
    totalAmount: 450000,
    subscriptionCycle: '2주',
    nextDeliveryDate: '2026-02-17',
    subscriptionStatus: 'active',
    subscriptionStartDate: '2026-01-20',
    deliveryCount: 3,
    autoPaymentMethod: '신용카드 자동결제 (****-****-****-1234)',
    lastDeliveryDate: '2026-02-03',
    shippingInfo: {
      recipient: '김민종 원장',
      phone: '010-1234-5678',
      address: '서울특별시 강남구 논현동 123-456',
      addressDetail: '서울피부과의원 1층',
      zipCode: '06234',
    },
    deliveryHistory: [
      { deliveryDate: '2026-02-03', status: '배송완료', trackingNumber: '123456789013' },
      { deliveryDate: '2026-01-27', status: '배송완료', trackingNumber: '123456789014' },
      { deliveryDate: '2026-01-20', status: '배송완료', trackingNumber: '123456789015' },
    ],
  },
  {
    id: 'SUB-3',
    orderNumber: 'SUB-2025-0015',
    productName: 'ULTRAcel II 카트리지 3.0mm',
    category: 'ULTRAcel II',
    quantity: 2,
    totalAmount: 600000,
    subscriptionCycle: '3개월',
    nextDeliveryDate: '-',
    subscriptionStatus: 'paused',
    subscriptionStartDate: '2025-08-10',
    deliveryCount: 2,
    autoPaymentMethod: '신용카드 자동결제 (****-****-****-1234)',
    lastDeliveryDate: '2025-11-10',
    shippingInfo: {
      recipient: '김민종 원장',
      phone: '010-1234-5678',
      address: '서울특별시 강남구 논현동 123-456',
      addressDetail: '서울피부과의원 1층',
      zipCode: '06234',
    },
    deliveryHistory: [
      { deliveryDate: '2025-11-10', status: '배송완료', trackingNumber: '123456789016' },
      { deliveryDate: '2025-08-10', status: '배송완료', trackingNumber: '123456789017' },
    ],
  },
];

export function MySubscriptionsPage() {
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const getStatusBadge = (status: 'active' | 'paused' | 'cancelled') => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <Play className="w-3 h-3 mr-1" />
            진행중
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
            <Pause className="w-3 h-3 mr-1" />
            일시정지
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            취소됨
          </Badge>
        );
    }
  };

  const handlePause = () => {
    alert('정기배송이 일시정지되었습니다.');
    setIsPauseDialogOpen(false);
    setIsDetailOpen(false);
  };

  const handleResume = () => {
    alert('정기배송이 재개되었습니다.');
    setIsResumeDialogOpen(false);
    setIsDetailOpen(false);
  };

  const handleCancel = () => {
    alert('정기배송이 취소되었습니다.');
    setIsCancelDialogOpen(false);
    setIsDetailOpen(false);
  };

  const activeSubscriptions = mockSubscriptions.filter(s => s.subscriptionStatus === 'active');
  const pausedSubscriptions = mockSubscriptions.filter(s => s.subscriptionStatus === 'paused');
  const cancelledSubscriptions = mockSubscriptions.filter(s => s.subscriptionStatus === 'cancelled');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
          정기배송 관리
        </h2>
        <p className="text-sm text-neutral-600">
          정기배송 구독을 관리하고 배송 내역을 확인하세요
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 정기배송</div>
          <div className="text-2xl font-medium text-neutral-900">{mockSubscriptions.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">진행중</div>
          <div className="text-2xl font-medium text-green-600 flex items-center gap-2">
            {activeSubscriptions.length}
            <Play className="w-4 h-4" />
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">일시정지</div>
          <div className="text-2xl font-medium text-orange-600 flex items-center gap-2">
            {pausedSubscriptions.length}
            <Pause className="w-4 h-4" />
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">취소됨</div>
          <div className="text-2xl font-medium text-red-600">
            {cancelledSubscriptions.length}
          </div>
        </div>
      </div>

      {/* Active Subscriptions */}
      {activeSubscriptions.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-neutral-900 mb-4">진행중인 정기배송</h3>
          <div className="space-y-4">
            {activeSubscriptions.map((sub) => (
              <div key={sub.id} className="bg-white border border-neutral-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base font-medium text-neutral-900">{sub.productName}</h4>
                      {getStatusBadge(sub.subscriptionStatus)}
                    </div>
                    <p className="text-sm text-neutral-600 mb-1">주문번호: {sub.orderNumber}</p>
                    <p className="text-sm text-neutral-600">
                      {sub.quantity}개 · {sub.totalAmount.toLocaleString()}원
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded">
                    <RefreshCw className="w-5 h-5 text-neutral-500" />
                    <div>
                      <p className="text-xs text-neutral-600 mb-0.5">배송주기</p>
                      <p className="text-sm font-medium text-neutral-900">{sub.subscriptionCycle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded">
                    <Calendar className="w-5 h-5 text-neutral-500" />
                    <div>
                      <p className="text-xs text-neutral-600 mb-0.5">다음 배송일</p>
                      <p className="text-sm font-medium text-neutral-900">{sub.nextDeliveryDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded">
                    <Package className="w-5 h-5 text-neutral-500" />
                    <div>
                      <p className="text-xs text-neutral-600 mb-0.5">배송 횟수</p>
                      <p className="text-sm font-medium text-neutral-900">{sub.deliveryCount}회</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSubscription(sub);
                      setIsDetailOpen(true);
                    }}
                    className="border-neutral-300 text-neutral-900 hover:bg-neutral-50"
                  >
                    <ChevronRight className="w-4 h-4 mr-1" />
                    상세보기
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSubscription(sub);
                      setIsPauseDialogOpen(true);
                    }}
                    className="border-neutral-300 text-neutral-900 hover:bg-neutral-50"
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    일시정지
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-neutral-300 text-neutral-900 hover:bg-neutral-50"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    배송정보 변경
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paused Subscriptions */}
      {pausedSubscriptions.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-neutral-900 mb-4">일시정지된 정기배송</h3>
          <div className="space-y-4">
            {pausedSubscriptions.map((sub) => (
              <div key={sub.id} className="bg-white border border-neutral-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base font-medium text-neutral-900">{sub.productName}</h4>
                      {getStatusBadge(sub.subscriptionStatus)}
                    </div>
                    <p className="text-sm text-neutral-600 mb-1">주문번호: {sub.orderNumber}</p>
                    <p className="text-sm text-neutral-600">
                      {sub.quantity}개 · {sub.totalAmount.toLocaleString()}원
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded">
                    <RefreshCw className="w-5 h-5 text-neutral-500" />
                    <div>
                      <p className="text-xs text-neutral-600 mb-0.5">배송주기</p>
                      <p className="text-sm font-medium text-neutral-900">{sub.subscriptionCycle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded">
                    <Clock className="w-5 h-5 text-neutral-500" />
                    <div>
                      <p className="text-xs text-neutral-600 mb-0.5">마지막 배송일</p>
                      <p className="text-sm font-medium text-neutral-900">{sub.lastDeliveryDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded">
                    <Package className="w-5 h-5 text-neutral-500" />
                    <div>
                      <p className="text-xs text-neutral-600 mb-0.5">배송 횟수</p>
                      <p className="text-sm font-medium text-neutral-900">{sub.deliveryCount}회</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSubscription(sub);
                      setIsResumeDialogOpen(true);
                    }}
                    className="bg-green-600 text-white border-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    재개하기
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSubscription(sub);
                      setIsDetailOpen(true);
                    }}
                    className="border-neutral-300 text-neutral-900 hover:bg-neutral-50"
                  >
                    <ChevronRight className="w-4 h-4 mr-1" />
                    상세보기
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Subscriptions */}
      {cancelledSubscriptions.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-neutral-900 mb-4">취소된 정기배송</h3>
          <div className="space-y-4">
            {cancelledSubscriptions.map((sub) => (
              <div key={sub.id} className="bg-neutral-50 border border-neutral-200 p-6 opacity-75">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base font-medium text-neutral-900">{sub.productName}</h4>
                      {getStatusBadge(sub.subscriptionStatus)}
                    </div>
                    <p className="text-sm text-neutral-600 mb-1">주문번호: {sub.orderNumber}</p>
                    <p className="text-sm text-neutral-600">
                      총 {sub.deliveryCount}회 배송 완료
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {mockSubscriptions.length === 0 && (
        <div className="bg-white border border-neutral-200 p-16 text-center">
          <RefreshCw className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            정기배송 구독이 없습니다
          </h3>
          <p className="text-sm text-neutral-600 mb-6">
            자주 사용하는 소모품을 정기배송으로 편리하게 받아보세요
          </p>
          <Button className="bg-neutral-900 text-white hover:bg-neutral-800">
            상품 둘러보기
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedSubscription && (
            <>
              <DialogHeader>
                <DialogTitle>정기배송 상세정보</DialogTitle>
                <DialogDescription>
                  {selectedSubscription.orderNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Product Info */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-900 mb-3">상품정보</h4>
                  <div className="bg-neutral-50 p-4 rounded">
                    <p className="text-base font-medium text-neutral-900 mb-2">
                      {selectedSubscription.productName}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {selectedSubscription.quantity}개 · {selectedSubscription.totalAmount.toLocaleString()}원
                    </p>
                  </div>
                </div>

                {/* Subscription Info */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-900 mb-3">정기배송 정보</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-neutral-200">
                      <span className="text-neutral-600">배송주기</span>
                      <span className="text-neutral-900 font-medium">{selectedSubscription.subscriptionCycle}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-200">
                      <span className="text-neutral-600">다음 배송일</span>
                      <span className="text-neutral-900 font-medium">{selectedSubscription.nextDeliveryDate}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-200">
                      <span className="text-neutral-600">시작일</span>
                      <span className="text-neutral-900">{selectedSubscription.subscriptionStartDate}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-200">
                      <span className="text-neutral-600">배송 횟수</span>
                      <span className="text-neutral-900">{selectedSubscription.deliveryCount}회</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-200">
                      <span className="text-neutral-600">결제 방법</span>
                      <span className="text-neutral-900">{selectedSubscription.autoPaymentMethod}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-neutral-600">상태</span>
                      <span>{getStatusBadge(selectedSubscription.subscriptionStatus)}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Info */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-900 mb-3">배송지 정보</h4>
                  <div className="bg-neutral-50 p-4 rounded space-y-2 text-sm">
                    <p className="text-neutral-900 font-medium">{selectedSubscription.shippingInfo.recipient}</p>
                    <p className="text-neutral-600">{selectedSubscription.shippingInfo.phone}</p>
                    <p className="text-neutral-600">
                      [{selectedSubscription.shippingInfo.zipCode}] {selectedSubscription.shippingInfo.address}
                    </p>
                    <p className="text-neutral-600">{selectedSubscription.shippingInfo.addressDetail}</p>
                  </div>
                </div>

                {/* Delivery History */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-900 mb-3">배송 내역</h4>
                  <div className="space-y-2">
                    {selectedSubscription.deliveryHistory.map((history, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded text-sm">
                        <div>
                          <p className="text-neutral-900 font-medium mb-1">{history.deliveryDate}</p>
                          {history.trackingNumber && (
                            <p className="text-neutral-600 text-xs">운송장: {history.trackingNumber}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          {history.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedSubscription.subscriptionStatus === 'active' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDetailOpen(false);
                        setIsPauseDialogOpen(true);
                      }}
                      className="border-neutral-300 text-neutral-900"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      일시정지
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDetailOpen(false);
                        setIsCancelDialogOpen(true);
                      }}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      정기배송 취소
                    </Button>
                  </>
                )}
                {selectedSubscription.subscriptionStatus === 'paused' && (
                  <Button
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsResumeDialogOpen(true);
                    }}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    재개하기
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Pause Dialog */}
      <Dialog open={isPauseDialogOpen} onOpenChange={setIsPauseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정기배송 일시정지</DialogTitle>
            <DialogDescription>
              정기배송을 일시정지하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-neutral-600">
              일시정지 시 다음 배송이 진행되지 않으며, 언제든지 재개할 수 있습니다.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPauseDialogOpen(false)}
              className="border-neutral-300"
            >
              취소
            </Button>
            <Button
              onClick={handlePause}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              일시정지
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Dialog */}
      <Dialog open={isResumeDialogOpen} onOpenChange={setIsResumeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정기배송 재개</DialogTitle>
            <DialogDescription>
              정기배송을 재개하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-neutral-600">
              재개 시 설정된 배송���기에 따라 다음 배송이 진행됩니다.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResumeDialogOpen(false)}
              className="border-neutral-300"
            >
              취소
            </Button>
            <Button
              onClick={handleResume}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              재개하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정기배송 취소</DialogTitle>
            <DialogDescription>
              정기배송을 취소하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-red-700 font-medium mb-2">
              ⚠️ 정기배송 취소는 되돌릴 수 없습니다
            </p>
            <p className="text-sm text-neutral-600">
              취소 시 더 이상 정기배송이 진행되지 않으며, 재개할 수 없습니다.
              다시 이용하시려면 새로 신청해야 합니다.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              className="border-neutral-300"
            >
              닫기
            </Button>
            <Button
              onClick={handleCancel}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              정기배송 취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}