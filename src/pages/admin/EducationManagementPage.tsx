import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Edit, Trash2, Users, ChevronLeft, ChevronRight, Loader2, ArrowLeft, FileText } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { adminService } from '../../services/adminService';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

interface EducationSchedule {
  id: string;
  date: string;
  equipment: string;
  time: string;
  location: string;
  capacity: number;
  enrolled: number;
  instructor: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: 'education' | 'seminar';
  description: string;
}

const equipmentOptions = [
  'Density', 'DLiv', 'POTENZA', 'INTRAcel', 'LinearZ',
  'LinearFirm', 'ULTRAcel II', 'LIPOcel II', 'IntraGen',
];

/** 등록/수정 전체 화면 폼 뷰 */
function ScheduleFormView({
  mode,
  initialData,
  onSave,
  onCancel,
  isSaving,
}: {
  mode: 'create' | 'edit';
  initialData: Omit<EducationSchedule, 'id'>;
  onSave: (data: Omit<EducationSchedule, 'id'>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </button>
        <h3 className="text-xl tracking-tight text-neutral-900">
          {mode === 'create' ? '신규 일정 등록' : '일정 정보 수정'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 카드 */}
        <div className="bg-white border border-neutral-200 p-6">
          <h4 className="text-sm font-semibold text-neutral-700 mb-4 pb-2 border-b border-neutral-100">
            기본 정보
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 구분 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">구분 <span className="text-red-500">*</span></label>
              <Select
                value={formData.type}
                onValueChange={(val: 'education' | 'seminar') =>
                  setFormData((prev) => ({ ...prev, type: val }))
                }
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="education">교육 일정</SelectItem>
                  <SelectItem value="seminar">세미나 일정</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 장비 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">장비 <span className="text-red-500">*</span></label>
              <Select
                value={formData.equipment}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, equipment: val }))
                }
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="장비 선택" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentOptions.map((eq) => (
                    <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 일자 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">일자 <span className="text-red-500">*</span></label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            {/* 시간대 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">시간대 <span className="text-red-500">*</span></label>
              <Input
                type="text"
                placeholder="예) 14:00 - 16:00"
                value={formData.time}
                onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                required
              />
            </div>

            {/* 장소 */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-neutral-700">장소 <span className="text-red-500">*</span></label>
              <Input
                type="text"
                placeholder="예) 본사 교육장 (서울 강남)"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                required
              />
            </div>

            {/* 모집 정원 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">모집 정원 (명) <span className="text-red-500">*</span></label>
              <Input
                type="number"
                min={1}
                value={formData.capacity}
                onChange={(e) => setFormData((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
                required
              />
            </div>

            {/* 신청 인원 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">신청 인원 (명)</label>
              <Input
                type="number"
                min={0}
                max={formData.capacity}
                value={formData.enrolled}
                onChange={(e) => setFormData((prev) => ({ ...prev, enrolled: Number(e.target.value) }))}
              />
            </div>

            {/* 강사명 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">강사명 <span className="text-red-500">*</span></label>
              <Input
                type="text"
                placeholder="홍길동 강사"
                value={formData.instructor}
                onChange={(e) => setFormData((prev) => ({ ...prev, instructor: e.target.value }))}
                required
              />
            </div>

            {/* 상태 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">상태 <span className="text-red-500">*</span></label>
              <Select
                value={formData.status}
                onValueChange={(val: EducationSchedule['status']) =>
                  setFormData((prev) => ({ ...prev, status: val }))
                }
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">예정</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 상세 내용 에디터 카드 */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-100">
            <FileText className="w-4 h-4 text-neutral-500" />
            <h4 className="text-sm font-semibold text-neutral-700">
              상세 내용
            </h4>
            <span className="text-xs text-neutral-400">(이미지 첨부 가능)</span>
          </div>
          <RichTextEditor
            value={formData.description}
            onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
            placeholder="교육 일정에 대한 상세 내용을 입력하세요. 이미지, 링크 등을 포함할 수 있습니다."
            minHeight="400px"
          />
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-6 py-2.5 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-white transition-colors text-sm font-medium hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#21358d' }}
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'create' ? '등록하기' : '저장하기'}
          </button>
        </div>
      </form>
    </div>
  );
}

/** 목록 뷰 */
export function EducationManagementPage() {
  const { alert: globalAlert, confirm: globalConfirm } = useModal();

  // DB에서 로드한 교육 일정 상태
  const [schedules, setSchedules] = useState<EducationSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // 페이징 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 폼 뷰 전환 상태 ('list' | 'create' | 'edit')
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingSchedule, setEditingSchedule] = useState<EducationSchedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 초기 폼 데이터
  const emptyFormData: Omit<EducationSchedule, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    equipment: equipmentOptions[0],
    time: '14:00 - 16:00',
    location: '',
    capacity: 10,
    enrolled: 0,
    instructor: '',
    status: 'scheduled',
    type: 'education',
    description: '',
  };

  // DB에서 목록 로드
  const loadSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getEducationSchedules();
      setSchedules(data);
    } catch (err: any) {
      console.error('교육 일정 로드 실패:', err);
      globalAlert({
        title: '데이터 로드 실패',
        description: '교육 일정을 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [globalAlert]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // 필터링
  const filteredSchedules = schedules.filter((schedule) => {
    const matchStatus = statusFilter === 'all' || schedule.status === statusFilter;
    const matchType = typeFilter === 'all' || schedule.type === typeFilter;
    return matchStatus && matchType;
  });

  // 페이징 계산
  const totalItems = filteredSchedules.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const pagedSchedules = filteredSchedules.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusBadge = (status: EducationSchedule['status']) => {
    switch (status) {
      case 'scheduled':
        return <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium">예정</span>;
      case 'completed':
        return <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 text-xs font-medium">완료</span>;
      case 'cancelled':
        return <span className="inline-flex px-3 py-1 bg-red-100 text-red-800 text-xs font-medium">취소</span>;
    }
  };

  // 저장 핸들러
  const handleSave = async (data: Omit<EducationSchedule, 'id'>) => {
    if (!data.date || !data.equipment || !data.location || !data.instructor) {
      globalAlert({ title: '입력 오류', description: '필수 정보를 모두 입력해 주세요.' });
      return;
    }
    try {
      setIsSaving(true);
      if (viewMode === 'create') {
        await adminService.createEducationSchedule(data);
      } else if (viewMode === 'edit' && editingSchedule) {
        await adminService.updateEducationSchedule(editingSchedule.id, data);
      }
      await loadSchedules();
      setViewMode('list');
      setCurrentPage(1);
    } catch (err: any) {
      console.error('교육 일정 저장 실패:', err);
      globalAlert({ title: '저장 실패', description: '일정 저장 중 오류가 발생했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  // 삭제 핸들러
  const handleDelete = async (id: string) => {
    const confirmed = await globalConfirm({
      title: '일정 삭제',
      description: '선택한 일정을 정말로 삭제하시겠습니까?',
    });
    if (confirmed) {
      try {
        await adminService.deleteEducationSchedule(id);
        await loadSchedules();
      } catch (err: any) {
        console.error('교육 일정 삭제 실패:', err);
        globalAlert({ title: '삭제 실패', description: '일정 삭제 중 오류가 발생했습니다.' });
      }
    }
  };

  // 폼 뷰 표시 시
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <ScheduleFormView
        mode={viewMode}
        initialData={viewMode === 'edit' && editingSchedule
          ? {
              date: editingSchedule.date,
              equipment: editingSchedule.equipment,
              time: editingSchedule.time,
              location: editingSchedule.location,
              capacity: editingSchedule.capacity,
              enrolled: editingSchedule.enrolled,
              instructor: editingSchedule.instructor,
              status: editingSchedule.status,
              type: editingSchedule.type,
              description: editingSchedule.description,
            }
          : emptyFormData
        }
        onSave={handleSave}
        onCancel={() => setViewMode('list')}
        isSaving={isSaving}
      />
    );
  }

  // 목록 뷰
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl tracking-tight text-neutral-900">
          교육 캘린더 관리
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
          >
            <option value="all">구분 전체</option>
            <option value="education">교육</option>
            <option value="seminar">세미나</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
          >
            <option value="all">상태 전체</option>
            <option value="scheduled">예정</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>
          <button
            onClick={() => setViewMode('create')}
            className="inline-flex items-center gap-2 px-6 py-3 text-white transition-colors text-sm hover:opacity-90"
            style={{ backgroundColor: '#21358d' }}
          >
            <Plus className="w-5 h-5" />
            <span>일정 등록</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider w-16">No.</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider w-24">구분</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">일정</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">장비</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">장소</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">강사</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">신청현황</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">상태</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-neutral-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">데이터를 불러오는 중...</span>
                    </div>
                  </td>
                </tr>
              ) : pagedSchedules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-neutral-500 font-medium italic">
                    등록된 일정이 없습니다.
                  </td>
                </tr>
              ) : (
                pagedSchedules.map((schedule, idx) => {
                  const rowNo = (currentPage - 1) * pageSize + (idx + 1);
                  return (
                    <tr key={schedule.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 font-mono">{rowNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {schedule.type === 'education' ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold" style={{ backgroundColor: 'rgba(33, 53, 141, 0.1)', color: '#21358d' }}>교육</span>
                        ) : (
                          <span className="inline-flex px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold">세미나</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-neutral-500" />
                          <div>
                            <div className="text-sm font-medium text-neutral-900">{schedule.date}</div>
                            <div className="text-xs text-neutral-500">{schedule.time}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium">{schedule.equipment}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{schedule.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{schedule.instructor}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-neutral-500" />
                          <span className="text-sm font-medium text-neutral-900">{schedule.enrolled}/{schedule.capacity}명</span>
                          {schedule.enrolled >= schedule.capacity && (
                            <span className="text-xs text-red-600">(마감)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(schedule.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingSchedule(schedule); setViewMode('edit'); }}
                            className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="p-2 border border-neutral-300 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination & Rows per Page Selector */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">행 표시:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}
            >
              <SelectTrigger className="w-[110px] h-8 text-xs bg-white">
                <SelectValue placeholder="10개씩" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10개씩 보기</SelectItem>
                <SelectItem value="20">20개씩 보기</SelectItem>
                <SelectItem value="50">50개씩 보기</SelectItem>
                <SelectItem value="100">100개씩 보기</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-neutral-300 rounded-md bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                  currentPage === pageNum
                    ? 'bg-neutral-900 border-neutral-900 text-white'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-neutral-300 rounded-md bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 일정</div>
          <div className="text-2xl font-medium text-neutral-900">{schedules.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">예정</div>
          <div className="text-2xl font-medium text-blue-600">
            {schedules.filter((s) => s.status === 'scheduled').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">완료</div>
          <div className="text-2xl font-medium text-green-600">
            {schedules.filter((s) => s.status === 'completed').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">총 신청자</div>
          <div className="text-2xl font-medium text-neutral-900">
            {schedules.reduce((sum, s) => sum + s.enrolled, 0)}명
          </div>
        </div>
      </div>
    </div>
  );
}
