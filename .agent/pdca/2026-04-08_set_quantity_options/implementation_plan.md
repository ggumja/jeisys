# [Goal Description]

단일상품에 대해 연속적이지 않은 수량(예: 3개, 5개, 10개 SET)을 선택할 수 있는 옵션을 추가하고, 선택된 옵션에 따라 할인율과 추가 증정 상품을 다르게 설정할 수 있도록 합니다.

## User Review Required

> [!IMPORTANT]
> **DB 스키마 변경 필요**: `product_quantity_options` 테이블 생성과 `product_bonus_items` 테이블에 `option_id` 컬럼 추가가 필요하며, 이는 `fix_options_schema.sql`과 `fix_bonus_constraint.sql`을 통해 적용됩니다.

## Proposed Changes

### [Admin] 상품 등록/수정 페이지 (`ProductRegisterPage.tsx`)
- **수량 옵션 UI**: 세트별 수량, 명칭(예: "5개 SET"), 할인율을 입력할 수 있는 필드 추가.
- **옵션 전용 증정 상품**: 각 세트 옵션 하단에 해당 세트 선택 시에만 제공되는 증정 상품 추가 기능 구현.
- **저장 로직**: 옵션 정보와 증정 상품 매핑 정보를 DB에 저장 (옵션 먼저 저장 후 획득한 ID로 증정품 연결).
- **불러오기 안정화**: 수정 모드 진입 시 DB의 옵션 ID와 증정품 매핑을 UUID 비교를 통해 정확히 복구.
- **레이어 팝업**: `alert()` 대신 `Dialog` 컴포넌트를 사용하여 성공/실패 메시지 표시.

### [Client] 상품 상세 페이지 (`ProductDetailPage.tsx`)
- **옵션 선택 UI**: 수량 옵션이 있을 경우 증감 버튼 대신 드롭다운(Select) 제공.
- **동적 가격 계산**: 선택된 옵션의 할인율을 적용하여 최종 총 금액 표시.
- **동적 증정 상품 표시**: 선택한 옵션 전용 증정품과 일반 증정품을 구분하여 실시간 업데이트.

### [Client] 장바구니 페이지 (`CartPage.tsx`)
- **옵션 정보 표시**: 장바구니 리스트에서 선택한 옵션명(예: "10개 SET") 표시.
- **수량 조절 제한**: 세트 옵션 상품은 지정된 수량으로만 구매 가능하므로 증감 버튼 비활성화.

### [Service] 데이터 서비스 (`productService.ts`, `cartService.ts`)
- **스키마 연동**: 옵션 정보를 포함한 CRUD 실현.
- **카트 연동**: `option_id`와 `option_name`을 `cart_items` 테이블에 포함하여 처리.

## Verification Plan

### Manual Verification
- [ ] 관리자 페이지에서 세트 옵션 3개 등록 및 테스트 저장.
- [ ] 상품 수정 시 등록된 세트와 증정품이 유실 없이 그대로 로드되는지 확인.
- [ ] 고객 화면에서 옵션 변경 시 가격과 하단 증정 아이템 목록이 즉시 바뀌는지 확인.
- [ ] 장바구니에 담았을 때 옵션 명칭과 할인 금액이 올바른지 확인.
