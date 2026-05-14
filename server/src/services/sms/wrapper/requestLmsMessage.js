const dbTran = require('../util/mysqldb');
const smsCreditService = require('../smsCreditService');
const sendService = require('../sendService');
const smsSendByDbService = require('../smsSendByDbService');

module.exports = async function(params, context) {
  const {
    storeId, reservedSendDate, purpose, toPhoneNumber, fromPhoneNumber,
    message, subject, smsCreditUseStoreId
  } = params || {};

  let now = new Date().getTime();
  let sendNow = !reservedSendDate || reservedSendDate <= now;

  let sendInfo = await dbTran(storeId, async function(conn) {
    const useStoreId = smsCreditUseStoreId || storeId;

    if (purpose !== 'auth') {
      await smsCreditService.useLmsCredit(conn, useStoreId, 1);
    }

    let send = await sendService.registerSend(conn,
      { storeId, fromPhoneNumber, purpose, smsType: 'lms', subject, message },
      { phoneNumber: toPhoneNumber }
    );

    if (sendNow) {
      // Smallbee doesn't have requestLmsMessageByDb natively in smsSendByDbService, it uses Mms
      await smsSendByDbService.requestMmsMessageByDb(conn, {
        storeId, sendId: send.sendId, toPhoneNumber, fromPhoneNumber, subject, message
      });
    }

    return send;
  });

  if (sendInfo.code && sendInfo.message) return sendInfo;
  return { code: 200, message: 'success' };
};
