import { useParams, useNavigate } from 'react-router';
import { CheckCircle, Clock, ArrowLeft } from 'lucide-react';

export function InquiryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - in real app, fetch based on id
  const inquiry = {
    id: id,
    title: '제품 배송 관련 문의드립니다',
    content: '안녕하세요. 어제 주문한 POTENZA 니들팁이 아직 배송 시작이 안된 것 같아서 문의드립니다. 언제쯤 출고되고 도착할 수 있을까요? 다음주 화요일까지는 꼭 받아야 해서 걱정이 됩니다. 빠른 답변 부탁드립니다.',
    date: '2026-01-28',
    status: 'answered' as const,
    answer: '안녕하세요, 제이시스메디칼입니다.\n\n주문하신 POTENZA 니들팁은 오늘 오전에 출고 완료되었으며, 택배사 송장번호는 1234-5678-9012 입니다.\n\n내일(1월 29일) 오전 중에 도착 예정이니 안심하시고 기다려 주세요. 다음주 화요일 전에 충분히 받아보실 수 있습니다.\n\n추가 문의사항이 있으시면 언제든지 연락 주세요.\n감사합니다.',
    answerDate: '2026-01-28',
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/communication/inquiry')}
        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>목록으로</span>
      </button>

      <div className="bg-white border border-neutral-200">
        {/* Header */}
        <div className="px-6 lg:px-8 py-6 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-start gap-4 mb-4">
            {inquiry.status === 'answered' ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            ) : (
              <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
              <h1 className="text-2xl tracking-tight text-neutral-900 mb-2">
                {inquiry.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                <span>등록일: {inquiry.date}</span>
                {inquiry.answerDate && (
                  <span>답변일: {inquiry.answerDate}</span>
                )}
                <span
                  className={
                    inquiry.status === 'answered'
                      ? 'text-green-600 font-medium'
                      : 'text-yellow-600 font-medium'
                  }
                >
                  {inquiry.status === 'answered' ? '답변완료' : '답변대기'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">
              문의 내용
            </h3>
            <div className="text-base text-neutral-900 whitespace-pre-wrap leading-relaxed">
              {inquiry.content}
            </div>
          </div>

          {/* Answer */}
          {inquiry.status === 'answered' && inquiry.answer && (
            <div className="pt-8 border-t border-neutral-200">
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-sm">
                <h3 className="text-sm font-medium text-blue-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  답변
                </h3>
                <div className="text-base text-neutral-900 whitespace-pre-wrap leading-relaxed">
                  {inquiry.answer}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => navigate('/communication/inquiry')}
          className="px-8 py-3 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
        >
          목록으로
        </button>
      </div>
    </div>
  );
}