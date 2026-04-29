import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, User, Building2, Settings, Loader2,
  UserCheck, UserX, Clock, ShoppingCart, Tag, Check, Edit2, Save,
  MapPin, History, Monitor, CreditCard, Package, ChevronLeft, ChevronRight,
  PlusCircle, ChevronDown, X, Coins
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { useAdminUsers, useUpdateUserStatus, useUserEquipments } from '../../hooks/useAdmin';
import { useModal } from '../../context/ModalContext';
import { adminService } from '../../services/adminService';
import { shopSettingsService } from '../../services/shopSettingsService';
import { proxyOrderService } from '../../services/cartService';
import { creditService, UserCredit, CreditSummary, CreditTransaction } from '../../services/creditService';
import { equipmentService, EquipmentModel } from '../../services/equipmentService';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  // 추가 데이터
  const [memberStats, setMemberStats] = useState({ totalAmount: 0, totalOrders: 0, points: 0 });
  const [defaultAddress, setDefaultAddress] = useState<any>(null);
  const [demoRequests, setDemoRequests] = useState<any[]>([]);
  const [registeredCards, setRegisteredCards] = useState<any[]>([]);
  const [adminHistory, setAdminHistory] = useState<any>(null);
  const [memberOrders, setMemberOrders] = useState<any[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const ORDER_PAGE_SIZE = 10;
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'equipment' | 'orders' | 'credit' | 'points'>('info');

  // 크레딧
  const [credits, setCredits] = useState<UserCredit[]>([]);
  const [creditSummary, setCreditSummary] = useState<CreditSummary[]>([]);
  const [creditLoading, setCreditLoading] = useState(false);
  const [expandedCreditId, setExpandedCreditId] = useState<string | null>(null);
  const [creditTransactions, setCreditTransactions] = useState<Record<string, CreditTransaction[]>>({});
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({
    equipmentType: '',
    amount: '',
    expiryDate: '',
    memo: '',
  });
  const [issuing, setIssuing] = useState(false);
  const [equipmentModels, setEquipmentModels] = useState<EquipmentModel[]>([]);

  // 크레딧 회수
  const [revokeModal, setRevokeModal] = useState<{ credit: UserCredit } | null>(null);
  const [revokeForm, setRevokeForm] = useState({ amount: '', reason: '' });
  const [revoking, setRevoking] = useState(false);

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

  useEffect(() => {
    if (!member?.id) return;
    const uid = member.id;

    // 주문 통계
    supabase.from('orders').select('total_amount, status').eq('user_id', uid)
      .then(({ data }) => {
        if (!data) return;
        const total = data.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
        setMemberStats(prev => ({ ...prev, totalOrders: data.length, totalAmount: total }));
      });

    // 기본 배송지
    supabase.from('shipping_addresses').select('*').eq('user_id', uid).eq('is_default', true).limit(1)
      .then(({ data }) => setDefaultAddress(data?.[0] || null));

    // 장비 데모 신청
    supabase.from('demo_requests').select('*').eq('user_id', uid).order('created_at', { ascending: false })
      .then(({ data }) => setDemoRequests(data || []));

    // 주문 내역 (페이징)
    const fetchOrders = (page: number) => {
      const from = (page - 1) * ORDER_PAGE_SIZE;
      const to = from + ORDER_PAGE_SIZE - 1;
      supabase.from('orders')
        .select(`
          id, order_number, ordered_at, status, total_amount,
          order_items(id, product:products(name))
        `, { count: 'exact' })
        .eq('user_id', uid)
        .order('ordered_at', { ascending: false })
        .range(from, to)
        .then(({ data, count }) => {
          setMemberOrders(data || []);
          setOrderTotal(count || 0);
        });
    };
    fetchOrders(1);
    setOrderPage(1);

    // 1:1 문의 내역
    supabase.from('inquiries')
      .select('id, title, content, status, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .then(({ data }) => setInquiries(data || []));
  }, [member?.id]);

  // 크레딧 탭 진입 시 로딩
  useEffect(() => {
    if (activeTab !== 'credit' || !member?.id) return;
    setCreditLoading(true);
    Promise.all([
      creditService.getCreditsByUser(member.id),
      creditService.getCreditSummary(member.id),
      equipmentService.getEquipmentModels(),
    ]).then(([list, summary, models]) => {
      setCredits(list);
      setCreditSummary(summary);
      setEquipmentModels(models);
      if (models.length > 0) {
        setIssueForm(f => ({ ...f, equipmentType: f.equipmentType || models[0].model_name }));
      }
    }).catch(console.error)
      .finally(() => setCreditLoading(false));
  }, [activeTab, member?.id]);

  const handleToggleCreditHistory = async (creditId: string) => {
    if (expandedCreditId === creditId) {
      setExpandedCreditId(null);
      return;
    }
    setExpandedCreditId(creditId);
    if (!creditTransactions[creditId]) {
      const txs = await creditService.getCreditTransactions(creditId).catch(() => []);
      setCreditTransactions(prev => ({ ...prev, [creditId]: txs }));
    }
  };

  const handleIssueCredit = async () => {
    if (!member?.id || !issueForm.amount || !issueForm.expiryDate) {
      toast.error('장비, 금액, 유효기간은 필수입니다.');
      return;
    }
    setIssuing(true);
    try {
      await creditService.issueCredit({
        userId: member.id,
        equipmentType: issueForm.equipmentType,
        amount: Number(issueForm.amount),
        expiryDate: issueForm.expiryDate,
        memo: issueForm.memo || undefined,
      });
      toast.success('크레딧이 발급되었습니다.');
      setShowIssueModal(false);
      setIssueForm({ equipmentType: 'Density', amount: '', expiryDate: '', memo: '' });
      // 목록 새로고침
      const [list, summary] = await Promise.all([
        creditService.getCreditsByUser(member.id),
        creditService.getCreditSummary(member.id),
      ]);
      setCredits(list);
      setCreditSummary(summary);
    } catch (e: any) {
      toast.error(e.message || '발급에 실패했습니다.');
    } finally {
      setIssuing(false);
    }
  };

  const totalRemaining = creditSummary.reduce((s, c) => s + c.remaining, 0);

  const handleRevokeCredit = async () => {
    if (!revokeModal?.credit || !revokeForm.amount || !revokeForm.reason.trim()) {
      toast.error('회수 금액과 사유를 모두 입력해주세요.');
      return;
    }
    const amount = Number(revokeForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('올바른 금액을 입력해주세요.');
      return;
    }
    if (amount > revokeModal.credit.remaining) {
      toast.error(`잔액(${revokeModal.credit.remaining.toLocaleString()}원)을 초과할 수 없습니다.`);
      return;
    }
    setRevoking(true);
    try {
      await creditService.revokeCredit({
        creditId: revokeModal.credit.id,
        amount,
        reason: revokeForm.reason,
      });
      toast.success(`${amount.toLocaleString()}원이 회수되었습니다.`);
      setRevokeModal(null);
      setRevokeForm({ amount: '', reason: '' });
      // 목록 새로고침
      const [list, summary] = await Promise.all([
        creditService.getCreditsByUser(member.id),
        creditService.getCreditSummary(member.id),
      ]);
      setCredits(list);
      setCreditSummary(summary);
      // 펼쳐진 이력도 새로고침
      if (expandedCreditId === revokeModal.credit.id) {
        const txs = await creditService.getCreditTransactions(revokeModal.credit.id).catch(() => []);
        setCreditTransactions(prev => ({ ...prev, [revokeModal.credit.id]: txs }));
      }
    } catch (e: any) {
      toast.error(e.message || '회수에 실패했습니다.');
    } finally {
      setRevoking(false);
    }
  };


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

  const fmt = (n: number) => n.toLocaleString('ko-KR') + '원';

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

      {/* ── 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 px-5 py-4">
          <p className="text-xs text-neutral-400 mb-1">누적 구매금액</p>
          <p className="text-xl font-bold text-neutral-900">{fmt(memberStats.totalAmount)}</p>
        </div>
        <div className="bg-white border border-neutral-200 px-5 py-4">
          <p className="text-xs text-neutral-400 mb-1">주문수</p>
          <p className="text-xl font-bold text-neutral-900">{memberStats.totalOrders}건</p>
        </div>
        <div className="bg-white border border-neutral-200 px-5 py-4">
          <p className="text-xs text-neutral-400 mb-1">포인트 잔액</p>
          <p className="text-xl font-bold text-neutral-900">{fmt(memberStats.points)}</p>
        </div>
      </div>

      {/* ── 탭 네비게이션 */}
      <div className="flex border-b border-neutral-200">
        {(['info', 'orders', 'credit', 'points', 'equipment'] as const).map((tab) => {
          const labels = { info: '회원정보', equipment: '커뮤니케이션', orders: '주문/결제', credit: '크레딧', points: '포인트' };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ── 탭: 회원정보 */}
      {activeTab === 'info' && <>

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
            <span className="text-xs text-neutral-400 block mb-1">승인일</span>
            <p className="text-sm text-neutral-900">{member.approvedAt ? new Date(member.approvedAt).toLocaleDateString('ko-KR') : '-'}</p>
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">회원유형</span>
            <p className="text-sm text-neutral-900">
              {selectedTypes.length > 0 ? selectedTypes.join(', ') : '-'}
            </p>
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

      {/* ── 기본 배송지 + 관리 이력 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-white border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-neutral-500" />
            <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">기본 배송지</h3>
          </div>
          <div className="p-6 space-y-2">
            {defaultAddress ? (
              <>
                <div><span className="text-xs text-neutral-400">수령인</span><p className="text-sm text-neutral-900 mt-0.5">{defaultAddress.recipient_name || '-'}</p></div>
                <div><span className="text-xs text-neutral-400">연락처</span><p className="text-sm text-neutral-900 mt-0.5">{defaultAddress.phone || '-'}</p></div>
                <div><span className="text-xs text-neutral-400">주소</span><p className="text-sm text-neutral-900 mt-0.5">{defaultAddress.zip_code ? `(${defaultAddress.zip_code}) ` : ''}{defaultAddress.address} {defaultAddress.address_detail}</p></div>
              </>
            ) : (
              <p className="text-sm text-neutral-400 text-center py-4">등록된 배송지가 없습니다.</p>
            )}
          </div>
        </section>

        <section className="bg-white border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-500" />
            <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">관리 이력</h3>
          </div>
          <div className="p-6 space-y-3">
            <div>
              <span className="text-xs text-neutral-400">가입일</span>
              <p className="text-sm text-neutral-900 mt-0.5">{member.joinDate || '-'}</p>
            </div>
            {adminHistory?.approved_by && (
              <div>
                <span className="text-xs text-neutral-400">승인 처리자</span>
                <p className="text-sm text-neutral-900 mt-0.5">{adminHistory.approved_by}</p>
              </div>
            )}
            {adminHistory?.approved_at && (
              <div>
                <span className="text-xs text-neutral-400">승인일</span>
                <p className="text-sm text-neutral-900 mt-0.5">{new Date(adminHistory.approved_at).toLocaleDateString('ko-KR')}</p>
              </div>
            )}
            {!adminHistory?.approved_by && (
              <p className="text-sm text-neutral-400 text-center py-2">관리 이력이 없습니다.</p>
            )}
          </div>
        </section>
      </div>

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

      </> /* end tab: 회원정보 */}

      {/* ── 탭: 장비 */}
      {activeTab === 'equipment' && <>
      <section className="bg-white border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-neutral-500" />
          <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">장비 대모신청 내역</h3>
        </div>
        <div className="p-6">
          {demoRequests.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">데모신청 내역이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {demoRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{req.equipment || req.equipment_name || '-'}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{req.content || req.message || ''}</p>
                  </div>
                  <span className="text-xs text-neutral-400">{req.created_at ? new Date(req.created_at).toLocaleDateString('ko-KR') : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 1:1 문의 내역 */}
      <section className="bg-white border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
          <Package className="w-4 h-4 text-neutral-500" />
          <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">1:1 문의 내역</h3>
        </div>
        <div className="p-6">
          {inquiries.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">문의 내역이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {inquiries.map((inq: any) => (
                <div key={inq.id} className="flex items-start justify-between py-3 border-b border-neutral-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{inq.title || '-'}</p>
                    <p className="text-xs text-neutral-400 mt-0.5 truncate">{inq.content || ''}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      inq.status === 'answered' ? 'bg-green-100 text-green-700' :
                      inq.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-neutral-100 text-neutral-500'
                    }`}>
                      {inq.status === 'answered' ? '답변완료' : inq.status === 'pending' ? '답변대기' : inq.status || '-'}
                    </span>
                    <span className="text-xs text-neutral-400">{inq.created_at ? new Date(inq.created_at).toLocaleDateString('ko-KR') : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      </> /* end tab: 커뮤니케이션 */}

      {/* ── 탭: 주문/결제 */}
      {activeTab === 'orders' && <>
      {/* ── 주문 내역 */}
      <section className="bg-white border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-neutral-500" />
            <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">주문 내역</h3>
          </div>
          <span className="text-xs text-neutral-400">최근 50건</span>
        </div>
        <div className="overflow-x-auto">
          {memberOrders.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">주문 내역이 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500">주문일</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500">주문번호</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500">주문상품</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500">상태</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500">주문금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {memberOrders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="hover:bg-neutral-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <td className="px-4 py-3 text-neutral-600">
                      {order.ordered_at ? new Date(order.ordered_at).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-700">
                      {order.order_number || order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700 max-w-[200px]">
                      {(() => {
                        const items = order.order_items || [];
                        if (items.length === 0) return <span className="text-neutral-400">-</span>;
                        const firstName = items[0]?.product?.name || '상품';
                        return items.length > 1
                          ? `${firstName} 외 ${items.length - 1}개`
                          : firstName;
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'processing' ? 'bg-indigo-100 text-indigo-800' :
                        order.status === 'paid' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-neutral-100 text-neutral-600'
                      }`}>
                         {order.status === 'pending' ? '결제대기' :
                          order.status === 'paid' ? '결제완료' :
                          order.status === 'processing' ? '상품준비중' :
                          order.status === 'preparing' ? '상품준비중' :
                          order.status === 'partially_shipped' ? '부분발송' :
                          order.status === 'shipped' ? '배송중' :
                          order.status === 'delivered' ? '배송완료' :
                          order.status === 'cancel_requested' ? '취소요청' :
                          order.status === 'cancelled' ? '취소' :
                          order.status === 'return_requested' ? '반품요청' :
                          order.status === 'returning' ? '반품중' :
                          order.status === 'returned' ? '반품완료' : order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                      {(order.total_amount || 0).toLocaleString('ko-KR')}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* 페이징 */}
          {orderTotal > ORDER_PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
              <span className="text-xs text-neutral-400">
                총 {orderTotal}건 · {Math.ceil(orderTotal / ORDER_PAGE_SIZE)}페이지 중 {orderPage}페이지
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm"
                  onClick={() => {
                    const p = Math.max(1, orderPage - 1);
                    setOrderPage(p);
                    const from = (p - 1) * ORDER_PAGE_SIZE;
                    supabase.from('orders')
                      .select('id, order_number, ordered_at, status, total_amount, order_items(id, product:products(name))', { count: 'exact' })
                      .eq('user_id', member.id)
                      .order('ordered_at', { ascending: false })
                      .range(from, from + ORDER_PAGE_SIZE - 1)
                      .then(({ data, count }) => { setMemberOrders(data || []); setOrderTotal(count || 0); });
                  }}
                  disabled={orderPage === 1}
                  className="px-2 py-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.ceil(orderTotal / ORDER_PAGE_SIZE) }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === Math.ceil(orderTotal / ORDER_PAGE_SIZE) || Math.abs(p - orderPage) <= 2)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-neutral-400 text-xs">...</span>}
                      <button
                        onClick={() => {
                          setOrderPage(p);
                          const from = (p - 1) * ORDER_PAGE_SIZE;
                          supabase.from('orders')
                            .select('id, order_number, ordered_at, status, total_amount, order_items(id, product:products(name))', { count: 'exact' })
                            .eq('user_id', member.id)
                            .order('ordered_at', { ascending: false })
                            .range(from, from + ORDER_PAGE_SIZE - 1)
                            .then(({ data, count }) => { setMemberOrders(data || []); setOrderTotal(count || 0); });
                        }}
                        className={`px-3 py-1.5 text-sm border transition-colors ${
                          orderPage === p
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >{p}</button>
                    </React.Fragment>
                  ))}
                <Button
                  variant="outline" size="sm"
                  onClick={() => {
                    const p = Math.min(Math.ceil(orderTotal / ORDER_PAGE_SIZE), orderPage + 1);
                    setOrderPage(p);
                    const from = (p - 1) * ORDER_PAGE_SIZE;
                    supabase.from('orders')
                      .select('id, order_number, ordered_at, status, total_amount, order_items(id, product:products(name))', { count: 'exact' })
                      .eq('user_id', member.id)
                      .order('ordered_at', { ascending: false })
                      .range(from, from + ORDER_PAGE_SIZE - 1)
                      .then(({ data, count }) => { setMemberOrders(data || []); setOrderTotal(count || 0); });
                  }}
                  disabled={orderPage === Math.ceil(orderTotal / ORDER_PAGE_SIZE)}
                  className="px-2 py-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
      </> /* end tab: 주문/결제 */}

      {/* ── 탭: 크레딧 */}
      {activeTab === 'credit' && <>

      {/* 회수 모달 */}
      {revokeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRevokeModal(null)} />
          <div className="relative bg-white shadow-2xl rounded-sm" style={{ width: '100%', maxWidth: '440px', margin: '0 16px' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <span className="text-base">💸</span>
                <h3 className="text-base font-black text-neutral-900">크레딧 회수</h3>
              </div>
              <button onClick={() => setRevokeModal(null)} className="p-1.5 hover:bg-neutral-100 rounded transition-colors">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* 대상 크레딧 정보 */}
              <div className="bg-neutral-50 rounded px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">장비</span>
                  <span className="font-bold text-neutral-900">{revokeModal.credit.equipmentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">현재 잔액</span>
                  <span className="font-bold text-neutral-900">{revokeModal.credit.remaining.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">유효기간</span>
                  <span className="font-semibold text-neutral-700">{revokeModal.credit.expiryDate}</span>
                </div>
              </div>
              {/* 회수 금액 */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                  회수 금액 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number" min="1" step="1000"
                    placeholder="0"
                    value={revokeForm.amount}
                    onChange={e => setRevokeForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">원</span>
                </div>
                {revokeForm.amount && Number(revokeForm.amount) > 0 && (
                  <p className="text-xs text-neutral-500 mt-1">
                    회수 후 잔액: <span className="font-bold text-neutral-900">
                      {Math.max(0, revokeModal.credit.remaining - Number(revokeForm.amount)).toLocaleString()}원
                    </span>
                  </p>
                )}
              </div>
              {/* 회수 사유 */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                  회수 사유 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="회수 사유를 입력해주세요"
                  value={revokeForm.reason}
                  onChange={e => setRevokeForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-2">
              <button onClick={() => { setRevokeModal(null); setRevokeForm({ amount: '', reason: '' }); }}
                className="px-5 py-2.5 text-sm font-bold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors rounded">
                취소
              </button>
              <button onClick={handleRevokeCredit} disabled={revoking}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-60 transition-colors">
                {revoking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                회수 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 발급 모달 */}
      {showIssueModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowIssueModal(false)} />
          <div className="relative bg-white shadow-2xl rounded-sm" style={{ width: '100%', maxWidth: '460px', margin: '0 16px' }} onClick={e => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-black text-neutral-900">크레딧 발급</h3>
              </div>
              <button onClick={() => setShowIssueModal(false)} className="p-1.5 hover:bg-neutral-100 rounded transition-colors">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            {/* 모달 바디 */}
            <div className="px-6 py-5 space-y-4">
              {/* 회원 표시 */}
              <p className="text-sm text-neutral-600">
                <span className="font-bold text-neutral-900">{member?.name}</span>
                <span className="text-neutral-400 ml-2">({member?.email})</span>
              </p>

              {/* 장비 선택 */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                  장비 선택 <span className="text-red-500">*</span>
                </label>
                <select
                  value={issueForm.equipmentType}
                  onChange={e => setIssueForm(f => ({ ...f, equipmentType: e.target.value }))}
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {equipmentModels.length === 0 ? (
                    <option value="">장비를 불러오는 중...</option>
                  ) : (
                    equipmentModels.map(eq => (
                      <option key={eq.id} value={eq.model_name}>{eq.model_name}</option>
                    ))
                  )}
                </select>
              </div>

              {/* 크레딧 금액 */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                  크레딧 금액 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number" min="0" step="1000"
                    placeholder="0"
                    value={issueForm.amount}
                    onChange={e => setIssueForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">원</span>
                </div>
              </div>

              {/* 유효기간 */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                  유효기간 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={issueForm.expiryDate}
                  onChange={e => setIssueForm(f => ({ ...f, expiryDate: e.target.value }))}
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* 메모 */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">메모</label>
                <input
                  type="text"
                  placeholder="발급 사유 또는 메모 (선택)"
                  value={issueForm.memo}
                  onChange={e => setIssueForm(f => ({ ...f, memo: e.target.value }))}
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* 현재 잔액 표시 */}
              <div className="bg-neutral-50 rounded px-4 py-2.5 text-sm text-neutral-600">
                현재 잔액:{' '}
                <span className="font-bold text-neutral-900">
                  {(creditSummary.find(s => s.equipmentType === issueForm.equipmentType)?.remaining ?? 0).toLocaleString()}원
                </span>
                {' '}({issueForm.equipmentType})
              </div>
            </div>
            {/* 모달 푸터 */}
            <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-2">
              <button onClick={() => setShowIssueModal(false)}
                className="px-5 py-2.5 text-sm font-bold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors rounded">
                취소
              </button>
              <button onClick={handleIssueCredit} disabled={issuing}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded disabled:opacity-60 transition-colors"
                style={{ backgroundColor: '#F59E0B' }}
                onMouseEnter={e => { if (!issuing) e.currentTarget.style.backgroundColor = '#D97706'; }}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F59E0B')}>
                {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                발급
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 크레딧 탭 본문 */}
      <section className="bg-white border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">크레딧</h3>
          <button onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded transition-colors"
            style={{ backgroundColor: '#F59E0B' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#D97706')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F59E0B')}>
            <PlusCircle className="w-4 h-4" />
            크레딧 발행하기
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 장비별 잔액 요약 카드 (크레딧이 있는 장비만) */}
          {creditSummary.length > 0 && (
            <div className={`grid gap-4 ${creditSummary.length === 1 ? 'grid-cols-1' : creditSummary.length <= 3 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {creditSummary.map(s => (
                <div key={s.equipmentType} className="border border-neutral-200 rounded p-4 bg-neutral-50">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">{s.equipmentType} 크레딧</div>
                  <div className="text-2xl font-black text-neutral-900">
                    {s.remaining.toLocaleString()}
                    <span className="text-sm font-normal text-neutral-400 ml-1">원</span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    총 발급 {s.totalAmount.toLocaleString()}원 · 사용 {s.usedAmount.toLocaleString()}원
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 발급 목록 */}
          {creditLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
          ) : credits.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">발급된 크레딧이 없습니다.</p>
          ) : (
            <div className="border border-neutral-200 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">발급일</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">장비</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-neutral-500 uppercase">발급금액</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-neutral-500 uppercase">잔액</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">유효기간</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-neutral-500 uppercase">상태</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-neutral-500 uppercase">회수</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-neutral-500 uppercase">이력</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {credits.map(credit => {
                    const isExpanded = expandedCreditId === credit.id;
                    const isExpired = credit.status === 'expired' || new Date(credit.expiryDate) < new Date();
                    const txs = creditTransactions[credit.id];
                    return (
                      <React.Fragment key={credit.id}>
                        <tr className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3 text-neutral-600">
                            {new Date(credit.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                              credit.equipmentType === 'Density'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>{credit.equipmentType}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">{credit.amount.toLocaleString()}원</td>
                          <td className="px-4 py-3 text-right font-bold text-neutral-900">{credit.remaining.toLocaleString()}원</td>
                          <td className="px-4 py-3 text-neutral-600">{credit.expiryDate}</td>
                          <td className="px-4 py-3 text-center">
                            {isExpired || credit.status === 'expired' ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">만료</span>
                            ) : credit.status === 'exhausted' ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-500">소진</span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">활성</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {credit.status === 'active' && !isExpired && credit.remaining > 0 ? (
                              <button
                                onClick={() => { setRevokeModal({ credit }); setRevokeForm({ amount: '', reason: '' }); }}
                                className="text-xs px-3 py-1.5 bg-neutral-900 text-white rounded hover:bg-neutral-700 font-bold transition-colors"
                              >
                                회수
                              </button>
                            ) : (
                              <span className="text-xs text-neutral-300">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleCreditHistory(credit.id)}
                              className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 mx-auto"
                            >
                              <History className="w-3.5 h-3.5" />
                              <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="bg-neutral-50 px-6 py-4">
                              <p className="text-xs font-bold text-neutral-500 uppercase mb-2">사용 이력</p>
                              {!txs ? (
                                <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin" /></div>
                              ) : txs.length === 0 ? (
                                <p className="text-xs text-neutral-400">이력이 없습니다.</p>
                              ) : (
                                <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                                  <thead>
                                    <tr className="text-neutral-400" style={{ borderBottom: '1px solid #e5e7eb' }}>
                                      <th style={{ textAlign: 'left', paddingBottom: '8px', paddingRight: '16px', width: '90px' }}>일시</th>
                                      <th style={{ textAlign: 'left', paddingBottom: '8px', paddingRight: '16px', width: '50px' }}>유형</th>
                                      <th style={{ textAlign: 'right', paddingBottom: '8px', paddingRight: '24px', width: '110px' }}>금액</th>
                                      <th style={{ textAlign: 'left', paddingBottom: '8px', paddingLeft: '8px' }}>메모</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {txs.map(tx => (
                                      <tr key={tx.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '8px 16px 8px 0', color: '#6b7280', whiteSpace: 'nowrap' }}>
                                          {new Date(tx.createdAt).toLocaleDateString('ko-KR')} {new Date(tx.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '8px 16px 8px 0' }}>
                                          <span style={{
                                            display: 'inline-flex', padding: '2px 6px', borderRadius: '4px',
                                            fontSize: '11px', fontWeight: 700,
                                            backgroundColor: tx.type === 'issue' ? '#dcfce7' : tx.type === 'use' ? '#dbeafe' : tx.type === 'expire' ? '#fee2e2' : tx.type === 'revoke' ? '#f3f4f6' : '#fef9c3',
                                            color: tx.type === 'issue' ? '#15803d' : tx.type === 'use' ? '#1d4ed8' : tx.type === 'expire' ? '#b91c1c' : tx.type === 'revoke' ? '#374151' : '#a16207',
                                          }}>
                                            {tx.type === 'issue' ? '발급' : tx.type === 'use' ? '사용' : tx.type === 'expire' ? '만료' : tx.type === 'revoke' ? '회수' : '환급'}
                                          </span>
                                        </td>
                                        <td style={{ padding: '8px 24px 8px 0', textAlign: 'right', fontWeight: 600 }}>{tx.amount.toLocaleString()}원</td>
                                        <td style={{ padding: '8px 0 8px 8px', color: '#6b7280' }}>{tx.description || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      </> /* end tab: 크레딧 */}


      {/* ── 탭: 포인트 */}
      {activeTab === 'points' && <>
      <section className="bg-white border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">포인트</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-neutral-400 text-center py-8">포인트 정보를 준비 중입니다.</p>
        </div>
      </section>
      </> /* end tab: 포인트 */}
    </div>
  );
}
