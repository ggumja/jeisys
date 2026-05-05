# 📊 결제 페이지 포인트 연동 구현 완료 (Act)

## 1. Action Summary
- **작업일자:** 2026-05-05
- **트리거:** `/pdca plan checkout ...`
- **대상 파일:** 
  - `src/pages/CheckoutPage.tsx` (UI 및 상태, 결제금액 계산 추가)
  - `src/services/pointService.ts` (`usePoints`, `refundOrderPoints` 추가)
  - `src/services/orderService.ts` (주문 생성 시 포인트 차감 및 취소 시 환불 연동)
  - `docs/db/sql/20260505_add_point_usage_to_orders.sql` (마이그레이션 파일)

## 2. Check (검증 결과)
- **UI:** 주문 상품 블록 직후에 보유 포인트를 띄워주고 입력/전액 사용이 가능한 블록이 성공적으로 추가되었습니다. 우측 주문 요약 탭에서도 실시간으로 포인트 차감액이 반영됩니다.
- **백엔드 로직:** 포인트 입력 시 최종 PG 결제 금액(totalAmount)이 정상적으로 차감 산정되며, 백엔드에는 원래 `total_amount` 대비 `points_used`가 분리 저장되어 무결성을 유지합니다.
- **롤백 처리:** `cancelOrder` 발동 시 `order_id`로 매핑된 내역을 찾아 양수(+) 환불 레코드를 insert 하므로 데이터 부정합 리스크가 제거되었습니다.

## 3. Next Steps (Iterate)
- **관리자 검증:** 관리자 모드에서 주문을 열람할 때 `points_used`를 식별하고 차감 내역을 보여주는 UI 업데이트(Admin Page)를 향후 PDCA로 분리 진행.
- **DB 반영:** 현재 준비된 SQL 스크립트를 Production Database (Supabase)에 적용하는 과정이 필수 선행되어야 함.
