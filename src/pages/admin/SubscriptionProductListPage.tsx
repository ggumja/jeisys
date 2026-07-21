import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Loader2, Pencil, RefreshCw, Package } from 'lucide-react';
import { productService } from '../../services/productService';
import { Product } from '../../types';

export function SubscriptionProductListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await productService.getProducts();
      setProducts(all.filter((p) => p.product_type === 'subscription' || p.is_subscription_product));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl tracking-tight text-neutral-900 mb-1">정기구독상품관리</h2>
          <p className="text-sm text-neutral-500">정기구독 전용 상품을 등록하고 옵션(회차 조합)을 설정합니다.</p>
        </div>
        <button
          onClick={() => navigate('/admin/products/subscription-register')}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          상품 등록
        </button>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
            <p className="text-sm text-neutral-500 mb-4">등록된 정기구독 상품이 없습니다.</p>
            <button
              onClick={() => navigate('/admin/products/subscription-register')}
              className="px-4 py-2 bg-neutral-900 text-white text-sm hover:bg-neutral-800"
            >
              첫 상품 등록하기
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">상품명</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">단가</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">옵션 수</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-[#21358D] flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{p.name}</p>
                          <p className="text-xs text-neutral-400">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-neutral-700">
                      {p.price.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-neutral-700">
                      {p.subscriptionOptions?.length ?? 0}개
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${
                        p.isActive !== false
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {p.isActive !== false ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/admin/products/subscription-edit/${p.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-neutral-200 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
