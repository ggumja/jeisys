import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { Coins, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { adminService } from '../../../services/adminService';

const COLORS = ['#21358D', '#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function CreditOverviewPage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const data = await adminService.getCreditOverviewStats(dateRange);
        setStats(data);
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

  const { summary, equipmentDistribution, monthlyTrend } = stats;

  return (
    <div className="space-y-6">
      {/* 요약 지표 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 누적 발행액 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-50 text-[#21358D] rounded">
              <Coins className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600 font-semibold">누적 총 발행액</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">₩{summary.totalIssued.toLocaleString()}</p>
          <p className="text-xs text-neutral-400 mt-2 font-medium">선택 기간 내 신규 충전</p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#21358D]/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
        </div>

        {/* 누적 사용액 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-50 text-green-600 rounded">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600 font-semibold">누적 총 사용액</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">₩{summary.totalUsed.toLocaleString()}</p>
          <p className="text-xs text-neutral-400 mt-2 font-medium">선택 기간 내 실제 차감</p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
        </div>

        {/* 현재 총 잔액 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600 font-semibold">현재 총 잔액</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">₩{summary.totalRemaining.toLocaleString()}</p>
          <p className="text-xs text-neutral-400 mt-2 font-medium">모든 고객사 미소진 활성액</p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
        </div>

        {/* 누적 만료액 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm relative overflow-hidden group hover:border-[#21358D]/30 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600 font-semibold">누적 총 만료액</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">₩{summary.totalExpired.toLocaleString()}</p>
          <p className="text-xs text-neutral-400 mt-2 font-medium">유효기간 종료 미사용 소멸</p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 월별 발행 vs 사용 추이 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#21358D]" />
            <span>월별 발행 vs 사용 추이</span>
          </h3>
          <p className="text-xs text-neutral-500 mb-6">최근 6개월간 신규 발급액과 실제 차감액 추이를 분석합니다.</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="month" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
                <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} formatter={(v: any) => `₩${(v/10000).toLocaleString()}만`} />
                <Tooltip formatter={(value: any) => [`₩${value.toLocaleString()}`, '']} />
                <Bar dataKey="발행액" fill="#21358D" barSize={20} radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="사용액" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 장비별 잔액 분포 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm">
          <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#21358D]" />
            <span>장비별 잔액 비중</span>
          </h3>
          <p className="text-xs text-neutral-500 mb-6">현재 유효한 크레딧 잔액의 장비별 구성 비율입니다.</p>
          <div className="h-[220px]">
            {equipmentDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={equipmentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {equipmentDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₩${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-400 text-sm">
                활성 크레딧 잔액이 없습니다.
              </div>
            )}
          </div>
          {/* 차트 레전드 */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-neutral-600">
            {equipmentDistribution.map((item: any, idx: number) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
