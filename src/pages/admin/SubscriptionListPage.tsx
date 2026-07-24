import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, Filter, RefreshCw, Play, Pause, XCircle, CheckCircle,
  Loader2, AlertTriangle, ChevronDown, ChevronUp, Package,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useModal } from '../../context/ModalContext';
import {
  subscriptionService,
  SubscriptionRow,
  CancellationRequest,
} from '../../services/subscriptionService';

// ─────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────

function getStatusBadge(status: SubscriptionRow['status']) {
  switch (status) {
    case 'active':
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200"><Play className="w-3 h-3 mr-1" />진행중</Badge>;
    case 'paused':
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200"><Pause className="w-3 h-3 mr-1" />일시정지</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />해지</Badge>;
    case 'expired':
      return <Badge variant="outline" className="bg-neutral-200 text-neutral-600">만료</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" />정기구독완료</Badge>;
  }
}

function formatDate(s?: string) {
  if (!s) return '-';
  return s.split('T')[0].replace(/-/g, '.');
}

// ─────────────────────────────────────────
// 구독 행 컴포넌트
// ─────────────────────────────────────────

function SubscriptionRow_({ sub, hasPendingCancel }: { sub: SubscriptionRow; hasPendingCancel?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className="hover:bg-neutral-50 transition-colors cursor-pointer" onClick={() => setOpen(v => !v)}>
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center gap-1">
            {open ? <ChevronUp className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />}
            <span className="font-mono text-xs text-neutral-500">{sub.id.slice(0, 8)}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-neutral-900">{(sub as any).user?.name ?? '-'}</p>
            <p className="text-xs text-neutral-500">{(sub as any).user?.hospitalName ?? ''}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-neutral-700">{sub.product?.name ?? '-'}</td>
        <td className="px-4 py-3 text-sm text-center text-neutral-700">{sub.totalQuantity}개 / {sub.cycleMonths}개월</td>
        <td className="px-4 py-3 text-sm text-center">
          <span className="font-medium text-neutral-900">{sub.currentRound}</span>
          <span className="text-neutral-400"> / {sub.totalRounds}회</span>
        </td>
        <td className="px-4 py-3 text-sm text-right text-neutral-700">{sub.unitPrice.toLocaleString()}원</td>
        <td className="px-4 py-3 text-sm text-center text-neutral-600">{formatDate(sub.nextBillingDate)}</td>
        <td className="px-4 py-3 text-center">
          {hasPendingCancel ? (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
              <AlertTriangle className="w-3 h-3 mr-1" />처리대기
            </Badge>
          ) : (
            getStatusBadge(sub.status)
          )}
        </td>
      </tr>

      {/* 회차 상세 */}
      {open && sub.shipments && sub.shipments.length > 0 && (
        <tr>
          <td colSpan={8} className="px-6 py-3 bg-neutral-50 border-t border-neutral-100">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-neutral-500">
                    <th className="py-1 pr-4 text-left font-medium">회차</th>
                    <th className="py-1 pr-4 text-left font-medium">예정일</th>
                    <th className="py-1 pr-4 text-right font-medium">수량</th>
                    <th className="py-1 pr-4 text-right font-medium">금액</th>
                    <th className="py-1 text-center font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sub.shipments].sort((a, b) => a.roundNo - b.roundNo).map(s => (
                    <tr key={s.id} className={s.status === 'cancelled' ? 'opacity-40' : ''}>
                      <td className="py-1 pr-4 text-neutral-700">{s.roundNo}회차</td>
                      <td className="py-1 pr-4 text-neutral-600">{formatDate(s.scheduledDate)}</td>
                      <td className="py-1 pr-4 text-right text-neutral-700">{s.quantity}개</td>
                      <td className="py-1 pr-4 text-right text-neutral-700">{s.amount.toLocaleString()}원</td>
                      <td className="py-1 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          s.status === 'paid' ? 'bg-green-100 text-green-700' :
                          s.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                          s.status === 'cancelled' ? 'bg-neutral-100 text-neutral-400' :
                          'bg-neutral-100 text-neutral-600'
                        }`}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────

export function SubscriptionListPage() {
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [pendingCancelIds, setPendingCancelIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'cancelled' | 'completed' | 'pending_cancel'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ── 로드 ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cancellations] = await Promise.all([
        subscriptionService.getAllSubscriptions(),
        subscriptionService.getCancellationRequests('pending'),
      ]);
      setSubscriptions(data);
      setPendingCancelIds(new Set(cancellations.map((c: CancellationRequest) => c.subscriptionId)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── 필터 ──
  const filtered = subscriptions.filter(s => {
    const matchStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'pending_cancel' ? pendingCancelIds.has(s.id) :
      statusFilter === 'completed' ? (s.status === 'completed' || s.status === 'expired') :
      s.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      (s as any).user?.name?.toLowerCase().includes(term) ||
      (s as any).user?.hospitalName?.toLowerCase().includes(term) ||
      s.product?.name?.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  // ── 집계 ──
  const counts = {
    all: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    paused: subscriptions.filter(s => s.status === 'paused').length,
    completed: subscriptions.filter(s => s.status === 'completed' || s.status === 'expired').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
    pending_cancel: pendingCancelIds.size,
  };

  const pendingCancelCount = pendingCancelIds.size;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-1">정기구독 목록</h2>
          <p className="text-sm text-neutral-500">전체 정기구독 현황을 관리합니다.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/subscriptions/cancellations')}
          className="border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          해지신청 관리
        </Button>
      </div>

      {/* 요약 탭 */}
      <div className="grid grid-cols-6 gap-3">
        {([
          { key: 'all', label: '전체', color: 'text-neutral-900' },
          { key: 'active', label: '진행중', color: 'text-green-600' },
          { key: 'paused', label: '일시정지', color: 'text-orange-500' },
          { key: 'completed', label: '완료', color: 'text-blue-600' },
          { key: 'cancelled', label: '해지', color: 'text-red-500' },
          { key: 'pending_cancel', label: '처리대기', color: 'text-amber-600' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`bg-white border p-4 text-left transition-colors ${
              statusFilter === tab.key ? 'border-neutral-900' : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <p className="text-xs text-neutral-500 mb-1">{tab.label}</p>
            <p className={`text-2xl font-semibold ${tab.color}`}>{counts[tab.key]}</p>
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="bg-white border border-neutral-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="고객명, 병원명, 상품명, 구독ID 검색"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">
              {searchTerm ? '검색 결과가 없습니다' : '정기구독 내역이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">구독ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">고객</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">상품</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">수량/주기</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">진행회차</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">회차금액</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">다음결제일</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map(sub => (
                  <SubscriptionRow_ key={sub.id} sub={sub} hasPendingCancel={pendingCancelIds.has(sub.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 합계 */}
      {!loading && filtered.length > 0 && (
        <div className="text-right text-xs text-neutral-500">
          총 {filtered.length}건 표시 중 (전체 {subscriptions.length}건)
        </div>
      )}
    </div>
  );
}