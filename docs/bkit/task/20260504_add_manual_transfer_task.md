# 무통장입금(Manual Transfer) 추가 작업 진행표

- `[x]` `src/types/index.ts` 수정 (SplitPaymentMethod에 'transfer' 타입 추가)
- `[x]` `src/pages/CheckoutPage.tsx` 수정
  - `[x]` state에 'transfer' 추가
  - `[x]` 단일 결제 모드 렌더링 시 "무통장입금" 옵션 버튼 추가
  - `[x]` 무통장입금 선택 시 우리은행 계좌번호 안내 표시
  - `[x]` 복합 결제 모드의 드롭다운 옵션에 "무통장입금" 항목 추가
- `[x]` `src/services/orderService.ts` 수정
  - `[x]` `paymentMethod === 'transfer'` 분기 추가하여 주문 생성 시 오류 없이 `pending` 처리
- `[x]` `src/pages/OrderCompletePage.tsx` 수정
  - `[x]` 결제수단이 'transfer'일 때 우리은행 계좌 정보 안내 UI 표시
