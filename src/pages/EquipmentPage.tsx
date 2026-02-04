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
                        <p className=