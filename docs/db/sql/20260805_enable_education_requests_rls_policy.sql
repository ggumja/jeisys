-- ─────────────────────────────────────────────────────────────
-- education_requests 테이블 RLS 정책 설정 (신청 등록 및 조회 완전 허용)
-- ─────────────────────────────────────────────────────────────

-- 1. RLS 활성화 확인
ALTER TABLE public.education_requests ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 정리
DROP POLICY IF EXISTS "Allow all for authenticated users on education_requests" ON public.education_requests;
DROP POLICY IF EXISTS "Allow select for education_requests" ON public.education_requests;
DROP POLICY IF EXISTS "Allow insert for education_requests" ON public.education_requests;
DROP POLICY IF EXISTS "Allow update for education_requests" ON public.education_requests;
DROP POLICY IF EXISTS "Allow delete for education_requests" ON public.education_requests;
DROP POLICY IF EXISTS "Enable all access for education_requests" ON public.education_requests;

-- 3. 통합 허용 정책 생성 (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Enable all access for education_requests" 
ON public.education_requests 
FOR ALL 
USING (true) 
WITH CHECK (true);
