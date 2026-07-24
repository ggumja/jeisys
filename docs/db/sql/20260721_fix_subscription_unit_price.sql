-- ============================================================
-- 진단: 현재 구독 레코드 및 옵션 discount_rate 확인
-- ============================================================

-- ① 현재 구독 레코드 상세 확인 (unit_price, discount_rate)
SELECT
  s.id,
  s.total_quantity,
  s.cycle_months,
  s.total_rounds,
  s.qty_per_round,
  s.unit_price,
  s.regular_unit_price,
  s.discount_rate,
  s.created_at
FROM public.subscriptions s
JOIN public.users u ON u.id = s.user_id
WHERE u.role = 'admin'
ORDER BY s.created_at DESC;

-- ② subscription_product_options의 discount_rate 확인
SELECT
  spo.id,
  spo.option_label,
  spo.total_quantity,
  spo.discount_rate,
  spo.round_combinations
FROM public.subscription_product_options spo
JOIN public.products p ON p.id = spo.product_id
WHERE p.product_type = 'subscription'
ORDER BY p.name, spo.total_quantity;

-- ============================================================
-- 수정: 잘못된 구독 레코드 unit_price / discount_rate 업데이트
-- (subscription_product_options의 discount_rate 기준으로 교정)
-- ============================================================
UPDATE public.subscriptions s
SET
  discount_rate = spo.discount_rate,
  unit_price = ROUND(
    p.price * (1 - spo.discount_rate::numeric / 100) * s.qty_per_round
  ),
  regular_unit_price = p.price,
  updated_at = NOW()
FROM public.subscription_product_options spo
JOIN public.products p ON p.id = spo.product_id
WHERE
  s.total_quantity = spo.total_quantity
  AND p.product_type = 'subscription'
  -- 잘못된 레코드만 (discount_rate=0인데 옵션은 0이 아닌 경우)
  AND s.discount_rate = 0
  AND spo.discount_rate > 0;
