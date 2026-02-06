# PDCA Plan: 1:1 문의 (1:1 Inquiry) 시스템 구현

## 1. 개요 (Overview)
- **기능명**: 1:1 문의 시스템
- **목표**: 사용자가 비공개/공개 문의를 등록하고, 관리자가 답변을 달 수 있는 기능을 구현한다.
- **주요 사용자**: 일반 사용자 (문의 등록/조회), 관리자 (문의 관리/답변)

## 2. 요구사항 (Requirements)
- **사용자 기능**:
    - 문의 목록 조회 (본인 문의 및 타인 공개 문의)
    - 문의 상세 조회 (비밀글의 경우 본인/관리자만 가능)
    - 문의 등록 (유형 선택, 제목, 내용, 비밀글 여부)
    - 본인 문의 수정/삭제 (답변 전까지만 가능)
- **관리자 기능**:
    - 전체 문의 목록 관리
    - 문의 상세 확인 및 답변 등록/수정
    - 상태 변경 (waiting -> answered)

## 3. 기술 설계 (Technical Design)
- **Data Model**: Prisma `Inquiry` 모델 활용 (이미 정의됨)
- **Backend/DB**: Supabase `inquiries` 테이블
- **Frontend**:
    - `InquiryListPage.tsx`: 목록 렌더링 및 필터링
    - `InquiryWritePage.tsx`: 등록/수정 폼
    - `InquiryDetailPage.tsx`: 상세 내용 및 답변 표시
- **Service**: `src/services/inquiryService.ts` 신규 생성

## 4. 단계별 계획 (Milestones)
1. **Plan (현재)**: 요구사항 정의 및 계획 수립
2. **Design**: DB 스키마 검증, API 인터페이스 및 UI 컴포넌트 설계
3. **Do**:
    - `inquiryService.ts` 구현
    - 목록/작성/상세 페이지 로직 연동
    - 관리자 답변 기능 연동
4. **Check**: 기능 테스트 (비밀글 권한, CRUD 동작 확인)
5. **Act**: 예외 처리 강화 및 최종 보고

## 5. 예상 에러 케이스 및 보안 (Error Handling & Security)
- **권한 관리**: 비밀글(`isSecret: true`) 조회 시 작성자 ID와 현재 로그인 유저 ID 대조 필수.
- **SQL Injection**: Supabase Client 라이브러리를 사용한 Parameterized Query 활용.
- **상태 무결성**: 답변이 달린 후에는 사용자가 문의 내용을 수정하지 못하도록 차단.
