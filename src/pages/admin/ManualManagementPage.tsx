import { Plus, FileText, Download, Edit, Trash2 } from 'lucide-react';

interface Manual {
  id: string;
  title: string;
  category: string;
  fileSize: string;
  uploadDate: string;
  downloads: number;
}

const mockManuals: Manual[] = [
  {
    id: '1',
    title: 'POTENZA 사용 설명서 v2.1',
    category: 'POTENZA',
    fileSize: '12.5 MB',
    uploadDate: '2026-01-15',
    downloads: 145,
  },
  {
    id: '2',
    title: 'ULTRAcel II 매뉴얼',
    category: 'ULTRAcel II',
    fileSize: '8.3 MB',
    uploadDate: '2026-01-10',
    downloads: 98,
  },
  {
    id: '3',
    title: 'LinearZ 제품 가이드',
    category: 'LinearZ',
    fileSize: '5.7 MB',
    uploadDate: '2025-12-20',
    downloads: 67,
  },
];

export function ManualManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl tracking-tight text-neutral-900">
          메뉴얼 관리
        </h3>
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors">
          <Plus className="w-5 h-5" />
          <span>메뉴얼 등록</span>
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
                  파일크기
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  업로드일
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  다운로드
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {mockManuals.map((manual) => (
                <tr key={manual.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-neutral-900">
                        {manual.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium">
                      {manual.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {manual.fileSize}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {manual.uploadDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                    {manual.downloads}회
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors">
                        <Download className="w-4 h-4" />
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

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 메뉴얼</div>
          <div className="text-2xl font-medium text-neutral-900">{mockManuals.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">총 다운로드</div>
          <div className="text-2xl font-medium text-neutral-900">
            {mockManuals.reduce((sum, m) => sum + m.downloads, 0)}회
          </div>
        </div>
      </div>
    </div>
  );
}
