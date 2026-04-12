import { useState } from 'react';
import { X, RefreshCw, Loader2, CheckCircle2, AlertTriangle, ArrowRightLeft, RotateCcw } from 'lucide-react';
import { ADMIN_STYLES } from '../../constants/adminStyles';
import { adminService } from '../../services/adminService';
import { useModal } from '../../context/ModalContext';
import { Button } from '../ui/button';

interface OrderClaimModalProps {
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderClaimModal({ order, onClose, onSuccess }: OrderClaimModalProps) {
  const { confirm } = useModal();
  const [claimType, setClaimType] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRequest = async () => {
    if (!reason.trim()) {
      setError('상세 사유를 입력해주세요.');
      return;
    }

    const typeLabel = claimType === 'RETURN' ? '반품' : '교환';
    
    if (!(await confirm({ 
      title: `${typeLabel} 요청 등록`, 
      description: `정말로 이 주문을 ${typeLabel} 요청 상태로 변경하시겠습니까?\n사유: ${reason}` 
    }))) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await adminService.requestClaim(order.id, { 
        type: claimType, 
        reason: reason 
      });

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Claim request failed', err);
      setError(err.message || '요청 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 text-center rounded-lg shadow-2xl">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neutral-900 mb-2">
            {claimType === 'RETURN' ? '반품' : '교환'} 요청이 등록되었습니다
          </h3>
          <p className="text-sm text-neutral-500">주문 상태가 업데이트되었습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full shadow-2xl overflow-hidden rounded-lg animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
          <h3 className="font-bold text-neutral-900 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-orange-500" />
            반품/교환 클레임 등록
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Order Info Summary */}
          <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-neutral-400 mb-1">대상 주문번호</p>
                <p className="font-bold text-neutral-900">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-400 mb-1">현재 주문상태</p>
                <p className="font-medium text-neutral-700">{order.status}</p>
              </div>
            </div>
          </div>

          {/* Type Selection */}
          <div className="space-y-3">
            <label className={ADMIN_STYLES.SECTION_LABEL}>클레임 유형 선택</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setClaimType('RETURN')}
                className={`flex flex-col items-center gap-3 p-5 border-2 rounded-xl transition-all ${
                  claimType === 'RETURN' 
                    ? 'border-orange-500 bg-orange-50 text-orange-700' 
                    : 'border-neutral-100 text-neutral-400 hover:border-neutral-200'
                }`}
              >
                <RotateCcw className={`w-8 h-8 ${claimType === 'RETURN' ? 'text-orange-500' : 'text-neutral-300'}`} />
                <span className="font-bold tracking-tight">반품 요청</span>
              </button>
              <button
                onClick={() => setClaimType('EXCHANGE')}
                className={`flex flex-col items-center gap-3 p-5 border-2 rounded-xl transition-all ${
                  claimType === 'EXCHANGE' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-neutral-100 text-neutral-400 hover:border-neutral-200'
                }`}
              >
                <ArrowRightLeft className={`w-8 h-8 ${claimType === 'EXCHANGE' ? 'text-blue-500' : 'text-neutral-300'}`} />
                <span className="font-bold tracking-tight">교환 요청</span>
              </button>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <label className={ADMIN_STYLES.SECTION_LABEL}>
              {claimType === 'RETURN' ? '반품' : '교환'} 상세 사유
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`${ADMIN_STYLES.TEXTAREA} min-h-[120px] focus:ring-2 focus:ring-orange-500/20`}
              placeholder="클레임 발생 사유를 구체적으로 입력해주세요."
            />
            <p className="text-xs text-neutral-400 text-right">{reason.length}자 입력됨</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-neutral-50 border-t border-neutral-100 flex gap-4">
          <Button onClick={onClose} variant="outline" className="flex-1 py-6 font-bold text-neutral-600 border-neutral-200 hover:bg-white">
            취소하기
          </Button>
          <Button
            onClick={handleRequest}
            disabled={loading}
            className={`flex-1 py-6 font-bold text-white shadow-lg transition-all active:scale-95 ${
              claimType === 'RETURN' ? 'bg-orange-600 hover:bg-orange-700 hover:shadow-orange-200' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200'
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `${claimType === 'RETURN' ? '반품' : '교환'} 요청 등록`}
          </Button>
        </div>
      </div>
    </div>
  );
}
