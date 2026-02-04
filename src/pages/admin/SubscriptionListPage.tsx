import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Filter, Eye, RefreshCw, Calendar, Play, Pause, XCircle, Edit2 } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

interface Subscription {
  id: string;
  orderNumber: string;
  customerName: string;
  hospitalName: string;
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
}

const mockSubscriptions: Subscription[] = [
  {
    id: 'SUB-1',
    orderNumber: 'SUB-2026-0001',
    customerName: '김민종 원장',
    hospitalName: '서울피부과의원',
    productName: 'POTENZA 니들 팁 16핀',
    category: 'POTENZA',
    quantity: 2,
    totalAmount: 500000,
    subscriptionCycle: '1개월',
    nextDeliveryDate: '2026-03-15',
    subscriptionStatus: 'active',
    subscriptionStartDate: '2026-01-15',
    deliveryCount: 2,
    autoPaymentMethod: '신용카드 자동결제',
    lastDeliveryDate: '2026-02-15',
  },
  {
    id: 'SUB-2',
    orderNumber: 'SUB-2026-0002',
    customerName: '이수진 원장',
    hospitalName: '강남클리닉',
    productName: 'Density HIGH 스킨부스터',
    category: 'Density',
    quantity: 1,
    totalAmount: 450000,
    subscriptionCycle: '2주',
    nextDeliveryDate: '2026-02-17',
    subscriptionStatus: 'active',
    subscriptionStartDate: '2026-01-20',
    deliveryCount: 3,
    autoPaymentMethod: '신용카드 자동결제',
    lastDeliveryDate: '2026-02-03',
  },
  {
    id: 'SUB-3',
    orderNumber: 'SUB-2026-0003',
    customerName: '박지훈 원장',
    hospitalName: '부산성형외과',
    productName: 'LinearZ 앰플 세트',
    category: 'LinearZ',
    quantity: 2,
    totalAmount: 800000,
    subscriptionCycle: '3개월',
    nextDeliveryDate: '2026-03-01',
    subscriptionStatus: 'paused',
    subscriptionStartDate: '2025-12-01',
    deliveryCount: 1,
    autoPaymentMethod: '신용카드 자동결제',
    lastDeliveryDate: '2025-12-01',
  },
  {
    id: 'SUB-4',
    orderNumber: 'SUB-2026-0004',
    customerName: '정우성 원장',
    hospitalName: '강남더마클리닉',
    productName: 'ULTRAcel II 카트리지 3.0mm',
    category: 'ULTRAcel II',
    quantity: 2,
    totalAmount: 600000,
    subscriptionCycle: '1개월',
    nextDeliveryDate: '2026-03-10',
    subscriptionStatus: 'active',
    subscriptionStartDate: '2026-01-10',
    deliveryCount: 2,
    autoPaymentMethod: '신용카드 자동결제',
    lastDeliveryDate: '2026-02-10',
  },
  {
    id: 'SUB-5',
    orderNumber: 'SUB-2026-0005',
    customerName: '조인성 원장',
    hospitalName: '압구정피부과',
    productName: 'DLiv 리프팅 앰플',
    category: 'DLiv',
    quantity: 3,
    totalAmount: 720000,
    subscriptionCycle: '1개월',
    nextDeliveryDate: '2026-03-03',
    subscriptionStatus: 'active',
    subscriptionStartDate: '2026-01-03',
    deliveryCount: 2,
    autoPaymentMethod: '신용카드 자동결제',
    lastDeliveryDate: '2026-02-03',
  },
  {
    id: 'SUB-6',
    orderNumber: 'SUB-2026-0006',
    customerName: '송혜교 원장',
    hospitalName: '강남프리미엄클리닉',
    productName: 'POTENZA 니들 팁 25핀',
    category: 'POTENZA',
    quantity: 2,
    totalAmount: 1200000,
    subscriptionCycle: '2주',
    nextDeliveryDate: '2026-02-15',
    subscriptionStatus: 'active',
    subscriptionStartDate: '2026-01-18',
    deliveryCount: 2,
    autoPaymentMethod: '신용카드 자동결제',
    lastDeliveryDate: '2026-02-01',
  },
  {
    id: 'SUB-7',
    orderNumber: 'SUB-2025-0020',
    customerName: '한지민 원장',
    hospitalName: '청담스킨클리닉',
    productName: 'INTRAcel 니들 카트리지',
    category: 'INTRAcel',
    quantity: 2,
    totalAmount: 490000,
    subscriptionCycle: '1개월',
    nextDeliveryDate: '-',
    subscriptionStatus: 'cancelled',
    subscriptionStartDate: '2025-06-15',
    deliveryCount: 8,
    autoPaymentMethod: '신용카드 자동결제',
    lastDeliveryDate: '2026-01-15',
  },
];

export function SubscriptionListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

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

  const filteredSubscriptions = mockSubscriptions.filter((sub) => {
    const matchesSearch =
      sub.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.subscriptionStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeSubscriptions = mockSubscriptions.filter(s => s.subscriptionStatus === 'active');
  const pausedSubscriptions = mockSubscriptions.filter(s => s.subscriptionStatus === 'paused');
  const cancelledSubscriptions = mockSubscriptions.filter(s => s.subscriptionStatus === 'cancelled');

  const totalMonthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
    // 매월 결제 금액 계산
    const cycle = sub.subscriptionCycle;
    
    // 주별 계산 (1주, 2주, 3주, 4주)
    if (cycle.includes('주')) {
      const weeks = parseInt(cycle);
      return sum + (sub.totalAmount * (4 / weeks)); // 한달 = 4주 기준
    }
    
    // 월별 계산 (1개월, 2개월, 3개월, 6개월, 12개월)
    if (cycle.includes('개월')) {
      const months = parseInt(cycle);
      return sum + (sub.totalAmount / months);
    }
    
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
          정기��송목록
        </h2>
        <p className="text-sm text-neutral-600">
          전체 정기배송 구독 현황을 조회하고 관리합니다
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">예상 월 매출</div>
          <div className="text-2xl font-medium text-purple-600">
            {Math.round(totalMonthlyRevenue / 10000)}만
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-neutral-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="주문번호, 고객명, 병원명, 상품명 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="all">전체 상태</option>
              <option value="active">진행중</option>
              <option value="paused">일시정지</option>
              <option value="cancelled">취소됨</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscription List */}
      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[140px]">
                  주문번호
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[140px]">
                  고객정
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[180px]">
                  상품정보
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[100px]">
                  배송주기
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[120px]">
                  다음배송일
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[80px]">
                  배송횟수
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[100px]">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[140px]">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <RefreshCw className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-600">
                      {searchTerm || statusFilter !== 'all' 
                        ? '검색 결과가 없습니다' 
                        : '등록된 정기배송이 없습니다'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        {sub.orderNumber}
                      </div>
                      <div className="text-xs text-neutral-500">
                        시작일: {sub.subscriptionStartDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">{sub.customerName}</div>
                      <div className="text-xs text-neutral-500">{sub.hospitalName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900 max-w-[200px]">{sub.productName}</div>
                      <div className="text-xs text-neutral-500">
                        {sub.quantity}개 · {sub.totalAmount.toLocaleString()}원
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-neutral-900">
                        <RefreshCw className="w-4 h-4 text-neutral-500" />
                        {sub.subscriptionCycle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-neutral-700">
                        <Calendar className="w-4 h-4 text-neutral-500" />
                        {sub.nextDeliveryDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {sub.deliveryCount}회
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(sub.subscriptionStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigate(`/admin/orders/${sub.id}`);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>상세</span>
                        </button>
                        {sub.subscriptionStatus === 'active' && (
                          <button
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-xs"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>수정</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Deliveries */}
      <div className="bg-white border border-neutral-200 p-6">
        <h4 className="text-sm font-medium text-neutral-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          이번 주 배송 예정 ({activeSubscriptions.filter(s => {
            const nextDate = new Date(s.nextDeliveryDate);
            const today = new Date('2026-02-03');
            const weekLater = new Date(today);
            weekLater.setDate(weekLater.getDate() + 7);
            return nextDate >= today && nextDate <= weekLater;
          }).length}건)
        </h4>
        <div className="space-y-2">
          {activeSubscriptions
            .filter(s => {
              const nextDate = new Date(s.nextDeliveryDate);
              const today = new Date('2026-02-03');
              const weekLater = new Date(today);
              weekLater.setDate(weekLater.getDate() + 7);
              return nextDate >= today && nextDate <= weekLater;
            })
            .sort((a, b) => new Date(a.nextDeliveryDate).getTime() - new Date(b.nextDeliveryDate).getTime())
            .map((sub) => (
              <div 
                key={sub.id} 
                className="flex items-center justify-between text-sm py-3 px-4 border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-xs font-medium text-neutral-500 w-20">
                    {sub.nextDeliveryDate}
                  </div>
                  <div>
                    <span className="text-neutral-900 font-medium">{sub.hospitalName}</span>
                    <span className="text-neutral-500 mx-2">·</span>
                    <span className="text-neutral-700">{sub.productName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-neutral-600">{sub.quantity}개</span>
                  <span className="font-medium text-neutral-900 w-24 text-right">
                    {sub.totalAmount.toLocaleString()}원
                  </span>
                </div>
              </div>
            ))}
          {activeSubscriptions.filter(s => {
            const nextDate = new Date(s.nextDeliveryDate);
            const today = new Date('2026-02-03');
            const weekLater = new Date(today);
            weekLater.setDate(weekLater.getDate() + 7);
            return nextDate >= today && nextDate <= weekLater;
          }).length === 0 && (
            <p className="text-sm text-neutral-500 text-center py-4">
              이번 주 배송 예정인 정기배송이 없습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}