# Cart에 선택한 옵션 표시 기능 구현 계획

## 개요
- **목표**: 고객이 상품 상세 페이지에서 선택한 옵션(색상, 사이즈 등)을 장바구니(Cart)에 연동하여 노출하고, 옵션별 추가 금액이 합산되어 가격이 계산되도록 구현합니다.
- **방식**: 데이터베이스 스키마를 변경하지 않고 기존 `cart_items` 테이블의 `option_name` 컬럼을 JSON 형태로 활용하여 확장성과 하위 호환성을 모두 확보합니다.

## 제안 변경 사항

### 1. Service Layer
- **cartService.ts**: `addToCart`에서 동일한 상품이 장바구니에 있는지 확인할 때 `option_name`도 조건절에 추가하도록 조회 쿼리를 개선합니다.

### 2. Product Detail Page
- **ProductDetailPage.tsx**: 장바구니 담기 시 선택된 `selectedVariants`를 수집하여 JSON 객체로 직렬화(JSON.stringify)해 `optionName`으로 전달합니다.

### 3. Cart UI & Calculations
- **cartUtils.ts (신규)**: JSON 형식의 `option_name`을 안전하게 파싱하기 위한 헬퍼 유틸리티 `parseCartOption`을 정의합니다.
- **CartItemCard.tsx**: `parseCartOption`을 통해 옵션을 파싱하고 뱃지 형태로 렌더링하며, 단가 및 소계 계산 시 `variants`의 `additionalPrice` 합산 금액을 상품 기본 단가에 더해줍니다.
- **CartPage.tsx**: `getTierPrice` 및 합계 계산부에서 `parseCartOption`을 통해 옵션 추가 금액을 더해 총합을 계산하고, 견적서 출력 시에도 이를 반영합니다.

## 검증 계획
1. **상품 상세 화면**: 여러 옵션을 선택 후 장바구니에 담기
2. **장바구니 확인**: 선택한 옵션 정보가 뱃지로 깔끔히 노출되는지 확인 및 단가/소계 검증
3. **병합 동작 확인**: 동일 상품을 다른 옵션으로 담았을 때 병합되지 않고 별도 카드로 나뉘는지 확인
