/**
 * 템플릿 엔진 로직. 
 * {{변수명}} 형식의 텍스트를 찾아 파라미터 값으로 치환합니다.
 */
function parseTemplate(templateString, params) {
    if (!templateString) return '';
    
    return templateString.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
        return params[key] !== undefined ? params[key] : match;
    });
}

/**
 * 프론트엔드의 치환 변수들과 백엔드의 params 객체를 매핑하여
 * parseTemplate에 사용할 수 있는 객체로 변환합니다.
 */
function buildTemplateVariables(msg, settings) {
    return {
        shop_name: settings.company_name || '제이시스메디칼',
        customer_name: msg.customerName || msg.toName || '고객',
        order_number: msg.orderNumber || msg.param || '',
        payment_amount: (msg.paymentAmount || 0).toLocaleString('ko-KR'),
        payment_method: msg.paymentMethod || '',
        vact_bank: msg.vactBank || '',
        vact_account: msg.vactAccount || '',
        bank_name: msg.bankName || '',
        bank_account: msg.bankAccount || '',
        bank_depositor: msg.bankDepositor || '',
        partial_paid_amount: (msg.partialPaidAmount || 0).toLocaleString('ko-KR'),
        remaining_amount: (msg.remainingAmount || 0).toLocaleString('ko-KR'),
        shipped_items: msg.shippedItems || '',
        remaining_items: msg.remainingItems || '',
        courier_name: msg.courierName || '',
        tracking_number: msg.trackingNumber || '',
        expiring_point: (msg.expiringPoint || 0).toLocaleString('ko-KR'),
        expiring_credit: (msg.expiringCredit || 0).toLocaleString('ko-KR'),
        credit_type: msg.creditType || '',
        expire_date: msg.expireDate || '',
        expire_days_left: msg.expireDaysLeft || ''
    };
}

module.exports = {
    parseTemplate,
    buildTemplateVariables
};
