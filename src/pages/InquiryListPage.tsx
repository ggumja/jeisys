import { useState } from 'react';
import { Link } from 'react-router';
import { MessageCircle, CheckCircle, Clock, Plus } from 'lucide-react';

interface Inquiry {
  id: string;
  title: string;
  content: string;
  date: string;
  status: 'pending' | 'answered';
  answer?: string;
  answerDate?: string;
}

export function InquiryListPage() {
  const [inquiries] = useState<Inquiry[]>([
    {
      id: '1',
      title: '제품 배송 관련 문의드립니다',
      content: '주문한 제품이 언제쯤 도착할까요?',
      date: '2026-01-28',
      status: 'answered',
      answer: '안녕하세요. 주문하신 제품은 오늘 출고 예정이며, 내일 오전 중 도착 예정입니다. 감사합니다.',
      answerDate: '2026-01-28',
    },
    {
      id: '2',
      title: 'POTENZA 소모품 재입고 일정',
      content: 'POTENZA 니들팁 25p 재입고 일정이 궁금합니다.',
      date: '2026-01-27',
      status: 'pending',
    },
    {
      id: '3',
      title: '대량 구매 할인 문의',
      content: '소모품을 대량으로 구매하려고 하는데, 추가 할인이 가능한가요?',
      date: '2026-01-25',
      status: 'answered',
      answer: '안녕하세요. 대량 구매 시 별도 할인이 가능합니다. 구매 희망 수량과 품목을 말씀해 주시면 견적서를 보내드리겠습니다.',
      answerDate: '2026-01-26',
    },
  ]);

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
          {inquiries.length === 0 ? (
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
                    {inquiry.date}
                  </div>
                  <div className="col-span-2 text-center text-sm text-neutral-600">
                    {inquiry.answerDate || '-'}
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
                        등록: {inquiry.date}
                        {inquiry.answerDate && ` | 답변: ${inquiry.answerDate}`}
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