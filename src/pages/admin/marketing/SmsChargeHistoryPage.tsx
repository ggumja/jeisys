import { RefreshCw } from 'lucide-react';

export function SmsChargeHistoryPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-neutral-900">메시지 충전 내역</h2><p className="text-sm text-neutral-500 mt-0.5">SMS/LMS 메시지 충전 및 결제 이력입니다.</p></div>
        <button className="flex items-center gap-2 px-3 py-2 border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-50"><RefreshCw className="w-4 h-4" />새로고침</button>
      </div>
      <div className="bg-white border border-neutral-200">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700">충전일시</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-neutral-700">충전 건수</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700">결제 금액</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700">결제 수단</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={4} className="py-16 text-center text-neutral-400 text-sm">충전 내역이 없습니다.<br/><span className="text-xs">MTS 포털에서 충전 후 내역이 동기화됩니다.</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
