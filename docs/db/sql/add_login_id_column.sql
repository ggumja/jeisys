-- 1. Add login_id column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_id VARCHAR(50);

-- 2. Add unique constraint to avoid duplicate IDs
ALTER TABLE public.users ADD CONSTRAINT users_login_id_key UNIQUE (login_id);

-- 3. Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_users_login_id ON public.users(login_id);

-- 4. (Optional) Backfill existing users: set login_id to part of email before @
-- This is just a helper for existing test data
UPDATE public.users 
SET login_id = split_part(email, '@', 1) 
WHERE login_id IS NULL;
