"use strict";
module.exports = {
    reservationComplete: function (storeName, pageUrl) {
        // if( process.env.NODE_ENV !== 'production' ) {
        //   return {
        //     templateCode: 'SB0000',
        //     message: `${storeName} 예약 등록이 완료 되었습니다.` 
        //       + `\n상세 내용을 확인하시려면 아래 버튼을 눌러주세요.`,
        //     button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
        //     replaceSubject: '예약 확인',
        //     replaceMessage: `${storeName} 예약 등록이 완료 되었습니다.` 
        //       + `\n상세 내용을 확인하시려면 아래 링크를 눌러주세요.` 
        //       + `\n${pageUrl}`
        //   }
        // }
        return {
            templateCode: 'SB0001',
            message: `${storeName} 예약 등록이 완료 되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 버튼을 눌러주세요.`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '예약 등록 완료',
            replaceMessage: `${storeName} 예약 등록이 완료 되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    reservationCancel: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0002',
            message: `${storeName} 예약 취소 처리되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 버튼을 눌러주세요.`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '예약 취소',
            replaceMessage: `${storeName} 예약 취소 처리되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    reservationChange: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0003',
            message: `${storeName} 예약 변경이 완료 되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 버튼을 눌러주세요.`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '예약 변경',
            replaceMessage: `${storeName} 예약 변경이 완료 되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    waitingRequest: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0004',
            message: `${storeName} 고객님께서 대기 등록을 요청하셨습니다.`
                + `\n상세 내용을 확인하시려면 아래 버튼을 눌러주세요.`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '대기 요청',
            replaceMessage: `${storeName} 고객님께서 대기 등록을 요청하셨습니다.`
                + `\n상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    waitingCall: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0005',
            message: `${storeName} 고객님께서 등록하신 대기 순서가 임박했습니다.`
                + `\n대기 상태를 확인하시려면 아래 버튼을 눌러주세요.`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '대기 호출',
            replaceMessage: `${storeName} 고객님께서 등록하신 대기 순서가 임박했습니다.`
                + `\n상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    packageOrder: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0006',
            message: `${storeName} 포장 주문 등록이 완료 되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 버튼을 눌러주세요.`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '포장 주문',
            replaceMessage: `${storeName} 포장 주문 등록이 완료 되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    receiptIssue: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0008',
            message: `${storeName} 고객님이 요청하신 전자 영수증이 발송되었습니다.`
                + `\n영수증을 확인하시려면 아래 버튼을 눌러주세요.`
                + `\n접속 유효 기간 : 발급일로부터 30일 이내`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '영수증 발송',
            replaceMessage: `${storeName} 고객님이 요청하신 전자 영수증이 발송되었습니다.`
                + `\n영수증을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n접속 유효 기간 : 발급일로부터 30일 이내`
                + `\n${pageUrl}`
        };
    },
    packageCall: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0009',
            message: `${storeName} 고객님께서 주문하신 포장이 준비되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 버튼을 눌러주세요.`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '포장 호출',
            replaceMessage: `${storeName} 고객님께서 주문하신 포장이 준비되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    waitingNumber: function (storeName, pageUrl, waitingNumber) {
        return {
            templateCode: 'SB0010',
            message: `${storeName} 대기번호 ${waitingNumber}번 으로 대기 등록이 완료되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 버튼을 눌러주세요.`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '포장 호출',
            replaceMessage: `${storeName} 대기번호 ${waitingNumber}번 으로 대기 등록이 완료되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    receiptIssueV2: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0011',
            message: `${storeName} 고객님이 요청하신 전자 영수증이 발송되었습니다.`
                + `\n영수증을 확인하시려면 아래 버튼을 눌러주세요.`
                + `\n접속 유효 기간 : 발급일로부터 30일 이내`,
            button: `{"name":"영수증 확인하기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '영수증 발송 V2',
            replaceMessage: `${storeName} 고객님이 요청하신 전자 영수증이 발송되었습니다.`
                + `\n영수증을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n접속 유효 기간 : 발급일로부터 30일 이내`
                + `\n${pageUrl}`
        };
    },
    orderAccept: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0012',
            message: `${storeName} 고객님께서 요청하신 주문이 접수 완료되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 버튼을 눌러주세요.`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '주문 접수',
            replaceMessage: `${storeName} 고객님께서 요청하신 주문이 접수 완료되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    orderReady: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0013',
            message: `${storeName} 고객님께서 요청하신 주문이 준비되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 버튼을 눌러주세요.`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '주문 호출',
            replaceMessage: `${storeName} 고객님께서 요청하신 주문이 준비되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    cancelDeal: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0014',
            message: `${storeName} 주문 취소 되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 버튼을 눌러주세요.`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '주문 취소',
            replaceMessage: `${storeName} 주문 취소 되었습니다.`
                + `\n상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    orderReadyV2: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0018',
            message: `${storeName} 고객님께서 요청하신 주문이 준비되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"상세 내용 확인하기","type":"WL","url_mobile":"${pageUrl}","url_pc":"${pageUrl}"}`,
            replaceSubject: '주문 호출',
            replaceMessage: `${storeName} 고객님께서 요청하신 주문이 준비되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    presentPrepaidcard: function (storeName, pageUrl, presentInfo) {
        const { fromUserName, templateName, chargeAmount, exinctionDate, usableStoreList, templateDescp } = presentInfo;
        return {
            message: `[${storeName}] ${fromUserName} 님이 기프트카드를 선물했어요. 선물과 메세지를 확인해보세요!
선물은 고객(본인)인증 후에 사용이 가능합니다.
- 상품명 : ${templateName} 카드 / ${chargeAmount} 원
- 유효기간 : ~${exinctionDate} 까지 사용가능

[사용처]
${usableStoreList} 에서 사용이 가능합니다.`
                + (templateDescp ? `

[이용안내]
${templateDescp}

상세 내용을 확인하시려면 아래 버튼을 눌러주세요.` : ''),
            button: `{"name":"선물 확인 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '기프트카드',
            replaceMessage: `[${storeName}] ${fromUserName} 님이 기프트카드를 선물했어요. 선물과 메세지를 확인해보세요!
선물은 고객(본인)인증 후에 사용이 가능합니다.
- 상품명 : ${templateName} 카드 / ${chargeAmount} 원
- 유효기간 : ~${exinctionDate} 까지 사용가능

[사용처]
${usableStoreList} 에서 사용이 가능합니다.`
                + (templateDescp ? `

[이용안내]
${templateDescp}

상세 내용을 확인하시려면 아래 링크를 눌러주세요.
${pageUrl}` : '')
        };
    },
    cancelPresent: function (storeName, pageUrl, fromName) {
        return {
            message: `[${storeName}] ${fromName} 님께 선물받은 기프트카드가 취소 처리되었습니다.`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '기프카드 선물 취소',
            replaceMessage: `[${storeName}] ${fromName} 님께 선물받은 기프트카드가 취소 처리되었습니다.`
        };
    },
    refusePresent: function (storeName, pageUrl, targetUserName) {
        return {
            message: `[${storeName}] ${targetUserName} 님께 선물하신 기프트카드가 수신인 거절로 인해 취소 처리되었습니다.`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '기프카드 선물 거절',
            replaceMessage: `[${storeName}] ${targetUserName} 님께 선물하신 기프트카드가 수신인 거절로 인해 취소 처리되었습니다.`
        };
    },
    reservationCompleteV2: function (storeName, pageUrl, reservationInfo) {
        const { startDate, startTime, personToString } = reservationInfo;
        return {
            templateCode: 'SB0049',
            message: `[${storeName}] 예약 등록이 완료되었습니다.`
                + `\n`
                + `\n[이용 예약 안내]`
                + `\n-일자: ${startDate}`
                + `\n-시간: ${startTime}`
                + `\n-인원: ${personToString}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"예약 상태 확인하기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '예약 접수(매장)',
            replaceMessage: `[${storeName}] 예약 등록이 완료 되었습니다.`
                + `\n`
                + `\n.[이용 예약 안내]`
                + `\n-일자: ${startDate}`
                + `\n-시간: ${startTime}`
                + `\n-인원: ${personToString}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러 주세요.`
                + `\n${pageUrl}`
        };
    },
    reservationCancelV2: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0052',
            message: `[${storeName}] 예약이 취소 처리 되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"예약 상태 확인하기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '예약 취소(매장)',
            replaceMessage: `[${storeName}] 예약이 취소 처리 되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    reservationChangeV2: function (storeName, pageUrl, reservationInfo) {
        const { startDate, startTime, personToString } = reservationInfo;
        return {
            templateCode: 'SB0050',
            message: `[${storeName}] 예약 변경이 완료되었습니다.`
                + `\n`
                + `\n[이용 예약 안내]`
                + `\n-일자: ${startDate}`
                + `\n-시간: ${startTime}`
                + `\n-인원: ${personToString}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"예약 상태 확인하기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '예약 변경(매장)',
            replaceMessage: `[${storeName}] 예약 변경이 완료되었습니다.`
                + `\n`
                + `\n[이용 예약 안내]`
                + `\n-일자: ${startDate}`
                + `\n-시간: ${startTime}`
                + `\n-인원: ${personToString}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    waitingCallV2: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0048',
            message: `[${storeName}] 고객님, 입장하실 차례입니다.`
                + `\n지금 바로 입장해 주시기 바랍니다.`
                + `\n`
                + `\n*5분 이내로 입장하지 않을 경우 자동 취소가 진행될 수 있습니다.`,
            button: `{"name":"실시간 대기 확인/취소","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '대기 호출(웨이팅)',
            replaceMessage: `[${storeName}] 고객님, 입장하실 차례입니다.`
                + `\n지금 바로 입장해 주시기 바랍니다.`
                + `\n`
                + `\n*5분 이내로 입장하지 않을 경우 자동 취소가 진행될 수 있습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    packageOrderV2: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0044',
            message: `${storeName} 고객님께서 요청하신 포장 주문이 접수 완료되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"상세 내용 확인하기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '포장 주문 접수',
            replaceMessage: `${storeName} 고객님께서 요청하신 포장 주문이 접수 완료되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    receiptIssueV3: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0054',
            message: `[${storeName}] 고객님이 요청하신 전자 영수증이 발송되었습니다.`
                + `\n`
                + `\n*영수증을 확인하시려면 아래 버튼을 눌러 주세요.`
                + `\n접속 유효 기간: 발급일로부터 30일 이내`,
            button: `{"name":"영수증 확인하기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '전자영수증 발송',
            replaceMessage: `[${storeName}] 고객님이 요청하신 전자 영수증이 발송되었습니다.`
                + `\n`
                + `\n*영수증을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n접속 유효 기간 : 발급일로부터 30일 이내`
                + `\n${pageUrl}`
        };
    },
    packageCallV2: function (storeName, pageUrl) {
        const [pageUrl1, pageUrl2] = pageUrl.split(',');
        return {
            templateCode: 'SB0045',
            message: `[${storeName}] 고객님께서 주문하신 포장이 준비되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러주세요.`,
            button: `{"name":"상세 내용 확인하기","type":"WL","url_mobile":"${pageUrl1}"}, {"name":"매장 위치 확인하기","type":"WL","url_mobile":"${pageUrl2}"}`,
            replaceSubject: '포장 호출(고객 호출)',
            replaceMessage: `[${storeName}] 고객님께서 주문하신 포장이 준비되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl1}`
        };
    },
    waitingNumberV2: function (storeName, pageUrl, waitingInfo) {
        const { waitingNumber, awayCount, expectedTime } = waitingInfo;
        return {
            templateCode: 'SB0047',
            message: `[${storeName}] 대기 번호 ${waitingNumber}으로 대기 등록이 완료되었습니다.`
                + `\n`
                + `\n-대기 번호: ${waitingNumber}`
                + `\n-내 앞 대기: ${awayCount}`
                + `\n-대기 예상 시간: ${expectedTime}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"실시간 대기 확인/취소","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '대기 접수(웨이팅)',
            replaceMessage: `[${storeName}] 대기 번호 ${waitingNumber}으로 대기 등록이 완료되었습니다.`
                + `\n`
                + `\n-대기 번호: ${waitingNumber}`
                + `\n-내 앞 대기: ${awayCount}`
                + `\n-대기 예상 시간: ${expectedTime}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    orderAcceptV2: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0041',
            message: `[${storeName}] 고객님께서 요청하신 주문이 접수 완료되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"주문 상태 확인하기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '주문 접수(확인)',
            replaceMessage: `[${storeName}] 고객님께서 요청하신 주문이 접수 완료되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    orderReadyV3: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0043',
            message: `[${storeName}] 고객님께서 요청하신 주문이 준비되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러주세요.`,
            button: `{"name":"상세 내용 확인하기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '주문 호출(고객 호출)',
            replaceMessage: `[${storeName}] 고객님께서 요청하신 주문이 준비되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    cancelDealV2: function (storeName, pageUrl) {
        const [pageUrl1, pageUrl2] = pageUrl.split(',');
        return {
            templateCode: 'SB0042',
            message: `[${storeName}] 주문이 취소되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"상세 내용 확인하기","type":"WL","url_mobile":"${pageUrl1}"},{"name":"다시 주문하기","type":"WL","url_mobile":"${pageUrl2}"}`,
            replaceSubject: '주문 취소(거래 취소)',
            replaceMessage: `[${storeName}] 주문이 취소되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl1}`
        };
    },
    storeInfo: function (storeName, pageUrl, storeInfo) {
        const { address, tel, businessHours } = storeInfo;
        return {
            templateCode: 'SB0040',
            message: `[${storeName}] 고객님이 요청하신 매장 정보를 전달드립니다.`
                + `\n`
                + `\n-영업시간: ${businessHours}`
                + `\n-매장위치: ${address} `
                + `\n-문의전화: ${tel}`
                + `\n`
                + `\n*더 자세한 정보를 확인하고 싶다면 아래 버튼을 클릭하여 매장을 확인해 주세요.`,
            button: `{"name":"매장 안내 확인하기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '요청 매장 안내',
            replaceMessage: `[${storeName}] 고객님이 요청하신 매장 정보를 전달드립니다.`
                + `\n`
                + `\n-영업시간: ${businessHours}`
                + `\n-매장위치: ${address} `
                + `\n-문의전화: ${tel}`
                + `\n`
                + `\n*더 자세한 정보를 확인하고 싶다면 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    deliveryOrder: function (storeName, pageUrl) {
        return {
            templateCode: 'SB0046',
            message: `[${storeName}] 고객님께서 요청하신 배달 주문이 접수 완료되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"상세 내용 확인하기","type":"WL","url_mobile":"${pageUrl}","url_pc":"${pageUrl}"}`,
            replaceSubject: '배달 주문 접수',
            replaceMessage: `${storeName} 고객님께서 요청하신 배달 주문이 접수 완료되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    reservationNoShow: function (storeName, pageUrl, startDate) {
        return {
            templateCode: 'SB0053',
            message: `[${storeName}] 예약 시간 ${startDate}로부터 일정 시간 이상 방문하시지 않아 노쇼로 간주하여 자동적으로 예약이 취소됨을 알려 드립니다.`,
            button: `{"name":"예약 상태 확인하기","type":"WL","url_mobile":"${pageUrl}","url_pc":"${pageUrl}"}`,
            replaceSubject: '예약 취소(노쇼)',
            replaceMessage: `[${storeName}] 예약 시간 ${startDate}로부터 일정 시간 이상 방문하시지 않아 노쇼로 간주하여 자동적으로 예약이 취소됨을 알려 드립니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    reservationTomorrow: function (storeName, pageUrl, reservationInfo) {
        const { startDate, startTime, personToString } = reservationInfo;
        return {
            templateCode: 'SB0051',
            message: `[${storeName}] 내일은 예약 이용 예정일입니다.`
                + `\n예약 내용을 안내드립니다.`
                + `\n`
                + `\n[이용 예약 안내]`
                + `\n-일자: ${startDate}`
                + `\n-시간: ${startTime}`
                + `\n-인원: ${personToString}`
                + `\n`
                + `\n*피치 못할 사정으로 예약 취소를 원하실 경우 아래 버튼을 눌러 예약 취소를 진행해 주시기 바랍니다.`,
            button: `{"name":"예약 취소하기","type":"WL","url_mobile":"${pageUrl}","url_pc":"${pageUrl}"}`,
            replaceSubject: '예약 확인(매장)',
            replaceMessage: `[${storeName}] 내일은 예약 이용 예정일입니다. `
                + `\n예약 내용을 안내드립니다.`
                + `\n`
                + `\n[이용 예약 안내]`
                + `\n-일자: ${startDate}`
                + `\n-시간: ${startTime}`
                + `\n-인원: ${personToString}`
                + `\n`
                + `\n*피치 못할 사정으로 예약 취소를 원하실 경우 아래 버튼을 눌러 예약 취소를 진행해 주시기 바랍니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    completePresent: function (storeName, pageUrl, presentInfo) {
        const { targetUserName, templateName, chargeAmount, exinctionDate } = presentInfo;
        return {
            templateCode: 'SB0055',
            message: `[${storeName}] ${targetUserName}님에게 기프트카드 선물이 정상적으로 완료되었습니다.`
                + `\n`
                + `\n-상품명: ${templateName}카드 / ${chargeAmount}원`
                + `\n-유효기간: ~${exinctionDate} 까지 사용가능`
                + `\n-받는 분: ${targetUserName}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"카드 상세 보기","type":"WL","url_mobile":"${pageUrl}","url_pc":"${pageUrl}"}`,
            replaceSubject: '선물 발신 완료',
            replaceMessage: `[${storeName}] ${targetUserName}님에게 기프트카드 선물이 정상적으로 완료되었습니다.`
                + `\n`
                + `\n-상품명: ${templateName}카드 / ${chargeAmount}원`
                + `\n-유효기간: ~${exinctionDate} 까지 사용가능`
                + `\n-받는 분: ${targetUserName}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`,
        };
    },
    presentPrepaidcardV2: function (storeName, pageUrl, presentInfo) {
        const { fromUserName, targetUserName, templateName, chargeAmount, exinctionDate } = presentInfo;
        return {
            templateCode: 'SB0056',
            message: `[${storeName}] ${fromUserName}님이 기프트카드를 선물했어요!`
                + `\n받으신 선물과 메시지를 확인해 보세요.`
                + `\n`
                + `\n-상품명: ${templateName}카드 / ${chargeAmount}원`
                + `\n-유효기간: ~${exinctionDate} 까지 사용가능`
                + `\n-받는 분: ${targetUserName}`
                + `\n`
                + `\n*첫 방문이시라면 고객(본인) 인증 후 사용이 가능합니다.`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"카드 상세 보기","type":"WL","url_mobile":"${pageUrl}","url_pc":"${pageUrl}"}`,
            replaceSubject: '선물 수신',
            replaceMessage: `[${storeName}] ${fromUserName}님이 기프트카드를 선물했어요!`
                + `\n받으신 선물과 메시지를 확인해 보세요.`
                + `\n`
                + `\n상품명: ${templateName}카드 / ${chargeAmount}원`
                + `\n-유효기간: ~${exinctionDate} 까지 사용가능`
                + `\n-받는 분: ${targetUserName}`
                + `\n`
                + `\n*첫 방문이시라면 고객(본인) 인증 후 사용이 가능합니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`,
        };
    },
    cancelPresentV2: function (storeName, pageUrl, fromName) {
        return {
            templateCode: 'SB0072',
            message: `[${storeName}] ${fromName}님께 선물 받은 기프트카드가 취소 처리 되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"기프트카드 확인하기","type":"WL","url_mobile":"${pageUrl}","url_pc":"${pageUrl}"}`,
            replaceSubject: '선물 결제 취소(발신자)',
            replaceMessage: `[${storeName}] ${fromName}님께서 선물 받은 기프트카드가 취소 처리 되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`,
        };
    },
    refusePresentV2: function (storeName, pageUrl, targetUserName) {
        const [pageUrl1, pageUrl2] = pageUrl.split(',');
        return {
            templateCode: 'SB0058',
            message: `[${storeName}] ${targetUserName}님께 선물하신 기프트카드가 수신인 거절로 인해 취소 처리 되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"기프트카드 확인하기","type":"WL","url_mobile":"${pageUrl1}","url_pc":"${pageUrl1}"},{"name":"재전송하기","type":"WL","url_mobile":"${pageUrl2}","url_pc":"${pageUrl2}"}`,
            replaceSubject: '선물 거절(수신자)',
            replaceMessage: `[${storeName}] ${targetUserName}님께 선물하신 기프트카드가 수신인 거절로 인해 취소 처리 되었습니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl1}`,
        };
    },
    extinctionPresent: function (storeName, pageUrl, prepaidCardInfo) {
        const { agoExinctionDay, exinctionDate, templateName } = prepaidCardInfo;
        return {
            templateCode: 'SB0067',
            message: `[${storeName}] 고객님의 기프트카드 유효기간이 ${agoExinctionDay} 전으로 임박했습니다.`
                + `\n`
                + `\n-상품명: ${templateName}`
                + `\n-유효기간: ${exinctionDate}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"모바일 홈 바로가기","type":"WL","url_mobile":"${pageUrl}","url_pc":"${pageUrl}"}`,
            replaceSubject: '유효기간 알림',
            replaceMessage: `[${storeName}] 고객님의 기프트카드 유효기간이 ${agoExinctionDay} 전으로 임박했습니다.`
                + `\n`
                + `\n-상품명: ${templateName}`
                + `\n-유효기간: ${exinctionDate}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    termsOfServiceChange: function (storeName, pageUrl, startDate) {
        return {
            templateCode: 'SB0060',
            message: `[레츠온클라우드] 서비스 이용약관 개정 안내`
                + `\n`
                + `\n안녕하세요. 스몰비 서비스를 이용해 주셔서 감사합니다.`
                + `\n${startDate} 서비스 이용약관이 개정되어 안내드리고 있습니다.`
                + `\n`
                + `\n고객님께서는 ${storeName}을 통해서 스몰비 서비스를 이용 중입니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"이용 약관 확인하기","type":"WL","url_mobile":"${pageUrl}","url_pc":"${pageUrl}"}`,
            replaceSubject: '서비스 이용약관 변경 알림',
            replaceMessage: ` [레츠온클라우드] 서비스 이용약관 개정 안내`
                + `\n`
                + `\n안녕하세요. 스몰비 서비스를 이용해 주셔서 감사합니다.`
                + `\n${startDate} 서비스 이용약관이 개정되어 안내드리고 있습니다.`
                + `\n`
                + `\n고객님께서는 ${storeName}을 통해서 스몰비 서비스를 이용 중입니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`,
        };
    },
    privacyStatementChange: function (storeName, pageUrl, startDate) {
        return {
            templateCode: 'SB0070',
            message: `[레츠온클라우드] 개인 정보 취급 방침 개정 안내`
                + `\n`
                + `\n안녕하세요. 스몰비 서비스를 이용해 주셔서 감사합니다.`
                + `\n${startDate} 개인 정보 취급 방침이 변경되어 안내드리고 있습니다.`
                + `\n`
                + `\n고객님께서는 ${storeName}을 통해서 스몰비 서비스를 이용 중입니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"개인정보취급방침 확인하기","type":"WL","url_mobile":"${pageUrl}","url_pc":"${pageUrl}"}`,
            replaceSubject: '개인정보취급방침 변경 알림',
            replaceMessage: `[레츠온클라우드] 개인 정보 취급 방침 개정 안내`
                + `\n`
                + `\n안녕하세요. 스몰비 서비스를 이용해 주셔서 감사합니다.`
                + `\n${startDate} 개인 정보 취급 방침이 변경되어 안내드리고 있습니다.`
                + `\n`
                + `\n고객님께서는 ${storeName}을 통해서 스몰비 서비스를 이용 중입니다.`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`,
        };
    },
    marketingNotice: function (storeName, pageUrl, startDate) {
        return {
            templateCode: 'SB0064',
            message: `[레츠온클라우드] 정기적 수신 동의 확인 안내`
                + `\n`
                + `\n안녕하세요. 스몰비 서비스를 이용해 주셔서 감사합니다.`
                + `\n이 메시지는 정보통신망법에 따라 2년마다 발송되는 광고성 정보 수신 동의 확인 메시지입니다.`
                + `\n`
                + `\n-수신 동의 일자: ${startDate}`
                + `\n-최초 동의 매장: ${storeName}`
                + `\n`
                + `\n앞으로 유익한 소식과 다양한 혜택으로 찾아 뵙겠습니다.`
                + `\n`
                + `\n*메시지 수신을 원치 않는 매장이 있으시면 해당 매장의 모바일홈 약관 안내에서 수신 여부를 변경 바랍니다.`,
            button: `{"name":"약관 안내 확인하기","type":"WL","url_mobile":"${pageUrl}","url_pc":"${pageUrl}"}`,
            replaceSubject: '정기적 마케팅 수신 동의',
            replaceMessage: `[레츠온클라우드] 정기적 수신 동의 확인 안내`
                + `\n`
                + `\n 안녕하세요. 스몰비 서비스를 이용해 주셔서 감사합니다.`
                + `\n이 메시지는 정보통신망법에 따라 2년마다 발송되는 광고성 정보 수신 동의 확인 메시지입니다.`
                + `\n`
                + `\n-수신 동의 일자: ${startDate}`
                + `\n-최초 동의 매장: ${storeName}`
                + `\n`
                + `\n앞으로 유익한 소식과 다양한 혜택으로 찾아 뵙겠습니다.`
                + `\n`
                + `\n*메시지 수신을 원치 않는 매장이 있으시면 해당 매장의 모바일홈 약관 안내에서 수신 여부를 변경 바랍니다.`,
        };
    },
    lackMessage: function (storeName, pageUrl, param) {
        const { employeeName, remainMsgCount } = param;
        return {
            templateCode: 'SB0063',
            message: `[레츠온클라우드] 메시지 충전 알림`
                + `\n`
                + `\n안녕하세요, ${employeeName}님.`
                + `\n[${storeName}] 현재 알림톡 잔여 메시지가 ${remainMsgCount}건입니다.`
                + `\n메시지 수량이 부족할 경우 고객에게 정상적인 안내 메시지가 전송되지 않을 수 있습니다.`
                + `\n메시지 충전을 진행해 주시기 바랍니다.`
                + `\n`
                + `\n*스몰비 매장 '통계-마케팅' 서비스의 '메시지 충전' 항목에서 충전 가능합니다.`,
            replaceSubject: '메시지 부족 알림',
            replaceMessage: `[레츠온클라우드] 메시지 충전 알림`
                + `\n`
                + `\n안녕하세요, ${employeeName}님.`
                + `\n[${storeName}] 현재 알림톡 잔여 메시지가 ${remainMsgCount}건입니다.`
                + `\n메시지 수량이 부족할 경우 고객에게 정상적인 안내 메시지가 전송되지 않을 수 있습니다.`
                + `\n메시지 충전을 진행해 주시기 바랍니다.`
                + `\n`
                + `\n*스몰비 매장 '통계-마케팅' 서비스의 '메시지 충전' 항목에서 충전 가능합니다.`,
        };
    },
    orderAcceptV3: function (storeName, pageUrl, param) {
        const { orderTime } = param;
        return {
            templateCode: 'SB0074',
            message: `[${storeName}]`
                + `\n고객님께서 요청하신 주문이 접수 완료되었습니다.`
                + `\n■ 예상 소요 시간: ${orderTime}분`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"주문 상태 확인하기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '주문 접수(확인)',
            replaceMessage: `[${storeName}]`
                + `\n고객님께서 요청하신 주문이 접수 완료되었습니다.`
                + `\n■ 예상 소요 시간: ${orderTime}분`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`,
        };
    },
    orderAcceptV4(storeName, pageUrl, param) {
        const { payDate, payAmount, orderNumber, menus, orderTime, toPhoneNumber } = param;
        return {
            templateCode: 'SB0075',
            message: `${storeName} 고객님께서 요청하신 주문이 접수 완료되었습니다.`
                + `\n`
                + `\n■ 결제일시 : ${payDate}`
                + `\n■ 주문번호 : ${orderNumber}`
                + `\n■ 주문상품 : ${menus} `
                + `\n■ 결제금액 : ${payAmount}`
                + `\n■ 예상소요시간 : ${orderTime}분`
                + `\n■ 고객번호 : ${toPhoneNumber}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"주문 상태 확인하기","type":"WL","url_mobile":"${pageUrl}","url_pc":"${pageUrl}"}`,
            replaceSubject: '주문 접수(확인)',
            replaceMessage: `${storeName} 고객님께서 요청하신 주문이 접수 완료되었습니다.`
                + `\n`
                + `\n■ 결제일시 : ${payDate}`
                + `\n■ 주문번호 : ${orderNumber}`
                + `\n■ 주문상품 : ${menus} `
                + `\n■ 결제금액 : ${payAmount}`
                + `\n■ 예상소요시간 : ${orderTime}분`
                + `\n■ 고객번호 : ${toPhoneNumber}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    orderReadyV4: function (storeName, pageUrl, param) {
        const { orderNumber, menus } = param;
        return {
            templateCode: 'SB0077',
            message: `${storeName} 고객님께서 요청하신 주문이 준비되었습니다.`
                + `\n매장으로 오셔서 픽업해주세요.`
                + `\n`
                + `\n■ 주문번호 : ${orderNumber}`
                + `\n■ 주문상품 : ${menus}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"상세 내용 확인하기","type":"WL","url_mobile":"${pageUrl}","url_pc":"${pageUrl}"}`,
            replaceSubject: '주문 호출(고객 호출)',
            replaceMessage: `${storeName} 고객님께서 요청하신 주문이 준비되었습니다.`
                + `\n매장으로 오셔서 픽업해주세요.`
                + `\n`
                + `\n■ 주문번호 : ${orderNumber}`
                + `\n■ 주문상품 : ${menus}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    packageOrderV3: function (storeName, pageUrl, param) {
        const { payDate, payAmount, orderNumber, menus, orderTime, toPhoneNumber } = param;
        return {
            templateCode: 'SB0078',
            message: `${storeName} 고객님께서 요청하신 포장 주문이 접수 완료되었습니다.`
                + `\n`
                + `\n■ 결제일시 : ${payDate}`
                + `\n■ 주문번호 : ${orderNumber}`
                + `\n■ 주문상품 : ${menus} `
                + `\n■ 결제금액 : ${payAmount}`
                + `\n■ 예상소요시간 : ${orderTime}분`
                + `\n■ 고객번호 : ${toPhoneNumber}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"상세 내용 확인하기","type":"WL","url_mobile":"${pageUrl}"}`,
            replaceSubject: '포장 주문 접수',
            replaceMessage: `${storeName} 고객님께서 요청하신 포장 주문이 접수 완료되었습니다.`
                + `\n`
                + `\n■ 결제일시 : ${payDate}`
                + `\n■ 주문번호 : ${orderNumber}`
                + `\n■ 주문상품 : ${menus} `
                + `\n■ 결제금액 : ${payAmount}`
                + `\n■ 예상소요시간 : ${orderTime}분`
                + `\n■ 고객번호 : ${toPhoneNumber}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    packageCallV3: function (storeName, pageUrl, param) {
        const [pageUrl1, pageUrl2] = pageUrl.split(',');
        const { orderNumber, menus } = param;
        return {
            templateCode: 'SB0079',
            message: `${storeName} 고객님께서 주문하신 포장이 준비되었습니다.`
                + `\n매장으로 오셔서 픽업해주세요.`
                + `\n`
                + `\n■ 주문번호 : ${orderNumber}`
                + `\n■ 주문상품 : ${menus}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"상세 내용 확인하기","type":"WL","url_mobile":"${pageUrl1}"}, {"name":"매장 위치 확인하기","type":"WL","url_mobile":"${pageUrl2}"}`,
            replaceSubject: '포장 호출(고객 호출)',
            replaceMessage: `${storeName} 고객님께서 주문하신 포장이 준비되었습니다.`
                + `\n매장으로 오셔서 픽업해주세요.`
                + `\n`
                + `\n■ 주문번호 : ${orderNumber}`
                + `\n■ 주문상품 : ${menus}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl1}`
        };
    },
    deliveryOrderV2: function (storeName, pageUrl, param) {
        const { payDate, payAmount, orderNumber, menus, orderTime, toPhoneNumber } = param;
        return {
            templateCode: 'SB0080',
            message: `${storeName} 고객님께서 요청하신 배달 주문이 접수 완료되었습니다.`
                + `\n`
                + `\n■ 결제일시 : ${payDate}`
                + `\n■ 주문번호 : ${orderNumber}`
                + `\n■ 주문상품 : ${menus}`
                + `\n■ 결제금액 : ${payAmount}`
                + `\n■ 예상소요시간 : ${orderTime}분`
                + `\n■ 고객번호 : ${toPhoneNumber}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"상세 내용 확인하기","type":"WL","url_mobile":"${pageUrl}","url_pc":"${pageUrl}"}`,
            replaceSubject: '배달 주문 접수',
            replaceMessage: `${storeName} 고객님께서 요청하신 배달 주문이 접수 완료되었습니다.`
                + `\n`
                + `\n■ 결제일시 : ${payDate}`
                + `\n■ 주문번호 : ${orderNumber}`
                + `\n■ 주문상품 : ${menus}`
                + `\n■ 결제금액 : ${payAmount}`
                + `\n■ 예상소요시간 : ${orderTime}분`
                + `\n■ 고객번호 : ${toPhoneNumber}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl}`
        };
    },
    cancelDealV3(storeName, pageUrl, cancelInfo) {
        const { cancelDate, orderNumber, menus, cancelAmount, cancelDescp } = cancelInfo;
        const [pageUrl1, pageUrl2] = pageUrl.split(',');
        return {
            templateCode: 'SB0081',
            message: `${storeName} 주문이 취소되었습니다.`
                + `\n`
                + `\n■ 취소일시 : ${cancelDate}`
                + `\n■ 주문번호 : ${orderNumber}`
                + `\n■ 취소상품 : ${menus}`
                + `\n■ 취소금액 : ${cancelAmount}`
                + `\n■ 취소사유 : ${cancelDescp}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 버튼을 눌러 주세요.`,
            button: `{"name":"상세 내용 확인하기","type":"WL","url_mobile":"${pageUrl1}"},{"name":"다시 주문하기","type":"WL","url_mobile":"${pageUrl2}"}`,
            replaceSubject: '주문 취소(거래 취소)',
            replaceMessage: `${storeName} 주문이 취소되었습니다.`
                + `\n`
                + `\n■ 취소일시 : ${cancelDate}`
                + `\n■ 주문번호 : ${orderNumber}`
                + `\n■ 취소상품 : ${menus}`
                + `\n■ 취소금액 : ${cancelAmount}`
                + `\n`
                + `\n*상세 내용을 확인하시려면 아래 링크를 눌러주세요.`
                + `\n${pageUrl1}`
        };
    }
};
