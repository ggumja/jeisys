import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';

export function InquiryWritePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Show success message
    setShowSuccessMessage(true);

    // Navigate back after 2 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
      navigate('/communication/inquiry');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
          1:1 문의하기
        </h2>
        <p className="text-sm text-neutral-600">
          궁금하신 사항을 자세히 작성해 주세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 p-6 lg:p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-neutral-700 mb-2">
              제목 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="제목을 입력하세요"
              className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-700 mb-2">
              문의 내용 <span className="text-red-600">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="문의 내용을 상세히 입력해 주세요"
              className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
              rows={10}
              required
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/inquiry')}
            className="flex-1 px-6 py-4 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-4 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            문의 등록
          </button>
        </div>
      </form>

      {/* Info */}
      <div className="mt-6 p-6 bg-neutral-50 border border-neutral-200">
        <h3 className="text-sm font-medium text-neutral-900 mb-3">안내사항</h3>
        <ul className="text-sm text-neutral-600 space-y-2">
          <li>• 문의 답변은 영업일 기준 1~2일 내에 등록됩니다.</li>
          <li>• 긴급한 문의는 고객지원센터(070-7435-4927)로 연락 주시기 바랍니다.</li>
          <li>• 주문 관련 문의는 주문번호를 함께 남겨주시면 빠른 답변이 가능합니다.</li>
        </ul>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-sm shadow-xl max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl tracking-tight text-neutral-900 mb-2">
                문의 등록 완료
              </h3>
              <p className="text-sm text-neutral-600">
                문의가 성공적으로 등록되었습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}