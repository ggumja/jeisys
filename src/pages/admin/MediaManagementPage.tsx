import { Plus, Edit, Trash2, Play } from 'lucide-react';

interface Media {
  id: string;
  title: string;
  category: string;
  duration: string;
  uploadDate: string;
  views: number;
  isPublished: boolean;
}

const mockMedia: Media[] = [
  {
    id: '1',
    title: 'POTENZA 시술 가이드',
    category: 'POTENZA',
    duration: '12:35',
    uploadDate: '2026-01-28',
    views: 432,
    isPublished: true,
  },
  {
    id: '2',
    title: 'ULTRAcel II 사용법',
    category: 'ULTRAcel II',
    duration: '08:42',
    uploadDate: '2026-01-22',
    views: 356,
    isPublished: true,
  },
  {
    id: '3',
    title: 'LinearZ 프로토콜',
    category: 'LinearZ',
    duration: '15:20',
    uploadDate: '2026-01-18',
    views: 278,
    isPublished: false,
  },
];

export function MediaManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl tracking-tight text-neutral-900">
          제이시스 미디어 관리
        </h3>
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors">
          <Plus className="w-5 h-5" />
          <span>미디어 등록</span>
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
                  재생시간
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  업로드일
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
              {mockMedia.map((media) => (
                <tr key={media.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded flex items-center justify-center">
                        <Play className="w-5 h-5 text-neutral-600" />
                      </div>
                      <span className="text-sm font-medium text-neutral-900">
                        {media.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium">
                      {media.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {media.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {media.uploadDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                    {media.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-medium ${
                      media.isPublished
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {media.isPublished ? '게시중' : '비공개'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors">
                        <Play className="w-4 h-4" />
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
          <div className="text-xs text-neutral-600 mb-1">전체 미디어</div>
          <div className="text-2xl font-medium text-neutral-900">{mockMedia.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">게시중</div>
          <div className="text-2xl font-medium text-green-600">
            {mockMedia.filter((m) => m.isPublished).length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">총 조회수</div>
          <div className="text-2xl font-medium text-neutral-900">
            {mockMedia.reduce((sum, m) => sum + m.views, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
