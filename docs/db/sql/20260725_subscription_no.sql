-- ============================================================
-- 구독번호(subscription_no) 컬럼 및 자동생성 트리거
-- 포맷: YYMMDD(6자리) + 일련번호(4자리)  예) 2607230001
-- ============================================================

-- 1. 글로벌 시퀀스 생성
CREATE SEQUENCE IF NOT EXISTS subscription_seq START 1;

-- 2. 컬럼 추가
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS subscription_no VARCHAR(20);

-- 3. 자동생성 함수
CREATE OR REPLACE FUNCTION fn_set_subscription_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_no IS NULL THEN
    NEW.subscription_no :=
      TO_CHAR(
        COALESCE(NEW.created_at, NOW()) AT TIME ZONE 'Asia/Seoul',
        'YYMMDD'
      )
      || LPAD(nextval('subscription_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 등록 (INSERT 시 실행)
DROP TRIGGER IF EXISTS trg_subscription_no ON subscriptions;
CREATE TRIGGER trg_subscription_no
  BEFORE INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_subscription_no();

-- 5. 기존 데이터 소급 적용 (created_at 오름차순으로 번호 부여)
-- PostgreSQL은 UPDATE에서 ORDER BY를 지원하지 않으므로 CTE 사용
WITH ordered AS (
  SELECT id,
         TO_CHAR(created_at AT TIME ZONE 'Asia/Seoul', 'YYMMDD')
           || LPAD(nextval('subscription_seq')::TEXT, 4, '0') AS new_no
  FROM subscriptions
  WHERE subscription_no IS NULL
  ORDER BY created_at ASC
)
UPDATE subscriptions s
SET subscription_no = o.new_no
FROM ordered o
WHERE s.id = o.id;
