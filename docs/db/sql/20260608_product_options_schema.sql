-- ============================================================
-- 상품 옵션 스키마: product_option_groups + product_option_values
-- 확정 사항:
--   - 재고: 상품 공통 재고 사용 (옵션별 재고 없음)
--   - 조합 재고/SKU: 사용 안 함 (추가금액 합산만)
--   - 그룹 최대 5개, 그룹명 직접 입력
-- 실행 위치: Supabase > SQL Editor
-- 작성일: 2026-06-08
-- ============================================================

-- 1. 옵션 그룹 테이블 (예: "색상", "사이즈", "용량")
CREATE TABLE IF NOT EXISTS product_option_groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  display_order INT  NOT NULL DEFAULT 0,
  is_required   BOOLEAN NOT NULL DEFAULT true,
  allow_quantity BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 옵션 값 테이블 (예: "빨강", "S", "500ml")
CREATE TABLE IF NOT EXISTS product_option_values (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id         UUID NOT NULL REFERENCES product_option_groups(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  additional_price INT  NOT NULL DEFAULT 0,
  color_hex        TEXT,         -- 색상 계열 옵션에만 사용 (#RRGGBB)
  display_order    INT  NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_product_option_groups_product_id ON product_option_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_product_option_values_group_id   ON product_option_values(group_id);

-- 4. RLS 활성화
ALTER TABLE product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;

-- 5. 기존 정책 제거 (재실행 시 충돌 방지)
DROP POLICY IF EXISTS "Anyone can read option groups"  ON product_option_groups;
DROP POLICY IF EXISTS "Anyone can read option values"  ON product_option_values;
DROP POLICY IF EXISTS "Authenticated can write option groups" ON product_option_groups;
DROP POLICY IF EXISTS "Authenticated can write option values" ON product_option_values;

-- 6. 읽기 정책 (누구나 조회 가능 — 고객 상세 페이지에서도 사용)
CREATE POLICY "Anyone can read option groups"
  ON product_option_groups FOR SELECT USING (true);

CREATE POLICY "Anyone can read option values"
  ON product_option_values FOR SELECT USING (true);

-- 7. 쓰기 정책 (로그인된 사용자라면 INSERT/UPDATE/DELETE 허용)
--    실제 운영에서는 auth.jwt() ->> 'role' = 'admin' 조건 추가 권장
CREATE POLICY "Authenticated can write option groups"
  ON product_option_groups
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can write option values"
  ON product_option_values
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 기존 테이블이 존재할 경우를 대비하여 컬럼 추가 실행
ALTER TABLE product_option_groups ADD COLUMN IF NOT EXISTS allow_quantity BOOLEAN NOT NULL DEFAULT true;
