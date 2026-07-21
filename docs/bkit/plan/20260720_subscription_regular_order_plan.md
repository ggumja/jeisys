# PDCA Plan: 제이시스 쇼핑몰 정기공급(정기구독/분할결제) 구현 검토

> 작성일: 2026-07-20  
> 트리거: `/pdca plan`  
> 목표: 운영안의 조건으로 정기구독 기능이 현재 시스템에 구현 가능한지 검토 및 구현 계획 수립

---

## 1. Plan — 운영안 핵심 요구사항 분석

### 운영안 요약

| 항목 | 내용 |
|------|------|
| 상품 | 알파팁 100개 / 200개 2종 운영 |
| 결제·출고 | 고객이 1/2/3/4/6개월 주기 중 선택하여 분할 결제 및 출고 |
| 출고 수량 | 회차별 5개 단위로 설정, 총 수량이 맞지 않는 잔여수량은 마지막 회차에 일괄 출고 |
| 운영기간 | 최대 12개월 이내 |
| 중도해지 | 약정 할인 혜택 종료, 기출고 수량 기준 할인 재산정 및 재가입 제한 가능성 |

### 결제/출고 스케줄 매트릭스

| 결제주기 | 100개 출고수량 | 200개 출고수량 | 결제·출고 횟수 | 총 운영기간 |
|---------|------------|------------|------------|----------|
| 1개월   | 10개       | 20개       | 10회       | 10개월   |
| 2개월   | 20개       | 40개       | 5회        | 10개월   |
| 3개월   | 25개       | 50개       | 4회        | 12개월   |
| 6개월   | 50개       | 100개      | 2회        | 12개월   |

> **핵심 로직**: 출고수량 = 회차별 자동 산정. 총 수량이 회차별 출고수량으로 딱 나누어지지 않을 경우, 마지막 회차에 잔여수량 일괄 출고.

---

## 2. 현재 시스템 현황 분석 (As-Is)

### 이미 구현된 인프라

| 구성요소 | 현황 | 파일 |
|---------|------|------|
| `user_payment_methods` 테이블 | ✅ 존재 (KICC 빌링키 저장) | `20240413_payment_billing_setup.sql` |
| `subscriptions` 테이블 | ✅ 기초 스키마 존재 | `20240413_payment_billing_setup.sql` |
| Admin `SubscriptionListPage` | ✅ Mock 데이터 기반 UI 완성 | `admin/SubscriptionListPage.tsx` |
| User `MySubscriptionsPage` | ✅ Mock 데이터 기반 UI 완성 | `MySubscriptionsPage.tsx` |
| 카드 등록 Modal | ✅ 구현됨 | `CardRegistrationModal` |
| KICC 빌링키 결제 서비스 | ⚠️ Mock/시뮬레이션 상태 | `paymentService.ts` |
| `CheckoutPage` 정기구독 주기 상태 | ✅ `subscriptionCycle` state 존재 | `CheckoutPage.tsx` (L56) |

### 현재 Gap (미구현 항목)

| 필요 기능 | 현황 |
|---------|------|
| `subscriptions` 테이블 — 분할출고 스케줄 필드 | ❌ 없음. `cycle_days`만 있고 출고 횟수·수량 컬럼 없음 |
| `subscription_shipments` (회차별 스케줄 테이블) | ❌ 없음 |
| 상품별 정기구독 등록 UI (회차 선택 → 스케줄 생성) | ❌ 없음 |
| 자동 결제 실행 로직 (Cron/Edge Function) | ❌ 없음 (paymentService는 Mock) |
| 중도해지 로직 (할인 재산정, 재가입 제한) | ❌ 없음 |
| 관리자 수동 2회 재결제 처리 (D+1, D+3) | ❌ 없음 |
| 잔여수량 → 마지막 회차 일괄 출고 로직 | ❌ 없음 |
| 알파팁 상품 정기구독 카테고리 등록 | ❌ 없음 |

---

## 3. 구현 가능성 판단

**판단: 구현 가능 (단, 추가 작업 필요)**

현재 시스템은 Supabase + KICC 빌링키 기반으로 정기구독의 기초 인프라가 준비되어 있습니다.
운영안의 모든 조건은 기술적으로 구현 가능하며, 아래와 같이 단계를 나누어 진행합니다.

---

## 4. 구현 계획 (To-Be)

### Phase 1: DB 스키마 확장 (1~2일)

**1-1. `subscriptions` 테이블 컬럼 추가**

```sql
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id),
  ADD COLUMN IF NOT EXISTS total_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cycle_months INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_rounds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qty_per_round INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_round_qty INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_round INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_rate NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejoin_restricted_until DATE;
```

**1-2. `subscription_shipments` 테이블 신규 생성**

```sql
CREATE TABLE public.subscription_shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  round_no INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  status VARCHAR DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'shipped', 'failed', 'skipped', 'cancelled')),
  pg_tid VARCHAR,
  order_id UUID REFERENCES public.orders(id),
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_sub_shipments_subscription ON public.subscription_shipments(subscription_id);
CREATE INDEX idx_sub_shipments_scheduled ON public.subscription_shipments(scheduled_date)
  WHERE status = 'pending';
```

---

### Phase 2: 비즈니스 로직 서비스 구현 (2~3일)

**`subscriptionService.ts` 신규 작성** — 주요 함수:

- `createSubscription(params)` — 구독 생성 + 회차별 스케줄 자동 생성
- `calculateSchedule(totalQty, cycleMonths)` — 출고 스케줄 계산 (잔여수량 마지막 회차 처리)
- `executeRound(shipmentId)` — 회차 결제 실행 (KICC 빌링키 호출)
- `retryFailedPayment(shipmentId)` — 결제 실패 시 D+1, D+3 재시도
- `cancelSubscription(subId, reason)` — 중도해지 + 할인 재산정 + 재가입 제한
- `pauseSubscription(subId)` / `resumeSubscription(subId)` — 일시정지/재개

**스케줄 계산 핵심 로직 (의사코드)**

```
totalRounds = totalQty / (qtyPerRound)
baseQty = floor(totalQty / totalRounds / 5) * 5  // 5개 단위
lastRoundQty = totalQty - baseQty * (totalRounds - 1)  // 잔여 → 마지막 회차
```

---

### Phase 3: Supabase Edge Function (자동 결제 Cron) (1~2일)

- `supabase/functions/process-subscription-billing/index.ts`
- 매일 자정 실행 (cron: `0 0 * * *`)
- `subscription_shipments.scheduled_date = today AND status = 'pending'` 조회
- KICC 빌링키로 결제 요청
- 실패 시: D+1, D+3 재시도 큐 등록
- 최종 실패 시: 관리자 알림 발송

---

### Phase 4: 프론트엔드 UI 수정 (2~3일)

1. **상품 상세 페이지** — 정기구독 선택 UI (수량 선택 → 주기 선택 → 회차별 출고 프리뷰)
2. **CheckoutPage** — 정기구독 결제 흐름 (카드 등록 필수, 1회차 즉시 결제 → 구독 생성)
3. **MySubscriptionsPage** — Mock → 실제 DB 연동, 회차별 출고 스케줄 뷰 추가
4. **SubscriptionListPage (Admin)** — Mock → 실제 DB 연동, 수동 재처리 버튼, 중도해지 관리

---

### Phase 3 (변경): 자동 결제 Cron — 데모 페이지 범위 제외

> 현재 구현 범위는 데모 페이지이므로 Supabase Edge Function Cron은 제외합니다.
> 실제 서비스 전환 시 별도 Phase로 추가 구현합니다.

---

### Phase 4: 중도해지 정책 구현 (1일)

**중도해지 흐름**
1. 고객 → 마이페이지에서 해지 신청 (사유 입력)
2. 관리자 어드민 → **해지신청 목록** 페이지에서 확인
3. 관리자가 재산정 금액 확인 후 **청구 / 청구하지 않음** 선택
   - 청구: 표시된 차액 금액을 메모와 함께 처리 완료 기록
   - 청구 안 함: **메모 필수 입력** 후 처리 완료
4. 처리 완료 시 구독 status → `cancelled`, 이후 회차 → `cancelled`

| 항목 | 구현 내용 |
|------|----------|
| 할인 재산정 표시 | 기출고 수량 기준 일반 수량별 할인율로 자역 청구 차액 계산하여 화면에 표시 |
| 관리자 해지신청 목록 | 해지 요청 고객명·구독번호·재산정 금액 표시, 처리 대기/완료 필터 |
| 청구 처리 | 관리자가 금액 확인 후 처리 완료 버튼 → 처리 이력 기록 |
| 청구 안 함 처리 | 사유 메모 필수 입력 → 확인 후 처리 완료 → 이력 기록 |
| 재가입 제한 | `rejoin_restricted_until` 컬럼 체크 |
| 미출고분 중단 | 이후 결제·출고 스케줄 status = `cancelled` 처리 |

---

## 5. 총 예상 일정 (데모 페이지 기준)

| Phase | 내용 | 예상 기간 |
|-------|------|---------|
| Phase 1 | DB 스키마 확장 | 1~2일 |
| Phase 2 | 서비스 로직 구현 | 2~3일 |
| Phase 3 | 프론트엔드 UI 연동 | 2~3일 |
| Phase 4 | 중도해지 정책 (관리자 해지처리 UI) | 1일 |
| **합계** | | **6~9일** |

> Edge Function Cron은 실제 서비스 전환 시 별도 추가 예정.
> 목표 시행일 (2026년 8월) 기준으로 일정 내 구현 가능합니다.

---

## 6. 확정된 정책 (2026-07-21)

| 이슈 | 결정 사항 |
|------|----------|
| KICC 빌링키 연동 | 계약 준비 완료. 단, 현재 데모 페이지이므로 실제 결제 없이 Mock 유지 |
| 알파팁 상품 등록 | 정기구독 전용 SKU로 신규 등록 (기존 상품과 분리) |
| 중도해지 청구 방식 | 관리자 해지신청 목록 → 수동 청구/비청구 결정. 비청구 시 메모 필수 |
| Edge Function Cron | 데모 페이지 범위 제외. 실제 서비스 전환 시 별도 구현 |

---

## 7. 리스크

| 리스크 | 수준 | 대응 |
|--------|------|----- |
| Mock 결제 → 실제 결제 전환 시 흐름 변경 | Medium | 데모 단계에서 인터페이스(subscriptionService) 추상화하여 실제 연동 시 paymentService만 교체 |
| 잔여수량 계산 엣지케이스 | Medium | 5개 단위로 딱 나누어지지 않는 케이스 단위 테스트 필수 |
| 관리자 해지 처리 누락 | Low | 미처리 건 대시보드 뱃지 표시로 누락 방지 |

---

*이 문서는 bkit PDCA 프레임워크에 따라 작성되었습니다.*
