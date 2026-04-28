# 분할 배송 워크플로우 구현 태스크 리스트

- `[x]` **1단계: DB 스키마 확장**
    - `[x]` `shipments` 테이블 `status`, `shipping_info`, `label` 컬럼 추가 (SQL 마이그레이션)
- `[x]` **2단계: 서비스 레이어 (AdminService) 강화**
    - `[x]` `createShippingBundle` (PLANNED 상태 번들 생성) 메서드 구현
    - `[x]` `shipBundle` (로젠 API 연동 및 상태 전환) 메서드 구현
    - `[x]` `getOrderById` 번들 상태 및 상세 정보 로드 로직 수정
- `[x]` **3단계: 사용자 프론트엔드 UI**
    - `[x]` `SplitShipmentModal` 컴포넌트 구현 (수량 선택 및 배송지 입력)
    - `[x]` `OrdersPage` 권한 체크 및 버튼 노출
- `[x]` **4단계: 어드민 프론트엔드 UI**
    - `[x]` `OrderDetailPage` 번들 그룹화 렌더링
    - `[x]` 대기 번들용 "부분발송하기 (로젠 API)" 버튼 및 연동
- `[ ]` **5단계: 검증 및 완료**
    - `[ ]` 실제 데이터 기반 번들 생성 테스트
    - `[ ]` 로젠 API 응답 파싱 및 송장 매칭 확인
