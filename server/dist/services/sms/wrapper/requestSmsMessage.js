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
const smsCreditService = require('../smsCreditService');
const sendService = require('../sendService');
const smsSendByDbService = require('../smsSendByDbService');
module.exports = function (params, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const { storeId, reservedSendDate, purpose, toPhoneNumber, fromPhoneNumber, message, subject, smsCreditUseStoreId } = params || {};
        let now = new Date().getTime();
        let sendNow = !reservedSendDate || reservedSendDate <= now;
        let sendInfo = yield dbTran(storeId, function (conn) {
            return __awaiter(this, void 0, void 0, function* () {
                const useStoreId = smsCreditUseStoreId || storeId;
                if (purpose !== 'auth') {
                    yield smsCreditService.useSmsCredit(conn, useStoreId, 1);
                }
                let send = yield sendService.registerSend(conn, { storeId, fromPhoneNumber, purpose, smsType: 'sms', subject, message }, { phoneNumber: toPhoneNumber });
                if (sendNow) {
                    yield smsSendByDbService.requestSmsMessageByDb(conn, {
                        storeId, sendId: send.sendId, toPhoneNumber, fromPhoneNumber, message
                    });
                }
                return send;
            });
        });
        if (sendInfo.code && sendInfo.message)
            return sendInfo;
        return { code: 200, message: 'success' };
    });
};
