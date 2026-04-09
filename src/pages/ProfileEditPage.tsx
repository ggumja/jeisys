import { useState } from "react";
import { useNavigate } from "react-router";
import { storage } from "../lib/storage";
import { User } from "../types";
import { Check } from "lucide-react";
import { authService } from "../services/authService";

declare global {
  interface Window {
    daum: any;
  }
}

export function ProfileEditPage() {
  const navigate = useNavigate();
  const currentUser = storage.getUser();

  const [formData, setFormData] = useState({
    businessNumber: currentUser?.businessNumber || "",
    hospitalName: currentUser?.hospitalName || "",
    representativeName: currentUser?.name || "",
    zipCode: currentUser?.zipCode || "",
    businessAddress: currentUser?.address || "",
    businessAddressDetail: currentUser?.addressDetail || "",
    managerName: currentUser?.name || "",
    phone: currentUser?.phone || "",
    email: currentUser?.email || "",
    emailNotification: true,
  });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        let fullAddress = data.roadAddress;
        let extraAddress = '';

        if (data.addressType === 'R') {
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraAddress += data.bname;
          }
          if (data.buildingName !== '') {
            extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
        }

        setFormData(prev => ({
          ...prev,
          zipCode: data.zonecode,
          businessAddress: fullAddress,
          businessAddressDetail: '',
        }));
      },
    }).open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Update user data in storage
      const updatedUser: User = {
        id: currentUser?.id || "",
        email: formData.email,
        name: formData.managerName,
        hospitalName: formData.hospitalName,
        businessNumber: formData.businessNumber,
        phone: formData.phone,
        zipCode: formData.zipCode,
        address: formData.businessAddress,
        addressDetail: formData.businessAddressDetail,
      };

      storage.setUser(updatedUser);

      // Update in database
      if (currentUser?.id) {
        await authService.updateProfile(currentUser.id, updatedUser);
      }

      // Show success message
      setShowSuccessMessage(true);

      // Hide message and navigate after 2 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
        navigate("/mypage/orders");
      }, 2000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("정보 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-white border border-neutral-200 p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
          정보 수정
        </h2>
        <p className="text-sm text-neutral-600">
          사업자 정보 및 담당자 정보를 수정할 수 있습니다
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 사업자 정보 */}
        <div>
          <h3 className="text-lg tracking-tight text-neutral-900 mb-6 pb-3 border-b border-neutral-200">
            사업자 정보
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                사업자등록번호 <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  name="businessNumber"
                  value={formData.businessNumber}
                  onChange={handleChange}
                  placeholder="000-00-00000"
                  className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:bg-neutral-100"
                  required
                  disabled
                />
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                사업자등록번호는 변경할 수 없습니다
              </p>
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                병원명 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleChange}
                placeholder="병원명을 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                대표자명 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="representativeName"
                value={formData.representativeName}
                onChange={handleChange}
                placeholder="대표자명을 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                사업장 주소 <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="우편번호"
                  className="w-32 px-4 py-3 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  className="bg-neutral-100 text-neutral-900 px-6 py-3 font-medium hover:bg-neutral-200 transition-colors"
                >
                  주소검색
                </button>
              </div>
              <input
                type="text"
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleChange}
                placeholder="기본 주소"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 mb-3"
                required
              />
              <input
                type="text"
                name="businessAddressDetail"
                value={formData.businessAddressDetail}
                onChange={handleChange}
                placeholder="상세 주소를 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* 담당자 정보 */}
        <div>
          <h3 className="text-lg tracking-tight text-neutral-900 mb-6 pb-3 border-b border-neutral-200">
            담당자 정보
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                담당자명 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="managerName"
                value={formData.managerName}
                onChange={handleChange}
                placeholder="담당자명을 입력하세요"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                휴대폰 번호 <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="010-0000-0000"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                이메일 <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>
          </div>
        </div>

        {/* 알림 설정 */}
        <div>
          <h3 className="text-lg tracking-tight text-neutral-900 mb-6 pb-3 border-b border-neutral-200">
            알림 설정
          </h3>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="emailNotification"
              checked={formData.emailNotification}
              onChange={handleChange}
              className="mt-1 w-5 h-5 border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <div>
              <p className="text-sm text-neutral-900 mb-1">
                이메일 알림 수신 동의
              </p>
              <p className="text-xs text-neutral-600">
                주문 상태, 프로모션, 신제품 소식 등을 이메일로 받아볼 수
                있습니다.
              </p>
            </div>
          </label>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={() => navigate("/mypage/orders")}
            className="flex-1 px-6 py-4 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-4 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            저장하기
          </button>
        </div>
      </form>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-sm shadow-xl max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl tracking-tight text-neutral-900 mb-2">
                저장 완료
              </h3>
              <p className="text-sm text-neutral-600">
                정보가 성공적으로 수정되었습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
