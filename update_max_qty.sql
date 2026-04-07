-- Add max_order_quantity column to products table
ALTER TABLE products ADD COLUMN max_order_quantity INTEGER DEFAULT NULL;

COMMENT ON COLUMN products.max_order_quantity IS '최대 주문 가능 수량';
