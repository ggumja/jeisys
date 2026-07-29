-- admin@jeisys.com 계정에 결제실패 샘플 구독 데이터 삽입
-- Supabase SQL Editor에서 실행하세요
-- https://app.supabase.com/project/xbtnhnkwlioufpyeuyyg/sql

DO $$
DECLARE
  v_user_id     UUID;
  v_product_id  UUID;
  v_sub_id      UUID := gen_random_uuid();
  v_unit_price  NUMERIC := 450000;
  v_total_qty   INT := 100;
  v_total_rounds INT := 10;
  v_qty_per_round INT := 10;
  v_cycle_months INT := 1;
  v_sub_no      TEXT := '2607290009';
BEGIN

  -- 1. admin@jeisys.com 의 user_id 조회
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@jeisys.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM public.users
    WHERE email = 'admin@jeisys.com'
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'admin@jeisys.com 사용자를 찾을 수 없습니다.';
  END IF;

  RAISE NOTICE 'admin user_id: %', v_user_id;

  -- 2. 알파팁 상품 ID 조회
  SELECT id INTO v_product_id
  FROM public.products
  WHERE name ILIKE '%알파팁%'
     OR sku ILIKE '%ALPHA%'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products LIMIT 1;
  END IF;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION '등록된 상품이 없습니다.';
  END IF;

  RAISE NOTICE '알파팁 product_id: %', v_product_id;

  -- 3. 기존 동일 구독번호 삭제 (재실행 안전)
  DELETE FROM public.subscription_shipments
  WHERE subscription_id IN (
    SELECT id FROM public.subscriptions WHERE subscription_no = v_sub_no
  );
  DELETE FROM public.subscriptions WHERE subscription_no = v_sub_no;

  -- 4. 구독 메인 데이터 생성 (3회차 결제 실패 상태)
  INSERT INTO public.subscriptions (
    id, subscription_no, user_id, product_id,
    status, cycle_days, cycle_months,
    total_quantity, total_rounds, qty_per_round, last_round_qty, current_round,
    unit_price, regular_unit_price, discount_rate,
    next_billing_date, last_billing_date,
    created_at, updated_at
  ) VALUES (
    v_sub_id, v_sub_no, v_user_id, v_product_id,
    'active', 30, v_cycle_months,
    v_total_qty, v_total_rounds, v_qty_per_round, v_qty_per_round, 3,
    v_unit_price, 500000, 10,
    CURRENT_DATE + INTERVAL '1 month',
    CURRENT_DATE - INTERVAL '1 month',
    NOW() - INTERVAL '2 months', NOW()
  );

  -- 5. 회차별 스케줄 생성
  -- 1회차: 결제완료
  INSERT INTO public.subscription_shipments (
    subscription_id, round_no, scheduled_date, quantity, amount, status, executed_at, created_at
  ) VALUES (
    v_sub_id, 1,
    CURRENT_DATE - INTERVAL '2 months', 10, v_unit_price,
    'paid', NOW() - INTERVAL '2 months', NOW()
  );

  -- 2회차: 결제완료
  INSERT INTO public.subscription_shipments (
    subscription_id, round_no, scheduled_date, quantity, amount, status, executed_at, created_at
  ) VALUES (
    v_sub_id, 2,
    CURRENT_DATE - INTERVAL '1 month', 10, v_unit_price,
    'paid', NOW() - INTERVAL '1 month', NOW()
  );

  -- 3회차: 카드 문제로 결제 실패 (status = 'failed')
  INSERT INTO public.subscription_shipments (
    subscription_id, round_no, scheduled_date, quantity, amount, status, executed_at, created_at
  ) VALUES (
    v_sub_id, 3,
    CURRENT_DATE, 10, v_unit_price,
    'failed',
    NOW(), NOW()
  );

  -- 4~10회차: 대기(pending)
  FOR r IN 4..10 LOOP
    INSERT INTO public.subscription_shipments (
      subscription_id, round_no, scheduled_date, quantity, amount, status, created_at
    ) VALUES (
      v_sub_id, r,
      CURRENT_DATE + (INTERVAL '1 month' * (r - 3)),
      10, v_unit_price, 'pending', NOW()
    );
  END LOOP;

  RAISE NOTICE '✅ 결제실패 샘플 데이터 삽입 완료! (구독번호: %, Sub ID: %)', v_sub_no, v_sub_id;

END $$;

-- 확인 쿼리
SELECT
  s.subscription_no,
  s.status,
  s.current_round,
  p.name AS product_name,
  u.email AS user_email
FROM public.subscriptions s
LEFT JOIN public.products p ON s.product_id = p.id
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE s.subscription_no = '2607290009';
