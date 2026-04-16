import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, User, Building2, Settings, Loader2,
  UserCheck, UserX, Clock, ShoppingCart, Tag, Check
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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

  const member = (members as any[]).find(m => m.id === id);

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

  const handleUpdateMemberType = async (typeName: string) => {
    if (!member) return;
    setUpdatingType(true);
    try {
      await adminService.updateUserMemberType(member.id, typeName === '' ? null : typeName);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('회원 분류가 변경되었습니다.');
    } catch {
      toast.error('분류 변경에 실패했습니다.');
    } finally {
      setUpdatingType(false);
    }
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

  const currentTypeDef = memberTypes.find(t => t.name === member.memberType);

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
              {member.memberType && (
                <span
                  className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                  style={{ backgroundColor: currentTypeDef?.color || '#6B7280' }}
                >
                  {member.memberType}
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 mt-1">{member.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            <p className="text-sm font-semibold text-neutral-900">{member.name}</p>
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">이메일</span>
            <p className="text-sm text-neutral-900">{member.email}</p>
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">연락처</span>
            <p className="text-sm text-neutral-900">{member.phone || member.mobile || '-'}</p>
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">가입일</span>
            <p className="text-sm text-neutral-900">{member.joinDate}</p>
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">누적주문</span>
            <p className="text-sm text-neutral-900">{member.totalOrders || 0}건</p>
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">누적매출</span>
            <p className="text-sm font-semibold text-neutral-900">
              {(member.totalSales || 0).toLocaleString()}원
            </p>
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
            <p className="text-sm font-semibold text-neutral-900">{member.hospitalName || '-'}</p>
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">사업자번호</span>
            <p className="text-sm text-neutral-900">{member.businessNumber || '-'}</p>
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">지역</span>
            <p className="text-sm text-neutral-900">{member.region || '-'}</p>
          </div>
          <div className="col-span-2 md:col-span-3">
            <span className="text-xs text-neutral-400 block mb-1">주소</span>
            <p className="text-sm text-neutral-900">
              {member.zipCode ? `[${member.zipCode}] ` : ''}{member.address || '-'} {member.addressDetail}
            </p>
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">병원 이메일</span>
            <p className="text-sm text-neutral-900">{member.hospitalEmail || '-'}</p>
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">세금계산서 이메일</span>
            <p className="text-sm text-neutral-900">{member.taxEmail || '-'}</p>
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
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
          <Tag className="w-4 h-4 text-neutral-500" />
          <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">회원 분류</h3>
        </div>
        <div className="p-6">
          <p className="text-xs text-neutral-500 mb-4">이 회원의 분류를 선택하세요. 분류는 회원목록에서 필터링에 사용됩니다.</p>
          <div className="flex flex-wrap gap-2">
            {/* 미지정 */}
            <button
              onClick={() => handleUpdateMemberType('')}
              disabled={updatingType}
              className={`px-4 py-2 rounded text-sm font-medium border-2 transition-all flex items-center gap-1.5 ${
                !member.memberType
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
              }`}
            >
              {!member.memberType && <Check className="w-3.5 h-3.5" />}
              미지정
            </button>
            {memberTypes.map(type => (
              <button
                key={type.id}
                onClick={() => handleUpdateMemberType(type.name)}
                disabled={updatingType}
                className={`px-4 py-2 rounded text-sm font-semibold border-2 transition-all flex items-center gap-1.5 text-white`}
                style={{
                  backgroundColor: member.memberType === type.name ? type.color : 'transparent',
                  borderColor: type.color,
                  color: member.memberType === type.name ? 'white' : type.color,
                }}
              >
                {member.memberType === type.name && <Check className="w-3.5 h-3.5" />}
                {type.name}
              </button>
            ))}
            {updatingType && <Loader2 className="w-5 h-5 animate-spin text-neutral-400 self-center" />}
          </div>
        </div>
      </section>
    </div>
  );
}
