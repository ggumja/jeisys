import { Monitor, Clock, CheckCircle, XCircle } from 'lucide-react';

interface DemoRequest {
  id: string;
  customerName: string;
  hospitalName: string;
  equipment: string;
  preferredDate: string;
  contactNumber: string;
  requestDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

const mockDemoRequests: DemoRequest[] = [
  {
    id: '1',
    customerName: '김민종 원장',
    hospitalName: '서울피부과의원',
    equipment: 'POTENZA',
    preferredDate: '2026-02-10',
    contactNumber: '02-1234-5678',
    requestDate: '2026-02-01',
    status: 'pending',
  },
  {
    id: '2',
    customerName: '이수진 원장',
    hospitalName: '강남클리닉',
    equipment: 'ULTRAcel II',
    preferredDate: '2026-02-15',
    contactNumber: '02-2345-6789',
    requestDate: '2026-01-30',
    status: 'confirmed',
  },
  {
    id: '3',
    customerName: '박지훈 원장',
    hospitalName: '부산성형외과',
    equipment: 'LinearZ',
    preferredDate: '2026-01-25',
    contactNumber: '051-3456-7890',
    requestDate: '2026-01-20',
    status: 'completed',
  },
];

export function DemoManagementPage() {
  const getStatusBadge = (status: DemoRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium">
            <Clock className="w-3 h-3" />
            대기중
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            확정
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            완료
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-medium">
            <XCircle className="w-3 h-3" />
            취소
          </span>
        );
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
              {mockDemoRequests.map((request) => (
                <tr key={request.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900">
                      {request.customerName}
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {request.contactNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {request.requestDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.status === 'pending' && (
                      <button className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm">
                        일정확정
                      </button>
                    )}
                    {request.status === 'confirmed' && (
                      <button className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors text-sm">
                        완료처리
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 신청</div>
          <div className="text-2xl font-medium text-neutral-900">
            {mockDemoRequests.length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">대기중</div>
          <div className="text-2xl font-medium text-yellow-600">
            {mockDemoRequests.filter((r) => r.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">확정</div>
          <div className="text-2xl font-medium text-blue-600">
            {mockDemoRequests.filter((r) => r.status === 'confirmed').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">완료</div>
          <div className="text-2xl font-medium text-green-600">
            {mockDemoRequests.filter((r) => r.status === 'completed').length}
          </div>
        </div>
      </div>
    </div>
  );
}
