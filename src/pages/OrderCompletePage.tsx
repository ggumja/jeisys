import { Link, useParams } from 'react-router';
import { CheckCircle, FileText, Package, Share2 } from 'lucide-react';

export function OrderCompletePage() {
  const { orderId } = useParams();
  const orderNumber = `ORD-2025-0124-${orderId}`;
  const expectedDelivery = '2025-01-27 (월)';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          주문이 완료되었습니다
        </h1>
        <p className="text-gray-600">
          주문해주셔서 감사합니다. 빠르게 준비하여 배송해드리겠습니다.
        </p>
      </div>

      {/* Order Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">주문번호</label>
            <p className="text-xl font-bold text-gray-900">{orderNumber}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">예상 배송일</label>
            <p className="text-xl font-bold text-blue-600">{expectedDelivery}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <FileText className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-medium text-gray-900 mb-1">거래명세서</h3>
          <p className="text-sm text-gray-600">다운로드</p>
        </button>

        <button className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <Package className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-medium text-gray-900 mb-1">배송 조회</h3>
          <p className="text-sm text-gray-600">실시간 트래킹</p>
        </button>

        <button className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <Share2 className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-medium text-gray-900 mb-1">공유하기</h3>
          <p className="text-sm text-gray-600">이메일/SMS</p>
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
        <h3 className="font-bold text-blue-900 mb-3">안내사항</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• 주문 확인 후 영업일 기준 2-3일 내 배송됩니다.</li>
          <li>• 배송 시작 시 SMS/이메일로 알림을 보내드립니다.</li>
          <li>• 거래명세서는 마이페이지에서 확인 가능합니다.</li>
          <li>• 증빙 서류가 필요한 경우 고객센터로 문의해주세요.</li>
        </ul>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/mypage/orders"
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-xl font-medium text-center transition-colors"
        >
          주문 내역 보기
        </Link>
        <Link
          to="/"
          className="flex-1 bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-50 py-4 rounded-xl font-medium text-center transition-colors"
        >
          홈으로 가기
        </Link>
      </div>

      {/* Customer Service */}
      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-2">문의사항이 있으신가요?</p>
        <p className="text-2xl font-bold text-gray-900">1588-1234</p>
        <p className="text-sm text-gray-500 mt-1">평일 09:00 - 18:00</p>
      </div>
    </div>
  );
}
