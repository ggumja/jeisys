# [Design] Auto-Fetch Media Thumbnail (Using Edge Function)

## 1. Logic Design
### 1.1. Supabase Edge Function (`/functions/v1/og-fetcher`)
- **Input**: `{ url: string }`
- **Process**:
    1.  `fetch(url)` 요청.
    2.  User-Agent 헤더를 브라우저처럼 위장 (Facebook/Instagram 차단 회피 시도).
    3.  HTML 응답에서 Regex로 `<meta property="og:image" content="...">` 추출.
    4.  추출된 URL 반환.
- **Output**: `{ success: boolean, imageUrl?: string, error?: string }`

### 1.2. Frontend Logic
- **Hook**: `useDebounce`를 사용하여 사용자가 URL 입력을 멈춘 후 0.5초 뒤 요청 trigger.
- **Handler**: `fetchThumbnail(url)` 함수 작성.
    - Supabase Functions Client 사용: `supabase.functions.invoke('og-fetcher', ...)`
    - 성공 시: `formData.image_url` 업데이트.
    - 실패 시: `toast`로 "썸네일을 가져올 수 없습니다. 직접 입력해주세요." 알림.

## 2. Consideration for specific platforms
- **Naver Blog**: `blog.naver.com` 접근 시 모바일 뷰(`m.blog.naver.com`)로 요청해야 썸네일 파싱이 쉬울 수 있음.
- **Instagram**: 로그인 페이지로 리다이렉트 될 확률이 높음. 이 경우 "인스타그램 정책상 자동 썸네일 가져오기가 제한될 수 있습니다" 라는 안내 문구 고려.

## 3. UI Flow
1. Admin이 `media_url` 입력.
2. 우측에 작은 'Spinner' 아이콘 표시 (Loading).
3. 완료 되면 'image_url' 필드가 깜빡이며 채워짐.
