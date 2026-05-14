const dbTran = require('../util/mysqldb');
const smsCreditService = require('../smsCreditService');
const sendService = require('../sendService');
const smsSendByDbService = require('../smsSendByDbService');

module.exports = async function(params, context) {
  const {
    storeId, reservedSendDate, purpose, toPhoneNumber, fromPhoneNumber,
    message, subject, contents, smsCreditUseStoreId
  } = params || {};

  let now = new Date().getTime();
  let sendNow = !reservedSendDate || reservedSendDate <= now;

  let sendInfo = await dbTran(storeId, async function(conn) {
    const useStoreId = smsCreditUseStoreId || storeId;

    if (purpose !== 'auth') {
      await smsCreditService.useMmsCredit(conn, useStoreId, 1);
    }

    let send = await sendService.registerSend(conn,
      { storeId, fromPhoneNumber, purpose, smsType: 'mms', subject, message },
      { phoneNumber: toPhoneNumber }
    );

    if (sendNow) {
      await smsSendByDbService.requestMmsMessageByDb(conn, {
        storeId, sendId: send.sendId, toPhoneNumber, fromPhoneNumber, subject, message
      });
    }

    return send;
  });

  if (sendInfo.code && sendInfo.message) return sendInfo;
  return { code: 200, message: 'success' };
};
