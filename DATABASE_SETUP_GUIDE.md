# 데이터베이스 설정 가이드

제이시스메디컬 B2B 웹 서비스의 데이터베이스를 설정하는 단계별 가이드입니다.

## 📋 준비사항

- Supabase 프로젝트 생성 완료
- Supabase SQL Editor 접근 권한

## 🚀 실행 순서

### 1단계: 데이터베이스 스키마 생성

**파일**: `supabase_complete_setup.sql`

1. Supabase 대시보드 접속
   - URL: https://supabase.com/dashboard/project/xbtnhnkwlioufpyeuyyg/sql/new

2. SQL Editor에서 `supabase_complete_setup.sql` 파일 내용 복사 & 붙여넣기

3. **Run** 버튼 클릭하여 실행

**생성되는 항목**:
- ✅ Extensions (uuid-ossp, pgcrypto)
- ✅ Enums (user_role, approval_status, order_status, post_type, inquiry_status)
- ✅ 12개 테이블 (users, equipments, products, orders 등)
- ✅ 인덱스 (성능 최적화)
- ✅ RLS 정책 (보안)
- ✅ Triggers (자동 업데이트)

---

### 2단계: 샘플 데이터 삽입

**파일**: `insert_sample_data.sql`

1. SQL Editor에서 `insert_sample_data.sql` 파일 내용 복사 & 붙여넣기

2. **Run** 버튼 클릭하여 실행

**삽입되는 데이터**:
- ✅ 장비 5종 (ULTRAcel Q+, POTENZA, INTRAcel, LINEARZ 등)
- ✅ 소모품 13종 (카트리지, 팁, 니들 등)
- ✅ 제품-장비 호환성 매핑
- ✅ 수량별 가격 정책
- ✅ 샘플 게시글 (공지사항, FAQ, 뉴스)

---

### 3단계: 관리자 계정 생성

**파일**: `create_admin_user.sql`

1. SQL Editor에서 `create_admin_user.sql` 파일 내용 복사 & 붙여넣기

2. **Run** 버튼 클릭하여 실행

**생성되는 계정**:
```
Email: admin@jeisys.com
Password: admin1234
Role: admin
Status: APPROVED
```

---

### 4단계: 테스트 사용자 계정 (이미 생성됨)

**기존 계정**:
```
Email: test@test.com
Password: 1234
Role: user
Status: APPROVED
```

---

## ✅ 설정 완료 확인

모든 SQL 스크립트 실행 후 다음 쿼리로 확인:

```sql
-- 테이블 생성 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 데이터 확인
SELECT 'Equipments' as table_name, COUNT(*) as count FROM public.equipments
UNION ALL
SELECT 'Products', COUNT(*) FROM public.products
UNION ALL
SELECT 'Users', COUNT(*) FROM public.users
UNION ALL
SELECT 'Posts', COUNT(*) FROM public.posts;
```

**예상 결과**:
- Equipments: 5개
- Products: 13개
- Users: 2개 (admin, test)
- Posts: 6개

---

## 🔐 계정 정보 요약

### 관리자 계정
- **Email**: admin@jeisys.com
- **Password**: admin1234
- **권한**: 전체 관리자 기능 접근 가능

### 테스트 사용자 계정
- **Email**: test@test.com
- **Password**: 1234
- **권한**: 일반 사용자 기능

---

## 🎯 다음 단계

1. **로그인 테스트**
   - 개발 서버 실행: `npm run dev`
   - 관리자 계정으로 로그인
   - 대시보드 접근 확인

2. **기능 테스트**
   - 제품 목록 조회
   - 장바구니 추가
   - 주문 생성
   - 관리자 페이지 확인

3. **데이터 확장**
   - 추가 제품 등록
   - 실제 병원 정보 입력
   - 이미지 URL 업데이트

---

## 🛠️ 문제 해결

### 오류: "relation already exists"
- 이미 테이블이 존재하는 경우 발생
- 해결: 스크립트는 `IF NOT EXISTS`를 사용하므로 무시해도 됨

### 오류: "duplicate key value"
- 이미 데이터가 존재하는 경우 발생
- 해결: 스크립트는 `ON CONFLICT DO NOTHING`을 사용하므로 무시해도 됨

### 로그인 실패
- 이메일 확인 여부 체크
- Supabase Dashboard → Authentication → Users에서 "Email Confirmed" 확인
- 필요시 수동으로 확인 처리

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Supabase 프로젝트 상태
2. SQL 실행 로그
3. 브라우저 콘솔 오류 메시지

---

**설정 완료 후 애플리케이션을 재시작하세요!** 🎉
