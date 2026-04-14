-- 쇼핑몰 기본 설정 테이블
CREATE TABLE IF NOT EXISTS shop_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  label      TEXT,
  type       TEXT DEFAULT 'text'
             CHECK (type IN ('text','number','boolean','time')),
  group_name TEXT
             CHECK (group_name IN ('delivery','order','company','bank','credit','grade','notification')),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: 관리자만 수정, 전체 읽기
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "읽기 허용" ON shop_settings
  FOR SELECT USING (true);

CREATE POLICY "관리자 쓰기" ON shop_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- 초기 데이터 삽입
INSERT INTO shop_settings (key, value, label, type, group_name) VALUES
  -- 배송 정책
  ('free_shipping_threshold', '500000', '무료배송 기준금액', 'number', 'delivery'),
  ('base_shipping_fee', '3500', '기본 배송비', 'number', 'delivery'),
  ('jeju_shipping_fee', '3500', '제주/도서 추가 배송비', 'number', 'delivery'),
  ('return_shipping_fee_buyer', '3500', '반품 배송비(구매자 귀책)', 'number', 'delivery'),
  ('exchange_shipping_fee', '7000', '교환 배송비(왕복)', 'number', 'delivery'),
  -- 주문/운영
  ('order_deadline_time', '14:30', '당일 주문 마감', 'time', 'order'),
  ('jeju_deadline_time', '13:00', '제주/배달 마감', 'time', 'order'),
  ('biz_hours_open', '09:00', '고객센터 오픈', 'time', 'order'),
  ('biz_hours_close', '17:00', '고객센터 마감', 'time', 'order'),
  ('vact_deadline_days', '7', '가상계좌 입금 기한(일)', 'number', 'order'),
  ('min_order_amount', '0', '최소 주문 금액', 'number', 'order'),
  -- 회사 정보
  ('company_name', '(주)제이시스메디칼', '회사명', 'text', 'company'),
  ('cs_phone', '070-7435-4927', '고객지원 전화번호', 'text', 'company'),
  ('as_phone', '1544-1639', 'AS 고객센터 번호', 'text', 'company'),
  ('ceo_name', '이라미', '대표자명', 'text', 'company'),
  ('business_number', '424-87-00852', '사업자등록번호', 'text', 'company'),
  ('commerce_number', '제 2022-서울금천-0845호', '통신판매업 신고번호', 'text', 'company'),
  ('privacy_officer', '박종선', '개인정보관리책임자', 'text', 'company'),
  ('company_address', '서울특별시 금천구 가마산로 96', '회사 주소', 'text', 'company'),
  ('email', 'webmaster@jeisys.com', '대표 이메일', 'text', 'company'),
  -- 입금 계좌
  ('bank_name', '우리은행', '은행명', 'text', 'bank'),
  ('bank_account', '1005-803-786090', '계좌번호', 'text', 'bank'),
  ('bank_holder', '(주)제이시스메디칼', '예금주', 'text', 'bank'),
  -- 적립금
  ('credit_enabled', 'true', '적립금 기능', 'boolean', 'credit'),
  ('credit_earn_rate', '1', '구매 적립률(%)', 'number', 'credit'),
  ('credit_min_use', '1000', '최소 사용 금액(원)', 'number', 'credit'),
  ('credit_expiry_days', '0', '유효 기간(일)', 'number', 'credit'),
  -- 회원 등급
  ('grades_enabled', 'true', '회원 등급제 사용', 'boolean', 'grade'),
  ('grade_vip_label', 'VIP', 'VIP 표시명', 'text', 'grade'),
  ('grade_vip_threshold', '50000000', 'VIP 기준 구매액', 'number', 'grade'),
  ('grade_gold_label', 'Gold', 'Gold 표시명', 'text', 'grade'),
  ('grade_gold_threshold', '10000000', 'Gold 기준 구매액', 'number', 'grade'),
  ('grade_silver_label', 'Silver', 'Silver 표시명', 'text', 'grade'),
  ('grade_silver_threshold', '3000000', 'Silver 기준 구매액', 'number', 'grade'),
  -- 이메일 알림
  ('email_sender_name', '제이시스메디칼', '이메일 발신자 이름', 'text', 'notification'),
  ('email_sender_address', 'no-reply@jeisys.com', '이메일 발신자 주소', 'text', 'notification'),
  ('email_admin_new_order', 'true', '관리자: 새 주문', 'boolean', 'notification'),
  ('email_admin_cancel_order', 'true', '관리자: 주문 취소', 'boolean', 'notification'),
  ('email_admin_failed_order', 'true', '관리자: 결제 실패', 'boolean', 'notification'),
  ('email_admin_exchange_request', 'true', '관리자: 교환 요청', 'boolean', 'notification'),
  ('email_admin_return_request', 'true', '관리자: 반품 요청', 'boolean', 'notification'),
  ('email_cust_vact_waiting', 'true', '고객: 가상계좌 대기', 'boolean', 'notification'),
  ('email_cust_order_complete_card', 'true', '고객: 주문완료(카드)', 'boolean', 'notification'),
  ('email_cust_order_complete_vact', 'true', '고객: 주문완료(입금확인)', 'boolean', 'notification'),
  ('email_cust_exchange_received', 'true', '고객: 교환 접수', 'boolean', 'notification'),
  ('email_cust_return_received', 'true', '고객: 반품 접수', 'boolean', 'notification'),
  ('email_cust_exchange_done', 'true', '고객: 교환 완료', 'boolean', 'notification'),
  ('email_cust_return_done', 'true', '고객: 반품 완료', 'boolean', 'notification'),
  ('email_cust_signup', 'true', '고객: 회원가입', 'boolean', 'notification'),
  ('email_cust_password_reset', 'true', '고객: 비밀번호 초기화', 'boolean', 'notification'),
  -- SMS 알림
  ('sms_sender_name', '제이시스메디칼', 'SMS 발신자 이름', 'text', 'notification'),
  ('sms_sender_phone', '070-7435-4927', 'SMS 발신자 번호', 'text', 'notification'),
  ('sms_admin_new_order', 'true', 'SMS 관리자: 새 주문', 'boolean', 'notification'),
  ('sms_admin_cancel_order', 'true', 'SMS 관리자: 취소', 'boolean', 'notification'),
  ('sms_admin_failed_order', 'true', 'SMS 관리자: 실패', 'boolean', 'notification'),
  ('sms_admin_exchange_request', 'true', 'SMS 관리자: 교환', 'boolean', 'notification'),
  ('sms_admin_return_request', 'true', 'SMS 관리자: 반품', 'boolean', 'notification'),
  ('sms_cust_vact_waiting', 'true', 'SMS 고객: 가상계좌 대기', 'boolean', 'notification'),
  ('sms_cust_order_complete_card', 'true', 'SMS 고객: 주문완료(카드)', 'boolean', 'notification'),
  ('sms_cust_order_complete_vact', 'true', 'SMS 고객: 주문완료(입금)', 'boolean', 'notification'),
  ('sms_cust_exchange_received', 'true', 'SMS 고객: 교환 접수', 'boolean', 'notification'),
  ('sms_cust_return_received', 'true', 'SMS 고객: 반품 접수', 'boolean', 'notification'),
  ('sms_cust_exchange_done', 'true', 'SMS 고객: 교환 완료', 'boolean', 'notification'),
  ('sms_cust_return_done', 'true', 'SMS 고객: 반품 완료', 'boolean', 'notification'),
  ('sms_cust_signup', 'true', 'SMS 고객: 회원가입', 'boolean', 'notification'),
  ('sms_cust_password_reset', 'true', 'SMS 고객: 비밀번호 초기화', 'boolean', 'notification')
ON CONFLICT (key) DO NOTHING;
