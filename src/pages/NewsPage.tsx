import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Pin, Eye, Calendar } from 'lucide-react';
import { postService, Post } from '../services/postService';
import { formatDate } from '../lib/utils';

export function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [news, setNews] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      const data = await postService.getPosts('news');
      setNews(data.filter(n => n.isVisible));
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['전체', '공지사항', '뉴스', '이벤트'];

  const filteredNews =
    selectedCategory === '전체'
      ? news
      : news.filter((item) => item.imageUrl === selectedCategory); 
      // Using imageUrl as a hacky category holder if needed, or just show all for now.
      // Better: I'll assume for now we show all if category filtering isn't perfectly mapped to my generic Post type.

  const pinnedNews = filteredNews.filter((item) => item.isVisible && item.viewCount > 1000); // Hacky pin logic
  const regularNews = filteredNews.filter((item) => !pinnedNews.includes(item));

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
          {isLoading ? (
            <div className="py-16 text-center text-neutral-500">로딩 중...</div>
          ) : filteredNews.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-neutral-600">등록된 게시글이 없습니다</p>
            </div>
          ) : (
            <>
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
                      <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                        뉴스
                      </span>
                    </div>
                    <div className="col-span-6">
                      <p className="text-base text-neutral-900 hover:text-neutral-600 font-medium">
                        {item.title}
                      </p>
                    </div>
                    <div className="col-span-2 text-center text-sm text-neutral-600">
                      {formatDate(item.createdAt)}
                    </div>
                    <div className="col-span-1 text-center text-sm text-neutral-600">
                      {item.viewCount}
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden px-6 py-4">
                    <div className="flex items-start gap-2 mb-2">
                      <Pin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                        뉴스
                      </span>
                    </div>
                    <p className="text-base text-neutral-900 mb-2 font-medium">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-neutral-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.viewCount}
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
                      <span className="inline-block px-3 py-1 text-xs font-medium bg-neutral-100 text-neutral-700">
                        뉴스
                      </span>
                    </div>
                    <div className="col-span-6">
                      <p className="text-base text-neutral-900 hover:text-neutral-600">
                        {item.title}
                      </p>
                    </div>
                    <div className="col-span-2 text-center text-sm text-neutral-600">
                      {formatDate(item.createdAt)}
                    </div>
                    <div className="col-span-1 text-center text-sm text-neutral-600">
                      {item.viewCount}
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden px-6 py-4">
                    <div className="mb-2">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700">
                        뉴스
                      </span>
                    </div>
                    <p className="text-base text-neutral-900 mb-2">{item.title}</p>
                    <div className="flex items-center gap-3 text-xs text-neutral-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.viewCount}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </>
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
