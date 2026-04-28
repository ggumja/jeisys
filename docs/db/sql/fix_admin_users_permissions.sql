-- 회원 정보 수정을 위한 어드민 권한 부여 SQL
-- 어드민(role = 'admin')이 모든 회원의 정보를 수정할 수 있도록 허용합니다.

-- 기존에 유사한 정책이 있다면 삭제
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- 어드민이 모든 회원을 조회할 수 있도록 허용
CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
TO authenticated 
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' 
  OR auth.uid() = id
);

-- 어드민이 모든 회원의 정보를 수정할 수 있도록 허용 (member_type 포함)
CREATE POLICY "Admins can update all users" 
ON public.users FOR UPDATE 
TO authenticated 
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
