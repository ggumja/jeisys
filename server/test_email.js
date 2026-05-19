const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const { sendEmail } = require('./src/services/email/emailService');

// 테스트용 .env 셋업 (루트 디렉토리 참조)
dotenv.config({ path: '../.env' });

async function runTest() {
  console.log('Generating Ethereal Email credentials for testing...');
  // 실제 SMTP가 없으므로 테스트용 가상 SMTP(Ethereal) 계정 생성
  const testAccount = await nodemailer.createTestAccount();
  
  process.env.SMTP_HOST = testAccount.smtp.host;
  process.env.SMTP_PORT = testAccount.smtp.port;
  process.env.SMTP_SECURE = testAccount.smtp.secure.toString();
  process.env.SMTP_USER = testAccount.user;
  process.env.SMTP_PASS = testAccount.pass;

  console.log('SMTP Credentials generated:', testAccount.user);

  const mockMsg = {
    toEmail: 'test_customer@example.com',
    messageType: 'email_cust_order_complete_card',
    param: {
      customer_name: '테스트유저',
      order_number: 'ORD-20260519-001',
      payment_amount: '150,000',
      payment_method: '신용카드(현대)',
    },
    subject: '[{{shop_name}}] 결제가 성공적으로 완료되었습니다!',
    message: '<h3>결제 완료 안내</h3><p><b>{{customer_name}}</b>님 감사합니다.</p><p>주문번호: {{order_number}}<br>결제금액: {{payment_amount}}원</p>'
  };

  console.log('Sending test email via emailService.sendEmail()...');
  const result = await sendEmail(mockMsg);
  console.log('Send Result:', result);

  if (result.code === 200) {
    // Ethereal Email URL 로깅 (테스트 이메일을 브라우저에서 확인할 수 있음)
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl({ messageId: result.messageId }));
  }
}

runTest().catch(console.error);
