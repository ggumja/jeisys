-- ============================================
-- Sync Categories from Products Table
-- ============================================

-- 1. Insert unique parent categories from products
INSERT INTO public.categories (name, display_order)
SELECT DISTINCT category, 99
FROM public.products
WHERE category IS NOT NULL 
  AND category NOT IN (SELECT name FROM public.categories)
ON CONFLICT DO NOTHING;

-- 2. Insert unique subcategories from products
-- For simplicity, if a product has a category 'A' and subcategory 'B',
-- we try to find the category 'A' in the categories table and set it as parent.
DO $$
DECLARE
    cat_record RECORD;
    parent_uuid UUID;
BEGIN
    FOR cat_record IN SELECT DISTINCT category, subcategory FROM public.products WHERE category IS NOT NULL AND subcategory IS NOT NULL LOOP
        -- Find parent ID
        SELECT id INTO parent_uuid FROM public.categories WHERE name = cat_record.category LIMIT 1;
        
        IF parent_uuid IS NOT NULL THEN
            -- Insert subcategory
            INSERT INTO public.categories (name, parent_id, display_order)
            VALUES (cat_record.subcategory, parent_uuid, 99)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- 3. Verify current categories
SELECT name, parent_id FROM public.categories ORDER BY display_order ASC;
