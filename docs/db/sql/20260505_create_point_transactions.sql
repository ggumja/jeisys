-- 포인트 내역 테이블 생성
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- 지급 시 양수, 사용/회수 시 음수
    type VARCHAR NOT NULL, -- 'issue' (지급), 'use' (사용), 'revoke' (회수), 'expire' (만료), 'refund' (환불)
    description VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS 활성화
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- 정책: 관리자는 모든 내역 조회/생성 가능, 사용자는 본인 내역만 조회 가능
CREATE POLICY "Users can view own point transactions"
    ON public.point_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all point transactions"
    ON public.point_transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- user_id 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);
