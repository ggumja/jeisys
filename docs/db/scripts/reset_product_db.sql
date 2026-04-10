-- ============================================================
-- 상품 데이터베이스 전체 리셋 스크립트
-- 주의: 이 스크립트를 실행하면 등록된 모든 상품, 카테고리, 
--       세션 옵션, 패키지 구성 데이터가 영구적으로 삭제됩니다.
-- ============================================================

-- 1. 트랜잭션 시작 (안전한 작업을 위해)
BEGIN;

-- 2. 하위 참조 테이블부터 순차적으로 삭제 (Foreign Key 제약 조건 고려)
TRUNCATE TABLE public.package_items CASCADE;
TRUNCATE TABLE public.product_bonus_items CASCADE;
TRUNCATE TABLE public.product_quantity_options CASCADE;

-- 3. 메인 상품 테이블 삭제
TRUNCATE TABLE public.products CASCADE;

-- 4. 카테고리 테이블 삭제
TRUNCATE TABLE public.categories CASCADE;

-- 5. 장바구니 내 상품 정보 삭제 (상품이 사라지므로 무의미해진 장바구니 아이템 정리)
TRUNCATE TABLE public.cart_items CASCADE;

-- 6. 트랜잭션 종료 및 반영
COMMIT;

SELECT 'Product database has been successfully reset!' AS result;
