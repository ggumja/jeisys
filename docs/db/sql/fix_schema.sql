-- ============================================================
-- 부분 발송(Partial Shipment) 복구용 SQL (안전 실행 버전)
-- 에러가 났던 이전 환경을 깔끔하게 복구하고 다시 셋업합니다.
-- ============================================================

-- 1. Enum 타입에 'partially_shipped' 추가
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'order_status' AND e.enumlabel = 'partially_shipped') THEN
        ALTER TYPE order_status ADD VALUE 'partially_shipped';
    END IF;
END $$;

-- 2. shipments 테이블
CREATE TABLE IF NOT EXISTS public.shipments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_number TEXT, -- 다중 송장일 경우 쉼표(,)로 구분되어 저장됩니다
  carrier         TEXT DEFAULT '로젠택배',
  is_partial      BOOLEAN DEFAULT false,
  memo            TEXT,
  shipped_at      TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 정책 초기화 후 재할당
DROP POLICY IF EXISTS "Allow select shipments" ON public.shipments;
DROP POLICY IF EXISTS "Allow insert shipments" ON public.shipments;

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select shipments" ON public.shipments FOR SELECT USING (true);
CREATE POLICY "Allow insert shipments" ON public.shipments FOR INSERT WITH CHECK (true);


-- 3. shipment_items 테이블
CREATE TABLE IF NOT EXISTS public.shipment_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id      UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  order_item_id    UUID NOT NULL REFERENCES public.order_items(id),
  product_id       UUID REFERENCES public.products(id),
  shipped_quantity INT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- 정책 초기화 후 재할당
DROP POLICY IF EXISTS "Allow select shipment_items" ON public.shipment_items;
DROP POLICY IF EXISTS "Allow insert shipment_items" ON public.shipment_items;

ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select shipment_items" ON public.shipment_items FOR SELECT USING (true);
CREATE POLICY "Allow insert shipment_items" ON public.shipment_items FOR INSERT WITH CHECK (true);


-- 4. order_items 컬럼 추가
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS shipped_quantity INT DEFAULT 0;

SELECT '복구 및 셋업 완료!' AS result;
