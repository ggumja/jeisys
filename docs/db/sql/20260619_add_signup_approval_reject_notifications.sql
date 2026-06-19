-- ============================================================
-- 회원가입 신청 승인 및 반려 SMS/이메일 알림 기본값 설정 추가
-- 작성일: 2026-06-19
-- ============================================================

INSERT INTO shop_settings (key, value, label, type, group_name) VALUES
  ('email_cust_signup_approve', 'true', '고객: 회원가입 승인', 'boolean', 'notification'),
  ('email_cust_signup_reject', 'true', '고객: 회원가입 반려', 'boolean', 'notification'),
  ('sms_cust_signup_approve', 'true', 'SMS 고객: 회원가입 승인', 'boolean', 'notification'),
  ('sms_cust_signup_reject', 'true', 'SMS 고객: 회원가입 반려', 'boolean', 'notification')
ON CONFLICT (key) DO NOTHING;
