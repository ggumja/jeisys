import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, ChevronLeft, ChevronRight, X, MapPin, Users, Loader2, Send } from 'lucide-react';
import { adminService } from '../services/adminService';

interface EducationRequest {
  id: string;
  equipment: string;
  requestDate: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  scheduledDate?: string;
  content: string;
}

interface EducationSchedule {
  id: string;
  date: string;
  equipment: string;
  time: string;
  location: string;
  capacity: number;
  enrolled: number;
  description?: string;
  type: 'education' | 'seminar';
}

export function EducationPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<EducationSchedule | null>(null);

  // 신청 인라인 폼 상태 (팝업 내부에서만 사용)
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrollContent, setEnrollContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 교육 일정 목록 (DB)
  const [educationSchedules, setEducationSchedules] = useState<EducationSchedule[]>([]);

  // 교육 신청 내역 (DB)
  const [requests, setRequests] = useState<EducationRequest[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);

  // 교육 일정 로드
  useEffect(() => {
    adminService.getEducationSchedules()
      .then((data) => setEducationSchedules(data))
      .catch((err) => console.error('교육 일정 로드 실패:', err));
  }, []);

  // 교육 신청 내역 로드
  const loadRequests = async () => {
    try {
      setIsRequestsLoading(true);
      const data = await adminService.getMyEducationRequests();
      setRequests(data);
    } catch (err) {
      console.error('교육 신청 내역 로드 실패:', err);
    } finally {
      setIsRequestsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // 팝업 닫을 때 신청 폼도 초기화
  const closePopup = () => {
    setSelectedSchedule(null);
    setShowEnrollForm(false);
    setEnrollContent('');
  };

  // 신청 제출
  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;

    try {
      setIsSubmitting(true);
      await adminService.createEducationRequest({
        schedule_id: selectedSchedule.id,
        equipment: selectedSchedule.equipment,
        preferred_date: selectedSchedule.date,
        content: enrollContent,
      });
      alert('신청이 완료되었습니다. 담당자가 확인 후 연락드리겠습니다.');
      closePopup();
      await loadRequests();
    } catch (err: any) {
      console.error('신청 실패:', err);
      alert(err.message || '교육 신청 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 캘린더 유틸
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const formatDateFull = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getScheduleForDate = (dateString: string) =>
    educationSchedules.filter((s) => s.date === dateString);

  const goToPreviousMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const goToNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDateFull(year, month, day);
      const schedules = getScheduleForDate(dateString);
      const hasSchedule = schedules.length > 0;
      const today = new Date();
      const isToday =
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

      days.push(
        <div
          key={day}
          className={`aspect-square p-2 border border-neutral-200 relative ${
            hasSchedule ? 'bg-blue-50 border-blue-200' : 'bg-white'
          } ${isToday ? 'ring-2 ring-neutral-900' : ''}`}
        >
          <div className="flex flex-col h-full">
            <span className={`text-sm ${isToday ? 'font-bold' : ''} ${hasSchedule ? 'text-blue-900' : 'text-neutral-700'}`}>
              {day}
            </span>
            {hasSchedule && (
              <div className="mt-1 flex-1 flex flex-col gap-1">
                {schedules.map((schedule, idx) => {
                  const isSeminar = schedule.type === 'seminar';
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSchedule(schedule);
                        setShowEnrollForm(false);
                        setEnrollContent('');
                      }}
                      className="text-xs text-white px-1 py-0.5 truncate w-full text-left hover:opacity-80 transition-opacity cursor-pointer"
                      style={{ backgroundColor: isSeminar ? '#9333ea' : '#21358d' }}
                      title={`${isSeminar ? '[세미나]' : '[교육]'} ${schedule.equipment} ${schedule.time}`}
                    >
                      {isSeminar ? '★ ' : ''}{schedule.equipment}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const getStatusBadge = (status: EducationRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium">
            <Clock className="w-3 h-3" />
            대기중
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium">
            <Calendar className="w-3 h-3" />
            일정확정
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            완료
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium">
            취소
          </span>
        );
    }
  };

  // 현재 연도/월 표시
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="space-y-8">
      {/* Calendar */}
      <div className="bg-white border border-neutral-200 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>
          <h2 className="text-2xl tracking-tight text-neutral-900">
            {year}년 {month}월
          </h2>
          <button
            onClick={goToNextMonth}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors text-sm"
          >
            다음
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {dayNames.map((day, i) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-2 ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-neutral-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-neutral-100">
          {renderCalendar()}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" style={{ backgroundColor: '#21358d' }}></div>
            <span className="text-xs text-neutral-600">교육 일정</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" style={{ backgroundColor: '#9333ea' }}></div>
            <span className="text-xs text-neutral-600">세미나 일정</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-neutral-900 bg-white"></div>
            <span className="text-xs text-neutral-600">오늘</span>
          </div>
        </div>
      </div>

      {/* 일정 상세 팝업 */}
      {selectedSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-3xl w-full p-6 lg:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl tracking-tight text-neutral-900">
                {selectedSchedule.type === 'seminar' ? '세미나 일정 상세' : '교육 일정 상세'}
              </h2>
              <button
                onClick={closePopup}
                className="p-2 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 장비명 + 타입 뱃지 */}
              <div className="flex items-center gap-3">
                <h3 className="text-xl tracking-tight text-neutral-900">
                  {selectedSchedule.equipment}
                </h3>
                {selectedSchedule.type === 'seminar' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold">
                    <Calendar className="w-3 h-3" />
                    세미나 예정
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-xs font-semibold" style={{ color: '#21358d' }}>
                    <Calendar className="w-3 h-3" />
                    교육 예정
                  </span>
                )}
              </div>

              {/* 기본 정보 */}
              <div className="bg-neutral-50 border border-neutral-200 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-neutral-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">교육 일시</p>
                    <p className="text-sm text-neutral-900 font-medium">
                      {selectedSchedule.date} {selectedSchedule.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-neutral-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">교육 장소</p>
                    <p className="text-sm text-neutral-900 font-medium">
                      {selectedSchedule.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-neutral-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">신청 현황</p>
                    <p className="text-sm text-neutral-900 font-medium">
                      {selectedSchedule.enrolled}/{selectedSchedule.capacity}명
                      {selectedSchedule.capacity - selectedSchedule.enrolled > 0 && (
                        <span className="text-green-600 ml-2">
                          (잔여 {selectedSchedule.capacity - selectedSchedule.enrolled}석)
                        </span>
                      )}
                      {selectedSchedule.capacity - selectedSchedule.enrolled === 0 && (
                        <span className="text-red-600 ml-2">(마감)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* 상세 내용 */}
              <div>
                <h4 className="text-sm font-medium text-neutral-900 mb-2">교육 내용</h4>
                {selectedSchedule.description ? (
                  <div
                    className="prose prose-sm max-w-none text-neutral-700"
                    dangerouslySetInnerHTML={{ __html: selectedSchedule.description }}
                  />
                ) : (
                  <p className="text-sm text-neutral-400 italic">상세 내용이 없습니다.</p>
                )}
              </div>

              {/* 신청 폼 (인라인 — 신청 버튼 클릭 시 토글) */}
              {showEnrollForm ? (
                <form onSubmit={handleEnrollSubmit} className="border-t border-neutral-200 pt-5 space-y-4">
                  <h4 className="text-sm font-semibold text-neutral-900">신청 메모</h4>
                  <textarea
                    value={enrollContent}
                    onChange={(e) => setEnrollContent(e.target.value)}
                    placeholder="교육 관련 요청사항이나 참고사항을 남겨주세요. (선택)"
                    className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none text-sm"
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowEnrollForm(false); setEnrollContent(''); }}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm disabled:opacity-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-white hover:opacity-90 transition-colors text-sm disabled:opacity-60"
                      style={{ backgroundColor: '#21358d' }}
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      <Send className="w-4 h-4" />
                      신청 확정하기
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex gap-3 pt-4 border-t border-neutral-200">
                  <button
                    onClick={closePopup}
                    className="flex-1 px-6 py-4 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => setShowEnrollForm(true)}
                    disabled={selectedSchedule.capacity - selectedSchedule.enrolled === 0}
                    className="flex-1 px-6 py-4 text-white hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#21358d' }}
                  >
                    {selectedSchedule.capacity - selectedSchedule.enrolled === 0
                      ? '신청 마감'
                      : selectedSchedule.type === 'seminar' ? '세미나 신청하기' : '교육 신청하기'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 교육 신청 내역 */}
      <div className="bg-white border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <h2 className="text-lg tracking-tight text-neutral-900">교육 신청 내역</h2>
        </div>
        <div className="divide-y divide-neutral-200">
          {isRequestsLoading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-neutral-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">불러오는 중...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600 mb-2">신청한 교육 내역이 없습니다.</p>
              <p className="text-sm text-neutral-400">위 캘린더에서 원하는 일정을 클릭해 신청하세요.</p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="px-6 py-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg tracking-tight text-neutral-900">{request.equipment}</h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="flex flex-col lg:flex-row gap-2 lg:gap-6 text-sm text-neutral-600">
                    <span>신청일: {request.requestDate}</span>
                    {request.scheduledDate && (
                      <span className="font-medium text-blue-600">교육일: {request.scheduledDate}</span>
                    )}
                  </div>
                </div>
                {request.content && (
                  <p className="text-sm text-neutral-700 leading-relaxed">{request.content}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 교육 안내 */}
      <div className="p-6 bg-neutral-50 border border-neutral-200">
        <h3 className="text-sm font-medium text-neutral-900 mb-3">교육 안내</h3>
        <ul className="text-sm text-neutral-600 space-y-2">
          <li>• 교육 신청 후 담당자가 확인하여 최종 교육 일정을 안내해 드립니다.</li>
          <li>• 교육은 병원 방문 또는 온라인으로 진행 가능합니다.</li>
          <li>• 신규 장비 구매 시 무료 교육이 제공되며, 추가 교육은 별도 문의 바랍니다.</li>
          <li>• 긴급 교육 문의: 고객센터 070-7435-4927</li>
        </ul>
      </div>
    </div>
  );
}