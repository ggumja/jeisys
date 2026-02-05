# PDCA Plan: 회원가입 도로명 주소 검색 기능 구현

## 1. Plan (계획)
- **목표**: 회원가입 시 사용자가 편리하게 주소를 입력할 수 있도록 '카카오/다음 우편번호 서비스' API를 연동한다.
- **기술 선택**: [다음 우편번호 API](https://postcode.map.daum.net/guide) (무료, 별도 API 키 불필요, 높은 신뢰도)
- **UI/UX 설계**:
    - '주소검색' 버튼 클릭 시 팝업 또는 모달 레이어 오픈.
    - 검색 결과 선택 시 '우편번호', '기본주소' 자동 입력.
    - '상세주소' 입력 필드로 포커스 이동.

## 2. Do (실행)
- **Step 1: 스크립트 로드**
    - `index.html`에 카카오 우편번호 서비스 스크립트 추가:
    ```html
    <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
    ```
- **Step 2: 인터페이스 정의 (TypeScript)**
    - `window.daum`에 대한 타입을 정의하거나 `any` 처리하여 스크립트 실행 함수 작성.
- **Step 3: SignupPage.tsx 연동**
    - `handleAddressSearch` 함수 구현:
    ```javascript
    const handleAddressSearch = () => {
      new window.daum.Postcode({
        oncomplete: function(data) {
          // data.zonecode: 우편번호
          // data.address: 도로명 주소
          setFormData({
            ...formData,
            zipCode: data.zonecode,
            address: data.address,
            addressDetail: '' // 상세주소는 비움
          });
          // 상세주소 입력창으로 포커스 이동 로직 (선택사항)
        }
      }).open();
    };
    ```
    - 기존 '주소검색' 버튼에 `onClick={handleAddressSearch}` 연결.

## 3. Check (확인)
- **기능 테스트**:
    - 버튼 클릭 시 정상적으로 팝업 데이터가 뜨는가?
    - 주소 선택 시 각 필드(`zipCode`, `address`)에 값이 정확히 들어가는가?
    - 팝업 차단 발생 시 사용자에게 알림이 정상적으로 가는가? (Vite 개발 환경에서 확인)
- **UI 테스트**: 모바일 기기 및 다양한 브라우저(Chrome, Safari 등)에서 팝업이 깨지지 않는지 확인.

## 4. Act (조치 및 개선)
- **최적화**: 모바일 사용자를 위해 팝업 방식 대신 특정 영역에 검색 화면을 끼워넣는(Embed) 방식 고려 가능.
- **검증강화**: 주소 미입력 시 다음 단계(Step 3)로 넘어가지 못하도록 유효성 검사 로직 추가.
- **문서화**: 사용된 API 링크 및 커스텀 로직을 코드 내 주석으로 기록.
