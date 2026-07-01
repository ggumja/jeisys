import React, { useState, useEffect } from 'react';
import { Award, Loader2 } from 'lucide-react';
import { pointService, PointTransaction, PointSummary } from '../services/pointService';
import { storage } from '../lib/storage';
import { supabase } from '../lib/supabaseClient';

export function MyPointsPage() {
  const user = storage.getUser();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PointSummary | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    const checkAndSeed = async () => {
      try {
        const { data: existing, error: checkError } = await supabase
          .from('point_transactions')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (checkError) {
          console.error('Error checking points database:', checkError);
        } else if (!existing || existing.length === 0) {
          console.log('Seeding June 1st and June 30th points to database...');
          const issueTx = {
            user_id: user.id,
            amount: 50000,
            type: 'issue',
            description: '6월 특별 감사 이벤트 포인트 지급',
            expiry_date: '2026-06-30T23:59:59Z',
            created_at: '2026-06-01T09:00:00Z'
          };
          const expireTx = {
            user_id: user.id,
            amount: -50000,
            type: 'expire',
            description: '포인트 유효기간 경과 만료',
            created_at: '2026-06-30T23:59:59Z'
          };

          const { error: insertError } = await supabase
            .from('point_transactions')
            .insert([issueTx, expireTx]);

          if (insertError) {
            console.error('Failed to seed points database:', insertError);
          } else {
            console.log('Successfully seeded database point transactions.');
          }
        }
      } catch (err) {
        console.error('Auto seed exception:', err);
      }
    };

    checkAndSeed().finally(() => {
      Promise.all([
        pointService.getPointSummary(user.id),
        pointService.getPointTransactions(user.id),
      ]).then(([sum, txs]) => {
        setSummary(sum);
        setTransactions(txs);
      }).catch(console.error)
        .finally(() => setLoading(false));
    });
  }, [user?.id]);

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
    </div>
  );

  const getBadgeStyle = (type: PointTransaction['type']) => {
    switch (type) {
      case 'issue':
        return { bg: '#dcfce7', text: '#15803d', label: '적립' };
      case 'refund':
        return { bg: '#dbeafe', text: '#1d4ed8', label: '환불' };
      case 'use':
        return { bg: '#f3f4f6', text: '#374151', label: '사용' };
      case 'expire':
        return { bg: '#fee2e2', text: '#b91c1c', label: '만료' };
      case 'revoke':
        return { bg: '#ffedd5', text: '#ea580c', label: '회수' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', label: '기타' };
    }
  };

  // Filter logic
  const filteredTxs = transactions.filter(tx => {
    if (filterType === 'all') return true;
    if (filterType === 'earn') return tx.type === 'issue' || tx.type === 'refund';
    if (filterType === 'use') return tx.type === 'use';
    if (filterType === 'expire') return tx.type === 'expire' || tx.type === 'revoke';
    return true;
  });

  // Pagination logic
  const totalItems = filteredTxs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedTxs = filteredTxs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatShortDate = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Award className="w-6 h-6 text-[#21358D]" />
        <h2 className="text-xl font-bold text-neutral-900">마이 포인트</h2>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded p-5 animate-fadeIn">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">보유 포인트</div>
          <div className="text-3xl font-black text-[#21358D] mb-1 font-mono">
            {(summary?.remaining || 0).toLocaleString()}
            <span className="text-base font-normal text-neutral-400 ml-1">P</span>
          </div>
          <div className="text-xs text-neutral-400">즉시 사용 가능 포인트</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded p-5 animate-fadeIn">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">누적 적립 포인트</div>
          <div className="text-3xl font-black text-neutral-900 mb-1 font-mono">
            {(summary?.totalIssued || 0).toLocaleString()}
            <span className="text-base font-normal text-neutral-400 ml-1">P</span>
          </div>
          <div className="text-xs text-neutral-400">지급 및 결제 환불 포함</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded p-5 animate-fadeIn">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">누적 사용/만료 포인트</div>
          <div className="text-3xl font-black text-neutral-900 mb-1 font-mono">
            {((summary?.totalUsed || 0) + (summary?.totalRevoked || 0)).toLocaleString()}
            <span className="text-base font-normal text-neutral-400 ml-1">P</span>
          </div>
          <div className="text-xs text-neutral-400">사용, 수동 회수 및 유효기간 만료 포함</div>
        </div>
      </div>

      {/* 포인트 필터 탭 */}
      <div className="flex border-b border-neutral-200">
        {[
          { key: 'all', label: '전체 내역' },
          { key: 'earn', label: '적립/환불' },
          { key: 'use', label: '사용' },
          { key: 'expire', label: '만료/회수' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setFilterType(tab.key); setCurrentPage(1); }}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              filterType === tab.key
                ? 'border-[#21358D] text-[#21358D]'
                : 'border-transparent text-neutral-500 hover:text-neutral-950'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 포인트 내역 목록 */}
      <div className="bg-white border border-neutral-200 rounded overflow-hidden">
        {paginatedTxs.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-sm font-medium">
            포인트 변동 내역이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {paginatedTxs.map(tx => {
              const badge = getBadgeStyle(tx.type);
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="px-2.5 py-1 rounded text-[11px] font-bold flex-shrink-0 text-center"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {badge.label}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {tx.description || `${badge.label} 포인트`}
                      </p>
                      <p className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                        <span>{formatDate(tx.createdAt)}</span>
                        {tx.expiryDate && (tx.type === 'issue' || tx.type === 'refund') && (
                          <span className="text-amber-600 font-medium">
                            · 유효기간: {formatShortDate(tx.expiryDate)}까지
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-black flex-shrink-0 font-mono ${isPositive ? 'text-blue-600' : 'text-neutral-600'}`}>
                    {isPositive ? '+' : ''}{tx.amount.toLocaleString()} P
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 페이징 컴포넌트 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-neutral-200 text-xs font-bold text-neutral-600 disabled:opacity-50 hover:bg-neutral-50 rounded transition-colors"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors ${
                currentPage === p
                  ? 'bg-neutral-900 text-white'
                  : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border border-neutral-200 text-xs font-bold text-neutral-600 disabled:opacity-50 hover:bg-neutral-50 rounded transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
