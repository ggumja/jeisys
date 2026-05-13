import { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';
import { adminService, AdminUser } from '../../services/adminService';

const ALL_PERMISSIONS = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'orders', label: '주문관리' },
  { key: 'subscriptions', label: '정기배송목록' },
  { key: 'communication', label: '커뮤니케이션관리' },
  { key: 'statistics', label: '통계 분석' },
  { key: 'ads', label: '광고/배너 관리' },
  { key: 'products', label: '상품관리' },
  { key: 'equipments', label: '장비관리' },
  { key: 'marketing', label: '마케팅관리' },
  { key: 'sales_offices', label: '판매영업점 관리' },
  { key: 'members', label: '회원관리' },
  { key: 'admins', label: '관리자 계정관리' },
  { key: 'settings', label: '쇼핑몰 기본 설정' },
];

export function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '' as AdminUser['role'] | '',
    permissions: [] as string[],
  });

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAdmins();
      setAdmins(data);
    } catch (error) {
      console.error('Failed to load admins:', error);
      alert('관리자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const getRoleBadge = (role: AdminUser['role']) => {
    switch (role) {
      case 'super':
        return (
          <span className="inline-flex px-3 py-1 bg-red-100 text-red-800 text-xs font-medium">
            최고관리자
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium">
            관리자
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 text-xs font-medium">
            직원
          </span>
        );
      default:
        return (
          <span className="inline-flex px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium">
            기타
          </span>
        );
    }
  };

  const getPermissionText = (permissions: string[]) => {
    if (permissions.includes('all')) return '전체 권한';
    const permissionMap: Record<string, string> = {};
    ALL_PERMISSIONS.forEach(p => permissionMap[p.key] = p.label);
    
    return permissions.map((p) => permissionMap[p] || p).join(', ');
  };

  const handleCheckboxChange = (key: string) => {
    setFormData(prev => {
      const isChecked = prev.permissions.includes(key);
      if (isChecked) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== key) };
      } else {
        return { ...prev, permissions: [...prev.permissions, key] };
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, permissions: ALL_PERMISSIONS.map(p => p.key) }));
    } else {
      setFormData(prev => ({ ...prev, permissions: [] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) return;

    try {
      setIsSubmitting(true);
      if (editingId) {
        await adminService.updateAdmin(editingId, {
          name: formData.name,
          role: formData.role,
          permissions: formData.permissions,
        });
        alert('관리자 정보가 수정되었습니다.');
      } else {
        if (!formData.password) {
          alert('비밀번호를 입력해주세요.');
          return;
        }
        await adminService.createAdmin({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          permissions: formData.permissions,
        });
        alert('관리자가 등록되었습니다.');
      }

      await fetchAdmins();
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', email: '', password: '', role: '', permissions: [] });
    } catch (error: any) {
      console.error('Error saving admin:', error);
      alert(`오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 관리자 권한을 삭제(일반 유저로 강등)하시겠습니까?')) return;
    
    try {
      await adminService.deleteAdmin(id);
      alert('관리자 권한이 삭제되었습니다.');
      fetchAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
            관리자 계정관리
          </h2>
          <p className="text-sm text-neutral-600">
            관리자를 등록하고 권한을 관리합니다
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setEditingId(null);
              setFormData({ name: '', email: '', password: '', role: '', permissions: [] });
            }
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>관리자 등록</span>
        </button>
      </div>

      {/* Registration Form */}
      {showForm && (
        <div className="bg-white border border-neutral-200 p-6 lg:p-8">
          <h3 className="text-xl tracking-tight text-neutral-900 mb-6">
            {editingId ? '관리자 수정' : '관리자 등록'}
          </h3>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  이름 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="홍길동"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  이메일 <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500"
                  placeholder="admin@jeisys.com"
                  required
                  disabled={!!editingId} // 이메일(아이디)은 수정 불가
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  비밀번호 {!editingId && <span className="text-red-600">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500"
                  required={!editingId}
                  disabled={!!editingId} // 보안상 수정 모드에서는 프론트에서 임의 수정 불가 (필요 시 비밀번호 변경 기능 분리)
                  placeholder={editingId ? "수정 모드에서는 비밀번호를 변경할 수 없습니다" : "초기 비밀번호 입력"}
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  권한 등급 <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as AdminUser['role'] })}
                  className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                >
                  <option value="">선택하세요</option>
                  <option value="super">최고관리자</option>
                  <option value="manager">관리자</option>
                  <option value="staff">직원</option>
                </select>
              </div>
            </div>

            <div className={`transition-opacity ${formData.role === 'super' ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm text-neutral-700">
                  접근 권한 <span className="text-red-600">*</span>
                  {formData.role === 'super' && <span className="ml-2 text-xs text-red-500 font-medium">(최고관리자는 모든 메뉴에 접근 가능합니다)</span>}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={formData.permissions.length === ALL_PERMISSIONS.length && ALL_PERMISSIONS.length > 0}
                  />
                  <span className="text-sm font-medium text-neutral-900">전체 선택</span>
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-50 p-4 border border-neutral-200">
                {ALL_PERMISSIONS.map((perm) => (
                  <label key={perm.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.role === 'super' || formData.permissions.includes(perm.key)}
                      onChange={() => handleCheckboxChange(perm.key)}
                      className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                    />
                    <span className="text-sm text-neutral-700">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="flex-1 px-6 py-4 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-4 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? '처리 중...' : (editingId ? '수정하기' : '등록하기')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin List */}
      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  관리자 정보
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  권한 등급
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  접근 권한
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  마지막 로그인
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-500">
                    등록된 관리자가 없습니다.
                  </td>
                </tr>
              ) : admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-neutral-900">
                          {admin.name}
                        </div>
                        <div className="text-xs text-neutral-500">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(admin.role)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-700 leading-relaxed">
                      {getPermissionText(admin.permissions)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-700">{admin.lastLogin}</div>
                    <div className="text-xs text-neutral-500">
                      등록일: {admin.createdDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                        onClick={() => {
                          setEditingId(admin.id);
                          setFormData({
                            name: admin.name,
                            email: admin.email,
                            password: '', // 수정 모드에서는 빈 값 (비밀번호 수정 방지됨)
                            role: admin.role,
                            permissions: admin.permissions.includes('all') ? ALL_PERMISSIONS.map(p => p.key) : admin.permissions,
                          });
                          setShowForm(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {admin.role !== 'super' && (
                        <button 
                          className="p-2 border border-neutral-300 text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => handleDelete(admin.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Information */}
      <div className="bg-neutral-50 border border-neutral-200 p-6">
        <h3 className="text-sm font-medium text-neutral-900 mb-3">
          권한 등급 안내
        </h3>
        <div className="space-y-2 text-sm text-neutral-600">
          <div className="flex items-start gap-2">
            <span className="font-medium text-red-600">최고관리자:</span>
            <span>모든 기능에 대한 전체 접근 권한</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-blue-600">관리자:</span>
            <span>지정된 메뉴에 대한 조회 및 관리 권한</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-green-600">직원:</span>
            <span>지정된 메뉴에 대한 제한적 조회 및 처리 권한</span>
          </div>
        </div>
      </div>
    </div>
  );
}
