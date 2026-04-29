-- ============================================================
-- 장비별 크레딧 차감 RPC
-- use_user_credits와 동일하지만 equipment_type 필터 추가
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.use_equipment_credits(
  p_user_id        UUID,
  p_equipment_type TEXT,
  p_amount         NUMERIC,
  p_order_id       UUID DEFAULT NULL,
  p_description    TEXT DEFAULT '주문 크레딧 사용'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining     NUMERIC := p_amount;
  v_credit        RECORD;
  v_deduct        NUMERIC;
  v_total_used    NUMERIC := 0;
BEGIN
  -- 해당 장비 타입의 크레딧만 만료일 임박 순으로 차감
  FOR v_credit IN
    SELECT id, amount, used_amount, (amount - used_amount) AS balance
    FROM public.user_credits
    WHERE user_id = p_user_id
      AND equipment_type = p_equipment_type
      AND status = 'active'
      AND expiry_date >= CURRENT_DATE
      AND (amount - used_amount) > 0
    ORDER BY expiry_date ASC, created_at ASC
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;

    v_deduct := LEAST(v_remaining, v_credit.balance);

    UPDATE public.user_credits
    SET used_amount = used_amount + v_deduct,
        status = CASE
          WHEN (amount - used_amount - v_deduct) <= 0 THEN 'exhausted'
          ELSE 'active'
        END
    WHERE id = v_credit.id;

    INSERT INTO public.credit_transactions
      (credit_id, user_id, amount, type, order_id, description)
    VALUES
      (v_credit.id, p_user_id, v_deduct, 'use', p_order_id, p_description);

    v_remaining  := v_remaining - v_deduct;
    v_total_used := v_total_used + v_deduct;
  END LOOP;

  IF v_total_used < p_amount THEN
    RAISE EXCEPTION '[%] 크레딧 잔액이 부족합니다. (요청: %, 가능: %)',
      p_equipment_type, p_amount, v_total_used;
  END IF;

  RETURN jsonb_build_object('used', v_total_used, 'equipment_type', p_equipment_type);
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_equipment_credits TO authenticated;
