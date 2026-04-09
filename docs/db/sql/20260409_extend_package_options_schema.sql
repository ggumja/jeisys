-- [SQL] 세트 옵셔별 가격 및 독립 구성 기능을 위한 컬럼 추가
-- 1. 제품 수량 옵션(세트 옵션)에 개별 가격 컬럼 추가
ALTER TABLE public.product_quantity_options 
ADD COLUMN IF NOT EXISTS price bigint DEFAULT 0;

COMMENT ON COLUMN public.product_quantity_options.price IS '해당 세트 옵션의 확정 판매 금액';

-- 2. 패키지 구성 아이템에 소속 옵션 ID 컬럼 추가
ALTER TABLE public.package_items 
ADD COLUMN IF NOT EXISTS option_id uuid REFERENCES public.product_quantity_options(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.package_items.option_id IS '해당 구성 상품이 속한 특정 세트 옵션의 ID (NULL일 경우 패키지 전체 공통 구성)';

-- 패키지 아이템 조회 시 성능을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_package_items_option_id ON public.package_items(option_id);
