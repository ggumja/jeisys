-- ============================================
-- Add 'display_no' column to products table
-- ============================================

-- 1. Add the column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_no SERIAL;

-- 2. Update existing rows if necessary (SERIAL takes care of this)
-- But if we want to ensure it matches some order, we could do:
-- WITH numbered AS (
--   SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
--   FROM public.products
-- )
-- UPDATE public.products p
-- SET display_no = n.row_num
-- FROM numbered n
-- WHERE p.id = n.id;

-- 3. Verify
SELECT id, name, display_no, created_at FROM public.products ORDER BY display_no DESC;
