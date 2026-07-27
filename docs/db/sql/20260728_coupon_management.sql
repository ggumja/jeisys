-- ==============================================================================
-- 마케팅 관리 > 쿠폰 관리 시스템 DB 마이그레이션 스크립트
-- 작성일: 2026-07-28
-- ==============================================================================

-- 1. 쿠폰 마스터 테이블
CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE,
  discount_type VARCHAR(20) NOT NULL,            -- 'PERCENTAGE' (정률 %) | 'FIXED_AMOUNT' (정액 원)
  discount_value DECIMAL(12,2) NOT NULL,          -- 할인 비율(%) 또는 할인 금액(원)
  target_scope VARCHAR(20) NOT NULL,             -- 'ALL' (전체) | 'CATEGORY' (카테고리) | 'EQUIPMENT' (장비) | 'PRODUCT' (상품)
  min_order_amount DECIMAL(12,2) DEFAULT 0,      -- 최소 주문 금액 제한 (이상 주문시 사용가능)
  max_discount_amount DECIMAL(12,2) DEFAULT NULL, -- 최대 할인 금액 제한 (정률 할인 시 한도)
  issue_type VARCHAR(20) DEFAULT 'MANUAL',        -- 'MANUAL' (수동/일괄발급) | 'DOWNLOAD' (직접다운로드) | 'AUTO' (자동발급)
  total_quantity INT DEFAULT NULL,                -- 총 발급 수량 (NULL: 무제한)
  issued_quantity INT DEFAULT 0,                 -- 발급 완료 수량
  validity_type VARCHAR(20) DEFAULT 'DATE_RANGE', -- 'DATE_RANGE' (고정 기간) | 'DAYS_FROM_ISSUE' (발급후 N일)
  start_date TIMESTAMP NULL,                      -- 고정 유효 시작일
  end_date TIMESTAMP NULL,                        -- 고정 유효 종료일
  valid_days INT DEFAULT NULL,                   -- 발급일 기준 유효 일수 (DAYS_FROM_ISSUE 일 때)
  is_active BOOLEAN DEFAULT TRUE,                -- 활성화 여부
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 쿠폰 타겟 대상 매핑 테이블 (카테고리/장비/상품)
CREATE TABLE IF NOT EXISTS coupon_targets (
  id VARCHAR(36) PRIMARY KEY,
  coupon_id VARCHAR(36) NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL,              -- 'CATEGORY' | 'EQUIPMENT' | 'PRODUCT'
  target_id VARCHAR(100) NOT NULL,               -- 카테고리 ID, 장비 ID, 또는 상품 ID/SKU
  target_name VARCHAR(100) NULL,                 -- 표시용 타겟 명칭 (카테고리명/장비명/상품명)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 회원 보유 쿠폰 발급/사용 이력 테이블
CREATE TABLE IF NOT EXISTS user_coupons (
  id VARCHAR(36) PRIMARY KEY,
  coupon_id VARCHAR(36) NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) DEFAULT 'UNUSED',            -- 'UNUSED' (미사용) | 'USED' (사용완료) | 'EXPIRED' (기간만료)
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL,
  order_id VARCHAR(36) NULL,                     -- 쿠폰이 적용된 주문 ID
  expires_at TIMESTAMP NOT NULL,                  -- 최종 만료 일시
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_targets_coupon ON coupon_targets(coupon_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_status ON user_coupons(user_id, status);
