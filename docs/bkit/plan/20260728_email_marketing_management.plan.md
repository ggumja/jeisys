# PDCA Plan: 마케팅 이메일(Email) 관리 기능 개발 및 이력 시스템 구축

## 1. 개요 (Overview)
본 계획서는 제이시스 메디컬 쇼핑몰 어드민 내 **마케팅 이메일(Email) 관리 기능**을 새롭게 개발하여, 고객 대상 이메일 작성/템플릿 관리/발송/이력 조회가 통합적으로 가능하도록 시스템을 구축하는 것을 목적으로 합니다. 기존 문자 마케팅(SMS/LMS)과 통합된 UI/UX 일관성을 제공합니다.

---

## 2. 현황 및 개편 목표 (Current Status & Goals)

### 2.1 현황 (Current Status)
- 현재 `admin/marketing/email/send` 및 `admin/marketing/email/history` 등 이메일 마케팅 페이지는 준비 중 Placeholder 상태.
- 회원 DB(`users`)와 대상고객 필터링 시스템은 구축되어 있어 이메일 발송 대상으로 즉시 연동 가능.

### 2.2 개발 목표 (Goals)
1. **마케팅 이메일 전송 UI (`EmailSendPage.tsx`)**:
   - **이메일 에디터**: 제목, 발신자(default: `no-reply@jeisys.com`), 수신자 지정, 이메일 본문 작성.
   - **이메일 템플릿 관리**: 템플릿 그룹(프로모션, 정기배송, 신제품, 고객케어) 및 이메일 전용 템플릿 추가/수정/삭제/이동 기능.
   - **발송 및 예약 발송**: 즉시 발송 및 발송 일자/시간 지정 예약 발송 기능.
   - **수신 대상 연동**: 대상 고객 필터(고객구분, 최근구매일자, 보유장비, 매출금액) 및 엑셀 업로드 연동.
2. **이메일 마케팅 서비스 (`emailService.ts`)**:
   - Supabase DB (`email_template_groups`, `email_templates`, `email_send_history`) 및 Edge Function (`send-email`) 연동 구조.
   - DB 미생성 시 Graceful Fallback 시드 데이터 제공.
3. **이메일 발송 이력 (`EmailHistoryPage.tsx`)**:
   - 발송 유형(즉시/예약), 발신자, 수신자 수, 발송 일시, 발송 상태(성공/예약/실패) 테이블 및 상태 변경 지원.

---

## 3. 세부 구현 계획 (Task Breakdown)

### Phase 1: DB 마이그레이션 & 서비스 레이어 (`emailService.ts`)
1. **SQL 마이그레이션 파일 작성 (`docs/db/sql/20260728_email_marketing_tables.sql`)**:
   - `email_template_groups`, `email_templates`, `email_send_history` 테이블 정의.
   - 기본 이메일 템플릿 그룹 및 시드 데이터 (웰컴 이메일, 정기배송 혜택, 신제품 데모, 쿠폰 발급 안내 등) 추가.
2. **`emailService.ts` 서비스 구축**:
   - 이메일 템플릿 CRUD 메서드.
   - 대량 이메일 발송 (`sendBulkEmail`) 및 예약 발송 처리.
   - 이메일 발송 이력 조회 및 취소 처리.

### Phase 2: 이메일 전송 화면 (`src/pages/admin/marketing/EmailSendPage.tsx`)
1. **3열 샌드박스 레이아웃 구축**:
   - **좌측**: 이메일 템플릿 그룹 탭 (전체보기, 미지정, 프로모션, 신제품 등) 및 템플릿 카드 목록.
   - **중앙**: **리치 HTML 이메일 에디터 (Rich Text Editor / WYSIWYG)**
     - **툴바 기능**: 텍스트 스타일(Bold, Italic, Underline), 글자색/배경색, 텍스트 정렬(좌/중/우), 글자 크기/제목, 목록(Bullet/Numbered), 링크(URL) 삽입, 이미지 배너 URL 삽입, 구분선(HR), HTML 직접 수정/미리보기 탭.
     - **스마트 치환 변수**: `{고객명}`, `{병원명}`, `{쇼핑몰링크}`, `{쿠폰코드}` 1클릭 삽입 버튼.
     - **조작 버튼**: `[ 💾 저장 ]` / `[ ➕ 추가 ]` 버튼 (상단 위치 동일).
   - **우측**: 수신 대상 목록 (이름(병원명), 이메일 주소, 엑셀 업로드, `[대상 고객 지정]` 필터 모달).
2. **예약 발송 기능**:
   - 예약 발송 선택 시 발송 일자/시간 지정 박스 노출 (10px 안쪽 여백, 회색 박스, 미래 일시 검증).

### Phase 3: 이메일 발송 이력 화면 (`src/pages/admin/marketing/EmailHistoryPage.tsx`)
1. 발송 이력 목록 조회 (검색, 기간 필터, 예약 건 취소 기능).
2. 상세 발송 내역 모달 및 수신자 목록 확인.

---

## 4. 데이터베이스 구조 계획 (Database Schema)

```sql
-- 1. 이메일 템플릿 그룹
CREATE TABLE IF NOT EXISTS email_template_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 이메일 템플릿
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES email_template_groups(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 이메일 발송 이력
CREATE TABLE IF NOT EXISTS email_send_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(200),
  message TEXT NOT NULL,
  from_email VARCHAR(100) NOT NULL,
  recipient_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'sent', -- pending, sent, failed, canceled
  reserved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. 검증 계획 (Verification Plan)

- [x] **템플릿 동작 테스트**: 이메일 템플릿 그룹 생성/수정/삭제/이동 및 에디터 불어오기 검증 완료.
- [x] **에디터 및 수신대상 테스트**: 제목/본문 입력, 리치 에디터 툴바, 치환자 삽입, 수신자 엑셀 업로드 및 대상 고객 지정 필터 동작 검증 완료.
- [x] **발송 및 예약 테스트**: 즉시 발송 및 미래 일시 예약 발송 (10px 안쪽 여백, 날짜/시간 검증) 테스트 완료.
- [x] **이력 페이지 테스트**: `admin/marketing/email/history`에서 이력 표시 및 예약 건 취소 동작 검증 완료.
- [x] **빌드 검증**: `npm run build` 성공적 처리 완료.

---

## 6. PDCA 진행 상태
- Current Step: **Do (구현 및 검증 완료)**
- Next Step: **Check / Act (사용자 피드백 반영 및 운영)**
