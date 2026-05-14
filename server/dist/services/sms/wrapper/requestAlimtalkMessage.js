"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const dbTran = require('../util/mysqldb');
const smsService = require('../index'); // We'll need to create an index.js exporting smsServices or require them directly
const smsCreditService = require('../smsCreditService');
const sendService = require('../sendService');
const smsSendByDbService = require('../smsSendByDbService');
module.exports = function (params, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const { storeId, reservedSendDate, purpose, toPhoneNumber, fromPhoneNumber, messageType, pageUrl, param, subject, smsCreditUseStoreId, senderKey, templateCode } = params || {};
        let now = new Date().getTime();
        let sendNow = !reservedSendDate || reservedSendDate <= now;
        let sendInfo = yield dbTran(storeId, function (conn) {
            return __awaiter(this, void 0, void 0, function* () {
                const useStoreId = smsCreditUseStoreId || storeId;
                if (purpose !== 'auth') {
                    yield smsCreditService.useAlimtalkCredit(conn, useStoreId, 1);
                }
                let send = yield sendService.registerSend(conn, {
                    storeId, fromPhoneNumber, purpose, smsType: 'alimtalk', subject,
                    message: JSON.stringify({ messageType, pageUrl, param })
                }, { phoneNumber: toPhoneNumber });
                // Also call smsSendByDbService to actually insert into MTS_ATALK_MSG
                // In original code, this was called by sendReserved or another agent, but since we removed RabbitMQ:
                if (sendNow) {
                    yield smsSendByDbService.requestAlimtalkMessageByDb(conn, {
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
        });
        if (sendInfo.code && sendInfo.message) {
            return sendInfo;
        }
        return { code: 200, message: 'success' };
    });
};
