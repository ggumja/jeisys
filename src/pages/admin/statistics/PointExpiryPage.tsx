import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import type { PointAnalyticsContext } from './PointAnalyticsLayout';
import * as XLSX from 'xlsx';

interface ExpiryItem {
  id: string;
  hospitalName: string;
  userName: string;
  sapCustomerCode: string;
  remaining: number;
  expiryDate: string;
  phone: string;
  daysRemaining: number;
}

function generateExpiryData(): ExpiryItem[] {
  return [
    { id: '1', hospitalName: '제이시스 메디컬 본사', userName: '관리자', sapCustomerCode: 'SAP-100201', remaining: 450000, expiryDate: '2026-08-10', phone: '010-1234-5678', daysRemaining: 12 },
    { id: '2', hospitalName: '서울의원', userName: '김철수', sapCustomerCode: 'SAP-100892', remaining: 120000, expiryDate: '2026-08-18', phone: '010-9876-5432', daysRemaining: 20 },
    { id: '3', hospitalName: '강남 피부과의원', userName: '이영희', sapCustomerCode: 'SAP-100512', remaining: 300000, expiryDate: '2026-08-25', phone: '010-5555-4321', daysRemaining: 27 },
    { id: '4', hospitalName: '미래성형외과', userName: '박민수', sapCustomerCode: 'SAP-100340', remaining: 85000, expiryDate: '2026-09-05', phone: '010-2222-3333', daysRemaining: 38 },
    { id: '5', hospitalName: '연세피부과의원', userName: '정수진', sapCustomerCode: 'SAP-100771', remaining: 500000, expiryDate: '2026-09-20', phone: '010-8888-9999', daysRemaining: 53 },
    { id: '6', hospitalName: '뷰티클리닉', userName: '최동현', sapCustomerCode: 'SAP-100419', remaining: 220000, expiryDate: '2026-10-15', phone: '010-4444-1111', daysRemaining: 78 }
  ];
}

export function PointExpiryPage() {
  const { onRegisterExport, label } = useOutletContext<PointAnalyticsContext>();
  const [selectedRange, setSelectedRange] = useState<30 | 60 | 90>(30);

  const rawList = generateExpiryData();
  const filteredList = rawList.filter(row => row.daysRemaining <= selectedRange);

  const exp30 = rawList.filter(r => r.daysRemaining <= 30);
  const exp60 = rawList.filter(r => r.daysRemaining <= 60);
  const exp90 = rawList.filter(r => r.daysRemaining <= 90);

  const summary = {
    exp30: { amount: exp30.reduce((s, r) => s + r.remaining, 0), count: exp30.length, hospitalCount: new Set(exp30.map(r => r.hospitalName)).size },
    exp60: { amount: exp60.reduce((s, r) => s + r.remaining, 0), count: exp60.length, hospitalCount: new Set(exp60.map(r => r.hospitalName)).size },
    exp90: { amount: exp90.reduce((s, r) => s + r.remaining, 0), count: exp90.length, hospitalCount: new Set(exp90.map(r => r.hospitalName)).size },
  };

  const exportFn = useCallback(async () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredList.map((d, idx) => ({
        순번: idx + 1,
        병원명: d.hospitalName,
        SAP고객코드: d.sapCustomerCode,
        회원명: d.userName,
        만료예정포인트: `${d.remaining.toLocaleString()} P`,
        만료예정일: d.expiryDate,
        남은일수: `${d.daysRemaining}일 전`,
        연락처: d.phone
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '만료임박포인트');
    XLSX.writeFile(wb, `포인트만료임박통계_${label}.xlsx`);
  }, [filteredList, label]);

  useEffect(() => {
    onRegisterExport(exportFn);
    return () => onRegisterExport(null);
  }, [exportFn, onRegisterExport]);

  return (
    <div className="space-y-6">
      {/* 만료 임박 구간별 요약 */}
      <div className="flex flex-row flex-nowrap overflow-x-auto pb-1 gap-3 scrollbar-thin">
        {/* 30일 이내 */}
        <div 
          onClick={() => setSelectedRange(30)}
          style={selectedRange === 30 ? { borderColor: '#21358D' } : {}}
          className={`bg-white p-5 shadow-sm relative group cursor-pointer transition-all duration-200 rounded border-2 flex-1 min-w-[200px] ${
            selectedRange === 30 ? 'bg-blue-50/5' : 'border-red-100 hover:border-red-200'
          }`}
        >
          <span className="text-xs text-neutral-500 font-semibold block mb-1">30일 이내 만료 예정</span>
          <p className="text-lg font-bold text-red-600 leading-tight">{summary.exp30.amount.toLocaleString()} P</p>
          <div className="mt-1 text-xs text-neutral-500 font-semibold flex justify-between whitespace-nowrap gap-2">
            <span>대상 건수: {summary.exp30.count}건</span>
            <span>대상 병원: {summary.exp30.hospitalCount}개사</span>
          </div>
        </div>

        {/* 60일 이내 */}
        <div 
          onClick={() => setSelectedRange(60)}
          style={selectedRange === 60 ? { borderColor: '#21358D' } : {}}
          className={`bg-white p-5 shadow-sm relative group cursor-pointer transition-all duration-200 rounded border-2 flex-1 min-w-[200px] ${
            selectedRange === 60 ? 'bg-blue-50/5' : 'border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <span className="text-xs text-neutral-500 font-semibold block mb-1">60일 이내 만료 예정</span>
          <p className="text-lg font-bold text-neutral-800 leading-tight">{summary.exp60.amount.toLocaleString()} P</p>
          <div className="mt-1 text-xs text-neutral-500 font-semibold flex justify-between whitespace-nowrap gap-2">
            <span>대상 건수: {summary.exp60.count}건</span>
            <span>대상 병원: {summary.exp60.hospitalCount}개사</span>
          </div>
        </div>

        {/* 90일 이내 */}
        <div 
          onClick={() => setSelectedRange(90)}
          style={selectedRange === 90 ? { borderColor: '#21358D' } : {}}
          className={`bg-white p-5 shadow-sm relative group cursor-pointer transition-all duration-200 rounded border-2 flex-1 min-w-[200px] ${
            selectedRange === 90 ? 'bg-blue-50/5' : 'border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <span className="text-xs text-neutral-500 font-semibold block mb-1">90일 이내 만료 예정</span>
          <p className="text-lg font-bold text-neutral-800 leading-tight">{summary.exp90.amount.toLocaleString()} P</p>
          <div className="mt-1 text-xs text-neutral-500 font-semibold flex justify-between whitespace-nowrap gap-2">
            <span>대상 건수: {summary.exp90.count}건</span>
            <span>대상 병원: {summary.exp90.hospitalCount}개사</span>
          </div>
        </div>
      </div>

      {/* 만료 임박 상세 내역 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex items-start">
          <div>
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>{selectedRange}일 이내 만료 예정 상세 리스트</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1">곧 소멸 예정인 미사용 포인트 보유 현황이며, 즉각적인 소진 프로모션 안내가 필요합니다.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-3 font-semibold text-neutral-700 w-10 text-center whitespace-nowrap">No.</th>
                <th className="py-3 px-4 font-semibold text-neutral-700">병원명</th>
                <th className="py-3 px-3 font-semibold text-neutral-700 w-28">SAP코드</th>
                <th className="py-3 px-4 font-semibold text-neutral-700 w-28">고객명</th>
                <th className="py-3 px-3 font-semibold text-neutral-700 text-right w-36 whitespace-nowrap">만료예정 포인트</th>
                <th className="py-3 px-3 font-semibold text-neutral-700 text-center w-32 whitespace-nowrap">만료 예정일</th>
                <th className="py-3 px-3 font-semibold text-neutral-700 text-center w-28 whitespace-nowrap">연락처</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-sans">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-neutral-400">
                    {selectedRange}일 이내에 만료 예정인 활성 포인트가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredList.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-3 text-center text-neutral-400 font-mono text-xs">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-semibold text-neutral-900">{row.hospitalName}</td>
                    <td className="py-3.5 px-3 text-indigo-600 font-mono text-xs">{row.sapCustomerCode}</td>
                    <td className="py-3.5 px-4 text-neutral-800">{row.userName}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-red-600 whitespace-nowrap">{row.remaining.toLocaleString()} P</td>
                    <td className="py-3.5 px-3 text-center text-neutral-600 text-xs font-mono whitespace-nowrap">
                      {row.expiryDate}
                      <span className="block text-[11px] text-red-500 font-sans mt-0.5">({row.daysRemaining}일 남음)</span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-neutral-500 text-xs font-mono whitespace-nowrap">{row.phone}</td>
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
