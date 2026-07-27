# PDCA Plan: 마케팅 관리 내 쿠폰 관리 기능 신규 구축

## 1. 개요 (Overview)
본 계획서는 제이시스 메디컬 쇼핑몰 어드민 내 **마케팅 관리 > 쿠폰 관리** 기능 신규 구축을 목표로 합니다.
쿠폰 적용 타겟 대상(특정 카테고리, 특정 장비, 특정 상품 한정), 할인 방식(정률 할인 %, 정액 할인 원), 사용 제한 조건을 정밀하게 설정할 수 있는 데이터 구조 및 UI/UX 설계와 발급/적용/검증 로직 전반을 정의합니다.

---

## 2. 요구사항 및 주요 기능 명세 (Requirements & Specifications)

### 2.1 쿠폰 타겟팅 범위 (Scope & Target)
1. **전체 상품 쿠폰 (All Products)**: 전체 상품 대상 적용
2. **특정 카테고리 한정 쿠폰 (Category Limited)**: 지정된 카테고리(예: 레이저, RF, 소모품 등) 상품 구매 시에만 적용
3. **특정 장비 한정 쿠폰 (Equipment Limited)**: 지정된 특정 장비(예: Potenza, LinearZ 등) 전용 소모품/부품 구매 시 적용
4. **특정 상품 한정 쿠폰 (Product Limited)**: 지정된 단일/복수 특정 상품(SKU 기준) 대상 한정 적용

### 2.2 할인 방식 (Discount Type)
1. **정률 할인 (%)**: 주문 상품 금액의 지정 비율(%) 할인
2. **정액 할인 (원)**: 지정된 고정 금액(원) 할인

### 2.3 할인 및 금액 제한 조건 & 사용기한 (Usage Conditions & Restrictions)
1. **최소 주문 금액 (Minimum Order Amount)**: 
   - 쿠폰 사용을 위해 장바구니/주문서에서 해당 쿠폰 적용 대상 상품 금액 합계가 설정한 최소 금액 이상이어야 함.
   - *예시: 10,000원 설정 시, 대상 상품 결제 총액 10,000원 미만 주문건에서는 사용 불가.*
2. **최대 할인 금액 (Maximum Discount Amount)**:
   - 정률 할인(%) 계산 시 할인금액 산출값이 최대 할인 금액 한도를 초과할 수 없음.
   - *예시: 20% 할인 쿠폰, 최대 할인금액 50,000원 설정 시, 1,000,000원 결제 시 20만 원이 아닌 5만 원만 할인 적용.*
   - 정액 할인의 경우 최대 할인 금액 설정 비활성화 또는 입력된 정액금액 이하 처리.
3. **사용기한 지정 (Validity Period / Expiration Date)**:
   - **고정 기간 지정 (Date Range)**: 시작일시~종료일시 지정 (ex : 2026-08-01 ~ 2026-08-31 까지 사용 가능)
   - **발급일 기준 유효기간 지정 (Relative Days)**: 발급 후 N일간 사용 가능 (ex : 발급일로부터 7일/30일/90일 이내)
   - **만료 일시 자동 계산**: 회원에게 발급되는 시점에 `user_coupons.expires_at`이 결정되며, 결제 시 해당 시점이 경과된 쿠폰은 자동 사용 불가 및 `EXPIRED` 처리.

### 2.4 쿠폰 관리 및 발급/주문 적용 세부 기능
- **쿠폰 등록 및 관리 UI**: 관리자 어드민(`CouponManagementPage.tsx`, `CouponRegisterModal.tsx`)에서 쿠폰명, 할인 유형, 범위, 타겟 대상 선택, 발급 기간, **사용기한(고정 기간 지정 또는 발급일 기준 N일)**, 수량 제한 설정.
- **쿠폰 발급 방식**:
  - 관리자 수동 일괄/지정 발급 (`MemberManagementPage.tsx` 연동)
  - 회원 직접 다운로드 쿠폰 (마이페이지/상품 상세)
  - 조건부 자동 발급 (신규가입, 첫구매 등)
- **주문서(CheckoutPage) 결제 시 검증 로직**:
  - 장바구니/주문서 내 쿠폰 적용 대상 상품 추출 및 금액 합산
  - **사용기한(유효기간) 이내 여부 체크 (`expires_at >= 현재시간`)**
  - 최소 주문 금액 충족 여부 체크
  - 정률/정액에 따른 할인액 계산 및 최대 할인금액 캡핑(Capping)
  - 최종 주문 금액 차감 및 주문 완료 시 쿠폰 사용 상태 업데이트 (`USED`)

---

## 3. DB 데이터 모델 설계 (Database Schema Design)

### 3.1 `coupons` (쿠폰 마스터 테이블)
```sql
CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,                    -- 쿠폰명
  code VARCHAR(50) UNIQUE,                        -- 쿠폰 코드 (선택/발급용)
  discount_type VARCHAR(20) NOT NULL,            -- 'PERCENTAGE' (정률) | 'FIXED_AMOUNT' (정액)
  discount_value DECIMAL(12,2) NOT NULL,          -- 할인 비율(%) 또는 할인 금액(원)
  target_scope VARCHAR(20) NOT NULL,             -- 'ALL' | 'CATEGORY' | 'EQUIPMENT' | 'PRODUCT'
  min_order_amount DECIMAL(12,2) DEFAULT 0,      -- 최소 주문 금액 제한
  max_discount_amount DECIMAL(12,2) DEFAULT NULL, -- 최대 할인 금액 (정률 할인 시 한도)
  issue_type VARCHAR(20) DEFAULT 'MANUAL',        -- 'MANUAL' (관리자 발급) | 'DOWNLOAD' (다운로드) | 'AUTO'
  total_quantity INT DEFAULT NULL,                -- 총 발급 가능 수량 (NULL: 무제한)
  issued_quantity INT DEFAULT 0,                 -- 현재 발급된 수량
  validity_type VARCHAR(20) DEFAULT 'DATE_RANGE', -- 'DATE_RANGE' (기간 지정) | 'DAYS_FROM_ISSUE' (발급후 N일)
  start_date TIMESTAMP NULL,                      -- 유효 시작일
  end_date TIMESTAMP NULL,                        -- 유효 종료일
  valid_days INT DEFAULT NULL,                   -- 발급 후 유효 일수
  is_active BOOLEAN DEFAULT TRUE,                -- 활성화 여부
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 `coupon_targets` (쿠폰 타겟 대상 매핑 테이블)
```sql
CREATE TABLE IF NOT EXISTS coupon_targets (
  id VARCHAR(36) PRIMARY KEY,
  coupon_id VARCHAR(36) NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL,  -- 'CATEGORY' | 'EQUIPMENT' | 'PRODUCT'
  target_id VARCHAR(100) NOT NULL,   -- 카테고리 ID, 장비 ID, 또는 상품 ID/SKU
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 `user_coupons` (회원 보유 쿠폰 발급/사용 이력 테이블)
```sql
CREATE TABLE IF NOT EXISTS user_coupons (
  id VARCHAR(36) PRIMARY KEY,
  coupon_id VARCHAR(36) NOT NULL REFERENCES coupons(id),
  user_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) DEFAULT 'UNUSED',  -- 'UNUSED' | 'USED' | 'EXPIRED'
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL,
  order_id VARCHAR(36) NULL,           -- 사용된 주문 ID
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. 세부 구현 단계 (Phase & Task Breakdown)

### Phase 1: DB 마이그레이션 & 서비스 엔티티/유틸 정의
- `docs/db/sql/20260728_coupon_management.sql` 스크립트 작성
- `src/types/coupon.ts` 쿠폰 타입 인터페이스 정의
- `src/services/couponService.ts` 쿠폰 CRUD, 발급, 할인금액 계산 유틸 함수 작성

### Phase 2: 어드민 마케팅 관리 UI 구현
- Sidebar 라우팅 추가: **마케팅 관리 > 쿠폰 관리 (`/admin/marketing/coupons`)**
- `CouponManagementPage.tsx`:
  - 쿠폰 목록 테이블 (쿠폰명, 타겟, 할인유형, 최소주문금액, 최대할인금액, 발급현황, 상태, 기간)
  - 필터 (타겟별, 상태별, 검색)
- `CouponRegisterModal.tsx`:
  - 신규 쿠폰 등록 및 수정 폼
  - 라디오 버튼으로 `정률할인(%)` / `정액할인(원)` 선택
  - 타겟 설정 (전체 / 특정 카테고리 / 특정 장비 / 특정 상품 멀티 셀렉터 연동)
  - 조건 설정 (최소 주문 금액, 최대 할인 금액 실시간 유효성 검증)
- `CouponIssueModal.tsx`:
  - 회원 선택 일괄 발급 기능

### Phase 3: 쇼핑몰 프론트 및 주문서 연동 (Checkout & MyPage)
- **`CheckoutPage.tsx` 쿠폰 사용 UI 및 할인 연동**:
  - 결제 금액/포인트/크레딧 섹션 상단에 **[쿠폰 할인] 섹션** 신규 추가
  - 현재 로그인 회원의 보유 쿠폰 중 **사용 가능 쿠폰 목록(유효기간 이내, 최소 주문금액 충족, 적용 타겟 상품 존재)** 드롭다운 및 선택 UI 구성
  - **쿠폰 선택 모달/드롭다운**:
    - 쿠폰명, 할인 혜택(정률%/정액원), 사용기한(`~2026-08-31` 또는 `만료 D-3`), 최소주문금액/최대할인금액 제한 조건 표시
    - 조건 미충족 쿠폰은 비활성화(Disabled) 및 미충족 사유(예: "최소 주문금액 30,000원 이상 시 사용 가능") 가이드 노출
  - **할인금액 실시간 계산 및 결제 총액 반영**:
    - `최종 결제금액 = 상품 총액 - 쿠폰 할인액 - 크레딧 - 포인트`
    - 정률 할인의 경우 대상 상품 금액 합산액 기준 할인액 산출 후 `max_discount_amount` 한도 적용
- **`MyPage / 쿠폰함`**:
  - 사용자 보유 쿠폰 조회 (사용가능 / 사용완료 / 기간만료 탭 분류) 및 조건 표시

---

## 5. 검증 계획 (Verification Plan)

### 5.1 계산 로직 검증 테스트 (Unit / Integration Verification)
1. **정률 할인 + 최대 할인 금액 제한 시나리오**:
   - 20% 할인 쿠폰 (최소 주문 10,000원, 최대 할인 5,000원)
   - 20,000원 주문 시: 계산상 4,000원 할인 -> 4,000원 적용 확인
   - 50,000원 주문 시: 계산상 10,000원 할인 -> 최대 제한 5,000원 적용 확인
2. **최소 주문 금액 미달 시나리오**:
   - 최소 주문 30,000원 쿠폰
   - 25,000원 장바구니 적용 시: 사용 불가 안내 문구 노출 확인
3. **특정 카테고리/장비/상품 타겟팅 시나리오**:
   - 특정 장비 'Potenza' 소모품 쿠폰 적용 시, 타 카테고리(예: LinearZ) 상품 금액은 최소 금액 및 할인 대상 금액에서 제외 확인
4. **사용기한(유효기간) 검증 시나리오**:
   - 고정 사용기간 지정 쿠폰: 시작 전 또는 만료일시 경과 시 결제 쿠폰 목록 비노출 및 적용 불가 메시지 출력
   - 발급 후 N일 유효 쿠폰: 발급일 기준 `expires_at` 일시 도달 시 자동으로 만료(`EXPIRED`) 상태 전환 및 결제 차단 확인

---

## 6. 보고 및 PDCA 진행 단계
- Current Step: **Plan (계획)**
- Next Step: **Design (구현 설계 & UI mock/서비스 인터페이스 구축)**
