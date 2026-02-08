# [Plan] Media Link URL Support

## 1. Problem Definition
- **Issue**: 미디어(Media) 게시물에서 썸네일 이미지와 실제 연결될 콘텐츠(영상, 블로그 등) URL을 분리하여 관리할 수 없음.
- **Symptom**:
    - 현재 썸네일 URL(`imageUrl`)이 링크(`href`)로도 사용됨.
    - 썸네일 클릭 시 영상/블로그로 이동하는 것이 아니라, 썸네일 이미지 자체가 열리거나(이미지 URL인 경우), 이미지가 깨짐(유튜브 URL인 경우).

## 2. Objective
- 썸네일(`imageUrl`)과 이동할 링크(`videoUrl`)를 분리하여 관리하고 작동하도록 개선.

## 3. Scope
- **Database**: `posts` 테이블에 `video_url` 컬럼 추가.
- **Backend**: `postService.ts` 업데이트 (Types, CRUD).
- **Admin**: `MediaManagementPage` 모달에 '연결 링크(URL)' 입력 필드 추가.
- **Frontend**: `MediaPage`에서 카드 클릭 시 `videoUrl`로 이동하도록 수정.

## 4. Implementation Steps
1.  **DB Schema**: `alter table posts add column video_url text;`
2.  **Service**: `Post` 인터페이스 및 `create/update` 로직에 `videoUrl` 매핑 추가.
3.  **Admin UI**: 모달 폼 수정 (입력 필드 분리).
4.  **User UI**: `href` 속성 바인딩 수정 (`imageUrl` -> `videoUrl`).
