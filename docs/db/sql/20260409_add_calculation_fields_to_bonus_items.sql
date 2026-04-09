-- 20260409_add_calculation_fields_to_bonus_items.sql
-- product_bonus_items 테이블에 계산 방식 및 비율 필드 추가

ALTER TABLE product_bonus_items 
ADD COLUMN calculation_method TEXT DEFAULT 'fixed' CHECK (calculation_method IN ('fixed', 'ratio')),
ADD COLUMN percentage NUMERIC DEFAULT 0;

-- 컬럼 주석 추가
COMMENT ON COLUMN product_bonus_items.calculation_method IS 'fixed: 직접입력, ratio: 비율로 자동계산';
COMMENT ON COLUMN product_bonus_items.percentage IS '구매수량 대비 증정 비율 (%)';
