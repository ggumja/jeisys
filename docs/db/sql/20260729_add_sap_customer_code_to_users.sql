-- ================================================================
-- Migration: Add sap_customer_code column to users table
-- Description: DB 회원 테이블(users)에 SAP 고객코드(sap_customer_code) 컬럼 추가
-- Date: 2026-07-29
-- ================================================================

-- 1. users 테이블에 sap_customer_code 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS sap_customer_code VARCHAR(50);

-- 2. 컬럼 설명(COMMENT) 추가
COMMENT ON COLUMN users.sap_customer_code IS 'SAP ERP 고객 코드';

-- 3. 검색 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_sap_customer_code ON users(sap_customer_code);
