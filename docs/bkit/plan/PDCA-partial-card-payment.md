# PDCA Plan: 카드 일부 결제(Partial Card Payment) 기능 도입

## 1. Plan (계획)
- **목표**: 사용자가 전체 결제 금액 중 일정 금액을 먼저 카드로 결제하고, 나머지 금액은 나중에 결제할 수 있도록 지원.
- **주요 기능 요건**:
  1. `CheckoutPage`: 결제 수단에 '카드일부결제' 옵션 추가, 선결제 금액 입력 폼 제공.
  2. `orderService`: 일부 금액에 대해서만 KICC 승인을 요청. 성공 시 주문 상태를 `pending`(입금대기/결제대기)으로 저장하고, 결제 이력(`payment_history`)에 1차 승인 내역 저장.
  3. `adminService` & `UI`: "입금대기" 탭 및 상태 뱃지를 "입금대기/결제대기"로 텍스트 변경. 주문 상세에서 기결제 금액과 미결제 금액을 명확히 구분하여 표시.
  4. 미결제 금액 완료 로직: 전체 금액이 완납될 때 주문 상태를 `paid`(결제완료)로 승격시키는 프로세스 준비.

## 2. Design (설계)
- **Data Model**: `orders` 테이블의 `status`를 `pending`으로 활용하며, 완납 여부는 `total_amount`와 `payment_history`의 총액을 비교하여 판단.
- **Frontend Changes**:
  - `CheckoutPage.tsx`: `paymentMode`에 `'partial'`을 추가하고 입력받은 금액이 `finalTotal`보다 작고 0보다 큰지 유효성 검증.
  - `OrderManagementPage.tsx` / `OrdersPage.tsx`: 상태 맵핑 객체에서 `pending`의 라벨을 모두 "입금대기/결제대기"로 수정.
- **API/Service Layer**:
  - `orderService.createOrder`에 `paymentMethod === 'partial_card'` 조건 분기 신설.
  - 잔여 금액 지불을 위한 엔드포인트/메서드 사전 고려 (UI 구성은 향후 과제로 둠).

## 3. Do (실행 단계 예정)
1. 프론트엔드 상태 및 UI 컴포넌트 업데이트 (`pending` 라벨 변경 일괄 적용)
2. `CheckoutPage.tsx` 내 카드일부결제 섹션 UI 및 상태 추가 (결제 금액 Input 포함)
3. `orderService.ts`에 부분 승인 및 주문 내역 저장 로직 구현
4. 잔액 결제 플로우(Admin vs User) 확정 후 후속 컴포넌트 개발

## 4. Check & Act (검증 및 개선 예정)
- **Check**: 부분 결제 완료 시 금액이 정확히 PG사를 통해 승인되는지 검증. 어드민과 마이페이지에 '입금대기/결제대기' 상태로 정상 노출되는지 확인.
- **Act**: 결제 실패 시 롤백 처리 고도화 및 고객에게 잔액 결제 안내(알림톡 등) 기능 추가 검토.
