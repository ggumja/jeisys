-- ============================================================
-- 정기구독 RLS 정책 보완
-- 2026-07-21
-- 문제: subscriptions INSERT 403 Forbidden
-- ============================================================

-- 1. subscriptions 테이블 RLS 확인 및 활성화
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 사용자: 자신의 구독 조회
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions'
      AND policyname = 'Users can view their own subscriptions'
  ) THEN
    CREATE POLICY "Users can view their own subscriptions"
      ON public.subscriptions FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 사용자: 자신의 구독 생성 (바로구매 시 orderService에서 insert)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions'
      AND policyname = 'Users can insert their own subscriptions'
  ) THEN
    CREATE POLICY "Users can insert their own subscriptions"
      ON public.subscriptions FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 사용자: 자신의 구독 상태 변경 (일시정지/재개/해지)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions'
      AND policyname = 'Users can update their own subscriptions'
  ) THEN
    CREATE POLICY "Users can update their own subscriptions"
      ON public.subscriptions FOR UPDATE
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 관리자: 전체 구독 조회/수정
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions'
      AND policyname = 'Admins can manage all subscriptions'
  ) THEN
    CREATE POLICY "Admins can manage all subscriptions"
      ON public.subscriptions FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      );
  END IF;
END $$;

-- 2. subscription_shipments INSERT 정책 추가
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_shipments'
      AND policyname = 'Users can insert their own shipment schedules'
  ) THEN
    CREATE POLICY "Users can insert their own shipment schedules"
      ON public.subscription_shipments FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.subscriptions s
          WHERE s.id = subscription_id AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 관리자: 전체 shipment 관리
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_shipments'
      AND policyname = 'Admins can manage all shipment schedules'
  ) THEN
    CREATE POLICY "Admins can manage all shipment schedules"
      ON public.subscription_shipments FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      );
  END IF;
END $$;

-- 관리자: subscription_cancellation_requests 전체 관리
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_cancellation_requests'
      AND policyname = 'Admins can manage all cancellation requests'
  ) THEN
    CREATE POLICY "Admins can manage all cancellation requests"
      ON public.subscription_cancellation_requests FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      );
  END IF;
END $$;
