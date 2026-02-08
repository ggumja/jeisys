# [Plan] Auto-Fetch Media Thumbnail (All Platforms)

## 1. Problem Definition
- **Issue**: 유튜브뿐만 아니라 인스타그램, 페이스북, 블로그(네이버 등)의 URL 입력 시에도 각 플랫폼의 썸네일을 자동으로 불러와야 함.
- **Challenge**: 
    - 유튜브는 Video ID 규칙이 명확하나, 다른 플랫폼은 페이지를 크롤링하여 `<meta property="og:image">` 태그를 파싱해야 함.
    - 브라우저(Front-end)에서 직접 외부 사이트를 크롤링하면 **CORS(Cross-Origin Resource Sharing) 정책**에 포험되어 차단됨.
- **Solution**: 
    - 백엔드(Supabase Edge Function 또는 Next.js API Route)를 통해 URL 정보를 가져오는 **Proxy(Scraper)** 기능이 필요함.

## 2. Technical Requirements
### 2.1. Server-Side Scraper
- **Role**: 입력받은 URL에 HTTP 요청을 보내고, HTML 응답 중 `og:image` 메타 태그 값을 추출하여 반환.
- **Tech**: Supabase Edge Function (Deno) 또는 기존 사용 유틸리티.
- **Target Platforms**:
    - **Youtube**: (기존 로직 유지 or OG 통일 가능)
    - **Instagram**: (로그인 필요 페이지일 경우 썸네일 추출이 어려울 수 있음 - 공개 페이지 기준)
    - **Facebook**: (Instagram과 유사)
    - **Blog (Naver/Tistory)**: 표준 OG 태그 파싱.

### 2.2. Frontend Integration
- `media_url` 입력 시 `debounce`(입력 지연) 적용하여 API 요청.
- 로딩 상태 표시 (썸네일 추출 중...).
- 추출 성공 시 `image_url` 필드 자동 업데이트.

## 3. Risks
- **Instagram/Facebook**: 이들 플랫폼은 크롤러 접근을 엄격하게 차단(Login Wall)하는 경우가 많아, 단순 HTTP 요청으로는 썸네일을 못 가져올 가능성이 매우 높음. (공식 Graph API 필요 가능성).
- **Naver Blog**: iframe 구조인 경우 본문 썸네일 추출이 복잡할 수 있음. (mobile URL로 변환하여 시도 등 트릭 필요).

## 4. Implementation Steps
1. **Edge Function 생성**: `supabase functions new opengraph-fetcher` (CORS 우회용).
2. **Frontend 로직 수정**: 
    - URL 입력 감지 -> Edge Function 호출 -> 결과 파싱 -> state 업데이트.
3. **UI 개선**: 로딩 인디케이터 및 성공/실패 메시지.
