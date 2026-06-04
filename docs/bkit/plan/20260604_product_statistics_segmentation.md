# 상품 분석 서비스 세분화 및 실시간 데이터 연동 계획 (Plan)

## 1. Goal (목표)
- `/admin/statistics/products` 상품 분석 페이지를 탭 형태의 세분화된 하위 페이지(개요, 베스트셀러, 재고 분석, 전환율 퍼널, 비인기 상품)로 분리하고, 실제 Supabase DB와 연동하여 실시간 데이터를 제공합니다. (평점 및 리뷰 분석 탭 제외 피드백 반영)
- `UI_GUIDELINES.md` 가이드라인에 따른 리스트 넘버링, 페이징 컴포넌트, Rows per Page, 브랜드 컬러 적용.

## 2. User Review Required (사용자 검토 및 의사결정 필요)

> [!IMPORTANT]
> **추가 통계 페이지 제안 및 피드백 반영**
> 사용자의 피드백에 따라 **평점 및 리뷰 분석 탭을 제외**하고 아래의 5가지 탭 구조로 상품 분석을 세분화하여 구현하고자 합니다.
> 1. **개요 (`overview`)**: 상품군 핵심 지표 요약 및 카테고리별 누적 판매량 추이
> 2. **베스트셀러 (`bestseller`)**: 카테고리별/정렬기준별 베스트셀러 상품 랭킹
> 3. **재고 분석 (`stock`)**: 재고 부족 상품 모니터링 및 판매 속도 기반 소진 임박 기한 예측
> 4. **상품 전환율 퍼널 분석 (`conversion`)**: [조회 ➜ 장바구니 ➜ 구매] 전환 시각화 및 상품 전환율 랭킹
> 5. **비인기 상품 분석 (`low-performing`)**: 일정 기간 판매 실적이 저조한 장기 보유 상품(Dead Stock) 분석
>
> **화면 레이아웃 구성 방식**
> 매출 분석과 일관성을 유지하기 위해 `/admin/statistics/products` 메뉴에 접근했을 때 상단에 **세련된 탭 내비게이션(Tab Navigation)**을 제공하여 하위 페이지 간 전환이 가능하도록 구성하고자 합니다. 이 방식에 동의하시나요?

## 3. Open Questions (오픈 질문)

> [!WARNING]
> **전환율(Funnel) 데이터 소스 정의**
> [조회수(Views), 장바구니수(Carts), 구매수(Purchases)] 중 조회수와 장바구니 추가 이력은 현재 Supabase DB의 어떤 테이블에 누적되고 있나요?
> 만약 로그 테이블이 존재하지 않는다면, 우선 DB에 존재하는 `cart_items`와 `order_items`를 실시간으로 결합하여 장바구니 전환과 구매 전환율을 산출하고, 조회수는 모의(mock) 데이터나 구조 확장을 병행하는 디자인을 제안합니다. 이에 대해 의견이 어떠신가요?

## 4. Proposed Changes (변경 제안 내용)

### [Backend/Service]
#### [MODIFY] `src/services/adminService.ts`
- 실시간 상품 분석 통계 데이터를 가져오기 위한 쿼리 API 추가:
  - `getProductOverviewStats(dateRange: string)`
  - `getProductBestsellerStats(dateRange: string, page: number, limit: number, category: string, sortBy: string)`
  - `getProductStockStats(page: number, limit: number)`
  - `getProductConversionStats(dateRange: string, page: number, limit: number)`
  - `getProductLowPerformingStats(dateRange: string, page: number, limit: number)`

### [Frontend/Routing]
#### [MODIFY] `src/routes.tsx`
- `/admin/statistics/products` 경로의 컴포넌트를 `ProductAnalyticsLayout`으로 변경하고 하위 자식 라우트들(`overview`, `bestseller`, `stock`, `conversion`, `low-performing`) 등록.

### [Frontend/Components]
#### [NEW] `src/pages/admin/statistics/ProductAnalyticsLayout.tsx`
- 상품 분석의 공통 탭 바 제공. 공통 기간 및 카테고리 필터 제공. 브랜드 컬러 `#21358D` 적용.

#### [NEW] `src/pages/admin/statistics/ProductOverviewPage.tsx`
- 상품 통계 요약 카드 및 카테고리별 판매 추이 라인 차트.

#### [NEW] `src/pages/admin/statistics/ProductBestsellerPage.tsx`
- 인기 상품 테이블 (가이드라인 적용, 페이징, 정렬).

#### [NEW] `src/pages/admin/statistics/ProductStockPage.tsx`
- 재고 부족 경고 및 판매 속도 기준 재고 소진 기한 예측 테이블.

#### [NEW] `src/pages/admin/statistics/ProductConversionPage.tsx`
- 퍼널 차트 시각화 및 상품 전환율 순위 테이블.

#### [NEW] `src/pages/admin/statistics/ProductLowPerformingPage.tsx`
- 데드 스톡 분석 및 프로모션 추천 테이블.

## 5. Verification Plan (검증 계획)

### 수동 검증
- 탭 내비게이션 작동 여부 및 URL 갱신 확인.
- 기간 및 카테고리 필터 변경 시 모든 차트 및 테이블의 실시간 업데이트 검증.
- 리스트 넘버링 `(현재페이지 - 1) * 페이지당항목수 + (인덱스 + 1)` 공식 렌더링 확인.
- 페이징 컨트롤 및 Rows per Page 작동 검증.
- Shadcn UI 버튼 변형 규칙 및 브랜드 컬러 `#21358D` 일치 여부 검증.
