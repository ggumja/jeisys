-- Add credit_available column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS credit_available BOOLEAN DEFAULT TRUE;
