import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Settings } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { postService, Post, faqCategoryService, FaqCategory } from '../../services/postService';
import { formatDate } from '../../lib/utils';

export function FaqManagementPage() {
  const [faqs, setFaqs] = useState<Post[]>([]);
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    isVisible: true,
  });

  // Category Manager State
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [faqsData, categoriesData] = await Promise.all([
        postService.getPosts('faq'),
        faqCategoryService.getCategories()
      ]);
      setFaqs(faqsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setCategories(categoriesData);

      // key-value pair for defaults? 
      // Not needed, we use categoriesData for dropdown
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
        category: faq.category || (categories[0]?.id || 'member'),
        isVisible: faq.isVisible,
      });
    } else {
      setEditingFaq(null);
      setFormData({
        title: '',
        content: '',
        category: categories[0]?.id || 'member',
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
      fetchData(); // Refresh both to be safe
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
      fetchData();
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
    }
  };

  // Category Management Handlers
  const handleAddCategory = async () => {
    if (!newCategoryLabel.trim()) return;
    try {
      // Generate ID from label (simple logic for now, or allow user to input)
      // Since existing ones are English IDs like 'member', let's try to stick to a convention or just use random/timestamp
      // But for backward compat, maybe we just use UUID or Timestamp string
      const id = 'cat_' + Date.now();
      await faqCategoryService.createCategory(id, newCategoryLabel);
      setNewCategoryLabel('');
      setIsAddingCategory(false);
      fetchData();
    } catch (error) {
      console.error("Failed to create category", error);
      alert("카테고리 생성 실패");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;
    // Check usage
    const isUsed = faqs.some(f => f.category === id);
    if (isUsed) {
      alert('사용 중인 카테고리는 삭제할 수 없습니다.');
      return;
    }

    try {
      await faqCategoryService.deleteCategory(id);
      fetchData();
    } catch (error) {
      console.error("Failed to delete category", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl tracking-tight text-neutral-900">
          FAQ 관리
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>분류 관리</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>FAQ 등록</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">No</TableHead>
              <TableHead className="w-[120px] text-center">분류</TableHead>
              <TableHead>질문</TableHead>
              <TableHead className="w-[100px] text-center">상태</TableHead>
              <TableHead className="w-[120px] text-center">등록일</TableHead>
              <TableHead className="w-[100px] text-center">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : faqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  등록된 FAQ가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              faqs.map((faq, index) => {
                const category = categories.find(c => c.id === faq.category);
                return (
                  <TableRow key={faq.id}>
                    <TableCell className="text-center font-medium">
                      {faqs.length - index}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex px-2 py-1 rounded bg-neutral-100 text-neutral-600 text-xs">
                        {category?.label || faq.category || '기타'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-neutral-900">
                        {faq.title}
                      </div>
                      {faq.content && (
                        <div className="text-sm text-neutral-500 mt-1 line-clamp-1">
                          {faq.content}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${faq.isVisible
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                        }`}>
                        {faq.isVisible ? '게시중' : '비공개'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-neutral-500 text-sm">
                      {formatDate(faq.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(faq)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* FAQ Modal */}
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
                  <option value="" disabled>분류 선택</option>
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

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h4 className="font-medium text-neutral-900">FAQ 분류 관리</h4>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-neutral-500 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="border border-neutral-200 rounded-md divide-y divide-neutral-200 mb-6">
                {categories.length === 0 ? (
                  <div className="p-4 text-center text-sm text-neutral-500">카테고리가 없습니다</div>
                ) : (
                  categories.map((cat, idx) => (
                    <div key={cat.id} className="p-3 flex items-center justify-between bg-white hover:bg-neutral-50">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-400 w-6">{idx + 1}</span>
                        <span className="text-sm font-medium text-neutral-900">{cat.label}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-neutral-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {isAddingCategory ? (
                <div className="flex flex-col gap-3 p-3 bg-neutral-50 rounded border border-neutral-200">
                  <input
                    type="text"
                    value={newCategoryLabel}
                    onChange={(e) => setNewCategoryLabel(e.target.value)}
                    placeholder="분류명 입력"
                    className="px-3 py-2 border border-neutral-300 rounded text-sm w-full"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsAddingCategory(false)}
                      className="px-3 py-1.5 text-xs border border-neutral-300 rounded hover:bg-white"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleAddCategory}
                      disabled={!newCategoryLabel.trim()}
                      className="px-3 py-1.5 text-xs bg-neutral-900 text-white rounded hover:bg-neutral-800 disabled:opacity-50"
                    >
                      추가
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="w-full py-2 border border-dashed border-neutral-300 rounded text-sm text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> 새 분류 추가
                </button>
              )}
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 bg-neutral-900 text-white rounded text-sm font-medium hover:bg-neutral-800"
              >
                닫기
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
          <li>• '분류 관리'를 통해 질문 카테고리를 추가/삭제할 수 있습니다.</li>
          <li>• 순서 번호로 FAQ 표시 순서를 조정할 수 있습니다</li>
          <li>• 비공개 설정 시 사용자 화면에 표시되지 않습니다</li>
        </ul>
      </div>
    </div>
  );
}
