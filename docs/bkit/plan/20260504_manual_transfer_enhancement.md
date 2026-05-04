# 무통장입금 고도화(실제 입금자명, 환불 계좌 수집) 구현 계획서

본 계획서는 무통장입금 결제 방식의 안정적인 운영을 위한 두 가지 예외 상황 방지 기능을 구현하기 위한 것입니다.

## 1. 개요
* **목표 1**: 주문자가 결제 시 "실제 입금자명"을 별도 입력할 수 있도록 하여, 동명이인이나 다른 이름(예: 병원명)으로 입금 시 매칭 성공률을 높임.
* **목표 2**: 취소/반품 시 PG 연동이 없는 무통장입금 결제건에 한해 고객으로부터 '환불 계좌 정보(은행, 계좌번호, 예금주)'를 수집하여 관리자에게 전달함.

## 2. 세부 구현 사항 (Proposed Changes)

### 2.1 `src/types/index.ts` 수정
* `OrderInput` 인터페이스에 `depositorName?: string;` 속성 추가
* `ClaimInfo` 인터페이스에 무통장 환불을 위한 `refundBank?: string; refundAccount?: string; refundHolder?: string;` 추가

### 2.2 `src/pages/CheckoutPage.tsx` 수정
* 무통장입금(`paymentType === 'transfer'`) 선택 시, UI 하단에 "입금자명"을 입력받는 `<input>` 필드 추가 (기본값: 주문자 이름 `userProfile?.name`)
* 결제하기 버튼 클릭 시 `orderService.createOrder`의 페이로드에 `depositorName` 포함하여 전달.

### 2.3 `src/services/orderService.ts` 수정
* **`createOrder`**: 
  * `paymentMethod === 'transfer'`일 경우, `vact_name` 데이터베이스 필드에 `orderInput.depositorName`을 저장하도록 매핑. (기존 스키마를 활용하여 별도 DB 마이그레이션 없이 입금자명 보관)
* **`requestClaim`**:
  * 환불 계좌 정보 3종(`refundBank`, `refundAccount`, `refundHolder`)을 매개변수로 추가로 받음.
  * 해당 정보들을 JSON 필드인 `claim_info` 내부에 병합(merge)하여 저장.

### 2.4 `src/pages/OrdersPage.tsx` 수정
* `ClaimModal` 컴포넌트를 수정하여 무통장입금 주문(`paymentMethod === 'transfer'`)의 '결제 취소(CANCEL)' 및 '반품(RETURN)' 요청 시에만 환불 계좌 정보 입력 폼(은행선택, 계좌번호, 예금주)을 표시.
* 필수값 검증 후 `orderService.requestClaim` 호출 시 함께 전달.
* `OrdersPage` 메인 컴포넌트에서 `ClaimModal` 호출 시 `paymentMethod` prop을 추가로 전달하도록 수정.

### 2.5 `src/pages/admin/OrderManagementPage.tsx` 수정
* `adminService.getOrders` 등에서 불러온 무통장입금 주문의 `vact_name`(실 입금자명)을 매칭 키로 최우선 사용하도록 로직 업데이트.
  ```typescript
  // customerName 대신 vactName(입금자명)을 우선 적용
  const targetName = o.vactName || o.customerName;
  ```

### 2.6 `src/pages/admin/OrderDetailPage.tsx` 수정
* 클레임 정보(`order.claimInfo`)를 렌더링하는 UI 블록에, 만약 `refundAccount` 정보가 존재한다면 관리자가 볼 수 있도록 노출.

## 3. 검증 계획
* 무통장입금으로 테스트 주문을 생성하며, 실제 이름과 다른 입금자명(예: "테스트병원")을 입력.
* 관리자 입금대기 목록 엑셀 업로드 시 "테스트병원"으로 매칭이 정상 통과되는지 확인.
* 해당 주문을 결제완료 후 "취소" 요청 시 환불 계좌 폼이 뜨는지, 그리고 어드민 상세페이지에 환불 계좌가 정상 노출되는지 확인.
