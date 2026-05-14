const _ = require( 'lodash' )

module.exports = {
  create: async function( conn, send ) {
    let {
      storeId, fromPhoneNumber, purpose, smsType, sendType,
      subject, message, attachedTitle, attachedUrl, attachedImage,
      attachedCouponTemplateStoreId, attachedCouponTemplateId, attachedCouponUrl,
      smsRefusalPhoneNumber, smsRefusalStoreCode,
      reservedSendDate,
      templateId, filterId, filterName, filterExpression,
      sendDate
    } = send

    send.createDate = send.createDate || new Date().getTime()
    send.modifyDate = send.createDate
    send.version = 0

    let results = await conn.query( sql.create, [
      storeId, fromPhoneNumber, purpose, smsType, sendType,
      subject, message, attachedTitle, attachedUrl, attachedImage,
      attachedCouponTemplateStoreId, attachedCouponTemplateId, attachedCouponUrl,
      smsRefusalPhoneNumber, smsRefusalStoreCode,
      reservedSendDate,
      templateId, filterId, filterName, filterExpression,
      sendDate, null,
      send.createDate, send.modifyDate, send.version ] )

    let sendId = results.insertId
    send.sendId = sendId

    results = await conn.query( sql.copyToHistory, [ storeId, sendId ] )

    return send
  },
  updateSendDate: async function( conn, send ) {
    let results = await conn.query( sql.update1, [ send.storeId, send.sendId, send.version ] )
    if( results.affectedRows <= 0 ) {
      throw new Error( 'Invalid Id or Not Latest Version' )
    }

    let modifyDate = new Date().getTime()

    results = await conn.query( sql.updateSendDate, [
      send.sendDate, modifyDate, send.storeId, send.sendId ] )

    send.modifyDate = modifyDate
    send.version = send.version + 1

    results = await conn.query( sql.copyToHistory, [ send.storeId, send.sendId ] )

    return send
  },
  updateReservedSendDate: async function( conn, send ) {
    let results = await conn.query( sql.update1, [ send.storeId, send.sendId, send.version ] )
    if( results.affectedRows <= 0 ) {
      throw new Error( 'Invalid Id or Not Latest Version' )
    }

    let modifyDate = new Date().getTime()

    results = await conn.query( sql.updateReservedSendDate, [
      send.reservedSendDate, modifyDate, send.storeId, send.sendId ] )

    send.modifyDate = modifyDate
    send.version = send.version + 1

    results = await conn.query( sql.copyToHistory, [ send.storeId, send.sendId ] )

    return send
  },
  updateCancelDate: async function( conn, send ) {
    let results = await conn.query( sql.update1, [ send.storeId, send.sendId, send.version ] )
    if( results.affectedRows <= 0 ) {
      throw new Error( 'Invalid Id or Not Latest Version' )
    }

    let modifyDate = new Date().getTime()

    results = await conn.query( sql.updateCancelDate, [
      send.cancelDate, modifyDate, send.storeId, send.sendId ] )

    send.modifyDate = modifyDate
    send.version = send.version + 1

    results = await conn.query( sql.copyToHistory, [ send.storeId, send.sendId ] )

    return send
  }
}

const sql = {
  create: `
  INSERT INTO \`smallbee-sms\`.tb_store_sms_send
  ( store_id, from_phone_number, purpose, sms_type, send_type,
    subject, message, attached_title, attached_url, attached_image,
    attached_coupon_template_store_id, attached_coupon_template_id, attached_coupon_url,
    sms_refusal_phone_number, sms_refusal_store_code,
    reserved_send_date, 
    template_id, filter_id, filter_name, filter_expression,
    send_date, cancel_date,
    create_date, modify_date, version ) VALUES
  ( ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?,
    ?,
    ?, ?, ?, ?,
    ?, ?,
    ?, ?, ? )`,

  copyToHistory: `
  INSERT INTO \`smallbee-sms\`.tb_store_sms_send_history
  ( send_id, store_id, from_phone_number, purpose, sms_type, send_type,
    subject, message, attached_title, attached_url, attached_image,
    attached_coupon_template_store_id, attached_coupon_template_id, attached_coupon_url,
    sms_refusal_phone_number, sms_refusal_store_code,
    reserved_send_date, 
    template_id, filter_id, filter_name, filter_expression,
    send_date, cancel_date,
    create_date, modify_date, version )
  SELECT send_id, store_id, from_phone_number, purpose, sms_type, send_type,
         subject, message, attached_title, attached_url, attached_image,
         attached_coupon_template_store_id, attached_coupon_template_id, attached_coupon_url,
         sms_refusal_phone_number, sms_refusal_store_code,
         reserved_send_date, 
         template_id, filter_id, filter_name, filter_expression,
         send_date, cancel_date,
         create_date, modify_date, version
  FROM \`smallbee-sms\`.tb_store_sms_send
  WHERE store_id = ? AND send_id = ?`,

  update1: `
  UPDATE \`smallbee-sms\`.tb_store_sms_send
  SET version = version + 1
  WHERE store_id = ? AND send_id = ? AND version = ?`,

  updateSendDate: `
  UPDATE \`smallbee-sms\`.tb_store_sms_send
  SET send_date = ?,
      modify_date = ?
  WHERE store_id = ? AND send_id = ?`,

  updateReservedSendDate: `
  UPDATE \`smallbee-sms\`.tb_store_sms_send
  SET reserved_send_date = ?,
      modify_date = ?
  WHERE store_id = ? AND send_id = ?`,

  updateCancelDate: `
  UPDATE \`smallbee-sms\`.tb_store_sms_send
  SET cancel_date = ?,
      modify_date = ?
  WHERE store_id = ? AND send_id = ?`
}
