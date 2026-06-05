-- ============================================
-- Create Education Schedules Table
-- ============================================
-- Description: 교육 및 세미나 일정을 저장하는 테이블
-- ============================================

CREATE TABLE public.education_schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  equipment varchar NOT NULL,
  time varchar NOT NULL,
  location varchar NOT NULL,
  capacity integer NOT NULL DEFAULT 10,
  enrolled integer NOT NULL DEFAULT 0,
  instructor varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  type varchar NOT NULL DEFAULT 'education' CHECK (type IN ('education', 'seminar')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.education_schedules ENABLE ROW LEVEL SECURITY;

-- 1. 누구나 교육 및 세미나 일정을 조회할 수 있도록 허용
CREATE POLICY "Anyone can view education schedules"
ON public.education_schedules
FOR SELECT
USING (true);

-- 2. 관리자만 교육 및 세미나 일정을 등록, 수정, 삭제할 수 있도록 허용
CREATE POLICY "Admins can manage education schedules"
ON public.education_schedules
FOR ALL
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
