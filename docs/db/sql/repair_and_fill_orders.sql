-- 주문 상세 상품 내역 복구 스크립트 (최종 버전)
-- 1. 상품(products) 테이블에 데이터가 전혀 없을 경우 기본 샘플을 생성합니다.
-- 2. 상품 상세(order_items)가 비어있는 모든 주문을 찾아 무작위 상품을 할당합니다.

DO $$
DECLARE
    v_order RECORD;
    v_product_id UUID;
    v_product_price DECIMAL;
    v_count_repaired INT := 0;
BEGIN
    -- 1. 기본 상품 데이터 확인 및 보강
    IF NOT EXISTS (SELECT 1 FROM public.products) THEN
        INSERT INTO public.products (name, category, price, stock, description, image_url)
        VALUES 
        ('Potenza Needle Tip 16pin', 'POTENZA', 250000, 100, 'Potenza RF Microneedling Tip', 'https://images.unsplash.com/photo-1512290923902-8a9f81dc206e?auto=format&fit=crop&q=80&w=200'),
        ('Density High Skin Booster', 'DENSITY', 180000, 50, 'High frequency skin treatment booster', 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&q=80&w=200');
        RAISE NOTICE '기본 상품 데이터를 생성했습니다.';
    END IF;

    -- 2. 상품 상세가 없는 주문들(DUM-799066 포함) 복구
    FOR v_order IN 
        SELECT o.id, o.order_number, o.total_amount 
        FROM public.orders o
        LEFT JOIN public.order_items oi ON o.id = oi.order_id
        WHERE oi.id IS NULL
    LOOP
        -- 무작위 상품 1개 선택
        SELECT id, price INTO v_product_id, v_product_price 
        FROM public.products 
        ORDER BY random() LIMIT 1;

        IF v_product_id IS NOT NULL THEN
            -- 내역 생성: 주문 총액이 0보다 크면 그 가격으로, 아니면 상품 가격으로 채움
            INSERT INTO public.order_items (
                order_id, 
                product_id, 
                quantity, 
                unit_price, 
                total_price
            ) VALUES (
                v_order.id, 
                v_product_id, 
                1, 
                CASE WHEN v_order.total_amount > 0 THEN v_order.total_amount ELSE v_product_price END,
                CASE WHEN v_order.total_amount > 0 THEN v_order.total_amount ELSE v_product_price END
            );

            -- 총액이 0이었던 주문은 업데이트
            IF v_order.total_amount = 0 THEN
                UPDATE public.orders SET total_amount = v_product_price WHERE id = v_order.id;
            END IF;
            
            v_count_repaired := v_count_repaired + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '%건의 주문에 대한 누락된 상품 정보를 복구했습니다.', v_count_repaired;
END $$;
