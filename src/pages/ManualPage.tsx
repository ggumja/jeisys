import { useState, useEffect } from 'react';
import { FileText, Download, Search } from 'lucide-react';
import { postService, Post } from '../services/postService';
import { formatDate } from '../lib/utils';

export function ManualPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [manuals, setManuals] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchManuals();
  }, []);

  const fetchManuals = async () => {
    try {
      setIsLoading(true);
      const data = await postService.getPosts('manual');
      setManuals(data.filter(m => m.isVisible));
    } catch (error) {
      console.error('Failed to fetch manuals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    '전체',
    'POTENZA',
    'ULTRAcel II',
    'LIPOcel II',
    'LinearZ',
    'LinearFirm',
    'INTRAcel',
    'IntraGen',
    'Density',
    'DLiv',
  ];

  const filteredManuals = manuals.filter((manual) => {
    // For now, assume category might be in title prefix like [Density] or we just show all.
    const matchesSearch =
      searchQuery === '' ||
      manual.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDownload = (manual: Post) => {
    if (manual.imageUrl) {
      window.open(manual.imageUrl, '_blank');
    } else {
      alert('매뉴얼 파일이 등록되지 않았습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
          제품 메뉴얼
        </h2>
        <p className="text-sm text-neutral-600">
          제이시스메디칼 장비의 사용자 매뉴얼을 다운로드하세요
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="매뉴얼 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
        />
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

      {/* Manual List */}
      <div className="bg-white border border-neutral-200">
        {/* Header */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 border-b border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-700">
          <div className="col-span-2 text-center">카테고리</div>
          <div className="col-span-7">제목</div>
          <div className="col-span-2 text-center">업데이트</div>
          <div className="col-span-1 text-center">다운로드</div>
        </div>

        {/* List */}
        <div className="divide-y divide-neutral-200">
          {isLoading ? (
            <div className="py-16 text-center text-neutral-500">로딩 중...</div>
          ) : filteredManuals.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600">
                {searchQuery
                  ? '검색 결과가 없습니다'
                  : '등록된 매뉴얼이 없습니다'}
              </p>
            </div>
          ) : (
            filteredManuals.map((manual) => (
              <div key={manual.id}>
                {/* Desktop */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-neutral-50 transition-colors">
                  <div className="col-span-2 text-center">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium">
                      공통
                    </span>
                  </div>
                  <div className="col-span-7">
                    <p className="text-base text-neutral-900 mb-1">
                      {manual.title}
                    </p>
                  </div>
                  <div className="col-span-2 text-center text-sm text-neutral-600">
                    {formatDate(manual.createdAt)}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => handleDownload(manual)}
                      className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                      title="다운로드"
                    >
                      <Download className="w-5 h-5 text-neutral-700" />
                    </button>
                  </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden px-6 py-4 hover:bg-neutral-50 transition-colors">
                  <p className="text-base text-neutral-900 mb-1">
                    {manual.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-neutral-600">
                      <span>{formatDate(manual.createdAt)}</span>
                    </div>
                    <button
                      onClick={() => handleDownload(manual)}
                      className="flex items-center gap-1 px-3 py-2 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors text-xs"
                    >
                      <Download className="w-3 h-3" />
                      다운로드
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-6 bg-neutral-50 border border-neutral-200">
        <h3 className="text-sm font-medium text-neutral-900 mb-3">안내사항</h3>
        <ul className="text-sm text-neutral-600 space-y-2">
          <li>• 최신 버전의 매뉴얼을 다운로드하여 사용하시기 바랍니다.</li>
          <li>
            • 매뉴얼은 PDF 형식으로 제공되며, Adobe Reader 또는 PDF 뷰어가
            필요합니다.
          </li>
          <li>
            • 구버전 매뉴얼이 필요하신 경우 고객센터(070-7435-4927)로 문의해
            주세요.
          </li>
          <li>• 매뉴얼 내용 관련 문의는 1:1 문의게시판을 이용해 주세요.</li>
        </ul>
      </div>
    </div>
  );
}
