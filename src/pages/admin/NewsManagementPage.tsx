import { Plus, Edit, Trash2, Eye } from 'lucide-react';

interface News {
  id: string;
  title: string;
  category: string;
  author: string;
  publishDate: string;
  views: number;
  isPublished: boolean;
}

const mockNews: News[] = [
  {
    id: '1',
    title: 'POTENZA 신제품 출시 안내',
    category: '신제품',
    author: '관리자',
    publishDate: '2026-02-01',
    views: 245,
    isPublished: true,
  },
  {
    id: '2',
    title: '2월 교육 일정 안내',
    category: '공지사항',
    author: '교육팀',
    publishDate: '2026-01-25',
    views: 189,
    isPublished: true,
  },
  {
    id: '3',
    title: 'ULTRAcel II 펌웨어 업데이트',
    category: '업데이트',
    author: '기술팀',
    publishDate: '2026-01-20',
    views: 156,
    isPublished: false,
  },
];

export function NewsManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl tracking-tight text-neutral-900">
          제이시스 뉴스 관리
        </h3>
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors">
          <Plus className="w-5 h-5" />
          <span>뉴스 작성</span>
        </button>
      </div>

      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  작성자
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  발행일
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  조회수
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {mockNews.map((news) => (
                <tr key={news.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900">
                      {news.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium">
                      {news.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {news.author}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {news.publishDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                    {news.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-medium ${
                      news.isPublished
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {news.isPublished ? '게시중' : '비공개'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 border border-neutral-300 text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 뉴스</div>
          <div className="text-2xl font-medium text-neutral-900">{mockNews.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">게시중</div>
          <div className="text-2xl font-medium text-green-600">
            {mockNews.filter((n) => n.isPublished).length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">총 조회수</div>
          <div className="text-2xl font-medium text-neutral-900">
            {mockNews.reduce((sum, n) => sum + n.views, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
