-- Add platform and category to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS platform varchar(50);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS category varchar(100);

-- Update post_type enum to include 'manual'
ALTER TYPE post_type ADD VALUE IF NOT EXISTS 'manual';

-- Create demo_requests table
CREATE TABLE IF NOT EXISTS public.demo_requests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  hospital_name varchar(255) NOT NULL,
  contact_number varchar(100) NOT NULL,
  equipment varchar(255) NOT NULL,
  preferred_date date NOT NULL,
  scheduled_date date,
  content text NOT NULL,
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on demo_requests
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Policies for demo_requests
DROP POLICY IF EXISTS "Users can view their own demo requests" ON public.demo_requests;
CREATE POLICY "Users can view their own demo requests" ON public.demo_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create demo requests" ON public.demo_requests;
CREATE POLICY "Users can create demo requests" ON public.demo_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Admins can manage all demo requests" ON public.demo_requests;
CREATE POLICY "Admins can manage all demo requests" ON public.demo_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Also ensure posts table has manual type supported if it's not an enum in some environments
-- (Supabase enums can be tricky to update, sometimes they are varchar with check constraints)
-- But based on the grep, it is an enum.
