# 쇼핑몰 Staging 서버 MTS (SMS/알림톡) 연동 가이드 (PDCA - Plan)

본 문서는 현재 `jeisys` 데모 리포지토리에 세팅된 **스몰비 MTS 알림톡/문자 발송 핵심 모듈**을 실제 **쇼핑몰 Staging 서버**로 이관(Migration) 및 세팅하기 위한 기술 가이드 및 계획서입니다. 개발자와 시스템 관리자가 참고하여 동일한 환경을 구축할 수 있습니다.

## 1. 사전 필수 패키지 설치
Staging 서버의 백엔드(Node.js) 프로젝트 환경에 다음의 의존성 패키지가 설치되어야 합니다.

```bash
# Staging 서버 백엔드 디렉터리에서 실행
npm install mysql2 lodash moment
```
- `mysql2`: 스몰비의 MTS 데이터베이스(`smallbee-sms`)에 직접 접근하여 발송 큐를 Insert 하기 위한 필수 드라이버입니다.
- `lodash`, `moment`: 발송 로직 내부 데이터 핸들링 및 시간 형식 지정을 위해 사용됩니다.

## 2. 프로젝트 설정 (TS & ENV)

### 2.1 TypeScript 컴파일러 설정 (`tsconfig.json`)
이관되는 스몰비 코어 로직은 순수 JavaScript(`.js`)로 작성되어 있습니다. 기존 TS 프로젝트에서 에러 없이 컴파일되도록 컴파일러 옵션을 수정해야 합니다.

```json
{
  "compilerOptions": {
    // 기존 옵션 유지
    "allowJs": true
  }
}
```

### 2.2 환경 변수 설정 (`.env`)
Staging 서버의 `.env` 파일에 발송 서버(스몰비 MTS) 데이터베이스 접속 정보를 추가해야 합니다.
*(보안 상 실제 Staging 접속 계정의 패스워드는 별도 공유된 키 매니저나 보안 문서를 참조하세요.)*

```env
# Smallbee SMS MTS Database Configuration
SMALLBEE_SMS_DB_HOST=127.0.0.1
SMALLBEE_SMS_DB_USER=root
SMALLBEE_SMS_DB_PASSWORD=실제_패스워드_입력
SMALLBEE_SMS_DB_DATABASE=smallbee-sms
SMALLBEE_SMS_DB_PORT=3306
```

## 3. 이관 대상 파일 목록 (File Migration)
데모 리포지토리(`jeisys/server/src/services/sms/`)에 작업된 디렉터리 전체를 Staging 서버의 동일한 위치로 복사합니다.

### 📁 `src/services/sms/` (루트)
- `smsSendByDbService.js`: MTS 전용 테이블에 발송 데이터를 Insert 하는 코어 로직.
- `smsCreditService.js`: 발송 전 매장의 크레딧(잔여 건수)을 확인하고 차감하는 로직.
- `sendService.js`: 자체 발송 로그 기록 처리기.
- `resultCode.js`: 발송 결과 상태값 정의.
- `sendCudService.js`: 내부 발송 내역 생성용 로직.

### 📁 `src/services/sms/wrapper/` (인터페이스)
- `index.js`: 외부(컨트롤러)에서 호출하는 메인 진입점. (`sendSms` 함수 제공)
- `requestAlimtalkMessage.js`, `requestSmsMessage.js` 등: 메시지 타입별 포맷팅 래퍼.

### 📁 `src/services/sms/config/` (템플릿)
- `messageTemplate.js`: 카카오 비즈보드에 등록된 알림톡 템플릿 코드와 치환 메시지 규칙 정의 (쇼핑몰의 실제 템플릿 코드로 내용 업데이트 필요).

### 📁 `src/services/sms/util/` (유틸리티)
- `mysqldb.js`: `mysql2` 커넥션 풀을 활용해 기존 스몰비 생태계의 트랜잭션 문법(`dbTran`)을 에뮬레이트하는 래퍼 클래스.
- `valuecheck.js`: 유효성 검증 유틸.

## 4. 로직 통합 및 호출 예시 (Integration)
모든 파일 세팅이 완료되면 Staging 서버의 알림 발생 구간(예: 결제 완료 API, 배송 시작 API 등)에서 모듈을 불러와 호출합니다.

```javascript
import smsService from '../services/sms/wrapper';

// 주문 완료 시 알림톡 발송 예시
const sendOrderCompleteMessage = async (orderInfo) => {
  await smsService.sendSms({
    storeId: 1001, // Staging 환경용 할당 매장 ID
    purpose: 'order',
    messageType: 'mall_order_complete', // messageTemplate.js에 매핑된 타입
    toPhoneNumber: orderInfo.customerPhone,
    fromPhoneNumber: '1588-0000', // Staging 쇼핑몰 대표 번호
    param: { 
      userName: orderInfo.customerName, 
      orderNo: orderInfo.orderNumber 
    },
    // 쇼핑몰 구성 정보 주입
    storeConfig: {
      kakaoAlimtalkSenderkey: process.env.KAKAO_SENDER_KEY || 'Staging_Sender_Key',
      storeName: 'Jeisys Mall Staging'
    }
  }, true); // true: 알림톡 우선 발송
};
```

## 5. Staging 배포 체크리스트 (User Review Required)
> [!IMPORTANT]
> Staging 적용 전에 다음 사항을 점검해 주세요.
> 1. **방화벽/네트워크 (AWS Security Group)**: Staging 서버(EC2/ECS)에서 스몰비의 MySQL 데이터베이스(3306 포트)로 Outbound 접근이 허용되어 있으며, 반대로 **스몰비 DB 측에서도 Staging 서버의 고정 IP(NAT Gateway 또는 EIP)를 Inbound로 허용**했습니까?
> 2. **환경 변수 보안 (AWS Secrets Manager)**: `SMALLBEE_SMS_DB_PASSWORD` 및 `KAKAO_SENDER_KEY` 등 민감한 정보가 `.env` 평문이 아닌 AWS Parameter Store나 Secrets Manager를 통해 안전하게 주입되고 있습니까?
> 3. **서버 타임존 (Timezone)**: 트랜잭션 시간(`tranDate`)이 KST로 정확히 기록되도록, AWS 인스턴스 혹은 Docker 컨테이너의 타임존이 `Asia/Seoul`로 설정되어 있습니까?
> 4. **장애 격리 및 로깅 (CloudWatch)**: MTS DB 커넥션 지연이나 타임아웃 발생 시, 쇼핑몰의 핵심 기능(주문/결제)이 중단되지 않고 CloudWatch 등에 에러 로그만 안전하게 남도록 예외 처리(try-catch)가 보장되어 있습니까?
> 5. **템플릿 코드 검증**: 카카오 비즈보드에서 Staging용 혹은 운영용으로 검수 통과된 템플릿 코드(Template Code) 목록이 확보되었으며, `messageTemplate.js` 파일에 올바르게 업데이트 되었습니까?
