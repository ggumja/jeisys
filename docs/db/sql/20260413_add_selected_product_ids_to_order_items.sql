-- Add selected_product_ids to order_items table to store bundle composition
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_product_ids UUID[];

-- Add a comment to explain the purpose
COMMENT ON COLUMN public.order_items.selected_product_ids IS 'List of product IDs selected for a promotion bundle item';
