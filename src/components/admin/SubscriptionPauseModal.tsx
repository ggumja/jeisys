import { useState } from 'react';
import { X, PauseCircle, Loader2, Info } from 'lucide-react';
import { subscriptionService, type SubscriptionRow } from '../../services/subscriptionService';
import { toast } from 'sonner';

interface SubscriptionPauseModalProps {
  sub: SubscriptionRow;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubscriptionPauseModal({
  sub,
  onClose,
  onSuccess,
}: SubscriptionPauseModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExecutePause = async () => {
    try {
      setLoading(true);
      await subscriptionService.pauseSubscription(sub.id);
      toast.success('정기공급 일시정지가 완료되었습니다.');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Subscription pause error:', err);
      toast.error(err.message || '일시정지 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-neutral-300 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-orange-50/50">
          <div className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-bold text-neutral-900">정기공급 일시정지</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Info Card */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-900 flex items-start gap-2.5 shadow-sm">
            <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">⏸️ 정기공급 보류 안내</p>
              <p className="text-[11px] text-orange-800 leading-relaxed">
                일시정지 시 다음 회차 자동 결제 및 배송 스케줄이 일시 중단됩니다.
                관리자 및 고객은 언제든지 <span className="font-bold text-orange-900">[재개]</span> 버튼을 통해 다시 서비스를 정상 진행시킬 수 있습니다.
              </p>
            </div>
          </div>

          {/* Subscription Info Brief */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>구독 상품</span>
              <span className="font-bold text-neutral-900 truncate max-w-[200px]">
                {sub.product?.name || '정기공급 상품'}
              </span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>현재 회차</span>
              <span className="font-semibold text-neutral-800">{sub.currentRound}회차 / 총 {sub.totalRounds}회</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>다음 예정일</span>
              <span className="font-semibold text-neutral-800">
                {sub.nextBillingDate ? sub.nextBillingDate.split('T')[0] : '-'}
              </span>
            </div>
          </div>

          {/* Pause Reason Field */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              일시정지 사유 (선택)
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="예: 당분간 제품 재고 여유로 인한 일시중단"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-100 placeholder:text-neutral-400"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleExecutePause}
              disabled={loading}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-neutral-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>일시정지 실행</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
