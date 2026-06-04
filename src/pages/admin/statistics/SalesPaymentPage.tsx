import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Wallet, TrendingUp } from 'lucide-react';
import { adminService } from '../../../services/adminService';

const COLORS = ['#21358D', '#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#64748b'];

export function SalesPaymentPage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const stats = await adminService.getSalesPaymentStats(dateRange);
        setData(stats);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  const { paymentStats, trendData } = data;

  // 전체 트렌드 차트에 사용된 고유한 결제 수단 추출 (차트 Bar 목록 생성용)
  const uniqueMethods = Array.from(
    new Set(
      paymentStats.map((p: any) => p.method)
    )
  ) as string[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 결제 수단별 금액 비중 리스트 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#21358D]" />
              <span>결제수단별 점유율</span>
            </h3>
            <p className="text-xs text-neutral-500 mb-6">주문 시 선택된 결제수단별 매출 누적액과 비중입니다.</p>
          </div>
          <div className="space-y-5 flex-1 flex flex-col justify-center">
            {paymentStats.map((payment: any, index: number) => {
              const color = COLORS[index % COLORS.length];
              return (
                <div key={payment.method} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span>{payment.method}</span>
                      <span className="text-neutral-400 font-normal">({payment.count}건)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-neutral-900">₩{payment.amount.toLocaleString()}</span>
                      <span className="text-[#21358D] ml-1.5">{payment.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${payment.percentage}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-neutral-200 flex justify-between items-center text-sm font-semibold text-neutral-800">
            <span>총 결제금액</span>
            <span className="text-base text-neutral-950 font-bold">
              ₩{paymentStats.reduce((sum: number, p: any) => sum + p.amount, 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* 월별 결제수단 비중 변화 트렌드 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#21358D]" />
            <span>결제 수단별 트렌드 추이</span>
          </h3>
          <p className="text-xs text-neutral-500 mb-6">시간 흐름에 따른 각 결제 수단의 누적 매출 추세입니다.</p>
          <div className="h-[320px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
                  <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} formatter={(v: number) => `₩${(v / 10000).toLocaleString()}만`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px' }}
                    formatter={(value: number) => [`₩${value.toLocaleString()}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
                  {uniqueMethods.map((method, index) => (
                    <Bar
                      key={method}
                      dataKey={method}
                      name={method}
                      stackId="a"
                      fill={COLORS[index % COLORS.length]}
                      radius={index === uniqueMethods.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-400 text-sm">
                비교 분석할 트렌드 데이터가 충분하지 않습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
