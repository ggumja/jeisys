import { useState } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
}

const mockFAQs: FAQ[] = [
  {
    id: '1',
    question: '주문 후 배송은 얼마나 걸리나요?',
    answer: '서울/경기 지역은 1-2일, 지방은 2-3일 소요됩니다. 도서산간 지역은 추가 일정이 필요할 수 있습니다.',
    category: '배송',
    order: 1,
    isPublished: true,
  },
  {
    id: '2',
    question: '교육은 어떻게 신청하나요?',
    answer: '커뮤니케이션 > 교육 캘린더 메뉴에서 원하시는 일정을 선택하여 신청하실 수 있습니다.',
    category: '교육',
    order: 2,
    isPublished: true,
  },
  {
    id: '3',
    question: '소모품 재고는 어떻게 확인하나요?',
    answer: '상품 상세페이지에서 실시간 재고 현황을 확인하실 수 있습니다.',
    category: '상품',
    order: 3,
    isPublished: false,
  },
];

export function FaqManagementPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl tracking-tight text-neutral-900">
          FAQ 관리
        </h3>
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors">
          <Plus className="w-5 h-5" />
          <span>FAQ 등록</span>
        </button>
      </div>

      <div className="bg-white border border-neutral-200">
        <div className="divide-y divide-neutral-200">
          {mockFAQs.map((faq) => (
            <div key={faq.id} className="p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium">
                      {faq.category}
                    </span>
                    <span className={`inline-flex px-3 py-1 text-xs font-medium ${
                      faq.isPublished
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {faq.isPublished ? '게시중' : '비공개'}
                    </span>
                    <span className="text-xs text-neutral-500">순서: {faq.order}</span>
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                    className="text-left w-full"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base font-medium text-neutral-900 flex-1">
                        Q. {faq.question}
                      </span>
                      {expandedId === faq.id ? (
                        <ChevronUp className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                  {expandedId === faq.id && (
                    <div className="mt-3 pl-4 border-l-2 border-neutral-200">
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        A. {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 border border-neutral-300 text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-neutral-50 border border-neutral-200 p-6">
        <h3 className="text-sm font-medium text-neutral-900 mb-3">
          FAQ 관리 안내
        </h3>
        <ul className="text-sm text-neutral-600 space-y-2">
          <li>• 순서 번호로 FAQ 표시 순서를 조정할 수 있습니다</li>
          <li>• 비공개 설정 시 사용자 화면에 표시되지 않습니다</li>
          <li>• 카테고리별로 FAQ를 분류하여 관리할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
}
