import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { Award } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import * as XLSX from 'xlsx';

export function SalesCustomerTypePage() {
  const { dateRange, onRegisterExport, label } = useOutletContext<{
    dateRange: string;
    onRegisterExport: (fn: (() => void) | null) => void;
    label: string;
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [typesData, setTypesData] = useState<any[]>([]);

  // 엑셀 다운로드 핸들러 정의
  const handleExport = useCallback(() => {
    if (!typesData || typesData.length === 0) return;

    try {
      const titleRows = [
        ['고객유형별 매출 순위'],
        [`분석 기간: ${label}`],
        []
      ];

      const headers = ['순위', '고객유형', '구매고객 수', '총 주문건수', '평균 주문액', '매출 비중', '누적 매출액'];
      const body = typesData.map((t: any) => [
        t.rank,
        t.memberType,
        t.customers,
        t.orders,
        t.avgOrder,
        `${t.percentage}%`,
        t.totalSales
      ]);

      const ws = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...body]);
      ws['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 20 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '고객유형별 매출 순위');

      const now = new Date();
      const dateSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      XLSX.writeFile(wb, `고객유형별_매출순위_${dateSuffix}.xlsx`);
    } catch (error) {
      console.error('고객유형별 매출 순위 엑셀 다운로드 실패:', error);
    }
  }, [typesData, label]);

  // 엑셀 다운로드 함수 등록
  useEffect(() => {
    if (typesData && typesData.length > 0) {
      onRegisterExport(handleExport);
    } else {
      onRegisterExport(null);
    }
    return () => {
      onRegisterExport(null);
    };
  }, [typesData, handleExport, onRegisterExport]);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const stats = await adminService.getSalesCustomerTypeStats(dateRange);
        setTypesData(stats);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange]);

  return (
    <div className="space-y-6">
      {/* 테이블 목록 */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-neutral-200">
          <div>
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#21358D]" />
              <span>고객유형별 매출 순위</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1">선택한 기간 동안의 각 고객유형(분류)별 누적 매출 및 점유율 현황입니다.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 w-24 text-center">순위</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700">고객유형</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">구매고객 수</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">총 주문건수</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">평균 주문액</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">매출 비중</th>
                <th className="py-3.5 px-6 font-semibold text-neutral-700 text-right">누적 매출액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#21358D] mx-auto" />
                  </td>
                </tr>
              ) : typesData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-neutral-400">
                    조회된 고객유형별 매출 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                typesData.map((t) => (
                  <tr key={t.memberType} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${
                        t.rank <= 3
                          ? 'bg-[#21358D]/10 text-[#21358D] border border-[#21358D]/20'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {t.rank}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-neutral-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#21358D] border border-blue-100">
                        {t.memberType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-neutral-600 font-medium">{t.customers.toLocaleString()}명</td>
                    <td className="py-4 px-6 text-right text-neutral-600 font-medium">{t.orders.toLocaleString()}건</td>
                    <td className="py-4 px-6 text-right text-neutral-600 font-medium">₩{t.avgOrder.toLocaleString()}</td>
                    <td className="py-4 px-6 text-right font-semibold text-[#21358D]">{t.percentage}%</td>
                    <td className="py-4 px-6 text-right font-bold text-neutral-950">₩{t.totalSales.toLocaleString()}</td>
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
