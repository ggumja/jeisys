-- ============================================================
-- 크레딧 사용 처리 RPC
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.use_user_credits(
  p_user_id    UUID,
  p_amount     NUMERIC,
  p_order_id   UUID DEFAULT NULL,
  p_description TEXT DEFAULT '주문 크레딧 사용'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining     NUMERIC := p_amount;  -- 아직 차감해야 할 금액
  v_credit        RECORD;
  v_deduct        NUMERIC;
  v_total_used    NUMERIC := 0;
BEGIN
  -- 유효기간 내 활성 크레딧을 발급일 오래된 순(FIFO)으로 차감
  FOR v_credit IN
    SELECT id, amount, used_amount, (amount - used_amount) AS balance
    FROM public.user_credits
    WHERE user_id = p_user_id
      AND status = 'active'
      AND expiry_date >= CURRENT_DATE
      AND (amount - used_amount) > 0
    ORDER BY created_at ASC
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;

    v_deduct := LEAST(v_remaining, v_credit.balance);

    -- used_amount 업데이트
    UPDATE public.user_credits
    SET used_amount = used_amount + v_deduct,
        status = CASE
          WHEN (amount - used_amount - v_deduct) <= 0 THEN 'exhausted'
          ELSE 'active'
        END
    WHERE id = v_credit.id;

    -- 사용 트랜잭션 기록
    INSERT INTO public.credit_transactions
      (credit_id, user_id, amount, type, order_id, description)
    VALUES
      (v_credit.id, p_user_id, v_deduct, 'use', p_order_id, p_description);

    v_remaining  := v_remaining - v_deduct;
    v_total_used := v_total_used + v_deduct;
  END LOOP;

  IF v_total_used < p_amount THEN
    RAISE EXCEPTION '크레딧 잔액이 부족합니다. (요청: %, 가능: %)', p_amount, v_total_used;
  END IF;

  RETURN jsonb_build_object('used', v_total_used, 'remaining_request', v_remaining);
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_user_credits TO authenticated;
