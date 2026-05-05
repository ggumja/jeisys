# Plan: 회원관리 포인트(적립금) 지급/관리 기능 구현

## 1. 개요
관리자 페이지(`MemberDetailPage.tsx`)의 미구현된 '포인트' 탭을 활성화하여, 회원에게 범용 포인트(적립금)를 지급, 회수, 내역 관리할 수 있는 기능을 추가합니다.

## 2. 작업 목표
- 포인트 내역 저장을 위한 DB 테이블(`point_transactions`) 추가
- 포인트 지급/회수/내역 조회를 담당하는 `pointService.ts` 개발
- `MemberDetailPage.tsx` 내 '포인트' 탭 UI 완성과 기능 연동

## 3. 상세 계획
### Step 1: 데이터베이스 스키마 설계
- **테이블**: `point_transactions`
- **컬럼**: `id`(uuid), `user_id`(uuid), `amount`(int), `type`(varchar: issue/use/revoke), `description`(varchar), `created_at`(timestamptz)
- 기존에 포인트 관련 테이블이 있는지 확인 후 없으면 신설.

### Step 2: 백엔드 서비스 개발
- `src/services/pointService.ts` 생성
- 기능: `getPointSummary(userId)`, `getPointTransactions(userId)`, `issuePoints(data)`, `revokePoints(data)`

### Step 3: 프론트엔드 UI/UX 구현
- `MemberDetailPage.tsx`의 `activeTab === 'points'` 영역 활성화
- 기능: 현재 포인트 잔액 컴포넌트, 포인트 지급/회수 모달, 포인트 내역 페이징 목록 테이블 추가.
- `pointService` 호출 로직 연동 및 성공/실패 토스트 알림 처리.

## 4. 기대 효과
장비 전용 크레딧 기능 외에 쇼핑몰에서 범용적으로 사용될 일반 포인트(적립금)를 관리자가 개별 회원에게 지급하고 내역을 관리할 수 있게 됩니다.
