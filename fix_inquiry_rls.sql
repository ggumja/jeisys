-- Update RLS for inquiries to allow viewing public inquiries OR own inquiries
DROP POLICY IF EXISTS "Users can see their own inquiries" ON public.inquiries;

CREATE POLICY "Users can view inquiries" ON public.inquiries
  FOR SELECT USING (
    (is_secret = false) OR 
    (auth.uid() = user_id) OR 
    (EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    ))
  );

-- Ensure insert is only for logged in users
DROP POLICY IF EXISTS "Users can create inquiries" ON public.inquiries;
CREATE POLICY "Users can create inquiries" ON public.inquiries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
