-- ============================================================
-- SMS 마케팅 관련 테이블
-- 실행: Supabase SQL Editor
-- ============================================================

-- 1. 템플릿 그룹
CREATE TABLE IF NOT EXISTS sms_template_groups (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  sort_order INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 템플릿
CREATE TABLE IF NOT EXISTS sms_templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID        REFERENCES sms_template_groups(id) ON DELETE SET NULL,
  name        TEXT        NOT NULL,
  subject     TEXT,
  message     TEXT        NOT NULL,
  prefix_word TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 발송 이력
CREATE TABLE IF NOT EXISTS sms_send_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  send_type       TEXT        NOT NULL CHECK (send_type IN ('marketing', 'system')),
  purpose         TEXT,            -- 'mkt', 'noti', 'auth', 'order', 'ship' 등
  subject         TEXT,
  message         TEXT        NOT NULL,
  from_phone      TEXT        NOT NULL,
  recipient_count INT         NOT NULL DEFAULT 0,
  success_count   INT         NOT NULL DEFAULT 0,
  fail_count      INT         NOT NULL DEFAULT 0,
  reserved_at     TIMESTAMPTZ,     -- NULL이면 즉시 발송
  sent_at         TIMESTAMPTZ,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','sent','failed','canceled')),
  mts_send_id     TEXT,            -- MTS 측 발송 ID (취소 등에 필요)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 수신 거부 목록 (옵트아웃)
CREATE TABLE IF NOT EXISTS sms_refusal (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT        NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 인덱스
CREATE INDEX IF NOT EXISTS idx_sms_send_history_type_created
  ON sms_send_history (send_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_send_history_status
  ON sms_send_history (status);

CREATE INDEX IF NOT EXISTS idx_sms_templates_group
  ON sms_templates (group_id);

-- ── RLS 정책 (관리자만 접근)
ALTER TABLE sms_template_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_send_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_refusal         ENABLE ROW LEVEL SECURITY;

-- 관리자 정책 (users.role = 'admin')
DROP POLICY IF EXISTS "admin_all_sms_template_groups" ON sms_template_groups;
CREATE POLICY "admin_all_sms_template_groups" ON sms_template_groups FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_all_sms_templates" ON sms_templates;
CREATE POLICY "admin_all_sms_templates" ON sms_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_all_sms_send_history" ON sms_send_history;
CREATE POLICY "admin_all_sms_send_history" ON sms_send_history FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_all_sms_refusal" ON sms_refusal;
CREATE POLICY "admin_all_sms_refusal" ON sms_refusal FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
