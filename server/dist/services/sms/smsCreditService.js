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
const sendService = require('./sendService');
module.exports = {
    getSmsCredit: function (conn, storeId) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = yield conn.query(sql.selectSmsCredit, [storeId]);
            let leftCredit = conn.resultsAsCamelCase(results)[0];
            return leftCredit;
        });
    },
    useSmsCredit: function (conn, storeId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (amount <= 0) {
                throw new Error('Invalid Amount : ' + amount);
            }
            const now = new Date().getTime();
            let results = yield conn.query(sql.selectSmsCredit, [storeId]);
            const beforeInfo = conn.resultsAsCamelCase(results)[0];
            if (!beforeInfo) {
                throw new Error('Invalid Store');
            }
            results = yield conn.query(sql.useSmsCredit, [
                amount, now, storeId, amount
            ]);
            if (results.affectedRows <= 0) {
                throw new Error('Not Enough Credit');
            }
            results = yield conn.query(sql.selectSmsCredit, [storeId]);
            const info = conn.resultsAsCamelCase(results)[0];
            if (info.smsLackAlertThreshold > 0 &&
                beforeInfo.leftSmsAmount > info.smsLackAlertThreshold &&
                info.leftSmsAmount <= info.smsLackAlertThreshold) {
                yield sendLackAlertMessage(conn, 'sms', info.smsLackAlertUserInfo);
            }
            else if (info.leftSmsAmount == 0) {
                yield sendLackAlertMessage(conn, 'sms', info.smsLackAlertUserInfo);
            }
            return info;
        });
    },
    useLmsCredit: function (conn, storeId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (amount <= 0) {
                throw new Error('Invalid Amount : ' + amount);
            }
            const now = new Date().getTime();
            let results = yield conn.query(sql.selectSmsCredit, [storeId]);
            const beforeInfo = conn.resultsAsCamelCase(results)[0];
            if (!beforeInfo) {
                throw new Error('Invalid Store');
            }
            results = yield conn.query(sql.useLmsCredit, [
                amount, now, storeId, amount
            ]);
            if (results.affectedRows <= 0) {
                throw new Error('Not Enough Credit');
            }
            results = yield conn.query(sql.selectSmsCredit, [storeId]);
            const info = conn.resultsAsCamelCase(results)[0];
            if (info.lmsLackAlertThreshold > 0 &&
                beforeInfo.leftLmsAmount > info.lmsLackAlertThreshold &&
                info.leftLmsAmount <= info.lmsLackAlertThreshold) {
                yield sendLackAlertMessage(conn, 'lms', info.lmsLackAlertUserInfo);
            }
            else if (info.leftLmsAmount == 0) {
                yield sendLackAlertMessage(conn, 'lms', info.lmsLackAlertUserInfo);
            }
            return info;
        });
    },
    useMmsCredit: function (conn, storeId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (amount <= 0) {
                throw new Error('Invalid Amount : ' + amount);
            }
            const now = new Date().getTime();
            let results = yield conn.query(sql.selectSmsCredit, [storeId]);
            const beforeInfo = conn.resultsAsCamelCase(results)[0];
            if (!beforeInfo) {
                throw new Error('Invalid Store');
            }
            results = yield conn.query(sql.useMmsCredit, [
                amount, now, storeId, amount
            ]);
            if (results.affectedRows <= 0) {
                throw new Error('Not Enough Credit');
            }
            results = yield conn.query(sql.selectSmsCredit, [storeId]);
            const info = conn.resultsAsCamelCase(results)[0];
            if (info.mmsLackAlertThreshold > 0 &&
                beforeInfo.leftMmsAmount > info.mmsLackAlertThreshold &&
                info.leftMmsAmount <= info.mmsLackAlertThreshold) {
                yield sendLackAlertMessage(conn, 'mms', info.mmsLackAlertUserInfo);
            }
            else if (info.leftMmsAmount == 0) {
                yield sendLackAlertMessage(conn, 'mms', info.mmsLackAlertUserInfo);
            }
            return info;
        });
    },
    useAlimtalkCredit: function (conn, storeId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (amount <= 0) {
                throw new Error('Invalid Amount : ' + amount);
            }
            const now = new Date().getTime();
            let results = yield conn.query(sql.selectSmsCredit, [storeId]);
            const beforeInfo = conn.resultsAsCamelCase(results)[0];
            if (!beforeInfo) {
                throw new Error('Invalid Store');
            }
            results = yield conn.query(sql.useAlimtalkCredit, [
                amount, now, storeId, amount
            ]);
            if (results.affectedRows <= 0) {
                throw new Error('Not Enough Credit');
            }
            results = yield conn.query(sql.selectSmsCredit, [storeId]);
            const info = conn.resultsAsCamelCase(results)[0];
            if (info.alimtalkLackAlertThreshold > 0 &&
                beforeInfo.leftAlimtalkAmount > info.alimtalkLackAlertThreshold &&
                info.leftAlimtalkAmount <= info.alimtalkLackAlertThreshold) {
                yield sendLackAlertMessage(conn, 'alimtalk', info.alimtalkLackAlertUserInfo);
            }
            else if (info.leftAlimtalkAmount == 0) {
                yield sendLackAlertMessage(conn, 'alimtalk', info.alimtalkLackAlertUserInfo);
            }
            return info;
        });
    },
    returnSmsCredit: function (conn, storeId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (amount <= 0) {
                throw new Error('Invalid Amount : ' + amount);
            }
            const now = new Date().getTime();
            let results = yield conn.query(sql.returnSmsCredit, [
                amount, now, storeId
            ]);
            results = yield conn.query(sql.selectSmsCredit, [storeId]);
            return conn.resultsAsCamelCase(results)[0];
        });
    },
    returnLmsCredit: function (conn, storeId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (amount <= 0) {
                throw new Error('Invalid Amount : ' + amount);
            }
            const now = new Date().getTime();
            let results = yield conn.query(sql.returnLmsCredit, [
                amount, now, storeId
            ]);
            results = yield conn.query(sql.selectSmsCredit, [storeId]);
            return conn.resultsAsCamelCase(results)[0];
        });
    },
    returnMmsCredit: function (conn, storeId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (amount <= 0) {
                throw new Error('Invalid Amount : ' + amount);
            }
            const now = new Date().getTime();
            let results = yield conn.query(sql.returnMmsCredit, [
                amount, now, storeId
            ]);
            results = yield conn.query(sql.selectSmsCredit, [storeId]);
            return conn.resultsAsCamelCase(results)[0];
        });
    },
    returnAlimtalkCredit: function (conn, storeId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (amount <= 0) {
                throw new Error('Invalid Amount : ' + amount);
            }
            const now = new Date().getTime();
            let results = yield conn.query(sql.returnAlimtalkCredit, [
                amount, now, storeId
            ]);
            results = yield conn.query(sql.selectSmsCredit, [storeId]);
            return conn.resultsAsCamelCase(results)[0];
        });
    }
};
function sendLackAlertMessage(conn, smsType, userInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Lack alert triggered for', smsType, userInfo);
        // Stubbed out: In Jeisys, we don't need to send Smallbee admin alerts
    });
}
const sql = {
    selectSmsCredit: `
  SELECT store_id,
         left_sms_amount, left_lms_amount, left_mms_amount, left_alimtalk_amount,
         sms_lack_alert_threshold, sms_lack_alert_user_info,
         lms_lack_alert_threshold, lms_lack_alert_user_info,
         mms_lack_alert_threshold, mms_lack_alert_user_info,
         alimtalk_lack_alert_threshold, alimtalk_lack_alert_user_info,
         modify_date
  FROM \`smallbee-sms\`.tb_store_sms_credit
  WHERE store_id = ?`,
    /*
    selectChargetAmount: `
    SELECT charge_target, SUM( amount ) AS credit_amount
    FROM \`smallbee-sms\`.tb_store_sms_credit_charge_history
    WHERE store_id = ? AND cancel_date IS NULL
    GROUP BY charge_target`,
  
    selectUseCreditAmount: `
    SELECT COUNT(*) AS use_credit_amount
    FROM \`smallbee-sms\`.tb_store_sms_send A INNER JOIN \`smallbee-sms\`.tb_store_sms_send_user B
         ON A.store_id = B.store_id AND A.send_id = B.send_id
    WHERE A.store_id = ? AND
          A.purpose != 'auth' AND (
            ( A.sms_type = 'sms' AND B.send_result = '00' ) OR
            ( A.sms_type = 'lms' AND B.send_result = '0000' ) OR
            ( A.sms_type = 'mms' AND B.send_result = '0000' ) OR
            ( A.sms_type = 'alimtalk' AND B.send_result = '1000' )
          )`,
    */
    useSmsCredit: `
  UPDATE \`smallbee-sms\`.tb_store_sms_credit
  SET left_sms_amount = left_sms_amount - ?,
      modify_date = ?
  WHERE store_id = ? AND
        ( left_sms_amount < 0 OR left_sms_amount >= ? )`,
    useLmsCredit: `
  UPDATE \`smallbee-sms\`.tb_store_sms_credit
  SET left_lms_amount = left_lms_amount - ?,
      modify_date = ?
  WHERE store_id = ? AND
        ( left_lms_amount < 0 OR left_lms_amount >= ? )`,
    useMmsCredit: `
  UPDATE \`smallbee-sms\`.tb_store_sms_credit
  SET left_mms_amount = left_mms_amount - ?,
      modify_date = ?
  WHERE store_id = ? AND
        ( left_mms_amount < 0 OR left_mms_amount >= ? )`,
    useAlimtalkCredit: `
  UPDATE \`smallbee-sms\`.tb_store_sms_credit
  SET left_alimtalk_amount = left_alimtalk_amount - ?,
      modify_date = ?
  WHERE store_id = ? AND
        ( left_alimtalk_amount < 0 OR left_alimtalk_amount >= ? )`,
    returnSmsCredit: `
  UPDATE \`smallbee-sms\`.tb_store_sms_credit
  SET left_sms_amount = left_sms_amount + ?,
      modify_date = ?
  WHERE store_id = ? AND left_sms_amount >= 0`,
    returnLmsCredit: `
  UPDATE \`smallbee-sms\`.tb_store_sms_credit
  SET left_lms_amount = left_lms_amount + ?,
      modify_date = ?
  WHERE store_id = ? AND left_lms_amount >= 0`,
    returnMmsCredit: `
  UPDATE \`smallbee-sms\`.tb_store_sms_credit
  SET left_mms_amount = left_mms_amount + ?,
      modify_date = ?
  WHERE store_id = ? AND left_mms_amount >= 0`,
    returnAlimtalkCredit: `
  UPDATE \`smallbee-sms\`.tb_store_sms_credit
  SET left_alimtalk_amount = left_alimtalk_amount + ?,
      modify_date = ?
  WHERE store_id = ? AND left_alimtalk_amount >= 0`
};
