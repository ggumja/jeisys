# PDCA Design: 1:1 문의 시스템 설계

## 1. Database Schema (Supabase/Prisma)
- **Table Name**: `inquiries`
- **Fields**:
    - `id`: UUID (Primary Key)
    - `user_id`: UUID (Foreign Key to users.id, Nullable for guest/system)
    - `type`: VARCHAR (문의 유형: 배송, 제품, 결제, 기타 등)
    - `title`: VARCHAR (제목)
    - `content`: TEXT (내용)
    - `is_secret`: BOOLEAN (비밀글 여부, default: true)
    - `status`: ENUM ('waiting', 'answered')
    - `answer_content`: TEXT (답변 내용)
    - `answered_at`: TIMESTAMP (답변 일시)
    - `created_at`: TIMESTAMP (등록 일시)

## 2. API Interface (`inquiryService.ts`)
```typescript
export interface Inquiry {
  id: string;
  userId: string | null;
  type: string;
  title: string;
  content: string;
  isSecret: boolean;
  status: 'waiting' | 'answered';
  answerContent?: string | null;
  answeredAt?: string | null;
  createdAt: string;
  user?: { name: string }; // 작성자 정보 (필요시)
}

// 기능 목록
function getInquiries(): Promise<Inquiry[]>; // 목록 조회 (비밀글 필터링 포함)
function getInquiryById(id: string): Promise<Inquiry>; // 상세 조회 (권한 체크)
function createInquiry(data: Partial<Inquiry>): Promise<void>; // 등록
function updateInquiry(id: string, data: Partial<Inquiry>): Promise<void>; // 수정
function deleteInquiry(id: string): Promise<void>; // 삭제
function answerInquiry(id: string, answer: string): Promise<void>; // 답변 등록 (관리자용)
```

## 3. UI/UX Component Design
- **InquiryListPage**: 
    - 상태(Waiting/Answered) 배지 표시.
    - 비밀글 아이콘(Lock) 표시.
    - 본인 글 여부 강조.
- **InquiryWritePage**:
    - 유형 선택 Dropdown 추가.
    - 비밀글 설정 체크박스 추가.
- **InquiryDetailPage**:
    - 질문 영역과 답변 영역(Answer Box) 구분.
    - 답변 완료 시 상태 표시 및 답변 일시 노출.

## 4. Security & Validation
- **Row Level Security (RLS)**: 
    - `SELECT`: `is_secret`이 `false`이거나, `auth.uid() == user_id`인 경우만 허용.
    - `INSERT`: 인증된 사용자만 허용.
    - `UPDATE/DELETE`: `auth.uid() == user_id` 및 `status == 'waiting'`인 경우만 허용.
- **Validation**: 제목/내용 필수 입력, 최대 글자 수 제한.
