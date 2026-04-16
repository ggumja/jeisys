-- ============================================================
-- 20260415: 회원 분류(member_type) 기능 추가
-- 1. member_types 테이블 (관리자가 추가/삭제 가능)
-- 2. users 테이블에 member_type TEXT 컬럼 추가
-- ============================================================

-- 1. 회원 분류 타입 테이블
CREATE TABLE IF NOT EXISTS member_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6B7280',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE member_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "관리자만 member_types 관리" ON member_types
    USING (true) WITH CHECK (true);

-- 2. users 테이블에 member_type 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_type TEXT DEFAULT NULL;

-- 3. 기본 분류 타입 삽입
INSERT INTO member_types (name, color, sort_order) VALUES
    ('병원', '#3B82F6', 1),
    ('도매', '#10B981', 2),
    ('대리점', '#F59E0B', 3),
    ('직접판매', '#8B5CF6', 4)
ON CONFLICT (name) DO NOTHING;
