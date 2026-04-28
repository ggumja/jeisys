import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, User, Building2, Settings, Loader2,
  UserCheck, UserX, Clock, ShoppingCart, Tag, Check, Edit2, Save
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { useAdminUsers, useUpdateUserStatus, useUserEquipments } from '../../hooks/useAdmin';
import { useModal } from '../../context/ModalContext';
import { adminService } from '../../services/adminService';
import { shopSettingsService } from '../../services/shopSettingsService';
import { proxyOrderService } from '../../services/cartService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface MemberType {
  id: string;
  name: string;
  color: string;
}

function EquipmentList({ userId }: { userId: string }) {
  const { data: equipments, isLoading } = useUserEquipments(userId);
  if (isLoading) return <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>;
  if (!equipments || equipments.length === 0)
    return <p className="text-sm text-neutral-500 py-6 px-4 border border-dashed text-center">보유 중인 장비가 없습니다.</p>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {equipments.map((eq: any) => (
        <div key={eq.id} className="flex items-center gap-4 p-4 border border-neutral-200 bg-white">
          {eq.imageUrl
            ? <img src={eq.imageUrl} alt={eq.name} className="w-16 h-16 object-cover rounded" />
            : <div className="w-16 h-16 bg-neutral-100 flex items-center justify-center rounded"><Building2 className="w-8 h-8 text-neutral-300" /></div>
          }
          <div>
            <div className="text-sm font-semibold text-neutral-900">{eq.name}</div>
            <div className="text-xs text-neutral-500 mt-0.5">S/N: {eq.serialNumber}</div>
            <div className="text-xs text-neutral-500">설치일: {eq.installDate || '-'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { alert: globalAlert, confirm: globalConfirm } = useModal();

  const { data: members = [], isLoading } = useAdminUsers();
  const updateStatusMutation = useUpdateUserStatus();

  const [memberTypes, setMemberTypes] = useState<MemberType[]>([]);
  const [updatingType, setUpdatingType] = useState(false);
  const [gradesEnabled, setGradesEnabled] = useState(true);
  
  const [localMemberType, setLocalMemberType] = useState<string | null>(null);
  
  // 수정 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  const member = (members as any[]).find(m => m.id === id);

  // 멤버 데이터 로드 시 로컬 상태 초기화
  useEffect(() => {
    if (member) {
      setLocalMemberType(member.memberType || member.member_type || null);
      setEditForm({ ...member });
    }
  }, [member]);

  useEffect(() => {
    adminService.getMemberTypes().then(setMemberTypes as any).catch(console.error);
    shopSettingsService.getAll().then((s) => {
      setGradesEnabled(s['grades_enabled'] !== 'false');
    }).catch(console.error);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200"><UserCheck className="w-3 h-3 mr-1" />활성</Badge>;
      case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />승인대기</Badge>;
      case 'suspended': return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200"><UserX className="w-3 h-3 mr-1" />정지</Badge>;
      default: return null;
    }
  };

  const getGradeBadge = (grade: string) => {
    const colors: Record<string, string> = {
      VIP: 'bg-purple-100 text-purple-800 border-purple-200',
      Gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Silver: 'bg-gray-100 text-gray-800 border-gray-200',
      Bronze: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return <Badge variant="outline" className={colors[grade] || ''}>{grade}</Badge>;
  };

  const handleUpdateMemberType = (typeName: string) => {
    if (!member) return;
    
    const currentTypes = localMemberType 
      ? localMemberType.split(',').map((t: string) => t.trim()).filter(Boolean) 
      : [];

    let newValue: string | null = null;
    if (typeName === '') {
      newValue = null;
    } else {
      if (currentTypes.includes(typeName)) {
        const filtered = currentTypes.filter((t: string) => t !== typeName);
        newValue = filtered.length > 0 ? filtered.join(',') : null;
      } else {
        newValue = [...currentTypes, typeName].join(',');
      }
    }

    // 로컬 상태만 업데이트 (저장 버튼 클릭 시 서버 반영)
    setLocalMemberType(newValue);
  };

  const handleSaveAll = async () => {
    if (!member || !editForm) return;
    setUpdatingType(true);
    try {
      // 폼 데이터와 현재 선택된 회원 분류를 합쳐서 전송
      const finalData = {
        ...editForm,
        memberType: localMemberType
      };
      
      await adminService.updateUser(member.id, finalData);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('회원 정보가 수정되었습니다.');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(`수정 실패: ${error.message || '네트워크 오류'}`);
    } finally {
      setUpdatingType(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({ ...member });
    setLocalMemberType(member.memberType || member.member_type || null);
    setIsEditing(false);
  };

  const handleApprove = async () => {
    if (!member) return;
    if (await globalConfirm('회원을 승인하시겠습니까?')) {
      try {
        await updateStatusMutation.mutateAsync({ userId: member.id, status: 'APPROVED' });
        await globalAlert('회원 승인이 완료되었습니다.');
        await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      } catch { await globalAlert('승인에 실패했습니다.'); }
    }
  };

  const handleReject = async () => {
    if (!member) return;
    if (await globalConfirm('회원 가입을 거절하시겠습니까?')) {
      try {
        await updateStatusMutation.mutateAsync({ userId: member.id, status: 'REJECTED' });
        await globalAlert('거절되었습니다.');
        navigate('/admin/members');
      } catch { await globalAlert('거절에 실패했습니다.'); }
    }
  };

  const handleProxyOrder = async () => {
    if (!member) return;
    try {
      await proxyOrderService.startProxy(member.id, `${member.name} (${member.hospitalName})`);
      navigate('/products');
    } catch { await globalAlert('대리주문 시작에 실패했습니다.'); }
  };

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neutral-400" /></div>;
  }

  if (!member) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-neutral-500">회원 정보를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => navigate('/admin/members')}>
          <ArrowLeft className="w-4 h-4 mr-2" />목록으로
        </Button>
      </div>
    );
  }

  const selectedTypes = (localMemberType || '')
    .toString()
    .split(',')
    .map((t: string) => t.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/members')}
            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl tracking-tight text-neutral-900">{member.name}</h2>
              {getStatusBadge(member.status)}
              {gradesEnabled && getGradeBadge(member.grade)}
              <div className="flex flex-wrap gap-1.5">
                {selectedTypes.map(typeName => {
                  const typeDef = memberTypes.find(t => t.name === typeName);
                  return (
                    <span
                      key={typeName}
                      className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                      style={{ backgroundColor: typeDef?.color || '#6B7280' }}
                    >
                      {typeName}
                    </span>
                  );
                })}
              </div>
            </div>
            <p className="text-sm text-neutral-500 mt-1">{member.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>취소</Button>
              <Button size="sm" className="bg-neutral-900 text-white" onClick={handleSaveAll} disabled={updatingType}>
                {updatingType ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                저장하기
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />정보 수정
              </Button>
              {member.status === 'pending' && (
                <>
                  <Button variant="outline" className="text-red-600 border-red-200" onClick={handleReject}>거절</Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove}>승인</Button>
                </>
              )}
              {member.status === 'active' && (
                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={handleProxyOrder}>
                  <ShoppingCart className="w-4 h-4 mr-2" />대리주문
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 승인 대기 알림 */}
      {member.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 px-5 py-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800 font-medium">승인 대기 중인 회원입니다. 위의 버튼으로 승인 또는 거절하세요.</p>
        </div>
      )}

      {/* ── 기본 정보 */}
      <section className="bg-white border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
          <User className="w-4 h-4 text-neutral-500" />
          <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">기본 정보</h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
          <div>
            <span className="text-xs text-neutral-400 block mb-1">이름</span>
            {isEditing ? (
              <Input 
                value={editForm?.name || ''} 
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="h-8 text-sm"
              />
            ) : (
              <p className="text-sm font-semibold text-neutral-900">{member.name}</p>
            )}
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">이메일</span>
            <p className="text-sm text-neutral-900">{member.email}</p>
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">연락처 (일반)</span>
            {isEditing ? (
              <Input 
                value={editForm?.phone || ''} 
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                className="h-8 text-sm"
              />
            ) : (
              <p className="text-sm text-neutral-900">{member.phone || '-'}</p>
            )}
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">휴대폰</span>
            {isEditing ? (
              <Input 
                value={editForm?.mobile || ''} 
                onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                className="h-8 text-sm"
              />
            ) : (
              <p className="text-sm text-neutral-900">{member.mobile || '-'}</p>
            )}
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">가입일</span>
            <p className="text-sm text-neutral-900">{member.joinDate}</p>
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">누적주문</span>
            <p className="text-sm text-neutral-900">{member.totalOrders || 0}건</p>
          </div>
        </div>
      </section>

      {/* ── 사업자 정보 */}
      <section className="bg-white border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-neutral-500" />
          <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">사업자 및 병원 정보</h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
          <div>
            <span className="text-xs text-neutral-400 block mb-1">병원/대리점명</span>
            {isEditing ? (
              <Input 
                value={editForm?.hospitalName || ''} 
                onChange={e => setEditForm({ ...editForm, hospitalName: e.target.value })}
                className="h-8 text-sm"
              />
            ) : (
              <p className="text-sm font-semibold text-neutral-900">{member.hospitalName || '-'}</p>
            )}
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">사업자번호</span>
            {isEditing ? (
              <Input 
                value={editForm?.businessNumber || ''} 
                onChange={e => setEditForm({ ...editForm, businessNumber: e.target.value })}
                className="h-8 text-sm"
              />
            ) : (
              <p className="text-sm text-neutral-900">{member.businessNumber || '-'}</p>
            )}
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">지역</span>
            {isEditing ? (
              <Input 
                value={editForm?.region || ''} 
                onChange={e => setEditForm({ ...editForm, region: e.target.value })}
                className="h-8 text-sm"
              />
            ) : (
              <p className="text-sm text-neutral-900">{member.region || '-'}</p>
            )}
          </div>
          <div className="col-span-2 md:col-span-3">
            <span className="text-xs text-neutral-400 block mb-1">주소</span>
            {isEditing ? (
              <div className="flex gap-2">
                <Input 
                  value={editForm?.zipCode || ''} 
                  onChange={e => setEditForm({ ...editForm, zipCode: e.target.value })}
                  placeholder="우편번호"
                  className="h-8 text-sm w-24"
                />
                <Input 
                  value={editForm?.address || ''} 
                  onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="기본 주소"
                  className="h-8 text-sm flex-1"
                />
                <Input 
                  value={editForm?.addressDetail || ''} 
                  onChange={e => setEditForm({ ...editForm, addressDetail: e.target.value })}
                  placeholder="상세 주소"
                  className="h-8 text-sm flex-1"
                />
              </div>
            ) : (
              <p className="text-sm text-neutral-900">
                {member.zipCode ? `[${member.zipCode}] ` : ''}{member.address || '-'} {member.addressDetail}
              </p>
            )}
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">병원 이메일</span>
            {isEditing ? (
              <Input 
                value={editForm?.hospitalEmail || ''} 
                onChange={e => setEditForm({ ...editForm, hospitalEmail: e.target.value })}
                className="h-8 text-sm"
              />
            ) : (
              <p className="text-sm text-neutral-900">{member.hospitalEmail || '-'}</p>
            )}
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">세금계산서 이메일</span>
            {isEditing ? (
              <Input 
                value={editForm?.taxEmail || ''} 
                onChange={e => setEditForm({ ...editForm, taxEmail: e.target.value })}
                className="h-8 text-sm"
              />
            ) : (
              <p className="text-sm text-neutral-900">{member.taxEmail || '-'}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── 보유 장비 */}
      <section className="bg-white border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-neutral-500" />
          <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">보유 장비</h3>
        </div>
        <div className="p-6">
          <EquipmentList userId={member.id} />
        </div>
      </section>

      {/* ── 회원 분류 설정 (페이지 하단) */}
      <section className="bg-white border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-neutral-500" />
            <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">회원 분류</h3>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 font-medium bg-neutral-100 px-2 py-1 rounded">수정 모드 활성</span>
            </div>
          ) : (
            localMemberType !== (member.memberType || member.member_type || null) && (
              <Button 
                size="sm" 
                className="bg-neutral-900 text-white"
                onClick={handleSaveAll}
                disabled={updatingType}
              >
                {updatingType ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                변경사항 저장
              </Button>
            )
          )}
        </div>
        <div className="p-6">
          <p className="text-xs text-neutral-500 mb-4">이 회원의 분류를 선택하세요(중복 선택 가능). 분류는 회원목록에서 필터링에 사용됩니다.</p>
          <div className="flex flex-wrap gap-2">
            {/* 미지정 */}
            <button
              onClick={() => handleUpdateMemberType('')}
              disabled={updatingType}
              className={`px-4 py-2 rounded text-sm font-medium border-2 transition-all flex items-center gap-1.5 ${
                selectedTypes.length === 0
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
              }`}
            >
              {selectedTypes.length === 0 && <Check className="w-3.5 h-3.5" />}
              미지정
            </button>
            {memberTypes.map(type => {
              const isSelected = selectedTypes.includes(type.name);
              return (
                <button
                  key={type.id}
                  onClick={() => handleUpdateMemberType(type.name)}
                  disabled={updatingType}
                  className={`px-4 py-2 rounded text-sm font-semibold border-2 transition-all flex items-center gap-1.5 ${
                    isSelected ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: isSelected ? type.color : 'transparent',
                    borderColor: type.color,
                    color: isSelected ? 'white' : type.color,
                  }}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5" />}
                  {type.name}
                </button>
              );
            })}
            {updatingType && <Loader2 className="w-5 h-5 animate-spin text-neutral-400 self-center" />}
          </div>
        </div>
      </section>
    </div>
  );
}
