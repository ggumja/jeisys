-- ============================================================
-- 정기구독 스키마 확장
-- 2026-07-21
-- ============================================================

-- 1. subscriptions 테이블 컬럼 추가
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_quantity INTEGER NOT NULL DEFAULT 0,       -- 총 상품 수량 (100 or 200)
  ADD COLUMN IF NOT EXISTS cycle_months INTEGER NOT NULL DEFAULT 1,         -- 결제 주기 (1/2/3/6)
  ADD COLUMN IF NOT EXISTS total_rounds INTEGER NOT NULL DEFAULT 0,         -- 총 결제·출고 횟수
  ADD COLUMN IF NOT EXISTS qty_per_round INTEGER NOT NULL DEFAULT 0,        -- 회차별 출고 수량 (기본)
  ADD COLUMN IF NOT EXISTS last_round_qty INTEGER NOT NULL DEFAULT 0,       -- 마지막 회차 출고 수량 (잔여)
  ADD COLUMN IF NOT EXISTS current_round INTEGER NOT NULL DEFAULT 0,        -- 현재 완료 회차
  ADD COLUMN IF NOT EXISTS unit_price INTEGER NOT NULL DEFAULT 0,           -- 구독 적용 단가 (할인 후)
  ADD COLUMN IF NOT EXISTS regular_unit_price INTEGER NOT NULL DEFAULT 0,   -- 일반 단가 (할인 전)
  ADD COLUMN IF NOT EXISTS discount_rate NUMERIC(5,2) DEFAULT 0,            -- 적용 할인율 (%)
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejoin_restricted_until DATE;

-- 2. subscription_shipments 테이블 (회차별 스케줄)
CREATE TABLE IF NOT EXISTS public.subscription_shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  round_no INTEGER NOT NULL,             -- 회차 번호 (1, 2, 3...)
  scheduled_date DATE NOT NULL,          -- 결제·출고 예정일
  quantity INTEGER NOT NULL,             -- 해당 회차 출고 수량
  amount INTEGER NOT NULL,              -- 해당 회차 결제 금액
  status VARCHAR DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'shipped', 'failed', 'skipped', 'cancelled')),
  pg_tid VARCHAR,                        -- PG 결제 승인번호
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sub_shipments_subscription
  ON public.subscription_shipments(subscription_id);

CREATE INDEX IF NOT EXISTS idx_sub_shipments_scheduled
  ON public.subscription_shipments(scheduled_date)
  WHERE status = 'pending';

-- 3. subscription_cancellation_requests 테이블 (해지신청 이력)
CREATE TABLE IF NOT EXISTS public.subscription_cancellation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  cancel_reason TEXT NOT NULL,           -- 고객 해지 사유
  shipped_quantity INTEGER NOT NULL DEFAULT 0,   -- 해지 시점 기출고 수량
  paid_amount INTEGER NOT NULL DEFAULT 0,        -- 해지 시점 기납부 총액
  regular_amount INTEGER NOT NULL DEFAULT 0,     -- 기출고 수량 기준 일반가 재산정액
  penalty_amount INTEGER NOT NULL DEFAULT 0,     -- 위약금 = regular_amount - paid_amount (0 이하 시 0)
  status VARCHAR DEFAULT 'pending'
    CHECK (status IN ('pending', 'processed')),
  admin_action VARCHAR                   -- 'charge' | 'waive'
    CHECK (admin_action IN ('charge', 'waive')),
  admin_memo TEXT,                       -- 비청구 시 필수 메모
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cancel_requests_subscription
  ON public.subscription_cancellation_requests(subscription_id);

CREATE INDEX IF NOT EXISTS idx_cancel_requests_status
  ON public.subscription_cancellation_requests(status);

-- 4. RLS 설정
ALTER TABLE public.subscription_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_cancellation_requests ENABLE ROW LEVEL SECURITY;

-- 사용자: 자신의 구독 회차만 조회
CREATE POLICY "Users can view their own subscription shipments"
  ON public.subscription_shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    )
  );

-- 사용자: 자신의 해지신청 조회
CREATE POLICY "Users can view their own cancellation requests"
  ON public.subscription_cancellation_requests FOR SELECT
  USING (user_id = auth.uid());

-- 사용자: 해지신청 생성
CREATE POLICY "Users can create their own cancellation requests"
  ON public.subscription_cancellation_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 5. products 테이블 정기구독 전용 컬럼 추가
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_subscription_product BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_quantities INTEGER[] DEFAULT '{}';
  -- 예: {100, 200} — 선택 가능한 수량 목록

-- 6. 인덱스
CREATE INDEX IF NOT EXISTS idx_products_subscription
  ON public.products(is_subscription_product)
  WHERE is_subscription_product = true;
