-- ─────────────────────────────────────────────────────────────
-- 삭제된 교육 일정(education_schedules)에 매핑되어 정보가 비어보이는 고아 신청 내역 정리
-- ─────────────────────────────────────────────────────────────

DELETE FROM public.education_requests
WHERE schedule_id IS NOT NULL
  AND schedule_id NOT IN (SELECT id FROM public.education_schedules);
