-- 1. Enable Admin to MANAGE (SELECT, INSERT, UPDATE, DELETE) all inquiries
DROP POLICY IF EXISTS "Admins can manage all inquiries" ON public.inquiries;
CREATE POLICY "Admins can manage all inquiries" ON public.inquiries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 2. Ensure Users can CREATE their own inquiries
DROP POLICY IF EXISTS "Users can create inquiries" ON public.inquiries;
CREATE POLICY "Users can create inquiries" ON public.inquiries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Ensure Users can UPDATE their own inquiries (only before answer)
DROP POLICY IF EXISTS "Users can update own inquiries" ON public.inquiries;
CREATE POLICY "Users can update own inquiries" ON public.inquiries
  FOR UPDATE USING (auth.uid() = user_id AND status = 'waiting');
