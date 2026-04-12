-- 통합 주문 히스토리(Audit Log) 테이블 생성
-- 주문 상태 전이와 관리자 액션을 시간순으로 기록합니다.

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    before_status varchar,
    after_status varchar NOT NULL,
    action_title varchar NOT NULL,
    action_description text,
    admin_id uuid REFERENCES public.users(id), -- 작업을 수행한 관리자 (Supabase Auth 연동 시 auth.uid() 저장)
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at);

-- RLS 정책 설정 (관리자 전용 조회)
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on order_status_history" 
ON public.order_status_history 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can see their own order history" 
ON public.order_status_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_status_history.order_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own order history" 
ON public.order_status_history 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_status_history.order_id AND user_id = auth.uid()
  )
);

COMMENT ON TABLE public.order_status_history IS '주문 상태 변경 및 관리자 액션 로그 (Audit Log)';
COMMENT ON COLUMN public.order_status_history.action_title IS '수행된 작업 제목 (예: 입금 확인, 배송 시작, 클레임 승인)';
COMMENT ON COLUMN public.order_status_history.action_description IS '상세 내용 (송장번호, 취소사유 등)';
