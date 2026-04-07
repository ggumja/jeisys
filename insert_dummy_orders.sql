-- 수정된 버전: 'paid' 상태 사용
DO $$
DECLARE
    target_user_id UUID;
    v_product_id UUID;
    v_product_price DECIMAL;
    v_order_id UUID;
BEGIN
    -- 1. 유효한 사용자 ID 가져오기
    SELECT id INTO target_user_id FROM public.users LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE '생성된 사용자가 없습니다. 먼저 사용자를 등록해 주세요.';
        RETURN;
    END IF;

    -- 5개의 더미 주문 생성
    FOR i IN 1..5 LOOP
        -- 주문 기본 정보 삽입 (status를 DB 명세인 'paid'로 변경)
        INSERT INTO public.orders (
            user_id,
            order_number,
            status,
            total_amount,
            payment_method,
            delivery_address,
            ordered_at
        ) VALUES (
            target_user_id,
            'DUM-' || floor(random() * 1000000)::text,
            'paid',
            0,
            'credit',
            '서울특별시 강남구 테헤란로 123 (더미 빌딩 ' || i || '층)',
            now()
        ) RETURNING id INTO v_order_id;

        -- 무작위 상품 상세(order_items) 추가
        FOR j IN 1..(1 + floor(random() * 2)) LOOP
            SELECT id, price INTO v_product_id, v_product_price 
            FROM public.products 
            ORDER BY random() LIMIT 1;

            IF v_product_id IS NOT NULL THEN
                INSERT INTO public.order_items (
                    order_id,
                    product_id,
                    quantity,
                    unit_price,
                    total_price
                ) VALUES (
                    v_order_id,
                    v_product_id,
                    j,
                    v_product_price,
                    v_product_price * j
                );

                UPDATE public.orders 
                SET total_amount = total_amount + (v_product_price * j)
                WHERE id = v_order_id;
            END IF;
        END LOOP;
    END LOOP;
END $$;
