-- ============================================================
-- user_equipments 테이블 RLS 정책 추가
-- 장비 등록 시 403 Forbidden 오류 해결
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 작성일: 2026-04-29
-- ============================================================

-- 현재 정책 확인 (선택 실행)
-- SELECT * FROM pg_policies WHERE tablename = 'user_equipments';

-- RLS 활성화 확인 (이미 켜져 있을 수 있음)
ALTER TABLE public.user_equipments ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: 본인 장비만 조회 가능
CREATE POLICY "user_equipments_select_own"
ON public.user_equipments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. INSERT: 본인 user_id로만 등록 가능
CREATE POLICY "user_equipments_insert_own"
ON public.user_equipments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: 본인 장비만 수정 가능
CREATE POLICY "user_equipments_update_own"
ON public.user_equipments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. DELETE: 본인 장비만 삭제 가능
CREATE POLICY "user_equipments_delete_own"
ON public.user_equipments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
