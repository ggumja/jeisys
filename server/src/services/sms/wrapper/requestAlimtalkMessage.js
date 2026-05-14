const dbTran = require('../util/mysqldb');
const smsService = require('../index'); // We'll need to create an index.js exporting smsServices or require them directly
const smsCreditService = require('../smsCreditService');
const sendService = require('../sendService');
const smsSendByDbService = require('../smsSendByDbService');

module.exports = async function(params, context) {
  const {
    storeId, reservedSendDate, purpose, toPhoneNumber, fromPhoneNumber,
    messageType, pageUrl, param, subject, smsCreditUseStoreId,
    senderKey, templateCode
  } = params || {};

  let now = new Date().getTime();
  let sendNow = !reservedSendDate || reservedSendDate <= now;

  let sendInfo = await dbTran(storeId, async function(conn) {
    const useStoreId = smsCreditUseStoreId || storeId;

    if (purpose !== 'auth') {
      await smsCreditService.useAlimtalkCredit(conn, useStoreId, 1);
    }

    let send = await sendService.registerSend(conn,
      {
        storeId, fromPhoneNumber, purpose, smsType: 'alimtalk', subject,
        message: JSON.stringify({ messageType, pageUrl, param })
      },
      { phoneNumber: toPhoneNumber }
    );
    
    // Also call smsSendByDbService to actually insert into MTS_ATALK_MSG
    // In original code, this was called by sendReserved or another agent, but since we removed RabbitMQ:
    if (sendNow) {
      await smsSendByDbService.requestAlimtalkMessageByDb(conn, {
        storeId,
        sendId: send.sendId,
        toPhoneNumber,
        fromPhoneNumber,
        senderKey,
        templateCode,
        message: JSON.stringify({ messageType, pageUrl, param }),
        button: null,
        replaceSubject: subject,
        replaceMessage: null
      });
    }

    return send;
  });

  if (sendInfo.code && sendInfo.message) {
    return sendInfo;
  }

  return { code: 200, message: 'success' };
};
