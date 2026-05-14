const smsSendByApiService = require('../smsSendByApiService');
const { saveMtsSendHistory } = require('../sendHistoryService');

module.exports = async function(params, context) {
  const {
    reservedSendDate, purpose, toPhoneNumber, fromPhoneNumber,
    message, subject
  } = params || {};

  let now = new Date().getTime();
  let sendNow = !reservedSendDate || reservedSendDate <= now;

  if (!sendNow) {
     return { code: 400, message: 'Reserved sending not fully implemented in API wrapper yet' };
  }

  // 1. Send via API
  const apiResponse = await smsSendByApiService.requestMmsMessageByApi({
    toPhoneNumber,
    fromPhoneNumber,
    message,
    subject
  });

  // 2. Log History
  const isSuccess = apiResponse.code === '0000';
  await saveMtsSendHistory({
    messageType: 'mms',
    toPhoneNumber,
    fromPhoneNumber,
    message,
    isSuccess: isSuccess,
    responseCode: apiResponse.code,
    errorMessage: apiResponse.message
  });

  if (!isSuccess) {
    return { code: 500, message: `MTS API Error: ${apiResponse.message || apiResponse.code}` };
  }

  return { code: 200, message: 'success' };
};
