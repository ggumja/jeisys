import { useState, useEffect } from 'react';
import { Monitor, Clock, CheckCircle, XCircle, Eye, Save, Trash2, X } from 'lucide-react';
import { demoService, DemoRequest, DemoStatus } from '../../services/demoService';
import { formatDate } from '../../lib/utils';

export function DemoManagementPage() {
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status update state
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
  const [newStatus, setNewStatus] = useState<DemoStatus>('pending');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = await demoService.getDemoRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch demo requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenUpdateModal = (req: DemoRequest) => {
    setSelectedRequest(req);
    setNewStatus(req.status);
    setScheduledDate(req.scheduledDate || '');
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
  };

  const handleSubmitUpdate = async () => {
    if (!selectedRequest) return;
    try {
      setIsSubmitting(true);
      await demoService.updateDemoStatus(selectedRequest.id, newStatus, scheduledDate || undefined);
      fetchRequests();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to update demo status:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: DemoRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            대기중
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            확정
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            완료
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            취소
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl tracking-tight text-neutral-900">
        장비 데모신청 관리
      </h3>

      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  고객정보
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  장비
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  희망일정
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  연락처
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  신청일
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-neutral-500 text-sm">로딩 중...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-neutral-500 text-sm">신청 내역이 없습니다.</td></tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-neutral-900">
                        {request.user?.name || '익명'}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {request.hospitalName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium">
                        {request.equipment}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {request.preferredDate}
                      {request.scheduledDate && (
                        <div className="text-xs text-blue-600 font-medium">확정: {request.scheduledDate}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {request.contactNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => handleOpenUpdateModal(request)}
                        className="px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm"
                      >
                        상세/수정
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 신청</div>
          <div className="text-2xl font-medium text-neutral-900">
            {requests.length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">대기중</div>
          <div className="text-2xl font-medium text-yellow-600">
            {requests.filter((r) => r.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">확정</div>
          <div className="text-2xl font-medium text-blue-600">
            {requests.filter((r) => r.status === 'scheduled').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">완료</div>
          <div className="text-2xl font-medium text-green-600">
            {requests.filter((r) => r.status === 'completed').length}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h4 className="font-medium text-neutral-900">데모 신청 상세 및 상태 수정</h4>
              <button onClick={handleCloseModal} className="text-neutral-500 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-neutral-500">병원명</label>
                  <p className="font-medium">{selectedRequest.hospitalName}</p>
                </div>
                <div>
                  <label className="text-neutral-500">연락처</label>
                  <p className="font-medium">{selectedRequest.contactNumber}</p>
                </div>
                <div>
                  <label className="text-neutral-500">장비</label>
                  <p className="font-medium">{selectedRequest.equipment}</p>
                </div>
                <div>
                  <label className="text-neutral-500">희망일정</label>
                  <p className="font-medium">{selectedRequest.preferredDate}</p>
                </div>
              </div>
              <div>
                <label className="text-neutral-500 text-sm">요청내용</label>
                <p className="p-3 bg-neutral-50 rounded mt-1 text-sm italic">{selectedRequest.content}</p>
              </div>
              <hr />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">상태 변경</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as DemoStatus)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  >
                    <option value="pending">대기중</option>
                    <option value="scheduled">일정확정</option>
                    <option value="completed">완료</option>
                    <option value="cancelled">취소</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">확정 날짜</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 bg-neutral-50">
              <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900">취소</button>
              <button onClick={handleSubmitUpdate} disabled={isSubmitting} className="px-4 py-2 bg-neutral-900 text-white rounded text-sm font-medium hover:bg-neutral-800 flex items-center gap-2">
                <Save className="w-4 h-4" /> {isSubmitting ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
