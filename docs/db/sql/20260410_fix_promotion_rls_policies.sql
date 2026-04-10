-- Fix RLS policies for product_promotion_items
ALTER TABLE product_promotion_items ENABLE ROW LEVEL SECURITY;

-- Allow all actions for authenticated users (Admin)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON product_promotion_items;
CREATE POLICY "Allow all for authenticated users" ON product_promotion_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Also allow public select if needed (for product detail page)
DROP POLICY IF EXISTS "Allow public select" ON product_promotion_items;
CREATE POLICY "Allow public select" ON product_promotion_items
    FOR SELECT
    TO public
    USING (true);
