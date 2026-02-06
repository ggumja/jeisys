import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { MessageCircle, CheckCircle, Clock, Plus } from 'lucide-react';
import { inquiryService } from '../services/inquiryService';
import { Inquiry } from '../types';
import { formatDate } from '../lib/utils';

export function InquiryListPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
            1:1 문의사항
          </h2>
          <p className="text-sm text-neutral-600">
            궁금하신 사항을 문의해 주세요
          </p>
        </div>
        <Link
          to="/communication/inquiry/write"
          className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>문의하기</span>
        </Link>
      </div>

      <div className="bg-white border border-neutral-200">
        {/* Header */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 border-b border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-700">
          <div className="col-span-1 text-center">상태</div>
          <div className="col-span-7">제목</div>
          <div className="col-span-2 text-center">등록일</div>
          <div className="col-span-2 text-center">답변일</div>
        </div>

        {/* List */}
        <div className="divide-y divide-neutral-200">
          {isLoading ? (
            <div className="py-16 text-center text-neutral-500">로딩 중...</div>
          ) : inquiries.length === 0 ? (
            <div className="py-16 text-center">
              <MessageCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600 mb-6">등록된 문의가 없습니다</p>
              <Link
                to="/communication/inquiry/write"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>첫 문의하기</span>
              </Link>
            </div>
          ) : (
            inquiries.map((inquiry) => (
              <Link
                key={inquiry.id}
                to={`/communication/inquiry/${inquiry.id}`}
                className="block hover:bg-neutral-50 transition-colors"
              >
                {/* Desktop */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-5 items-center">
                  <div className="col-span-1 flex justify-center">
                    {inquiry.status === 'answered' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-yellow-600" />
                    )}
                  </div>
                  <div className="col-span-7">
                    <p className="text-base text-neutral-900 hover:text-neutral-600">
                      {inquiry.title}
                    </p>
                  </div>
                  <div className="col-span-2 text-center text-sm text-neutral-600">
                    {formatDate(inquiry.createdAt)}
                  </div>
                  <div className="col-span-2 text-center text-sm text-neutral-600">
                    {inquiry.answeredAt ? formatDate(inquiry.answeredAt) : '-'}
                  </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden px-6 py-4">
                  <div className="flex items-start gap-3 mb-2">
                    {inquiry.status === 'answered' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-base text-neutral-900 mb-1">
                        {inquiry.title}
                      </p>
                      <p className="text-sm text-neutral-600">
                        등록: {formatDate(inquiry.createdAt)}
                        {inquiry.answeredAt && ` | 답변: ${formatDate(inquiry.answeredAt)}`}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-6 bg-neutral-50 border border-neutral-200">
        <h3 className="text-sm font-medium text-neutral-900 mb-3">안내사항</h3>
        <ul className="text-sm text-neutral-600 space-y-2">
          <li>• 문의 답변은 영업일 기준 1~2일 내에 등록됩니다.</li>
          <li>• 긴급한 문의는 고객지원센터(070-7435-4927)로 연락 주시기 바랍니다.</li>
          <li>• 개인정보가 포함된 문의는 1:1 문의를 이용해 주세요.</li>
        </ul>
      </div>
    </div>
  );
}