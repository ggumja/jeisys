# 제이시스 미디어 Admin 기능수정 계획 (PDCA)

## 1. Plan (계획)

### 목표
Admin 미디어 관리 페이지(`MediaManagementPage`)에서 미디어 등록/수정 시, 프론트엔드(`MediaPage`)와 동일하게 미디어 종류(Youtube, Instagram, Blog, Facebook)를 분류하여 저장하고 관리할 수 있도록 기능을 개선합니다.

### 현황 분석
- **User Side (`MediaPage.tsx`)**: `Youtube`, `Instagram`, `Blog`, `Facebook` 4가지 플랫폼으로 분류하여 보여주고 있음.
- **Admin Side (`MediaManagementPage.tsx`)**: 현재 제목, 썸네일 URL, 공개 여부만 관리 가능하며, **플랫폼(종류)을 선택하는 기능이 없음**.
- **Backend/DB**: `posts` 테이블에 `platform` 컬럼이 이미 추가되어 있음 (`postService.ts`에 타입 정의 완료).

### 구현 상세 계획
1.  **공통 상수 정의**: 
    - 플랫폼 정보(`id`, `label`, `icon`)를 정의하여 Admin 페이지에서도 재사용.
    - 대상: `Youtube`, `Instagram`, `Blog`, `Facebook`.

2.  **Admin UI 수정 (`MediaManagementPage.tsx`)**:
    - **목록 테이블**: '플랫폼' 컬럼 추가 (아이콘 + 텍스트 표시).
    - **등록/수정 모달**: '미디어 종류(플랫폼)' 선택 드롭다운(Select) 추가.
    - **state 관리**: `formData`에 `platform` 필드 추가 및 핸들러 연결.

3.  **데이터 연동**:
    - `postService.createPost` / `updatePost` 호출 시 `platform` 데이터 전달 확인.

## 2. Do (실행)
- `MediaManagementPage.tsx`에 플랫폼 상수 정의 (또는 별도 파일 분리).
- 테이블 헤더 및 바디에 플랫폼 컬럼 추가.
- 모달 Form에 `<select>` 입력 UI 추가.

## 3. Check (검토)
- [ ] Admin에서 '플랫폼'을 지정하여 미디어 등록이 가능한가?
- [ ] Admin 목록에서 등록된 미디어의 플랫폼 아이콘이 올바르게 표시되는가?
- [ ] User 페이지(`/communication/media`) 이동 시, Admin에서 설정한 플랫폼 탭에 정상적으로 노출되는가?

## 4. Act (개선)
- 향후 플랫폼별 URL 밸리데이션(예: Youtube 링크 형식 체크) 기능 도입 고려.
