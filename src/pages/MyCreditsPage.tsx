import React, { useState, useEffect } from 'react';
import { Coins, ChevronDown, History, Loader2 } from 'lucide-react';
import { creditService, UserCredit, CreditSummary, CreditTransaction } from '../services/creditService';
import { storage } from '../lib/storage';

export function MyCreditsPage() {
  const user = storage.getUser();

  const [credits, setCredits] = useState<UserCredit[]>([]);
  const [summary, setSummary] = useState<CreditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Record<string, CreditTransaction[]>>({});
  const [txLoading, setTxLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      creditService.getCreditsByUser(user.id),
      creditService.getCreditSummary(user.id),
    ]).then(([list, sum]) => {
      setCredits(list);
      setSummary(sum);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleToggle = async (creditId: string) => {
    if (expandedId === creditId) { setExpandedId(null); return; }
    setExpandedId(creditId);
    if (!transactions[creditId]) {
      setTxLoading(prev => ({ ...prev, [creditId]: true }));
      const txs = await creditService.getCreditTransactions(creditId).catch(() => []);
      setTransactions(prev => ({ ...prev, [creditId]: txs }));
      setTxLoading(prev => ({ ...prev, [creditId]: false }));
    }
  };

  const totalRemaining = summary.reduce((s, c) => s + c.remaining, 0);

  const getStatusStyle = (credit: UserCredit) => {
    const expired = credit.status === 'expired' || new Date(credit.expiryDate) < new Date();
    if (expired || credit.status === 'expired') return { bg: '#fee2e2', color: '#b91c1c', label: '만료' };
    if (credit.status === 'exhausted') return { bg: '#f3f4f6', color: '#6b7280', label: '소진' };
    return { bg: '#dcfce7', color: '#15803d', label: '활성' };
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Coins className="w-6 h-6" style={{ color: '#F59E0B' }} />
        <h2 className="text-xl font-bold text-neutral-900">마이 크레딧</h2>
      </div>

      {/* 요약 카드들 */}
      {summary.length > 0 ? (
        <div className={`grid gap-4 ${summary.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {summary.map(s => (
            <div key={s.equipmentType} className="bg-white border border-neutral-200 rounded p-5">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">{s.equipmentType}</div>
              <div className="text-3xl font-black text-neutral-900 mb-1">
                {s.remaining.toLocaleString()}
                <span className="text-base font-normal text-neutral-400 ml-1">원</span>
              </div>
              <div className="text-xs text-neutral-400">
                총 발급 {s.totalAmount.toLocaleString()}원 · 사용 {s.usedAmount.toLocaleString()}원
              </div>
            </div>
          ))}
          {/* 전체 합산 */}
          {summary.length > 1 && (
            <div className="col-span-2 bg-neutral-900 text-white rounded p-5 flex items-center justify-between">
              <span className="text-sm font-bold">전체 크레딧 잔액</span>
              <span className="text-2xl font-black">{totalRemaining.toLocaleString()}원</span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded p-8 text-center">
          <Coins className="w-10 h-10 mx-auto mb-3" style={{ color: '#d1d5db' }} />
          <p className="text-neutral-500 text-sm">보유 중인 크레딧이 없습니다.</p>
        </div>
      )}

      {/* 발급 내역 */}
      {credits.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-3">크레딧 발급 내역</h3>
          <div className="bg-white border border-neutral-200 rounded overflow-hidden">
            {credits.map((credit, idx) => {
              const status = getStatusStyle(credit);
              const isExpanded = expandedId === credit.id;
              const txs = transactions[credit.id];
              const isLoadingTx = txLoading[credit.id];

              return (
                <React.Fragment key={credit.id}>
                  <div
                    className={`px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-neutral-50 transition-colors ${idx > 0 ? 'border-t border-neutral-100' : ''}`}
                    onClick={() => handleToggle(credit.id)}
                  >
                    {/* 장비 배지 */}
                    <div style={{
                      padding: '3px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 700,
                      backgroundColor: credit.equipmentType === 'Density' ? '#f3e8ff' : '#dbeafe',
                      color: credit.equipmentType === 'Density' ? '#7e22ce' : '#1d4ed8',
                      whiteSpace: 'nowrap',
                    }}>
                      {credit.equipmentType}
                    </div>

                    {/* 금액 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-neutral-900">{credit.remaining.toLocaleString()}원 잔액</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
                          backgroundColor: status.bg, color: status.color,
                        }}>{status.label}</span>
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        발급: {credit.amount.toLocaleString()}원 · 유효기간: {credit.expiryDate}
                        {credit.memo && ` · ${credit.memo}`}
                      </div>
                    </div>

                    {/* 이력 토글 */}
                    <div className="flex items-center gap-1 text-neutral-400">
                      <History className="w-4 h-4" />
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* 사용 이력 패널 */}
                  {isExpanded && (
                    <div className="bg-neutral-50 border-t border-neutral-100 px-5 py-4">
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">사용 이력</p>
                      {isLoadingTx ? (
                        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
                      ) : !txs || txs.length === 0 ? (
                        <p className="text-xs text-neutral-400">이력이 없습니다.</p>
                      ) : (
                        <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#9ca3af' }}>
                              <th style={{ textAlign: 'left', paddingBottom: '6px', paddingRight: '16px', width: '140px' }}>일시</th>
                              <th style={{ textAlign: 'left', paddingBottom: '6px', paddingRight: '16px', width: '50px' }}>유형</th>
                              <th style={{ textAlign: 'right', paddingBottom: '6px', paddingRight: '20px', width: '100px' }}>금액</th>
                              <th style={{ textAlign: 'left', paddingBottom: '6px', paddingLeft: '8px' }}>메모</th>
                            </tr>
                          </thead>
                          <tbody>
                            {txs.map(tx => (
                              <tr key={tx.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '7px 16px 7px 0', color: '#6b7280', whiteSpace: 'nowrap' }}>
                                  {new Date(tx.createdAt).toLocaleDateString('ko-KR')} {new Date(tx.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td style={{ padding: '7px 16px 7px 0' }}>
                                  <span style={{
                                    display: 'inline-flex', padding: '2px 6px', borderRadius: '4px',
                                    fontSize: '11px', fontWeight: 700,
                                    backgroundColor: tx.type === 'issue' ? '#dcfce7' : tx.type === 'use' ? '#dbeafe' : tx.type === 'expire' ? '#fee2e2' : '#fef9c3',
                                    color: tx.type === 'issue' ? '#15803d' : tx.type === 'use' ? '#1d4ed8' : tx.type === 'expire' ? '#b91c1c' : '#a16207',
                                  }}>
                                    {tx.type === 'issue' ? '발급' : tx.type === 'use' ? '사용' : tx.type === 'expire' ? '만료' : '환급'}
                                  </span>
                                </td>
                                <td style={{ padding: '7px 20px 7px 0', textAlign: 'right', fontWeight: 600 }}>{tx.amount.toLocaleString()}원</td>
                                <td style={{ padding: '7px 0 7px 8px', color: '#6b7280' }}>{tx.description || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
