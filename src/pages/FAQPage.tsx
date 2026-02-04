import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const categories = [
  { id: 'all', label: '전체' },
  { id: 'member', label: '회원관련' },
  { id: 'product', label: '상품관련' },
  { id: 'payment', label: '결제관련' },
  { id: 'delivery', label: '배송관련' },
  { id: 'point', label: '적립금관련' },
  { id: 'etc', label: '기타' },
];

const faqData: FAQ[] = [
  {
    id: '1',
    category: 'member',
    question: '반품 혹은 교환을 하려고 하는데 어떻게 해야하나요?',
    answer: '마이페이지 > 주문/배송 관리에서 해당 주문 건을 선택하여 반품 또는 교환 신청을 하실 수 있습니다. 제품 수령 후 7일 이내에 신청 가능하며, 제품이 미개봉 상태이고 포장이 훼손되지 않은 경우에만 가능합니다. 자세한 사항은 고객센터(070-7435-4927)로 문의 주시기 바랍니다.',
  },
  {
    id: '2',
    category: 'product',
    question: '주문 상품을 언제 수령 받나요?',
    answer: '오후 2시 30분 이전 주문 건은 당일 출고되며, 일반적으로 1-2일 이내에 수령하실 수 있습니다. 제주도 및 도서산간 지역은 2-3일이 소요될 수 있습니다. 배송 현황은 마이페이지에서 실시간으로 확인하실 수 있습니다.',
  },
  {
    id: '3',
    category: 'payment',
    question: '병원이 보유장비가 변경경우 어떻게 해야하나요?',
    answer: '마이페이지 > 보유 장비 메뉴에서 장비 정보를 직접 수정하실 수 있습니다. 장비 추가, 삭제, 정보 변경이 모두 가능하며, 변경 즉시 해당 장비의 소모품 추천이 업데이트됩니다.',
  },
  {
    id: '4',
    category: 'delivery',
    question: '회원 가입 신청 후 언제 승인이 되나요?',
    answer: '회원가입 신청 후 영업일 기준 1-2일 이내에 사업자등록증 확인 후 승인됩니다. 승인 완료 시 가입하신 이메일로 안내 메일이 발송되며, 승인 후 즉시 쇼핑몰 이용이 가능합니다. 빠른 승인이 필요하신 경우 고객센터로 연락 주시기 바랍니다.',
  },
  {
    id: '5',
    category: 'member',
    question: '반품 후 환불은 언제 되나요?',
    answer: '반품 상품이 당사에 도착하여 검수가 완료된 후 3-5 영업일 이내에 환불 처리됩니다. 신용카드 결제의 경우 카드사 정산 일정에 따라 영업일 기준 3-5일이 소요되며, 계좌이체의 경우 확인 후 당일 또는 익일 환불됩니다.',
  },
  {
    id: '6',
    category: 'product',
    question: '제품 교환은 가능한가요?',
    answer: '네, 제품 수령 후 7일 이내에 교환 신청이 가능합니다. 단, 제품이 미개봉 상태이고 포장이 훼손되지 않은 경우에만 가능하며, 의료기기 특성상 개봉 후에는 교환이 어려운 점 양해 부탁드립니다. 교환 배송비는 왕복 부담이 원칙입니다.',
  },
  {
    id: '7',
    category: 'payment',
    question: '세금계산서 발행이 가능한가요?',
    answer: '네, 사업자 회원의 경우 세금계산서 발행이 가능합니다. 주문 시 결제 단계에서 세금계산서 발행을 선택하시면 되며, 매월 1일에 전월 주문 건에 대한 세금계산서가 일괄 발행됩니다. 발행된 세금계산서는 마이페이지에서 확인하실 수 있습니다.',
  },
  {
    id: '8',
    category: 'delivery',
    question: '배송지 변경이 가능한가요?',
    answer: '출고 전까지는 마이페이지에서 배송지 변경이 가능합니다. 이미 출고된 경우에는 택배사로 직접 연락하셔서 배송지 변경을 요청하시거나, 고객센터로 문의 주시면 도움드리겠습니다.',
  },
];

export function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFAQs =
    selectedCategory === 'all'
      ? faqData
      : faqData.filter((faq) => faq.category === selectedCategory);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">
          FAQ
        </h2>
        <p className="text-sm text-neutral-600">
          자주 묻는 질문을 확인해 보세요
        </p>
      </div>

      {/* Category Tabs */}
      <div className="mb-8">
        <div className="bg-white border border-neutral-200">
          <div className="flex overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  selectedCategory === category.id
                    ? 'border-neutral-900 text-neutral-900 bg-neutral-50'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <div className="bg-white border border-neutral-200">
        {filteredFAQs.length === 0 ? (
          <div className="py-16 text-center text-neutral-600">
            해당 카테고리에 등록된 FAQ가 없습니다
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {filteredFAQs.map((faq) => (
              <div key={faq.id}>
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full px-6 py-5 flex items-start gap-4 text-left hover:bg-neutral-50 transition-colors"
                >
                  <span className="flex-shrink-0 text-sm font-medium text-neutral-900 mt-0.5">
                    Q
                  </span>
                  <span className="flex-1 text-base text-neutral-900">
                    {faq.question}
                  </span>
                  {expandedId === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
                  )}
                </button>

                {expandedId === faq.id && (
                  <div className="px-6 py-5 bg-blue-50 border-t border-blue-100">
                    <div className="flex items-start gap-4">
                      <span className="flex-shrink-0 text-sm font-medium text-blue-900">
                        A
                      </span>
                      <p className="flex-1 text-base text-neutral-900 leading-relaxed whitespace-pre-wrap">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="mt-6 p-6 bg-neutral-50 border border-neutral-200">
        <h3 className="text-sm font-medium text-neutral-900 mb-3">
          추가 문의가 필요하신가요?
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          FAQ에서 원하는 답변을 찾지 못하셨다면 1:1 문의 또는 고객센터로 연락
          주세요.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/inquiry"
            className="px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors text-sm"
          >
            1:1 문의하기
          </a>
          <a
            href="tel:070-7435-4927"
            className="px-6 py-3 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors text-sm"
          >
            고객센터: 070-7435-4927
          </a>
        </div>
      </div>
    </div>
  );
}