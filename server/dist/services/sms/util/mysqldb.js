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
const mysql = require('mysql2/promise');
const _ = require('lodash');
const pool = mysql.createPool({
    host: process.env.SMALLBEE_SMS_DB_HOST || '127.0.0.1',
    user: process.env.SMALLBEE_SMS_DB_USER || 'root',
    password: process.env.SMALLBEE_SMS_DB_PASSWORD || '',
    database: process.env.SMALLBEE_SMS_DB_DATABASE || 'smallbee-sms',
    port: parseInt(process.env.SMALLBEE_SMS_DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
function resultsAsCamelCase(results) {
    if (!results || !results[0]) {
        return [];
    }
    return _.map(results, item => {
        return _.reduce(item, (m, v, k) => {
            let fieldName = _.camelCase(k);
            if (_.includes(k, '_i18n')) {
                fieldName = fieldName.replace(/I18N$/g, 'I18n');
            }
            m[fieldName] = v;
            return m;
        }, {});
    });
}
class ConnWrapper {
    constructor(connection) {
        this.connection = connection;
        this.dataBag = {};
    }
    query(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows, fields] = yield this.connection.query(sql, params);
            if (rows && !Array.isArray(rows) && rows.affectedRows !== undefined) {
                // It's an insert/update result
                return rows;
            }
            // It's a select result
            if (rows) {
                rows._fields = fields;
            }
            return rows;
        });
    }
    resultsAsCamelCase(results) {
        return resultsAsCamelCase(results);
    }
    getData(key) {
        return this.dataBag[key];
    }
    setData(key, value) {
        const prev = this.dataBag[key];
        this.dataBag[key] = value;
        return prev;
    }
}
function dbTran(storeId, asyncFn) {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof storeId === 'function') {
            asyncFn = storeId;
            storeId = null;
        }
        const connection = yield pool.getConnection();
        yield connection.beginTransaction();
        const connWrapper = new ConnWrapper(connection);
        try {
            const result = yield asyncFn(connWrapper);
            yield connection.commit();
            return result;
        }
        catch (err) {
            yield connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
    });
}
dbTran.dbRoTran = dbTran;
module.exports = dbTran;
