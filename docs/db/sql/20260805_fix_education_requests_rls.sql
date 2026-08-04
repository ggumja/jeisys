-- ─────────────────────────────────────────────────────────────
-- education_requests 및 education_schedules RLS 정책 완화 (모든 읽기/쓰기 허용)
-- ─────────────────────────────────────────────────────────────

-- 1. education_requests RLS 정책 재설정
ALTER TABLE public.education_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for education_requests" ON public.education_requests;
CREATE POLICY "Enable all access for education_requests"
ON public.education_requests
FOR ALL
USING (true)
WITH CHECK (true);

-- 2. education_schedules RLS 정책 재설정
ALTER TABLE public.education_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for education_schedules" ON public.education_schedules;
CREATE POLICY "Enable all access for education_schedules"
ON public.education_schedules
FOR ALL
USING (true)
WITH CHECK (true);
