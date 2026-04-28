import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Pencil, Trash2, Loader2, X, Upload, Monitor } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

interface Equipment {
  id: string;
  model_name: string;
  code: string;
  category: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  'AcGen', 'DENSITY', 'DLiv', 'INTRAcel', 'IntraGen', 'LinearFirm',
  'LinearZ', 'POTENZA', 'ULTRAcel II', 'Volnewmer', '기타'
];

const emptyForm = {
  model_name: '',
  code: '',
  category: '',
  image_url: '',
  is_active: true,
};

export function EquipmentManagementPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Equipment | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEquipments();
  }, []);

  const loadEquipments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .order('model_name');
      if (error) throw error;
      setEquipments(data || []);
    } catch (e) {
      console.error(e);
      toast.error('장비 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm });
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (eq: Equipment) => {
    setEditTarget(eq);
    setForm({
      model_name: eq.model_name,
      code: eq.code,
      category: eq.category,
      image_url: eq.image_url || '',
      is_active: eq.is_active ?? true,
    });
    setImageFile(null);
    setImagePreview(eq.image_url || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageChange = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImageChange(file);
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return form.image_url;
    setUploading(true);
    try {
      const ext = imageFile.name.split('.').pop();
      const path = `equipments/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, imageFile, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(path);
      return urlData.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.model_name.trim()) { toast.error('장비명을 입력해주세요.'); return; }
    if (!form.code.trim()) { toast.error('상품코드(SKU)를 입력해주세요.'); return; }
    if (!form.category) { toast.error('카테고리를 선택해주세요.'); return; }

    setSaving(true);
    try {
      let image_url = form.image_url;
      if (imageFile) image_url = await uploadImage();

      const payload = {
        model_name: form.model_name.trim(),
        code: form.code.trim(),
        category: form.category,
        image_url,
        is_active: form.is_active,
      };

      if (editTarget) {
        const { error } = await supabase.from('equipments').update(payload).eq('id', editTarget.id);
        if (error) throw error;
        toast.success('장비 정보가 수정되었습니다.');
      } else {
        const { error } = await supabase.from('equipments').insert(payload);
        if (error) throw error;
        toast.success('장비가 등록되었습니다.');
      }
      closeModal();
      await loadEquipments();
    } catch (e: any) {
      console.error(e);
      toast.error(`저장 실패: ${e.message || '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eq: Equipment) => {
    if (!confirm(`"${eq.model_name}" 장비를 삭제할까요?\n삭제 시 관련 데이터에 영향을 줄 수 있습니다.`)) return;
    try {
      const { error } = await supabase.from('equipments').delete().eq('id', eq.id);
      if (error) throw error;
      toast.success('장비가 삭제되었습니다.');
      await loadEquipments();
    } catch (e: any) {
      toast.error(`삭제 실패: ${e.message}`);
    }
  };

  const filtered = equipments.filter(eq =>
    eq.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-1">장비관리</h2>
          <p className="text-sm text-neutral-500">상품 등록 시 매핑되는 장비 목록을 관리합니다</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          장비 등록
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="장비명으로 검색"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 rounded-sm bg-white"
          />
        </div>
        <button className="px-5 py-2.5 bg-white border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors rounded-sm">
          검색
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-600 w-12">No</th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-600 w-20">이미지</th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-600">장비명</th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-600 w-32">카테고리</th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-600 w-20">상태</th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-600 w-28">등록일</th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-600 w-20 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Monitor className="w-10 h-10 mx-auto mb-3 text-neutral-200" />
                  <p className="text-sm text-neutral-400">등록된 장비가 없습니다.</p>
                </td>
              </tr>
            ) : (
              filtered.map((eq, idx) => (
                <tr key={eq.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-neutral-500">{idx + 1}</td>
                  <td className="px-4 py-4">
                    {eq.image_url ? (
                      <img
                        src={eq.image_url}
                        alt={eq.model_name}
                        className="w-14 h-14 object-contain border border-neutral-100 rounded bg-white"
                      />
                    ) : (
                      <div className="w-14 h-14 flex items-center justify-center bg-neutral-100 border border-neutral-200 rounded">
                        <Monitor className="w-5 h-5 text-neutral-300" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-neutral-900">{eq.model_name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{eq.code}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-700">{eq.category}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      eq.is_active !== false
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                    }`}>
                      {eq.is_active !== false ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-500">
                    {eq.created_at ? new Date(eq.created_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(eq)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                        title="수정"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(eq)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="삭제"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">
                {editTarget ? '장비 수정' : '장비 등록'}
              </h3>
              <button onClick={closeModal} className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {/* 장비명 */}
              <div>
                <label className="block text-sm font-medium text-neutral-800 mb-1.5">
                  장비명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.model_name}
                  onChange={e => setForm(f => ({ ...f, model_name: e.target.value }))}
                  placeholder="장비명을 입력하세요"
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-neutral-800 mb-1.5">
                  상품코드(SKU) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  placeholder="상품코드(SKU)를 입력하세요"
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-neutral-800 mb-1.5">
                  상품 카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white appearance-none"
                >
                  <option value="">카테고리를 선택하세요</option>
                  {CATEGORY_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-neutral-800 mb-1.5">이미지</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleImageChange(file);
                  }}
                />
                {imagePreview ? (
                  <div className="relative border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 flex items-center justify-center h-36">
                    <img src={imagePreview} alt="preview" className="max-h-32 object-contain" />
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(''); setForm(f => ({ ...f, image_url: '' })); }}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow text-neutral-500 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    className="border-2 border-dashed border-neutral-200 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-neutral-300 mb-2" />
                    <p className="text-sm font-medium text-neutral-500">클릭하거나 이미지를 드래그해서 업로드</p>
                    <p className="text-xs text-neutral-400 mt-1">JPG, PNG, GIF, WEBP / 최대 10MB</p>
                  </div>
                )}
              </div>

              {/* 활성화 */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="is_active" className="text-sm text-neutral-700 cursor-pointer">활성화</label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50 rounded-b-xl">
              <button
                onClick={closeModal}
                className="px-5 py-2 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {(saving || uploading) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
