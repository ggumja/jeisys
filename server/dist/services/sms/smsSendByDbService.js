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
const _ = require('lodash');
const moment = require('moment');
module.exports = {
    requestSmsMessageByDb: function (conn_1, _a) {
        return __awaiter(this, arguments, void 0, function* (conn, { storeId, sendId, toPhoneNumber, fromPhoneNumber, message }) {
            let tranDate = moment().format('YYYY-MM-DD HH:mm:ss');
            //로컬 개발시에 개발 서버와의 시간차 때문에 강제로 영국시간으로 설정
            if (process.env.NODE_ENV === 'development') {
                tranDate = moment().add(-9, 'h').format('YYYY-MM-DD HH:mm:ss');
            }
            let results = yield conn.query(sql.insertSmsMessage, [
                storeId, sendId, toPhoneNumber, fromPhoneNumber, message, tranDate
            ]);
            return results.affectedRows > 0;
        });
    },
    requestMmsMessageByDb: function (conn_1, _a) {
        return __awaiter(this, arguments, void 0, function* (conn, { storeId, sendId, toPhoneNumber, fromPhoneNumber, subject, message }) {
            let tranDate = moment().format('YYYY-MM-DD HH:mm:ss');
            //로컬 개발시에 개발 서버와의 시간차 때문에 강제로 영국시간으로 설정
            if (process.env.NODE_ENV === 'development') {
                tranDate = moment().add(-9, 'h').format('YYYY-MM-DD HH:mm:ss');
            }
            let results = yield conn.query(sql.insertMmsMesage, [
                storeId, sendId, toPhoneNumber, fromPhoneNumber, subject, message, tranDate,
                4, // TRAN_TYPE => mms message type
                1 // TRAN_STATUS => mms request status
            ]);
            return results.affectedRows > 0;
        });
    },
    requestAlimtalkMessageByDb: function (conn_1, _a) {
        return __awaiter(this, arguments, void 0, function* (conn, { storeId, sendId, toPhoneNumber, fromPhoneNumber, senderKey, templateCode, message, button, replaceSubject, replaceMessage }) {
            let tranDate = moment().format('YYYY-MM-DD HH:mm:ss');
            //로컬 개발시에 개발 서버와의 시간차 때문에 강제로 영국시간으로 설정
            if (process.env.NODE_ENV === 'development') {
                tranDate = moment().add(-9, 'h').format('YYYY-MM-DD HH:mm:ss');
            }
            let results = yield conn.query(sql.insertAlimtalkMessage, [
                storeId, sendId, toPhoneNumber, fromPhoneNumber,
                senderKey, templateCode, message, button,
                'N', // TRAN_REPLACE_TYPE => "S" : sms로 대체전송, "L" : LMS로 대체전송, "N": 전송하지 않음
                replaceSubject, replaceMessage,
                tranDate,
                5, // TRAN_TYPE => 5 : 알림톡
                1 // TRAN_STATUS => 1 : 전송요청
            ]);
            return results.affectedRows > 0;
        });
    }
};
const sql = {
    insertSmsMessage: `
  INSERT INTO \`smallbee-sms\`.MTS_SMS_MSG
  ( TRAN_REFKEY, TRAN_ID, TRAN_PHONE, TRAN_CALLBACK, TRAN_MSG, TRAN_DATE ) VALUES
  ( ?, ?, ?, ?, ?, STR_TO_DATE( ?, '%Y-%m-%d %H:%i:%s' ) )`,
    insertMmsMesage: `
  INSERT INTO \`smallbee-sms\`.MTS_MMS_MSG
  ( TRAN_REFKEY, TRAN_ID, TRAN_PHONE, TRAN_CALLBACK, TRAN_SUBJECT, TRAN_MSG,
    TRAN_DATE,
    TRAN_TYPE, TRAN_STATUS ) VALUES
  ( ?, ?, ?, ?, ?, ?,
    STR_TO_DATE( ?, '%Y-%m-%d %H:%i:%s' ),
    ?, ? )`,
    insertAlimtalkMessage: `
  INSERT INTO \`smallbee-sms\`.MTS_ATALK_MSG
  ( TRAN_REFKEY, TRAN_ID, TRAN_PHONE, TRAN_CALLBACK,
    TRAN_SENDER_KEY, TRAN_TMPL_CD, TRAN_MSG, TRAN_BUTTON,
    TRAN_REPLACE_TYPE,
    TRAN_SUBJECT, TRAN_REPLACE_MSG,
    TRAN_DATE,
    TRAN_TYPE, TRAN_STATUS ) VALUES
  ( ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?,
    ?, ?,
    STR_TO_DATE( ?, '%Y-%m-%d %H:%i:%s' ),
    ?, ? )`
};
