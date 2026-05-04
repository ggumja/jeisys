# 무통장입금 고도화(실제 입금자명, 환불 계좌 수집) 작업 진행표

- `[x]` `src/types/index.ts` 수정
  - `[x]` `OrderInput` 인터페이스에 `depositorName?: string;` 추가
  - `[x]` `ClaimInfo` 인터페이스에 `refundBank`, `refundAccount`, `refundHolder` 추가
- `[x]` `src/pages/CheckoutPage.tsx` 수정
  - `[x]` 무통장입금 선택 시 입금자명 입력 `<input>` 추가 및 상태 연동
  - `[x]` `orderService.createOrder` 호출 시 `depositorName` 전달
- `[x]` `src/services/orderService.ts` 수정
  - `[x]` `createOrder`: `paymentMethod === 'transfer'`일 때 `vact_name`에 `depositorName` 저장
  - `[x]` `requestClaim`: 파라미터에 환불 계좌 정보 추가 및 `claim_info` 병합 저장 로직 반영
- `[x]` `src/pages/OrdersPage.tsx` 수정
  - `[x]` `ClaimModal`에서 무통장입금 취소/반품 시 환불 계좌 입력 폼 노출
  - `[x]` 입력된 환불 계좌 정보를 `requestClaim`에 전달
- `[x]` `src/pages/admin/OrderManagementPage.tsx` 수정
  - `[x]` 엑셀 매칭 로직에서 `vactName`을 최우선 매칭 기준으로 사용하도록 변경
- `[x]` `src/pages/admin/OrderDetailPage.tsx` 수정
  - `[x]` 클레임 정보 UI에 환불 계좌 정보 렌더링 추가
