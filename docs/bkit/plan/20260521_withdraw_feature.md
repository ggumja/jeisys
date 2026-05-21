# Plan: Frontend MyPage 회원탈퇴 기능 추가

## 1. Goal
- 마이페이지 내 정보수정(ProfileEditPage) 하단에 회원탈퇴 기능을 추가합니다.
- 사용자가 탈퇴를 요청하면 확인 모달을 띄우고, 승인 시 계정을 삭제(또는 비활성화)하고 로그아웃 처리합니다.

## 2. Design
- **UI 변경점 (ProfileEditPage.tsx)**:
  - 정보 수정 화면 최하단에 작고 연한 텍스트/버튼 형태로 "회원탈퇴" 링크 추가 (예: "더 이상 제이시스 서비스를 이용하지 않으시나요? [회원탈퇴]")
  - 클릭 시 Confirm 모달 노출 (경고 메시지: "탈퇴 시 복구할 수 없습니다. 정말 탈퇴하시겠습니까?")
- **Service & Type 변경점 (authService.ts, types/index.ts)**:
  - `types/index.ts`의 User 타입 `approvalStatus`에 `'WITHDRAWN'` 상태값 추가
  - `authService.ts`에 `withdrawAccount` 메서드 추가 (계정 삭제가 아닌 상태값만 'WITHDRAWN'으로 업데이트)
- **로직 (회원탈퇴 후 처리)**:
  - `storage.clearAll()` 호출을 통해 로컬 스토리지 초기화
  - `/login` 페이지로 리다이렉션

## 3. Do (Task Breakdown)
1. `src/types/index.ts`의 User 인터페이스 `approvalStatus`에 `'WITHDRAWN'` 값 추가
2. `src/services/authService.ts`에 상태를 업데이트하는 `withdrawAccount` API 연동 함수 추가
3. `src/pages/ProfileEditPage.tsx` 하단에 회원탈퇴 UI 요소 및 모달 구현
4. 탈퇴 모달에서 승인 시 `withdrawAccount` 호출 및 로그아웃(리다이렉션) 연동

## 4. Analyze & Iterate
- DB 계정이 실제로 삭제(Hard Delete)되지 않으므로, 탈퇴한 유저의 이메일이나 사업자번호 등으로 재가입을 시도할 때의 정책(재가입 불가 또는 신규 생성 등)을 추후 백엔드 팀과 논의해야 함.
- 어드민 페이지에서 탈퇴 회원(WITHDRAWN) 목록을 별도로 필터링할 수 있도록 대응 필요.
