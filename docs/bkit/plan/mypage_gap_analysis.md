# PDCA Plan — 마이페이지 Gap Analysis
> 관리자 주문/배송 처리 흐름 대비 고객 마이페이지 누락 기능 분석

---

## 🔴 P (Plan) — 현황 분석

### 관리자가 처리할 수 있는 주문 상태 (admin-side)

| 상태값 | 의미 |
|---|---|
| `pending` | 입금대기 |
| `paid` | 결제완료 |
| `partially_shipped` | 부분발송 |
| `shipped` | 배송중 |
| `delivered` | 배송완료 |
| `cancel_requested` | 취소요청 |
| `return_requested` | 반품요청 |
| `returning` | 반품수거중 |
| `returned` | 반품완료 |
| `exchange_requested` | 교환요청 |
| `partially_refunded` | 부분환불 |
| `cancelled` | 취소완료 |

---

## 🟠 Gap — 고객 마이페이지(OrdersPage) 누락 목록

### 1. 🚨 상태 표시 불완전 (치명적)

현재 `OrdersPage.tsx`의 `getStatusBadge()`는 6개 상태만 처리:

```
pending / paid / processing / shipped / delivered / cancelled
```

> **누락 상태**: `partially_shipped`, `cancel_requested`, `return_requested`, `returning`, `returned`, `exchange_requested`, `partially_refunded`

고객은 "부분발송"이나 "반품요청" 상태를 볼 방법이 없음. UI가 아무 표시 없이 깨짐.

---

### 2. 🚨 클레임(취소/반품/교환) 요청 기능 미구현 (치명적)

현재 `OrdersPage.tsx`에서 `delivered` 상태일 때 **반품신청 / 교환신청 버튼**이 존재하지만:

```tsx
<button>반품신청</button>   // alert("") 같은 기능 없음, 더미 버튼
<button>교환신청</button>   // 동일
```

- 관리자측에는 `POST /api/admin/orders/:id/claim`, `APPROVE/REJECT`처리, `claimInfo` 필드가 완비되어 있음
- 고객측은 **버튼만 있고 실제 API 호출·사유 입력 모달 없음**

---

### 3. 🟡 클레임 처리 결과를 고객이 확인할 수 없음

관리자가 클레임을 처리하면 `order.claimInfo`에 다음 데이터가 저장됨:
- `type` (CANCEL / RETURN / EXCHANGE)
- `reason` (고객 신청 사유)
- `requestedAt`
- `processedAt`
- `rejectedReason` (거절 사유)
- `returnTrackingNumber` / `exchangeTrackingNumber`

**고객 마이페이지에는 이 정보를 노출하는 UI가 없음.**
→ 관리자가 클레임을 거절하거나 승인해도 고객이 알 수 없음.

---

### 4. 🟡 부분발송 정보 노출 없음

관리자는 아이템별 `shippedQuantity`를 관리하며 부분발송을 처리하고 `partially_shipped` 상태로 전환함.

**고객 화면에는 "몇 개 발송됐고 몇 개 남았는지" 표시가 없음.**
→ 주문한 10개 중 5개만 왔을 때 고객은 버그인지 의도된 것인지 알 수 없음.

---

### 5. 🟡 다중 송장 (shipments) 표시 없음

관리자 Order 모델에는 `shipments: Array<{trackingNumber, shippedAt, isPartial, items}>` 배열이 있음.
부분발송이 여러 번 일어나면 송장이 여러 개 생성됨.

**현재 고객 마이페이지는 `deliveryTrackingNumber` 단일 필드만 표시함.**
→ 분할배송 시 나머지 송장을 고객이 확인 불가.

---

### 6. 🟡 Order type 정의 불일치

`types/index.ts`의 `Order` 인터페이스가 너무 빈약함:

```ts
status: 'pending' | 'processing' | 'shipped' | 'delivered';  // ❌ 누락 다수
```

- `partially_shipped`, `cancel_requested`, `return_requested`, `returned`, `exchange_requested`, `partially_refunded`, `cancelled` 누락
- `claimInfo`, `shipments`, `paymentHistory`, `price` (item별) 필드 없음

---

### 7. 🟡 가상계좌 결제 입금 안내 UI 없음

Order에 `vactBankName`, `vactNum`, `vactName`, `vactInputDeadline` 필드가 있지만 결제 안내 UI가 없음.
`pending` 상태일 때 고객에게 **"이 계좌로 입금해 주세요"** 안내가 표시되어야 함.

---

### 8. 🟢 재주문(Reorder) 기능 미구현

```tsx
const handleReorder = (orderId: string) => {
  alert(`주문 ${orderId}를 장바구니에 복사합니다.`);  // ← alert만 있음
};
```

실제 장바구니 추가 로직이 없음.

---

## 📊 우선순위 매트릭스

| 항목 | 심각도 | 복잡도 | 우선순위 |
|---|---|---|---|
| 1. 상태 뱃지 완성 | 🔴 치명적 | 낮음 | **P0** |
| 2. 클레임 요청 모달 구현 | 🔴 치명적 | 중간 | **P0** |
| 7. 가상계좌 입금 안내 | 🔴 치명적 | 낮음 | **P0** |
| 3. 클레임 결과 표시 | 🟡 중요 | 낮음 | **P1** |
| 4. 부분발송 진행률 표시 | 🟡 중요 | 낮음 | **P1** |
| 6. Order 타입 정의 수정 | 🟡 중요 | 낮음 | **P1** |
| 5. 다중 송장 표시 | 🟡 보통 | 중간 | **P2** |
| 8. 재주문 기능 구현 | 🟢 낮음 | 중간 | **P3** |

---

## 📋 D (Do) — 구현 계획

### Phase 1: 긴급 수정 (P0)
1. `Order` 타입에 누락된 상태값 + 필드 추가
2. `getStatusBadge()` 확장 — 13개 상태 모두 커버
3. 가상계좌 입금 안내 UI 추가 (`pending` + `vactNum` 있을 때)
4. 반품/교환 신청 모달 구현 + API 연동

### Phase 2: 고객 경험 개선 (P1)
5. 클레임 처리 결과 표시 섹션 (승인/거절 사유)
6. 부분발송 상태 표시 (N/M개 발송됨 진행률)
7. 다중 송장 번호 목록 표시

### Phase 3: 기능 완성 (P2~P3)
8. 재주문 기능 실제 구현 (장바구니 일괄 추가)

---

**분석 완료 — 승인 시 Phase 1부터 순차 구현을 시작합니다.**
