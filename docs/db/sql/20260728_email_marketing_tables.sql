-- =================================================================
-- 마케팅 이메일(Email) 관리 및 템플릿/발송 이력 테이블 생성 & 시드 데이터
-- 파일 경로: docs/db/sql/20260728_email_marketing_tables.sql
-- =================================================================

-- 1. 이메일 템플릿 그룹 테이블
CREATE TABLE IF NOT EXISTS email_template_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 이메일 템플릿 테이블
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES email_template_groups(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 이메일 발송 이력 테이블
CREATE TABLE IF NOT EXISTS email_send_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  send_type VARCHAR(20) DEFAULT 'marketing',
  purpose VARCHAR(20) DEFAULT 'mkt',
  subject VARCHAR(200),
  message TEXT NOT NULL,
  from_email VARCHAR(100) NOT NULL,
  recipient_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  fail_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'sent', -- pending, sent, failed, canceled
  reserved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 시드 데이터 입력 ──────────────────────────────────────────────────

-- 기본 템플릿 그룹 4종
INSERT INTO email_template_groups (id, name, sort_order)
VALUES 
  ('a1111111-1111-4111-a111-111111111111', '프로모션/쿠폰', 1),
  ('a2222222-2222-4222-a222-222222222222', '신제품/데모', 2),
  ('a3333333-3333-4333-a333-333333333333', '정기배송 혜택', 3),
  ('a4444444-4444-4444-a444-444444444444', '고객케어/안내', 4)
ON CONFLICT (id) DO NOTHING;

-- 기본 이메일 템플릿 4종 (HTML 포맷)
INSERT INTO email_templates (id, group_id, name, subject, message)
VALUES
(
  'b1111111-1111-4111-b111-111111111111',
  'a1111111-1111-4111-a111-111111111111',
  '[프로모션] 제이시스 메디컬 특별 할인 쿠폰 안내',
  '[제이시스몰] {고객명} 원장님만을 위한 이달의 특별 쿠폰이 발급되었습니다.',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;"><div style="background-color: #2563eb; padding: 24px; text-align: center;"><h1 style="color: #ffffff; margin: 0; font-size: 20px;">Jeisys Medical</h1></div><div style="padding: 24px; background-color: #ffffff;"><h2 style="color: #111827; font-size: 18px; margin-top: 0;">안녕하세요, {병원명} {고객명} 원장님!</h2><p style="color: #4b5563; font-size: 14px; line-line: 1.6;">제이시스 메디컬을 이용해 주시는 원장님께 감사의 마음을 담아 특별 전용 할인 쿠폰을 발행해 드렸습니다.</p><div style="background-color: #eff6ff; border: 1px dashed #2563eb; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;"><span style="color: #2563eb; font-weight: bold; font-size: 14px;">전품목 10% 추가 할인 쿠폰</span><div style="font-size: 22px; font-weight: bold; color: #1e40af; margin-top: 6px;">[ JEISYSVIP10 ]</div></div><div style="text-align: center; margin-top: 28px;"><a href="https://jeisys.com" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">쇼핑몰에서 쿠폰 사용하기</a></div></div><div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;"><p style="margin: 0;">본 메일은 수신동의를 하신 회원님께 발송되는 마케팅 메일입니다.</p></div></div>'
),
(
  'b2222222-2222-4222-b222-222222222222',
  'a2222222-2222-4222-a222-222222222222',
  '[신제품] 신규 팁 출시 및 장비 데모 신청 안내',
  '[제이시스] 신제품 공식 출시 및 병원 데모 신청 안내드립니다.',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;"><div style="background-color: #111827; padding: 24px; text-align: center;"><h1 style="color: #ffffff; margin: 0; font-size: 20px;">Jeisys Innovation</h1></div><div style="padding: 24px; background-color: #ffffff;"><h2 style="color: #111827; font-size: 18px; margin-top: 0;">{병원명} {고객명} 원장님, 혁신적인 신제품을 경험해 보세요!</h2><p style="color: #4b5563; font-size: 14px; line-height: 1.6;">제이시스 메디컬의 신규 시술 팁 및 최신 라인업이 공식 출시되었습니다. 원장님의 병원에서 직접 체험해 보실 수 있도록 데모 시연 서비스를 제공해 드립니다.</p><ul style="color: #374151; font-size: 14px; line-height: 1.8; padding-left: 20px;"><li>정밀하고 빠른 시술 모드 지원</li><li>원장님 및 고객 맞춤형 팁 라인업 확충</li><li>데모 신청 시 전용 소모품 체험 팩 증정</li></ul><div style="text-align: center; margin-top: 28px;"><a href="https://jeisys.com" style="background-color: #111827; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">장비 데모 신청하기</a></div></div><div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;"><p style="margin: 0;">© Jeisys Medical Inc. All rights reserved.</p></div></div>'
),
(
  'b3333333-3333-4333-b333-333333333333',
  'a3333333-3333-4333-a333-333333333333',
  '[정기배송] 소모품 정기 점검 및 자동배송 혜택',
  '[제이시스] {고객명} 원장님, 소모품 정기배송으로 최대 15% 혜택을 받으세요.',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;"><div style="background-color: #059669; padding: 24px; text-align: center;"><h1 style="color: #ffffff; margin: 0; font-size: 20px;">Jeisys Regular Service</h1></div><div style="padding: 24px; background-color: #ffffff;"><h2 style="color: #111827; font-size: 18px; margin-top: 0;">안정적인 병원 운영을 위한 정기배송 서비스</h2><p style="color: #4b5563; font-size: 14px; line-height: 1.6;">{병원명}의 소모품 재고 걱정 없이, 원하는 날짜에 맞춰 정기적으로 배송받으실 수 있습니다.</p><div style="background-color: #ecfdf5; border-left: 4px solid #059669; padding: 14px; margin: 20px 0;"><div style="color: #065f46; font-weight: bold; font-size: 14px;">정기배송 회원 전용 혜택</div><div style="color: #047857; font-size: 13px; margin-top: 4px;">• 소모품 전품목 추가 10~15% 할인<br/>• 무료배송 및 정기 점검 서비스 제공</div></div><div style="text-align: center; margin-top: 28px;"><a href="https://jeisys.com" style="background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">정기배송 신청하기</a></div></div></div>'
),
(
  'b4444444-4444-4444-b444-444444444444',
  'a4444444-4444-4444-a444-444444444444',
  '[고객케어] 제이시스 메디컬 서비스 안내',
  '[제이시스] 원장님을 위한 1:1 전담 고객케어 및 점검 안내',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;"><div style="background-color: #4f46e5; padding: 24px; text-align: center;"><h1 style="color: #ffffff; margin: 0; font-size: 20px;">Jeisys Doctor Care</h1></div><div style="padding: 24px; background-color: #ffffff;"><h2 style="color: #111827; font-size: 18px; margin-top: 0;">안녕하세요, {병원명} {고객명} 원장님.</h2><p style="color: #4b5563; font-size: 14px; line-height: 1.6;">제이시스 메디컬 고객케어 팀입니다. 원장님께서 사용 중이신 장비 및 소모품 관리에 관한 1:1 전담 문의 및 정기 점검 서비스를 안내해 드립니다.</p><div style="text-align: center; margin-top: 28px;"><a href="https://jeisys.com" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">고객 센터 문의하기</a></div></div></div>'
)
ON CONFLICT (id) DO NOTHING;
