-- ============================================================
-- 부분 발송(Partial Shipment) 기능 DB 스키마
-- Supabase SQL Editor에서 순서대로 실행하세요
-- ============================================================

-- STEP 1: order_status Enum에 'partially_shipped' 추가
-- (트랜잭션 없이 단독 실행해야 합니다)
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'partially_shipped';


-- STEP 2: order_items에 shipped_quantity 컬럼 추가
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS shipped_quantity INT DEFAULT 0;


-- STEP 3: shipments 테이블 생성 (발송 이력 헤더)
CREATE TABLE IF NOT EXISTS public.shipments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_number TEXT,
  carrier         TEXT DEFAULT '로젠택배',
  is_partial      BOOLEAN DEFAULT false,
  memo            TEXT,
  shipped_at      TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화 및 조회 정책
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select shipments" ON public.shipments FOR SELECT USING (true);
CREATE POLICY "Allow insert shipments" ON public.shipments FOR INSERT WITH CHECK (true);


-- STEP 4: shipment_items 테이블 생성 (발송 상품 명세)
CREATE TABLE IF NOT EXISTS public.shipment_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id      UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  order_item_id    UUID NOT NULL REFERENCES public.order_items(id),
  product_id       UUID REFERENCES public.products(id),
  shipped_quantity INT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화 및 조회 정책
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select shipment_items" ON public.shipment_items FOR SELECT USING (true);
CREATE POLICY "Allow insert shipment_items" ON public.shipment_items FOR INSERT WITH CHECK (true);


-- STEP 5: notifications 테이블 생성 (고객 알림)
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id),
  order_id   UUID REFERENCES public.orders(id),
  type       TEXT NOT NULL,   -- 'partial_shipped' | 'shipped' | 'delivered' 등
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화 및 정책
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update notifications" ON public.notifications FOR UPDATE USING (true);


-- 완료 확인
SELECT 'Schema migration complete!' AS status;
