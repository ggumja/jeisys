# 발송 템플릿 정리 (Jeisys 이메일)

시스템 연동 및 이메일 디자인 적용을 위해, 현재 시스템(Jeisys)에서 사용 중인 이메일 발송 상황과 제목, 본문 템플릿(HTML)을 정리한 문서입니다.

> **💡 개발자 참고 사항 (치환 변수)**
> 제목과 본문에 사용된 `{{변수명}}` 형태의 문구는 이메일 발송 모듈을 통해 실제 데이터로 동적 치환되어야 합니다.
> - `{{shop_name}}`: 쇼핑몰 이름 (예: (주)제이시스메디칼)
> - `{{customer_name}}`: 고객 이름
> - `{{order_number}}`: 주문 번호
> - `{{payment_amount}}`: 결제/입금 금액
> - 기타: `{{payment_method}}`, `{{vact_bank}}`, `{{vact_account}}`, `{{bank_name}}`, `{{bank_depositor}}`, `{{shipped_items}}`, `{{courier_name}}`, `{{tracking_number}}` 등

---

## 1. 관리자 알림 (Admin Notifications)

### 1.1 새 주문 접수 (`email_admin_new_order`)
- **발송 상황**: 고객이 쇼핑몰에서 새로운 주문을 완료했을 때 담당자에게 발송
- **메일 제목**: `[{{shop_name}}] 새로운 주문이 접수되었습니다. (주문번호: {{order_number}})`
- **본문 (HTML)**:
  ```html
  <h3>새로운 주문 접수 안내</h3><p><b>{{customer_name}}</b>님으로부터 새로운 주문이 접수되었습니다.</p><p>주문번호: {{order_number}}<br>결제금액: {{payment_amount}}원<br>결제수단: {{payment_method}}</p>
  ```

### 1.2 주문 취소 (`email_admin_cancel_order`)
- **발송 상황**: 고객이 주문을 취소했을 때 담당자에게 발송
- **메일 제목**: `[{{shop_name}}] 주문이 취소되었습니다. (주문번호: {{order_number}})`
- **본문 (HTML)**:
  ```html
  <h3>주문 취소 안내</h3><p><b>{{customer_name}}</b>님의 주문이 취소되었습니다.</p><p>주문번호: {{order_number}}</p>
  ```

### 1.3 주문/결제 실패 (`email_admin_failed_order`)
- **발송 상황**: 주문 또는 결제 과정에서 오류가 발생하여 실패했을 때
- **메일 제목**: `[{{shop_name}}] 주문/결제가 실패하였습니다. (주문번호: {{order_number}})`
- **본문 (HTML)**:
  ```html
  <h3>주문/결제 실패 안내</h3><p><b>{{customer_name}}</b>님의 결제가 실패하였습니다.</p><p>주문번호: {{order_number}}</p>
  ```

### 1.4 교환 요청 (`email_admin_exchange_request`)
- **발송 상황**: 고객이 상품 교환을 요청했을 때
- **메일 제목**: `[{{shop_name}}] 교환 요청이 접수되었습니다. (주문번호: {{order_number}})`
- **본문 (HTML)**:
  ```html
  <h3>교환 요청 안내</h3><p><b>{{customer_name}}</b>님으로부터 교환 요청이 접수되었습니다.</p><p>주문번호: {{order_number}}</p>
  ```

### 1.5 반품 요청 (`email_admin_return_request`)
- **발송 상황**: 고객이 상품 반품을 요청했을 때
- **메일 제목**: `[{{shop_name}}] 반품 요청이 접수되었습니다. (주문번호: {{order_number}})`
- **본문 (HTML)**:
  ```html
  <h3>반품 요청 안내</h3><p><b>{{customer_name}}</b>님으로부터 반품 요청이 접수되었습니다.</p><p>주문번호: {{order_number}}</p>
  ```

---

## 2. 고객 알림 - 결제 및 입금 대기 (Customer - Payment)

### 2.1 가상계좌 입금 대기 (`email_cust_vact_waiting`)
- **발송 상황**: 고객이 가상계좌 결제를 선택하여 주문을 접수한 후, 입금을 기다릴 때
- **메일 제목**: `[{{shop_name}}] 주문해주셔서 감사합니다! 가상계좌 입금 안내입니다.`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
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
  </div>
  ```

### 2.2 무통장 입금 대기 (`email_cust_bank_waiting`)
- **발송 상황**: 고객이 무통장입금을 선택하여 주문을 접수한 후, 입금을 기다릴 때
- **메일 제목**: `[{{shop_name}}] 주문해주셔서 감사합니다! 무통장입금 안내입니다.`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">무통장입금 안내 🏦</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">저희 <b>{{shop_name}}</b>을(를) 찾아주셔서 진심으로 감사드립니다.<br>아래 계좌로 기한 내에 입금해주시면 정상적으로 주문 결제가 완료됩니다.</p>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
      <h3 style="margin-top: 0; font-size: 16px; margin-bottom: 15px;">입금 상세 정보</h3>
      <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
        <li style="margin-bottom: 10px;"><strong>주문 번호 :</strong> <span style="color: #0056b3;">{{order_number}}</span></li>
        <li style="margin-bottom: 10px;"><strong>입금 금액 :</strong> <b>{{payment_amount}}원</b></li>
        <li style="margin-bottom: 10px;"><strong>입금 은행 :</strong> {{bank_name}}</li>
        <li style="margin-bottom: 10px;"><strong>계좌 번호 :</strong> <b>{{bank_account}}</b></li>
        <li><strong>예금주 :</strong> {{bank_depositor}}</li>
      </ul>
    </div>
    <p style="font-size: 14px; color: #666; margin-bottom: 30px;">기한 내 입금되지 않거나 입금자명이 다를 경우 결제 확인이 지연될 수 있습니다.</p>
    <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #888;">
      <p style="margin: 0;">본 메일은 발신 전용 메일입니다. 문의 사항이 있으시면 고객센터를 이용해 주세요.</p>
      <p style="margin: 5px 0 0 0;">감사합니다.</p>
    </div>
  </div>
  ```

---

## 3. 고객 알림 - 결제 완료 (Customer - Payment Completed)

### 3.1 카드 결제 완료 (`email_cust_order_complete_card`)
- **발송 상황**: 신용카드 등 즉시 결제 수단으로 결제가 성공적으로 완료되었을 때
- **메일 제목**: `[{{shop_name}}] 결제가 성공적으로 완료되었습니다! 🎉`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
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
  </div>
  ```

### 3.2 가상계좌 입금 확인 (`email_cust_order_complete_vact`)
- **발송 상황**: 가상계좌로 고객이 입금을 완료하여 결제가 확인되었을 때
- **메일 제목**: `[{{shop_name}}] 입금이 성공적으로 확인되었습니다! 🎉`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
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
  </div>
  ```

### 3.3 무통장 입금 확인 (`email_cust_order_complete_bank`)
- **발송 상황**: 무통장 입금 내역을 관리자가 확인(승인)했을 때
- **메일 제목**: `[{{shop_name}}] 무통장 입금이 성공적으로 확인되었습니다! 🎉`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">무통장 입금 확인 완료 💸</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">보내주신 결제 대금이 정상적으로 입금 확인되었습니다.<br><b>{{shop_name}}</b>을(를) 이용해 주셔서 진심으로 감사드립니다!</p>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
      <h3 style="margin-top: 0; font-size: 16px; margin-bottom: 15px;">주문 정보</h3>
      <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
        <li style="margin-bottom: 10px;"><strong>주문 번호 :</strong> <span style="color: #0056b3;">{{order_number}}</span></li>
        <li style="margin-bottom: 10px;"><strong>확인 금액 :</strong> <b>{{payment_amount}}원</b></li>
        <li style="margin-bottom: 10px;"><strong>입금 은행 :</strong> {{bank_name}}</li>
      </ul>
    </div>
    <p style="font-size: 15px; color: #444; margin-bottom: 30px;">이제 곧 상품 준비가 시작됩니다. 택배가 발송되는 즉시 배송 안내 메일을 보내드릴 예정입니다.</p>
    <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #888;">
      <p style="margin: 0;">감사합니다.</p>
    </div>
  </div>
  ```

### 3.4 일부 금액 결제 완료 (`email_cust_payment_partial`)
- **발송 상황**: 복합 결제 시 일부 금액만 결제 처리되었을 때
- **메일 제목**: `[{{shop_name}}] 일부 결제가 성공적으로 처리되었습니다.`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">일부 결제 확인 안내 💸</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">고객님의 주문에 대한 일부 금액 결제가 성공적으로 처리되었습니다.</p>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
      <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
        <li style="margin-bottom: 10px;"><strong>결제된 금액 :</strong> <b>{{partial_paid_amount}}원</b></li>
        <li style="margin-bottom: 10px;"><strong>남은 잔금 :</strong> <b style="color: #d9534f;">{{remaining_amount}}원</b></li>
      </ul>
    </div>
    <p style="font-size: 15px; color: #444; margin-bottom: 30px;">남은 잔금을 모두 결제해 주셔야 상품 준비가 시작됩니다. 감사합니다.</p>
  </div>
  ```

### 3.5 최종 결제 완료 (`email_cust_payment_all_done`)
- **발송 상황**: 일부 결제 상태에서 남은 잔금까지 모두 지불되었을 때
- **메일 제목**: `[{{shop_name}}] 모든 결제가 완료되어 상품 준비를 시작합니다!`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">최종 결제 완료 🎉</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">잔금 결제까지 모두 성공적으로 완료되었습니다! 이제 상품 준비를 시작합니다.</p>
    <p style="font-size: 15px; color: #444; margin-bottom: 30px;">상품이 꼼꼼하게 포장되어 발송될 예정입니다. 배송이 시작되면 다시 한번 안내해 드리겠습니다.</p>
  </div>
  ```

---

## 4. 고객 알림 - 배송 (Customer - Shipping)

### 4.1 일반 상품 발송 (`email_cust_shipping_standard`)
- **발송 상황**: 주문한 상품이 택배사로 인계되어 배송이 시작되었을 때
- **메일 제목**: `[{{shop_name}}] 주문하신 상품이 발송되었습니다. 🚚`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">상품 발송 안내 📦</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">주문하신 상품이 오늘 발송되었습니다. 기다려 주셔서 감사합니다!</p>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
      <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
        <li style="margin-bottom: 10px;"><strong>주문 번호 :</strong> <span style="color: #0056b3;">{{order_number}}</span></li>
        <li style="margin-bottom: 10px;"><strong>발송된 상품 :</strong> <span>{{shipped_items}}</span></li>
        <li style="margin-bottom: 10px;"><strong>택배사 :</strong> <span>{{courier_name}}</span></li>
        <li style="margin-bottom: 10px;"><strong>송장 번호 :</strong> <b>{{tracking_number}}</b></li>
      </ul>
    </div>
    <p style="font-size: 15px; color: #444; margin-bottom: 30px;">상품이 안전하게 도착할 수 있도록 최선을 다하겠습니다.</p>
  </div>
  ```

### 4.2 분할 배송 (일부 상품 선발송) (`email_cust_shipping_split`)
- **발송 상황**: 주문 상품 중 준비된 일부 상품만 먼저 발송할 때
- **메일 제목**: `[{{shop_name}}] 준비된 일부 상품이 먼저 발송되었습니다. 🚚`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">일부 상품 발송 안내 📦</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">주문하신 상품 중 먼저 준비가 완료된 일부 상품을 오늘 발송해 드렸습니다.</p>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
      <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
        <li style="margin-bottom: 10px;"><strong>먼저 출발한 상품 :</strong> <span style="color: #0056b3;">{{shipped_items}}</span></li>
        <li style="margin-bottom: 10px;"><strong>조금 더 기다리실 상품 :</strong> <span>{{remaining_items}}</span></li>
      </ul>
    </div>
    <p style="font-size: 15px; color: #444; margin-bottom: 30px;">나머지 상품도 입고되는 즉시 가장 빠르게 보내드릴 수 있도록 최선을 다하겠습니다.</p>
  </div>
  ```

### 4.3 잔여 상품 발송 (`email_cust_shipping_remain`)
- **발송 상황**: 미발송되었던 나머지 상품의 배송이 시작되었을 때
- **메일 제목**: `[{{shop_name}}] 기다려주신 나머지 상품이 모두 발송되었습니다! 🚚`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">잔여 상품 발송 안내 📦</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">오래 기다려 주셔서 감사합니다! 미발송되었던 나머지 상품이 오늘 모두 출발했습니다.</p>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
      <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
        <li style="margin-bottom: 10px;"><strong>오늘 발송된 상품 :</strong> <span style="color: #0056b3;">{{shipped_items}}</span></li>
      </ul>
    </div>
    <p style="font-size: 15px; color: #444; margin-bottom: 30px;">이제 주문하신 모든 상품이 발송되었습니다. 저희 쇼핑몰을 믿고 기다려주셔서 진심으로 감사드립니다.</p>
  </div>
  ```

---

## 5. 고객 알림 - 취소/교환/반품 (Customer - Claim)

### 5.1 교환 접수 (`email_cust_exchange_received`)
- **발송 상황**: 고객의 상품 교환 요청이 접수되었을 때
- **메일 제목**: `[{{shop_name}}] 교환 요청이 정상적으로 접수되었습니다.`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">교환 접수 안내 🔄</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">요청하신 상품 교환 접수가 정상적으로 완료되었습니다.<br>이용에 불편을 드려 죄송한 마음을 전하며, 최대한 신속하고 정확하게 처리해 드리겠습니다.</p>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
      <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
        <li style="margin-bottom: 10px;"><strong>주문 번호 :</strong> <span style="color: #0056b3;">{{order_number}}</span></li>
      </ul>
    </div>
    <p style="font-size: 14px; color: #666; margin-bottom: 30px;">수거 예정인 상품은 파손되지 않도록 잘 포장하여 기사님께 전달해 주시면 감사하겠습니다.</p>
  </div>
  ```

### 5.2 반품 접수 (`email_cust_return_received`)
- **발송 상황**: 고객의 반품(환불) 요청이 접수되었을 때
- **메일 제목**: `[{{shop_name}}] 반품 요청이 정상적으로 접수되었습니다.`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">반품 접수 안내 ↩️</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">요청하신 상품 반품 접수가 정상적으로 완료되었습니다.<br>기대하시고 주문하셨을 텐데 불편을 드려 대단히 죄송합니다.</p>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
      <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
        <li style="margin-bottom: 10px;"><strong>주문 번호 :</strong> <span style="color: #0056b3;">{{order_number}}</span></li>
      </ul>
    </div>
    <p style="font-size: 14px; color: #666; margin-bottom: 30px;">회수된 상품이 저희 측에 도착하여 검수된 후, 환불 처리가 진행될 예정입니다. 최대한 빠르게 처리해 드리겠습니다.</p>
  </div>
  ```

### 5.3 교환 처리 완료 (`email_cust_exchange_done`)
- **발송 상황**: 새 상품으로 교환 발송 처리가 완료되었을 때
- **메일 제목**: `[{{shop_name}}] 교환 상품 발송 처리가 완료되었습니다.`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">교환 처리 완료 ✅</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">오래 기다리셨습니다! 요청하신 상품 교환 처리가 무사히 완료되어, 새로운 상품으로 발송해 드렸습니다.</p>
    <p style="font-size: 15px; color: #444; margin-bottom: 30px;">이번에는 만족스러운 상품이 되시길 진심으로 바라며, 더 나은 서비스를 제공하는 <b>{{shop_name}}</b>이(가) 되겠습니다.</p>
    <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #888;">
      <p style="margin: 0;">감사합니다.</p>
    </div>
  </div>
  ```

### 5.4 반품/환불 완료 (`email_cust_return_done`)
- **발송 상황**: 반품 상품 검수 후 최종 환불 처리가 완료되었을 때
- **메일 제목**: `[{{shop_name}}] 반품 및 환불 처리가 완료되었습니다.`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">환불 처리 완료 💳</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">고객님께서 요청하신 반품 및 환불 처리가 최종적으로 완료되었습니다.</p>
    <p style="font-size: 15px; color: #444; margin-bottom: 30px;">결제 수단에 따라 실제 환불 금액이 입금 또는 승인 취소 반영되기까지 영업일 기준 3~7일이 소요될 수 있습니다.<br>저희 <b>{{shop_name}}</b>을 이용해 주셔서 진심으로 감사드리며, 다음에는 더 좋은 상품으로 찾아뵙겠습니다.</p>
    <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #888;">
      <p style="margin: 0;">항상 건강하고 행복하세요. 감사합니다.</p>
    </div>
  </div>
  ```

---

## 6. 고객 알림 - 회원 가입 및 계정 (Customer - Membership)

### 6.1 회원가입 환영 (`email_cust_signup`)
- **발송 상황**: 신규 회원이 가입을 완료했을 때
- **메일 제목**: `[{{shop_name}}] 회원가입을 진심으로 환영합니다! 🎉`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px; text-align: center;">
    <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
    <h2 style="color: #111; font-size: 24px; margin-bottom: 20px;">환영합니다!</h2>
    <p style="font-size: 16px; margin-bottom: 10px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 30px;"><b>{{shop_name}}</b>의 소중한 회원이 되신 것을 진심으로 환영합니다!<br>고객님을 위한 다양하고 특별한 혜택들이 준비되어 있습니다.</p>
    <a href="/" style="display: inline-block; background-color: #111; color: #fff; text-decoration: none; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 6px;">쇼핑하러 가기</a>
    <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #888; text-align: left;">
      <p style="margin: 0;">앞으로 {{shop_name}}에서 즐거운 쇼핑 되시길 바랍니다.</p>
    </div>
  </div>
  ```

### 6.2 임시 비밀번호 발급 (`email_cust_password_reset`)
- **발송 상황**: 임시 비밀번호가 발급되었을 때
- **메일 제목**: `[{{shop_name}}] 임시 비밀번호 발급 안내`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">비밀번호 초기화 안내 🔒</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">고객님의 요청에 의해 임시 비밀번호가 발급되었습니다.</p>
    <div style="background-color: #f0f4f8; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: center;">
      <span style="font-size: 14px; color: #555; display: block; margin-bottom: 5px;">임시 비밀번호</span>
      <strong style="font-size: 24px; color: #0056b3; letter-spacing: 2px;">발급된 임시비밀번호</strong>
    </div>
    <p style="font-size: 14px; color: #d9534f; margin-bottom: 30px;">보안을 위해 로그인하신 후 <strong>[마이페이지 > 회원정보 수정]</strong>에서 반드시 안전한 새 비밀번호로 변경해 주시기 바랍니다.</p>
  </div>
  ```

### 6.3 회원가입 승인 (`email_cust_signup_approve`)
- **발송 상황**: 회원가입 신청이 최종 승인(APPROVED)되었을 때
- **메일 제목**: `[{{shop_name}}] 회원가입 신청이 승인되었습니다. 🎉`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px; text-align: center;">
    <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
    <h2 style="color: #111; font-size: 24px; margin-bottom: 20px;">회원 승인 안내</h2>
    <p style="font-size: 16px; margin-bottom: 10px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 30px;"><b>{{shop_name}}</b>의 회원가입 신청이 최종 승인되었습니다!<br>지금 바로 로그인하셔서 다양한 회원 혜택과 맞춤형 상품들을 만나보세요.</p>
    <a href="/" style="display: inline-block; background-color: #111; color: #fff; text-decoration: none; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 6px;">쇼핑몰 바로가기</a>
    <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #888; text-align: left;">
      <p style="margin: 0;">앞으로 {{shop_name}}에서 즐거운 쇼핑 되시길 바랍니다.</p>
    </div>
  </div>
  ```

### 6.4 회원가입 반려 (`email_cust_signup_reject`)
- **발송 상황**: 회원가입 신청이 반려(REJECTED)되었을 때
- **메일 제목**: `[{{shop_name}}] 회원가입 신청 결과 안내`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">회원가입 신청 반려 안내 ✉️</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">저희 <b>{{shop_name}}</b>에 보내주신 가입 신청 감사드립니다.<br>제출해주신 정보를 검토한 결과, 아래의 사유로 가입 신청이 반려되었음을 안내해 드립니다.</p>
    <div style="background-color: #fcf8e3; border: 1px solid #faebcc; border-radius: 8px; padding: 20px; margin-bottom: 25px; color: #8a6d3b;">
      <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 15px;">반려 사유</h4>
      <p style="margin: 0; font-size: 14px;">{{reject_reason}}</p>
    </div>
    <p style="font-size: 14px; color: #666; margin-bottom: 30px;">관련하여 문의 사항이 있으시거나 정보를 수정하여 재신청하고자 하시는 경우, 고객센터로 연락해주시면 정성껏 안내해 드리겠습니다.</p>
    <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #888;">
      <p style="margin: 0;">감사합니다.</p>
    </div>
  </div>
  ```

---

## 7. 고객 알림 - 포인트 및 크레딧 소멸 안내 (Customer - Reward Expiration)

### 7.1 포인트 소멸 예정 알림 (`email_cust_point_expire`)
- **발송 상황**: 보유 포인트 만료일 며칠 전 소멸 예정 알림 발송 시
- **메일 제목**: `[{{shop_name}}] 소중한 포인트가 {{expire_days_left}}일 뒤 소멸될 예정입니다.`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">포인트 소멸 예정 안내 ({{expire_days_left}}일 전) ⏳</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">고객님께서 보유하신 소중한 포인트 중 일부가 <b>{{expire_days_left}}일 뒤</b> 소멸될 예정입니다.<br>아쉽게 사라지기 전에 꼭 알차게 사용해 보세요!</p>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
      <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
        <li style="margin-bottom: 10px;"><strong>소멸 예정일 :</strong> <b>{{expire_date}}</b></li>
        <li style="margin-bottom: 10px;"><strong>소멸 예정 포인트 :</strong> <b style="color: #d9534f;">{{expiring_point}}P</b></li>
      </ul>
    </div>
    <p style="font-size: 15px; color: #444; margin-bottom: 30px;">포인트는 쇼핑몰에서 상품 구매 시 유용하게 사용하실 수 있습니다.</p>
  </div>
  ```

### 7.2 크레딧 소멸 예정 알림 (`email_cust_credit_expire`)
- **발송 상황**: 보유 크레딧(선불금) 만료일 며칠 전 소멸 예정 알림 발송 시
- **메일 제목**: `[{{shop_name}}] 보유하신 크레딧이 {{expire_days_left}}일 뒤 소멸될 예정입니다.`
- **본문 (HTML)**:
  ```html
  <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color: #111; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; font-size: 22px;">크레딧 소멸 예정 안내 ({{expire_days_left}}일 전) 💳</h2>
    <p style="font-size: 16px;">안녕하세요 <b>{{customer_name}}</b>님,</p>
    <p style="font-size: 16px; margin-bottom: 25px;">고객님께서 보유하신 크레딧 잔액 중 일부가 <b>{{expire_days_left}}일 뒤</b> 만료되어 소멸될 예정입니다.</p>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
      <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
        <li style="margin-bottom: 10px;"><strong>크레딧 종류 :</strong> {{credit_type}}</li>
        <li style="margin-bottom: 10px;"><strong>만료 예정일 :</strong> <b>{{expire_date}}</b></li>
        <li style="margin-bottom: 10px;"><strong>소멸 대상 크레딧 :</strong> <b style="color: #d9534f;">{{expiring_credit}}C</b></li>
      </ul>
    </div>
    <p style="font-size: 15px; color: #444; margin-bottom: 30px;">소멸되기 전에 잊지 말고 꼭 사용해 주세요!</p>
  </div>
  ```
