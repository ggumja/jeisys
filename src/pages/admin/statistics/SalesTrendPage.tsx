import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { Calendar, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { adminService } from '../../../services/adminService';

export function SalesTrendPage() {
  const { dateRange } = useOutletContext<{ dateRange: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [trendStats, setTrendStats] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const stats = await adminService.getSalesTrendStats(dateRange);
        setTrendStats(stats);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [dateRange]);

  if (isLoading || !trendStats) {
    return (
      <div className="flex items-center justify-center py-20 bg-white border border-neutral-200 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21358D]" />
      </div>
    );
  }

  const { dayStats, hourStats } = trendStats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 요일별 매출 및 주문수 분석 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm">
          <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#21358D]" />
            <span>요일별 주문 및 매출 분석</span>
          </h3>
          <p className="text-xs text-neutral-500 mb-6">주간 요일별 주문 활동량 및 총 매출 분포입니다.</p>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
                <YAxis yAxisId="left" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} formatter={(v: number) => `₩${(v / 10000).toLocaleString()}만`} />
                <YAxis yAxisId="right" orientation="right" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
                <Bar yAxisId="left" dataKey="sales" name="매출액" fill="#21358D" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="orders" name="주문건수" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 시간대별 주문 분포 분석 */}
        <div className="bg-white border border-neutral-200 p-6 shadow-sm">
          <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>24시간대별 주문 추이</span>
          </h3>
          <p className="text-xs text-neutral-500 mb-6">하루 중 몇 시에 주문이 활발히 들어오는지 시각화합니다.</p>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourStats}>
                <defs>
                  <linearGradient id="colorHourOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
                <YAxis stroke="#888888" style={{ fontSize: '11px', fontWeight: 500 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px' }}
                  formatter={(value: number) => [value, '주문건수']}
                />
                <Area type="monotone" dataKey="orders" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHourOrders)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
