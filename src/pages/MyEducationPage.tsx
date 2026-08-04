import { useState, useEffect } from 'react';
import { Calendar, Loader2, GraduationCap } from 'lucide-react';
import { adminService, EducationRequest } from '../services/adminService';

export function MyEducationPage() {
  const [requests, setRequests] = useState<EducationRequest[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(true);
  const [requestTab, setRequestTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  const loadRequests = async () => {
    try {
      setIsRequestsLoading(true);
      await adminService.autoCompleteExpiredSchedules().catch(() => {});
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">대기중</span>;
      case 'scheduled':
        return <span className="inline-flex px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">일정확정</span>;
      case 'completed':
        return <span className="inline-flex px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">완료</span>;
      case 'cancelled':
        return <span className="inline-flex px-2.5 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">취소</span>;
      default:
        return <span className="inline-flex px-2.5 py-1 bg-neutral-100 text-neutral-800 text-xs font-semibold rounded">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white border border-neutral-200 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-neutral-900" />
            내 교육 신청 내역
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            신청하신 교육 및 세미나 일정의 진행 상태를 확인하실 수 있습니다.
          </p>
        </div>
      </div>

      {/* 탭 및 목록 */}
      {(() => {
        const validRequests = requests.map((r) => {
          if (!r.schedule) {
            return {
              ...r,
              schedule: {
                title: `${r.equipment || '신청'} 교육/세미나`,
                date: r.preferredDate || r.scheduledDate || r.requestDate || '-',
                time: '14:00',
                equipment: r.equipment || '전체',
                type: 'education' as const,
                location: '제이시스 본사 세미나실',
              }
            };
          }
          return r;
        });
        const getDateVal = (r: any) => r.schedule?.date || r.scheduledDate || r.requestDate || '';

        const upcomingRequests = validRequests
          .filter((r) => r.status === 'pending' || r.status === 'scheduled')
          .sort((a, b) => getDateVal(a).localeCompare(getDateVal(b)));

        const completedRequests = validRequests
          .filter((r) => r.status === 'completed')
          .sort((a, b) => getDateVal(b).localeCompare(getDateVal(a)));

        const cancelledRequests = validRequests
          .filter((r) => r.status === 'cancelled')
          .sort((a, b) => getDateVal(b).localeCompare(getDateVal(a)));

        const filteredRequests =
          requestTab === 'upcoming'
            ? upcomingRequests
            : requestTab === 'completed'
            ? completedRequests
            : cancelledRequests;

        return (
          <div className="bg-white border border-neutral-200">
            {/* 탭 헤더 */}
            <div className="px-6 pt-4 border-b border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-sm font-semibold text-neutral-900">
                신청 내역 탭 목록
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setRequestTab('upcoming')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                    requestTab === 'upcoming'
                      ? 'border-neutral-900 text-neutral-900 font-bold'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <span>예정된 교육</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    requestTab === 'upcoming' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {upcomingRequests.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRequestTab('completed')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                    requestTab === 'completed'
                      ? 'border-neutral-900 text-neutral-900 font-bold'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <span>완료된 교육</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    requestTab === 'completed' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {completedRequests.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRequestTab('cancelled')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                    requestTab === 'cancelled'
                      ? 'border-neutral-900 text-neutral-900 font-bold'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <span>취소된 교육</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    requestTab === 'cancelled' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {cancelledRequests.length}
                  </span>
                </button>
              </div>
            </div>

            {/* 테이블 목록 */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-neutral-100/80 border-b border-neutral-200">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold text-neutral-700 w-12 text-center whitespace-nowrap">No.</th>
                    <th className="px-5 py-4 text-xs font-semibold text-neutral-700 w-16 whitespace-nowrap">구분</th>
                    <th className="px-5 py-4 text-xs font-semibold text-neutral-700 min-w-[180px] whitespace-nowrap">교육명</th>
                    <th className="px-5 py-4 text-xs font-semibold text-neutral-700 min-w-[160px] whitespace-nowrap">일시</th>
                    <th className="px-5 py-4 text-xs font-semibold text-neutral-700 min-w-[130px] whitespace-nowrap">장소</th>
                    <th className="px-5 py-4 text-xs font-semibold text-neutral-700 whitespace-nowrap">신청일</th>
                    <th className="px-5 py-4 text-xs font-semibold text-neutral-700 min-w-[140px] whitespace-nowrap">메모</th>
                    <th className="px-5 py-4 text-xs font-semibold text-neutral-700 text-center whitespace-nowrap">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {isRequestsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="flex items-center justify-center gap-2 text-neutral-500">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm">불러오는 중...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center">
                        <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                        <p className="text-neutral-600 mb-1 font-medium">
                          {requestTab === 'upcoming'
                            ? '예정된 교육 신청 내역이 없습니다.'
                            : requestTab === 'completed'
                            ? '완료된 교육 신청 내역이 없습니다.'
                            : '취소된 교육 내역이 없습니다.'}
                        </p>
                        <p className="text-xs text-neutral-400">교육 캘린더에서 원하는 일정을 신청해 보세요.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request, idx) => {
                      const sc = request.schedule;
                      const isSeminar = sc?.type === 'seminar';
                      const titleEq = sc?.equipment && sc.equipment !== 'none' ? sc.equipment : '';
                      const titleType = isSeminar ? '세미나' : '교육';
                      const defaultTitle = titleEq ? `${titleEq} ${titleType}` : titleType;
                      const educationTitle = sc?.title ? sc.title : defaultTitle;

                      return (
                        <tr key={request.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="px-5 py-5 text-xs text-neutral-500 font-mono text-center whitespace-nowrap">
                            {idx + 1}
                          </td>
                          <td className="px-5 py-5 whitespace-nowrap">
                            {isSeminar ? (
                              <span className="inline-flex px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                                세미나
                              </span>
                            ) : (
                              <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded" style={{ backgroundColor: 'rgba(33, 53, 141, 0.1)', color: '#21358d' }}>
                                교육
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-5 text-sm font-semibold text-neutral-900 whitespace-nowrap">
                            {sc ? educationTitle : request.equipment}
                          </td>
                          <td className="px-5 py-5 whitespace-nowrap text-xs text-neutral-700">
                            {sc ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-neutral-900 text-xs">{sc.date}</div>
                                <div className="text-neutral-500 text-xs">{sc.time}</div>
                              </div>
                            ) : (
                              request.scheduledDate || '-'
                            )}
                          </td>
                          <td className="px-5 py-5 whitespace-nowrap text-xs text-neutral-700">
                            {sc?.location || '-'}
                          </td>
                          <td className="px-5 py-5 whitespace-nowrap text-xs text-neutral-600 font-mono">
                            {request.requestDate}
                          </td>
                          <td className="px-5 py-5 text-xs text-neutral-600 max-w-xs truncate">
                            {request.content || '-'}
                          </td>
                          <td className="px-5 py-5 text-center whitespace-nowrap">
                            {getStatusBadge(request.status)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
