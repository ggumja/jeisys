-- ============================================================
-- 회원 승인 상태 전용 RPC (ENUM 대문자 버전 확정)
-- DB ENUM: APPROVED, PENDING, REJECTED (대문자)
-- 실행 위치: Supabase > SQL Editor
-- 작성일: 2026-06-08
-- ============================================================

CREATE OR REPLACE FUNCTION admin_set_user_approval(p_user_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format(
    'UPDATE users SET approval_status = %L WHERE id = %L::uuid',
    p_status,
    p_user_id::text
  );
END;
$$;

-- 실행 권한 부여
GRANT EXECUTE ON FUNCTION admin_set_user_approval(uuid, text) TO authenticated;
