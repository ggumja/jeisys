# [Plan] Auto-Fetch Media Thumbnail

## 1. Problem Definition
- **Issue**: Admin이 미디어 등록 시 '썸네일 URL'을 직접 찾아 입력해야 하는 불편함이 있음.
- **Goal**: '연결할 미디어 URL'(`media_url`)만 입력하면, 해당 URL에서 자동으로 메타데이터(OG Image 등)를 추출하여 썸네일 미리보기를 제공하고 등록할 수 있게 함.

## 2. Requirements
### 2.1. Functional Requirements
- **Youtube**: URL 입력 시 Video ID를 추출하여 `img.youtube.com` 썸네일 자동 생성.
- **General Rules (Instagram/Blog/Facebook)**: `Open Graph` (og:image) 메타 태그를 추출해야 함. (CORS 문제로 프론트엔드 단독 불가, Edge Function 필요 가능성 높음).
- **Fallback**: 자동 추출 실패 시 직접 이미지 URL을 입력할 수 있는 기능 유지.

### 2.2. User Interface
- `media_url` 입력 필드 옆에 "썸네일 가져오기" 버튼 추가 (또는 `blur` 이벤트 시 자동 실행).
- 가져온 썸네일을 미리보기(`img`)로 보여줌.
- 사용자가 마음에 들지 않으면 수동으로 수정 가능.

## 3. Technical Strategy
- **Phase 1 (Youtube Only)**: 클라이언트 사이드에서 정규식으로 처리 가능한 Youtube부터 우선 적용 (가장 빈도 높음, 비용 낮음).
- **Phase 2 (Open Graph Scraper)**: Supabase Edge Function을 사용하여 서버 사이드에서 URL 크롤링 후 `og:image` 반환하는 API 구현.

## 4. Scope (This Cycle)
- 이번 PDCA 사이클에서는 **Youtube 자동 추출** 및 **기초 UI 구현**까지 진행하고, 다른 플랫폼 지원(OG Tag 파싱)은 추후 고도화 과제로 미룬다.

## 5. Tasks
1. `MediaManagementPage`에 Youtube URL 파싱 유틸리티 함수 구현.
2. `media_url` 입력 변경 감지 로직 추가.
3. Youtube URL일 경우 썸네일 필드 자동 채움.
