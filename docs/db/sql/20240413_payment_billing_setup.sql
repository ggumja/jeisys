-- ============================================
-- Payment & Billing Feature Setup
-- ============================================

-- 1. User Payment Methods Table
CREATE TABLE IF NOT EXISTS public.user_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    provider VARCHAR DEFAULT 'kicc' NOT NULL,
    billing_key VARCHAR NOT NULL, -- 암호화된 빌링 토큰
    card_name VARCHAR,            -- 카드사 이름 (예: 신한카드)
    card_number_masked VARCHAR,   -- 마스킹된 카드번호 (예: 4402-****-****-1234)
    alias VARCHAR,                -- 카드 별칭 (예: 주력법인카드, 비상용카드)
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    original_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
    billing_key_id UUID REFERENCES public.user_payment_methods(id) ON DELETE SET NULL,
    cycle_days INTEGER NOT NULL, -- 결제 주기 (예: 30, 60, 90)
    next_billing_date DATE NOT NULL,
    last_billing_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Enablement
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can manage their own payment methods
CREATE POLICY "Users can manage their own payment methods" 
ON public.user_payment_methods 
FOR ALL 
USING (auth.uid() = user_id);

-- Users can see their own subscriptions
CREATE POLICY "Users can see their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Service/Admin can manage all subscriptions (Assuming service_role or admin user)
-- Note: In Supabase, admins usually have separate access or bypass RLS if using service keys.

-- 4. Initial Indexing
CREATE INDEX idx_payment_methods_user ON public.user_payment_methods(user_id);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_next_billing ON public.subscriptions(next_billing_date) WHERE status = 'active';

-- 6. Update Orders Table for Payments
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pg_tid VARCHAR;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vact_bank_name VARCHAR;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vact_num VARCHAR;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vact_name VARCHAR;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vact_input_deadline TIMESTAMP;

-- Updated At Trigger for Subscriptions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
