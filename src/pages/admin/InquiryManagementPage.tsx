import { useState } from 'react';
import { MessageSquare, Clock, CheckCircle, Eye } from 'lucide-react';

interface Inquiry {
  id: string;
  title: string;
  customerName: string;
  hospitalName: string;
  category: string;
  createdDate: string;
  status: 'pending' | 'answered';
}

const mockInquiries: Inquiry[] = [
  {
    id: '1',
    title: 'POTENZA 니들 팁 재고 문의',
    customerName: '김민종 원장',
    hospitalName: '서울피부과의원',
    category: '상품문의',
    createdDate: '2026-02-02',
    status: 'pending',
  },
  {
    id: '2',
    title: '배송 일정 변경 요청',
    customerName: '이수진 원장',
    hospitalName: '강남클리닉',
    category: '배송문의',
    createdDate: '2026-02-01',
    status: 'answered',
  },
  {
    id: '3',
    title: 'ULTRAcel II 교육 일정 문의',
    customerName: '박지훈 원장',
    hospitalName: '부산성형외과',
    category: '교육문의',
    createdDate: '2026-01-31',
    status: 'answered',
  },
  {
    id: '4',
    title: '견적서 발급 요청',
    customerName: '최영희 원장',
    hospitalName: '인천피부과',
    category: '기타문의',
    createdDate: '2026-01-30',
    status: 'pending',
  },
];

export function InquiryManagementPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInquiries = mockInquiries.filter((inquiry) => {
    if (statusFilter === 'all') return true;
    return inquiry.status === statusFilter;
  });

  const getStatusBadge = (status: Inquiry['status']) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium">
          <Clock className="w-3 h-3" />
          답변대기
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium">
        <CheckCircle className="w-3 h-3" />
        답변완료
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl tracking-tight text-neutral-900">
          1:1 문의사항 관리
        </h3>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
        >
          <option value="all">전체</option>
          <option value="pending">답변대기</option>
          <option value="answered">답변완료</option>
        </select>
      </div>

      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  고객정보
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  등록일
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
              {filteredInquiries.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900">
                      {inquiry.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-900">{inquiry.customerName}</div>
                    <div className="text-xs text-neutral-500">{inquiry.hospitalName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium">
                      {inquiry.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {inquiry.createdDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(inquiry.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm">
                      <Eye className="w-4 h-4" />
                      <span>답변하기</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 문의</div>
          <div className="text-2xl font-medium text-neutral-900">{mockInquiries.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">답변대기</div>
          <div className="text-2xl font-medium text-yellow-600">
            {mockInquiries.filter((i) => i.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">답변완료</div>
          <div className="text-2xl font-medium text-green-600">
            {mockInquiries.filter((i) => i.status === 'answered').length}
          </div>
        </div>
      </div>
    </div>
  );
}
