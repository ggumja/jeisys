import { useState } from 'react';
import { Calendar, CheckCircle, Clock, Plus, ChevronLeft, ChevronRight, X, MapPin, Users } from 'lucide-react';

interface EducationRequest {
  id: string;
  equipment: string;
  requestDate: string;
  status: 'pending' | 'scheduled' | 'completed';
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
  description: string;
}

const equipmentOptions = [
  'Density',
  'DLiv',
  'POTENZA',
  'INTRAcel',
  'LinearZ',
  'LinearFirm',
  'ULTRAcel II',
  'LIPOcel II',
  'IntraGen',
];

// 샘플 교육 일정 데이터
const educationSchedules: EducationSchedule[] = [
  {
    id: 'ed1',
    date: '2026-02-05',
    equipment: 'POTENZA',
    time: '14:00 - 16:00',
    location: '본사 교육장 (서울 강남)',
    capacity: 10,
    enrolled: 7,
    description: 'POTENZA 기본 사용법 및 니들 팁 관리',
  },
  {
    id: 'ed2',
    date: '2026-02-12',
    equipment: 'ULTRAcel II',
    time: '10:00 - 12:00',
    location: '온라인 교육',
    capacity: 20,
    enrolled: 15,
    description: 'ULTRAcel II 응용 프로토콜 및 케이스 스터디',
  },
  {
    id: 'ed3',
    date: '2026-02-15',
    equipment: 'LinearZ',
    time: '14:00 - 17:00',
    location: '본사 교육장 (서울 강남)',
    capacity: 8,
    enrolled: 5,
    description: 'LinearZ 실전 테크닉 마스터 클래스',
  },
  {
    id: 'ed4',
    date: '2026-02-20',
    equipment: 'Density',
    time: '15:00 - 17:00',
    location: '부산 지사',
    capacity: 12,
    enrolled: 9,
    description: 'Density 신규 사용자 교육',
  },
  {
    id: 'ed5',
    date: '2026-02-26',
    equipment: 'INTRAcel',
    time: '13:00 - 15:00',
    location: '온라인 교육',
    capacity: 15,
    enrolled: 8,
    description: 'INTRAcel 기본 교육 및 유지보수',
  },
];

export function EducationPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // February 2026
  const [selectedSchedule, setSelectedSchedule] = useState<EducationSchedule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    equipment: '',
    preferredDate: '',
    content: '',
  });

  const [requests] = useState<EducationRequest[]>([
    {
      id: '1',
      equipment: 'POTENZA',
      requestDate: '2026-01-25',
      status: 'scheduled',
      scheduledDate: '2026-02-05',
      content: 'POTENZA 장비 기본 사용법 및 니들 팁 교체 방법 교육 요청드립니다.',
    },
    {
      id: '2',
      equipment: 'ULTRAcel II',
      requestDate: '2026-01-20',
      status: 'completed',
      scheduledDate: '2026-01-28',
      content: 'ULTRAcel II 신규 도입 후 전체 교육이 필요합니다.',
    },
    {
      id: '3',
      equipment: 'LinearZ',
      requestDate: '2026-01-15',
      status: 'pending',
      content: 'LinearZ 응용 기술 교육 희망합니다.',
    },
  ]);

  // 캘린더 관련 함수들
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const formatDateFull = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getScheduleForDate = (dateString: string) => {
    return educationSchedules.filter(schedule => schedule.date === dateString);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (dateString: string) => {
    const schedules = getScheduleForDate(dateString);
    if (schedules.length > 0) {
      setSelectedSchedule(schedules[0]); // 첫 번째 일정 선택
    }
  };

  const handleEnrollClick = (schedule: EducationSchedule) => {
    setFormData({
      equipment: schedule.equipment,
      preferredDate: schedule.date,
      content: schedule.description,
    });
    setSelectedSchedule(null);
    setShowForm(true);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 빈 셀 추가 (월의 첫날 이전)
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square p-2" />);
    }

    // 날짜 셀 추가
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
        <button
          key={day}
          onClick={() => hasSchedule && handleDateClick(dateString)}
          className={`aspect-square p-2 border border-neutral-200 transition-all relative ${
            hasSchedule
              ? 'bg-blue-50 hover:bg-blue-100 cursor-pointer border-blue-200'
              : 'bg-white cursor-default'
          } ${isToday ? 'ring-2 ring-neutral-900' : ''}`}
        >
          <div className="flex flex-col h-full">
            <span className={`text-sm ${isToday ? 'font-bold' : ''} ${hasSchedule ? 'text-blue-900' : 'text-neutral-700'}`}>
              {day}
            </span>
            {hasSchedule && (
              <div className="mt-1 flex-1">
                {schedules.map((schedule, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-blue-600 text-white px-1 py-0.5 mb-1 truncate"
                    title={schedule.equipment}
                  >
                    {schedule.equipment}
                  </div>
                ))}
              </div>
            )}
          </div>
        </button>
      );
    }

    return days;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic here
    alert('교육 신청이 완료되었습니다. 담당자가 확인 후 연락드리겠습니다.');
    setShowForm(false);
    setFormData({ equipment: '', preferredDate: '', content: '' });
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
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
            교육 캘린더
          </h2>
          <p className="text-sm text-neutral-600">
            캘린더에서 교육 일정을 선택하여 신청하세요
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white border border-neutral-200 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>이전</span>
          </button>
          <h2 className="text-xl tracking-tight text-neutral-900 text-[32px]">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>
          <button
            onClick={goToNextMonth}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm"
          >
            <span>다음</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          <div className="text-center text-sm text-red-600 font-medium py-2">일</div>
          <div className="text-center text-sm text-neutral-700 font-medium py-2">월</div>
          <div className="text-center text-sm text-neutral-700 font-medium py-2">화</div>
          <div className="text-center text-sm text-neutral-700 font-medium py-2">수</div>
          <div className="text-center text-sm text-neutral-700 font-medium py-2">목</div>
          <div className="text-center text-sm text-neutral-700 font-medium py-2">금</div>
          <div className="text-center text-sm text-blue-600 font-medium py-2">토</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 border border-blue-200"></div>
            <span>교육 일정 있음</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 ring-2 ring-neutral-900"></div>
            <span>오늘</span>
          </div>
        </div>
      </div>

      {/* Selected Schedule Details Modal */}
      {selectedSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full p-6 lg:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl tracking-tight text-neutral-900">
                교육 일정 상세
              </h2>
              <button
                onClick={() => setSelectedSchedule(null)}
                className="p-2 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl tracking-tight text-neutral-900">
                    {selectedSchedule.equipment}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium">
                    <Calendar className="w-3 h-3" />
                    교육 예정
                  </span>
                </div>

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
              </div>

              <div>
                <h4 className="text-sm font-medium text-neutral-900 mb-2">교육 내용</h4>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {selectedSchedule.description}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => setSelectedSchedule(null)}
                  className="flex-1 px-6 py-4 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={() => handleEnrollClick(selectedSchedule)}
                  disabled={selectedSchedule.capacity - selectedSchedule.enrolled === 0}
                  className="flex-1 px-6 py-4 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
                >
                  {selectedSchedule.capacity - selectedSchedule.enrolled === 0
                    ? '신청 마감'
                    : '교육 신청하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Form */}
      {showForm && (
        <div className="mb-8 bg-white border border-neutral-200 p-6 lg:p-8">
          <h2 className="text-xl tracking-tight text-neutral-900 mb-6">
            교육 신청서
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                교육 희망 장비 <span className="text-red-600">*</span>
              </label>
              <select
                name="equipment"
                value={formData.equipment}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              >
                <option value="">장비를 선택하세요</option>
                {equipmentOptions.map((equipment) => (
                  <option key={equipment} value={equipment}>
                    {equipment}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                희망 교육 일정 <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
              <p className="text-xs text-neutral-500 mt-2">
                희망 일정을 선택해 주시면 담당자가 확인 후 최종 일정을 안내해
                드립니다
              </p>
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                교육 요청 사항 <span className="text-red-600">*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="교육받고 싶은 내용을 구체적으로 작성해 주세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                rows={5}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-6 py-4 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-4 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
              >
                신청하기
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History List */}
      <div className="bg-white border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <h2 className="text-lg tracking-tight text-neutral-900">
            교육 신청 내역
          </h2>
        </div>

        <div className="divide-y divide-neutral-200">
          {requests.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600 mb-6">
                신청한 교육 내역이 없습니다
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>첫 교육 신청하기</span>
              </button>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="px-6 py-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg tracking-tight text-neutral-900">
                      {request.equipment}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="flex flex-col lg:flex-row gap-2 lg:gap-6 text-sm text-neutral-600">
                    <span>신청일: {request.requestDate}</span>
                    {request.scheduledDate && (
                      <span className="font-medium text-blue-600">
                        교육일: {request.scheduledDate}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {request.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-6 bg-neutral-50 border border-neutral-200">
        <h3 className="text-sm font-medium text-neutral-900 mb-3">
          교육 안내
        </h3>
        <ul className="text-sm text-neutral-600 space-y-2">
          <li>
            • 교육 신청 후 담당자가 확인하여 최종 교육 일정을 안내해 드립니다.
          </li>
          <li>• 교육은 병원 방문 또는 온라인으로 진행 가능합니다.</li>
          <li>
            • 신규 장비 구매 시 무료 교육이 제공되며, 추가 교육은 별도 문의
            바랍니다.
          </li>
          <li>• 긴급 교육 문의: 고객센터 070-7435-4927</li>
        </ul>
      </div>
    </div>
  );
}