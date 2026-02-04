import { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Edit, Plus, Settings, X, Trash2, Clock, CheckCircle2, Eye, FileText, Building2, Mail, Phone, Download, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { adminService } from '../../services/adminService';

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
  phone?: string;
  mobile?: string;
  address?: string;
  zipCode?: string;
  addressDetail?: string;
  region?: string;
  hospitalEmail?: string;
  taxEmail?: string;
  businessCertificate?: string;
  holidayWeek?: string;
  holidayDay?: string;
  isPublicHoliday?: boolean;
  equipments?: Array<{ name: string; serialNumber: string }>;
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

export function MemberManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [isGradeSettingsOpen, setIsGradeSettingsOpen] = useState(false);
  const [gradeSettings, setGradeSettings] = useState<GradeSettings[]>(initialGradeSettings);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      // map adminService user to Member interface if slightly different types or enums
      const mappedMembers: Member[] = data.map((u: any) => ({
        ...u,
        status: u.status as Member['status']
      }));
      setMembers(mappedMembers);
    } catch (error) {
      console.error('Failed to load members', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingMembers = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'active');

  const getFilteredMembers = (status?: 'pending' | 'active') => {
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.hospitalName.toLowerCase().includes(searchTerm.toLowerCase());
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
        await adminService.updateUserStatus(memberId, 'APPROVED');
        alert('회원 승인이 완료되었습니다.');
        loadMembers();
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
        await adminService.updateUserStatus(memberId, 'REJECTED');
        alert('회원 가입이 거절되었습니다.');
        loadMembers();
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
    console.log('Save grade settings:', gradeSettings);
    alert('회원등급 설정이 저장되었습니다.');
    setIsGradeSettingsOpen(false);
  };

  const formatNumber = (num: string) => {
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const renderMemberTable = (members: Member[], showApprovalActions: boolean = false) => (
    <div className="bg-white border border-neutral-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                회원정보
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                병원정보
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                등급
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                {showApprovalActions ? '신청일' : '가입일'}
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                주문수
              </th>
              {!showApprovalActions && (
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  상태
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {members.length === 0 ? (
              <tr>
                <td colSpan={showApprovalActions ? 6 : 7} className="px-6 py-8 text-center text-neutral-500">
                  {showApprovalActions ? '승인 대기 중인 회원이 없습니다.' : '회원이 없습니다.'}
                </td>
              </tr>
            ) : (
              members.map((member) => (
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                    {member.totalOrders}건
                  </td>
                  {!showApprovalActions && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.status)}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {showApprovalActions ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedMember(member); setIsDetailModalOpen(true); }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          상세보기
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => { setSelectedMember(member); setIsDetailModalOpen(true); }}>
                          <Edit className="w-4 h-4 mr-1" />
                          수정
                        </Button>
                      )}
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

  if (loading) {
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
          <Button variant="outline" onClick={() => setIsGradeSettingsOpen(true)}>
            <Settings className="w-5 h-5 mr-2" />
            회원등급 설정
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
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
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

      {/* Grade Settings Modal */}
      {isGradeSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-medium text-neutral-900">회원등급 설정</h3>
              <button
                onClick={() => setIsGradeSettingsOpen(false)}
                className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <p className="text-sm text-neutral-600">
                회원 등급은 매출액 조건과 할인률을 설정합니다. 회원의 누적 매출액에 따라 자동으로 등급이 부여됩니다.
              </p>

              <div className="space-y-4">
                {gradeSettings.map((grade, index) => (
                  <div
                    key={grade.id}
                    className="bg-neutral-50 border border-neutral-200 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex px-4 py-2 text-sm font-medium ${grade.name === 'VIP'
                              ? 'bg-purple-100 text-purple-800'
                              : grade.name === 'Gold'
                                ? 'bg-yellow-100 text-yellow-800'
                                : grade.name === 'Silver'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-orange-100 text-orange-800'
                            }`}
                        >
                          {grade.name}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {index === 0 ? '최상위 등급' : index === gradeSettings.length - 1 ? '기본 등급' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          등급별 매출액 조건
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={formatNumber(grade.minSales)}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (/^\d*$/.test(value)) {
                                updateGradeSetting(grade.id, 'minSales', value);
                              }
                            }}
                            placeholder="0"
                            className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                          <span className="text-neutral-600 whitespace-nowrap">원 이상</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          누적 매출액이 이 금액 이상인 회원에게 부여됩니다
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          할인률
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={grade.discountRate}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*$/.test(value) && Number(value) <= 100) {
                                updateGradeSetting(grade.id, 'discountRate', value);
                              }
                            }}
                            placeholder="0"
                            className="w-32 px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                          <span className="text-neutral-600">%</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          이 등급 회원에게 적용되는 기본 할인률
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-800">
                  <strong>안내:</strong> 등급은 높은 매출액 조건부터 자동으로 적용됩니다. Bronze 등급은 기본 등급으로, 모든 신규 회원에게 부여됩니다.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <Button
                  variant="outline"
                  onClick={() => setIsGradeSettingsOpen(false)}
                >
                  취소
                </Button>
                <Button onClick={handleSaveGradeSettings}>
                  저장
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {isDetailModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-medium text-neutral-900">
                  {selectedMember.status === 'pending' ? '회원 가입 승인' : '회원 정보 수정'}
                </h3>
                {selectedMember.status === 'pending' && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Clock className="w-3 h-3 mr-1" />
                    승인 대기
                  </Badge>
                )}
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {selectedMember.status === 'pending' && (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-sm text-yellow-800 mb-1">
                        <strong>승인 대기 중인 회원입니다.</strong> 회원 정보를 확인 후 승인 또는 거절해 주세요.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Clock className="w-4 h-4" />
                        <span>신청일시: <strong className="text-neutral-900">{selectedMember.joinDate}</strong></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleReject(selectedMember.id)}>거절</Button>
                      <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(selectedMember.id)}>승인</Button>
                    </div>
                  </div>
                </>
              )}

              {/* 사업자 정보 섹션 */}
              <div className="border-t border-neutral-200 pt-4">
                <h4 className="text-lg font-medium text-neutral-900 mb-4">사업자 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      아이디
                    </label>
                    <input
                      type="text"
                      value={selectedMember.userId}
                      className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 bg-neutral-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      병원/대리점명
                    </label>
                    <input
                      type="text"
                      value={selectedMember.hospitalName}
                      className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 bg-neutral-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      구매지
                    </label>
                    <input
                      type="text"
                      value={selectedMember.region || ''}
                      className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 bg-neutral-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      사업자등록번호
                    </label>
                    <input
                      type="text"
                      value={selectedMember.businessNumber}
                      className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 bg-neutral-50"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* 연락처 정보 섹션 */}
              <div className="border-t border-neutral-200 pt-4">
                <h4 className="text-lg font-medium text-neutral-900 mb-4">연락처 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      병원 담당자 이메일
                    </label>
                    <input
                      type="email"
                      value={selectedMember.hospitalEmail || ''}
                      className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 bg-neutral-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      세금계산서 발행 이메일
                    </label>
                    <input
                      type="email"
                      value={selectedMember.taxEmail || ''}
                      className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 bg-neutral-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      전화번호
                    </label>
                    <input
                      type="text"
                      value={selectedMember.phone || ''}
                      className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 bg-neutral-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      휴대폰번호
                    </label>
                    <input
                      type="text"
                      value={selectedMember.mobile || ''}
                      className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 bg-neutral-50"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* 주소 정보 섹션 */}
              <div className="border-t border-neutral-200 pt-4">
                <h4 className="text-lg font-medium text-neutral-900 mb-4">주소</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      우편번호
                    </label>
                    <input
                      type="text"
                      value={selectedMember.zipCode || ''}
                      className="w-32 px-4 py-3 border border-neutral-300 text-neutral-900 bg-neutral-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      주소
                    </label>
                    <input
                      type="text"
                      value={selectedMember.address || ''}
                      className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 bg-neutral-50 mb-2"
                      disabled
                    />
                    <input
                      type="text"
                      value={selectedMember.addressDetail || ''}
                      className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 bg-neutral-50"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex items-center justify-end z-10">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>닫기</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}