import { useState } from 'react';
import { Link } from 'react-router';
import { Pin, Eye, Calendar } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  views: number;
  isPinned: boolean;
  category: '공지사항' | '뉴스' | '이벤트';
}

export function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [news] = useState<NewsItem[]>([
    {
      id: '1',
      title: '[공지] 2026년 설날 연휴 배송 안내',
      content: '설날 연휴 기간 동안의 주문 및 배송 일정을 안내드립니다...',
      date: '2026-01-28',
      views: 245,
      isPinned: true,
      category: '공지사항',
    },
    {
      id: '2',
      title: '[공지] 신규 회원 가입 이벤트 안내',
      content: '신규 회원 가입 시 특별 혜택을 제공합니다...',
      date: '2026-01-25',
      views: 189,
      isPinned: true,
      category: '이벤트',
    },
    {
      id: '3',
      title: 'POTENZA 신규 소모품 라인업 출시',
      content: 'POTENZA의 새로운 소모품 라인업이 출시되었습니다...',
      date: '2026-01-24',
      views: 312,
      isPinned: false,
      category: '뉴스',
    },
    {
      id: '4',
      title: '제이시스메디칼 2026년 상반기 교육 일정 안내',
      content: '2026년 상반기 장비 교육 일정을 안내드립니다...',
      date: '2026-01-22',
      views: 156,
      isPinned: false,
      category: '공지사항',
    },
    {
      id: '5',
      title: 'ULTRAcel II 신기술 세미나 개최 안내',
      content: 'ULTRAcel II의 최신 기술과 활용법을 소개하는 세미나를 개최합니다...',
      date: '2026-01-20',
      views: 203,
      isPinned: false,
      category: '뉴스',
    },
    {
      id: '6',
      title: '[이벤트] 1월 특별 프로모션 - 소모품 최대 20% 할인',
      content: '1월 한 달간 선정된 소모품 구매 시 최대 20% 할인 혜택을 제공합니다...',
      date: '2026-01-15',
      views: 428,
      isPinned: false,
      category: '이벤트',
    },
    {
      id: '7',
      title: 'IntraGen 소모품 재입고 완료',
      content: '품절되었던 IntraGen 소모품이 재입고 되었습니다...',
      date: '2026-01-12',
      views: 98,
      isPinned: false,
      category: '뉴스',
    },
    {
      id: '8',
      title: '[공지] 개인정보 처리방침 개정 안내',
      content: '개인정보 처리방침이 개정되었습니다...',
      date: '2026-01-10',
      views: 67,
      isPinned: false,
      category: '공지사항',
    },
  ]);

  const categories = ['전체', '공지사항', '뉴스', '이벤트'];

  const filteredNews =
    selectedCategory === '전체'
      ? news
      : news.filter((item) => item.category === selectedCategory);

  const pinnedNews = filteredNews.filter((item) => item.isPinned);
  const regularNews = filteredNews.filter((item) => !item.isPinned);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
          제이시스뉴스
        </h2>
        <p className="text-sm text-neutral-600">
          제이시스메디칼의 새로운 소식과 공지사항을 확인하세요
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 text-sm transition-colors ${
              selectedCategory === category
                ? 'bg-neutral-900 text-white'
                : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="bg-white border border-neutral-200">
        {/* Header */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 border-b border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-700">
          <div className="col-span-1 text-center">번호</div>
          <div className="col-span-2 text-center">분류</div>
          <div className="col-span-6">제목</div>
          <div className="col-span-2 text-center">작성일</div>
          <div className="col-span-1 text-center">조회</div>
        </div>

        {/* List */}
        <div className="divide-y divide-neutral-200">
          {/* Pinned News */}
          {pinnedNews.map((item) => (
            <Link
              key={item.id}
              to={`/communication/news/${item.id}`}
              className="block hover:bg-neutral-50 transition-colors bg-blue-50/30"
            >
              {/* Desktop */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 items-center">
                <div className="col-span-1 flex justify-center">
                  <Pin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="col-span-2 text-center">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium ${
                      item.category === '공지사항'
                        ? 'bg-red-100 text-red-700'
                        : item.category === '이벤트'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {item.category}
                  </span>
                </div>
                <div className="col-span-6">
                  <p className="text-base text-neutral-900 hover:text-neutral-600 font-medium">
                    {item.title}
                  </p>
                </div>
                <div className="col-span-2 text-center text-sm text-neutral-600">
                  {item.date}
                </div>
                <div className="col-span-1 text-center text-sm text-neutral-600">
                  {item.views}
                </div>
              </div>

              {/* Mobile */}
              <div className="md:hidden px-6 py-4">
                <div className="flex items-start gap-2 mb-2">
                  <Pin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium ${
                      item.category === '공지사항'
                        ? 'bg-red-100 text-red-700'
                        : item.category === '이벤트'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {item.category}
                  </span>
                </div>
                <p className="text-base text-neutral-900 mb-2 font-medium">
                  {item.title}
                </p>
                <div className="flex items-center gap-3 text-xs text-neutral-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {item.views}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* Regular News */}
          {regularNews.map((item, index) => (
            <Link
              key={item.id}
              to={`/communication/news/${item.id}`}
              className="block hover:bg-neutral-50 transition-colors"
            >
              {/* Desktop */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 items-center">
                <div className="col-span-1 text-center text-sm text-neutral-600">
                  {regularNews.length - index}
                </div>
                <div className="col-span-2 text-center">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium ${
                      item.category === '공지사항'
                        ? 'bg-red-100 text-red-700'
                        : item.category === '이벤트'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {item.category}
                  </span>
                </div>
                <div className="col-span-6">
                  <p className="text-base text-neutral-900 hover:text-neutral-600">
                    {item.title}
                  </p>
                </div>
                <div className="col-span-2 text-center text-sm text-neutral-600">
                  {item.date}
                </div>
                <div className="col-span-1 text-center text-sm text-neutral-600">
                  {item.views}
                </div>
              </div>

              {/* Mobile */}
              <div className="md:hidden px-6 py-4">
                <div className="mb-2">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium ${
                      item.category === '공지사항'
                        ? 'bg-red-100 text-red-700'
                        : item.category === '이벤트'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {item.category}
                  </span>
                </div>
                <p className="text-base text-neutral-900 mb-2">{item.title}</p>
                <div className="flex items-center gap-3 text-xs text-neutral-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {item.views}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {filteredNews.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-neutral-600">등록된 게시글이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination - Placeholder */}
      <div className="flex justify-center items-center gap-2">
        <button className="px-3 py-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-sm">
          이전
        </button>
        <button className="px-3 py-2 bg-neutral-900 text-white text-sm">1</button>
        <button className="px-3 py-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-sm">
          2
        </button>
        <button className="px-3 py-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-sm">
          3
        </button>
        <button className="px-3 py-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-sm">
          다음
        </button>
      </div>
    </div>
  );
}
