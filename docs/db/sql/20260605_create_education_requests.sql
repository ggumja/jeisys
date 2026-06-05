-- ============================================================
-- education_requests 테이블 생성 + schedule_id 포함 (통합본)
-- Supabase SQL Editor에서 이 파일 전체를 한 번에 실행하세요
-- ============================================================

-- set_updated_at 함수가 없을 경우 생성
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 교육 신청 테이블 생성
CREATE TABLE IF NOT EXISTS public.education_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    schedule_id uuid REFERENCES public.education_schedules(id) ON DELETE SET NULL,
    equipment text NOT NULL,
    preferred_date date,
    scheduled_date date,
    content text,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS set_updated_at_education_requests ON public.education_requests;
CREATE TRIGGER set_updated_at_education_requests
    BEFORE UPDATE ON public.education_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS 활성화
ALTER TABLE public.education_requests ENABLE ROW LEVEL SECURITY;

-- 자신의 신청 내역만 조회
DROP POLICY IF EXISTS "education_requests_select_own" ON public.education_requests;
CREATE POLICY "education_requests_select_own"
    ON public.education_requests FOR SELECT
    USING (auth.uid() = user_id);

-- 관리자는 전체 조회
DROP POLICY IF EXISTS "education_requests_select_admin" ON public.education_requests;
CREATE POLICY "education_requests_select_admin"
    ON public.education_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 로그인 사용자 신청 등록
DROP POLICY IF EXISTS "education_requests_insert_own" ON public.education_requests;
CREATE POLICY "education_requests_insert_own"
    ON public.education_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 관리자 상태 업데이트
DROP POLICY IF EXISTS "education_requests_update_admin" ON public.education_requests;
CREATE POLICY "education_requests_update_admin"
    ON public.education_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 관리자 삭제
DROP POLICY IF EXISTS "education_requests_delete_admin" ON public.education_requests;
CREATE POLICY "education_requests_delete_admin"
    ON public.education_requests FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
