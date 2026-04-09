-- package_items 테이블의 기존 제약 조건을 제거하고 옵션ID를 포함한 새로운 제약 조건을 추가합니다.

-- 1. 기존 제약 조건 이름 확인 후 제거 (보통 'package_id', 'product_id' 조합)
ALTER TABLE package_items DROP CONSTRAINT IF EXISTS package_items_package_id_product_id_key;

-- 2. 새 제약 조건 추가: 패키지 ID, 상품 ID, 옵션 ID의 조합이 고유하도록 설정
-- option_id가 null인 경우(보통 보너스나 레거시)를 고려하여 unique index로 처리
ALTER TABLE package_items ADD CONSTRAINT package_items_pk_with_option UNIQUE (package_id, product_id, option_id);

