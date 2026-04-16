import { Mail } from 'lucide-react';

export function EmailSystemHistoryPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">이메일 시스템 전송 내역</h2>
        <p className="text-sm text-neutral-500 mt-0.5">시스템에서 자동 발송된 이메일 내역입니다.</p>
      </div>
      <div className="bg-white border border-neutral-200 flex flex-col items-center justify-center py-24 gap-4">
        <Mail className="w-12 h-12 text-neutral-200" />
        <div className="text-center">
          <p className="font-semibold text-neutral-600">이메일 마케팅 기능 준비 중</p>
          <p className="text-sm text-neutral-400 mt-1">곧 서비스될 예정입니다.</p>
        </div>
      </div>
    </div>
  );
}
