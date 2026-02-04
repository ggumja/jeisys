-- ============================================
-- Categories Table Setup
-- ============================================

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Public Read Access" ON public.categories;
CREATE POLICY "Public Read Access" ON public.categories 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Full Access" ON public.categories;
CREATE POLICY "Admin Full Access" ON public.categories 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 4. Insert Initial Categories
INSERT INTO public.categories (name, display_order)
VALUES 
    ('Density', 1),
    ('DLiv', 2),
    ('POTENZA', 3),
    ('INTRAcel', 4),
    ('LinearZ', 5),
    ('LinearFirm', 6),
    ('ULTRAcel II', 7),
    ('LIPOcel II', 8),
    ('IntraGen', 9),
    ('기타소모품', 10)
ON CONFLICT DO NOTHING;

-- 5. Add trigger for updated_at
DROP TRIGGER IF EXISTS update_categories_modtime ON public.categories;
CREATE TRIGGER update_categories_modtime
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
