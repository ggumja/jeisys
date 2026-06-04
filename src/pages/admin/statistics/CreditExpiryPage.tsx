import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ShieldAlert, Send, PhoneCall } from 'lucide-react';
import { adminService } from '../../../services/adminService';

export function CreditExpiryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const data = await adminService.getCreditExpiryStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  const { summary, detailedList } = stats;

  const handleSendGroupSms = () => {
    const receivers = detailedList.map((d: any) => ({
      name: d.hospitalName,
      phone: d.phone
    }));
    navigate('/admin/marketing/sms/send', { state: { receivers, defaultMessage: '[제이시스 메디컬] 보유하신 크레딧 만료 안내' } });
  };

  const handleSendSingleSms = (row: any) => {
    navigate('/admin/marketing/sms/send', {
      state: {
        receivers: [{ name: row.hospitalName, phone: row.phone }],
        defaultMessage: `[제이시스 메디컬] 안녕하세요. 보유하신 ${row.equipmentType} 크레딧 잔액 ₩${row.remaining.toLocaleString()}원이 ${row.expiryDate}에 만료 예정입니다.`
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 만료 임박 구간별 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 30일 이내 */}
        <div className="bg-white border-2 border-red-100 p-6 shadow-sm relative group">
          <span className="absolute top-4 right-4 text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">D-30 임박</span>
          <span className="text-sm text-neutral-500 font-semibold block mb-2">30일 이내 만료 예정</span>
          <p className="text-2xl font-bold text-red-600">₩{summary.exp30.amount.toLocaleString()}</p>
          <div className="mt-2 text-xs text-neutral-500 font-semibold flex justify-between">
            <span>대상 건수: {summary.exp30.count}건</span>
            <span>대상 병원: {summary.exp30.hospitalCount}개사</span>
          </div>
        </div>

        {/* 60일 이내 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm relative group">
          <span className="absolute top-4 right-4 text-xs font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">D-60 여유</span>
          <span className="text-sm text-neutral-500 font-semibold block mb-2">60일 이내 만료 예정</span>
          <p className="text-2xl font-bold text-neutral-800">₩{summary.exp60.amount.toLocaleString()}</p>
          <div className="mt-2 text-xs text-neutral-500 font-semibold flex justify-between">
            <span>대상 건수: {summary.exp60.count}건</span>
            <span>대상 병원: {summary.exp60.hospitalCount}개사</span>
          </div>
        </div>

        {/* 90일 이내 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm relative group">
          <span className="absolute top-4 right-4 text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full">D-90 여유</span>
          <span className="text-sm text-neutral-500 font-semibold block mb-2">90일 이내 만료 예정</span>
          <p className="text-2xl font-bold text-neutral-800">₩{summary.exp90.amount.toLocaleString()}</p>
          <div className="mt-2 text-xs text-neutral-500 font-semibold flex justify-between">
            <span>대상 건수: {summary.exp90.count}건</span>
            <span>대상 병원: {summary.exp90.hospitalCount}개사</span>
          </div>
        </div>
      </div>

      {/* 만료 임박 상세 내역 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>30일 이내 만료 예정 상세 리스트</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1">곧 소멸 예정인 미사용 크레딧 보유 현황이며, 즉각적인 소진 프로모션 안내가 필요합니다.</p>
          </div>
          {detailedList.length > 0 && (
            <button
              onClick={handleSendGroupSms}
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-xs rounded transition-colors shadow-sm self-start sm:self-center"
            >
              <Send className="w-3.5 h-3.5" />
              <span>전체 대상자 안내문자 발송</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-6 font-semibold text-neutral-700 w-16 text-center">No.</th>
                <th className="py-3 px-6 font-semibold text-neutral-700">병원명</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 w-32">대표자명</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 w-32">장비 모델</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 text-right w-36">남은 크레딧 잔액</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 text-center w-36">만료 예정일</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 text-center w-32">연락처</th>
                <th className="py-3 px-6 font-semibold text-neutral-700 text-center w-28">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-sans">
              {detailedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-neutral-400">
                    30일 이내에 만료 예정인 활성 크레딧이 없습니다.
                  </td>
                </tr>
              ) : (
                detailedList.map((row: any, idx: number) => (
                  <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-6 text-center text-neutral-500 font-semibold">{idx + 1}</td>
                    <td className="py-3 px-6 font-semibold text-neutral-900">{row.hospitalName}</td>
                    <td className="py-3 px-6 text-neutral-600 font-semibold">{row.userName}</td>
                    <td className="py-3 px-6 text-neutral-600 font-semibold">{row.equipmentType}</td>
                    <td className="py-3 px-6 text-right font-bold text-red-600">₩{row.remaining.toLocaleString()}</td>
                    <td className="py-3 px-6 text-center font-semibold text-neutral-800">{row.expiryDate}</td>
                    <td className="py-3 px-6 text-center text-neutral-600 font-semibold">{row.phone}</td>
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => handleSendSingleSms(row)}
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1 border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 active:bg-neutral-100 font-semibold text-xs rounded transition-colors shadow-sm"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>안내 발송</span>
                      </button>
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
