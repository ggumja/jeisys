-- shipping_addresses 테이블 생성
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT '배송지',       -- 별칭 (예: 병원, 집, 서울 창고)
  recipient TEXT NOT NULL,                   -- 수령인
  phone TEXT NOT NULL,                       -- 연락처
  zip_code TEXT NOT NULL DEFAULT '',         -- 우편번호
  address TEXT NOT NULL,                     -- 기본주소
  address_detail TEXT DEFAULT '',            -- 상세주소
  is_default BOOLEAN NOT NULL DEFAULT FALSE, -- 기본 배송지 여부
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

-- 본인 주소만 조회
CREATE POLICY "addresses_select_own"
  ON shipping_addresses FOR SELECT
  USING (user_id = auth.uid());

-- 본인 주소만 등록
CREATE POLICY "addresses_insert_own"
  ON shipping_addresses FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 본인 주소만 수정
CREATE POLICY "addresses_update_own"
  ON shipping_addresses FOR UPDATE
  USING (user_id = auth.uid());

-- 본인 주소만 삭제
CREATE POLICY "addresses_delete_own"
  ON shipping_addresses FOR DELETE
  USING (user_id = auth.uid());

-- 어드민 전체 조회/관리
CREATE POLICY "addresses_admin_all"
  ON shipping_addresses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
