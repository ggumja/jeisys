import { useEffect, useCallback, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router';
import { Eye, ShoppingBag, ExternalLink, TrendingUp, Layers } from 'lucide-react';
import type { VisitAnalyticsContext } from './VisitAnalyticsLayout';
import * as XLSX from 'xlsx';

interface PageViewStat {
  rank: number;
  path: string;
  title: string;
  type: 'product' | 'page' | 'notice';
  views: number;
  uniqueViews: number;
  avgDurationSec: number;
  bounceRate: number;
}

function generatePopularPagesData(): PageViewStat[] {
  const pages: Omit<PageViewStat, 'rank'>[] = [
    { path: '/products/b83a63e6-b3a9-40b7-ba65-f6cf1ee35780', title: 'POTENZA 전용 DIAMOND Tip (비침습 핸드피스 전용)', type: 'product', views: 1420, uniqueViews: 980, avgDurationSec: 145, bounceRate: 22.4 },
    { path: '/products/classic-f-tip', title: 'Classic-F-Tip 300샷 핸드피스 팁', type: 'product', views: 1150, uniqueViews: 810, avgDurationSec: 130, bounceRate: 24.1 },
    { path: '/', title: '메인 홈', type: 'page', views: 3200, uniqueViews: 2100, avgDurationSec: 65, bounceRate: 35.0 },
    { path: '/products', title: '전체 상품 목록 목록페이지', type: 'page', views: 2400, uniqueViews: 1650, avgDurationSec: 85, bounceRate: 28.5 },
    { path: '/products/linearz-cartridge', title: 'LinearZ 카트리지 (전용 소모품)', type: 'product', views: 890, uniqueViews: 620, avgDurationSec: 160, bounceRate: 19.8 },
    { path: '/my/subscriptions', title: '마이페이지 - 정기공급 현황', type: 'page', views: 760, uniqueViews: 510, avgDurationSec: 110, bounceRate: 15.2 },
    { path: '/products/denfasa-tip', title: 'DENFASA 바디 팁 세트', type: 'product', views: 640, uniqueViews: 430, avgDurationSec: 125, bounceRate: 26.0 },
    { path: '/cart', title: '장바구니', type: 'page', views: 1280, uniqueViews: 940, avgDurationSec: 95, bounceRate: 18.0 },
    { path: '/communication/notice', title: '고객센터 - 공지사항', type: 'notice', views: 420, uniqueViews: 310, avgDurationSec: 45, bounceRate: 40.2 },
    { path: '/communication/education', title: '임상 교육 및 학술 세미나 안내', type: 'notice', views: 390, uniqueViews: 280, avgDurationSec: 180, bounceRate: 21.0 },
  ];

  // 조회수 기준 내림차순 정렬 후 랭킹 지정
  return pages
    .sort((a, b) => b.views - a.views)
    .map((p, idx) => ({ rank: idx + 1, ...p }));
}

function fmtSec(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}분 ${sec}초` : `${sec}초`;
}

export function VisitPopularPagesPage() {
  const { onRegisterExport, label } = useOutletContext<VisitAnalyticsContext>();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'product' | 'page'>('all');

  const rawData = generatePopularPagesData();
  const data = rawData.filter(item => {
    if (filterType === 'product') return item.type === 'product';
    if (filterType === 'page') return item.type === 'page' || item.type === 'notice';
    return true;
  });

  const totalPv = rawData.reduce((s, d) => s + d.views, 0);
  const productPv = rawData.filter(d => d.type === 'product').reduce((s, d) => s + d.views, 0);
  const topProduct = rawData.find(d => d.type === 'product');

  const exportFn = useCallback(async () => {
    const ws = XLSX.utils.json_to_sheet(
      data.map((d) => ({
        순위: d.rank,
        페이지구분: d.type === 'product' ? '상품상세' : '일반페이지',
        페이지명: d.title,
        URL경로: d.path,
        조회수_PV: d.views,
        순방문자_UV: d.uniqueViews,
        평균체류시간: fmtSec(d.avgDurationSec),
        이탈율: `${d.bounceRate}%`
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '많이보는페이지');
    XLSX.writeFile(wb, `많이보는페이지통계_${label}.xlsx`);
  }, [data, label]);

  useEffect(() => {
    onRegisterExport(exportFn);
    return () => onRegisterExport(null);
  }, [exportFn, onRegisterExport]);

  const kpis = [
    { label: '전체 페이지 총 조회수(PV)', value: `${totalPv.toLocaleString()}회`, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '상품 페이지 조회수 비중', value: `${Math.round((productPv / (totalPv || 1)) * 100)}%`, icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '최다 조회 상품', value: topProduct ? topProduct.title.split(' ')[0] + '...' : '-', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '분석 대상 페이지 수', value: `${rawData.length}개`, icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white border border-neutral-200 rounded-lg p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${k.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-neutral-500 truncate">{k.label}</p>
                <p className="text-lg font-bold text-neutral-900 truncate" title={k.value}>{k.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 필터 탭 & 상위 인기 페이지 리스트 */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-neutral-800">페이지별 방문(상품 포함) 순위 TOP</h3>
          
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-md text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-sm transition-colors ${filterType === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              전체 보기
            </button>
            <button
              onClick={() => setFilterType('product')}
              className={`px-3 py-1.5 rounded-sm transition-colors ${filterType === 'product' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              상품 페이지
            </button>
            <button
              onClick={() => setFilterType('page')}
              className={`px-3 py-1.5 rounded-sm transition-colors ${filterType === 'page' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              일반/안내 페이지
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
              <tr>
                <th className="px-4 py-3 w-12 text-center">순위</th>
                <th className="px-4 py-3 w-20 text-center">구분</th>
                <th className="px-4 py-3">페이지 제목 / URL 경로</th>
                <th className="px-4 py-3 text-right">페이지뷰 (PV)</th>
                <th className="px-4 py-3 text-right">순방문자 (UV)</th>
                <th className="px-4 py-3 text-right">평균 체류시간</th>
                <th className="px-4 py-3 text-right">이탈율</th>
                <th className="px-4 py-3 text-center">이동</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.map((row) => {
                const isProduct = row.type === 'product';
                return (
                  <tr key={row.path} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3 text-center font-bold text-neutral-500">{row.rank}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded ${
                        isProduct ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                      }`}>
                        {isProduct ? '상품' : '일반'}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <p className="font-semibold text-neutral-900 truncate" title={row.title}>{row.title}</p>
                      <p className="text-[11px] text-neutral-400 font-mono truncate">{row.path}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-neutral-900">{row.views.toLocaleString()}회</td>
                    <td className="px-4 py-3 text-right text-neutral-600">{row.uniqueViews.toLocaleString()}명</td>
                    <td className="px-4 py-3 text-right text-neutral-600">{fmtSec(row.avgDurationSec)}</td>
                    <td className="px-4 py-3 text-right text-neutral-600">{row.bounceRate}%</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(row.path)}
                        className="p-1 text-neutral-400 hover:text-[#21358D] transition-colors rounded hover:bg-neutral-100"
                        title="페이지로 이동"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
