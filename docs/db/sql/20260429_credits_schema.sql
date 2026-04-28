-- ============================================================
-- 크레딧 시스템 스키마
-- Phase 1: 관리자 발급 + 이력 조회
-- 작성일: 2026-04-29
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. user_credits 테이블 ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_credits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('Density', 'LinearZ')),
  amount        NUMERIC(12, 0) NOT NULL CHECK (amount > 0),
  used_amount   NUMERIC(12, 0) NOT NULL DEFAULT 0,
  expiry_date   DATE NOT NULL,
  memo          TEXT,
  issued_by     UUID REFERENCES public.users(id),
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'expired', 'exhausted')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. credit_transactions 테이블 ───────────────────────────
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id   UUID NOT NULL REFERENCES public.user_credits(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount      NUMERIC(12, 0) NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('issue', 'use', 'expire', 'refund')),
  order_id    UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. 인덱스 ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_status  ON public.user_credits(status);
CREATE INDEX IF NOT EXISTS idx_credit_tx_credit_id  ON public.credit_transactions(credit_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user_id    ON public.credit_transactions(user_id);

-- ── 4. RLS 활성화 ────────────────────────────────────────────
ALTER TABLE public.user_credits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- user_credits RLS
CREATE POLICY "관리자 전체 접근" ON public.user_credits
  FOR ALL TO authenticated USING (check_is_admin()) WITH CHECK (check_is_admin());

CREATE POLICY "본인 크레딧 조회" ON public.user_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- credit_transactions RLS
CREATE POLICY "관리자 전체 접근" ON public.credit_transactions
  FOR ALL TO authenticated USING (check_is_admin()) WITH CHECK (check_is_admin());

CREATE POLICY "본인 이력 조회" ON public.credit_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- GRANT
GRANT SELECT, INSERT, UPDATE ON public.user_credits        TO authenticated;
GRANT SELECT, INSERT         ON public.credit_transactions TO authenticated;

-- ── 5. RPC: 장비별 잔액 요약 조회 ───────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_credit_summary(p_user_id UUID)
RETURNS TABLE (
  equipment_type TEXT,
  total_amount   NUMERIC,
  used_amount    NUMERIC,
  remaining      NUMERIC,
  active_count   BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    uc.equipment_type,
    SUM(uc.amount)       AS total_amount,
    SUM(uc.used_amount)  AS used_amount,
    SUM(uc.amount - uc.used_amount) AS remaining,
    COUNT(*)             AS active_count
  FROM user_credits uc
  WHERE uc.user_id = p_user_id
    AND uc.status = 'active'
    AND uc.expiry_date >= CURRENT_DATE
  GROUP BY uc.equipment_type;
END;
$$;

-- ── 6. RPC: 크레딧 발급 ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.issue_user_credit(
  p_user_id       UUID,
  p_equipment_type TEXT,
  p_amount        NUMERIC,
  p_expiry_date   DATE,
  p_memo          TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_credit_id UUID;
  v_issuer_id UUID;
BEGIN
  -- 관리자 권한 확인
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION '관리자 권한이 필요합니다.';
  END IF;

  v_issuer_id := auth.uid();

  -- 크레딧 발급
  INSERT INTO user_credits (user_id, equipment_type, amount, expiry_date, memo, issued_by)
  VALUES (p_user_id, p_equipment_type, p_amount, p_expiry_date, p_memo, v_issuer_id)
  RETURNING id INTO v_credit_id;

  -- 발급 트랜잭션 기록
  INSERT INTO credit_transactions (credit_id, user_id, amount, type, description)
  VALUES (v_credit_id, p_user_id, p_amount, 'issue',
          COALESCE(p_memo, p_equipment_type || ' 크레딧 발급'));

  RETURN v_credit_id;
END;
$$;

-- ── 7. 만료 상태 자동 업데이트 함수 (수동 호출 또는 cron) ──
CREATE OR REPLACE FUNCTION public.expire_overdue_credits()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- 만료일 지난 active 크레딧 → expired 처리
  UPDATE user_credits
  SET status = 'expired'
  WHERE status = 'active' AND expiry_date < CURRENT_DATE;

  -- 만료 트랜잭션 기록
  INSERT INTO credit_transactions (credit_id, user_id, amount, type, description)
  SELECT id, user_id, (amount - used_amount), 'expire', '유효기간 만료'
  FROM user_credits
  WHERE status = 'expired'
    AND id NOT IN (SELECT credit_id FROM credit_transactions WHERE type = 'expire');
END;
$$;
