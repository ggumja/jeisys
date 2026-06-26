import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Loader2, RefreshCw, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

interface CreditTransaction {
  id: string;
  credit_id: string;
  user_id: string;
  amount: number;
  type: 'issue' | 'use' | 'expire' | 'refund' | 'revoke';
  order_id: string | null;
  description: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    hospital_name: string;
    email: string;
    login_id: string;
  } | null;
  order: {
    id: string;
    order_number: string;
  } | null;
  credit: {
    equipment_type: 'Density' | 'LinearZ';
  } | null;
}

export function CreditHistoryPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePresetDate = (days: number) => {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() - days);

    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    setEndDate(formatDate(today));
    setStartDate(formatDate(targetDate));
    setCurrentPage(1);
  };

  const fetchTransactions = async (page: number, size: number, search: string, type: string, equipment: string, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const result = await adminService.getAllCreditTransactions(page, size, search, type, startDate, endDate, equipment);
      setTransactions(result.data as CreditTransaction[]);
      setTotalCount(result.total);
    } catch (error) {
      console.error('크레딧 이력 조회 실패:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage, pageSize, searchTerm, typeFilter, equipmentFilter);
  }, [currentPage, pageSize, typeFilter, equipmentFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTransactions(1, pageSize, searchTerm, typeFilter, equipmentFilter);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactions(currentPage, pageSize, searchTerm, typeFilter, equipmentFilter, true);
    setIsRefreshing(false);
  };

  const handleExcelDownload = async () => {
    setIsDownloading(true);
    try {
      // 0은 전체 데이터 조회를 뜻함
      const result = await adminService.getAllCreditTransactions(0, 0, searchTerm, typeFilter, startDate, endDate, equipmentFilter);
      const allData = result.data as CreditTransaction[];
      
      const headers = ['일시', '아이디', '회원명', '병원명', '구분', '크레딧 종류', '변동 크레딧(원)', '상세내용', '관련 주문번호'];
      const body = allData.map(tx => {
        const typeLabels: Record<string, string> = {
          issue: '발급/충전',
          use: '사용/차감',
          refund: '취소환불',
          revoke: '관리자회수',
          expire: '기간만료'
        };
        const date = new Date(tx.created_at);
        const dateStr = date.toLocaleString('ko-KR');
        const sign = ['issue', 'refund'].includes(tx.type) ? '+' : '-';
        
        // ORD-... 형태의 주문번호 패턴 제거
        const cleanedDesc = tx.description ? tx.description.replace(/\s*\(ORD-[^)]+\)/g, '') : '-';
        const displayOrderNo = tx.order?.order_number || tx.order_id || '-';

        return [
          dateStr,
          tx.user?.login_id || '-',
          tx.user?.name || '-',
          tx.user?.hospital_name || '-',
          typeLabels[tx.type] || tx.type,
          tx.credit?.equipment_type || '-',
          `${sign}${tx.amount.toLocaleString()}`,
          cleanedDesc,
          displayOrderNo
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
      ws['!cols'] = [{ wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 30 }, { wch: 36 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '크레딧 거래 이력');
      
      const now = new Date();
      const dateSuffix = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
      XLSX.writeFile(wb, `전체크레딧이력_${dateSuffix}.xlsx`);
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const getTypeBadge = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'issue':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">발급/충전</Badge>;
      case 'use':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">사용/차감</Badge>;
      case 'refund':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">취소환불</Badge>;
      case 'revoke':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">관리자회수</Badge>;
      case 'expire':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">기간만료</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getAmountDisplay = (tx: CreditTransaction) => {
    const isPlus = ['issue', 'refund'].includes(tx.type);
    return (
      <span className={`font-semibold ${isPlus ? 'text-blue-600' : 'text-red-600'}`}>
        {isPlus ? '+' : '-'}₩{tx.amount.toLocaleString()}
      </span>
    );
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageBlock = 5;
  const blockStart = Math.floor((currentPage - 1) / pageBlock) * pageBlock + 1;
  const blockEnd = Math.min(blockStart + pageBlock - 1, totalPages);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">크레딧 이력 관리</h2>
          <p className="text-sm text-neutral-600">회원들의 크레딧 충전, 사용, 환불 및 만료 이력을 통합하여 추적합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />새로고침
          </Button>
          <Button variant="outline" onClick={handleExcelDownload} disabled={isDownloading || transactions.length === 0} className="flex items-center gap-2">
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>엑셀 다운로드</span>
          </Button>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white border border-neutral-200 p-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="이름, 병원명, 이메일, 아이디 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full h-11 px-4 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="all">전체 거래유형</option>
              <option value="issue">발급/충전</option>
              <option value="use">사용/차감</option>
              <option value="refund">취소환불</option>
              <option value="revoke">관리자회수</option>
              <option value="expire">기간만료</option>
            </select>

            <select
              value={equipmentFilter}
              onChange={(e) => { setEquipmentFilter(e.target.value); setCurrentPage(1); }}
              className="w-full h-11 px-4 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="all">전체 장비</option>
              <option value="Density">Density</option>
              <option value="POTENZA">POTENZA</option>
              <option value="LinearZ">LINEARZ</option>
            </select>

            <Button type="submit" className="w-full h-11 bg-neutral-900 text-white hover:bg-neutral-800">
              검색하기
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-700">
            <span className="font-medium mr-2">기간 조회</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
            <span className="text-neutral-400">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
            <div className="flex gap-1 ml-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetDate(0)}
                className="h-8 text-xs px-2.5"
              >
                오늘
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetDate(7)}
                className="h-8 text-xs px-2.5"
              >
                1주일
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetDate(30)}
                className="h-8 text-xs px-2.5"
              >
                1개월
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setStartDate(''); setEndDate(''); setCurrentPage(1); }}
                className="h-8 text-xs px-2.5 text-neutral-500 hover:text-neutral-900"
              >
                초기화
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* 테이블 영역 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="py-4 px-6 font-semibold text-neutral-700 w-16 text-center">No.</th>
                <th className="py-4 px-6 font-semibold text-neutral-700">일시</th>
                <th className="py-4 px-6 font-semibold text-neutral-700">회원 정보</th>
                <th className="py-4 px-6 font-semibold text-neutral-700">구분</th>
                <th className="py-4 px-6 font-semibold text-neutral-700">크레딧 종류</th>
                <th className="py-4 px-6 font-semibold text-neutral-700 text-right">변동 크레딧</th>
                <th className="py-4 px-6 font-semibold text-neutral-700">내용/메모</th>
                <th className="py-4 px-6 font-semibold text-neutral-700">관련 주문</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#21358D] mx-auto" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-neutral-400">
                    등록된 크레딧 거래 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                transactions.map((tx, idx) => {
                  const rowNo = (currentPage - 1) * pageSize + idx + 1;
                  const date = new Date(tx.created_at);
                  const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}`;
                  
                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-4 px-6 text-center text-neutral-400 font-mono">{rowNo}</td>
                      <td className="py-4 px-6 text-neutral-600 whitespace-nowrap">{dateStr}</td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-neutral-900">{tx.user?.hospital_name || '-'}</div>
                        <div className="text-xs text-neutral-500">{tx.user?.name} ({tx.user?.login_id})</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">{getTypeBadge(tx.type)}</td>
                      <td className="py-4 px-6 font-medium text-neutral-800 whitespace-nowrap">
                        {tx.credit?.equipment_type || '-'}
                      </td>
                      <td className="py-4 px-6 text-right font-medium">{getAmountDisplay(tx)}</td>
                      <td className="py-4 px-6 text-neutral-700 max-w-xs truncate" title={tx.description || ''}>
                        {tx.description ? tx.description.replace(/\s*\(ORD-[^)]+\)/g, '') : '-'}
                      </td>
                      <td className="py-4 px-6 text-neutral-500 font-mono text-xs">
                        {tx.order_id ? (
                          <button
                            onClick={() => navigate(`/admin/orders/${tx.order_id}`)}
                            className="text-[#21358D] hover:underline"
                          >
                            {tx.order?.order_number || tx.order_id}
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {!isLoading && transactions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <span>페이지당</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-neutral-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                {[10, 20, 50, 100].map(n => (
                  <option key={n} value={n}>{n}개</option>
                ))}
              </select>
              <span>/ 전체 {totalCount}건</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                이전
              </button>
              {Array.from({ length: blockEnd - blockStart + 1 }, (_, i) => blockStart + i).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 text-sm border ${
                    page === currentPage
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
