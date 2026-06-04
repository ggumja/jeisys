# 상품 분석 세분화 및 실시간 데이터 연동 작업 목록 (Task)

- `[x]` 1. Backend Service (`adminService.ts`) 상품 통계 조회 API 구현
  - `[x]` 1-1. `getProductOverviewStats` (상품 통계 요약 및 카테고리별 누적 판매량 추이)
  - `[x]` 1-2. `getProductBestsellerStats` (베스트셀러 상품 랭킹)
  - `[x]` 1-3. `getProductStockStats` (재고부족 및 소진 임박 기한 예측)
  - `[x]` 1-4. `getProductConversionStats` (상품별 조회/장바구니/구매 전환율)
  - `[x]` 1-5. `getProductLowPerformingStats` (비인기 상품 Dead Stock 분석)
- `[x]` 2. Routing (`routes.tsx`) 상품 분석 하위 경로 정의
- `[x]` 3. 공통 레이아웃 (`ProductAnalyticsLayout.tsx`) 구현 및 필터 제공
- `[x]` 4. 상품 세부 분석 하위 페이지 컴포넌트 구현
  - `[x]` 4-1. `ProductOverviewPage.tsx` (개요)
  - `[x]` 4-2. `ProductBestsellerPage.tsx` (베스트셀러 - 페이징/넘버링 가이드라인 준수)
  - `[x]` 4-3. `ProductStockPage.tsx` (재고 분석 - 예측 임박일 표시)
  - `[x]` 4-4. `ProductConversionPage.tsx` (전환율 퍼널)
  - `[x]` 4-5. `ProductLowPerformingPage.tsx` (비인기 Dead Stock 목록)
- `[x]` 5. 전체 UI 연동 상태 확인 및 가이드라인 정합성 최종 검증 (Verification)
