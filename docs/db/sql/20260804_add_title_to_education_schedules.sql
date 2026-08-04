-- ============================================
-- Add title column to education_schedules
-- ============================================
-- Description: 교육 및 세미나 일정 테이블에 'title' (일정 제목) 컬럼 추가
-- ============================================

ALTER TABLE public.education_schedules 
ADD COLUMN IF NOT EXISTS title varchar NULL;
