# 무통장입금 결제 수단 추가

사용자가 결제 단계에서 기존 3가지 결제수단(등록 신용카드, 일반결제, 가상계좌) 외에 '무통장입금(Manual Bank Transfer)'을 선택할 수 있도록 결제 수단을 추가하는 작업입니다.

## User Review Required

> [!IMPORTANT]
> **입금받을 법인 계좌번호 정보 확인이 필요합니다.**
> 무통장입금을 선택한 고객에게 표시할 고정된 입금 계좌 정보(은행명, 계좌번호, 예금주)를 무엇으로 설정할지 알려주세요. (예: 기업은행 123-456789-01-011 (주)제이시스메디칼)
> 답변해 주시면 해당 정보로 UI 및 로직을 구성하겠습니다.

## Proposed Changes

### Types

#### [MODIFY] [index.ts](file:///Users/daniel/Documents/jeisys/src/types/index.ts)
- `SplitPaymentMethod` 인터페이스의 `type` 필드에 `'transfer'` 추가.

### Frontend Pages

#### [MODIFY] [CheckoutPage.tsx](file:///Users/daniel/Documents/jeisys/src/pages/CheckoutPage.tsx)
- `paymentMethod` state 타입을 `'credit' | 'general' | 'virtual' | 'transfer'`로 확장.
- 단일 결제 모드 렌더링 시 "무통장입금" 옵션 버튼 추가.
- 무통장입금 선택 시 지정된 법인 계좌 번호와 안내 메시지(예: "입금자명과 금액이 일치해야 빠른 처리가 가능합니다.") 표시.
- 복합 결제 모드(Split Payment)의 `select` 드롭다운 옵션에 "무통장입금" 항목 추가.

#### [MODIFY] [OrderCompletePage.tsx](file:///Users/daniel/Documents/jeisys/src/pages/OrderCompletePage.tsx)
- 주문이 완료된 후 주문 상세 페이지/완료 화면에서 `paymentMethod`가 `transfer`일 경우 입금해야 할 계좌 정보 표시.

### Services

#### [MODIFY] [orderService.ts](file:///Users/daniel/Documents/jeisys/src/services/orderService.ts)
- `createOrder` 함수에서 `paymentMethod === 'transfer'`일 때, 결제 승인(API 호출)을 타지 않고 바로 상태를 `pending`으로 지정하여 주문을 생성하도록 분기 처리 추가.
- 초기 `vactInfo`와 별개로, 무통장입금은 고정 계좌이므로 `pg_tid`나 `vact_*` 정보 대신 단순 `transfer` 플래그로 처리.

## Verification Plan

### Automated/Manual Verification
- 결제 화면에서 무통장입금 탭이 정상적으로 노출되는지 확인.
- 무통장입금 선택 시 고정 계좌 정보가 노출되는지 확인.
- 단일 결제 및 복합 결제에서 무통장입금으로 주문이 정상 생성되며, 생성 후 상태가 `pending`인지 확인.
- 주문 완료 페이지에서 입금 안내 정보가 올바르게 표시되는지 확인.
