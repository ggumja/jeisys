-- ============================================================
-- 주문 취소 크레딧 환불 RPC
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.refund_order_credits(
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tx             RECORD;
  v_total_refunded NUMERIC := 0;
BEGIN
  -- 해당 주문의 'use' 트랜잭션을 찾아 환불
  FOR v_tx IN
    SELECT ct.id AS tx_id, ct.credit_id, ct.amount, ct.user_id
    FROM public.credit_transactions ct
    WHERE ct.order_id = p_order_id
      AND ct.type = 'use'
  LOOP
    -- user_credits.used_amount 복원, exhausted → active 복귀
    UPDATE public.user_credits
    SET used_amount = GREATEST(0, used_amount - v_tx.amount),
        status = CASE
          WHEN status = 'exhausted' THEN 'active'
          ELSE status
        END
    WHERE id = v_tx.credit_id;

    -- 환불 트랜잭션 기록
    INSERT INTO public.credit_transactions
      (credit_id, user_id, amount, type, order_id, description)
    VALUES
      (v_tx.credit_id, v_tx.user_id, v_tx.amount, 'refund', p_order_id, '주문 취소 크레딧 환불');

    v_total_refunded := v_total_refunded + v_tx.amount;
  END LOOP;

  RETURN jsonb_build_object('refunded', v_total_refunded);
END;
$$;

GRANT EXECUTE ON FUNCTION public.refund_order_credits TO authenticated;
