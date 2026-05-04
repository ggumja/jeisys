# 복합결제 UI 설계안 (Split Payment UI Plan)

총 결제 금액을 여러 카드로 나누거나, 카드와 가상계좌로 분할하여 결제할 수 있는 "복합결제" UI 설계 제안입니다. 

## User Review Required

> [!IMPORTANT]
> **정기배송 상품 포함 시 복합결제 제한**
> 정기배송 상품은 특정 1개의 카드(빌링키)로 매 주기마다 자동 결제되어야 합니다. 따라서 장바구니에 정기배송 상품이 포함된 경우, 복합결제 기능을 비활성화하거나 정기결제용 카드 1장을 필수로 지정하는 구조가 필요합니다. 본 설계에서는 **"정기배송 상품 포함 시 복합결제 불가"** 정책을 제안합니다. 동의하시나요?

## Open Questions

> [!WARNING]
> **백엔드 결제 구조 확인**
> 현재 `orderService.createOrder`는 단일 `paymentMethod`와 단일 `billingKeyId`만 받도록 되어 있습니다.
> 1. 복합결제 시 여러 번의 승인 요청(예: 카드 A 300만 원 승인, 카드 B 200만 원 승인)을 프론트엔드에서 각각 진행 후 주문을 생성해야 하나요?
> 2. 아니면 주문 정보에 분할 결제 내역 배열(Array)을 실어서 넘기면 서버(PG 연동부)에서 다중 승인을 처리해주나요? 

---

## Proposed Changes

### UI Flow & Layout

결제 화면(`CheckoutPage.tsx`)의 [결제 수단] 영역을 다음과 같이 개편합니다.

1. **결제 방식 선택 (Mode Selection)**
   - `[일반 결제 (단일)]` / `[복합 결제 (나눠서 결제)]` 탭 분리
   - 복합결제 선택 시, 기존 단일 카드/가상계좌 선택 UI가 숨겨지고 **"분할 결제 설정 패널"**이 노출됩니다.

2. **분할 결제 설정 패널 (Split Payment Configuration)**
   - **결제 수단 목록 (Dynamic Rows):**
     - 첫 진입 시 2개의 입력 행(Row) 제공.
     - 각 행 구성요소:
       - `결제 방식 드롭다운` (법인카드 / 가상계좌)
       - `카드 선택 드롭다운` (법인카드 선택 시 활성화)
       - `결제 금액 입력칸`
       - `[잔액 적용]` 버튼 (남은 결제 금액을 한 번에 입력)
       - `[X]` 행 삭제 버튼
   - **결제 수단 추가 버튼:** `+ 결제 수단 추가` 버튼으로 최대 5개(임의)까지 늘릴 수 있음.

3. **금액 밸런스 검증 (Validation UX)**
   - 설정 패널 하단 또는 [결제 정보 요약] 영역에 실시간 검증 알림 표시:
     - `총 결제 금액: 10,000,000 원`
     - `지정된 금액: 8,000,000 원`
     - `남은 결제 금액: 2,000,000 원` (빨간색/강조 텍스트)
   - 남은 결제 금액이 정확히 **0원**이 되었을 때만 우측 하단의 `[주문 완료]` 버튼이 활성화됨.

### Data Structure (프론트엔드 상태 관리)

```typescript
// 상태 관리 예시
interface SplitPaymentMethod {
  id: string; // 행 고유 ID
  type: 'credit' | 'virtual';
  cardId?: string; // credit일 경우 선택된 카드 ID
  amount: number; // 분할된 결제 금액
}

const [paymentMode, setPaymentMode] = useState<'single' | 'split'>('single');
const [splitMethods, setSplitMethods] = useState<SplitPaymentMethod[]>([
  { id: '1', type: 'credit', amount: 0 },
  { id: '2', type: 'virtual', amount: 0 }
]);
```

### Component

#### [MODIFY] src/pages/CheckoutPage.tsx
- 상태 변수 `paymentMode` 및 `splitMethods` 추가.
- `calculateTotal` 대비 `splitMethods` 총합을 검증하는 로직 작성.
- [결제 수단] 영역 조건부 렌더링 (단일 모드 / 분할 모드 UI 분기).
- "결제하기" `handleOrder` 함수 내 분할 결제 데이터 전송 로직 분기.

## Verification Plan

### Manual Verification
- 복합결제 탭 클릭 후 여러 개의 결제 수단 행이 정상적으로 렌더링되는지 확인.
- 결제 수단 행을 추가(+), 삭제(-)할 수 있는지 확인.
- 총 결제 금액과 지정 금액의 합이 다를 경우 "결제하기" 버튼이 `Disabled` 되는지 확인.
- 남은 결제 금액이 "전액 적용" 버튼 클릭 시 입력 폼에 정확히 기입되는지 검증.
- 복합 결제 데이터가 백엔드로 올바른 포맷(배열 형태 등)으로 전송되는지 네트워크 탭 확인.
