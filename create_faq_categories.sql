-- Create FAQ Categories table
CREATE TABLE IF NOT EXISTS public.faq_categories (
    id VARCHAR(50) PRIMARY KEY, -- using string ID for backward compatibility ('member', etc)
    label VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Read Access" ON public.faq_categories 
    FOR SELECT USING (true);

CREATE POLICY "Admin Full Access" ON public.faq_categories 
    FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Insert initial data (maintaining existing hardcoded values)
INSERT INTO public.faq_categories (id, label, display_order)
VALUES 
    ('member', '회원관련', 1),
    ('product', '상품관련', 2),
    ('payment', '결제관련', 3),
    ('delivery', '배송관련', 4),
    ('point', '적립금관련', 5),
    ('etc', '기타', 6)
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    display_order = EXCLUDED.display_order;
