# PDCA - Notification Templates Configuration

## Plan
**Goal:** 관리자 페이지의 `환경설정(ShopSettings) > 알림 설정` 탭에서 각 이메일 및 SMS 항목별로 발송될 **템플릿(제목 및 내용)**을 관리자가 직접 등록하고 수정할 수 있는 기능을 구현합니다.

**Background:**
- 현재 알림 설정 탭에는 각종 알림의 활성화 여부(ON/OFF)만 토글로 제어할 수 있습니다.
- 발송되는 메시지의 내용을 동적으로 커스터마이징하기 위해서는 `shop_settings` 테이블(Key-Value 구조)에 템플릿 값을 저장하고 관리할 UI가 필요합니다.

**Implementation Strategy:**
1. **데이터베이스 (shop_settings)**:
   - 기존의 알림 키(예: `email_admin_new_order`)에 더해, 템플릿 정보를 저장하기 위한 파생 키를 사용합니다.
   - 메일의 경우: `{key}_subject` (제목), `{key}_template` (본문)
   - SMS의 경우: `{key}_template` (본문)
   - `shopSettingsService.ts`의 `DEFAULTS` 객체에 기본 템플릿 문자열을 추가하여, DB에 값이 없을 때 기본값이 나타나도록 설정합니다.

2. **프론트엔드 UI (`ShopSettingsPage.tsx`)**:
   - `NotificationTab`의 각 알림 항목 우측(토글 버튼 옆)에 ⚙️ **'템플릿 설정'** 버튼을 추가합니다.
   - 버튼 클릭 시, 템플릿을 수정할 수 있는 **모달(Modal)** 창을 띄웁니다.
   - 모달 내부에는 동적 변수 사용 안내(예: `{{order_number}}`, `{{customer_name}}` 등)를 명시합니다.
   - 모달에서 '저장' 클릭 시, 현재 컴포넌트의 `form` 상태값에 해당 템플릿 데이터가 반영되며, 최종적으로 최상단 '저장' 버튼을 통해 DB(`updateMany`)에 기록됩니다.

**Variables Definition (변수 치환 규칙 예시):**
- `{{shop_name}}`: 쇼핑몰 이름
- `{{order_number}}`: 주문 번호
- `{{customer_name}}`: 고객명
- `{{payment_amount}}`: 결제 금액
- `{{payment_method}}`: 결제 수단

**Risks & Considerations:**
- 기존에 `shop_settings`에 저장된 값이 없을 때를 대비한 촘촘한 Default fallback 문자열이 필수적입니다.
- 에디터는 단순 `textarea`를 사용할 것인지, 서식(Rich Text) 에디터를 도입할 것인지 결정이 필요하지만, 일관된 스타일링과 SMS와의 호환성을 위해 **초기 구현은 텍스트 에어리어(Plain Text) 베이스의 HTML 템플릿 문자열**을 다루는 것으로 가정합니다.
