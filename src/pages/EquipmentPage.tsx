import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Calendar, Shield, TrendingUp, Plus, X, Loader2 } from 'lucide-react';
import { equipmentService, EquipmentModel } from '../services/equipmentService';
import { Equipment } from '../types';

export function EquipmentPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration Modal State
  const [showModal, setShowModal] = useState(false);
  const [models, setModels] = useState<EquipmentModel[]>([]);
  const [formData, setFormData] = useState({
    equipmentId: '',
    serialNumber: '',
    installDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userEq, modelList] = await Promise.all([
        equipmentService.getUserEquipment(),
        equipmentService.getEquipmentModels()
      ]);
      setEquipments(userEq);
      setModels(modelList);
    } catch (error) {
      console.error('Failed to load equipment data', error);
    } finally {
      setLoading(false);
    }
  };

  const isWarrantyActive = (endDate: string) => {
    return new Date(endDate) > new Date();
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipmentId || !formData.serialNumber || !formData.installDate) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await equipmentService.registerEquipment(
        formData.equipmentId,
        formData.serialNumber,
        formData.installDate
      );
      alert('장비가 등록되었습니다.');
      setShowModal(false);
      setFormData({ equipmentId: '', serialNumber: '', installDate: '' });
      loadData(); // Refresh list
    } catch (error: any) {
      console.error('Registration failed:', error);
      alert('장비 등록 실패: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">보유 장비</h2>
          <p className="text-sm text-neutral-600">등록된 의료 기기를 관리하세요</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          장비 추가
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {equipments.map(equipment => {
          const warrantyActive = isWarrantyActive(equipment.warrantyEndDate);
          const daysLeft = getDaysUntilExpiry(equipment.warrantyEndDate);

          return (
            <div key={equipment.id} className="bg-white border border-neutral-200 overflow-hidden group">
              {/* Equipment Image */}
              <div className="aspect-video bg-neutral-100 overflow-hidden relative">
                <img
                  src={equipment.imageUrl}
                  alt={equipment.modelName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  {equipment.category}
                </div>
              </div>

              {/* Equipment Info */}
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl tracking-tight text-neutral-900 mb-2 font-bold">
                    {equipment.modelName}
                  </h3>
                  <p className="text-sm text-neutral-500 font-mono">
                    S/N: {equipment.serialNumber}
                  </p>
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-neutral-50 p-4 border border-neutral-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                      <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">설치일</p>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {equipment.installDate}
                    </p>
                  </div>

                  <div className={`p-4 border ${warrantyActive ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className={`w-3.5 h-3.5 ${warrantyActive ? 'text-green-600' : 'text-red-600'
                        }`} />
                      <p className={`text-xs uppercase tracking-wide font-medium ${warrantyActive ? 'text-green-700' : 'text-red-700'
                        }`}>
                        워런티
                      </p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className={`text-sm font-bold ${warrantyActive ? 'text-green-900' : 'text-red-900'
                        }`}>
                        {warrantyActive ? `유효함` : '만료됨'}
                      </p>
                      {warrantyActive && (
                        <p className="text-xs text-green-700 font-medium">
                          (D-{daysLeft})
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Link
                    to={`/products?equipment=${equipment.serialNumber}`} // TODO: Filter by model code actually
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 px-4 text-sm font-medium text-center transition-colors flex items-center justify-center gap-2"
                  >
                    <span>호환 소모품 주문</span>
                    <TrendingUp className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && equipments.length === 0 && (
        <div className="bg-white border border-neutral-200 p-20 text-center">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-12 h-12 text-neutral-400" />
          </div>
          <h3 className="text-xl tracking-tight text-neutral-900 mb-3 font-bold">
            등록된 장비가 없습니다
          </h3>
          <p className="text-sm text-neutral-600 mb-8 max-w-md mx-auto">
            보유하신 의료 기기를 등록하면 호환되는 정품 소모품을 쉽고 빠르게 주문하실 수 있습니다.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 font-medium transition-colors text-sm tracking-wide uppercase"
          >
            첫 장비 등록하기
          </button>
        </div>
      )}

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 relative shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold mb-6 tracking-tight text-neutral-900">장비 등록</h3>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">장비 모델</label>
                <select
                  value={formData.equipmentId}
                  onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-shadow"
                  required
                >
                  <option value="">모델을 선택하세요</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.model_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">시리얼 넘버 (S/N)</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="예: PTZ-2024-001"
                  className="w-full px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-shadow"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">설치일자</label>
                <input
                  type="date"
                  value={formData.installDate}
                  onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-shadow"
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-4 font-bold tracking-wide transition-colors disabled:opacity-50"
                >
                  {submitting ? '등록 중...' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}