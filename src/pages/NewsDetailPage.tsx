import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Calendar, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { postService, Post } from '../services/postService';
import { formatDate } from '../lib/utils';

export function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newsItem, setNewsItem] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchNewsDetail(id);
    }
  }, [id]);

  const fetchNewsDetail = async (newsId: string) => {
    try {
      setIsLoading(true);
      const data = await postService.getPostById(newsId);
      if (data && data.type === 'news') {
        setNewsItem(data);
        postService.incrementViewCount(newsId);
      } else {
        navigate('/communication/news');
      }
    } catch (error) {
      console.error('Failed to fetch news detail:', error);
      navigate('/communication/news');
    } finally {
      setIsLoading(false);
    }
  };

  const [prevPost] = useState<{ id: string; title: string } | null>(null);
  const [nextPost] = useState<{ id: string; title: string } | null>(null);

  if (isLoading) {
    return <div className="py-20 text-center text-neutral-500">로딩 중...</div>;
  }

  if (!newsItem) return null;

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
              className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700"
            >
              뉴스
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl tracking-tight text-neutral-900 mb-4">
            {newsItem.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(newsItem.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              조회 {newsItem.viewCount}
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
