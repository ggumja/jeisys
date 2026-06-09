# 태스크 목록 - 장바구니 옵션 노출 및 금액 합산

- `[ ]` `cartUtils.ts` 유틸리티 함수 작성 및 파싱 로직 구현
- `[ ]` `cartService.ts` 수정: `addToCart` 메서드에서 동일 아이템 검사 시 `option_name` 비교 조건 추가
- `[ ]` `ProductDetailPage.tsx` 수정: 장바구니 담기 시 `selectedVariants`를 JSON 형식으로 패킹하여 `optionName`으로 전달
- `[ ]` `CartItemCard.tsx` 수정: 옵션 뱃지 렌더링 및 소계/단가 계산 시 옵션 추가 금액 반영
- `[ ]` `CartPage.tsx` 수정: 장바구니 전체 금액 계산 및 견적서 인쇄(`printQuote`)에 옵션 정보 노출
- `[ ]` 수동 검증 진행
