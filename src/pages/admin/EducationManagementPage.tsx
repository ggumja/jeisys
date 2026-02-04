import { useState } from 'react';
import { Calendar, Plus, Edit, Trash2, Users } from 'lucide-react';

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
}

const mockSchedules: EducationSchedule[] = [
  {
    id: '1',
    date: '2026-02-05',
    equipment: 'POTENZA',
    time: '14:00 - 16:00',
    location: '본사 교육장',
    capacity: 10,
    enrolled: 7,
    instructor: '김영희 강사',
    status: 'scheduled',
  },
  {
    id: '2',
    date: '2026-02-12',
    equipment: 'ULTRAcel II',
    time: '10:00 - 12:00',
    location: '온라인',
    capacity: 20,
    enrolled: 15,
    instructor: '이철수 강사',
    status: 'scheduled',
  },
  {
    id: '3',
    date: '2026-01-28',
    equipment: 'LinearZ',
    time: '14:00 - 17:00',
    location: '본사 교육장',
    capacity: 8,
    enrolled: 8,
    instructor: '박지훈 강사',
    status: 'completed',
  },
];

export function EducationManagementPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredSchedules = mockSchedules.filter((schedule) => {
    if (statusFilter === 'all') return true;
    return schedule.status === statusFilter;
  });

  const getStatusBadge = (status: EducationSchedule['status']) => {
    switch (status) {
      case 'scheduled':
        return (
          <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium">
            예정
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 text-xs font-medium">
            완료
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex px-3 py-1 bg-red-100 text-red-800 text-xs font-medium">
            취소
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl tracking-tight text-neutral-900">
          교육 캘린더 관리
        </h3>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
          >
            <option value="all">전체</option>
            <option value="scheduled">예정</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors">
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
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  일정
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  장비
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  장소
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  강사
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  신청현황
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
              {filteredSchedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-500" />
                      <div>
                        <div className="text-sm font-medium text-neutral-900">
                          {schedule.date}
                        </div>
                        <div className="text-xs text-neutral-500">{schedule.time}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium">
                      {schedule.equipment}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {schedule.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {schedule.instructor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm font-medium text-neutral-900">
                        {schedule.enrolled}/{schedule.capacity}명
                      </span>
                      {schedule.enrolled >= schedule.capacity && (
                        <span className="text-xs text-red-600">(마감)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(schedule.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 border border-neutral-300 text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 일정</div>
          <div className="text-2xl font-medium text-neutral-900">{mockSchedules.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">예정</div>
          <div className="text-2xl font-medium text-blue-600">
            {mockSchedules.filter((s) => s.status === 'scheduled').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">완료</div>
          <div className="text-2xl font-medium text-green-600">
            {mockSchedules.filter((s) => s.status === 'completed').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">총 신청자</div>
          <div className="text-2xl font-medium text-neutral-900">
            {mockSchedules.reduce((sum, s) => sum + s.enrolled, 0)}명
          </div>
        </div>
      </div>
    </div>
  );
}
