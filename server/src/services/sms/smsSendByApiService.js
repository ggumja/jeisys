const dotenv = require('dotenv');
dotenv.config();

const API_URL_BASE = 'https://api.mtsco.co.kr';

async function sendApiRequest(endpoint, payload) {
    const authCode = process.env.MTS_API_AUTH_CODE;
    if (!authCode) {
        console.error('MTS_API_AUTH_CODE is missing in .env');
        return { code: 'ER99', message: 'MTS_API_AUTH_CODE missing' };
    }

    const requestPayload = {
        auth_code: authCode,
        ...payload
    };

    try {
        const response = await fetch(`${API_URL_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestPayload)
        });

        const data = await response.json();
        return data; // { code: "0000", message: "...", received_at: "..." }
    } catch (error) {
        console.error('MTS API Request Error:', error);
        return { code: 'HTTP_ERR', message: error.message };
    }
}

/**
 * Alimtalk 발송 (단건)
 */
async function requestAlimtalkMessageByApi(params) {
    const {
        toPhoneNumber,
        fromPhoneNumber,
        senderKey,
        templateCode,
        message,
        button,
        replaceSubject, // header/title 로 사용 가능
        tranType, // 'S', 'L', 'N'
        tranMessage
    } = params;

    const payload = {
        sender_key: senderKey || process.env.MTS_SENDER_KEY,
        callback_number: fromPhoneNumber.replace(/-/g, ''),
        phone_number: toPhoneNumber.replace(/-/g, ''),
        template_code: templateCode,
        message: message,
        tran_type: tranType || 'N',
        tran_message: tranMessage || message
    };

    if (replaceSubject) {
        payload.subject = replaceSubject;
        payload.header = replaceSubject;
    }

    if (button) {
        try {
            const btnData = typeof button === 'string' ? JSON.parse(button) : button;
            payload.attachment = { button: btnData };
        } catch (e) {
            console.warn('Failed to parse button data', e);
        }
    }

    return await sendApiRequest('/sndng/atk/sendMessage', payload);
}

/**
 * SMS/LMS 발송 (단건)
 */
async function requestSmsMessageByApi(params) {
    const {
        toPhoneNumber,
        fromPhoneNumber,
        message,
        subject
    } = params;

    const payload = {
        callback_number: fromPhoneNumber.replace(/-/g, ''),
        phone_number: toPhoneNumber.replace(/-/g, ''),
        message: message
    };

    if (subject) {
        payload.subject = subject;
    }

    return await sendApiRequest('/sndng/sms/sendMessage', payload);
}

/**
 * MMS 발송 (단건)
 */
async function requestMmsMessageByApi(params) {
    const {
        toPhoneNumber,
        fromPhoneNumber,
        message,
        subject,
        fileInfo // { file_name, file_size, data } if needed
    } = params;

    const payload = {
        callback_number: fromPhoneNumber.replace(/-/g, ''),
        phone_number: toPhoneNumber.replace(/-/g, ''),
        message: message
    };

    if (subject) {
        payload.subject = subject;
    }
    
    // In actual MMS, we'd add file upload logic if required by MTS,
    // but the PDF notes `/sndng/mms/sendMessage` is used.
    
    return await sendApiRequest('/sndng/mms/sendMessage', payload);
}

module.exports = {
    requestAlimtalkMessageByApi,
    requestSmsMessageByApi,
    requestMmsMessageByApi
};
