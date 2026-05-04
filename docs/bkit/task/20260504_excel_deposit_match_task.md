# 무통장입금 엑셀 대량 매칭 기능 구현 작업 진행표

- `[x]` `src/services/adminService.ts` 수정
  - `[x]` `bulkConfirmDeposits` 함수 구현 (order status 업데이트, payment_history 추가)
- `[x]` `src/pages/admin/OrderManagementPage.tsx` 수정
  - `[x]` `xlsx` 라이브러리 임포트
  - `[x]` 엑셀 매칭 관련 상태 변수 추가 (`excelFile`, `matchedOrders`, `isMatchingModalOpen` 등)
  - `[x]` '입금대기' 상태(pending)일 때 목록 하단에 엑셀 업로드 UI 추가
  - `[x]` 엑셀 파싱 로직 구현 (컬럼명: `기재내용`, `거래금액(입금)`)
  - `[x]` 엑셀 데이터와 `pending` 상태인 주문 비교 매칭 로직
  - `[x]` 일괄 승인 모달 구현 및 승인 시 `bulkConfirmDeposits` 호출 연동
