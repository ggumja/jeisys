import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Search, UserCheck, UserX, Settings, X, Clock, Eye, Building2, Loader2, RefreshCw, ShoppingCart, Plus, Trash2, Tag } from 'lucide-react';
import { proxyOrderService } from '../../services/cartService';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAdminUsers, useUpdateUserStatus, useUserEquipments } from '../../hooks/useAdmin';
import { useModal } from '../../context/ModalContext';
import { adminService } from '../../services/adminService';
import { shopSettingsService } from '../../services/shopSettingsService';
import { toast } from 'sonner';

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  hospitalName: string;
  businessNumber: string;
  grade: 'VIP' | 'Gold' | 'Silver' | 'Bronze';
  status: 'active' | 'pending' | 'suspended';
  joinDate: string;
  totalOrders: number;
  totalSales?: number;
  phone?: string;
  mobile?: string;
  address?: string;
  zipCode?: string;
  addressDetail?: string;
  region?: string;
  hospitalEmail?: string;
  taxEmail?: string;
  memberType?: string | null;
}

interface MemberType {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

interface GradeSettings {
  id: string;
  name: string;
  minSales: string;
  discountRate: string;
}

const initialGradeSettings: GradeSettings[] = [
  { id: '1', name: 'VIP', minSales: '50000000', discountRate: '15' },
  { id: '2', name: 'Gold', minSales: '30000000', discountRate: '10' },
  { id: '3', name: 'Silver', minSales: '10000000', discountRate: '5' },
  { id: '4', name: 'Bronze', minSales: '0', discountRate: '0' },
];

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#EF4444', '#14B8A6', '#F97316',
  '#6366F1', '#64748B',
];

function UserEquipmentsList({ userId }: { userId: string }) {
  const { data: equipments, isLoading } = useUserEquipments(userId);

  if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!equipments || equipments.length === 0) return <p className="text-sm text-neutral-500 p-4 border border-dashed text-center">보유 중인 장비가 없습니다.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {equipments.map((eq: any) => (
        <div key={eq.id} className="flex items-center gap-4 p-4 border border-neutral-200">
          {eq.imageUrl ? (
            <img src={eq.imageUrl} alt={eq.name} className="w-16 h-16 object-cover rounded" />
          ) : (
            <div className="w-16 h-16 bg-neutral-100 flex items-center justify-center rounded">
              <Building2 className="w-8 h-8 text-neutral-400" />
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-neutral-900">{eq.name}</div>
            <div className="text-xs text-neutral-500">S/N: {eq.serialNumber}</div>
            <div className="text-xs text-neutral-500">설치일: {eq.installDate || '-'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MemberManagementPage() {
  const { alert: globalAlert, confirm: globalConfirm } = useModal();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const gradeFilter = searchParams.get('grade') || 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [isGradeSettingsOpen, setIsGradeSettingsOpen] = useState(false);
  const [gradeSettings, setGradeSettings] = useState<GradeSettings[]>(initialGradeSettings);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── 회원 분류 관련 state
  const [memberTypes, setMemberTypes] = useState<MemberType[]>([]);
  const [memberTypeFilter, setMemberTypeFilter] = useState('all');
  const [isMemberTypeModalOpen, setIsMemberTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState(PRESET_COLORS[0]);
  const [isAddingType, setIsAddingType] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [gradesEnabled, setGradesEnabled] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: members = [], isLoading, refetch } = useAdminUsers();
  const updateStatusMutation = useUpdateUserStatus();

  // 회원 분류 타입 로드
  const loadMemberTypes = async () => {
    try {
      const types = await adminService.getMemberTypes();
      setMemberTypes(types as MemberType[]);
    } catch (e) {
      console.error('회원 분류 로드 실패:', e);
    }
  };

  useEffect(() => {
    loadMemberTypes();
    shopSettingsService.getAll().then((settings) => {
      setGradesEnabled(settings['grades_enabled'] !== 'false');
    }).catch(console.error);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    await refetch();
    setIsRefreshing(false);
  };

  const setGradeFilter = (grade: string) => {
    setCurrentPage(1);
    if (grade === 'all') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('grade');
      setSearchParams(newParams);
    } else {
      setSearchParams({ grade });
    }
  };

  // 회원 분류 추가
  const handleCreateType = async () => {
    if (!newTypeName.trim()) { toast.error('분류명을 입력해주세요.'); return; }
    setIsAddingType(true);
    try {
      await adminService.createMemberType(newTypeName.trim(), newTypeColor);
      await loadMemberTypes();
      setNewTypeName('');
      setNewTypeColor(PRESET_COLORS[0]);
      toast.success(`'${newTypeName}' 분류가 추가되었습니다.`);
    } catch (e: any) {
      toast.error(e.message?.includes('unique') ? '이미 존재하는 분류명입니다.' : '분류 추가에 실패했습니다.');
    } finally {
      setIsAddingType(false);
    }
  };

  // 회원 분류 삭제
  const handleDeleteType = async (type: MemberType) => {
    if (!(await globalConfirm(`'${type.name}' 분류를 삭제하시겠습니까? 해당 분류로 지정된 회원은 분류가 초기화됩니다.`))) return;
    try {
      await adminService.deleteMemberType(type.id);
      await loadMemberTypes();
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(`'${type.name}' 분류가 삭제되었습니다.`);
    } catch {
      toast.error('분류 삭제에 실패했습니다.');
    }
  };

  // 회원 분류 변경 (인라인 드롭다운)
  const handleUpdateMemberType = async (member: Member, newType: string) => {
    setUpdatingMemberId(member.id);
    try {
      await adminService.updateUserMemberType(member.id, newType === '' ? null : newType);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('회원 분류가 변경되었습니다.');
    } catch {
      toast.error('분류 변경에 실패했습니다.');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const pendingMembers = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'active');

  const getFilteredMembers = (status?: 'pending' | 'active') => {
    return members.filter((member: any) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (member.name?.toLowerCase() || '').includes(searchLower) ||
        (member.email?.toLowerCase() || '').includes(searchLower) ||
        (member.hospitalName?.toLowerCase() || '').includes(searchLower);
      const matchesGrade = gradeFilter === 'all' || member.grade === gradeFilter;
      const matchesType = memberTypeFilter === 'all'
        ? true
        : memberTypeFilter === 'none'
        ? !member.memberType
        : member.memberType === memberTypeFilter;
      const matchesStatus = status ? member.status === status : true;
      return matchesSearch && matchesGrade && matchesType && matchesStatus;
    });
  };

  const getStatusBadge = (status: Member['status']) => {
    switch (status) {
      case 'active': return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          <UserCheck className="w-3 h-3 mr-1" />활성
        </Badge>
      );
      case 'pending': return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />승인대기
        </Badge>
      );
      case 'suspended': return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          <UserX className="w-3 h-3 mr-1" />정지
        </Badge>
      );
      default: return null;
    }
  };

  const getGradeBadge = (grade: Member['grade']) => {
    const colors = {
      VIP: 'bg-purple-100 text-purple-800 border-purple-200',
      Gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Silver: 'bg-gray-100 text-gray-800 border-gray-200',
      Bronze: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return <Badge variant="outline" className={colors[grade]}>{grade}</Badge>;
  };

  // 회원 분류 뱃지: color는 DB에서 가져옴
  const getMemberTypeBadge = (typeName: string | null | undefined) => {
    if (!typeName) return <span className="text-xs text-neutral-400">-</span>;
    const type = memberTypes.find(t => t.name === typeName);
    const color = type?.color || '#6B7280';
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
        style={{ backgroundColor: color }}
      >
        {typeName}
      </span>
    );
  };

  const handleProxyOrder = async (member: Member) => {
    if (member.status !== 'active') { await globalAlert('활성 상태의 회원만 대리주문이 가능합니다.'); return; }
    try {
      await proxyOrderService.startProxy(member.id, `${member.name} (${member.hospitalName})`);
      navigate('/products');
    } catch { await globalAlert('대리주문 시작에 실패했습니다.'); }
  };

  const handleApprove = async (memberId: string) => {
    try {
      if (await globalConfirm('회원을 승인하시겠습니까?')) {
        await updateStatusMutation.mutateAsync({ userId: memberId, status: 'APPROVED' });
        await globalAlert('회원 승인이 완료되었습니다.');
        setIsDetailModalOpen(false);
      }
    } catch { await globalAlert('회원 승인에 실패했습니다.'); }
  };

  const handleReject = async (memberId: string) => {
    try {
      if (await globalConfirm('회원 가입을 거절하시겠습니까?')) {
        await updateStatusMutation.mutateAsync({ userId: memberId, status: 'REJECTED' });
        await globalAlert('회원 가입이 거절되었습니다.');
        setIsDetailModalOpen(false);
      }
    } catch { await globalAlert('회원 거절에 실패했습니다.'); }
  };

  const updateGradeSetting = (id: string, field: 'minSales' | 'discountRate', value: string) => {
    setGradeSettings(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const handleSaveGradeSettings = async () => {
    await globalAlert('회원등급 설정이 저장되었습니다.');
    setIsGradeSettingsOpen(false);
  };

  const formatNumber = (num: number | string) => {
    const val = typeof num === 'number' ? num.toString() : num;
    return val.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const renderMemberTable = (filteredMembers: Member[], showApprovalActions: boolean = false) => {
    const totalCount = filteredMembers.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paged = filteredMembers.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

    // 페이지 버튼 범위 계산 (최대 5개)
    const pageBlock = 5;
    const blockStart = Math.floor((safeCurrentPage - 1) / pageBlock) * pageBlock + 1;
    const blockEnd = Math.min(blockStart + pageBlock - 1, totalPages);

    const colSpanCount = showApprovalActions ? 7 : 8;

    return (
      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-4 text-center text-xs font-medium text-neutral-700 uppercase tracking-wider w-12">No.</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider text-nowrap">회원정보</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider text-nowrap">병원정보</th>

                {gradesEnabled && <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider text-nowrap">등급</th>}
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider text-nowrap">
                  {showApprovalActions ? '신청일' : '가입일'}
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider text-nowrap">누적매출</th>
                {!showApprovalActions && (
                  <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider text-nowrap">상태</th>
                )}
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider text-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={colSpanCount} className="px-6 py-8 text-center text-neutral-500">
                    {showApprovalActions ? '승인 대기 중인 회원이 없습니다.' : '회원이 없습니다.'}
                  </td>
                </tr>
              ) : (
                paged.map((member: any, idx: number) => {
                  const rowNo = (safeCurrentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/members/${member.id}`)}
                    >
                      <td className="px-4 py-4 text-center text-sm text-neutral-400 font-mono">{rowNo}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-neutral-900">{member.name}</div>
                        <div className="text-xs text-neutral-500">{member.userId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-900">{member.hospitalName}</div>
                        <div className="text-xs text-neutral-500">사업자: {member.businessNumber}</div>
                      </td>

                      {gradesEnabled && <td className="px-6 py-4 whitespace-nowrap">{getGradeBadge(member.grade)}</td>}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{member.joinDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 text-right">
                        {formatNumber(member.totalSales || 0)}원
                      </td>
                      {!showApprovalActions && (
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(member.status)}</td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/members/${member.id}`)}>
                            <Eye className="w-4 h-4 mr-1" />상세보기
                          </Button>
                          {!showApprovalActions && member.status === 'active' && (
                            <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => handleProxyOrder(member)}>
                              <ShoppingCart className="w-4 h-4 mr-1" />대리주문
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 페이지네이션 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
          {/* 행 수 선택 */}
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <span>페이지당</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-neutral-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
            >
              {[10, 20, 50, 100].map(n => (
                <option key={n} value={n}>{n}개</option>
              ))}
            </select>
            <span>/ 전체 {totalCount}명</span>
          </div>

          {/* 페이지 버튼 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              이전
            </button>
            {Array.from({ length: blockEnd - blockStart + 1 }, (_, i) => blockStart + i).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-sm border ${
                  page === safeCurrentPage
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">회원관리</h2>
          <p className="text-sm text-neutral-600">회원 승인, 등급 및 정보를 관리합니다</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />새로고침
          </Button>

          {gradesEnabled && (
            <Button variant="outline" onClick={() => setIsGradeSettingsOpen(true)}>
              등급 기준 설정
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 회원</div>
          <div className="text-2xl font-medium text-neutral-900">{members.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4 cursor-pointer hover:bg-yellow-50 transition-colors" onClick={() => setActiveTab('pending')}>
          <div className="text-xs text-neutral-600 mb-1">승인대기</div>
          <div className="text-2xl font-medium text-yellow-600 flex items-center gap-2">
            {pendingMembers.length}
            {pendingMembers.length > 0 && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs text-nowrap">NEW</Badge>
            )}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">활성회원</div>
          <div className="text-2xl font-medium text-green-600">{activeMembers.length}</div>
        </div>
        {gradesEnabled && (
          <div className="bg-white border border-neutral-200 p-4">
            <div className="text-xs text-neutral-600 mb-1">VIP 회원</div>
            <div className="text-2xl font-medium text-purple-600">{members.filter((m: any) => m.grade === 'VIP').length}</div>
          </div>
        )}
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">정지회원</div>
          <div className="text-2xl font-medium text-red-600">{members.filter((m: any) => m.status === 'suspended').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-neutral-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="이름, 이메일, 병원명 검색"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          {gradesEnabled && (
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="all">전체 등급</option>
              <option value="VIP">VIP</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Bronze">Bronze</option>
            </select>
          )}
          {/* 회원 분류 필터 */}
          <select
            value={memberTypeFilter}
            onChange={(e) => { setMemberTypeFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <option value="all">전체 분류</option>
            <option value="none">미지정</option>
            {memberTypes.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>

        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-neutral-200">
          <TabsTrigger value="all" className="data-[state=active]:bg-neutral-900 data-[state=active]:text-white">전체 회원</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
            승인대기
            {pendingMembers.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200">{pendingMembers.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-neutral-900 data-[state=active]:text-white">활성 회원</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">{renderMemberTable(getFilteredMembers())}</TabsContent>
        <TabsContent value="pending" className="mt-0">{renderMemberTable(getFilteredMembers('pending'), true)}</TabsContent>
        <TabsContent value="active" className="mt-0">{renderMemberTable(getFilteredMembers('active'))}</TabsContent>
      </Tabs>



      {/* Grade Settings Modal */}
      {isGradeSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-medium text-neutral-900">회원등급 설정</h3>
              <button onClick={() => setIsGradeSettingsOpen(false)} className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                {gradeSettings.map((grade) => (
                  <div key={grade.id} className="bg-neutral-50 border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex px-4 py-2 text-sm font-medium ${grade.name === 'VIP' ? 'bg-purple-100 text-purple-800' : grade.name === 'Gold' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}`}>
                        {grade.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" value={formatNumber(grade.minSales)} onChange={(e) => updateGradeSetting(grade.id, 'minSales', e.target.value.replace(/,/g, ''))} className="px-4 py-3 border border-neutral-300" />
                      <input type="text" value={grade.discountRate} onChange={(e) => updateGradeSetting(grade.id, 'discountRate', e.target.value)} className="px-4 py-3 border border-neutral-300" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsGradeSettingsOpen(false)}>취소</Button>
                <Button onClick={handleSaveGradeSettings}>저장</Button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}