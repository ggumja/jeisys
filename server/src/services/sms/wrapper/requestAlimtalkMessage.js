const smsSendByApiService = require('../smsSendByApiService');
const { saveMtsSendHistory } = require('../sendHistoryService');

module.exports = async function(params, context) {
  const {
    reservedSendDate, purpose, toPhoneNumber, fromPhoneNumber,
    messageType, pageUrl, param, subject, 
    senderKey, templateCode
  } = params || {};

  let now = new Date().getTime();
  let sendNow = !reservedSendDate || reservedSendDate <= now;

  // We are currently ignoring reservedSendDate for API, or handling it as sendNow
  // In a real production system, if !sendNow, we'd enqueue it somewhere.
  if (!sendNow) {
     return { code: 400, message: 'Reserved sending not fully implemented in API wrapper yet' };
  }

  // Parse message body if needed, normally template substitution happens earlier
  // For Alimtalk, param is typically substituted into the message. 
  // But here we assume `params.message` or `param` contains the text.
  const messageBody = typeof param === 'string' ? param : JSON.stringify({ messageType, pageUrl, param });

  // 1. Send via API
  const apiResponse = await smsSendByApiService.requestAlimtalkMessageByApi({
    toPhoneNumber,
    fromPhoneNumber,
    senderKey,
    templateCode,
    message: messageBody,
    button: null,
    replaceSubject: subject,
    tranType: 'L', // Fallback to LMS if failed
    tranMessage: messageBody
  });

  // 2. Log History
  const isSuccess = apiResponse.code === '0000';
  await saveMtsSendHistory({
    messageType: 'alimtalk',
    toPhoneNumber,
    fromPhoneNumber,
    templateCode,
    message: messageBody,
    isSuccess: isSuccess,
    responseCode: apiResponse.code,
    errorMessage: apiResponse.message
  });

  if (!isSuccess) {
    return { code: 500, message: `MTS API Error: ${apiResponse.message || apiResponse.code}` };
  }

  return { code: 200, message: 'success' };
};
