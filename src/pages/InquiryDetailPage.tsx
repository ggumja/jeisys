import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { CheckCircle, Clock, ArrowLeft, Lock } from 'lucide-react';
import { inquiryService } from '../services/inquiryService';
import { authService } from '../services/authService';
import { Inquiry } from '../types';
import { formatDate } from '../lib/utils';

export function InquiryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInquiry = async () => {
      try {
        setIsLoading(true);
        const user = await authService.getCurrentUser();
        if (id) {
          const data = await inquiryService.getInquiryById(id);
          if (data) {
            // Check access for secret inquiry
            if (data.isSecret && user?.role !== 'admin' && data.userId !== user?.id) {
              setError('비밀글은 작성자 본인만 조회할 수 있습니다.');
            } else {
              setInquiry(data);
            }
          } else {
            setError('존재하지 않는 문의사항입니다.');
          }
        }
      } catch (err) {
        console.error('Failed to fetch inquiry:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInquiry();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-neutral-500">로딩 중...</div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="py-20 text-center space-y-4">
        <Lock className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
        <p className="text-neutral-600">{error || '문의사항을 찾을 수 없습니다.'}</p>
        <button
          onClick={() => navigate('/communication/inquiry')}
          className="px-6 py-2 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

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
              <h1 className="text-2xl tracking-tight text-neutral-900 mb-2 flex items-center gap-2">
                {inquiry.title}
                {inquiry.isSecret && <Lock className="w-4 h-4 text-neutral-400" />}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                <span>등록일: {formatDate(inquiry.createdAt)}</span>
                {inquiry.answeredAt && (
                  <span>답변일: {formatDate(inquiry.answeredAt)}</span>
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
          {inquiry.status === 'answered' && inquiry.answerContent && (
            <div className="pt-8 border-t border-neutral-200">
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-sm">
                <h3 className="text-sm font-medium text-blue-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  답변
                </h3>
                <div className="text-base text-neutral-900 whitespace-pre-wrap leading-relaxed">
                  {inquiry.answerContent}
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