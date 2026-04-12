import { useState } from 'react';
import { X, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { ADMIN_STYLES } from '../../constants/adminStyles';
import { paymentService } from '../../services/paymentService';
import { supabase } from '../../lib/supabaseClient';

interface OrderCancelModalProps {
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    pgTid?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderCancelModal({ order, onClose, onSuccess }: OrderCancelModalProps) {
  const [cancelType, setCancelType] = useState<'full' | 'partial'>('full');
  const [cancelAmount, setCancelAmount] = useState<number>(order.totalAmount);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCancel = async () => {
    if (cancelType === 'partial' && (cancelAmount <= 0 || cancelAmount > order.totalAmount)) {
      setError('올바른 환불 금액을 입력해주세요.');
      return;
    }

    if (!reason.trim()) {
      setError('취소 사유를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. PG 취소 요청 (TID가 있는 경우)
      if (order.pgTid) {
        const refundResult: any = await paymentService.requestRefund({
          tid: order.pgTid,
          amount: cancelAmount,
          reason: reason
        });

        if (!refundResult.success) {
          throw new Error('PG 결제 취소에 실패했습니다.');
        }
      }

      // 2. DB 상태 업데이트
      const newStatus = cancelType === 'full' ? 'cancelled' : 'partially_refunded';
      const { error: dbError } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          cancelled_at: new Date().toISOString(),
          cancel_reason: reason,
          refunded_amount: cancelAmount
        })
        .eq('id', order.id);

      if (dbError) throw dbError;

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Cancel failed', err);
      setError(err.message || '취소 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neutral-900 mb-2">취소 처리가 완료되었습니다</h3>
          <p className="text-sm text-neutral-500">주문 상태가 업데이트되었습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
          <h3 className="font-bold text-neutral-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            주문 취소 및 환불 처리
          </h3>
          <button onClick={onClose} className={ADMIN_STYLES.BTN_GHOST}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <p className="text-sm text-neutral-500 mb-1">대상 주문</p>
            <p className="font-bold text-neutral-900">{order.orderNumber} (₩{order.totalAmount.toLocaleString()})</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setCancelType('full');
                setCancelAmount(order.totalAmount);
              }}
              className={`py-3 text-sm font-bold border-2 transition-all ${
                cancelType === 'full' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
              }`}
            >
              전액 취소
            </button>
            <button
              onClick={() => setCancelType('partial')}
              className={`py-3 text-sm font-bold border-2 transition-all ${
                cancelType === 'partial' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
              }`}
            >
              부분 환불
            </button>
          </div>

          {cancelType === 'partial' && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <label className={ADMIN_STYLES.SECTION_LABEL}>환불 금액 (₩)</label>
              <input
                type="number"
                value={cancelAmount}
                onChange={(e) => setCancelAmount(Number(e.target.value))}
                className={ADMIN_STYLES.INPUT}
                placeholder="환불할 금액을 입력하세요"
              />
              <p className={ADMIN_STYLES.HELPER_TEXT}>최대 ₩{order.totalAmount.toLocaleString()}까지 가능합니다.</p>
            </div>
          )}

          <div>
            <label className={ADMIN_STYLES.SECTION_LABEL}>취소 및 환불 사유</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={ADMIN_STYLES.TEXTAREA}
              placeholder="취소 사유를 고객에게 안내할 수 있도록 구체적으로 입력해주세요."
              rows={3}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        <div className="px-8 py-6 bg-neutral-50 border-t border-neutral-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-900 font-bold text-sm hover:bg-white transition-all">
            돌아가기
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '승인 요청 및 취소 실행'}
          </button>
        </div>
      </div>
    </div>
  );
}
