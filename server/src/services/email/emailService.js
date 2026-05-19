const nodemailer = require('nodemailer');
const { getShopSettings } = require('../shopSettingsService');
const { parseTemplate, buildTemplateVariables } = require('../sms/util/templateParser');

// Transporter 생성 유틸리티
// 매 발송마다 생성하기보다, 싱글톤으로 구성하거나 재사용할 수 있도록 함수화
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com', // 기본 데모용 호스트
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'dummy@gmail.com',
      pass: process.env.SMTP_PASS || 'dummy_password',
    },
  });
};

module.exports = {
  /**
   * 이메일 통합 발송 함수
   * @param {Object} msg - 발송할 메시지 객체
   * @param {string} msg.toEmail - 수신자 이메일 주소
   * @param {string} msg.messageType - 이메일 타입 (예: 'email_cust_order_complete_card')
   * @param {Object} msg.param - 치환할 템플릿 변수들 (order_number, payment_amount 등)
   */
  sendEmail: async function (msg) {
    const { toEmail, messageType, param } = msg;

    if (!toEmail) {
      return { code: 400, message: 'Recipient email is missing (toEmail)' };
    }
    if (!messageType) {
      return { code: 400, message: 'Email messageType is missing' };
    }

    try {
      // 1. 최신 설정(토글 및 템플릿) 불러오기
      const settings = await getShopSettings();

      // 2. 발송 On/Off 체크 (설정에 키가 없다면 기본적으로 true로 간주)
      const isEnabled = settings[messageType] ? settings[messageType] !== 'false' : true;
      if (!isEnabled) {
        return { code: 200, message: 'Email notification is disabled in settings' };
      }

      // 3. 템플릿 및 제목 조회 (DB 설정 우선, 없으면 msg 인자 폴백)
      const templateRaw = settings[`${messageType}_template`] || msg.message || '';
      const subjectRaw = settings[`${messageType}_subject`] || msg.subject || '';

      if (!templateRaw || !subjectRaw) {
        return { code: 400, message: `Template or Subject not found for type: ${messageType}` };
      }

      // 4. 변수 치환(Parsing)
      // buildTemplateVariables는 기존 SMS 파서에 맞춰져 있지만, 범용적으로 사용 가능
      const variables = buildTemplateVariables({ param }, settings);
      
      const parsedSubject = parseTemplate(subjectRaw, variables);
      const parsedHtml = parseTemplate(templateRaw, variables);

      // 5. 발신자 정보 구성
      const fromEmail = process.env.SMTP_FROM_EMAIL || settings.email_sender_address || 'no-reply@jeisys.com';
      const fromName = process.env.SMTP_FROM_NAME || settings.email_sender_name || '제이시스메디칼';
      const from = `"${fromName}" <${fromEmail}>`;

      // 6. SMTP Transporter 생성 및 발송
      const transporter = createTransporter();

      const mailOptions = {
        from,
        to: toEmail,
        subject: parsedSubject,
        html: parsedHtml,
      };

      const info = await transporter.sendMail(mailOptions);
      
      return {
        code: 200,
        message: 'Email sent successfully',
        messageId: info.messageId,
      };

    } catch (error) {
      console.error('[EmailService] Error sending email:', error);
      return {
        code: 500,
        message: 'Failed to send email',
        error: error.message,
      };
    }
  },
};
