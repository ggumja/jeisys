# [Design] Auto-Fetch Media Thumbnail

## 1. Logic Design
### 1.1. Youtube Extractor
- **Logic**: 정규식을 사용하여 `youtube.com/watch?v=` 또는 `youtu.be/` 형태의 URL에서 Video ID 추출.
- **Thumbnail URL**: `https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg` 사용.
- **Trigger**: `media_url` 입력 필드의 `onChange` 또는 `onBlur` 이벤트.

### 1.2. State Management
- `media_url` 입력 시점에 플랫폼 감지 (`youtube` 키워드 포함 여부).
- Youtube일 경우 → ID 추출 → `image_url` 상태 자동 업데이트.
- `image_url` 필드가 이미 값이 있더라도, 사용자가 명시적으로 기능을 켰거나 URL이 비어있을 때 덮어쓰기 (UX 고려 필요: "이미 입력된 썸네일이 있습니다. 변경하시겠습니까?" 팝업은 번거로울 수 있으므로, 비어있을 때만 자동 채움 권장).

## 2. UI Design
### 2.1. Input Field Group
- **Media URL Input**:
    - Placeholder: "https://www.youtube.com/watch?v=..."
    - Helper Text: "YouTube URL을 입력하면 썸네일이 자동으로 입력됩니다."
- **Preview Area**:
    - `image_url`에 값이 들어오면 해당 이미지 하단에 미리보기 표시 (Size: w-full aspect-video).

## 3. Implementation Steps
1. `extractYoutubeThumbnail(url: string): string | null` 유틸 함수 구현.
2. `MediaManagementPage`의 `handleUrlChange` 함수 구현.
3. `media_url` 입력 시 `formData.image_url` 자동 업데이트 로직 연결.
