# bkit Check - 교육 및 세미나 등록 기능 활성화 및 캘린더 구분 표시

- **점검일자**: 2026-06-05
- **담당자**: 봄(Bom)

## 1. 완료된 작업 목록

### DB 마이그레이션
- [x] `education_schedules` 테이블 생성 SQL 파일 작성: `docs/db/sql/20260605_create_education_schedules.sql`
- [x] Supabase 대시보드에서 SQL 실행 완료 (데녈님이 직접 실행)
- [x] RLS 정책 설정: 전체 조회 허용, 관리자 계정만 CRUD 가능

### Service API
- [x] `adminService.ts`에 교육 일정 CRUD 메서드 추가
  - `getEducationSchedules()`: 전체 목록 조회
  - `createEducationSchedule(data)`: 신규 등록
  - `updateEducationSchedule(id, data)`: 수정
  - `deleteEducationSchedule(id)`: 삭제

### 관리자 화면 (EducationManagementPage.tsx)
- [x] mock 데이터 완전 제거, DB 연동으로 교체
- [x] 마운트 시 `getEducationSchedules()` 호출
- [x] 등록/수정/삭제 후 `loadSchedules()` 재호출하여 목록 갱신
- [x] 로딩 스피너 UI 추가 (`<Loader2 animate-spin />`)
- [x] 저장 중 버튼 비활성화 처리 (`isSaving` state)

### 사용자 화면 (EducationPage.tsx)
- [x] 하드코딩된 샘플 데이터 배열 완전 제거
- [x] `useEffect`로 마운트 시 DB에서 실시간 로드
- [x] 캘린더 이동 시 현재 월 기준으로 표시
- [x] 뱃지 컬러 유지 (교육: #21358d, 세미나: #9333ea)

## 2. 검증 결과
- [x] `npm run build` — 에러 없이 빌드 성공 (7.58s)
- [x] Vite HMR 즉시 반영 확인 (task-107 로그에서 확인)
- [ ] 브라우저에서 관리자 등록 → 사용자 캘린더 반영 최종 확인 필요

## 3. 주의사항
- `description` 필드는 DB 테이블에 없으므로 프론트에서 `undefined` 처리
- 관리자 RLS 정책은 `public.users.role = 'admin'` 체크 방식
