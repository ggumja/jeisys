-- 대리주문: cart_items에 custom_price 컬럼 추가
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS custom_price NUMERIC DEFAULT NULL;

-- 어드민이 모든 유저의 cart_items에 접근할 수 있도록 RLS 정책 추가
CREATE POLICY "어드민 cart_items 전체 접근" ON cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );
