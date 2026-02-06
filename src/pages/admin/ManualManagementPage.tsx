import { useState, useEffect } from 'react';
import { Plus, FileText, Download, Edit, Trash2, Eye, EyeOff, X, Save, Link as LinkIcon } from 'lucide-react';
import { postService, Post } from '../../services/postService';
import { formatDate } from '../../lib/utils';

export function ManualManagementPage() {
  const [manuals, setManuals] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManual, setEditingManual] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    isVisible: true,
  });

  useEffect(() => {
    fetchManuals();
  }, []);

  const fetchManuals = async () => {
    try {
      setIsLoading(true);
      const data = await postService.getPosts('manual');
      setManuals(data);
    } catch (error) {
      console.error('Failed to fetch manuals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (manual?: Post) => {
    if (manual) {
      setEditingManual(manual);
      setFormData({
        title: manual.title,
        content: manual.content || '',
        image_url: manual.imageUrl || '',
        isVisible: manual.isVisible,
      });
    } else {
      setEditingManual(null);
      setFormData({
        title: '',
        content: '',
        image_url: '',
        isVisible: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingManual(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingManual) {
        await postService.updatePost(editingManual.id, {
          title: formData.title,
          content: formData.content,
          image_url: formData.image_url,
          isVisible: formData.isVisible,
        });
      } else {
        await postService.createPost({
          type: 'manual',
          title: formData.title,
          content: formData.content,
          image_url: formData.image_url,
          isVisible: formData.isVisible,
        });
      }
      fetchManuals();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save manual:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 매뉴얼을 삭제하시겠습니까?')) return;
    try {
      await postService.deletePost(id);
      fetchManuals();
    } catch (error) {
      console.error('Failed to delete manual:', error);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl tracking-tight text-neutral-900">
          메뉴얼 관리
        </h3>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
        >
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
                  상태
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  파일연결
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  등록일
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-neutral-500 text-sm">로딩 중...</td></tr>
              ) : manuals.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-neutral-500 text-sm">등록된 매뉴얼이 없습니다.</td></tr>
              ) : (
                manuals.map((manual) => (
                  <tr key={manual.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {manual.isVisible ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <Eye className="w-3 h-3" /> 노출
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-400 text-xs font-medium rounded-full">
                          <EyeOff className="w-3 h-3" /> 숨김
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-neutral-900">
                          {manual.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {manual.imageUrl ? (
                        <a href={manual.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" /> 파일보기
                        </a>
                      ) : (
                        <span className="text-xs text-neutral-400">파일없음</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {formatDate(manual.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleOpenModal(manual)} className="text-neutral-600 hover:text-neutral-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(manual.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 메뉴얼</div>
          <div className="text-2xl font-medium text-neutral-900">{manuals.length}</div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h4 className="font-medium text-neutral-900">{editingManual ? '매뉴얼 수정' : '신규 매뉴얼 등록'}</h4>
              <button onClick={handleCloseModal} className="text-neutral-500 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">매뉴얼명 (제목)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">파일 URL (PDF 등)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full pl-12 pr-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isVisibleManual"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                  className="w-4 h-4 text-neutral-900 border-neutral-300 rounded"
                />
                <label htmlFor="isVisibleManual" className="text-sm text-neutral-700">사이트에 노출함</label>
              </div>
            </form>
            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 bg-neutral-50">
              <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900">취소</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-neutral-900 text-white rounded text-sm font-medium hover:bg-neutral-800 flex items-center gap-2">
                <Save className="w-4 h-4" /> 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
