# 태스크 목록 - 반려 회원 재승인 기능 추가

- `[x]` 회원 상세 페이지 수정 (`src/pages/admin/MemberDetailPage.tsx`)
  - [x] `member.status === 'suspended'` 일 때 [재승인] 버튼 렌더링
  - [x] [재승인] 버튼 클릭 시 `handleApprove` 작동 연계
- `[x]` 회원 목록 페이지 수정 (`src/pages/admin/MemberManagementPage.tsx`)
  - [x] 목록 및 테이블 관리 열에서 `member.status === 'suspended'` 일 때 [재승인] 버튼 노출
  - [x] 목록에서 즉시 재승인 처리(mutation 호출) 및 토스트 알림 연계
- `[x]` 기능 검증 및 완료 보고서 작성
