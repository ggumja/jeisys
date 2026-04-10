-- 1. Extend products table for promotion feature
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_promotion BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS buy_quantity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS get_quantity INTEGER DEFAULT 0;

-- 2. Create promotion items table
CREATE TABLE IF NOT EXISTS product_promotion_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(parent_product_id, product_id)
);

-- 3. Add index for performance
CREATE INDEX IF NOT EXISTS idx_promotion_parent ON product_promotion_items(parent_product_id);
