-- ============================================================
-- product_bonus_items 제약 조건 수정 (409 에러 해결)
-- ============================================================

-- 1. 기존의 유니크 제약 조건 삭제
-- 제약 조건 이름을 정확히 알 수 없는 경우를 대비해 아래와 같이 처리합니다.
-- 보통 (parent_product_id, bonus_product_id) 에 걸려있을 가능성이 큽니다.

DO $$
BEGIN
    -- 기존 제약 조건이 있으면 삭제 (이름은 일반적인 패턴으로 추정)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_bonus_items_parent_product_id_bonus_product_id_key') THEN
        ALTER TABLE public.product_bonus_items DROP CONSTRAINT product_bonus_items_parent_product_id_bonus_product_id_key;
    END IF;
    
    -- 혹시 다른 이름으로 걸려있을 경우를 위해 수동으로 확인이 필요할 수 있습니다.
END $$;

-- 2. 새로운 유니크 제약 조건 추가 (option_id 포함)
-- option_id가 null인 경우와 값인 경우를 모두 구분하기 위해
-- PostgreSQL의 UNIQUE (parent_product_id, bonus_product_id, option_id) 는 
-- option_id가 null이면 null을 서로 다른 값으로 보아 여러 개 들어갈 수도 있습니다.
-- 만약 "옵션이 없는 일반 증정"은 1개만, "특정 옵션 증정"도 1개만 허용하려면 아래 제약 조건을 사용합니다.

ALTER TABLE public.product_bonus_items 
ADD CONSTRAINT product_bonus_items_parent_bonus_option_unique 
UNIQUE (parent_product_id, bonus_product_id, option_id);

-- 3. 추가: 만약 기존에 option_id가 null인 데이터가 있는 상태에서 'UNIQUE' 제약 조건을 걸면 
-- PostgreSQL 15 이전 버전에서는 (A, B, NULL) 과 (A, B, NULL) 을 중복으로 보지 않을 수 있습니다.
-- "NULLS NOT DISTINCT" 옵션을 지원하면 (PG 15+) 사용하는 것이 좋습니다.
-- ALTER TABLE public.product_bonus_items 
-- ADD CONSTRAINT product_bonus_items_distinct_nulls 
-- UNIQUE NULLS NOT DISTINCT (parent_product_id, bonus_product_id, option_id);

SELECT 'Bonus Items Constraint Update Completed!' AS result;
