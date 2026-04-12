-- ============================================
-- Payment History Management Setup
-- ============================================

-- 1. Payment History Table
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    transaction_type VARCHAR NOT NULL, -- PAYMENT, REFUND, PARTIAL_REFUND
    amount DECIMAL NOT NULL,
    pg_tid VARCHAR,                    -- PG 거래 고유 번호
    status VARCHAR DEFAULT 'SUCCESS' NOT NULL, -- SUCCESS, FAILURE
    reason TEXT,                       -- 성공/실패 사유 또는 취소 사유
    method VARCHAR,                    -- 결제 수단 (credit, virtual)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RLS Enablement
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Admin can manage all history
CREATE POLICY "Admins can manage payment history" 
ON public.payment_history 
FOR ALL 
USING (auth.jwt() ->> 'email' LIKE '%@jeisys.com' OR auth.jwt() ->> 'email' = 'admin@example.com');

-- Users can view their own payment history
CREATE POLICY "Users can view their own payment history" 
ON public.payment_history 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = payment_history.order_id 
        AND orders.user_id = auth.uid()
    )
);

-- 4. Initial Migration: Record existing payments in history
INSERT INTO public.payment_history (order_id, transaction_type, amount, pg_tid, status, method, created_at)
SELECT id, 'PAYMENT', total_amount, pg_tid, 'SUCCESS', payment_method, ordered_at
FROM public.orders
WHERE pg_tid IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. Indexing
CREATE INDEX IF NOT EXISTS idx_payment_history_order ON public.payment_history(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_tid ON public.payment_history(pg_tid);
