# 무통장입금 엑셀 대량 매칭 기능 구현 계획서

관리자 [주문 관리] 페이지의 '입금대기' 리스트 하단에 은행 입출금 엑셀 파일을 업로드하여 무통장입금 건을 일괄 매칭 및 승인 처리하는 기능을 추가합니다.

## User Review Required

> [!IMPORTANT]
> **엑셀 파일 양식 확인**
> 은행(우리은행 등)에서 다운로드 받는 엑셀 파일의 정확한 열 이름(Column Name)을 알려주시거나 예시를 주시면 매칭 로직을 정확히 구현할 수 있습니다.
> - 통상적인 예시: `입금자명` / `입금액` (또는 `적요`, `기재내용`, `거래금액` 등)
> 답변을 주시면 맞춰서 로직을 작성하겠습니다. (일단 일반적인 '입금자명', '입금액'으로 가정하여 설계합니다.)

## Proposed Changes

### Frontend Pages

#### [MODIFY] [OrderManagementPage.tsx](file:///Users/daniel/Documents/jeisys/src/pages/admin/OrderManagementPage.tsx)
- 상단 패키지 임포트: `import * as XLSX from 'xlsx';` 추가
- 상태 추가: `excelFile`, `matchedDeposits`, `unmatchedDeposits`, `isMatchingModalOpen`
- `selectedStatus === 'pending'` 일 때 목록 하단에 엑셀 파일 업로드 영역 UI 렌더링.
- 엑셀 업로드 시 `XLSX`를 이용해 JSON으로 파싱 후, 현재 `pending` 상태인 주문의 `customerName`(혹은 별도 입금자명)과 `totalAmount`를 비교하는 자동 매칭 로직 구현.
- 매칭 성공 건과 실패 건을 보여주는 미리보기 모달(Preview Modal) 추가.
- 일괄 승인 버튼 클릭 시 백엔드 API를 호출하여 상태를 `paid`로 일괄 변경.

### Services

#### [MODIFY] [adminService.ts](file:///Users/daniel/Documents/jeisys/src/services/adminService.ts)
- `bulkConfirmDeposits(orderIds: string[])`: 여러 주문 ID를 받아 상태를 `paid`로 일괄 업데이트하고, `payment_history` 테이블에 "무통장입금 엑셀 일괄 확인" 내역을 Insert하는 함수 추가.

## Verification Plan
1. 주문 관리 페이지에서 '입금대기' 탭 클릭 시 하단에 엑셀 업로드 영역이 나오는지 확인.
2. 테스트용 엑셀(입금자명, 금액 포함)을 업로드하여 대기 중인 주문과 정확히 매칭되는지 확인.
3. 미리보기에서 확인 후 일괄 승인 시, 상태가 `paid`로 변경되고 결제내역에 기록되는지 확인.
