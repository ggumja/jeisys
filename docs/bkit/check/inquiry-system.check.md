# PDCA Check: 1:1 문의 시스템 구현 결과 검증

## 1. 구현 항목 체크리스트
- [x] `inquiryService.ts`: Supabase 연동 로직 구현 완료.
- [x] `InquiryListPage.tsx`: 실시간 데이터 페이징(목록) 및 상태 배지 구현 완료.
- [x] `InquiryWritePage.tsx`: 문의 등록 기능 및 비밀글 설정 구현 완료.
- [x] `InquiryDetailPage.tsx`: 상세 조회 및 비밀글 권한 체크 로직 구현 완료.
- [x] `InquiryManagementPage.tsx`: 관리자 목록 조회 및 답변 등록 기능 구현 완료.
- [x] `types/index.ts`: `Inquiry` 타입 정의 추가.

## 2. 설계 대비 구현 격차 (Gap Analysis)
- **목록 조회 필터링**: 설계에서는 '본인 문의 및 타인 공개 문의'를 언급했으나, 현재는 단순 전체 조회를 수행함. (Supabase RLS에서 걸러질 것으로 예상됨)
- **이미지 첨부**: 초기 설계에는 없었으나 실제 사용 시 필요할 수 있음.

## 3. 확인된 이슈
- **RLS 확인 필요**: 실제 Supabase 콘솔에서 `Users can view their own inquiries` 정책이 `is_secret` 필드를 고려하고 있는지 물리적 검증 필요. (현재는 `user_id` 기준만 있는 것으로 보임)
