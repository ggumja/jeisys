# [Plan] Media Page Frontend Fix

## 1. Problem Definition
- **Issue**: `MediaPage`의 프론트엔드 로직이 최신 DB 스키마(`platform` 컬럼)를 반영하지 못하고 있음.
- **Symptoms**:
    1.  필터링이 `imageUrl` 기반으로 동작하여 부정확함.
    2.  모든 미디어 카드의 아이콘/라벨이 'YouTube'로 고정되어 표시됨.
    3.  Admin에서 저장한 `platform` 데이터가 User 화면에 반영되지 않음.

## 2. Objective
- Admin에서 설정한 `platform` 데이터를 기반으로 정확한 필터링 및 UI 렌더링을 구현한다.

## 3. Scope
- **Target File**: `src/pages/MediaPage.tsx`
- **Tasks**:
    1.  `filteredPosts` 로직 수정 (`imageUrl` -> `platform` 필드 매칭).
    2.  카드 UI 렌더링 시 `post.platform` 값을 사용하여 아이콘 및 색상 동적 표시.
    3.  `platform` 필드가 없는 기존 데이터에 대한 Default 처리 ('youtube').

## 4. Risks & Constraints
- 기존 데이터(`platform` 컬럼이 비어있는 경우)는 모두 'YouTube' 또는 '기타'로 보여질 수 있음. (Default 처리 필요)
