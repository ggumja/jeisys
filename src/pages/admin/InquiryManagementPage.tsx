import { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, Eye, Lock, X } from 'lucide-react';
import { inquiryService } from '../../services/inquiryService';
import { Inquiry } from '../../types';
import { formatDate } from '../../lib/utils';

export function InquiryManagementPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // For answering
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [answerContent, setAnswerContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setIsLoading(true);
      const data = await inquiryService.getInquiries();
      setInquiries(data);
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    if (statusFilter === 'all') return true;
    return inquiry.status === statusFilter;
  });

  const getStatusBadge = (status: Inquiry['status']) => {
    if (status === 'waiting') {
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

  const handleOpenAnswerModal = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setAnswerContent(inquiry.answerContent || '');
  };

  const handleCloseModal = () => {
    setSelectedInquiry(null);
    setAnswerContent('');
  };

  const handleSubmitAnswer = async () => {
    if (!selectedInquiry || !answerContent.trim()) return;

    try {
      setIsSubmitting(true);
      await inquiryService.answerInquiry(selectedInquiry.id, answerContent);
      await fetchInquiries(); // Refresh list
      handleCloseModal();
      alert('답변이 등록되었습니다.');
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('답변 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
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
          <option value="waiting">답변대기</option>
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-neutral-500 text-sm">로딩 중...</td>
                </tr>
              ) : filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-neutral-500 text-sm">등록된 문의가 없습니다.</td>
                </tr>
              ) : (
                filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-neutral-900 flex items-center gap-1.5">
                        {inquiry.title}
                        {inquiry.isSecret && <Lock className="w-3 h-3 text-neutral-400" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900">{inquiry.user?.name || '익명'}</div>
                      <div className="text-xs text-neutral-500">{inquiry.user?.hospitalName || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium">
                        {inquiry.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {formatDate(inquiry.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(inquiry.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => handleOpenAnswerModal(inquiry)}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{inquiry.status === 'answered' ? '상세보기' : '답변하기'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 문의</div>
          <div className="text-2xl font-medium text-neutral-900">{inquiries.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">답변대기</div>
          <div className="text-2xl font-medium text-yellow-600">
            {inquiries.filter((i) => i.status === 'waiting').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">답변완료</div>
          <div className="text-2xl font-medium text-green-600">
            {inquiries.filter((i) => i.status === 'answered').length}
          </div>
        </div>
      </div>

      {/* Answer Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <h4 className="font-medium text-neutral-900">문의 상세 및 답변 등록</h4>
              <button onClick={handleCloseModal} className="text-neutral-500 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-neutral-200 text-neutral-700 rounded">
                    {selectedInquiry.type}
                  </span>
                  <span className="text-sm text-neutral-500">{formatDate(selectedInquiry.createdAt)}</span>
                </div>
                <h5 className="text-lg font-medium text-neutral-900 flex items-center gap-2">
                  {selectedInquiry.title}
                  {selectedInquiry.isSecret && <Lock className="w-4 h-4 text-neutral-400" />}
                </h5>
                <div className="text-sm text-neutral-600 pb-4 border-b border-neutral-100">
                  작성자: {selectedInquiry.user?.name || '익명'} | {selectedInquiry.user?.hospitalName || '정보없음'}
                </div>
                <div className="text-neutral-800 whitespace-pre-wrap leading-relaxed text-sm bg-neutral-50 p-4 border border-neutral-100 italic">
                  {selectedInquiry.content}
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <label className="block text-sm font-medium text-neutral-900">
                  답변 내용
                </label>
                <textarea
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  placeholder="답변 내용을 입력하세요..."
                  className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none text-sm min-h-[200px]"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 bg-neutral-50">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm"
              >
                취소
              </button>
              <button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || !answerContent.trim()}
                className={`px-5 py-2 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors text-sm ${
                  isSubmitting || !answerContent.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? '등록 중...' : '답변 저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
