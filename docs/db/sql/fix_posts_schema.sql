-- 1. Add category and platform columns to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS category varchar(100);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS platform varchar(50);

-- 2. Update post_type check constraint (if it exists as a check constraint)
-- Note: Some environments use CHECK constraints instead of ENUMs
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_type_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_type_check CHECK (type IN ('notice', 'faq', 'news', 'media', 'manual'));

-- 3. If post_type is a native Postgres ENUM type
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_type') THEN
        ALTER TYPE post_type ADD VALUE IF NOT EXISTS 'manual';
    END IF;
END
$$;
