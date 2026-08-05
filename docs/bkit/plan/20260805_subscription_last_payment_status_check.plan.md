# [PDCA Plan] 정기공급 - [마지막 결제 취소 & 해지] 주문 상태별 검증 및 팝업 제어

## 1. 개요 및 목적
`[마지막 결제 취소 & 해지]` 버튼 클릭 시, 해당 마지막 결제건의 주문/배송 처리 상태를 사전에 조회 및 검증하여 **부적절한 결제 취소를 방지**하고 정확한 안내 메세지를 노출합니다.

## 2. 상태별 검증 및 처리 규칙

| 구분 | 주문 상태 (`orders.status`) | 노출 메세지 | 팝업 오픈 여부 |
| :--- | :--- | :--- | :--- |
| **상품준비중** | `processing` | `"상품준비중 상태입니다. 결제완료로 변경하신 뒤 다시 시도하세요."` | **차단 (팝업 미오픈)** |
| **발송/배송중/완료** | `partially_shipped`, `shipped`, `delivered` | `"이미 발송중/배송완료 상태라 결제취소가 불가능합니다."` | **차단 (팝업 미오픈)** |
| **상품준비중 전** | `pending`, `paid` | - | **정상 오픈 (`cancelLastPaymentMode = true`)** |

## 3. 대상 파일 및 수정 내역
1. `src/services/subscriptionService.ts`: `SubscriptionRow`에 `orderStatus` 매핑 및 `getAllSubscriptions` 데이터 쿼리 연동
2. `src/pages/admin/SubscriptionListPage.tsx`: `onOpenCancelLastPaymentModal` 사전 검증 로직 추가 및 메시지 토스트 처리
