-- Add is_package and selectable_count to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_package BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS selectable_count INTEGER DEFAULT 1;

-- Create package_items table
CREATE TABLE IF NOT EXISTS public.package_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    price_override DECIMAL(12,2),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(package_id, product_id)
);

-- Enable RLS
ALTER TABLE public.package_items ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (matching existing product policies)
DROP POLICY IF EXISTS "Anyone can view package items" ON public.package_items;
CREATE POLICY "Anyone can view package items" ON public.package_items
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage package items" ON public.package_items;
CREATE POLICY "Admins can manage package items" ON public.package_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
