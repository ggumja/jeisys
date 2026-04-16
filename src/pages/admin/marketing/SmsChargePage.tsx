import { ExternalLink, Smartphone, Info } from 'lucide-react';

const CHARGE_PACKAGES = [
  { count: 1000,  price: 12000,  desc: '건당 12원' },
  { count: 3000,  price: 33000,  desc: '건당 11원' },
  { count: 5000,  price: 50000,  desc: '건당 10원' },
  { count: 10000, price: 90000,  desc: '건당 9원' },
  { count: 30000, price: 240000, desc: '건당 8원' },
];

const MTS_CHARGE_URL = 'https://mtsco.co.kr'; // 실제 MTS 충전 URL로 교체

export function SmsChargePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">메시지 충전</h2>
        <p className="text-sm text-neutral-500 mt-0.5">MTS 서비스를 통해 SMS/LMS 메시지를 충전합니다.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">충전 안내</p>
          <p>메시지 충전은 MTS 서비스 페이지에서 직접 진행합니다. 아래 버튼을 클릭하면 MTS 충전 페이지로 이동합니다.</p>
          <p className="mt-1">충전 후 잔량은 시스템에 자동으로 반영됩니다. (수분 소요)</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-neutral-500" />
          <h3 className="font-semibold text-neutral-800">SMS / LMS 충전 패키지 (참고)</h3>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {CHARGE_PACKAGES.map(pkg => (
            <div key={pkg.count} className="border border-neutral-200 p-4 text-center hover:border-neutral-900 transition-colors">
              <div className="text-lg font-bold text-neutral-900">{pkg.count.toLocaleString()}건</div>
              <div className="text-sm text-neutral-500 mt-1">{pkg.price.toLocaleString()}원</div>
              <div className="text-xs text-neutral-400 mt-0.5">{pkg.desc}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-400 mt-3">※ 실제 가격은 MTS 서비스 정책에 따라 다를 수 있습니다.</p>
      </div>

      <div className="flex justify-center">
        <a
          href={MTS_CHARGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3 bg-neutral-900 text-white font-medium hover:bg-neutral-700 transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
          MTS 충전 페이지로 이동
        </a>
      </div>

      <div className="bg-white border border-neutral-200 p-4">
        <p className="text-sm font-medium text-neutral-700 mb-2">충전 내역 확인</p>
        <p className="text-sm text-neutral-500">충전 내역은 <a href="/admin/marketing/sms/charge-history" className="text-blue-600 underline">메시지 충전 내역</a> 메뉴에서 확인할 수 있습니다.</p>
      </div>
    </div>
  );
}
