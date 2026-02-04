import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Calendar, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - in real app, fetch based on id
  const newsItem = {
    id: id,
    title: '[공지] 2026년 설날 연휴 배송 안내',
    category: '공지사항' as const,
    date: '2026-01-28',
    views: 245,
    content: `안녕하세요, 제이시스메디칼입니다.

2026년 설날 연휴 기간 동안의 주문 및 배송 일정을 안내드립니다.

■ 연휴 기간
- 2026년 1월 28일(화) ~ 2월 1일(토)

■ 주문 및 배송 안내
1. 1월 27일(월) 오후 3시까지 주문 건: 당일 출고
2. 1월 27일(월) 오후 3시 이후 주문 건: 2월 3일(월) 순차 출고
3. 연휴 기간 중 주문 건: 2월 3일(월)부터 순차 출고

■ 고객센터 운영
- 연휴 기간 중에는 고객센터 운영이 중단됩니다.
- 긴급 문의사항은 1:1 문의게시판을 이용해 주시면 연휴 이후 순차적으로 답변드리겠습니다.

■ 카카오톡 채널 문의
- 연휴 기간 중에도 카카오톡 채널을 통한 문의는 가능하나, 답변은 2월 3일(월)부터 순차적으로 진행됩니다.

미리 필요하신 소모품이 있으시다면 서둘러 주문해 주시기 바랍니다.

새해 복 많이 받으시고, 항상 건강하시기 바랍니다.

감사합니다.`,
  };

  const [prevPost] = useState({
    id: '4',
    title: '제이시스메디칼 2026년 상반기 교육 일정 안내',
  });

  const [nextPost] = useState({
    id: '2',
    title: '[공지] 신규 회원 가입 이벤트 안내',
  });

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/communication/news')}
        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>목록으로</span>
      </button>

      <div className="bg-white border border-neutral-200">
        {/* Header */}
        <div className="px-6 lg:px-8 py-6 border-b border-neutral-200 bg-neutral-50">
          <div className="mb-3">
            <span
              className={`inline-block px-3 py-1 text-xs font-medium ${
                newsItem.category === '공지사항'
                  ? 'bg-red-100 text-red-700'
                  : newsItem.category === '이벤트'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {newsItem.category}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl tracking-tight text-neutral-900 mb-4">
            {newsItem.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {newsItem.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              조회 {newsItem.views}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 lg:px-8 py-8">
          <div className="text-base text-neutral-900 whitespace-pre-wrap leading-relaxed">
            {newsItem.content}
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t border-neutral-200">
          {nextPost && (
            <div
              onClick={() => navigate(`/communication/news/${nextPost.id}`)}
              className="flex items-center justify-between px-6 lg:px-8 py-4 hover:bg-neutral-50 transition-colors cursor-pointer border-b border-neutral-200"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-500 mb-1">다음글</p>
                  <p className="text-sm text-neutral-900 truncate">
                    {nextPost.title}
                  </p>
                </div>
              </div>
            </div>
          )}
          {prevPost && (
            <div
              onClick={() => navigate(`/communication/news/${prevPost.id}`)}
              className="flex items-center justify-between px-6 lg:px-8 py-4 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <ChevronLeft className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-500 mb-1">이전글</p>
                  <p className="text-sm text-neutral-900 truncate">
                    {prevPost.title}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => navigate('/communication/news')}
          className="px-8 py-3 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
        >
          목록으로
        </button>
      </div>
    </div>
  );
}
