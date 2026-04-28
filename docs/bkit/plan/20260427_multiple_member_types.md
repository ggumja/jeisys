# PDCA Plan: 회원 분류 중복 선택 기능

## Plan (P)
- 회원 상세 페이지에서 여러 개의 회원 분류를 선택할 수 있도록 수정.
- 회원 목록 페이지에서 중복 선택된 분류를 뱃지 형태로 모두 표시.
- 회원 분류 필터링 시 중복 선택된 회원도 정상 검색되도록 로직 개선.

## Task (D)
- [x] MemberDetailPage.tsx: `handleUpdateMemberType` 토글 로직 구현
- [x] MemberDetailPage.tsx: 다중 선택 UI (버튼 상태) 반영
- [x] MemberManagementPage.tsx: `getMemberTypeBadge` 다중 뱃지 렌더링 수정
- [x] MemberManagementPage.tsx: `getFilteredMembers` 필터 로직 (`includes`) 수정
- [x] adminService.ts: `deleteMemberType` 시 관련 회원들의 분류 문자열 처리 로직 보강

## Check (C)
- [x] 상세 페이지에서 2개 이상의 분류 선택 시 DB에 콤마로 구분되어 저장되는 로직 확인.
- [x] 목록 페이지에서 선택된 모든 분류가 뱃지로 나타나도록 UI 구현 완료.
- [x] 필터링 시 `includes` 로직을 통해 중복 선택된 회원이 정상적으로 검색되는지 코드 레벨 검증.

## Act (A)
- 구현 완료 후 사용자 피드백 대기 중.
- 향후 분류가 많아질 경우를 대비해 UI 레이아웃 최적화 고려 가능.
