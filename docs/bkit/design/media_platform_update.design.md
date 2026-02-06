# [Design] Media Platform Update

## 1. Overview
Admin 미디어 관리 페이지에서 미디어 등록 시 플랫폼(Youtube, Instagram, Blog, Facebook)을 선택하고 관리하는 기능을 설계한다. 기존 로직은 URL, Title 등의 기본 정보만 관리했으나, User 페이지 필터링과의 정합성을 위해 플랫폼 분류를 추가한다.

## 2. Requirement Analysis
- **Admin**:
    - 미디어 등록/수정 모달에 '플랫폼' 선택 기능 필요.
    - 미디어 목록 테이블에 '플랫폼' 컬럼 추가.
    - 데이터 저장 시 `platform` 필드 업데이트.
- **Data**:
    - `posts` 테이블의 `platform` 컬럼 활용.
    - 지원 플랫폼: `youtube`, `instagram`, `blog`, `facebook`.

## 3. UI/UX Design
### 3.1. Admin Media List Table
- **Column**: '분류' (Platform) 컬럼을 '제목' 컬럼 앞에 추가.
- **Display**: 플랫폼 아이콘 + 플랫폼명 (Capitalized).

### 3.2. Media Modal
- **Field**: '미디어 종류' (Select Box) 추가.
- **Position**: '미디어 제목' 입력란 상단에 배치.
- **Options**:
    - YouTube
    - Instagram
    - Blog
    - Facebook

## 4. Technical Architecture
### 4.1. Frontend (`MediaManagementPage.tsx`)
- **State Definition**:
    - `platforms` 상수 배열 정의 (id, label, icon).
    - `formData` state에 `platform` 속성 추가 (Default: 'youtube').
- **Component Update**:
    - `Table` 컴포넌트 구조 변경 (`thead`, `tbody` 컬럼 추가).
    - `Modal` 내부 `<select>` 요소 추가.
    - `getPlatformIcon` 헬퍼 함수 구현.

### 4.2. Integration Services
- **`postService.ts`**:
    - `createPost`, `updatePost` 인터페이스는 이미 `Partial<Post>`를 받으므로 별도 수정 불필요.
    - DB 스키마 확인 결과 `platform` 컬럼 존재함.

## 5. Security & Validation
- **Validation**: 플랫폼 선택은 필수값 (Default 설정).
- **Security**: 없음 (Admin 내부 기능).
