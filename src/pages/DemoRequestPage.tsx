import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, Plus, X } from 'lucide-react';
import { demoService, DemoRequest } from '../services/demoService';
import { authService } from '../services/authService';
import { formatDate } from '../lib/utils';

const equipmentOptions = [
  'Density',
  'DLiv',
  'POTENZA',
  'INTRAcel',
  'LinearZ',
  'LinearFirm',
  'ULTRAcel II',
  'LIPOcel II',
  'IntraGen',
];

export function DemoRequestPage() {
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    equipment: '',
    preferredDate: '',
    content: '',
    hospitalName: '',
    contactNumber: '',
  });

  useEffect(() => {
    fetchUserAndRequests();
  }, []);

  const fetchUserAndRequests = async () => {
    try {
      setIsLoading(true);
      const user = await authService.getCurrentUser();
      if (user) {
        setUserId(user.id);
        const data = await demoService.getUserDemoRequests(user.id);
        setRequests(data);
        
        // Pre-fill
        setFormData(prev => ({
          ...prev,
          hospitalName: user.hospitalName || '',
          contactNumber: user.mobile || user.phone || '',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch user or demo requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await demoService.createDemoRequest({
        user_id: userId || undefined,
        hospital_name: formData.hospitalName,
        contact_number: formData.contactNumber,
        equipment: formData.equipment,
        preferred_date: formData.preferredDate,
        content: formData.content,
      });

      alert('데모 신청이 완료되었습니다. 담당자가 확인 후 연락드리겠습니다.');
      setShowForm(false);
      setFormData(prev => ({ 
        ...prev,
        equipment: '', 
        preferredDate: '', 
        content: '',
      }));
      fetchUserAndRequests();
    } catch (error) {
      console.error('Failed to submit demo request:', error);
      alert('신청 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: DemoRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium">
            <Clock className="w-3 h-3" />
            대기중
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium">
            <Calendar className="w-3 h-3" />
            일정확정
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            완료
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
            장비 데모 신청
          </h2>
          <p className="text-sm text-neutral-600">
            구매 전 장비 데모를 신청하고 일정을 확인하세요
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>데모 신청</span>
        </button>
      </div>

      {/* Application Form */}
      {showForm && (
        <div className="mb-8 bg-white border border-neutral-200 p-6 lg:p-8">
          <h2 className="text-xl tracking-tight text-neutral-900 mb-6">
            데모 신청서
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                병원명 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleChange}
                placeholder="병원명을 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                연락처 <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="연락받으실 전화번호를 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                데모 희망 장비 <span className="text-red-600">*</span>
              </label>
              <select
                name="equipment"
                value={formData.equipment}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              >
                <option value="">장비를 선택하세요</option>
                {equipmentOptions.map((equipment) => (
                  <option key={equipment} value={equipment}>
                    {equipment}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                희망 데모 일정 <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
              <p className="text-xs text-neutral-500 mt-2">
                희망 일정을 선택해 주시면 담당자가 확인 후 최종 일정을 안내해
                드립니다
              </p>
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                데모 요청 사항 <span className="text-red-600">*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="데모에서 확인하고 싶은 내용을 구체적으로 작성해 주세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                rows={5}
                required
              />
            </div>

            <div className="flex gap-3">
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
                신청하기
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History List */}
      <div className="bg-white border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <h2 className="text-lg tracking-tight text-neutral-900">
            데모 신청 내역
          </h2>
        </div>

        <div className="divide-y divide-neutral-200">
          {isLoading ? (
            <div className="py-16 text-center text-neutral-500">로딩 중...</div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600 mb-6">
                신청한 데모 내역이 없습니다
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>첫 데모 신청하기</span>
              </button>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="px-6 py-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg tracking-tight text-neutral-900">
                      {request.equipment}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="flex flex-col lg:flex-row gap-2 lg:gap-6 text-sm text-neutral-600">
                    <span>신청일: {formatDate(request.createdAt)}</span>
                    {request.scheduledDate && (
                      <span className="font-medium text-blue-600">
                        데모일: {formatDate(request.scheduledDate)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {request.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-6 bg-neutral-50 border border-neutral-200">
        <h3 className="text-sm font-medium text-neutral-900 mb-3">
          데모 신청 안내
        </h3>
        <ul className="text-sm text-neutral-600 space-y-2">
          <li>
            • 데모 신청 후 담당자가 확인하여 최종 데모 일정을 안내해 드립니다.
          </li>
          <li>• 데모는 병원 방문 또는 본사 쇼룸에서 진행 가능합니다.</li>
          <li>
            • 장비 데모 시 실제 시술 시연 및 기능 상담이 제공됩니다.
          </li>
          <li>• 긴급 데모 문의: 고객센터 070-7435-4927</li>
        </ul>
      </div>
    </div>
  );
}
