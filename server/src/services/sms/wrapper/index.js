const _ = require('lodash');
const vc = require('../util/valuecheck');
const { getShopSettings } = require('../shopSettingsService');
const { parseTemplate, buildTemplateVariables } = require('../util/templateParser');

const requestAlimtalkMessage = require('./requestAlimtalkMessage');
const requestLmsMessage = require('./requestLmsMessage');
const requestMmsMessage = require('./requestMmsMessage');
const requestSmsMessage = require('./requestSmsMessage');

module.exports = {
  sendSms: async function(msg, useAlimtalk = false) {
    const { toPhoneNumber, fromPhoneNumber, messageType, purpose, storeId, pageUrl } = msg;

    const settings = await getShopSettings();
    
    // 설정값 조회 (기본값 true로 간주, 명시적으로 'false'일 경우만 발송 안함)
    const isEnabled = messageType && settings[messageType] ? settings[messageType] !== 'false' : true;
    if (!isEnabled) {
      return { code: 200, message: 'Notification disabled in settings' };
    }

    const templateRaw = settings[`${messageType}_template`] || msg.message || '';
    let subjectRaw = settings[`${messageType}_subject`] || msg.subject || '';
    const templateCodeSetting = settings[`${messageType}_template_code`] || '';
    
    const params = buildTemplateVariables(msg, settings);
    const replaceMessage = parseTemplate(templateRaw, params);
    const replaceSubject = parseTemplate(subjectRaw, params);

    let kakaoAlimtalkSenderkey = process.env.MTS_SENDER_KEY || settings.kakao_alimtalk_senderkey;
    kakaoAlimtalkSenderkey = useAlimtalk ? kakaoAlimtalkSenderkey : null;
    
    const templateCode = templateCodeSetting || msg.templateCode;

    const isInvalid = this.sendMessageValid(toPhoneNumber, fromPhoneNumber, false, storeId, purpose);
    if (isInvalid) {
      return Promise.resolve(isInvalid);
    }

    const requestParams = {
      storeId,
      purpose,
      reservedSendDate: msg.reservedSendDate,
      toPhoneNumber: toPhoneNumber.replace(/\-/g, ''),
      fromPhoneNumber: fromPhoneNumber.replace(/\-/g, ''),
      message: replaceMessage,
      subject: replaceSubject,
      pageUrl,
      param: msg.param, // Legacy
      senderKey: kakaoAlimtalkSenderkey,
      templateCode,
      messageType
    };

    if (kakaoAlimtalkSenderkey && templateCode) {
      return requestAlimtalkMessage(requestParams);
    } else if (_.get(msg, 'contents.length') > 0) {
      return requestMmsMessage({ ...requestParams, contents: msg.contents });
    } else if (_.get(replaceMessage, 'length') > 45) {
      return requestLmsMessage(requestParams);
    } else if (_.get(replaceMessage, 'length') > 0) {
      return requestSmsMessage(requestParams);
    } else {
      return { code: 400, message: 'No message content to send' };
    }
  },
  
  sendMessageValid: function(toPhoneNumber, fromPhoneNumber, notUsingUserApp, storeId, purpose) {
    if (notUsingUserApp) {
      return { code: 1002 };
    } else if (!fromPhoneNumber) {
      return { code: 1002, message: '받는 사람 전화 번호가 없습니다.' };
    } else if (!toPhoneNumber) {
      return { code: 1002, message: '보내는 사람 전화 번호가 없습니다.' };
    } else if (!vc.isValidId(storeId)) {
      return { code: 400, message: 'invalid storeId' };
    } else if (!purpose) {
      return { code: 400, message: 'purpose is empty' };
    }
  },
};