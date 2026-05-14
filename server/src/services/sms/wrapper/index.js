const _ = require('lodash');
const dbTran = require('../util/mysqldb');
const vc = require('../util/valuecheck');

const messageTemplate = require('../config/messageTemplate');

const requestAlimtalkMessage = require('./requestAlimtalkMessage');
const requestLmsMessage = require('./requestLmsMessage');
const requestMmsMessage = require('./requestMmsMessage');
const requestSmsMessage = require('./requestSmsMessage');

module.exports = {
  sendSms: async function(msg, useAlimtalk = false) {
    const { toPhoneNumber, fromPhoneNumber, messageType, purpose, storeId, param, pageUrl } = msg;
    
    // In Jeisys, we don't have storeService. Assume default properties or pass them in msg.
    let { notUsingUserApp, kakaoAlimtalkSenderkey, smsCreditUseStoreId, storeName } = msg.storeConfig || {
      notUsingUserApp: false,
      kakaoAlimtalkSenderkey: process.env.KAKAO_SENDER_KEY || 'dummy_key_for_testing',
      smsCreditUseStoreId: storeId,
      storeName: 'Jeisys Mall'
    };
    
    kakaoAlimtalkSenderkey = useAlimtalk ? kakaoAlimtalkSenderkey : null;

    const messageTemplateFn = messageTemplate[messageType] || function() {};
    const { templateCode, replaceSubject, replaceMessage } = messageTemplateFn(storeName, pageUrl, param) || {};

    const isInvalid = this.sendMessageValid(toPhoneNumber, fromPhoneNumber, notUsingUserApp, storeId, purpose);
    if (isInvalid) {
      return Promise.resolve(isInvalid);
    }

    const params = {
      storeId,
      purpose,
      reservedSendDate: msg.reservedSendDate,
      toPhoneNumber: toPhoneNumber.replace(/\-/g, ''),
      fromPhoneNumber: fromPhoneNumber.replace(/\-/g, ''),
      smsCreditUseStoreId
    };

    const message = msg.message || replaceMessage;
    const subject = msg.subject || replaceSubject;

    if (kakaoAlimtalkSenderkey && templateCode) {
      return requestAlimtalkMessage({
        ...params,
        subject,
        messageType,
        pageUrl,
        param: msg.param,
        senderKey: kakaoAlimtalkSenderkey,
        templateCode
      });
    } else if (_.get(msg, 'contents.length') > 0) {
      return requestMmsMessage({
        ...params,
        message,
        subject,
        contents: msg.contents,
      });
    } else if (_.get(message, 'length') > 45) {
      return requestLmsMessage({
        ...params,
        message,
        subject,
      });
    } else if (_.get(message, 'length') > 0) {
      return requestSmsMessage({
        ...params,
        message,
        subject,
      });
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