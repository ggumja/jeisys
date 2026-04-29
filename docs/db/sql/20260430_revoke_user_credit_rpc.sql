-- ============================================================
-- 크레딧 회수 RPC
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. credit_transactions type 컬럼에 'revoke' 허용 추가
DO $$
BEGIN
  ALTER TABLE public.credit_transactions
    DROP CONSTRAINT IF EXISTS credit_transactions_type_check;
  ALTER TABLE public.credit_transactions
    ADD CONSTRAINT credit_transactions_type_check
    CHECK (type IN ('issue', 'use', 'expire', 'refund', 'revoke'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 2. 크레딧 회수 RPC
CREATE OR REPLACE FUNCTION public.revoke_user_credit(
  p_credit_id UUID,
  p_amount    NUMERIC,
  p_reason    TEXT DEFAULT '크레딧 회수'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credit       RECORD;
  v_actual_revoke NUMERIC;
BEGIN
  SELECT id, user_id, amount, used_amount,
         (amount - used_amount) AS balance, status
  INTO v_credit
  FROM public.user_credits
  WHERE id = p_credit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '크레딧을 찾을 수 없습니다.';
  END IF;

  -- 잔액 초과 시 잔액 전액 회수
  v_actual_revoke := LEAST(p_amount, v_credit.balance);

  IF v_actual_revoke <= 0 THEN
    RAISE EXCEPTION '회수 가능한 잔액이 없습니다.';
  END IF;

  -- used_amount 증가 (회수 처리)
  UPDATE public.user_credits
  SET used_amount = used_amount + v_actual_revoke,
      status = CASE
        WHEN (amount - used_amount - v_actual_revoke) <= 0 THEN 'exhausted'
        ELSE 'active'
      END
  WHERE id = p_credit_id;

  -- 회수 트랜잭션 기록
  INSERT INTO public.credit_transactions
    (credit_id, user_id, amount, type, order_id, description)
  VALUES
    (p_credit_id, v_credit.user_id, v_actual_revoke, 'revoke', NULL, p_reason);

  RETURN jsonb_build_object(
    'revoked',    v_actual_revoke,
    'remaining',  v_credit.balance - v_actual_revoke
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_user_credit TO authenticated;
