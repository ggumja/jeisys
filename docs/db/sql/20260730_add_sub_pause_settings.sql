-- ============================================================
-- 정기공급 일시정지 설정 추가
-- Supabase Dashboard > SQL Editor 에서 실행
-- ============================================================

-- 1. subscriptions 테이블에 pause_count 컬럼 추가
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS pause_count INTEGER NOT NULL DEFAULT 0;

-- 2. shop_settings에 정기공급 일시정지 기본값 삽입
INSERT INTO shop_settings (key, value)
VALUES 
  ('sub_pause_max_count', '2'),
  ('sub_pause_max_days', '30')
ON CONFLICT (key) DO NOTHING;

-- 3. 확인
SELECT key, value FROM shop_settings WHERE key LIKE 'sub_pause%';
SELECT column_name, data_type, column_default FROM information_schema.columns 
WHERE table_name = 'subscriptions' AND column_name = 'pause_count';
