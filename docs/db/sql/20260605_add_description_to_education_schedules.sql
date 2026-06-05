-- ============================================
-- education_schedules 테이블에 description 컬럼 추가
-- ============================================
-- description: HTML 형식의 교육 상세 내용 (TipTap 에디터로 작성, 이미지 포함 가능)
-- ============================================

ALTER TABLE public.education_schedules
  ADD COLUMN IF NOT EXISTS description text;
