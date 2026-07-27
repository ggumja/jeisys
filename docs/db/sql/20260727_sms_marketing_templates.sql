-- =================================================================
-- 문자 마케팅 기본 템플릿 그룹 및 표준 템플릿 시드 데이터 SQL
-- 파일명: docs/db/sql/20260727_sms_marketing_templates.sql
-- =================================================================

-- 1. sms_template_groups 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS public.sms_template_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. sms_templates 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.sms_template_groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  prefix_word VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 기본 마케팅 템플릿 그룹 및 템플릿 시드 데이터
WITH group_promo AS (
  INSERT INTO public.sms_template_groups (name, sort_order)
  VALUES ('프로모션/쿠폰', 1)
  RETURNING id
),
group_sub AS (
  INSERT INTO public.sms_template_groups (name, sort_order)
  VALUES ('정기배송 혜택', 2)
  RETURNING id
),
group_credit AS (
  INSERT INTO public.sms_template_groups (name, sort_order)
  VALUES ('크레딧/소멸안내', 3)
  RETURNING id
),
group_product AS (
  INSERT INTO public.sms_template_groups (name, sort_order)
  VALUES ('신제품/장비', 4)
  RETURNING id
),
group_care AS (
  INSERT INTO public.sms_template_groups (name, sort_order)
  VALUES ('고객케어/안내', 5)
  RETURNING id
)
INSERT INTO public.sms_templates (group_id, name, subject, message, prefix_word)
VALUES
  -- 1) 프로모션/쿠폰
  ((SELECT id FROM group_promo), '[프로모션] 이달의 특별 할인 쿠폰 안내', '[제이시스 메디컬] 이달의 원장님 전용 혜택 쿠폰이 발급되었습니다.', 
   '[광고] [제이시스 메디컬] 특별 프로모션 안내

안녕하세요, {병원명} {고객명} 원장님.

제이시스 메디컬을 이용해 주셔서 진심으로 감사드립니다.
원장님을 위한 혜택 쿠폰이 발급되었습니다.

■ 발급 혜택: 전 품목 5% 추가 할인 쿠폰
■ 사용기한: 이달 말일까지
■ 쿠폰 확인: 쇼핑몰 로그인 > 마이페이지 > 쿠폰함

지금 바로 쇼핑몰에서 확인해 보세요!
무료거부 080-000-0000', '[광고]'),

  -- 2) 정기배송 혜택
  ((SELECT id FROM group_sub), '[정기배송] 소모품 정기배송 특별 혜택 안내', '[제이시스 메디컬] 소모품 정기배송으로 비용 절감과 편의를 누려보세요!', 
   '[광고] [제이시스 메디컬] 정기배송 안내

안녕하세요, {병원명} {고객명} 원장님.

병원 운영에 필수적인 소모품, 매번 새로 주문하기 번거로우셨나요?
제이시스 정기배송 서비스로 편리하게 관리해 보세요!

■ 정기배송 혜택:
1. 정기배송 전용 단가 할인 적용
2. 지정 날짜에 자동 결제 및 배송
3. 언제든지 회차 변경 및 해지 가능

자세한 내용은 제이시스 쇼핑몰 정기배송 메뉴에서 확인하실 수 있습니다.
무료거부 080-000-0000', '[광고]'),

  -- 3) 크레딧/소멸안내
  ((SELECT id FROM group_credit), '[크레딧] 보유 크레딧 만료 예정 안내', '[제이시스 메디컬] 원장님의 소멸 예정 크레딧을 안내해 드립니다.', 
   '[광고] [제이시스 메디컬] 크레딧 만료 예정 안내

안녕하세요, {병원명} {고객명} 원장님.

원장님께서 보유 중이신 장비 전용 크레딧 중 일부가 곧 만료될 예정입니다.

■ 소멸 예정 크레딧: ₩{크레딧잔액}
■ 만료 예정일: {만료일}
■ 사용 가능 품목: 소모품 및 팁 구매 시 사용 가능

소멸 전 쇼핑몰에서 크레딧을 활용하여 필요한 소모품을 주문해 보세요.
무료거부 080-000-0000', '[광고]'),

  -- 4) 신제품/장비
  ((SELECT id FROM group_product), '[신제품] 신규 팁 출시 및 데모 신청 안내', '[제이시스 메디컬] 신제품 출시 및 장비 데모 신청 안내드립니다.', 
   '[광고] [제이시스 메디컬] 신제품 출시 안내

안녕하세요, {병원명} {고객명} 원장님.

제이시스 메디컬의 신규 팁/소모품 라인업이 새롭게 출시되었습니다.

■ 신제품 특징: 시술 효율성 향상 및 프리미엄 라인업 구성
■ 혜택: 신제품 출시 기념 구매 시 추가 포인트 적립
■ 장비 데모 신청: 쇼핑몰 커뮤니케이션 > 장비 데모 신청 메뉴

원장님의 진료에 최선의 만족을 드리겠습니다.
무료거부 080-000-0000', '[광고]'),

  -- 5) 고객케어/안내
  ((SELECT id FROM group_care), '[재구매권유] 소모품 정기 점검 및 재주문 안내', '[제이시스 메디컬] 소모품 권장 사용량 및 재주문 안내', 
   '[제이시스 메디컬] 소모품 재주문 안내

안녕하세요, {병원명} {고객명} 원장님.

원장님의 안정적인 시술 운영을 위해 소모품 재고 상태를 점검해 보세요.
필요하신 팁 및 카트리지는 제이시스 공식 쇼핑몰에서 바로 주문하실 수 있습니다.

감사합니다.', null);
