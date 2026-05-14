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
const resultCode = require('./resultCode');
const sendCudService = require('./sendCudService');
module.exports = {
    registerSend: function (conn, send, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let { storeId, fromPhoneNumber, purpose, smsType, subject, message, attachedTitle, attachedUrl, attachedImage, attachedCouponTemplateStoreId, attachedCouponTemplateId, attachedCouponUrl, smsRefusalPhoneNumber, smsRefusalStoreCode, reservedSendDate, sendNow } = send;
            let { phoneNumber, userId, name } = user;
            let now = new Date().getTime();
            send.sendType = null;
            send.createDate = now;
            send.sendDate = !reservedSendDate || sendNow ? now : null;
            send = yield sendCudService.create(conn, send);
            yield conn.query(sql.insertSmsSendUser, [
                storeId, send.sendId, phoneNumber, userId, name, null, null, now
            ]);
            return send;
        });
    },
    registerBulkSend: function (conn, send, userList /*[ { phoneNumber, userId, name, ... } ... ]*/) {
        return __awaiter(this, void 0, void 0, function* () {
            let { storeId, fromPhoneNumber, purpose, smsType, subject, message, attachedTitle, attachedUrl, attachedImage, attachedCouponTemplateStoreId, attachedCouponTemplateId, attachedCouponUrl, smsRefusalPhoneNumber, smsRefusalStoreCode, reservedSendDate, sendNow, templateId, filterId, filterName, filterExpression } = send;
            let now = new Date().getTime();
            send.sendType = 'bulk';
            send.createDate = now;
            send.sendDate = !reservedSendDate || sendNow ? now : null;
            send = yield sendCudService.create(conn, send);
            // 쿠폰 발행 로직 제거됨 (Jeisys용)
            let couponList = [];
            for (let i = 0; i < userList.length; i++) {
                const userInfo = userList[i];
                const coupon = _.get(couponList, `${i}`);
                const couponNum = coupon ? Buffer.from(coupon.couponNum, 'utf8').toString('base64') : null;
                const couponUrl = couponNum ? `${attachedCouponUrl}?cpn=${couponNum}` : null;
                yield conn.query(sql.insertSmsSendUser, [
                    storeId, send.sendId, userInfo.phoneNumber, userInfo.userId, userInfo.name,
                    JSON.stringify(Object.assign(Object.assign({}, userInfo), { couponUrl })),
                    _.get(coupon, 'couponId'),
                    now
                ]);
            }
            return send;
        });
    },
    setSendResult: function (conn, storeId, sendId, phoneNumber, sendStatus, sendResult) {
        return __awaiter(this, void 0, void 0, function* () {
            let now = new Date().getTime();
            let results = yield conn.query(sql.updateSendResult, [
                sendStatus, sendResult, now, storeId, sendId, phoneNumber
            ]);
            return results.affectdRows > 0;
        });
    },
    getBulkSendList: function (conn, storeId, startTimestamp, endTimestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield conn.query(sql.selectBulkSendList, [storeId, startTimestamp, endTimestamp]);
            return conn.resultsAsCamelCase(result);
        });
    },
    getSendDetailInfo: function (conn, storeId, sendId) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield conn.query(sql.selectSend, [storeId, sendId]);
            let sendInfo = conn.resultsAsCamelCase(result)[0];
            if (!sendInfo) {
                return sendInfo;
            }
            result = yield conn.query(sql.selectSendUserList, [storeId, sendId]);
            let userList = conn.resultsAsCamelCase(result);
            sendInfo.userList = _.map(userList, user => {
                if (user.sendStatus) {
                    user.sendStatusMessage = resultCode.TRAN_STATUS[user.sendStatus];
                }
                if (user.sendResult && sendInfo.smsType === 'sms') {
                    user.sendResultMessage = resultCode.SMS_RESULT[user.sendResult];
                }
                else if (user.sendResult && (sendInfo.smsType === 'lms' || sendInfo.smsType === 'mms')) {
                    user.sendResultMessage = resultCode.MMS_RESULT[user.sendResult];
                }
                else if (user.sendResult && sendInfo.smsType === 'alimtalk') {
                    user.sendResultMessage = resultCode.ATALK_RESULT[user.sendResult];
                }
                return user;
            });
            return sendInfo;
        });
    },
    getLmsSendCount: function (conn, storeId) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = yield conn.query(sql.selectLmsSendCount, [storeId]);
            return _.get(results, '[0].count', 0);
        });
    },
    getLmsSendSuccessCount: function (conn, storeId) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = yield conn.query(sql.selectLmsSendSuccessCount, [storeId]);
            return _.get(results, '[0].count', 0);
        });
    },
    getSingleSendList: function (conn, storeId, startTimestamp, endTimestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield conn.query(sql.selectSingleSendList, [storeId, startTimestamp, endTimestamp]);
            let sendList = conn.resultsAsCamelCase(result);
            return _.map(sendList, send => {
                send.sendStatusMessage = send.sendStatus ? resultCode.TRAN_STATUS[send.sendStatus] : null;
                if (send.sendResult && send.smsType === 'sms') {
                    send.sendResultMessage = resultCode.SMS_RESULT[send.sendResult];
                }
                else if (send.sendResult && (send.smsType === 'lms' || send.smsType === 'mms')) {
                    send.sendResultMessage = resultCode.MMS_RESULT[send.sendResult];
                }
                else if (send.sendResult && send.smsType === 'alimtalk') {
                    send.sendResultMessage = resultCode.ATALK_RESULT[send.sendResult];
                }
                return send;
            });
        });
    },
    getSendCountOfPeriod: function (conn, storeId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            let lmsCnt = yield conn.query(sql.selectLmsSendCountOfPeriod, [storeId, startDate, endDate]);
            let alimtalkCnt = yield conn.query(sql.selectAlimtalkSendCountOfPeriod, [storeId, startDate, endDate]);
            return {
                lmsCnt: _.get(lmsCnt, '[0].count', 0),
                alimtalkCnt: _.get(alimtalkCnt, '[0].count', 0),
            };
        });
    },
    getSmsRefusalListByPhoneNumber: function (conn, storeId, phoneNumberList) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!phoneNumberList.length) {
                return [];
            }
            phoneNumberList = _.map(phoneNumberList, pn => `'${pn}'`);
            let s = sql.selectSmsRefusalListByPhoneNumber + `(${_.join(phoneNumberList)})`;
            let results = yield conn.query(s, [storeId]);
            return conn.resultsAsCamelCase(results);
        });
    },
};
const sql = {
    selectLmsSendCountOfPeriod: `
  SELECT COUNT(*) AS count
  FROM \`smallbee-sms\`.tb_store_sms_send A INNER JOIN
       \`smallbee-sms\`.tb_store_sms_send_user B
       ON A.store_id = B.store_id AND A.send_id = B.send_id
  WHERE A.store_id = ? AND A.sms_type = 'lms'
  AND A.create_date >= ? AND A.create_date < ?`,
    selectAlimtalkSendCountOfPeriod: `
  SELECT COUNT(*) AS count
  FROM \`smallbee-sms\`.tb_store_sms_send A INNER JOIN
       \`smallbee-sms\`.tb_store_sms_send_user B
       ON A.store_id = B.store_id AND A.send_id = B.send_id
  WHERE A.store_id = ? AND A.sms_type = 'alimtalk'
  AND A.create_date >= ? AND A.create_date < ?`,
    insertSmsSendUser: `
  INSERT INTO \`smallbee-sms\`.tb_store_sms_send_user
  ( store_id, send_id, phone_number,
    user_id, name, param, coupon_id,
    create_date ) VALUES
  ( ?, ?, ?,
    ?, ?, ?, ?,
    ? ) `,
    updateSendResult: `
  UPDATE \`smallbee-sms\`.tb_store_sms_send_user
  SET send_status = ?,
      send_result = ?,
      send_result_date = ?
  WHERE store_id = ? AND send_id = ? AND phone_number = ?`,
    selectBulkSendList: `
  SELECT *
  FROM ( 
    SELECT send_id, store_id, from_phone_number, purpose, sms_type, send_type,
           subject, reserved_send_date,
           template_id, filter_id, filter_name, filter_expression,
           send_date, cancel_date,
           create_date, modify_date, version,
           IFNULL( cancel_date, IFNULL( reserved_send_date, send_date ) ) AS maybe_send_date,
           ( SELECT COUNT(*) FROM \`smallbee-sms\`.tb_store_sms_send_user B
             WHERE A.store_id = B.store_id AND A.send_id = B.send_id ) AS user_count,
           ( SELECT COUNT(*) FROM \`smallbee-sms\`.tb_store_sms_send_user B
             WHERE A.store_id = B.store_id AND A.send_id = B.send_id AND
                   B.send_result_date IS NOT NULL ) AS done_user_count,
           ( SELECT COUNT(*) FROM \`smallbee-sms\`.tb_store_sms_send_user B
             WHERE A.store_id = B.store_id AND A.send_id = B.send_id AND
                   B.send_result = '1000' ) AS success_user_count,
           ( SELECT name FROM \`smallbee-sms\`.tb_store_sms_message_template B
             WHERE A.store_id = B.store_id AND A.template_id = B.template_id ) AS template_name
    FROM \`smallbee-sms\`.tb_store_sms_send A
    WHERE store_id = ? AND sms_type = 'lms' AND send_type = 'bulk'
  ) A
  WHERE maybe_send_date >= ? AND maybe_send_date < ?
  ORDER BY maybe_send_date DESC`,
    selectSend: `
  SELECT send_id, store_id, from_phone_number, purpose, sms_type, send_type,
         subject, message, attached_title, attached_url, attached_image,
         attached_coupon_template_store_id, attached_coupon_template_id, attached_coupon_url,
         sms_refusal_phone_number, sms_refusal_store_code,
         reserved_send_date, send_date, cancel_date
         create_date, modify_date, version
  FROM \`smallbee-sms\`.tb_store_sms_send A
  WHERE store_id = ? AND send_id = ?`,
    selectSendUserList: `
  SELECT store_id, phone_number, user_id, name, param, send_status, send_result, send_result_date
  FROM \`smallbee-sms\`.tb_store_sms_send_user
  WHERE store_id = ? AND send_id = ?`,
    selectLmsSendCount: `
  SELECT COUNT(*) AS count
  FROM \`smallbee-sms\`.tb_store_sms_send A INNER JOIN
       \`smallbee-sms\`.tb_store_sms_send_user B
       ON A.store_id = B.store_id AND A.send_id = B.send_id
  WHERE A.store_id = ? AND A.sms_type = 'lms'`,
    selectLmsSendSuccessCount: `
  SELECT COUNT(*) AS count
  FROM \`smallbee-sms\`.tb_store_sms_send A INNER JOIN
       \`smallbee-sms\`.tb_store_sms_send_user B
       ON A.store_id = B.store_id AND A.send_id = B.send_id
  WHERE A.store_id = ? AND A.sms_type = 'lms' AND A.cancel_date IS NULL AND
        (
          ( B.send_status IS NULL AND B.send_result IS NULL ) OR
          B.send_result = '1000'
        )`,
    selectSingleSendList: `
  SELECT *
  FROM ( 
    SELECT A.send_id, A.store_id, A.purpose, A.subject, A.sms_type,
           IFNULL( A.cancel_date, IFNULL( A.reserved_send_date, A.send_date ) ) AS maybe_send_date,
           B.phone_number, B.send_status, B.send_result, B.send_result_date
    FROM \`smallbee-sms\`.tb_store_sms_send A INNER JOIN \`smallbee-sms\`.tb_store_sms_send_user B
         ON A.store_id = B.store_id AND A.send_id = B.send_id
    WHERE A.store_id = ? AND A.send_type IS NULL
  ) A
  WHERE maybe_send_date >= ? AND maybe_send_date < ?
  ORDER BY maybe_send_date DESC`,
    selectSmsRefusalListByPhoneNumber: `
  SELECT A.sms_refusal_phone_number, A.sms_refusal_store_code,
         A.phone_number, A.create_date, A.store_id, A.user_id
  FROM \`smallbee-sms\`.tb_store_sms_refusal AS A
  INNER JOIN ( SELECT sms_refusal_phone_number, sms_refusal_store_code, phone_number, MAX(create_date) create_date
               FROM \`smallbee-sms\`.tb_store_sms_refusal
               GROUP BY sms_refusal_phone_number , sms_refusal_store_code , phone_number) B
  ON A.sms_refusal_phone_number = B.sms_refusal_phone_number AND A.sms_refusal_store_code = B.sms_refusal_store_code
     AND A.phone_number = B.phone_number AND A.create_date = B.create_date
  WHERE A.store_id = ? AND A.phone_number IN  `,
};
