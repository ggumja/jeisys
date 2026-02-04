import { useState } from 'react';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'super' | 'manager' | 'staff';
  permissions: string[];
  createdDate: string;
  lastLogin: string;
}

const mockAdmins: Admin[] = [
  {
    id: '1',
    name: '홍길동',
    email: 'admin@jeisys.com',
    role: 'super',
    permissions: ['all'],
    createdDate: '2025-01-01',
    lastLogin: '2026-02-02 14:30',
  },
  {
    id: '2',
    name: '김영희',
    email: 'manager@jeisys.com',
    role: 'manager',
    permissions: ['order', 'product', 'communication'],
    createdDate: '2025-03-15',
    lastLogin: '2026-02-02 10:15',
  },
  {
    id: '3',
    name: '이철수',
    email: 'staff@jeisys.com',
    role: 'staff',
    permissions: ['order', 'communication'],
    createdDate: '2025-06-20',
    lastLogin: '2026-02-01 16:45',
  },
];

export function AdminManagementPage() {
  const [showForm, setShowForm] = useState(false);

  const getRoleBadge = (role: Admin['role']) => {
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
    }
  };

  const getPermissionText = (permissions: string[]) => {
    if (permissions.includes('all')) return '전체 권한';
    const permissionMap: Record<string, string> = {
      order: '주문관리',
      product: '상품관리',
      communication: '커뮤니케이션',
      member: '회원관리',
      admin: '관리자관리',
    };
    return permissions.map((p) => permissionMap[p] || p).join(', ');
  };

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
          onClick={() => setShowForm(!showForm)}
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
            관리자 등록
          </h3>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  이름 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
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
                  className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="admin@jeisys.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  비밀번호 <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  권한 등급 <span className="text-red-600">*</span>
                </label>
                <select
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

            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                접근 권한 <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['주문관리', '상품관리', '커뮤니케이션', '회원관리', '관리자관리'].map((perm) => (
                  <label key={perm} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                    />
                    <span className="text-sm text-neutral-700">{perm}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-6 py-4 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-4 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
              >
                등록하기
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
              {mockAdmins.map((admin) => (
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
                    <div className="text-sm text-neutral-700">
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
                      <button className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      {admin.role !== 'super' && (
                        <button className="p-2 border border-neutral-300 text-red-600 hover:bg-red-50 transition-colors">
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
