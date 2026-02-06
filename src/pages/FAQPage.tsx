import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { postService, Post } from '../services/postService';

const categories = [
  { id: 'all', label: '전체' },
  { id: 'member', label: '회원관련' },
  { id: 'product', label: '상품관련' },
  { id: 'payment', label: '결제관련' },
  { id: 'delivery', label: '배송관련' },
  { id: 'point', label: '적립금관련' },
  { id: 'etc', label: '기타' },
];

export function FAQPage() {
  const [faqs, setFaqs] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setIsLoading(true);
      const data = await postService.getPosts('faq');
      setFaqs(data.filter(f => f.isVisible));
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFAQs =
    selectedCategory === 'all'
      ? faqs
      : faqs.filter((faq) => faq.category === selectedCategory);

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
        {isLoading ? (
          <div className="py-16 text-center text-neutral-500">로딩 중...</div>
        ) : filteredFAQs.length === 0 ? (
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
                    {faq.title}
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
                        {faq.content}
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
            href="/communication/inquiry/write"
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