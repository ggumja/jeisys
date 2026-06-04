import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { Award, Landmark } from 'lucide-react';
import { adminService } from '../../../services/adminService';

export function CreditEquipmentPage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedEq, setSelectedEq] = useState<string>('');

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const data = await adminService.getCreditEquipmentStats(dateRange);
        setStats(data);
        if (data.equipmentList.length > 0) {
          setSelectedEq(data.equipmentList[0].equipmentType);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  const { equipmentList, topHospitals } = stats;
  const currentTopHospitals = topHospitals[selectedEq] || [];

  return (
    <div className="space-y-6">
      {/* 장비별 크레딧 성과 테이블 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#21358D]" />
            <span>장비별 크레딧 운영 성과</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            각 장비별 크레딧 발행과 사용 소진율, 현재 활성 잔액 규모를 나타냅니다.
            <span className="text-[#21358D] font-semibold ml-1 block sm:inline">💡 장비 모델 행을 클릭하면 하단에서 병원별 보유 랭킹(Top 5)이 변경됩니다.</span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="py-4 px-6 font-semibold text-neutral-700 w-28 text-center whitespace-nowrap">조회 선택</th>
                <th className="py-4 px-6 font-semibold text-neutral-700">장비 모델</th>
                <th className="py-4 px-6 font-semibold text-neutral-700 text-right">누적 발행액</th>
                <th className="py-4 px-6 font-semibold text-neutral-700 text-right">누적 사용액</th>
                <th className="py-4 px-6 font-semibold text-neutral-700 text-right">사용 소진율</th>
                <th className="py-4 px-6 font-semibold text-neutral-700 text-right">현재 잔액</th>
                <th className="py-4 px-6 font-semibold text-neutral-700 text-right">활성 크레딧 수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-sans">
              {equipmentList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-neutral-400">
                    크레딧이 발급된 장비 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                equipmentList.map((item: any) => (
                  <tr
                    key={item.equipmentType}
                    onClick={() => setSelectedEq(item.equipmentType)}
                    style={selectedEq === item.equipmentType ? { borderLeftColor: '#21358D' } : {}}
                    className={`hover:bg-neutral-50/50 cursor-pointer transition-all border-l-4 ${
                      selectedEq === item.equipmentType
                        ? 'bg-blue-50/10 font-semibold'
                        : 'border-l-transparent hover:border-l-neutral-300'
                    }`}
                  >
                    <td className="py-5 px-6 text-center">
                      <span
                        style={selectedEq === item.equipmentType ? { backgroundColor: '#21358D', color: '#ffffff', borderColor: '#21358D' } : {}}
                        className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                          selectedEq === item.equipmentType
                            ? ''
                            : 'bg-white text-neutral-400 border-neutral-200 hover:text-[#21358D] hover:border-[#21358D]'
                        }`}
                      >
                        {selectedEq === item.equipmentType ? '선택됨' : '조회'}
                      </span>
                    </td>
                    <td className="py-5 px-6 font-semibold text-neutral-900">
                      {item.equipmentType}
                    </td>
                    <td className="py-5 px-6 text-right text-neutral-800">₩{item.issued.toLocaleString()}</td>
                    <td className="py-5 px-6 text-right text-neutral-800">₩{item.used.toLocaleString()}</td>
                    <td className="py-5 px-6 text-right">
                      <span className="font-bold text-green-600">{item.usageRate}%</span>
                    </td>
                    <td className="py-5 px-6 text-right font-bold text-neutral-900">₩{item.remaining.toLocaleString()}</td>
                    <td className="py-5 px-6 text-right text-neutral-700">{item.activeCount}건</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 장비별 상위 보유 고객 랭킹 */}
      {selectedEq && (
        <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#21358D]" />
                <span>[{selectedEq}] 크레딧 보유 상위 병원 랭킹 (Top 5)</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-1">현재 활성 상태인 {selectedEq} 크레딧 잔액을 가장 많이 보유한 주요 고객사 목록입니다.</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-full">{selectedEq}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-6 font-semibold text-neutral-700 w-20 text-center">순위</th>
                  <th className="py-3 px-6 font-semibold text-neutral-700">병원명</th>
                  <th className="py-3 px-6 font-semibold text-neutral-700">대표자명</th>
                  <th className="py-3 px-6 font-semibold text-neutral-700 text-right">보유 잔액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans">
                {currentTopHospitals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-neutral-400">
                      해당 장비의 크레딧 잔액을 보유한 병원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  currentTopHospitals.map((h: any, idx: number) => (
                    <tr key={h.userId} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3.5 px-6 text-center">
                        <span className={`inline-flex items-center justify-center w-5.5 h-5.5 text-xs font-bold rounded-full ${
                          idx < 3
                            ? 'bg-[#21358D]/10 text-[#21358D] border border-[#21358D]/20'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-neutral-900">{h.hospitalName}</td>
                      <td className="py-3.5 px-6 text-neutral-600">{h.userName}</td>
                      <td className="py-3.5 px-6 text-right font-bold text-[#21358D]">₩{h.remaining.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
