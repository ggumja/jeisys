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
  
  async query(sql, params) {
    const [rows, fields] = await this.connection.query(sql, params);
    if (rows && !Array.isArray(rows) && rows.affectedRows !== undefined) {
      // It's an insert/update result
      return rows; 
    }
    // It's a select result
    if (rows) {
      rows._fields = fields;
    }
    return rows;
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

async function dbTran(storeId, asyncFn) {
  if (typeof storeId === 'function') {
    asyncFn = storeId;
    storeId = null;
  }
  
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  const connWrapper = new ConnWrapper(connection);
  
  try {
    const result = await asyncFn(connWrapper);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

dbTran.dbRoTran = dbTran;
module.exports = dbTran;
