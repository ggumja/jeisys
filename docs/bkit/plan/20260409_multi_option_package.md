# PDCA Plan: 복합 구성 패키지 옵션 고도화

## 1. Plan (계획)
- **목표**: 패키지 상품의 각 옵션(수량 세트)이 독립적인 가격과 구성 상품군을 가질 수 있도록 개편.
- **핵심 기능**:
  - 옵션별 전용 가격 설정.
  - 옵션별 구성 상품(Constituent Products) 독립 관리.
  - 옵션 내 상품별 최대 선택 수량 제한.
  - 고객 페이지에서의 유기적 결합 및 가격 적용.

## 2. Design (설계)
### DB Schema
- `product_quantity_options` + `price` (bigint)
- `package_items` + `option_id` (uuid, fk)

### UI/UX
- 관리자: 세트 옵션 카드 내부에 상품 추가 테이블 배치.
- 사용자: 선택한 옵션의 제약 조건(Max Quantity)을 실시간 반영.

## 3. Do (실행 예정)
- SQL 마이그레이션 실행.
- 서비스 함수 오버로딩 또는 파라미터 확장.
- UI 컴포넌트 재구성.

---
*Created: 2026-04-09*
*Version: bkit 1.6.0*
