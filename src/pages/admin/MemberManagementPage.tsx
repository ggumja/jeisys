import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Search, UserCheck, UserX, Settings, X, Clock, Eye, Building2, Loader2, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAdminUsers, useUpdateUserStatus, useUserEquipments } from '../../hooks/useAdmin';

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

  const { data: members = [], isLoading, refetch } = useAdminUsers();
  const updateStatusMutation = useUpdateUserStatus();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    await refetch();
    setIsRefreshing(false);
  };

  const setGradeFilter = (grade: string) => {
    if (grade === 'all') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('grade');
      setSearchParams(newParams);
    } else {
      setSearchParams({ grade });
    }
  };

  const pendingMembers = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'active');

  const getFilteredMembers = (status?: 'pending' | 'active') => {
    return members.filter((member) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (member.name?.toLowerCase() || '').includes(searchLower) ||
        (member.email?.toLowerCase() || '').includes(searchLower) ||
        (member.hospitalName?.toLowerCase() || '').includes(searchLower);
      const matchesGrade = gradeFilter === 'all' || member.grade === gradeFilter;
      const matchesStatus = status ? member.status === status : true;
      return matchesSearch && matchesGrade && matchesStatus;
    });
  };

  const getStatusBadge = (status: Member['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <UserCheck className="w-3 h-3 mr-1" />
            활성
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            승인대기
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <UserX className="w-3 h-3 mr-1" />
            정지
          </Badge>
        );
      default:
        return null;
    }
  };

  const getGradeBadge = (grade: Member['grade']) => {
    const colors = {
      VIP: 'bg-purple-100 text-purple-800 border-purple-200',
      Gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Silver: 'bg-gray-100 text-gray-800 border-gray-200',
      Bronze: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return (
      <Badge variant="outline" className={colors[grade]}>
        {grade}
      </Badge>
    );
  };

  const handleApprove = async (memberId: string) => {
    try {
      if (confirm('회원을 승인하시겠습니까?')) {
        await updateStatusMutation.mutateAsync({ userId: memberId, status: 'APPROVED' });
        alert('회원 승인이 완료되었습니다.');
        setIsDetailModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to approve member', error);
      alert('회원 승인에 실패했습니다.');
    }
  };

  const handleReject = async (memberId: string) => {
    try {
      if (confirm('회원 가입을 거절하시겠습니까?')) {
        await updateStatusMutation.mutateAsync({ userId: memberId, status: 'REJECTED' });
        alert('회원 가입이 거절되었습니다.');
        setIsDetailModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to reject member', error);
      alert('회원 거절에 실패했습니다.');
    }
  };

  const updateGradeSetting = (id: string, field: 'minSales' | 'discountRate', value: string) => {
    setGradeSettings((prev) =>
      prev.map((grade) => (grade.id === id ? { ...grade, [field]: value } : grade))
    );
  };

  const handleSaveGradeSettings = () => {
    alert('회원등급 설정이 저장되었습니다.');
    setIsGradeSettingsOpen(false);
  };

  const formatNumber = (num: number | string) => {
    const val = typeof num === 'number' ? num.toString() : num;
    return val.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const renderMemberTable = (filteredMembers: Member[], showApprovalActions: boolean = false) => (
    <div className="bg-white border border-neutral-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider text-nowrap">
                회원정보
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider text-nowrap">
                병원정보
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider text-nowrap">
                등급
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider text-nowrap">
                {showApprovalActions ? '신청일' : '가입일'}
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider text-nowrap text-right">
                누적매출
              </th>
              {!showApprovalActions && (
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider text-nowrap">
                  상태
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider text-nowrap">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={showApprovalActions ? 6 : 7} className="px-6 py-8 text-center text-neutral-500">
                  {showApprovalActions ? '승인 대기 중인 회원이 없습니다.' : '회원이 없습니다.'}
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900">
                      {member.name}
                    </div>
                    <div className="text-xs text-neutral-500">{member.userId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-900">{member.hospitalName}</div>
                    <div className="text-xs text-neutral-500">
                      사업자: {member.businessNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getGradeBadge(member.grade)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {member.joinDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 text-right">
                    {formatNumber(member.totalSales || 0)}원
                  </td>
                  {!showApprovalActions && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.status)}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedMember(member); setIsDetailModalOpen(true); }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        상세보기
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
            회원관리
          </h2>
          <p className="text-sm text-neutral-600">
            회원 승인, 등급 및 정보를 관리합니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button variant="outline" onClick={() => setIsGradeSettingsOpen(true)}>
            등급 기준 설정
          </Button>
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
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs text-nowrap">
                NEW
              </Badge>
            )}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">활성회원</div>
          <div className="text-2xl font-medium text-green-600">
            {activeMembers.length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">VIP 회원</div>
          <div className="text-2xl font-medium text-purple-600">
            {members.filter((m) => m.grade === 'VIP').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">정지회원</div>
          <div className="text-2xl font-medium text-red-600">
            {members.filter((m) => m.status === 'suspended').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-neutral-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="이름, 이메일, 병원명 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
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
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-neutral-200">
          <TabsTrigger value="all" className="data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
            전체 회원
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
            승인대기
            {pendingMembers.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                {pendingMembers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
            활성 회원
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {renderMemberTable(getFilteredMembers())}
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          {renderMemberTable(getFilteredMembers('pending'), true)}
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          {renderMemberTable(getFilteredMembers('active'))}
        </TabsContent>
      </Tabs>

      {/* Grade Settings Modal omitted for brevity, logic remains same */}
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
                      <span className={`inline-flex px-4 py-2 text-sm font-medium ${grade.name === 'VIP' ? 'bg-purple-100 text-purple-800' : grade.name === 'Gold' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}`}>{grade.name}</span>
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

      {/* Member Detail Modal */}
      {isDetailModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-medium text-neutral-900">{selectedMember.name} 회원 상세 정보</h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-2 text-neutral-500 hover:text-neutral-900"><X /></button>
            </div>

            <div className="p-6 space-y-8">
              {selectedMember.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 flex justify-between items-center">
                  <p className="text-sm text-yellow-800 font-medium">승인 대기 중인 회원입니다.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="text-red-600 border-red-200" onClick={() => handleReject(selectedMember.id)}>거절</Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(selectedMember.id)}>승인</Button>
                  </div>
                </div>
              )}

              <section>
                <h4 className="text-lg font-medium mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" /> 사업자 및 연락처 정보</h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-neutral-50 p-6">
                  <div><span className="text-xs text-neutral-500 block mb-1">병원/대리점명</span><p className="font-medium">{selectedMember.hospitalName}</p></div>
                  <div><span className="text-xs text-neutral-500 block mb-1">사업자번호</span><p className="font-medium">{selectedMember.businessNumber}</p></div>
                  <div><span className="text-xs text-neutral-500 block mb-1">이메일</span><p className="font-medium">{selectedMember.email}</p></div>
                  <div><span className="text-xs text-neutral-500 block mb-1">연락처</span><p className="font-medium">{selectedMember.phone || selectedMember.mobile || '-'}</p></div>
                  <div className="col-span-2"><span className="text-xs text-neutral-500 block mb-1">주소</span><p className="font-medium">[{selectedMember.zipCode}] {selectedMember.address} {selectedMember.addressDetail}</p></div>
                </div>
              </section>

              <section>
                <h4 className="text-lg font-medium mb-4 flex items-center gap-2"><Settings className="w-5 h-5" /> 보유 장비 정보</h4>
                <UserEquipmentsList userId={selectedMember.id} />
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}