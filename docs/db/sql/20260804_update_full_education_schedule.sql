-- ============================================
-- Update 2026-08-10 Education Schedule to Full (10/10)
-- ============================================
-- Description: 8월 10일 덴시티 핸즈온 교육 신규 신청자를 10명 마감 상태로 설정

UPDATE public.education_schedules
SET enrolled = 10, 
    capacity = 10, 
    title = '덴시티 핸즈온 교육'
WHERE date = '2026-08-10';
