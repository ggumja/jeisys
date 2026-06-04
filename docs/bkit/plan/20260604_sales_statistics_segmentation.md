# 매출 분석 서비스 세분화 및 실시간 데이터 연동 계획 (Plan)

## 1. Goal (목표)
- `/admin/statistics/sales` 매출 분석 페이지를 세분화하여 하위페이지(개요, 카테고리별, 결제수단별, 고객별 매출순위, 상품별 결제수단, 영업처별, 요일/시간별)로 분할하고, 실제 Supabase DB와 연동하여 실시간 데이터를 제공합니다.
- `UI_GUIDELINES.md` 가이드라인에 따른 리스트 넘버링, 페이징 컴포넌트, Rows per Page, 브랜드 컬러 적용.

## 2. User Review Required (사용자 검토 및 의사결정 필요)

> [!IMPORTANT]
> **추가 통계 페이지 제안 승인 여부**
> 사용자가 제안하신 카테고리별, 결제수단별, 고객별, 상품별 결제수단 통계 외에, 제이시스메디칼 B2B 쇼핑몰 특성에 매우 유용한 아래 2가지 통계 페이지를 추가 제안합니다. 이에 동의하시나요?
> 1. **영업처별 매출 통계 (`office`)**: 각 영업소별 매출 기여도 분석
> 2. **요일 및 시간대별 매출 트렌드 (`trend`)**: 주문이 집중되는 요일/시간대 분석
>
> **화면 레이아웃 구성 방식**
> 사이드바 메뉴를 너무 많이 늘리면 관리자 UI가 복잡해집니다. 따라서 `/admin/statistics/sales` 메뉴에 접근했을 때 상단에 **세련된 탭 내비게이션(Tab Navigation)**을 제공하여 하위 페이지 간 전환이 가능하도록 구성하는 UX를 제안합니다. 이 방식에 대해 의견이 어떠신가요?

## 3. Open Questions (오픈 질문)

> [!WARNING]
> **매출 집계 대상 주문 상태(OrderStatus) 정의**
> 통계 및 매출 차트에 집계할 주문의 상태를 명확히 정의하고자 합니다. 
> 본 계획에서는 주문 상태가 **`paid` (결제완료), `processing` (배송준비중), `shipped` (배송중), `delivered` (배송완료)**인 경우를 매출로 집계하고, **`pending` (입금대기), `cancelled` (주문취소)**인 경우는 집계에서 제외하는 방식이 적절해 보입니다. 이 정책이 맞는지 확인 부탁드립니다.

## 4. Proposed Changes (변경 제안 내용)

### [Backend/Service]
#### [MODIFY] `src/services/adminService.ts`
- 실시간 통계 데이터를 가져오기 위한 쿼리 API 추가:
  - `getSalesOverviewStats(dateRange: string, period: string)`
  - `getSalesCategoryStats(dateRange: string)`
  - `getSalesPaymentStats(dateRange: string)`
  - `getSalesCustomerStats(dateRange: string, page: number, limit: number, search: string)`
  - `getSalesProductPaymentStats(dateRange: string)`
  - `getSalesOfficeStats(dateRange: string)`
  - `getSalesTrendStats(dateRange: string)`

### [Frontend/Routing]
#### [MODIFY] `src/routes.tsx`
- `/admin/statistics/sales` 경로의 컴포넌트를 `SalesAnalyticsLayout`으로 변경하고 하위 자식 라우트들(`overview`, `category`, `payment`, `customer`, `product-payment`, `office`, `trend`) 등록.

### [Frontend/Components]
#### [NEW] `src/pages/admin/statistics/SalesAnalyticsLayout.tsx`
- 매출 분석의 공통 탭 바 제공. 공통 기간 필터(최근 7일, 30일, 3개월, 6개월, 1년) 제공. 브랜드 컬러 `#21358D` 적용.

#### [NEW] `src/pages/admin/statistics/SalesOverviewPage.tsx`
- 핵심 요약 카드 및 전체 매출 추이 영역 차트(Area Chart).

#### [NEW] `src/pages/admin/statistics/SalesCategoryPage.tsx`
- 카테고리별 매출 비중 도넛 차트 및 상세 테이블 제공. 클릭 시 상품 기여도 출력.

#### [NEW] `src/pages/admin/statistics/SalesPaymentPage.tsx`
- 결제수단별 통계 및 트렌드 바 차트 제공.

#### [NEW] `src/pages/admin/statistics/SalesCustomerPage.tsx`
- 고객별 매출 순위 리스트. `UI_GUIDELINES.md` 공식 순번 계산, 페이징, Rows per Page, 검색 필터 적용.

#### [NEW] `src/pages/admin/statistics/SalesProductPaymentPage.tsx`
- 상품별 매출 순위 및 결제수단 비율 Stacked Bar Chart, 상세 테이블.

#### [NEW] `src/pages/admin/statistics/SalesOfficePage.tsx`
- 영업소별 매출 기여도 및 순위 (승인 시).

#### [NEW] `src/pages/admin/statistics/SalesTrendPage.tsx`
- 요일별 / 시간대별 주문 분포 및 매출 분석 (승인 시).

## 5. Verification Plan (검증 계획)

### 수동 검증
- 탭 내비게이션 작동 여부 및 URL 갱신 확인.
- 기간 필터 변경 시 모든 차트 및 테이블의 실시간 업데이트 검증.
- `SalesCustomerPage`에서 리스트 넘버링 `(현재페이지 - 1) * 페이지당항목수 + (인덱스 + 1)` 공식 렌더링 확인.
- 페이징 컨트롤 및 Rows per Page 작동 검증.
- Shadcn UI 버튼 변형 규칙 및 브랜드 컬러 `#21358D` 일치 여부 검증.
