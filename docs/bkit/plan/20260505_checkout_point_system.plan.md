# 🎯 결제 페이지 포인트 사용 시스템 플랜

## 1. Plan Overview
- **Objective:** `CheckoutPage.tsx`의 주문상품정보 블록 하단에 '포인트 사용' UI를 추가하고, 주문 시 포인트를 차감/롤백하는 백엔드 연동 구현.
- **Trigger:** `/pdca plan checkout ...`
- **Date:** 2026-05-05

## 2. Key Requirements
1. **가용 포인트 표출:** 사용자 보유 잔여 포인트를 확인 가능해야 함.
2. **포인트 입력/전액사용:** 원하는 금액만큼 입력하거나 '전액 사용' 버튼으로 결제 금액에서 차감.
3. **사용 내역 기록:** 주문 완료 시 `point_transactions` 테이블에 `use` 타입으로 내역 적재.
4. **주문 취소 시 롤백:** 결제/주문 취소 발생 시 사용된 포인트를 원래대로 환불(`refund`) 처리.

## 3. Database Updates
- `point_transactions` 테이블에 주문과의 매핑을 위해 `order_id` 컬럼 추가 (FK).
- `orders` 테이블에 해당 주문에서 사용된 포인트 총액을 명시하는 `points_used` 컬럼 추가.

## 4. Frontend (UI) Changes
- `CheckoutPage.tsx`에 `pointsUsed`, `availablePoints` 상태 추가.
- `주문 상품 정보` 섹션 아래에 포인트 입력 영역 렌더링.
- 최종 결제 금액 산출 시 크레딧과 더불어 포인트 차감(`finalTotal = total - credits - points`).

## 5. Backend Logic Changes
- **pointService.ts:** 포인트 차감을 위한 `usePoints(userId, amount, orderId)` 및 롤백을 위한 `refundOrderPoints(orderId)` 구현.
- **orderService.ts:** `createOrder`에서 `pointsUsed` 인자를 받아 결제 금액 처리 및 포인트 차감 서비스 호출. `cancelOrder` 시 환불 서비스 연동.

## 6. Next Actions
- 이 플랜에 대한 승인 대기.
- 승인 시 DB 마이그레이션 파일 작성.
- 프론트엔드 및 백엔드 코드 수정 적용 (Do 단계 진행).
