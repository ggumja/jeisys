-- 관리자 등급 및 권한 관리를 위한 컬럼 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS admin_role VARCHAR(20),
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

-- 기존 최고관리자 계정에 기본 권한 부여 (예시: 기존 role이 admin인 사용자)
UPDATE public.users 
SET admin_role = 'super', permissions = '["all"]'::jsonb 
WHERE role = 'admin';

-- 관리자 조회를 위한 뷰(또는 접근)에 대비한 인덱스 (선택 사항)
CREATE INDEX IF NOT EXISTS idx_users_admin_role ON public.users(admin_role) WHERE admin_role IS NOT NULL;
