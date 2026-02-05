import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Check, ChevronRight, ChevronDown } from 'lucide-react';
import { productImages } from '../lib/productImages';
import { BASE_PATH } from '../constants/paths';

interface EquipmentSelection {
  name: string;
  selected: boolean;
  serialNumber: string;
  imageUrl?: string;
}

declare global {
  interface Window {
    daum: any;
  }
}

import { authService } from '../services/authService';

export function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1: Terms Agreement
  const [termsAgreed, setTermsAgreed] = useState({
    all: false,
    service: false,
    privacy: false,
    retention: false,
    collection: false,
    processing: false,
  });
  const [expandedTerms, setExpandedTerms] = useState<string | null>(null);

  // Step 2: Business Info
  const [formData, setFormData] = useState({
    userId: '',
    hospitalName: '',
    region: '주식회사 라이오닉월드시스트먼트 (수도권 대리점)',
    password: '',
    passwordConfirm: '',
    hospitalEmail: '',
    taxEmail: '',
    phone: '',
    mobile: '',
    zipCode: '',
    address: '',
    addressDetail: '',
    businessNumber: '',
    businessCertificate: null as File | null,
    businessRegistration: null as File | null,
    emailNotification: false,
    holidayWeek: '매주',
    holidayDay: '월요일',
    isPublicHoliday: false,
  });

  // Phone verification (본인인증)
  const [phoneVerification, setPhoneVerification] = useState({
    phone: '',
    verificationCode: '',
    verified: false,
  });

  // Step 3: Equipment Info
  const [equipmentList, setEquipmentList] = useState<EquipmentSelection[]>([
    { name: 'Density', selected: false, serialNumber: '' }, // 이미지 없음
    { name: 'DLiv', selected: false, serialNumber: '', imageUrl: productImages.dliv },
    { name: 'POTENZA', selected: false, serialNumber: '', imageUrl: productImages.potenza },
    { name: 'INTRAcel', selected: false, serialNumber: '', imageUrl: productImages.intracel },
    { name: 'LinearZ', selected: false, serialNumber: '', imageUrl: productImages.linearz },
    { name: 'LinearFirm', selected: false, serialNumber: '', imageUrl: productImages.linearfirm },
    { name: 'ULTRAcel', selected: false, serialNumber: '', imageUrl: productImages.ultracelQPlus },
    { name: 'ULTRAcel II', selected: false, serialNumber: '', imageUrl: productImages.ultracelII },
    { name: 'LIPOcel', selected: false, serialNumber: '', imageUrl: productImages.lipocell },
    { name: 'LIPOcel II', selected: false, serialNumber: '' }, // 이미지 없음
    { name: 'AcGen', selected: false, serialNumber: '' }, // 이미지 없음
    { name: 'IntraGen', selected: false, serialNumber: '', imageUrl: productImages.intragen },
  ]);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    } else {
      // Complete signup
      try {
        await authService.signUp(formData.userId, formData.password, {
          name: formData.userId,
          hospitalName: formData.hospitalName,
          businessNumber: formData.businessNumber,
          phone: formData.phone
        });
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        navigate('/login');
      } catch (error: any) {
        console.error('Signup failed:', error);
        alert('회원가입 실패: ' + (error.message || '알 수 없는 오류'));
      }
    }
  };

  const handleFileChange = (field: 'businessCertificate' | 'businessRegistration') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, [field]: e.target.files[0] });
    }
  };

  const toggleAllTerms = () => {
    const newValue = !termsAgreed.all;
    setTermsAgreed({
      all: newValue,
      service: newValue,
      privacy: newValue,
      retention: newValue,
      collection: newValue,
      processing: newValue,
    });
  };

  const toggleTerm = (term: keyof typeof termsAgreed) => {
    const newTerms = { ...termsAgreed, [term]: !termsAgreed[term] };
    newTerms.all = newTerms.service && newTerms.privacy && newTerms.retention && newTerms.collection && newTerms.processing;
    setTermsAgreed(newTerms);
  };

  const toggleEquipment = (index: number) => {
    const newList = [...equipmentList];
    newList[index].selected = !newList[index].selected;
    if (!newList[index].selected) {
      newList[index].serialNumber = '';
    }
    setEquipmentList(newList);
  };

  const updateSerialNumber = (index: number, value: string) => {
    const newList = [...equipmentList];
    newList[index].serialNumber = value;
    setEquipmentList(newList);
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

        setFormData({
          ...formData,
          zipCode: data.zonecode,
          address: fullAddress,
          addressDetail: '',
        });
      },
    }).open();
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-neutral-200 p-12">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-start justify-center">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 flex items-center justify-center ${s <= step
                        ? 'bg-[#1e3a8a] text-white'
                        : 'bg-neutral-100 text-neutral-400'
                        }`}
                    >
                      {s < step ? <Check className="w-5 h-5" /> : s}
                    </div>
                    <span className={`mt-4 text-sm whitespace-nowrap ${step >= s ? 'text-neutral-900 font-medium' : 'text-neutral-400'}`}>
                      {s === 1 ? '약관동의' : s === 2 ? '사업자 정보' : '보유 장비 정보'}
                    </span>
                  </div>
                  {s < 3 && (
                    <ChevronRight className={`w-5 h-5 mx-4 ${s < step ? 'text-neutral-900' : 'text-neutral-300'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleNext}>
            {/* Step 1: Terms Agreement */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl tracking-tight text-neutral-900 mb-6">약관동의</h2>

                {/* 전체동의 */}
                <div className="border border-neutral-300 p-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAgreed.all}
                      onChange={toggleAllTerms}
                      className="w-5 h-5 mr-3"
                    />
                    <span className="font-medium text-neutral-900">전체동의</span>
                  </label>
                </div>

                {/* 회원이용약관동의 */}
                <div className="border border-neutral-300">
                  <div className="flex items-center justify-between p-4 bg-neutral-50">
                    <button
                      type="button"
                      onClick={() => setExpandedTerms(expandedTerms === 'service' ? null : 'service')}
                      className="flex items-center flex-1 text-left"
                    >
                      <ChevronDown className={`w-5 h-5 mr-2 transition-transform ${expandedTerms === 'service' ? 'rotate-180' : ''}`} />
                      <span className="font-medium text-neutral-900">회원이용약관동의</span>
                    </button>
                    <label className="flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={termsAgreed.service}
                        onChange={() => toggleTerm('service')}
                        className="w-5 h-5 mr-2"
                      />
                      <span className="text-sm text-red-600">동의합니다. *</span>
                    </label>
                  </div>
                  {expandedTerms === 'service' && (
                    <div className="p-4 bg-white border-t border-neutral-200 max-h-40 overflow-y-auto text-sm text-neutral-700 leading-relaxed">
                      <p className="mb-2 font-medium">[소핑몰 이용약관]</p>
                      <p className="mb-4">제1조(목적)</p>
                      <p className="mb-2">이 약관은 ㈜제이시스메디칼 (전자상거래 사업자)가 운영하는 주식회사 제이시스메디칼 쇼핑몰 (이하 "몰"이라 한다)에서 제공하는 인터넷 관련 서비스(이하 "서비스"라 한다)를 이용함에 있어 사이버 몰과 이용자의 권리/의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                      <p className="text-xs text-neutral-500 mt-4">※ 『PC통신, 무선 등을 이용하는 전자상거래에 대해서도 그 성질에 반하지 않는 한 이 약관을 준용합니다.』</p>
                      <p className="mt-4">제2조(정의)</p>
                      <p>[이하 약관 내용...]</p>
                    </div>
                  )}
                </div>

                {/* 개인정보 수집동의 */}
                <div className="border border-neutral-300">
                  <div className="flex items-center justify-between p-4">
                    <button
                      type="button"
                      onClick={() => setExpandedTerms(expandedTerms === 'privacy' ? null : 'privacy')}
                      className="flex items-center flex-1 text-left"
                    >
                      <ChevronRight className={`w-5 h-5 mr-2 transition-transform ${expandedTerms === 'privacy' ? 'rotate-90' : ''}`} />
                      <span className="font-medium text-neutral-900">개인정보 수집동의</span>
                    </button>
                    <label className="flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={termsAgreed.privacy}
                        onChange={() => toggleTerm('privacy')}
                        className="w-5 h-5 mr-2"
                      />
                      <span className="text-sm text-red-600">동의합니다. *</span>
                    </label>
                  </div>
                </div>

                {/* 개인정보 보유 및 이용기간 */}
                <div className="border border-neutral-300">
                  <div className="flex items-center justify-between p-4">
                    <button
                      type="button"
                      onClick={() => setExpandedTerms(expandedTerms === 'retention' ? null : 'retention')}
                      className="flex items-center flex-1 text-left"
                    >
                      <ChevronRight className={`w-5 h-5 mr-2 transition-transform ${expandedTerms === 'retention' ? 'rotate-90' : ''}`} />
                      <span className="font-medium text-neutral-900">개인정보 보유 및 이용기간</span>
                    </button>
                    <label className="flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={termsAgreed.retention}
                        onChange={() => toggleTerm('retention')}
                        className="w-5 h-5 mr-2"
                      />
                      <span className="text-sm text-red-600">동의합니다. *</span>
                    </label>
                  </div>
                </div>

                {/* 개인정보 수집항목 */}
                <div className="border border-neutral-300">
                  <div className="flex items-center justify-between p-4">
                    <button
                      type="button"
                      onClick={() => setExpandedTerms(expandedTerms === 'collection' ? null : 'collection')}
                      className="flex items-center flex-1 text-left"
                    >
                      <ChevronRight className={`w-5 h-5 mr-2 transition-transform ${expandedTerms === 'collection' ? 'rotate-90' : ''}`} />
                      <span className="font-medium text-neutral-900">개인정보 수집항목</span>
                    </button>
                    <label className="flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={termsAgreed.collection}
                        onChange={() => toggleTerm('collection')}
                        className="w-5 h-5 mr-2"
                      />
                      <span className="text-sm text-red-600">동의합니다. *</span>
                    </label>
                  </div>
                </div>

                {/* 개인정보처리담당 */}
                <div className="border border-neutral-300">
                  <div className="flex items-center justify-between p-4">
                    <button
                      type="button"
                      onClick={() => setExpandedTerms(expandedTerms === 'processing' ? null : 'processing')}
                      className="flex items-center flex-1 text-left"
                    >
                      <ChevronRight className={`w-5 h-5 mr-2 transition-transform ${expandedTerms === 'processing' ? 'rotate-90' : ''}`} />
                      <span className="font-medium text-neutral-900">개인정보처리담당</span>
                    </button>
                    <label className="flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={termsAgreed.processing}
                        onChange={() => toggleTerm('processing')}
                        className="w-5 h-5 mr-2"
                      />
                      <span className="text-sm text-red-600">동의합니다. *</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!termsAgreed.service || !termsAgreed.privacy || !termsAgreed.retention || !termsAgreed.collection || !termsAgreed.processing}
                  className="w-full bg-[#1e3a8a] text-white py-4 font-medium hover:bg-[#1e40af] transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed mt-8"
                >
                  약관동의
                </button>
              </div>
            )}

            {/* Step 2: Business Info */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl tracking-tight text-neutral-900 mb-6">사업자 정보 입력</h2>

                {/* 아이디 */}
                <div>
                  <label className="block text-sm text-neutral-900 mb-2">
                    아이디 <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      className="flex-1 px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                      placeholder="아이디를 입력하세요."
                    />
                    <button
                      type="button"
                      className="bg-[#1e3a8a] text-white px-6 py-3 font-medium hover:bg-[#1e40af] transition-colors whitespace-nowrap"
                    >
                      중복확인
                    </button>
                  </div>
                </div>

                {/* 병원/대리점명 & 구매지 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-900 mb-2">
                      병원/대리점명 <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.hospitalName}
                      onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                      placeholder="사업자등록증과 동일한 상호명으로 기입해주시기바랍니다."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-900 mb-2">
                      구매지 <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                    >
                      <option>주식회사 라이오닉월드시스트먼트 (수도권 대리점)</option>
                      <option>기타 지역</option>
                    </select>
                  </div>
                </div>

                {/* 비밀번호 & 비밀번호 확인 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-900 mb-2">
                      비밀번호 <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                      placeholder="비밀번호를 입력하세요."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-900 mb-2">
                      비밀번호 확인 <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.passwordConfirm}
                      onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                      placeholder="비밀번호 확인을 입력하세요."
                    />
                  </div>
                </div>

                {/* 병원 담당자 이메일 & 세금계산서 발행 이메일 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-900 mb-2">
                      병원 담당자 이메일 <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.hospitalEmail}
                      onChange={(e) => setFormData({ ...formData, hospitalEmail: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                      placeholder="주문 및 배송 알림 등 수신할 이메일을 입력하세요."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-900 mb-2">
                      세금계산서 발행 이메일 <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.taxEmail}
                      onChange={(e) => setFormData({ ...formData, taxEmail: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                      placeholder="세금계산서 수신 이메일을 입력하세요."
                    />
                  </div>
                </div>

                {/* 전화번호 & 휴대폰번호 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-900 mb-2">
                      전화번호 <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                      placeholder="전화번호를 입력하세요."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-900 mb-2">
                      휴대폰번호 <span className="text-red-600">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select className="px-4 py-3 border border-neutral-300">
                        <option>010</option>
                        <option>011</option>
                        <option>016</option>
                      </select>
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="flex-1 px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* 주소 */}
                <div>
                  <label className="block text-sm text-neutral-900 mb-2">
                    주소 <span className="text-red-600">*</span>
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        className="w-32 px-4 py-3 border border-neutral-300"
                        placeholder="우편번호"
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
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                      placeholder="기본주소"
                    />
                    <input
                      type="text"
                      value={formData.addressDetail}
                      onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                      placeholder="상세주소"
                    />
                  </div>
                </div>

                {/* 사업자번호 & 사업자등록증 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-900 mb-2">
                      사업자번호 <span className="text-red-600">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.businessNumber}
                        onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                        className="flex-1 px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                        placeholder="사업자번호를 입력하세요."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-900 mb-2">
                      사업자등록증 <span className="text-red-600">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 px-4 py-3 border border-neutral-300 bg-neutral-50">
                        <span className="text-neutral-500 text-sm">
                          {formData.businessCertificate ? formData.businessCertificate.name : '파일을 선택하세요'}
                        </span>
                      </div>
                      <label className="bg-[#1e3a8a] text-white px-6 py-3 font-medium hover:bg-[#1e40af] transition-colors cursor-pointer whitespace-nowrap">
                        파일 선택
                        <input
                          type="file"
                          onChange={handleFileChange('businessCertificate')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 휴무일 설정 */}
                <div>
                  <label className="block text-sm text-neutral-900 mb-2">
                    휴무일
                  </label>
                  <div className="flex gap-3 items-center">
                    <select
                      value={formData.holidayWeek}
                      onChange={(e) => setFormData({ ...formData, holidayWeek: e.target.value })}
                      className="px-4 py-3 border border-neutral-300 focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                    >
                      <option>매주</option>
                      <option>첫째 주</option>
                      <option>둘째 주</option>
                      <option>셋째 주</option>
                      <option>넷째 주</option>
                    </select>

                    {['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'].map((day) => (
                      <label key={day} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="holidayDay"
                          value={day}
                          checked={formData.holidayDay === day}
                          onChange={(e) => setFormData({ ...formData, holidayDay: e.target.value })}
                          className="w-4 h-4 mr-1"
                        />
                        <span className="text-sm text-neutral-900 whitespace-nowrap">{day}</span>
                      </label>
                    ))}

                    <label className="flex items-center cursor-pointer ml-2">
                      <input
                        type="checkbox"
                        checked={formData.isPublicHoliday}
                        onChange={(e) => setFormData({ ...formData, isPublicHoliday: e.target.checked })}
                        className="w-5 h-5 mr-2"
                      />
                      <span className="text-sm text-neutral-900 whitespace-nowrap">공휴일</span>
                    </label>
                  </div>
                </div>

                {/* 본인인증 섹션 */}
                <div className="border-t border-neutral-300 pt-6 mt-8">
                  <h3 className="text-lg tracking-tight text-neutral-900 mb-4">본인인증</h3>
                  <div className="bg-neutral-50 border border-neutral-200 p-6 space-y-4">
                    <div>
                      <label className="block text-sm text-neutral-900 mb-2">
                        휴대폰 번호
                      </label>
                      <input
                        type="tel"
                        value={phoneVerification.phone}
                        onChange={(e) => setPhoneVerification({ ...phoneVerification, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-300 bg-white"
                        placeholder="010-1234-5678"
                      />
                    </div>
                    <button
                      type="button"
                      className="w-full bg-neutral-100 text-neutral-900 py-3 font-medium hover:bg-neutral-200 transition-colors"
                    >
                      인증번호 발송
                    </button>
                    <div>
                      <label className="block text-sm text-neutral-900 mb-2">
                        인증번호
                      </label>
                      <input
                        type="text"
                        value={phoneVerification.verificationCode}
                        onChange={(e) => setPhoneVerification({ ...phoneVerification, verificationCode: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-300 bg-white"
                        placeholder="6자리 숫자"
                      />
                    </div>
                  </div>
                </div>

                {/* 이메일 알림 수신 동의 */}
                <div className="border-t border-neutral-300 pt-6 mt-8">
                  <h3 className="text-lg tracking-tight text-neutral-900 mb-4">이메일 알림 수신 동의</h3>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotification}
                      onChange={(e) => setFormData({ ...formData, emailNotification: e.target.checked })}
                      className="w-5 h-5 mr-3"
                    />
                    <span className="text-sm text-neutral-900">제품 및 이벤트 정보 이메일 수신에 동의합니다.</span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Equipment Info */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl tracking-tight text-neutral-900 mb-2">보유 장비 정보 입력</h2>
                  <p className="text-sm text-neutral-600">보유하고 계신 장비를 선택해주세요</p>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {equipmentList.map((equipment, index) => (
                    <div key={equipment.name} className="relative">
                      <div
                        className={`border-2 p-4 cursor-pointer transition-all ${equipment.selected ? 'border-[#1e3a8a] bg-blue-50' : 'border-neutral-200 hover:border-neutral-400'
                          }`}
                        onClick={() => toggleEquipment(index)}
                      >
                        <div className="aspect-square bg-white flex items-center justify-center mb-2 relative">
                          <div className="absolute top-2 right-2">
                            <input
                              type="checkbox"
                              checked={equipment.selected}
                              onChange={() => toggleEquipment(index)}
                              className="w-5 h-5"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                            {equipment.imageUrl ? (
                              <img src={equipment.imageUrl} alt={equipment.name} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-xs text-neutral-400">장비 이미지</span>
                            )}
                          </div>
                        </div>
                        <p className="text-center text-sm font-medium text-neutral-900">{equipment.name}</p>
                      </div>
                      {equipment.selected && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={equipment.serialNumber}
                            onChange={(e) => updateSerialNumber(index, e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 text-sm"
                            placeholder="시리얼번호"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-sm text-neutral-500 italic">
                  * 보유 장비 정보는 선택사항입니다. 나중에 마이페이지에서 등록하실 수 있습니다.
                </p>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 bg-neutral-100 text-neutral-900 py-3 font-medium hover:bg-neutral-200 transition-colors"
                >
                  이전
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-[#1e3a8a] text-white py-3 font-medium hover:bg-[#1e40af] transition-colors"
              >
                {step === 3 ? '가입 완료' : '다음'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-neutral-600 hover:text-neutral-900">
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}