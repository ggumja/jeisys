import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Edit, Trash2, Users, ChevronLeft, ChevronRight, Loader2, ArrowLeft, FileText, ClipboardList, CheckCircle, Clock, XCircle, UserCheck } from 'lucide-react';
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
  title?: string;
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

interface EducationRequest {
  id: string;
  equipment: string;
  requestDate: string;
  preferredDate?: string | null;
  scheduledDate?: string;
  content: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  user?: { name: string; hospitalName: string; phone: string; email?: string } | null;
}

const equipmentOptions = [
  'Density', 'DLiv', 'POTENZA', 'INTRAcel', 'LinearZ',
  'LinearFirm', 'ULTRAcel II', 'LIPOcel II', 'IntraGen',
];

/** 등록/수정 전체 화면 폼 뷰 */
function ScheduleFormView({
  mode, initialData, onSave, onCancel, isSaving,
}: {
  mode: 'create' | 'edit';
  initialData: Omit<EducationSchedule, 'id'>;
  onSave: (data: Omit<EducationSchedule, 'id'>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState(initialData);

  // 시작/종료 시간 분리
  const parseTime = (timeStr: string) => {
    const parts = timeStr.split(' - ');
    return { start: parts[0]?.trim() || '09:00', end: parts[1]?.trim() || '11:00' };
  };
  const [timeStart, setTimeStart] = useState(parseTime(initialData.time).start);
  const [timeEnd, setTimeEnd] = useState(parseTime(initialData.time).end);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ ...formData, time: `${timeStart} - ${timeEnd}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onCancel} className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />목록으로
        </button>
        <h3 className="text-xl tracking-tight text-neutral-900">{mode === 'create' ? '신규 일정 등록' : '일정 정보 수정'}</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-neutral-200 p-6">
          <h4 className="text-sm font-semibold text-neutral-700 mb-4 pb-2 border-b border-neutral-100">기본 정보</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-neutral-700">일정 제목 <span className="text-neutral-400 font-normal">(선택)</span></label>
              <Input
                type="text"
                placeholder="예) [덴시티] 유저 특별 세미나 & 핸즈온 교육"
                value={formData.title || ''}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">구분 <span className="text-red-500">*</span></label>
              <Select value={formData.type} onValueChange={(val: 'education' | 'seminar') => setFormData((p) => ({ ...p, type: val }))}>
                <SelectTrigger className="w-full bg-white"><SelectValue placeholder="타입 선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="education">교육 일정</SelectItem>
                  <SelectItem value="seminar">세미나 일정</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">장비 <span className="text-neutral-400 font-normal">(선택)</span></label>
              <Select value={formData.equipment} onValueChange={(val) => setFormData((p) => ({ ...p, equipment: val }))}>
                <SelectTrigger className="w-full bg-white"><SelectValue placeholder="장비 선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음 / 공통</SelectItem>
                  {equipmentOptions.map((eq) => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">일자 <span className="text-red-500">*</span></label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} required />
            </div>
            {/* 시작 / 종료 시간 — 같은 줄에 나란히 */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">시간 <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-3">
                <Input
                  type="time"
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  required
                  className="flex-1"
                />
                <span className="text-sm text-neutral-500 shrink-0">~</span>
                <Input
                  type="time"
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  required
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-neutral-700">장소 <span className="text-red-500">*</span></label>
              <Input type="text" placeholder="예) 본사 교육장 (서울 강남)" value={formData.location} onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">모집 정원 (명) <span className="text-red-500">*</span></label>
              <Input type="number" min={1} value={formData.capacity} onChange={(e) => setFormData((p) => ({ ...p, capacity: Number(e.target.value) }))} required />
            </div>
            {/* 신청 인원: 수정 모드에서만 노출 (신규 등록 시 자동 집계) */}
            {mode === 'edit' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">신청 인원 (명)</label>
                <Input type="number" min={0} max={formData.capacity} value={formData.enrolled} onChange={(e) => setFormData((p) => ({ ...p, enrolled: Number(e.target.value) }))} />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">강사명 <span className="text-red-500">*</span></label>
              <Input type="text" placeholder="홍길동 강사" value={formData.instructor} onChange={(e) => setFormData((p) => ({ ...p, instructor: e.target.value }))} required />
            </div>
            {/* 상태: 수정 모드에서만 표시 (신규 등록은 항상 '예정') */}
            {mode === 'edit' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">상태 <span className="text-red-500">*</span></label>
                <Select value={formData.status} onValueChange={(val: EducationSchedule['status']) => setFormData((p) => ({ ...p, status: val }))}>
                  <SelectTrigger className="w-full bg-white"><SelectValue placeholder="상태 선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">예정</SelectItem>
                    <SelectItem value="completed">완료</SelectItem>
                    <SelectItem value="cancelled">취소</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-100">
            <FileText className="w-4 h-4 text-neutral-500" />
            <h4 className="text-sm font-semibold text-neutral-700">상세 내용</h4>
            <span className="text-xs text-neutral-400">(이미지 첨부 가능)</span>
          </div>
          <RichTextEditor value={formData.description} onChange={(html) => setFormData((p) => ({ ...p, description: html }))} placeholder="교육 일정에 대한 상세 내용을 입력하세요." minHeight="400px" />
        </div>
        {/* 하단 고정 버튼 */}
        <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex justify-end gap-3 -mx-6 mt-2">
          <button type="button" onClick={onCancel} disabled={isSaving} className="px-6 py-2.5 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm font-medium disabled:opacity-50">취소</button>
          <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 px-6 py-2.5 text-white transition-colors text-sm font-medium hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: '#21358d' }}>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'create' ? '등록하기' : '저장하기'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────
// 일정별 신청자 관리 뷰
// ─────────────────────────────────────────────────
function ApplicantsView({
  schedule,
  onBack,
}: {
  schedule: EducationSchedule;
  onBack: () => void;
}) {
  const { alert: globalAlert } = useModal();
  const [applicants, setApplicants] = useState<EducationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadApplicants = useCallback(async () => {
    try {
      setIsLoading(true);
      await adminService.autoCompleteExpiredRequests().catch(() => {});
      const data = await adminService.getEducationRequestsBySchedule(schedule.id);
      setApplicants(data as EducationRequest[]);
    } catch (err: any) {
      console.error('신청자 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [schedule.id]);

  useEffect(() => { loadApplicants(); }, [loadApplicants]);

  const handleStatusUpdate = async (id: string, status: EducationRequest['status']) => {
    setUpdatingId(id);
    try {
      await adminService.updateEducationRequestStatus(id, status);
      await loadApplicants();
    } catch {
      await globalAlert({ title: '수정 실패', description: '상태 변경 중 오류가 발생했습니다.' });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':   return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium"><Clock className="w-3 h-3" />대기중</span>;
      case 'scheduled': return <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium"><Calendar className="w-3 h-3" />확정</span>;
      case 'completed': return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium"><CheckCircle className="w-3 h-3" />완료</span>;
      case 'cancelled': return <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium"><XCircle className="w-3 h-3" />취소</span>;
      default: return null;
    }
  };

  const pending   = applicants.filter((a) => a.status === 'pending').length;
  const confirmed = applicants.filter((a) => a.status === 'scheduled').length;
  const completed = applicants.filter((a) => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />목록으로
        </button>
        <div>
          <h3 className="text-xl tracking-tight text-neutral-900">신청자 관리</h3>
          <p className="text-sm text-neutral-500 mt-0.5">
            {schedule.date} {schedule.time} · {schedule.equipment} · {schedule.location}
          </p>
        </div>
      </div>



      {/* 신청자 테이블 */}
      <div className="bg-white border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-neutral-600" />
            <span className="text-sm font-semibold text-neutral-900">신청자 목록</span>
            <span className="text-xs text-neutral-500">총 {applicants.length}명</span>
          </div>
          <button onClick={loadApplicants} className="text-xs text-neutral-500 hover:text-neutral-700 border border-neutral-200 px-3 py-1.5 rounded transition-colors">
            새로고침
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 w-12">No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700">병원명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700">담당자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700">연락처</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700">이메일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700">신청일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700">메모</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700">처리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-neutral-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">불러오는 중...</span>
                    </div>
                  </td>
                </tr>
              ) : applicants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm text-neutral-500">아직 신청자가 없습니다.</p>
                  </td>
                </tr>
              ) : (
                applicants.map((req, idx) => (
                  <tr key={req.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-xs text-neutral-500">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900">{req.user?.hospitalName ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-neutral-700">{req.user?.name ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-neutral-700">{req.user?.phone ?? '-'}</td>
                    <td className="px-6 py-4 text-xs text-neutral-600">{req.user?.email ?? '-'}</td>
                    <td className="px-6 py-4 text-xs text-neutral-600">{req.requestDate}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600 max-w-xs truncate">{req.content || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {req.status === 'pending' ? (
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'scheduled')}
                            disabled={updatingId === req.id}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            승인
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-400">-</span>
                        )}
                        {updatingId === req.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400 ml-1" />}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────────
export function EducationManagementPage() {
  const { alert: globalAlert, confirm: globalConfirm } = useModal();

  const [schedules, setSchedules] = useState<EducationSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 뷰 모드: list | create | edit | applicants
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'applicants'>('list');
  const [editingSchedule, setEditingSchedule] = useState<EducationSchedule | null>(null);
  const [applicantsSchedule, setApplicantsSchedule] = useState<EducationSchedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const emptyFormData: Omit<EducationSchedule, 'id'> = {
    title: '',
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

  const loadSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      await adminService.autoCompleteExpiredSchedules().catch(() => {});
      const data = await adminService.getEducationSchedules();
      setSchedules(data);
    } catch (err: any) {
      globalAlert({ title: '데이터 로드 실패', description: '교육 일정을 불러오는 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  }, [globalAlert]);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  const filteredSchedules = schedules.filter((s) => {
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchType = typeFilter === 'all' || s.type === typeFilter;
    return matchStatus && matchType;
  });
  const totalPages = Math.ceil(filteredSchedules.length / pageSize);
  const pagedSchedules = filteredSchedules.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: EducationSchedule['status']) => {
    switch (status) {
      case 'scheduled': return <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium">예정</span>;
      case 'completed': return <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 text-xs font-medium">완료</span>;
      case 'cancelled': return <span className="inline-flex px-3 py-1 bg-red-100 text-red-800 text-xs font-medium">취소</span>;
    }
  };

  const handleSave = async (data: Omit<EducationSchedule, 'id'>) => {
    if (!data.date || !data.location || !data.instructor) {
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
    } catch {
      globalAlert({ title: '저장 실패', description: '일정 저장 중 오류가 발생했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await globalConfirm({ title: '일정 삭제', description: '선택한 일정을 정말로 삭제하시겠습니까?' });
    if (confirmed) {
      try {
        await adminService.deleteEducationSchedule(id);
        await loadSchedules();
      } catch {
        globalAlert({ title: '삭제 실패', description: '일정 삭제 중 오류가 발생했습니다.' });
      }
    }
  };

  const handleComplete = async (id: string) => {
    const confirmed = await globalConfirm({
      title: '일정 완료처리',
      description: '이 일정을 완료 처리하면 승인된 신청자도 모두 완료 처리됩니다. 진행하시겠습니까?',
    });
    if (confirmed) {
      try {
        await adminService.completeScheduleWithRequests(id);
        await loadSchedules();
      } catch {
        globalAlert({ title: '완료처리 실패', description: '일정 완료처리 중 오류가 발생했습니다.' });
      }
    }
  };

  // ── 폼/신청자 뷰 분기 ──
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <ScheduleFormView
        mode={viewMode}
        initialData={viewMode === 'edit' && editingSchedule
          ? { title: editingSchedule.title || '', date: editingSchedule.date, equipment: editingSchedule.equipment, time: editingSchedule.time, location: editingSchedule.location, capacity: editingSchedule.capacity, enrolled: editingSchedule.enrolled, instructor: editingSchedule.instructor, status: editingSchedule.status, type: editingSchedule.type, description: editingSchedule.description }
          : emptyFormData}
        onSave={handleSave}
        onCancel={() => setViewMode('list')}
        isSaving={isSaving}
      />
    );
  }

  if (viewMode === 'applicants' && applicantsSchedule) {
    return (
      <ApplicantsView
        schedule={applicantsSchedule}
        onBack={() => { setViewMode('list'); setApplicantsSchedule(null); }}
      />
    );
  }

  // ── 목록 뷰 ──
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl tracking-tight text-neutral-900">교육 캘린더 관리</h3>
        <div className="flex flex-wrap items-center gap-3">
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }} className="px-4 py-2 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm">
            <option value="all">구분 전체</option>
            <option value="education">교육</option>
            <option value="seminar">세미나</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="px-4 py-2 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm">
            <option value="all">상태 전체</option>
            <option value="scheduled">예정</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>
          <button onClick={() => setViewMode('create')} className="inline-flex items-center gap-2 px-6 py-3 text-white transition-colors text-sm hover:opacity-90" style={{ backgroundColor: '#21358d' }}>
            <Plus className="w-5 h-5" /><span>일정 등록</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider w-14 whitespace-nowrap">No.</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider w-20 whitespace-nowrap">구분</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[160px] whitespace-nowrap">제목</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[160px] whitespace-nowrap">일정</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[100px] whitespace-nowrap">장비</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[140px] whitespace-nowrap">장소</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[120px] whitespace-nowrap">강사</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[110px] whitespace-nowrap">신청현황</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[80px] whitespace-nowrap">상태</th>
                <th className="px-4 py-3.5 text-center text-xs font-medium text-neutral-700 uppercase tracking-wider min-w-[140px] whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-neutral-500">
                      <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">데이터를 불러오는 중...</span>
                    </div>
                  </td>
                </tr>
              ) : pagedSchedules.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-neutral-500 font-medium italic">등록된 일정이 없습니다.</td>
                </tr>
              ) : (
                pagedSchedules.map((schedule, idx) => {
                  const rowNo = (currentPage - 1) * pageSize + (idx + 1);
                  return (
                    <tr key={schedule.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500 font-mono">{rowNo}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {schedule.type === 'education'
                          ? <span className="inline-flex px-2 py-1 text-xs font-semibold" style={{ backgroundColor: 'rgba(33, 53, 141, 0.1)', color: '#21358d' }}>교육</span>
                          : <span className="inline-flex px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold">세미나</span>
                        }
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-neutral-900 max-w-xs truncate whitespace-nowrap">
                        {schedule.title || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
                          <div className="whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">{schedule.date}</div>
                            <div className="text-xs text-neutral-500">{schedule.time}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium">{schedule.equipment}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-700">{schedule.location}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-700">{schedule.instructor}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {/* 신청현황 — 클릭 시 신청자 관리 진입 */}
                        <button
                          onClick={() => { setApplicantsSchedule(schedule); setViewMode('applicants'); }}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors group"
                        >
                          <Users className="w-4 h-4 text-neutral-500 group-hover:text-blue-500" />
                          <span className={`text-sm font-medium ${schedule.enrolled >= schedule.capacity ? 'text-red-600' : 'text-neutral-900'}`}>
                            {schedule.enrolled}/{schedule.capacity}명
                          </span>
                          {schedule.enrolled >= schedule.capacity && <span className="text-xs text-red-600">(마감)</span>}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(schedule.status)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => { setApplicantsSchedule(schedule); setViewMode('applicants'); }}
                            className="p-1.5 border border-neutral-300 text-blue-600 hover:bg-blue-50 transition-colors rounded"
                            title="신청자 관리"
                          >
                            <ClipboardList className="w-4 h-4" />
                          </button>
                          {schedule.status === 'scheduled' && (
                            <button
                              onClick={() => handleComplete(schedule.id)}
                              className="p-1.5 border border-green-300 text-green-700 hover:bg-green-50 transition-colors rounded"
                              title="완료처리"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => { setEditingSchedule(schedule); setViewMode('edit'); }}
                            className="p-1.5 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors rounded"
                            title="수정"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="p-1.5 border border-neutral-300 text-red-600 hover:bg-red-50 transition-colors rounded"
                            title="삭제"
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

      {/* 페이징 */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">행 표시:</span>
            <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
              <SelectTrigger className="w-[110px] h-8 text-xs bg-white"><SelectValue placeholder="10개씩" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10개씩 보기</SelectItem>
                <SelectItem value="20">20개씩 보기</SelectItem>
                <SelectItem value="50">50개씩 보기</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-neutral-300 rounded-md bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${currentPage === pageNum ? 'bg-neutral-900 border-neutral-900 text-white' : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'}`}>
                {pageNum}
              </button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border border-neutral-300 rounded-md bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}


    </div>
  );
}
