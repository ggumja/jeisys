# PDCA Plan: 복합 결제 및 분할 배송에 따른 알림 시스템 확장 계획

## 1. 개요
최근 쇼핑몰 고도화로 인해 **카드 분할 결제, 카드 일부 결제(부분 결제), 분할 배송** 기능이 추가되었습니다. 이에 따라 기존의 단순한 '주문 완료', '배송 시작' 알림만으로는 고객에게 정확한 진행 상황을 전달하기 어렵습니다. 고객의 혼란을 방지하고 신뢰도를 높이기 위해 복합적인 상황에 맞는 세분화된 알림 템플릿(이메일/SMS) 추가가 필요합니다.

## 2. 추가가 필요한 신규 알림 항목 (제안)

### A. 결제 관련 (Payment)
1. **일부 결제 완료 및 잔금 안내 (Customer)**
   - **상황:** 고객이 총 주문 금액 중 일부만 결제(예: 계약금, 분할 결제 1회차)했을 때.
   - **내용:** "현재 X원이 결제되었으며, 남은 잔금은 Y원입니다. 잔금 결제 링크는 다음과 같습니다."
   - **Key:** `email_cust_payment_partial`, `sms_cust_payment_partial`
2. **최종 결제 완료 (Customer/Admin)**
   - **상황:** 모든 분할 결제 및 잔금 결제가 완료되어 주문이 최종적으로 확정(Paid) 상태가 되었을 때.
   - **내용:** "모든 결제가 완료되어 상품 준비가 시작됩니다."
   - **Key:** `email_cust_payment_all_done`, `sms_cust_payment_all_done`
3. **잔금 결제 기한 임박 안내 (Customer)**
   - **상황:** 분할/일부 결제 후 잔금 결제 기한이 다가올 때 (리텐션/결제 유도).
   - **내용:** "주문하신 상품의 잔금 결제 기한이 N일 남았습니다."
   - **Key:** `email_cust_payment_reminder`, `sms_cust_payment_reminder`

### B. 배송 관련 (Shipping)
1. **분할 배송 시작 안내 (Customer)**
   - **상황:** 주문한 상품 중 재고가 확보된 일부 상품만 먼저 발송될 때.
   - **내용:** "준비된 일부 상품(A, B)이 먼저 발송되었습니다. 나머지 상품(C)은 입고되는 대로 신속히 보내드리겠습니다."
   - **추가 필요 변수:** `{{shipped_items}}`, `{{remaining_items}}`
   - **Key:** `email_cust_shipping_split`, `sms_cust_shipping_split`
2. **잔여 상품 배송 시작 안내 (Customer)**
   - **상황:** 분할 배송 후 남은 잔여 상품이 발송될 때.
   - **내용:** "기다려주셨던 나머지 상품(C)이 오늘 발송되었습니다."
   - **Key:** `email_cust_shipping_remain`, `sms_cust_shipping_remain`

### C. 포인트/크레딧 소멸 안내 (Expiration)
1. **포인트 소멸 안내 (Customer)**
   - **상황:** 고객의 보유 포인트가 소멸되기 30일, 7일, 3일, 1일 전.
   - **내용:** "고객님의 포인트 {{expiring_point}}P가 {{expire_date}}에 소멸될 예정입니다."
   - **Key:** `email_cust_point_expire_30`, `sms_cust_point_expire_30` 등 (총 8개)
2. **크레딧 소멸 안내 (Customer)**
   - **상황:** 고객의 보유 크레딧이 소멸되기 30일, 7일, 3일, 1일 전.
   - **내용:** "고객님의 크레딧 {{expiring_credit}}C가 {{expire_date}}에 소멸될 예정입니다."
   - **Key:** `email_cust_credit_expire_30`, `sms_cust_credit_expire_30` 등 (총 8개)

## 3. 구현 단계 (Action Plan)
1. **데이터 모델 업데이트:** `shopSettingsService.ts`의 `DEFAULTS` 객체에 신규 알림 항목의 Key, Subject, Template 기본값을 추가.
2. **관리자 UI 반영:** `ShopSettingsPage.tsx`의 `NotificationTab`에 신규 섹션(예: `고객 알림 — 분할/복합결제`, `고객 알림 — 배송`)을 구성하여 UI에 노출.
3. **변수 시스템 확장:** 분할 배송 알림을 위해 `{{shipped_items}}`, `{{remaining_items}}`, `{{partial_paid_amount}}`, `{{remaining_amount}}` 등의 신규 치환 변수를 에디터 변수 목록에 추가.

## 4. 검토 요청 사항
- 위 제안된 알림 항목 중 추가/수정/삭제가 필요한 부분이 있는지 확인 부탁드립니다.
- '잔금 결제 기한 임박 안내'와 같은 스케줄러 기반 알림도 이번 템플릿에 포함할지 결정이 필요합니다.
