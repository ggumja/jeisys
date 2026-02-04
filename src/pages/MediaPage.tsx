import { useState } from 'react';
import { Youtube, Instagram, FileText, Facebook, ExternalLink } from 'lucide-react';

interface MediaPost {
  id: string;
  platform: 'youtube' | 'instagram' | 'blog' | 'facebook';
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  date: string;
}

const platforms = [
  { id: 'all', label: '전체', icon: null },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
];

const mediaPosts: MediaPost[] = [
  {
    id: '1',
    platform: 'youtube',
    title: 'POTENZA 장비 소개 및 시술 가이드',
    description: '최신 RF 마이크로니들 장비 POTENZA의 특징과 효과적인 시술 방법을 소개합니다.',
    imageUrl: 'https://images.unsplash.com/photo-1632931612792-fbaacfd952f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0dWJlJTIwdmlkZW8lMjB0aHVtYm5haWwlMjBtZWRpY2FsJTIwZGV2aWNlfGVufDF8fHx8MTc2OTcxMDIwMXww&ixlib=rb-4.1.0&q=80&w=1080',
    link: 'https://www.youtube.com/@제이시스메디칼',
    date: '2026-01-25',
  },
  {
    id: '2',
    platform: 'instagram',
    title: '신제품 ULTRAcel II 런칭 이벤트',
    description: '차세대 HIFU 장비 ULTRAcel II 출시 기념 특별 프로모션을 진행합니다.',
    imageUrl: 'https://images.unsplash.com/photo-1621184078903-6bfe9482d935?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnN0YWdyYW0lMjBzb2NpYWwlMjBtZWRpYSUyMHBvc3R8ZW58MXx8fHwxNzY5NzAxNDI0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    link: 'https://www.instagram.com/',
    date: '2026-01-28',
  },
  {
    id: '3',
    platform: 'blog',
    title: 'RF 마이크로니들의 모든 것',
    description: 'RF 마이크로니들의 원리부터 효과, 시술 시 주의사항까지 상세히 알아봅니다.',
    imageUrl: 'https://images.unsplash.com/photo-1565489030990-e211075fe11c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibG9nJTIwYXJ0aWNsZSUyMHdyaXRpbmd8ZW58MXx8fHwxNzY5NjI1OTQyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    link: 'https://blog.naver.com/',
    date: '2026-01-26',
  },
  {
    id: '4',
    platform: 'facebook',
    title: '제이시스메디칼 고객 후기 모음',
    description: '전국 피부과/성형외과에서 제이시스 장비를 사용하시는 원장님들의 생생한 후기를 만나보세요.',
    imageUrl: 'https://images.unsplash.com/photo-1601141586963-f213d2575b7f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYWNlYm9vayUyMHNvY2lhbCUyMG1lZGlhfGVufDF8fHx8MTc2OTcxMDIwMnww&ixlib=rb-4.1.0&q=80&w=1080',
    link: 'https://www.facebook.com/',
    date: '2026-01-24',
  },
  {
    id: '5',
    platform: 'youtube',
    title: 'LinearZ 장비 활용 팁',
    description: 'LinearZ를 활용한 다양한 시술 케이스와 노하우를 공유합니다.',
    imageUrl: 'https://images.unsplash.com/photo-1632931612792-fbaacfd952f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0dWJlJTIwdmlkZW8lMjB0aHVtYm5haWwlMjBtZWRpY2FsJTIwZGV2aWNlfGVufDF8fHx8MTc2OTcxMDIwMXww&ixlib=rb-4.1.0&q=80&w=1080',
    link: 'https://www.youtube.com/@제이시스메디칼',
    date: '2026-01-22',
  },
  {
    id: '6',
    platform: 'blog',
    title: '2026 피부미용 트렌드',
    description: '2026년 피부미용 시장의 주요 트렌드와 제이시스메디칼의 대응 전략을 소개합니다.',
    imageUrl: 'https://images.unsplash.com/photo-1565489030990-e211075fe11c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibG9nJTIwYXJ0aWNsZSUyMHdyaXRpbmd8ZW58MXx8fHwxNzY5NjI1OTQyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    link: 'https://blog.naver.com/',
    date: '2026-01-20',
  },
  {
    id: '7',
    platform: 'instagram',
    title: '제이시스 장비 라인업 소개',
    description: 'Density부터 IntraGen까지, 제이시스메디칼의 전체 장비 라인업을 한눈에 확인하세요.',
    imageUrl: 'https://images.unsplash.com/photo-1621184078903-6bfe9482d935?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnN0YWdyYW0lMjBzb2NpYWwlMjBtZWRpYSUyMHBvc3R8ZW58MXx8fHwxNzY5NzAxNDI0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    link: 'https://www.instagram.com/',
    date: '2026-01-18',
  },
  {
    id: '8',
    platform: 'facebook',
    title: '제이시스메디칼 교육 프로그램 안내',
    description: '의료진을 위한 전문 교육 프로그램을 운영하고 있습니다. 교육 일정을 확인해보세요.',
    imageUrl: 'https://images.unsplash.com/photo-1601141586963-f213d2575b7f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYWNlYm9vayUyMHNvY2lhbCUyMG1lZGlhfGVufDF8fHx8MTc2OTcxMDIwMnww&ixlib=rb-4.1.0&q=80&w=1080',
    link: 'https://www.facebook.com/',
    date: '2026-01-15',
  },
];

export function MediaPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const filteredPosts =
    selectedPlatform === 'all'
      ? mediaPosts
      : mediaPosts.filter((post) => post.platform === selectedPlatform);

  const getPlatformIcon = (platform: MediaPost['platform']) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-5 h-5" />;
      case 'instagram':
        return <Instagram className="w-5 h-5" />;
      case 'blog':
        return <FileText className="w-5 h-5" />;
      case 'facebook':
        return <Facebook className="w-5 h-5" />;
    }
  };

  const getPlatformColor = (platform: MediaPost['platform']) => {
    switch (platform) {
      case 'youtube':
        return 'bg-red-100 text-red-700';
      case 'instagram':
        return 'bg-pink-100 text-pink-700';
      case 'blog':
        return 'bg-green-100 text-green-700';
      case 'facebook':
        return 'bg-blue-100 text-blue-700';
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
        {filteredPosts.map((post) => (
          <a
            key={post.id}
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white border border-neutral-200 overflow-hidden hover:shadow-lg transition-all"
          >
            {/* Image */}
            <div className="relative aspect-video overflow-hidden bg-neutral-100">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div
                className={`absolute top-4 left-4 px-3 py-1 rounded-full flex items-center gap-2 ${getPlatformColor(
                  post.platform
                )}`}
              >
                {getPlatformIcon(post.platform)}
                <span className="text-xs font-medium capitalize">
                  {post.platform}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-base font-medium text-neutral-900 mb-2 group-hover:text-neutral-600 transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                {post.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">{post.date}</span>
                <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
              </div>
            </div>
          </a>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="py-16 text-center bg-white border border-neutral-200">
          <p className="text-neutral-600">
            해당 플랫폼의 포스트가 없습니다
          </p>
        </div>
      )}

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