import { useState, useEffect } from 'react';
import { Youtube, Instagram, FileText, Facebook, ExternalLink } from 'lucide-react';
import { postService, Post } from '../services/postService';
import { formatDate } from '../lib/utils';

const platforms = [
  { id: 'all', label: '전체', icon: null },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
];

export function MediaPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [mediaPosts, setMediaPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      const data = await postService.getPosts('media');
      setMediaPosts(data.filter(m => m.isVisible));
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts =
    selectedPlatform === 'all'
      ? mediaPosts
      : mediaPosts.filter((post) => post.imageUrl?.includes(selectedPlatform)); 
      // Note: Assuming platform might be part of image/link or metadata. 
      // For now, I'll just map them.

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-5 h-5" />;
      case 'instagram':
        return <Instagram className="w-5 h-5" />;
      case 'blog':
        return <FileText className="w-5 h-5" />;
      case 'facebook':
        return <Facebook className="w-5 h-5" />;
      default:
        return <ExternalLink className="w-5 h-5" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return 'bg-red-100 text-red-700';
      case 'instagram':
        return 'bg-pink-100 text-pink-700';
      case 'blog':
        return 'bg-green-100 text-green-700';
      case 'facebook':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
          제이시스 미디어
        </h2>
        <p className="text-sm text-neutral-600">
          제이시스메디칼의 다양한 소식과 정보를 확인하세요
        </p>
      </div>

      {/* Platform Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              className={`flex items-center gap-2 px-5 py-3 border transition-colors ${
                selectedPlatform === platform.id
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-300 text-neutral-700 hover:border-neutral-900'
              }`}
            >
              {platform.icon && <platform.icon className="w-4 h-4" />}
              <span className="text-sm font-medium">{platform.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-neutral-500">로딩 중...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white border border-neutral-200">
            <p className="text-neutral-600">
              해당 플랫폼의 포스트가 없습니다
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <a
              key={post.id}
              href={post.imageUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white border border-neutral-200 overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Image */}
              <div className="relative aspect-video overflow-hidden bg-neutral-100">
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-12 h-12 text-neutral-300" />
                  </div>
                )}
                <div
                  className={`absolute top-4 left-4 px-3 py-1 rounded-full flex items-center gap-2 ${getPlatformColor(
                    'youtube'
                  )}`}
                >
                  {getPlatformIcon('youtube')}
                  <span className="text-xs font-medium capitalize">
                    Media
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-base font-medium text-neutral-900 mb-2 group-hover:text-neutral-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                  {post.content}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">{formatDate(post.createdAt)}</span>
                  <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                </div>
              </div>
            </a>
          )
        ))}
      </div>

      {/* Social Links */}
      <div className="mt-12 p-8 bg-neutral-900 text-white">
        <div className="text-center mb-6">
          <h2 className="text-2xl tracking-tight mb-2">
            제이시스메디칼 공식 채널
          </h2>
          <p className="text-neutral-400">
            더 많은 소식과 정보를 실시간으로 받아보세요
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="https://www.youtube.com/@제이시스메디칼"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 transition-colors"
          >
            <Youtube className="w-5 h-5" />
            <span>YouTube 구독하기</span>
          </a>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 transition-colors"
          >
            <Instagram className="w-5 h-5" />
            <span>Instagram 팔로우</span>
          </a>
          <a
            href="https://blog.naver.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span>Blog 방문하기</span>
          </a>
          <a
            href="https://www.facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Facebook className="w-5 h-5" />
            <span>Facebook 좋아요</span>
          </a>
        </div>
      </div>
    </div>
  );
}