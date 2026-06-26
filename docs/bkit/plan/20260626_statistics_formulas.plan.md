# PDCA Plan: 통계분석 화면별 상세 계산식 및 로직 정의서

제이시스 몰 어드민 통계분석 시스템(매출 분석, 상품 분석, 크레딧 분석)의 요약 카드 및 모든 통계 화면 구성 요소의 세부 계산 수식과 데이터베이스 쿼리 조건을 코드 분석 기반으로 명확히 규정하여 문서화하는 계획입니다.

## 1. 목적 (Goal)
- 제이시스 몰 어드민 내부 통계 지표의 계산식(전기 대비 증감률, 평균 매출액, 카테고리/결제수단별 점유율 등)을 코드 구현과 100% 일치하도록 검증하여 비즈니스 정합성을 확립합니다.
- 데이터 소스 테이블과 상세 매핑 기준을 명시하여 통계 리포트의 투명성과 신뢰성을 높입니다.

---

## 2. 공통 연산 기준 및 기간 산출 방식

### 2.1. 매출 상태 필터링 기준 (`statuses`)
매출과 관련된 모든 통계(매출 분석, 상품 분석 등)는 다음 상태를 가진 주문만 계산 대상으로 삼습니다.
- **포함 대상 상태**: `paid` (결제완료), `processing` (배송준비중), `shipped` (배송중), `delivered` (배송완료)
- **제외 대상 상태**: `pending` (결제대기), `cancelled` (주문취소), 및 각종 반품/교환 클레임 건

### 2.2. 동기 대비 증감률 (Growth Rate) 계산식
선택한 조회 기간과 동일한 길이의 직전 기간(이전 동기) 데이터 대비 증감율을 산출합니다.
$$\text{증감률} (\%) = \left( \frac{\text{현재 기간 지표} - \text{이전 동기 지표}}{\text{이전 동기 지표}} \right) \times 100$$
- **예외 처리**: 이전 동기 지표가 0 또는 null인 경우 `0%`로 산출합니다.
- **이전 동기 기간 ($PrevStart \sim PrevEnd$) 계산법**:
  - **일별(daily)/주별(weekly)/기타**:
    - $\text{기간 일수 } D = \text{현재 기간 종료일} - \text{현재 기간 시작일} + 1$
    - $\text{이전 동기 시작일} = \text{현재 기간 시작일} - D$
    - $\text{이전 동기 종료일} = \text{현재 기간 시작일} - 1 \text{일}$
  - **월별(monthly)**:
    - $\text{기간 개월 수 } M = (\text{종료일의 연도} - \text{시작일의 연도}) \times 12 + (\text{종료일의 월} - \text{시작일의 월}) + 1$
    - $\text{이전 동기 시작일} = \text{현재 기간 시작일} - M\text{개월}$ (Date 객체 월 기준 조작)
    - $\text{이전 동기 종료일} = \text{현재 기간 시작일} - 1 \text{일}$ (즉, 이전 동기 최종 월의 마지막 날)
  - **연별(yearly)**:
    - $\text{기간 연도 수 } Y = \text{현재 기간 종료일 연도} - \text{현재 기간 시작일 연도} + 1$
    - $\text{이전 동기 시작일} = \text{현재 기간 시작일} - Y\text{년}$
    - $\text{이전 동기 종료일} = \text{현재 기간 시작일} - 1 \text{일}$

### 2.3. 기간 평균 매출액 (Average Period Sales) 계산식
$$\text{평균 매출액} = \frac{\text{총 매출액}}{\text{기간 수 (Period Count)}}$$
- **기간 수 (Period Count) 산출 공식**:
  - **일평균 매출 (daily)**: $D = \text{총 일수}$
  - **주평균 매출 (weekly)**: $\text{Math.max}(1, \text{Math.round}(D / 7))$
  - **월평균 매출 (monthly)**: $\text{Math.max}(1, \text{Math.round}(D / 30.44))$
  - **년평균 매출 (yearly)**: $\text{Math.max}(1, \text{Math.round}(D / 365.25))$

---

## 3. 실시간 집계 vs 비실시간(배치) 집계 구분 및 아키텍처 요건

통계 화면의 사용 목적과 성능(DB 부하), 데이터의 정합성 중요도에 따라 **실시간 집계**와 **비실시간(배치/캐시) 집계** 대상으로 구분하여 아키텍처를 설계합니다.

### 3.1. 실시간 집계 대상 화면 (Real-time Aggregation)
* **특징**: 자산(크레딧)의 변동, 즉각적인 운영(품절 방지 등)과 밀접하게 연관되어 1초의 데이터 불일치도 허용하지 않거나, 실시간 영업 상태를 실시간 모니터링해야 하는 화면.
* **분류 대상**:
  1. **크레딧 분석 전체** (크레딧 개요, 장비별 현황, 거래 내역, 만료 예정 현황)
     - *사유*: 크레딧은 회원들이 구매에 사용하는 가상 현금 자산이므로 잔액(`balance`), 사용 내역(`use`), 충전 내역(`issue`)의 데이터 정합성이 극도로 중요합니다.
  2. **상품 재고 현황** (`ProductStockPage.tsx`)
     - *사유*: 안전 재고 미만 경고 및 실시간 품절 처리는 주문 가능 여부와 직결되어 있어 즉각적인 실물 재고 반영이 필수적입니다.
  3. **매출 개요 (당일 실적)** (`SalesOverviewPage.tsx`)
     - *사유*: 경영진 및 영업 담당자가 오늘 현재까지의 실시간 매출액과 주문 완료 건수를 즉각적으로 파악하기 위함입니다. (단, 과거 기간 조회는 캐싱 가능)

### 3.2. 비실시간 / 배치 집계 대상 화면 (Batch / Cached Aggregation)
* **특징**: 누적 트렌드, 과거 이력 분석, 복잡한 테이블 조인(Join)과 문자열 연산(예: 주소 파싱)이 수반되어 실시간 쿼리 시 DB 성능을 저하시키는 화면. 1시간~1일 단위 배치 집계 테이블을 활용하는 것이 유리합니다.
* **분류 대상**:
  1. **요일/시간별 매출추이** (`SalesTrendPage.tsx`)
     - *사유*: 요일별, 24시간대별 누적 매출 분산 패턴은 단기 변동성보다는 거시적 트렌드 파악이 목적이므로 매번 실시간으로 전체 기간 데이터를 그루핑할 필요가 없습니다.
  2. **지역별 매출분석 / 영업처별 기여도** (`SalesRegionPage.tsx`, `SalesOfficePage.tsx`)
     - *사유*: 배송 주소 텍스트의 파싱 작업 및 회원 영업처 정보 매핑 등 고비용 조인이 필수적이므로 배치 가공된 데이터를 조회하는 것이 성능상 안전합니다.
  3. **고객별 순위 / 고객유형별 순위** (`SalesCustomerPage.tsx`, `SalesCustomerTypePage.tsx`)
     - *사유*: 누적 구매액 랭킹 및 유형별 기여도는 실시간성이 요구되지 않으며, 대개 전일 마감 데이터 또는 시간별 배치 데이터로도 분석 요건을 충분히 만족합니다.
  4. **카테고리별 매출 / 카테고리별 상품 판매** (`SalesCategoryPage.tsx`, `ProductCategoryPage.tsx`)
     - *사유*: 장기 기간의 카테고리 점유율 분석이 주 목적입니다.
  5. **판매 저조 상품 / 베스트셀러 / 구매 전환율**
     - *사유*: 상세조회수(PV) 대비 구매 비율, 등록일 대비 판매 회전율 등은 대용량 로그성 데이터(페이지뷰 등)와의 조인이 발생하여 실시간 집계 시 병목 현상이 발생하기 쉽습니다.

---


## 3. 화면별 상세 계산 지표 가이드

### 3.1. 매출 분석 (Sales Analytics)

#### ① 매출 개요 (`SalesOverviewPage.tsx`)
- **총 매출액 (Total Sales)**
  - 수식: $\sum (\text{orders.total\_amount})$
  - 조건: `status`가 매출 상태 기준에 속하고 `ordered_at`이 조회 범위 내인 주문
- **총 주문건수 (Total Orders)**
  - 수식: $\text{Count}(\text{orders.id})$
- **구매 고객수 (Total Customers)**
  - 수식: $\text{Count}(\text{Distinct orders.user\_id})$
- **평균 주문액 (Average Order Value)**
  - 수식: $\frac{\text{총 매출액}}{\text{총 주문건수}}$ (주문건수가 0인 경우 0원)
- **기간별 평균 매출 (일평균/주평균/월평균/년평균)**
  - 수식: $\frac{\text{총 매출액}}{\text{기간 수}}$ (공식 2.3에 따름)
- **매출 성장률 / 주문건수 성장률 (Sales / Order Growth)**
  - 수식: 공식 2.2 기준 전기 매출액/주문건수 대비 증감률

#### ② 카테고리별 매출 (`SalesCategoryPage.tsx`)
- **카테고리별 매출액**
  - 수식: $\sum (\text{order\_items.quantity} \times \text{order\_items.unit\_price})$
  - 기준: 각 주문 아이템이 속한 상품의 `products.category`별로 그룹화
- **매출 점유율 (Sales Share)**
  - 수식: $\left( \frac{\text{카테고리별 매출액}}{\text{조회 기간 내 총 매출액}} \right) \times 100$

#### ③ 결제수단별 매출 (`SalesPaymentPage.tsx`)
- **결제 수단별 금액 및 점유율**
  - 수식: 각 주문 결제 시 사용된 `orders.payment_method`별 매출 합산 및 백분율
  - 계산: $\left( \frac{\text{수단별 매출액}}{\text{총 매출액}} \right) \times 100$

#### ④ 고객별 순위 (`SalesCustomerPage.tsx`)
- **고객별 총 구매액**
  - 수식: 특정 `user_id`를 가진 고객의 $\sum (\text{orders.total\_amount})$
  - 정렬: 총 구매액 내림차순(DESC)
- **고객별 매출 점유율**
  - 수식: $\left( \frac{\text{고객별 총 구매액}}{\text{전체 매출액}} \right) \times 100$

#### ⑤ 고객유형별 순위 (`SalesCustomerTypePage.tsx`)
- **고객 유형별 매출 기여도**
  - 수식: 회원 가입 유형/등급(`users.member_type` 예: 병원회원, 의사회원, 일반회원)별 $\sum (\text{orders.total\_amount})$
  - 점유율: $\left( \frac{\text{고객유형별 매출액}}{\text{총 매출액}} \right) \times 100$

#### ⑥ 지역별 매출분석 (`SalesRegionPage.tsx`)
- **지역별 매출액 및 비중**
  - 수식: 배송지 주소(`orders.shipping_address`)의 도/시 행정구역명을 파싱하여 그룹화한 $\sum (\text{orders.total\_amount})$
  - 비중: $\left( \frac{\text{지역별 매출액}}{\text{총 매출액}} \right) \times 100$

#### ⑦ 영업처별 기여도 (`SalesOfficePage.tsx`)
- **영업처별 총 매출액**
  - 수식: 회원 정보에 연동된 담당 영업소(`users.sales_office`)별 주문의 매출액 합산
  - 정렬: 기여도 합계액 내림차순

#### ⑧ 요일/시간별 매출추이 (`SalesTrendPage.tsx`)
- **요일별 매출 및 주문건수 분포**
  - 수식: `ordered_at` 일자의 요일(월~일) 기준으로 그룹화한 매출액 및 건수의 누적 평균/합계
- **시간대별 매출 및 주문건수 분포**
  - 수식: `ordered_at` 일자의 시간대(00시~23시) 기준으로 그룹화한 매출액 및 건수 누적 분포

---

### 3.2. 상품 분석 (Product Analytics)

#### ① 상품 개요 (`ProductOverviewPage.tsx`)
- **전체 상품 수 (Total Products)**
  - 수식: `Count(products.id)` (DB 등록된 총 상품 종류 수)
- **활성 상품 수 (Active Products)**
  - 수식: `Count(products.id) where is_active = true`
- **판매된 상품수 (Total Qty Sold)**
  - 수식: $\sum (\text{order\_items.quantity})$ (조회 기간 내 판매된 실물 상품 총 개수)
- **재고 부족 상품수 (Low Stock Count)**
  - 수식: `Count(products.id) where stock < 10`
- **판매량 성장률 (Qty Growth)**
  - 수식: 공식 2.2 기준 직전 기간의 누적 판매 수량 대비 증가율

#### ② 카테고리별 판매 (`ProductCategoryPage.tsx`)
- **카테고리별 판매량 및 비중**
  - 수식: 카테고리별 $\sum (\text{order\_items.quantity})$ 및 총 판매량 대비 비율

#### ③ 베스트셀러 (`ProductBestsellerPage.tsx`)
- **베스트 판매 상품 순위**
  - 수식: 상품별 판매 수량 및 매출액 누적 합산 후 정렬
  - 1순위: 판매량 내림차순, 2순위: 총 판매금액 내림차순

#### ④ 재고 현황 (`ProductStockPage.tsx`)
- **재고 회전 수준**
  - 수식: 현재 재고량(`products.stock`)에 따른 안전/경고 상태 구분 (10개 미만 시 '경고')

#### ⑤ 판매 저조 상품 (`ProductLowPerformingPage.tsx`)
- **재고 회전율 분석**
  - 수식: $\frac{\text{총 판매 수량}}{\text{상품 등록일 이후 현재까지 경과일수}}$ (등록일 대비 판매 속도가 느린 하위 리스트 정렬)

#### ⑥ 구매 전환율 (`ProductConversionPage.tsx`)
- **상세조회 대비 최종 구매 전환율**
  - 수식: $\left( \frac{\text{상품 최종 구매수량 (주문완료 건)}}{\text{상품 상세 페이지 뷰수 (Page Views)}} \right) \times 100$

---

### 3.3. 크레딧 분석 (Credit Analytics)

#### ① 크레딧 개요 (`CreditOverviewPage.tsx`)
- **총 잔액 (Total Remaining)**
  - 수식: $\sum (\text{user\_credits.amount} - \text{user\_credits.used\_amount})$
  - 조건: `status != 'expired'` 이고 유효기간(`expiry_date`)이 현재 시각보다 미래인 잔여 금액 합계
- **당월 충전액 (Issued Amount)**
  - 수식: $\sum (\text{credit\_transactions.amount}) \text{ where type = 'issue'}$
- **당월 사용액 (Used Amount)**
  - 수식: $\sum (\text{credit\_transactions.amount}) \text{ where type = 'use'}$
- **당월 소멸액 (Expired Amount)**
  - 수식: $\sum (\text{credit\_transactions.amount}) \text{ where type = 'expire'}$

#### ② 장비별 현황 (`CreditEquipmentPage.tsx`)
- **장비별 잔여 크레딧 합산**
  - 수식: 장비 유형(`user_credits.equipment_type`)별 미사용 잔여액 합산 및 분포 비중

#### ③ 거래 내역 (`CreditTransactionPage.tsx`)
- **유형별 거래 통계**
  - 수식: 조회 기간 내 발생한 충전(`issue`), 차감(`use`), 만료(`expire`) 트랜잭션 건수 및 합계 금액

#### ④ 만료 예정 현황 (`CreditExpiryPage.tsx`)
- **잔여 유효기간별 금액 구간 합계**
  - **30일 이내 만료 예정액**: 현재 시각 기준 $\text{expiry\_date} \le \text{현재 시각} + 30\text{일}$인 잔여 크레딧 합산
  - **60일 이내 만료 예정액**: 현재 시각 기준 $\text{expiry\_date} \le \text{현재 시각} + 60\text{일}$인 잔여 크레딧 합산
  - **90일 이내 만료 예정액**: 현재 시각 기준 $\text{expiry\_date} \le \text{현재 시각} + 90\text{일}$인 잔여 크레딧 합산

---

## 4. 검증 계획 (Verification Plan)
1. **코드 정밀 비교**: `adminService.ts` 내의 모든 쿼리 조건 및 계산 로직이 상기 서술된 계산 공식과 동일한 데이터 속성 및 필터를 참조하는지 확인합니다.
2. **비교 대상 날짜 로직 확인**: 윤년 및 월말 일자 연산 시 발생할 수 있는 소급 일수 불일치 오류가 완벽히 차단되었는지 코드를 대조 검증합니다.

## 5. 피드백 및 승인 요청
본 공식 정의 및 정리 계획서가 요구사항을 올바르게 반영하고 있는지 확인을 부탁드립니다. 승인 시 바로 검증 과정을 거쳐 최종 완료 보고서를 전달해 드리겠습니다.
