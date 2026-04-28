-- ============================================================
-- users 테이블 RLS 정책 추가
-- 마이페이지 정보수정 저장 시 CORS/403 오류 해결
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 작성일: 2026-04-29
-- ============================================================

-- RLS 활성화 확인
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: 본인 정보 조회
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. UPDATE: 본인 정보만 수정 가능
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ※ INSERT는 Supabase Auth trigger (handle_new_user) 또는
--   anon role로 회원가입 시 처리되므로 별도 확인 필요
-- INSERT 정책이 없어서 회원가입이 막히면 아래 추가:
-- CREATE POLICY "users_insert_own"
-- ON public.users
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (auth.uid() = id);

-- 관리자(admin role)는 모든 유저 조회/수정 가능 (admin 페이지용)
-- 기존에 admin 정책이 있다면 중복 생성 오류 발생 - 그 경우 이 줄 생략
CREATE POLICY "users_admin_all"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
