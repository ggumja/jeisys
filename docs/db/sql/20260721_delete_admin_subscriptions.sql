-- ============================================================
-- 테스트용 admin 계정의 정기구독 관련 기록 전체 삭제
-- public.users.role = 'admin' 기준
-- ============================================================

-- ① 현재 admin 계정 목록 확인
SELECT id, email, name, hospital_name, role
FROM public.users
WHERE role = 'admin';

-- ② 삭제 대상 구독 확인
SELECT
  u.email,
  u.name,
  u.role,
  s.id AS subscription_id,
  s.status,
  s.total_quantity,
  s.cycle_months,
  s.created_at
FROM public.users u
JOIN public.subscriptions s ON s.user_id = u.id
WHERE u.role = 'admin'
ORDER BY s.created_at DESC;

-- ============================================================
-- ③ 확인 후 실행 (자식 테이블 → 부모 테이블 순서)
-- ============================================================

DO $$
DECLARE
  admin_user_ids UUID[];
  del_cancel INT;
  del_shipments INT;
  del_subs INT;
BEGIN
  -- public.users 테이블 기준으로 admin user_id 수집
  SELECT ARRAY(
    SELECT id FROM public.users
    WHERE role = 'admin'
  ) INTO admin_user_ids;

  IF array_length(admin_user_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'admin 계정을 찾을 수 없습니다. role 조건을 확인하세요.';
  END IF;

  RAISE NOTICE 'admin 계정 % 개 발견: %', array_length(admin_user_ids, 1), admin_user_ids;

  -- 1. 해지 신청 기록 삭제
  DELETE FROM public.subscription_cancellation_requests
  WHERE subscription_id IN (
    SELECT id FROM public.subscriptions WHERE user_id = ANY(admin_user_ids)
  );
  GET DIAGNOSTICS del_cancel = ROW_COUNT;

  -- 2. 회차별 출고 스케줄 삭제
  DELETE FROM public.subscription_shipments
  WHERE subscription_id IN (
    SELECT id FROM public.subscriptions WHERE user_id = ANY(admin_user_ids)
  );
  GET DIAGNOSTICS del_shipments = ROW_COUNT;

  -- 3. 구독 레코드 삭제
  DELETE FROM public.subscriptions
  WHERE user_id = ANY(admin_user_ids);
  GET DIAGNOSTICS del_subs = ROW_COUNT;

  RAISE NOTICE '삭제 완료 — 해지신청: %건, 출고스케줄: %건, 구독: %건', del_cancel, del_shipments, del_subs;
END $$;

