import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, X, Save, Paperclip, Upload } from 'lucide-react';
import { postService, Post } from '../../services/postService';
import { formatDate } from '../../lib/utils';
import { useModal } from '../../context/ModalContext';
import { supabase } from '../../lib/supabaseClient';
import { RichTextEditor } from '../../components/ui/RichTextEditor';

export function NewsManagementPage() {
  const { alert: globalAlert, confirm: globalConfirm } = useModal();
  const [newsList, setNewsList] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    isVisible: true,
  });
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      const data = await postService.getPosts('news');
      setNewsList(data);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (news?: Post) => {
    if (news) {
      setEditingNews(news);
      setFormData({
        title: news.title,
        content: news.content || '',
        image_url: news.imageUrl || '',
        isVisible: news.isVisible,
      });
    } else {
      setEditingNews(null);
      setFormData({
        title: '',
        content: '',
        image_url: '',
        isVisible: true,
      });
    }
    setAttachFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNews(null);
  };

  const uploadAttachment = async (): Promise<string> => {
    if (!attachFile) return formData.image_url;
    setUploading(true);
    try {
      const ext = attachFile.name.split('.').pop();
      const path = `news/${Date.now()}_${attachFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error } = await supabase.storage
        .from('marketing')
        .upload(path, attachFile, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('marketing')
        .getPublicUrl(path);
      return publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fileUrl = await uploadAttachment();
      if (editingNews) {
        await postService.updatePost(editingNews.id, {
          title: formData.title,
          content: formData.content,
          image_url: fileUrl,
          isVisible: formData.isVisible,
        });
      } else {
        await postService.createPost({
          type: 'news',
          title: formData.title,
          content: formData.content,
          image_url: fileUrl,
          isVisible: formData.isVisible,
        });
      }
      fetchNews();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save news:', error);
      await globalAlert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await globalConfirm('정말로 이 뉴스를 삭제하시겠습니까?'))) return;
    try {
      await postService.deletePost(id);
      fetchNews();
    } catch (error) {
      console.error('Failed to delete news:', error);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl tracking-tight text-neutral-900">
          제이시스 뉴스 관리
        </h3>
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
        >
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
                  작성일
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
              ) : newsList.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-neutral-500 text-sm">등록된 뉴스가 없습니다.</td></tr>
              ) : (
                newsList.map((news) => (
                  <tr key={news.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-neutral-900">
                        {news.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {formatDate(news.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {news.viewCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium ${
                        news.isVisible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {news.isVisible ? '게시중' : '비공개'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenModal(news)}
                          className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(news.id)}
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
          <div className="text-xs text-neutral-600 mb-1">전체 뉴스</div>
          <div className="text-2xl font-medium text-neutral-900">{newsList.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">게시중</div>
          <div className="text-2xl font-medium text-green-600">
            {newsList.filter((n) => n.isVisible).length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">총 조회수</div>
          <div className="text-2xl font-medium text-neutral-900">
            {newsList.reduce((sum, n) => sum + n.viewCount, 0)}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h4 className="font-medium text-neutral-900">{editingNews ? '뉴스 수정' : '신규 뉴스 등록'}</h4>
              <button onClick={handleCloseModal} className="text-neutral-500 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">뉴스 제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">첨부파일</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setAttachFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      {attachFile ? attachFile.name : '파일 선택'}
                    </button>
                    {!attachFile && formData.image_url && (
                      <a
                        href={formData.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                      >
                        <Paperclip className="w-3 h-3" />
                        현재 첨부파일 보기
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isVisible"
                      checked={formData.isVisible}
                      onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                      className="w-4 h-4 text-neutral-900 border-neutral-300 rounded"
                    />
                    <label htmlFor="isVisible" className="text-sm text-neutral-700">사이트에 노출함</label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">뉴스 본문</label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                  placeholder="뉴스 본문을 입력하세요..."
                  minHeight="320px"
                />
              </div>
            </form>
            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 bg-neutral-50">
              <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900">취소</button>
              <button onClick={handleSubmit} disabled={uploading} className="px-4 py-2 bg-neutral-900 text-white rounded text-sm font-medium hover:bg-neutral-800 flex items-center gap-2 disabled:opacity-60">
                <Save className="w-4 h-4" /> {uploading ? '업로드 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
