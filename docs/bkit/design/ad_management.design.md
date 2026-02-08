# [Design] 광고 관리 시스템 (Advertisement Management System)

## 1. 데이터베이스 설계 (Database Schema)

### 1.1. `ads` (광고 정보 테이블)
| 필드명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | 고유 아이디 (PK) |
| title | text | 광고 제목 (관리용) |
| type | ad_type | 메인배너, 이메일배너, 팝업, 사이드배너 등 (Enum) |
| image_pc_url | text | PC용 이미지 URL |
| image_mobile_url | text | 모바일용 이미지 URL |
| link_url | text | 이동할 목적지 URL |
| start_date | timestamp | 노출 시작 시간 |
| end_date | timestamp | 노출 종료 시간 |
| is_visible | boolean | 활성 여부 |
| display_order | integer | 노출 순서 |
| created_at | timestamp | 생성일 |

### 1.2. `ad_stats` (광고 통계 테이블)
- 성능을 위해 `ad_id`별, `date`별 집계 데이터를 저장한다.
| 필드명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | 고유 아이디 (PK) |
| ad_id | uuid | 광고 ID (FK) |
| date | date | 통계 일자 |
| impressions | integer | 노출수 (Default: 0) |
| clicks | integer | 클릭수 (Default: 0) |

## 2. API 설계

### 2.1. Client용 (홈페이지)
- `GET /api/ads/active?type={type}`: 현재 활성화된 광고 목록 조회.
- `POST /api/ads/track/impression`: 노출 발생 시 기록.
- `POST /api/ads/track/click`: 클릭 발생 시 기록.

### 2.2. Admin용
- `GET/POST/PATCH/DELETE /api/ads`: 광고 CRUD.
- `GET /api/ads/stats?start_date={date}&end_date={date}`: 통계 데이터 조회.

## 3. UI/UX 컴포넌트 설계

### 3.1. 광고 관리 리스트 (Admin)
- 지면별 필터링 기능.
- 현재 노출 중인 광고 'ON/OFF' 상태 강조.
- 클릭률(CTR) 정보 요약 노출.

### 3.2. 광고 등록 모달 (Admin)
- 이미지 미리보기 기능.
- 예약 기간 설정 달력 UI.

### 3.3. 리포트 대시보드 (Admin)
- Recharts 라이브러리를 활용한 노출/클릭 추이 그래프.
- 성과 상위 광고 순위표.

## 4. 추적 로직 상세
- **Intersection Observer**: 광고 요소가 화면의 50% 이상 노출되고 0.5초 이상 머물 때 1회 노출로 집계 (중복 방지 로직 포함).
- **Click Handler**: `target="_blank"` 이동 전 `fetch`를 통해 클릭 로그 전송.

## 5. 단계별 구현 계획
1. **Infra**: DB 테이블 생성 및 enum 타입 정의.
2. **Service**: `adService.ts` (Supabase CRUD & Stats).
3. **Admin UI**: 광고 관리 페이지 및 리포트 페이지 구축.
4. **Integration**: 메인 홈페이지 및 각 지면에 광고 컴포넌트 적용 및 추적 연결.
