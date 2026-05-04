import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Package, Truck, Printer, Loader2, ChevronLeft, ChevronRight, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  hospitalName: string;
  orderDate: string;
  totalAmount: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'partially_shipped' | 'cancel_requested' | 'return_requested' | 'returning' | 'returned' | 'exchange_requested';
  items: number;
  itemsSummary?: string;
  orderItems?: OrderItem[];
  shippingInfo?: ShippingInfo;
  paymentInfo?: PaymentInfo;
  isSubscription?: boolean;
  subscriptionCycle?: string;
  nextDeliveryDate?: string;
  subscriptionStatus?: 'active' | 'paused' | 'cancelled';
  subscriptionStartDate?: string;
  deliveryCount?: number;
  trackingNumber?: string;
  trackingCompany?: string;
  shippedAt?: string;
}

interface OrderItem {
  id: string;
  productName: string;
  category: string;
  quantity: number;
  price: number;
  thumbnail?: string;
}

interface ShippingInfo {
  recipient: string;
  phone: string;
  address: string;
  memo?: string;
}

interface PaymentInfo {
  method: string;
  bankName?: string;
  accountNumber?: string;
  depositor?: string;
  paidAt?: string;
}

// Removed generateLogenTrackingNumber as we rely on adminService.registerLogenInvoice

export function OrderManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('paid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Excel Matching States
  const [matchedDeposits, setMatchedDeposits] = useState<{ order: Order, row: any }[]>([]);
  const [unmatchedRows, setUnmatchedRows] = useState<any[]>([]);
  const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);
  const [isProcessingDeposits, setIsProcessingDeposits] = useState(false);

  // Dialog states
  const [shippingDialog, setShippingDialog] = useState<{
    open: boolean;
    type: 'confirm' | 'success' | 'bulk-confirm' | 'bulk-order-print' | 'bulk-invoice-print' | 'bulk-success' | 'no-orders';
    orderId?: string;
    trackingNumber?: string;
    bulkTracking?: Array<{ orderNumber: string; trackingNumber: string }>;
    ordersToProcess?: Order[];
  }>({
    open: false,
    type: 'confirm',
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await adminService.getOrders();
      setOrders(data as unknown as Order[]);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    partially_shipped: orders.filter(o => o.status === 'partially_shipped').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    claims: orders.filter(o => ['cancel_requested', 'return_requested', 'returning', 'returned', 'exchange_requested'].includes(o.status)).length,
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">입금대기</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">결제완료/발송대기</Badge>;
      case 'partially_shipped':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">결제완료/부분발송</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">배송중</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">배송완료</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">취소됨</Badge>;
      case 'cancel_requested':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 font-bold animate-pulse">취소요청</Badge>;
      case 'return_requested':
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-100 font-bold animate-pulse">반품요청</Badge>;
      case 'returning':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">반품수거중</Badge>;
      case 'returned':
        return <Badge variant="outline" className="bg-neutral-100 text-neutral-600 border-neutral-200">반품완료</Badge>;
      case 'exchange_requested':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-bold animate-pulse">교환요청</Badge>;
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.hospitalName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' 
      ? true 
      : selectedStatus === 'claims' 
        ? ['cancel_requested', 'return_requested', 'returning', 'returned', 'exchange_requested'].includes(order.status)
        : order.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);


  const confirmShipping = async () => {
    if (shippingDialog.orderId && shippingDialog.trackingNumber) {
      try {
        await adminService.updateOrderStatus(shippingDialog.orderId, 'shipped', shippingDialog.trackingNumber);
        setShippingDialog(prev => ({ ...prev, type: 'success' }));
        loadOrders();
      } catch (error) {
        console.error('Failed to update order status', error);
        alert('배송 처리에 실패했습니다.');
      }
    }
  };

  const handleBulkLogenInvoice = async () => {
    if (selectedStatus !== 'paid' && selectedStatus !== 'partially_shipped') {
      toast.error('발송대상 관련된 탭에서만 일괄 처리가 가능합니다.');
      return;
    }

    if (filteredOrders.length === 0) {
      setShippingDialog({
        open: true,
        type: 'no-orders',
      });
      return;
    }

    // 각 주문에 대해 로젠 API 호출하여 송장 채번
    toast.info('로젠택배 시스템과 연동 중입니다...');
    const generatePromises = filteredOrders.map(async (order: Order) => {
      const trackingNumber = await adminService.registerLogenInvoice(order);
      return {
        ...order,
        trackingNumber,
        trackingCompany: '로젠택배',
        shippedAt: new Date().toISOString(),
      };
    });

    const ordersWithTracking = await Promise.all(generatePromises);

    setShippingDialog({
      open: true,
      type: 'bulk-confirm',
      bulkTracking: ordersWithTracking.map((order: any) => ({
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber!,
      })),
      ordersToProcess: ordersWithTracking, // Confirm에서 사용하기 위해 저장
    });
  };

  const confirmBulkShipping = async () => {
    try {
      if (!shippingDialog.ordersToProcess) return;

      const promises = shippingDialog.ordersToProcess
        .filter((o: Order) => o.status === 'paid')
        .map((o: Order) => adminService.updateOrderStatus(o.id, 'shipped', o.trackingNumber));
      await Promise.all(promises);
      setShippingDialog(prev => ({ ...prev, type: 'bulk-success' }));
      loadOrders();
    } catch (error) {
      console.error('Failed to bulk update', error);
      toast.error('일괄 배송 처리에 실패했습니다.');
    }
  };


  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        // 1. 실제 헤더가 있는 행(Row) 찾기 (최대 20번째 줄까지 탐색)
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(20, rawData.length); i++) {
          const rowArray = rawData[i] as any[];
          if (rowArray && rowArray.some(cell => typeof cell === 'string' && (cell.includes('기재내용') || cell.includes('입금액') || cell.includes('입금') || cell.includes('거래내역')))) {
            headerRowIdx = i;
            break;
          }
        }

        // 2. 헤더 행을 기준으로 정확하게 JSON 파싱
        const data = XLSX.utils.sheet_to_json(ws, { range: headerRowIdx });
        
        const pendingOrders = orders.filter(o => o.status === 'pending');
        const matched: { order: Order, row: any }[] = [];
        const unmatched: any[] = [];

        data.forEach((row: any) => {
          // 안전하게 키를 찾기 위해 모든 키의 공백을 제거한 새 객체 생성
          const cleanRow: any = {};
          Object.keys(row).forEach(k => {
            cleanRow[k.trim()] = row[k];
          });

          // 알려주신 컬럼명: '기재내용', '거래금액(입금)', '거래내역(입금)'
          const depositorNameRaw = cleanRow['기재내용'] || cleanRow['입금자명'] || cleanRow['적요'];
          const depositAmountRaw = cleanRow['거래내역(입금)'] || cleanRow['거래금액(입금)'] || cleanRow['입금액'] || cleanRow['거래금액'];
          
          if (!depositorNameRaw || depositAmountRaw === undefined) {
            return;
          }

          const depositorName = String(depositorNameRaw).trim();
          const depositAmount = parseInt(String(depositAmountRaw).replace(/,/g, '').trim(), 10);

          // 동일이름(vactName 우선, 없을 시 customerName), 동일금액을 가진 모든 대기 주문 찾기
          const allPotentialMatches = pendingOrders.filter(o => {
             const targetName = (o.vactName || o.customerName || '').trim();
             return targetName === depositorName && o.totalAmount === depositAmount;
          });

          if (allPotentialMatches.length === 1) {
            // 단 1건만 존재할 경우에만 안전하게 매칭
            const match = allPotentialMatches[0];
            if (!matched.some(m => m.order.id === match.id)) {
              matched.push({ order: match, row });
            } else {
              unmatched.push(row);
            }
          } else {
            // 0건이거나 2건 이상(동일금액/동명이인 등 중복)인 경우 자동 매칭 방지 및 수기 처리
            unmatched.push(row);
          }
        });
        
        if (data.length > 0 && matched.length === 0) {
          alert(`엑셀 파일에서 ${data.length}건의 입금 내역을 찾았지만, 시스템의 입금대기 주문(${pendingOrders.length}건)과 일치하는 내역이 없습니다.\n\n주문 목록의 '입금자명'과 '입금액'이 엑셀 내역과 정확히 일치하는지 확인해주세요.`);
        }

        setMatchedDeposits(matched);
        setUnmatchedRows(unmatched);
        setIsMatchingModalOpen(true);
      } catch (err) {
        console.error(err);
        toast.error('엑셀 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const confirmBulkDeposits = async () => {
    if (matchedDeposits.length === 0) return;
    try {
      setIsProcessingDeposits(true);
      const orderIds = matchedDeposits.map(m => m.order.id);
      await adminService.bulkConfirmDeposits(orderIds);
      toast.success(`${orderIds.length}건의 무통장입금이 승인 처리되었습니다.`);
      setIsMatchingModalOpen(false);
      loadOrders();
    } catch (error) {
      console.error(error);
      toast.error('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessingDeposits(false);
    }
  };

  // 내부 포맷 주문서 출력
  const handlePrintInternalOrders = () => {
    alert('주문서 출력 기능은 데모에서 생략되었습니다.');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">주문 관리</h2>
          <p className="text-sm text-neutral-600">결제 및 입금이 완료된 발송 대상 주문을 관리합니다.</p>
        </div>
        {/* 
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handlePrintInternalOrders()}>
            <Printer className="w-4 h-4 mr-2" />
            주문서 출력
          </Button>
          <Button onClick={handleBulkLogenInvoice} disabled={stats.paid === 0}>
            <Truck className="w-4 h-4 mr-2" />
            배송 일괄처리
          </Button>
        </div>
        */}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: '전체', count: stats.all },
          { id: 'pending', label: '입금대기', count: stats.pending },
          { id: 'paid', label: '발송대기', count: stats.paid },
          { id: 'partially_shipped', label: '부분발송', count: stats.partially_shipped },
          { id: 'shipped', label: '배송중', count: stats.shipped },
          { id: 'delivered', label: '배송완료', count: stats.delivered },
          { id: 'cancelled', label: '취소됨', count: stats.cancelled },
          { id: 'claims', label: '취소/반품/교환', count: stats.claims },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${selectedStatus === tab.id
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
          >
            {tab.label} <span className="ml-1 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-neutral-200 p-4 sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="주문번호, 고객명, 병원명 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* Order List */}
      <div className="bg-white border border-neutral-200 divide-y divide-neutral-200">
        {/* Order Table */}
        <div className="bg-white border border-neutral-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-700 uppercase tracking-tighter">주문번호</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-700 uppercase tracking-tighter">고객정보</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-700 uppercase tracking-tighter">주문금액</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-700 uppercase tracking-tighter">주문일시</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-700 uppercase tracking-tighter">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-neutral-300 opacity-20" />
                    조건에 맞는 주문이 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order: Order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-neutral-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-neutral-900 group-hover:text-blue-600 transition-colors uppercase tracking-wider">{order.orderNumber}</div>
                      <div className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{order.itemsSummary}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-neutral-900">{order.hospitalName}</div>
                      <div className="text-xs text-neutral-500">{order.customerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-neutral-900">₩{order.totalAmount.toLocaleString()}</div>
                      <div className="text-xs text-neutral-500">{order.paymentInfo?.method}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">{order.orderDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                      {order.isSubscription && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 border-purple-100">정기배송</Badge>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredOrders.length > 0 && (
          <div className="bg-white border border-neutral-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-600">
                전체 <span className="font-medium text-neutral-900">{filteredOrders.length}</span>건 중{' '}
                <span className="font-medium text-neutral-900">{startIndex + 1}</span>-
                <span className="font-medium text-neutral-900">{Math.min(endIndex, filteredOrders.length)}</span>건
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm border transition-colors ${currentPage === page
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 3 ||
                      page === currentPage + 3
                    ) {
                      return (
                        <span key={page} className="px-2 text-neutral-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Excel Upload Section for Pending Orders */}
      {selectedStatus === 'pending' && (
        <div className="bg-white border border-neutral-200 p-6 mt-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">무통장입금 일괄 매칭</h3>
              <p className="text-sm text-neutral-500">은행에서 다운로드한 엑셀 파일(거래금액, 기재내용 포함)을 업로드하여 입금내역을 자동으로 매칭합니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-md cursor-pointer hover:bg-neutral-800 transition-colors font-medium text-sm shadow-sm">
              <Upload className="w-4 h-4" />
              엑셀 파일 업로드
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                onChange={handleExcelUpload} 
              />
            </label>
            <span className="text-xs text-neutral-400">* 지원 포맷: .xlsx, .xls</span>
          </div>
        </div>
      )}

      {/* Shipping Confirmation Dialog */}
      <AlertDialog open={shippingDialog.open} onOpenChange={(open: boolean) => setShippingDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {shippingDialog.type === 'confirm' && '발송 처리하시겠습니까?'}
              {shippingDialog.type === 'success' && '발송 처리가 완료되었습니다'}
              {shippingDialog.type === 'bulk-confirm' && `총 ${shippingDialog.bulkTracking?.length}건을 일괄 발송하시겠습니까?`}
              {shippingDialog.type === 'bulk-success' && '일괄 발송 처리가 완료되었습니다'}
              {shippingDialog.type === 'no-orders' && '발송할 주문이 없습니다'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {shippingDialog.type === 'confirm' && (
                  <div className="mt-2 p-3 bg-neutral-50 text-sm">
                    <div className="mb-1"><strong>발송 정보:</strong> 로젠택배</div>
                    <div><strong>송장번호:</strong> {shippingDialog.trackingNumber}</div>
                  </div>
                )}
                {shippingDialog.type === 'bulk-confirm' && (
                  <div>선택된 모든 주문의 상태가 '배송중'으로 변경되며, 송장번호가 자동으로 생성됩니다.</div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {shippingDialog.type === 'success' || shippingDialog.type === 'bulk-success' || shippingDialog.type === 'no-orders' ? (
              <AlertDialogAction onClick={() => setShippingDialog(prev => ({ ...prev, open: false }))}>확인</AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={shippingDialog.type === 'confirm' ? confirmShipping : confirmBulkShipping}>
                  발송 처리
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Excel Matching Preview Dialog */}
      <AlertDialog open={isMatchingModalOpen} onOpenChange={setIsMatchingModalOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>엑셀 무통장입금 매칭 결과</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="mt-4">
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                    <p className="text-sm text-green-700 mb-1">매칭 성공</p>
                    <p className="text-2xl font-bold text-green-800">{matchedDeposits.length}건</p>
                  </div>
                  <div className="flex-1 bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
                    <p className="text-sm text-orange-700 mb-1">매칭 실패(수기확인 필요)</p>
                    <p className="text-2xl font-bold text-orange-800">{unmatchedRows.length}건</p>
                  </div>
                </div>

                {matchedDeposits.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-neutral-900 mb-2">매칭된 주문 (입금확인 대상)</h4>
                    <div className="max-h-60 overflow-y-auto border border-neutral-200 rounded-md">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 font-medium text-neutral-700">주문번호</th>
                            <th className="px-4 py-2 font-medium text-neutral-700">입금자(기재내용)</th>
                            <th className="px-4 py-2 font-medium text-neutral-700">금액</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {matchedDeposits.map((m, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-neutral-900">{m.order.orderNumber}</td>
                              <td className="px-4 py-2 text-neutral-600">{m.order.customerName}</td>
                              <td className="px-4 py-2 text-neutral-900">₩{m.order.totalAmount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {matchedDeposits.length > 0 && (
                  <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded border border-neutral-200 mt-4">
                    매칭된 {matchedDeposits.length}건의 주문 상태를 <span className="font-bold text-blue-600">결제완료(발송대기)</span>로 일괄 변경합니다. 계속하시겠습니까?
                  </p>
                )}
                
                {matchedDeposits.length === 0 && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200 mt-4 text-center font-bold">
                    매칭되는 대기 주문이 없습니다. 파일 양식과 대기 리스트를 확인해주세요.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <Button 
              onClick={confirmBulkDeposits} 
              disabled={matchedDeposits.length === 0 || isProcessingDeposits}
              className="bg-neutral-900 text-white hover:bg-neutral-800"
            >
              {isProcessingDeposits ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              일괄 승인 처리
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}