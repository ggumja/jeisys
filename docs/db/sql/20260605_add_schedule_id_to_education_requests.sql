-- education_requests 테이블에 schedule_id 컬럼 추가
-- 어떤 교육 일정에 신청했는지 연결
ALTER TABLE public.education_requests
  ADD COLUMN IF NOT EXISTS schedule_id uuid REFERENCES public.education_schedules(id) ON DELETE SET NULL;
