# [Design] Media Page Frontend Fix

## 1. Logic Update
### 1.1. Filtering Logic
- **Current**: `post.imageUrl?.includes(selectedPlatform)`
- **To-Be**:
  ```typescript
  const filteredPosts = selectedPlatform === 'all'
    ? mediaPosts
    : mediaPosts.filter((post) => (post.platform || 'youtube') === selectedPlatform);
  ```
- **Note**: `post.platform`이 `undefined`이거나 `null`인 경우 Default 값인 `'youtube'`로 처리하여 필터링 누락을 방지한다.

## 2. UI Update
### 2.1. Card Rendering
- **Icon/Color**: 하드코딩된 `'youtube'` 문자열을 `post.platform || 'youtube'` 변수로 대체.
- **Label**: `post.platform` 값을 그대로 출력하되 `capitalize` 클래스로 스타일링.

### 2.2. Helper Functions
- `getPlatformIcon` 및 `getPlatformColor` 함수는 이미 존재하므로 재사용.
- `Post` 인터페이스는 `postService`에서 import 하여 사용.

## 3. Implementation Steps
1. `src/pages/MediaPage.tsx` 파일 오픈.
2. `filteredPosts` 변수 선언부 수정.
3. JSX 내 `map` 함수 내부의 카드 렌더링 부분에서 `getPlatformColor` 및 `getPlatformIcon` 호출 인자 수정.
