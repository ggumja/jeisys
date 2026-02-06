import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Eye, EyeOff, X, Save } from 'lucide-react';
import { postService, Post } from '../../services/postService';
import { formatDate } from '../../lib/utils';

const categories = [
  { id: 'member', label: '회원관련' },
  { id: 'product', label: '상품관련' },
  { id: 'payment', label: '결제관련' },
  { id: 'delivery', label: '배송관련' },
  { id: 'point', label: '적립금관련' },
  { id: 'etc', label: '기타' },
];

export function FaqManagementPage() {
  const [faqs, setFaqs] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'member',
    isVisible: true,
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setIsLoading(true);
      const data = await postService.getPosts('faq');
      setFaqs(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (faq?: Post) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        title: faq.title,
        content: faq.content || '',
        category: faq.category || 'member',
        isVisible: faq.isVisible,
      });
    } else {
      setEditingFaq(null);
      setFormData({
        title: '',
        content: '',
        category: 'member',
        isVisible: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFaq(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        isVisible: formData.isVisible,
      };
      
      console.log('Submitting FAQ:', payload);

      if (editingFaq) {
        await postService.updatePost(editingFaq.id, payload);
      } else {
        await postService.createPost({
          type: 'faq',
          ...payload
        });
      }
      fetchFaqs();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save FAQ:', error);
      alert('저장 중 오류가 발생했습니다. 상세 내용은 콘솔을 확인해 주세요.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 FAQ를 삭제하시겠습니까?')) return;
    try {
      await postService.deletePost(id);
      fetchFaqs();
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl tracking-tight text-neutral-900">
          FAQ 관리
        </h3>
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>FAQ 등록</span>
        </button>
      </div>

      <div className="bg-white border border-neutral-200">
        <div className="divide-y divide-neutral-200">
          {isLoading ? (
            <div className="p-10 text-center text-neutral-500">로딩 중...</div>
          ) : faqs.length === 0 ? (
            <div className="p-10 text-center text-neutral-500">등록된 FAQ가 없습니다.</div>
          ) : (
            faqs.map((faq) => (
              <div key={faq.id} className="p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium">
                        {categories.find(c => c.id === faq.category)?.label || '기타'}
                      </span>
                      <span className={`inline-flex px-3 py-1 text-xs font-medium ${
                        faq.isVisible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {faq.isVisible ? '게시중' : '비공개'}
                      </span>
                      <span className="text-xs text-neutral-400">{formatDate(faq.createdAt)}</span>
                    </div>
                    <button
                      onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                      className="text-left w-full"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base font-medium text-neutral-900 flex-1">
                          Q. {faq.title}
                        </span>
                        {expandedId === faq.id ? (
                          <ChevronUp className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                    {expandedId === faq.id && (
                      <div className="mt-3 pl-4 border-l-2 border-neutral-200">
                        <p className="text-sm text-neutral-700 leading-relaxed">
                          A. {faq.content}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenModal(faq)}
                      className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(faq.id)}
                      className="p-2 border border-neutral-300 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h4 className="font-medium text-neutral-900">{editingFaq ? 'FAQ 수정' : '신규 FAQ 등록'}</h4>
              <button onClick={handleCloseModal} className="text-neutral-500 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">분류</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-neutral-900 outline-none text-sm bg-white"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">질문 (제목)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">답변 (내용)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-neutral-900 outline-none text-sm min-h-[200px]"
                  required
                />
              </div>
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

      <div className="bg-neutral-50 border border-neutral-200 p-6">
        <h3 className="text-sm font-medium text-neutral-900 mb-3">
          FAQ 관리 안내
        </h3>
        <ul className="text-sm text-neutral-600 space-y-2">
          <li>• 순서 번호로 FAQ 표시 순서를 조정할 수 있습니다</li>
          <li>• 비공개 설정 시 사용자 화면에 표시되지 않습니다</li>
          <li>• 카테고리별로 FAQ를 분류하여 관리할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
}
