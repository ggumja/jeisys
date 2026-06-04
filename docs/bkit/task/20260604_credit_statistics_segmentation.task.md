# 크레딧 통계 분석 세분화 및 실시간 데이터 연동 구현 작업 목록 (bkit)

- `[ ]` 1. Backend Service (`adminService.ts`) 크레딧 통계 API 구현
  - `[ ]` 1-1. `getCreditOverviewStats` 구현 (요약 카드, 장비 잔액 비율, 월별 추이)
  - `[ ]` 1-2. `getCreditEquipmentStats` 구현 (장비별 잔액 및 고객 보유 랭킹)
  - `[ ]` 1-3. `getCreditExpiryStats` 구현 (만료 임박 정보 및 30일 이내 만료 대상 병원 목록)
  - `[ ]` 1-4. `getCreditTransactionStats` 구현 (트랜잭션 거래 타입별 변동 분석)
- `[ ]` 2. Routing (`routes.tsx`) 크레딧 통계 하위 경로 등록 및 링크 연결
- `[ ]` 3. 공통 레이아웃 (`CreditAnalyticsLayout.tsx`) 구현 (인라인 세그먼트 버튼 기간 필터)
- `[ ]` 4. 크레딧 세부 분석 하위 페이지 컴포넌트 구현
  - `[ ]` 4-1. `CreditOverviewPage.tsx`
  - `[ ]` 4-2. `CreditEquipmentPage.tsx`
  - `[ ]` 4-3. `CreditExpiryPage.tsx`
  - `[ ]` 4-4. `CreditTransactionPage.tsx`
- `[ ]` 5. 전체 연동 상태 확인 및 가이드라인 정합성 최종 검증 (Verification)
