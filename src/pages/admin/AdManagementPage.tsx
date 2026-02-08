import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { Plus, Edit, Trash2, X, Save, Link as LinkIcon, Megaphone, Layout, Mail, Maximize, Sidebar, Upload, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adService, Ad, AdPlacement } from '../../services/adService';
import { formatDate } from '../../lib/utils';

const placements: { id: AdPlacement; label: string; icon: any }[] = [
    { id: 'main_banner', label: '메인 배너', icon: Layout },
    { id: 'email_banner', label: '이메일 배너', icon: Mail },
    { id: 'popup', label: '팝업 광고', icon: Maximize },
    { id: 'side_banner', label: '사이드 배너', icon: Sidebar },
];

export function AdManagementPage() {
    const location = useLocation();
    const [ads, setAds] = useState<Ad[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedPlacement, setSelectedPlacement] = useState<AdPlacement | 'all'>('all');

    const viewMode = location.pathname.endsWith('/stats') ? 'stats' : 'list';

    const [rawStats, setRawStats] = useState<any[]>([]);
    const [statsData, setStatsData] = useState<any[]>([]);

    const pcFileRef = useRef<HTMLInputElement>(null);
    const mobileFileRef = useRef<HTMLInputElement>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        placement: 'main_banner' as AdPlacement,
        imagePcUrl: '',
        imageMobileUrl: '',
        linkUrl: '',
        startDate: '',
        endDate: '',
        isActive: true,
        displayOrder: 0,
    });

    useEffect(() => {
        if (viewMode === 'list') {
            fetchAds();
        } else {
            fetchStats();
        }
    }, [selectedPlacement, viewMode]);

    const fetchAds = async () => {
        try {
            setIsLoading(true);
            const data = await adService.getAds(selectedPlacement === 'all' ? undefined : selectedPlacement);
            setAds(data);
        } catch (error) {
            console.error('Failed to fetch ads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            setIsLoading(true);
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const data = await adService.getStats(startDate, endDate);
            setRawStats(data);

            // Group by date for chart
            const grouped = data.reduce((acc: any, curr: any) => {
                const date = curr.statDate;
                if (!acc[date]) acc[date] = { date, impressions: 0, clicks: 0 };
                acc[date].impressions += curr.impressions;
                acc[date].clicks += curr.clicks;
                return acc;
            }, {});

            setStatsData(Object.values(grouped));
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (ad?: Ad) => {
        if (ad) {
            setEditingAd(ad);
            setFormData({
                title: ad.title,
                placement: ad.placement,
                imagePcUrl: ad.imagePcUrl || '',
                imageMobileUrl: ad.imageMobileUrl || '',
                linkUrl: ad.linkUrl,
                startDate: ad.startDate ? ad.startDate.split('T')[0] : '',
                endDate: ad.endDate ? ad.endDate.split('T')[0] : '',
                isActive: ad.isActive,
                displayOrder: ad.displayOrder,
            });
        } else {
            setEditingAd(null);
            setFormData({
                title: '',
                placement: 'main_banner',
                imagePcUrl: '',
                imageMobileUrl: '',
                linkUrl: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                isActive: true,
                displayOrder: 0,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAd(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'pc' | 'mobile') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const publicUrl = await adService.uploadAdImage(file);
            setFormData(prev => ({
                ...prev,
                [type === 'pc' ? 'imagePcUrl' : 'imageMobileUrl']: publicUrl
            }));
        } catch (error) {
            console.error('Upload failed:', error);
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isUploading) return;

        try {
            const dataToSave = {
                ...formData,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
            };

            if (editingAd) {
                await adService.updateAd(editingAd.id, dataToSave);
            } else {
                await adService.createAd(dataToSave);
            }
            fetchAds();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save ad:', error);
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말로 이 광고를 삭제하시겠습니까?')) return;
        try {
            await adService.deleteAd(id);
            fetchAds();
        } catch (error) {
            console.error('Failed to delete ad:', error);
        }
    };

    const getPlacementLabel = (id: AdPlacement) => {
        return placements.find(p => p.id === id)?.label || id;
    };

    const renderStats = () => {
        const totalImpressions = statsData.reduce((sum, d) => sum + d.impressions, 0);
        const totalClicks = statsData.reduce((sum, d) => sum + d.clicks, 0);
        const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 border border-neutral-200">
                        <div className="text-sm text-neutral-500 mb-1">총 노출수 (7일)</div>
                        <div className="text-3xl font-bold text-neutral-900">{totalImpressions.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-6 border border-neutral-200">
                        <div className="text-sm text-neutral-500 mb-1">총 클릭수 (7일)</div>
                        <div className="text-3xl font-bold text-neutral-900">{totalClicks.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-6 border border-neutral-200">
                        <div className="text-sm text-neutral-500 mb-1">평균 클릭률 (CTR)</div>
                        <div className="text-3xl font-bold text-[#1e3a8a]">{avgCtr.toFixed(2)}%</div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="bg-white p-8 border border-neutral-200">
                    <h4 className="text-lg font-medium text-neutral-900 mb-8">일별 노출 및 클릭 추이</h4>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                                <YAxis fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Legend />
                                <Bar dataKey="impressions" name="노출수" fill="#e5e5e5" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="clicks" name="클릭수" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Placement Summary */}
                <div className="bg-white border border-neutral-200">
                    <div className="px-6 py-4 border-b border-neutral-200">
                        <h4 className="font-medium text-neutral-900">지면별 성과 요약</h4>
                    </div>
                    <div className="overflow-x_auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">지면</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">노출수</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">클릭수</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">클릭률 (CTR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {placements.map(p => {
                                    const pStats = rawStats.filter(s => s.adPlacement === p.id);
                                    const impressions = pStats.reduce((sum, s) => sum + s.impressions, 0);
                                    const clicks = pStats.reduce((sum, s) => sum + s.clicks, 0);
                                    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

                                    return (
                                        <tr key={p.id}>
                                            <td className="px-6 py-4 text-sm text-neutral-900 font-medium">{p.label}</td>
                                            <td className="px-6 py-4 text-sm text-neutral-600">{impressions.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm text-neutral-600">{clicks.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm text-neutral-600">{ctr.toFixed(2)}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl tracking-tight text-neutral-900">
                        {viewMode === 'list' ? '광고/배너 목록' : '노출/클릭 통계'}
                    </h3>
                </div>
                {viewMode === 'list' && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        <span>광고 등록</span>
                    </button>
                )}
            </div>

            {viewMode === 'list' ? (
                <>
                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2 border-b border-neutral-200">
                        <button
                            onClick={() => setSelectedPlacement('all')}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${selectedPlacement === 'all'
                                ? 'border-neutral-900 text-neutral-900'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            전체
                        </button>
                        {placements.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPlacement(p.id)}
                                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${selectedPlacement === p.id
                                    ? 'border-neutral-900 text-neutral-900'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white border border-neutral-200">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-50 border-b border-neutral-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                                            지면
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                                            광고명
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                                            노출 기간
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                                            상태
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                                            순서
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                                            관리
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200">
                                    {isLoading ? (
                                        <tr><td colSpan={6} className="px-6 py-10 text-center text-neutral-500 text-sm">로딩 중...</td></tr>
                                    ) : ads.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-10 text-center text-neutral-500 text-sm">등록된 광고가 없습니다.</td></tr>
                                    ) : (
                                        ads.map((ad) => (
                                            <tr key={ad.id} className="hover:bg-neutral-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-xs font-medium px-2 py-1 bg-neutral-100 text-neutral-700 rounded">
                                                        {getPlacementLabel(ad.placement)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0">
                                                            {ad.imagePcUrl ? (
                                                                <img src={ad.imagePcUrl} alt="" className="w-full h-full object-contain" />
                                                            ) : (
                                                                <Megaphone className="w-5 h-5 text-neutral-400" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-neutral-900 truncate">{ad.title}</div>
                                                            <div className="text-xs text-neutral-500 truncate">{ad.linkUrl}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                                                    <div className="flex flex-col">
                                                        <span>{ad.startDate ? formatDate(ad.startDate) : '시작일 없음'}</span>
                                                        <span className="text-neutral-400">~</span>
                                                        <span>{ad.endDate ? formatDate(ad.endDate) : '종료일 없음'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${ad.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-neutral-100 text-neutral-800'
                                                        }`}>
                                                        {ad.isActive ? '노출중' : '비노출'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                                                    {ad.displayOrder}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenModal(ad)}
                                                            className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                                                            title="수정"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(ad.id)}
                                                            className="p-2 border border-neutral-300 text-red-600 hover:bg-red-50 transition-colors"
                                                            title="삭제"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                renderStats()
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                            <h4 className="font-medium text-neutral-900">
                                {editingAd ? '광고 수정' : '신규 광고 등록'}
                            </h4>
                            <button onClick={handleCloseModal} className="text-neutral-500 hover:text-neutral-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">광고 명칭</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-neutral-900 outline-none text-sm"
                                        placeholder="관리용 이름을 입력하세요"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">노출 지면</label>
                                    <select
                                        value={formData.placement}
                                        onChange={(e) => setFormData({ ...formData, placement: e.target.value as AdPlacement })}
                                        className="w-full px-4 py-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-neutral-900 outline-none text-sm bg-white"
                                    >
                                        {placements.map(p => (
                                            <option key={p.id} value={p.id}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">노출 순서</label>
                                    <input
                                        type="number"
                                        value={formData.displayOrder}
                                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-neutral-900 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">이동할 URL (Link)</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        value={formData.linkUrl}
                                        onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-neutral-900 outline-none text-sm"
                                        placeholder="https://..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">PC 이미지 (파일찾기)</label>
                                    <div className="flex flex-col gap-2">
                                        {formData.imagePcUrl ? (
                                            <div className="relative aspect-[21/9] bg-neutral-100 border border-neutral-200 overflow-hidden group">
                                                <img src={formData.imagePcUrl} alt="PC Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => pcFileRef.current?.click()}
                                                        className="p-2 bg-white rounded-full shadow-lg hover:bg-neutral-50"
                                                    >
                                                        <Edit className="w-4 h-4 text-neutral-900" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => pcFileRef.current?.click()}
                                                className="aspect-[21/9] border-2 border-dashed border-neutral-300 rounded flex flex-col items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
                                            >
                                                <Upload className="w-6 h-6 text-neutral-400" />
                                                <span className="text-xs text-neutral-500">이미지 업로드</span>
                                            </button>
                                        )}
                                        <input
                                            type="file"
                                            ref={pcFileRef}
                                            onChange={(e) => handleFileUpload(e, 'pc')}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                        {formData.imagePcUrl && (
                                            <div className="text-[10px] text-neutral-400 truncate">{formData.imagePcUrl}</div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">모바일 이미지 (선택사항)</label>
                                    <div className="flex flex-col gap-2">
                                        {formData.imageMobileUrl ? (
                                            <div className="relative aspect-[9/12] bg-neutral-100 border border-neutral-200 overflow-hidden group w-2/3 mx-auto">
                                                <img src={formData.imageMobileUrl} alt="Mobile Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => mobileFileRef.current?.click()}
                                                        className="p-2 bg-white rounded-full shadow-lg hover:bg-neutral-50"
                                                    >
                                                        <Edit className="w-4 h-4 text-neutral-900" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => mobileFileRef.current?.click()}
                                                className="aspect-[9/12] border-2 border-dashed border-neutral-300 rounded flex flex-col items-center justify-center gap-2 hover:bg-neutral-50 transition-colors w-2/3 mx-auto"
                                            >
                                                <Upload className="w-6 h-6 text-neutral-400" />
                                                <span className="text-xs text-neutral-500">이미지 업로드</span>
                                            </button>
                                        )}
                                        <input
                                            type="file"
                                            ref={mobileFileRef}
                                            onChange={(e) => handleFileUpload(e, 'mobile')}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                        {formData.imageMobileUrl && (
                                            <div className="text-[10px] text-neutral-400 truncate text-center">{formData.imageMobileUrl}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">게시 시작일</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-neutral-900 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">게시 종료일</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-neutral-900 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 py-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-neutral-900 border-neutral-300 rounded"
                                />
                                <label htmlFor="isActive" className="text-sm text-neutral-700">현재 광고 활성화 (노출 허용)</label>
                            </div>
                        </form>
                        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 bg-neutral-50">
                            <button
                                onClick={handleCloseModal}
                                className="px-6 py-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-900"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isUploading}
                                className={`px-8 py-2.5 bg-neutral-900 text-white rounded text-sm font-medium flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-800'}`}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        업로드 중...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        저장하기
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
