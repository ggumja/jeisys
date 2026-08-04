-- ─────────────────────────────────────────────────────────────
-- education_schedules 테이블의 enrolled 인원수를 실제 active 신청건 수로 동기화
-- ─────────────────────────────────────────────────────────────

UPDATE public.education_schedules s
SET enrolled = COALESCE(
  (
    SELECT COUNT(*)
    FROM public.education_requests r
    WHERE r.schedule_id = s.id
      AND r.status IN ('scheduled', 'completed')
  ),
  0
);
