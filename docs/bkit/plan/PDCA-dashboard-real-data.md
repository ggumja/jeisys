# PDCA - Admin Dashboard Real Data Integration

## Plan
**Goal:** 관리자 대시보드(Admin Dashboard)에 하드코딩된 더미 데이터(매출 추이 차트, 카테고리별 매출, 베스트셀러 제품)를 실제 DB 데이터로 연동합니다.

**Current State:**
- `DashboardPage.tsx` 내에 `salesData`, `categoryData`, `bestProducts`가 상수로 하드코딩되어 있습니다.
- `adminService.getDashboardStats()`는 주요 지표(회원 수, 이번달 매출 등)만 반환하고 있습니다.

**Proposed Changes:**
1. **Backend (`adminService.ts`)**:
   - `getDashboardStats()` 로직 확장
   - **월별 매출 추이 (최근 6개월)**: 최근 6개월 간의 `orders` 데이터를 조회하여 월별로 그룹핑 후 `salesData` 배열 생성.
   - **카테고리별 매출 & 베스트셀러 (이번 달)**: 이번 달 발생한 주문(`monthOrders`)의 ID를 추출한 뒤, `order_items`와 `products`를 조인하여 데이터를 가져옵니다. 이를 카테고리별/제품별로 집계(Reduce)하여 `categoryData`, `bestProducts` 생성.

2. **Frontend (`DashboardPage.tsx`)**:
   - 하드코딩된 상수들을 제거하고 `stats` 상태 변수에 `salesData`, `categoryData`, `bestProducts` 필드를 추가.
   - `getDashboardStats()`로부터 받은 실제 데이터를 차트 및 목록 컴포넌트에 바인딩.
   - 로딩 스켈레톤 또는 빈 데이터 처리 추가.

**Risk/Considerations:**
- 차트 컬러(`categoryData`의 `color` 필드)는 데이터 종류에 따라 동적으로 할당되거나 사전 정의된 색상 배열을 순환하여 사용하도록 로직을 구성해야 합니다.
- `orders` 조회 시 `status`가 'cancelled'인 주문은 매출에서 제외해야 정확한 통계가 산출됩니다. (현재 `getDashboardStats`의 이번달 매출 통계에도 취소건 제외 조건 추가 필요)
