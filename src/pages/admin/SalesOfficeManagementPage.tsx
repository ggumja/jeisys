import { useState } from 'react';
import { Search, Plus, Edit, X, MapPin, User } from 'lucide-react';

interface SalesOffice {
  id: string;
  officeCode: string;
  name: string;
  region: string;
  address: string;
  tel: string;
  fax?: string;
  manager: string;
  managerTel: string;
  email: string;
  commissionRate: string;
  status: 'active' | 'inactive';
  createdDate: string;
  note?: string;
}

const mockSalesOffices: SalesOffice[] = [
  {
    id: '1',
    officeCode: 'SEOUL01',
    name: '서울본사',
    region: '서울/경기',
    address: '서울특별시 금천구 가산디지털로 96 대륭테크노타운8 513호',
    tel: '070-7435-4927',
    fax: '02-1234-5678',
    manager: '김영업',
    managerTel: '010-1234-5678',
    email: 'seoul@jcsmedical.com',
    commissionRate: '10',
    status: 'active',
    createdDate: '2024-01-10',
    note: '서울 및 경기 지역 총괄',
  },
  {
    id: '2',
    officeCode: 'BUSAN01',
    name: '부산지점',
    region: '부산/경남',
    address: '부산광역시 해운대구 센텀중앙로 78',
    tel: '051-1234-5678',
    fax: '051-1234-5679',
    manager: '이지점',
    managerTel: '010-2345-6789',
    email: 'busan@jcsmedical.com',
    commissionRate: '12',
    status: 'active',
    createdDate: '2024-03-15',
    note: '부산, 경남권 담당',
  },
  {
    id: '3',
    officeCode: 'DAEGU01',
    name: '대구지점',
    region: '대구/경북',
    address: '대구광역시 수성구 범어동 123-45',
    tel: '053-1234-5678',
    manager: '박대구',
    managerTel: '010-3456-7890',
    email: 'daegu@jcsmedical.com',
    commissionRate: '15',
    status: 'active',
    createdDate: '2024-06-01',
  },
  {
    id: '4',
    officeCode: 'GWANGJU01',
    name: '광주지점',
    region: '광주/전라',
    address: '광주광역시 서구 상무대로 123',
    tel: '062-1234-5678',
    manager: '최광주',
    managerTel: '010-4567-8901',
    email: 'gwangju@jcsmedical.com',
    commissionRate: '10',
    status: 'inactive',
    createdDate: '2025-01-20',
    note: '전라권 담당 (현재 휴무)',
  },
];

const regions = ['전체', '서울/경기', '부산/경남', '대구/경북', '광주/전라', '대전/충청', '강원', '제주'];

export function SalesOfficeManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<SalesOffice | null>(null);
  const [formData, setFormData] = useState<Omit<SalesOffice, 'id' | 'createdDate'>>({
    officeCode: '',
    name: '',
    region: '',
    address: '',
    tel: '',
    fax: '',
    manager: '',
    managerTel: '',
    email: '',
    commissionRate: '',
    status: 'active',
    note: '',
  });

  const filteredOffices = mockSalesOffices.filter((office) => {
    const matchesSearch =
      office.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === '전체' || office.region === regionFilter;
    const matchesStatus = statusFilter === 'all' || office.status === statusFilter;
    return matchesSearch && matchesRegion && matchesStatus;
  });

  const handleOpenModal = (office?: SalesOffice) => {
    if (office) {
      setEditingOffice(office);
      setFormData({
        officeCode: office.officeCode,
        name: office.name,
        region: office.region,
        address: office.address,
        tel: office.tel,
        fax: office.fax,
        manager: office.manager,
        managerTel: office.managerTel,
        email: office.email,
        commissionRate: office.commissionRate,
        status: office.status,
        note: office.note,
      });
    } else {
      setEditingOffice(null);
      setFormData({
        officeCode: '',
        name: '',
        region: '',
        address: '',
        tel: '',
        fax: '',
        manager: '',
        managerTel: '',
        email: '',
        commissionRate: '',
        status: 'active',
        note: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOffice(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit:', formData);
    alert(editingOffice ? '영업점 정보가 수정되었습니다.' : '새 영업점이 등록되었습니다.');
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      console.log('Delete:', id);
      alert('영업점이 삭제되었습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">판매영업점 관리</h2>
          <p className="text-sm text-neutral-600">전국 판매영업점을 관리합니다</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>영업점 등록</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-neutral-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="영업점명, 주소, 담당자 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            {regions.map((region) => (
              <option key={region} value={region}>
                {region === '전체' ? '전체 지역' : region}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <option value="all">전체 상태</option>
            <option value="active">운영중</option>
            <option value="inactive">휴무</option>
          </select>
        </div>
      </div>

      {/* Sales Office List */}
      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  영업점명
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  지점코드
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  지역
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  주소
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  담당자
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  수수료율
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredOffices.map((office) => (
                <tr key={office.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900">{office.name}</div>
                    <div className="text-xs text-neutral-500">등록일: {office.createdDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-neutral-900 font-mono">{office.officeCode}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium">
                      <MapPin className="w-3 h-3" />
                      {office.region}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-900 max-w-xs">{office.address}</div>
                    <div className="text-xs text-neutral-500 mt-1">TEL: {office.tel}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-neutral-400" />
                      <div>
                        <div className="text-sm text-neutral-900">{office.manager}</div>
                        <div className="text-xs text-neutral-500">{office.managerTel}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium">
                      {office.commissionRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-medium ${
                        office.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {office.status === 'active' ? '운영중' : '휴무'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenModal(office)}
                      className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOffices.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-neutral-600">조회된 영업점이 없습니다</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">전체 영업점</div>
          <div className="text-2xl font-medium text-neutral-900">{mockSalesOffices.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">운영중</div>
          <div className="text-2xl font-medium text-green-600">
            {mockSalesOffices.filter((o) => o.status === 'active').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">휴무</div>
          <div className="text-2xl font-medium text-red-600">
            {mockSalesOffices.filter((o) => o.status === 'inactive').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <div className="text-xs text-neutral-600 mb-1">주요 지역</div>
          <div className="text-2xl font-medium text-neutral-900">
            {new Set(mockSalesOffices.map((o) => o.region)).size}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-medium text-neutral-900">
                {editingOffice ? '영업점 수정' : '영업점 등록'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    지점코드 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="officeCode"
                    value={formData.officeCode}
                    onChange={handleInputChange}
                    placeholder="SEOUL01"
                    className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    영업점명 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="서울본사"
                    className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    담당 지역 <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  >
                    <option value="">지역 선택</option>
                    {regions.filter((r) => r !== '전체').map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    주소 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="서울특별시 금천구 가산디지털로 96"
                    className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    대표전화 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    name="tel"
                    value={formData.tel}
                    onChange={handleInputChange}
                    placeholder="070-7435-4927"
                    className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">팩스</label>
                  <input
                    type="tel"
                    name="fax"
                    value={formData.fax}
                    onChange={handleInputChange}
                    placeholder="02-1234-5678"
                    className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    담당자명 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="manager"
                    value={formData.manager}
                    onChange={handleInputChange}
                    placeholder="김영업"
                    className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    담당자 연락처 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    name="managerTel"
                    value={formData.managerTel}
                    onChange={handleInputChange}
                    placeholder="010-1234-5678"
                    className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    이메일 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="seoul@jcsmedical.com"
                    className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    수수료율 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="commissionRate"
                    value={formData.commissionRate}
                    onChange={handleInputChange}
                    placeholder="10%"
                    className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    운영 상태
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="active">운영중</option>
                    <option value="inactive">휴무</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-900 mb-2">비고</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="추가 정보를 입력하세요"
                    rows={3}
                    className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                >
                  {editingOffice ? '수정 완료' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}