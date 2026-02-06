import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Play, Eye, EyeOff, X, Save, Link as LinkIcon } from 'lucide-react';
import { postService, Post } from '../../services/postService';
import { formatDate } from '../../lib/utils';

export function MediaManagementPage() {
  const [mediaList, setMediaList] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    isVisible: true,
  });

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      const data = await postService.getPosts('media');
      setMediaList(data);
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (media?: Post) => {
    if (media) {
      setEditingMedia(media);
      setFormData({
        title: media.title,
        image_url: media.imageUrl || '',
        isVisible: media.isVisible,
      });
    } else {
      setEditingMedia(null);
      setFormData({
        title: '',
        image_url: '',
        isVisible: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMedia(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMedia) {
        await postService.updatePost(editingMedia.id, {
          title: formData.title,
          image_url: formData.image_url,
          isVisible: formData.isVisible,
        });
      } else {
        await postService.createPost({
          type: 'media',
          title: formData.title,
          image_url: formData.image_url,
          isVisible: formData.isVisible,
        });
      }
      fetchMedia();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save media:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 영상을 삭제하시겠습니까?')) return;
    try {
      await postService.deletePost(id);
      fetchMedia();
    } catch (error) {
      console.error('Failed to delete media:', error);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl tracking-tight text-neutral-900">
          제이시스 미디어 관리
        </h3>
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
        >
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
                  등록일
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
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-neutral-500 text-sm">로딩 중...</td></tr>
              ) : mediaList.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-neutral-500 text-sm">등록된 미디어가 없습니다.</td></tr>
              ) : (
                mediaList.map((media) => (
                  <tr key={media.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-100 rounded flex items-center justify-center overflow-hidden">
                          {media.imageUrl ? (
                            <img src={media.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Play className="w-5 h-5 text-neutral-600" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-neutral-900">
                          {media.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {formatDate(media.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {media.viewCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium ${
                        media.isVisible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {media.isVisible ? '게시중' : '비공개'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenModal(media)}
                          className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(media.id)}
                          className="p-2 border border-neutral-300 text-red-600 hover:bg-red-50 transition-colors"
                        >
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

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 미디어</div>
          <div className="text-2xl font-medium text-neutral-900">{mediaList.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">게시중</div>
          <div className="text-2xl font-medium text-green-600">
            {mediaList.filter((m) => m.isVisible).length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">총 조회수</div>
          <div className="text-2xl font-medium text-neutral-900">
            {mediaList.reduce((sum, m) => sum + m.viewCount, 0)}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h4 className="font-medium text-neutral-900">{editingMedia ? '미디어 수정' : '신규 미디어 등록'}</h4>
              <button onClick={handleCloseModal} className="text-neutral-500 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">미디어 제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">썸네일/영상 URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isVisibleMedia"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                  className="w-4 h-4 text-neutral-900 border-neutral-300 rounded"
                />
                <label htmlFor="isVisibleMedia" className="text-sm text-neutral-700">사이트에 노출함</label>
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
