-- products 테이블에 수량 입력 방식 컬럼 추가
-- 2026-04-10

ALTER TABLE products 
ADD COLUMN quantity_input_type TEXT DEFAULT 'button' NOT NULL;

-- 제약 조건 추가: 'button' 또는 'list'만 허용
ALTER TABLE products 
ADD CONSTRAINT check_quantity_input_type 
CHECK (quantity_input_type IN ('button', 'list'));
