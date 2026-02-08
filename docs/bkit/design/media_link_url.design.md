# [Design] Media Link URL Support

## 1. Schema Design
- **Table**: `posts`
- **New Column**: `media_url` (Text, Nullable)
- **Constraint**: URL 형식 권장 (Strict constraint X).

## 2. API / Backend Design
### 2.1. `Post` Interface (`postService.ts`)
- `mediaUrl?: string;` 필드 추가.
- `createPost`, `updatePost`, `getPosts` 매퍼 함수에 `media_url` <-> `mediaUrl` 매핑 추가.

## 3. UI Design
### 3.1. Admin `MediaManagementPage`
- **Modal Input**:
    - 기존 '썸네일/영상 URL' 라벨을 **'썸네일 이미지 URL'**로 변경.
    - 하단에 **'연결할 미디어 URL'** 입력 필드 추가 (아이콘: Link).
    - `formData.media_url` state 바인딩.

### 3.2. User `MediaPage`
- **Link Binding**:
    - `<a>` 태그의 `href` 속성을 `post.mediaUrl || post.imageUrl || '#'` 우선순위로 바인딩.
    - `mediaUrl`이 있으면 해당 링크로 이동, 없으면 기존 동작 유지(Backward Compatibility).

## 4. Migration Strategy
- 기존 데이터는 `media_url`이 `null` 상태임.
- 코드 레벨에서 `mediaUrl`이 없으면 `imageUrl`을 쓰도록 Fallback 처리하여 마이그레이션 없이 서비스 유지.
