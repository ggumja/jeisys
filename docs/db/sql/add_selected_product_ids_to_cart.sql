-- Add selected_product_ids to cart_items table to store package selections
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS selected_product_ids UUID[];

-- Optionally, add a comment to explain the purpose
COMMENT ON COLUMN public.cart_items.selected_product_ids IS 'List of product IDs selected for a package product';
