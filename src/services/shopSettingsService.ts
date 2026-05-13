import { supabase } from '../lib/supabaseClient';

export interface ShopSetting {
  key: string;
  value: string;
  label?: string;
  type: 'text' | 'number' | 'boolean' | 'time';
  group_name: string;
}

// 기본값 정의 (DB에 없을 경우 폴백)
const DEFAULTS: Record<string, string> = {
  // 배송 정책
  free_shipping_threshold: '500000',
  base_shipping_fee: '3500',
  jeju_shipping_fee: '3500',
  return_shipping_fee_buyer: '3500',
  exchange_shipping_fee: '7000',
  // 주문/운영
  order_deadline_time: '14:30',
  jeju_deadline_time: '13:00',
  biz_hours_open: '09:00',
  biz_hours_close: '17:00',
  vact_deadline_days: '7',
  min_order_amount: '0',
  // 회사 정보
  company_name: '(주)제이시스메디칼',
  cs_phone: '070-7435-4927',
  as_phone: '1544-1639',
  ceo_name: '이라미',
  business_number: '424-87-00852',
  commerce_number: '제 2022-서울금천-0845호',
  privacy_officer: '박종선',
  company_address: '서울특별시 금천구 가마산로 96',
  email: 'webmaster@jeisys.com',
  // 입금 계좌
  bank_name: '우리은행',
  bank_account: '1005-803-786090',
  bank_holder: '(주)제이시스메디칼',
  // 적립금
  credit_enabled: 'true',
  credit_earn_rate: '1',
  credit_min_use: '1000',
  credit_expiry_days: '0',
  // 회원 등급
  grades_enabled: 'true',
  grade_vip_threshold: '50000000',
  grade_vip_label: 'VIP',
  grade_gold_threshold: '10000000',
  grade_gold_label: 'Gold',
  grade_silver_threshold: '3000000',
  grade_silver_label: 'Silver',
  // 이메일 알림 발신자
  email_sender_name: '제이시스메디칼',
  email_sender_address: 'no-reply@jeisys.com',
  // 이메일 알림 관리자
  email_admin_new_order: 'true',
  email_admin_new_order_subject: '[{{shop_name}}] 새로운 주문이 접수되었습니다. (주문번호: {{order_number}})',
  email_admin_new_order_template: '<h3>새로운 주문 접수 안내</h3><p><b>{{customer_name}}</b>님으로부터 새로운 주문이 접수되었습니다.</p><p>주문번호: {{order_number}}<br>결제금액: {{payment_amount}}원<br>결제수단: {{payment_method}}</p>',
  email_admin_cancel_order: 'true',
  email_admin_cancel_order_subject: '[{{shop_name}}] 주문이 취소되었습니다. (주문번호: {{order_number}})',
  email_admin_cancel_order_template: '<h3>주문 취소 안내</h3><p><b>{{customer_name}}</b>님의 주문이 취소되었습니다.</p><p>주문번호: {{order_number}}</p>',
  email_admin_failed_order: 'true',
  email_admin_failed_order_subject: '[{{shop_name}}] 주문/결제가 실패하였습니다. (주문번호: {{order_number}})',
  email_admin_failed_order_template: '<h3>주문/결제 실패 안내</h3><p><b>{{customer_name}}</b>님의 결제가 실패하였습니다.</p><p>주문번호: {{order_number}}</p>',
  email_admin_exchange_request: 'true',
  email_admin_exchange_request_subject: '[{{shop_name}}] 교환 요청이 접수되었습니다. (주문번호: {{order_number}})',
  email_admin_exchange_request_template: '<h3>교환 요청 안내</h3><p><b>{{customer_name}}</b>님으로부터 교환 요청이 접수되었습니다.</p><p>주문번호: {{order_number}}</p>',
  email_admin_return_request: 'true',
  email_admin_return_request_subject: '[{{shop_name}}] 반품 요청이 접수되었습니다. (주문번호: {{order_number}})',
  email_admin_return_request_template: '<h3>반품 요청 안내</h3><p><b>{{customer_name}}</b>님으로부터 반품 요청이 접수되었습니다.</p><p>주문번호: {{order_number}}</p>',
  // 이메일 알림 고객 - 결제
  email_cust_vact_waiting: 'true',
  email_cust_vact_waiting_subject: '[{{shop_name}}] 주문해주셔서 감사합니다! 가상계좌 입금 안내입니다.',
  email_cust_vact_waiting_template: `<div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
  <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">가상계좌 입금 안내 🏦</h2>
  <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
  <p style="font-size: 16px; margin-bottom: 25px;">저희 <b>{{shop_name}}</b>을(를) 찾아주셔서 진심으로 감사드립니다.<br>아래 계좌로 기한 내에 입금해주시면 정상적으로 주문 결제가 완료됩니다.</p>
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
    <h3 style="margin-top: 0; font-size: 16px; margin-bottom: 15px;">입금 상세 정보</h3>
    <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
      <li style="margin-bottom: 10px;"><strong>주문 번호 :</strong> <span style="color: #0056b3;">{{order_number}}</span></li>
      <li style="margin-bottom: 10px;"><strong>입금 금액 :</strong> <b>{{payment_amount}}원</b></li>
      <li style="margin-bottom: 10px;"><strong>입금 은행 :</strong> {{vact_bank}}</li>
      <li><strong>계좌 번호 :</strong> <b>{{vact_account}}</b></li>
    </ul>
  </div>
  <p style="font-size: 14px; color: #666; margin-bottom: 30px;">기한 내 입금되지 않을 경우 주문이 자동으로 취소될 수 있으니 유의해 주세요.</p>
  <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #888;">
    <p style="margin: 0;">본 메일은 발신 전용 메일입니다. 문의 사항이 있으시면 고객센터를 이용해 주세요.</p>
    <p style="margin: 5px 0 0 0;">감사합니다.</p>
  </div>
</div>`,
  email_cust_order_complete_card: 'true',
  email_cust_order_complete_card_subject: '[{{shop_name}}] 결제가 성공적으로 완료되었습니다! 🎉',
  email_cust_order_complete_card_template: `<div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
  <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">결제 완료 안내 🛍️</h2>
  <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
  <p style="font-size: 16px; margin-bottom: 25px;">저희 <b>{{shop_name}}</b>에서 소중한 주문을 해주셔서 진심으로 감사드립니다.<br>주문하신 내역의 결제가 정상적으로 완료되었습니다.</p>
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
    <h3 style="margin-top: 0; font-size: 16px; margin-bottom: 15px;">주문 상세 정보</h3>
    <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
      <li style="margin-bottom: 10px;"><strong>주문 번호 :</strong> <span style="color: #0056b3;">{{order_number}}</span></li>
      <li style="margin-bottom: 10px;"><strong>결제 금액 :</strong> <b>{{payment_amount}}원</b></li>
      <li><strong>결제 수단 :</strong> {{payment_method}}</li>
    </ul>
  </div>
  <p style="font-size: 15px; color: #444; margin-bottom: 30px;">상품이 꼼꼼하게 포장되어 발송될 예정입니다. 배송이 시작되면 송장 번호와 함께 다시 한번 안내해 드리겠습니다.</p>
  <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #888;">
    <p style="margin: 0;">본 메일은 발신 전용 메일입니다. 문의 사항이 있으시면 언제든지 고객센터를 이용해 주세요.</p>
    <p style="margin: 5px 0 0 0;">오늘도 행복한 하루 보내시길 바랍니다! 감사합니다.</p>
  </div>
</div>`,
  email_cust_order_complete_vact: 'true',
  email_cust_order_complete_vact_subject: '[{{shop_name}}] 입금이 성공적으로 확인되었습니다! 🎉',
  email_cust_order_complete_vact_template: `<div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
  <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">입금 확인 완료 💸</h2>
  <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
  <p style="font-size: 16px; margin-bottom: 25px;">보내주신 결제 대금이 정상적으로 입금 확인되었습니다.<br><b>{{shop_name}}</b>을(를) 이용해 주셔서 진심으로 감사드립니다!</p>
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
    <h3 style="margin-top: 0; font-size: 16px; margin-bottom: 15px;">주문 정보</h3>
    <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
      <li style="margin-bottom: 10px;"><strong>주문 번호 :</strong> <span style="color: #0056b3;">{{order_number}}</span></li>
      <li style="margin-bottom: 10px;"><strong>확인 금액 :</strong> <b>{{payment_amount}}원</b></li>
    </ul>
  </div>
  <p style="font-size: 15px; color: #444; margin-bottom: 30px;">이제 곧 상품 준비가 시작됩니다. 택배가 발송되는 즉시 배송 안내 메일을 보내드릴 예정입니다.</p>
  <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #888;">
    <p style="margin: 0;">감사합니다.</p>
  </div>
</div>`,
  email_cust_exchange_received: 'true',
  email_cust_exchange_received_subject: '[{{shop_name}}] 교환 요청이 정상적으로 접수되었습니다.',
  email_cust_exchange_received_template: `<div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
  <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">교환 접수 안내 🔄</h2>
  <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
  <p style="font-size: 16px; margin-bottom: 25px;">요청하신 상품 교환 접수가 정상적으로 완료되었습니다.<br>이용에 불편을 드려 죄송한 마음을 전하며, 최대한 신속하고 정확하게 처리해 드리겠습니다.</p>
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
    <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
      <li style="margin-bottom: 10px;"><strong>주문 번호 :</strong> <span style="color: #0056b3;">{{order_number}}</span></li>
    </ul>
  </div>
  <p style="font-size: 14px; color: #666; margin-bottom: 30px;">수거 예정인 상품은 파손되지 않도록 잘 포장하여 기사님께 전달해 주시면 감사하겠습니다.</p>
</div>`,
  email_cust_return_received: 'true',
  email_cust_return_received_subject: '[{{shop_name}}] 반품 요청이 정상적으로 접수되었습니다.',
  email_cust_return_received_template: `<div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
  <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">반품 접수 안내 ↩️</h2>
  <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
  <p style="font-size: 16px; margin-bottom: 25px;">요청하신 상품 반품 접수가 정상적으로 완료되었습니다.<br>기대하시고 주문하셨을 텐데 불편을 드려 대단히 죄송합니다.</p>
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
    <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
      <li style="margin-bottom: 10px;"><strong>주문 번호 :</strong> <span style="color: #0056b3;">{{order_number}}</span></li>
    </ul>
  </div>
  <p style="font-size: 14px; color: #666; margin-bottom: 30px;">회수된 상품이 저희 측에 도착하여 검수된 후, 환불 처리가 진행될 예정입니다. 최대한 빠르게 처리해 드리겠습니다.</p>
</div>`,
  email_cust_exchange_done: 'true',
  email_cust_exchange_done_subject: '[{{shop_name}}] 교환 상품 발송 처리가 완료되었습니다.',
  email_cust_exchange_done_template: `<div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
  <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">교환 처리 완료 ✅</h2>
  <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
  <p style="font-size: 16px; margin-bottom: 25px;">오래 기다리셨습니다! 요청하신 상품 교환 처리가 무사히 완료되어, 새로운 상품으로 발송해 드렸습니다.</p>
  <p style="font-size: 15px; color: #444; margin-bottom: 30px;">이번에는 만족스러운 상품이 되시길 진심으로 바라며, 더 나은 서비스를 제공하는 <b>{{shop_name}}</b>이(가) 되겠습니다.</p>
  <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #888;">
    <p style="margin: 0;">감사합니다.</p>
  </div>
</div>`,
  email_cust_return_done: 'true',
  email_cust_return_done_subject: '[{{shop_name}}] 반품 및 환불 처리가 완료되었습니다.',
  email_cust_return_done_template: `<div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
  <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">환불 처리 완료 💳</h2>
  <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
  <p style="font-size: 16px; margin-bottom: 25px;">고객님께서 요청하신 반품 및 환불 처리가 최종적으로 완료되었습니다.</p>
  <p style="font-size: 15px; color: #444; margin-bottom: 30px;">결제 수단에 따라 실제 환불 금액이 입금 또는 승인 취소 반영되기까지 영업일 기준 3~7일이 소요될 수 있습니다.<br>저희 <b>{{shop_name}}</b>을 이용해 주셔서 진심으로 감사드리며, 다음에는 더 좋은 상품으로 찾아뵙겠습니다.</p>
  <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #888;">
    <p style="margin: 0;">항상 건강하고 행복하세요. 감사합니다.</p>
  </div>
</div>`,
  // 이메일 알림 고객 - 회원
  email_cust_signup: 'true',
  email_cust_signup_subject: '[{{shop_name}}] 회원가입을 진심으로 환영합니다! 🎉',
  email_cust_signup_template: `<div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px; text-align: center;">
  <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
  <h2 style="color: #111; font-size: 24px; margin-bottom: 20px;">환영합니다!</h2>
  <p style="font-size: 16px; margin-bottom: 10px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
  <p style="font-size: 16px; margin-bottom: 30px;"><b>{{shop_name}}</b>의 소중한 회원이 되신 것을 진심으로 환영합니다!<br>고객님을 위한 다양하고 특별한 혜택들이 준비되어 있습니다.</p>
  <a href="/" style="display: inline-block; background-color: #111; color: #fff; text-decoration: none; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 6px;">쇼핑하러 가기</a>
  <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #888; text-align: left;">
    <p style="margin: 0;">앞으로 {{shop_name}}에서 즐거운 쇼핑 되시길 바랍니다.</p>
  </div>
</div>`,
  email_cust_password_reset: 'true',
  email_cust_password_reset_subject: '[{{shop_name}}] 임시 비밀번호 발급 안내',
  email_cust_password_reset_template: `<div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
  <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">비밀번호 초기화 안내 🔒</h2>
  <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
  <p style="font-size: 16px; margin-bottom: 25px;">고객님의 요청에 의해 임시 비밀번호가 발급되었습니다.</p>
  <div style="background-color: #f0f4f8; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: center;">
    <span style="font-size: 14px; color: #555; display: block; margin-bottom: 5px;">임시 비밀번호</span>
    <strong style="font-size: 24px; color: #0056b3; letter-spacing: 2px;">발급된 임시비밀번호</strong>
  </div>
  <p style="font-size: 14px; color: #d9534f; margin-bottom: 30px;">보안을 위해 로그인하신 후 <strong>[마이페이지 > 회원정보 수정]</strong>에서 반드시 안전한 새 비밀번호로 변경해 주시기 바랍니다.</p>
</div>`,
  // SMS 발신자
  sms_sender_name: '제이시스메디칼',
  sms_sender_phone: '070-7435-4927',
  // SMS 알림 관리자
  sms_admin_new_order: 'true',
  sms_admin_new_order_template: '[새 주문 접수]\n{{customer_name}}님으로부터 새로운 주문이 접수되었습니다.\n- 주문번호: {{order_number}}\n- 금액: {{payment_amount}}원',
  sms_admin_cancel_order: 'true',
  sms_admin_cancel_order_template: '[주문 취소]\n{{customer_name}}님의 주문({{order_number}})이 취소되었습니다.',
  sms_admin_failed_order: 'true',
  sms_admin_failed_order_template: '[주문/결제 실패]\n{{customer_name}}님의 결제가 실패하였습니다.\n- 주문번호: {{order_number}}',
  sms_admin_exchange_request: 'true',
  sms_admin_exchange_request_template: '[교환 요청]\n{{customer_name}}님으로부터 교환 요청이 접수되었습니다.\n- 주문번호: {{order_number}}',
  sms_admin_return_request: 'true',
  sms_admin_return_request_template: '[반품 요청]\n{{customer_name}}님으로부터 반품 요청이 접수되었습니다.\n- 주문번호: {{order_number}}',
  // SMS 알림 고객 - 결제
  sms_cust_vact_waiting: 'true',
  sms_cust_vact_waiting_template: `[ {{shop_name}} ]
안녕하세요 {{customer_name}}님, 
저희 쇼핑몰을 찾아주셔서 진심으로 감사드립니다! 💖

주문하신 내역이 정상적으로 접수되었습니다.
아래 계좌로 입금해 주시면 결제가 완전히 완료됩니다.

▶ 주문번호 : {{order_number}}
▶ 결제금액 : {{payment_amount}}원
▶ 입금은행 : {{vact_bank}}
▶ 계좌번호 : {{vact_account}}

기한 내 입금되지 않을 경우 주문이 취소될 수 있으니 꼭 확인 부탁드릴게요. 오늘도 행복한 하루 보내세요! 😊`,
  sms_cust_order_complete_card: 'true',
  sms_cust_order_complete_card_template: `[ {{shop_name}} ]
안녕하세요 {{customer_name}}님, 
고객님의 소중한 주문이 정상적으로 결제 완료되었습니다! 🛍️

저희 쇼핑몰을 이용해 주셔서 진심으로 감사드리며, 
상품이 안전하게 도착할 수 있도록 꼼꼼히 준비해서 보내드리겠습니다.

▶ 주문번호 : {{order_number}}
▶ 결제금액 : {{payment_amount}}원

배송이 시작되면 송장 번호와 함께 다시 안내해 드릴게요. 감사합니다! 🚚✨`,
  sms_cust_order_complete_vact: 'true',
  sms_cust_order_complete_vact_template: `[ {{shop_name}} ]
안녕하세요 {{customer_name}}님, 
보내주신 결제 대금이 정상적으로 입금 확인되었습니다! 💸

주문하신 상품은 정성껏 준비하여 빠르게 배송해 드릴 예정입니다.

▶ 주문번호 : {{order_number}}
▶ 입금금액 : {{payment_amount}}원

배송이 시작되면 송장 번호와 함께 다시 안내해 드릴게요. 감사합니다! 🚚✨`,
  sms_cust_exchange_received: 'true',
  sms_cust_exchange_received_template: `[ {{shop_name}} ]
안녕하세요 {{customer_name}}님, 
요청하신 상품 교환 접수가 완료되었습니다. 🔄

상품 이용에 불편을 드려 대단히 죄송하며, 회수 및 검수를 거쳐 최대한 신속하게 새 상품으로 교환해 드리겠습니다.
▶ 주문번호 : {{order_number}}

포장된 상품을 기사님께 잘 전달해 주시면 감사하겠습니다.`,
  sms_cust_return_received: 'true',
  sms_cust_return_received_template: `[ {{shop_name}} ]
안녕하세요 {{customer_name}}님, 
요청하신 상품 반품 접수가 완료되었습니다. ↩️

상품 이용에 불편을 드려 대단히 죄송하며, 회수 및 검수를 거쳐 빠르게 환불 처리해 드리겠습니다.
▶ 주문번호 : {{order_number}}

포장된 상품을 기사님께 잘 전달해 주시면 감사하겠습니다.`,
  sms_cust_exchange_done: 'true',
  sms_cust_exchange_done_template: `[ {{shop_name}} ]
안녕하세요 {{customer_name}}님, 
오래 기다리셨습니다! 요청하신 상품 교환 처리가 무사히 완료되어 새 상품으로 발송해 드렸습니다. ✅

이번에는 꼭 만족스러운 상품이 되시길 바라며, 저희 쇼핑몰을 이용해 주셔서 감사합니다!`,
  sms_cust_return_done: 'true',
  sms_cust_return_done_template: `[ {{shop_name}} ]
안녕하세요 {{customer_name}}님, 
요청하신 반품 및 환불 처리가 정상적으로 완료되었습니다. 💳

결제 수단에 따라 환불 완료까지 영업일 기준 3~7일이 소요될 수 있는 점 양해 부탁드립니다. 다음에는 더 좋은 상품으로 찾아뵙겠습니다. 감사합니다!`,
  // SMS 알림 고객 - 회원
  sms_cust_signup: 'true',
  sms_cust_signup_template: `[ {{shop_name}} ]
안녕하세요 {{customer_name}}님, 
저희 쇼핑몰의 회원이 되신 것을 진심으로 환영합니다! 🎉

고객님을 위한 다양하고 특별한 혜택들이 준비되어 있으니, 지금 바로 놀러오셔서 즐거운 쇼핑을 경험해 보세요! 🎁`,
  sms_cust_password_reset: 'true',
  sms_cust_password_reset_template: `[ {{shop_name}} ]
안녕하세요 {{customer_name}}님, 
고객님의 요청에 의해 임시 비밀번호가 성공적으로 발급되었습니다. 🔒

보안을 위해 사이트에 로그인하신 후, 반드시 [마이페이지 > 회원정보 수정]에서 안전한 새 비밀번호로 변경해 주세요!`,
};

let cache: Record<string, string> | null = null;

export const shopSettingsService = {
  /** 전체 설정을 key→value Map으로 반환 (캐시 활용) */
  async getAll(): Promise<Record<string, string>> {
    if (cache) return cache;
    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('key, value');
      if (error || !data) return { ...DEFAULTS };
      const map: Record<string, string> = { ...DEFAULTS };
      for (const row of data) {
        map[row.key] = row.value;
      }
      cache = map;
      return map;
    } catch {
      return { ...DEFAULTS };
    }
  },

  /** 단일 값 조회 */
  async get(key: string): Promise<string> {
    const all = await shopSettingsService.getAll();
    return all[key] ?? DEFAULTS[key] ?? '';
  },

  /** 복수 설정 일괄 upsert */
  async updateMany(settings: Record<string, string>): Promise<void> {
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
    const { error } = await supabase
      .from('shop_settings')
      .upsert(rows, { onConflict: 'key' });
    if (error) throw error;
    // 캐시 무효화
    cache = null;
  },

  /** 캐시 강제 무효화 */
  invalidateCache() {
    cache = null;
  },
};
