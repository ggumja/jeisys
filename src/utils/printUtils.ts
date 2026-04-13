const maskPhone = (phone: string) => {
  if (!phone) return '010-****-****';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-****-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-***-${cleaned.slice(6)}`;
  }
  return phone; // 기타 특수한 포맷은 그대로 유지
};

export const printInvoice = (order: any, shipment: any) => {
  try {
    if (!order) {
      alert('오류: 주문 데이터가 없습니다.');
      return;
    }
    if (!shipment) {
      alert('오류: 발송 데이터가 없습니다.');
      return;
    }

    const items = shipment.items || [];
    const trackingNumbers = shipment.trackingNumber?.split(',').map((t: string) => t.trim()).filter(Boolean) || [];
    
    if (trackingNumbers.length === 0) {
      alert(`운송장 정보가 없습니다.\n(주문번호: ${order.orderNumber}, 발송ID: ${shipment.id})`);
      return;
    }

    // 전화번호 마스킹 처리
    const maskedPhone = maskPhone(order.shippingInfo?.phone || order.user?.phone || '');

    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>로젠택배 송장 출력 - ${order.orderNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
            
            body { 
              font-family: 'Noto Sans KR', sans-serif; 
              margin: 0; 
              padding: 0; 
              background: #f4f4f4; 
              padding-bottom: 50px;
            }
            
            .page { 
              width: 100mm; 
              height: 180mm; 
              margin: 10mm auto; 
              background: #fff; 
              box-sizing: border-box;
              padding: 5mm;
              border: 1px solid #ddd;
              position: relative;
              overflow: hidden;
              page-break-after: always;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }

            .logen-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #ed1c24;
              padding-bottom: 2mm;
              margin-bottom: 3mm;
            }
            .logo {
              font-size: 24px;
              font-weight: 900;
              color: #ed1c24;
              font-style: italic;
            }
            .ship-mode {
              background: #ed1c24;
              color: #fff;
              padding: 1mm 3mm;
              font-weight: bold;
              font-size: 14px;
            }

            .section-receiver {
              border: 1px solid #000;
              padding: 2mm;
              margin-bottom: 3mm;
            }
            .label { font-size: 10px; color: #666; margin-bottom: 1mm; }
            .receiver-name { font-size: 20px; font-weight: bold; margin-bottom: 1mm; }
            .receiver-phone { font-size: 14px; margin-bottom: 2mm; }
            .receiver-addr { font-size: 14px; line-height: 1.4; font-weight: 500; }

            .section-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2mm;
              margin-bottom: 3mm;
            }
            .info-box { border: 1px solid #ccc; padding: 2mm; font-size: 11px; }

            .tracking-area {
              text-align: center;
              border: 2px dashed #000;
              padding: 4mm 0;
              margin: 3mm 0;
              background: #fafafa;
            }
            .tracking-number { font-size: 22px; font-weight: bold; letter-spacing: 1px; }
            .barcode-line { height: 12mm; background: #000; margin: 2mm 5mm; }

            .notes { font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 2mm; margin-top: 3mm; }
            
            .no-print-btn {
              position: fixed;
              bottom: 20px;
              right: 20px;
              padding: 10px 20px;
              background: #21358D;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-weight: bold;
              z-index: 1000;
            }

            @media print {
              body { background: none; padding: 0; }
              .page { margin: 0; border: none; box-shadow: none; }
              .no-print-btn { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="no-print-btn" onclick="window.print()">인쇄하기 (Print)</button>
    `;

    trackingNumbers.forEach((tn: string, index: number) => {
      html += `
          <div class="page">
            <div class="logen-header">
              <div class="logo">iLOGEN</div>
              <div class="ship-mode">신용 (선불)</div>
            </div>
            
            <div class="section-receiver">
              <div class="label">받는 분 (TO)</div>
              <div class="receiver-name">${order.customerName || '고객명'} 고객님</div>
              <div class="receiver-phone">${maskedPhone}</div>
              <div class="receiver-addr">
                ${order.shippingInfo?.address || order.user?.address || '주소 정보 없음'}<br/>
                <strong>${order.shippingInfo?.addressDetail || order.user?.address_detail || ''}</strong>
              </div>
            </div>

            <div class="section-grid">
              <div class="info-box">
                <div class="label">보내는 분 (FROM)</div>
                <strong>제이시스메디칼</strong><br/>
                02-3651-3300<br/>
                서울 특별시 금천구 가산디지털1로 131
              </div>
              <div class="info-box" style="text-align: right;">
                <div class="label">주문 정보</div>
                ${order.orderNumber}<br/>
                박스: ${index + 1} / ${trackingNumbers.length}<br/>
                ${shipment.shippedAt ? new Date(shipment.shippedAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </div>
            </div>

            <div class="tracking-area">
              <div class="label">운송장 번호 (TRACKING NO.)</div>
              <div class="tracking-number">${tn}</div>
              <div class="barcode-line"></div>
              <div style="font-size: 10px; font-family: monospace;">* ${tn} *</div>
            </div>

            <div class="info-box" style="margin-bottom: 3mm;">
              <div class="label">내품명 / 메모</div>
              <div style="font-size: 13px; font-weight: bold;">
                ${items[0]?.productName || '주문 상품'} ${items.length > 1 ? `외 ${items.length - 1}건` : ''}
              </div>
              <div style="font-size: 10px; margin-top: 1mm;">${order.shippingInfo?.memo || ''}</div>
            </div>

            <div class="notes">
              * 본 송장은 시스템에서 자동 생성되었습니다.<br/>
              * 배송 문의: 로젠택배 고객센터 1588-9988
            </div>
          </div>
      `;
    });

    html += `</body></html>`;
    
    const w = window.open('', '_blank', 'width=800,height=900');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      // 폰트 로딩 대기 후 인쇄 (안전하게 1000ms)
      setTimeout(() => { 
        if (!w.closed) w.print(); 
      }, 1000);
    } else {
      alert('팝업 차단이 설정되어 있어 송장을 출력할 수 없습니다. 브라우저 설정에서 팝업을 허용해주세요.');
    }
  } catch (error) {
    console.error('Print Error:', error);
    alert('인쇄 데이터를 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
};

export const printPackingList = (order: any, shipment: any, boxCount: number = 1) => {
  if (!order || !shipment) {
    alert('출력할 데이터가 부족합니다.');
    return;
  }

  const items = shipment.items || [];
  const maskedPhone = maskPhone(order.shippingInfo?.phone || order.user?.phone || '');

  let html = `
    <html>
      <head>
        <title>패킹 리스트 (Packing List)</title>
        <style>
          body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; padding: 0; margin: 0; color: #333; }
          .page { max-width: 800px; margin: 0 auto; padding: 40px; page-break-after: always; }
          .page:last-child { page-break-after: avoid; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; font-size: 32px; letter-spacing: 2px; }
          .header p { margin: 6px 0 0; color: #666; }
          .box-badge { display: inline-block; margin-top: 10px; background: #000; color: #fff; padding: 4px 16px; font-size: 15px; font-weight: bold; letter-spacing: 1px; }
          .info-pane { display: flex; justify-content: space-between; margin-bottom: 30px; border-top: 2px solid #000; border-bottom: 1px solid #ccc; padding: 20px 0; }
          .info-group { flex: 1; }
          .info-group strong { display: inline-block; width: 80px; }
          .item-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .item-table th, .item-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .item-table th { background-color: #f4f4f5; font-weight: bold; border-top: 2px solid #000; }
          .item-table td { font-size: 14px; }
          .item-table .qty { text-align: center; font-weight: bold; }
          .sign-box { margin-bottom: 40px; border: 1px solid #000; padding: 20px; }
          .footer { text-align: center; border-top: 1px dashed #ccc; padding-top: 20px; font-size: 12px; color: #888; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
  `;

  // 박스 수량만큼 페이지 반복
  for (let boxNum = 1; boxNum <= boxCount; boxNum++) {
    let rowNum = 0;
    const itemRows = items.flatMap((item: any) => {
      rowNum++;
      const mainRow = `
        <tr>
          <td style="text-align: center;">${rowNum}</td>
          <td>${item.productName}</td>
          <td class="qty">${item.quantity}</td>
          <td class="qty">구매</td>
        </tr>
      `;

      // 추가증정상품 행
      const bonusRows = (item.bonusItems || []).map((bonus: any) => {
        rowNum++;
        return `
          <tr style="background-color: #fffbeb;">
            <td style="text-align: center; color: #92400e;">${rowNum}</td>
            <td>
              <span style="display:inline-block; background:#f59e0b; color:#fff; font-size:10px; font-weight:bold; padding:1px 6px; margin-right:6px; border-radius:2px;">증정</span>
              ${bonus.productName}
              <span style="font-size:10px; color:#78716c; margin-left:4px;">(추가증정)</span>
            </td>
            <td class="qty" style="color:#92400e;">${bonus.quantity * item.quantity}</td>
            <td class="qty" style="color:#92400e;">증정</td>
          </tr>
        `;
      }).join('');

      return mainRow + bonusRows;
    }).join('');


    html += `
      <div class="page">
        <div class="header">
          <h1>PACKING LIST</h1>
          <p>Date: ${shipment.shippedAt ? new Date(shipment.shippedAt).toLocaleString() : ''}</p>
          ${boxCount > 1 ? `<div class="box-badge">BOX ${boxNum} / ${boxCount}</div>` : ''}
        </div>

        <div class="info-pane">
          <div class="info-group">
            <div style="margin-bottom: 10px;"><strong>Order No:</strong> ${order.orderNumber}</div>
            <div><strong>Tracking:</strong> ${shipment.trackingNumber || 'N/A'}</div>
          </div>
          <div class="info-group">
            <div style="margin-bottom: 10px;"><strong>Customer:</strong> ${order.customerName} (${order.hospitalName || ''})</div>
            <div style="margin-bottom: 10px;"><strong>Contact:</strong> ${maskedPhone}</div>
            <div><strong>Address:</strong> ${order.shippingInfo?.address || order.user?.address || ''}</div>
          </div>
        </div>

        <table class="item-table">
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">No.</th>
              <th>상품명 (Product Name)</th>
              <th style="width: 80px; text-align: center;">수량 (Qty)</th>
              <th style="width: 60px; text-align: center;">구분</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="sign-box">
          <p style="margin:0 0 10px 0; font-weight:bold;">
            발송 담당자 확인란 ${boxCount > 1 ? `(BOX ${boxNum} / ${boxCount})` : ''}
          </p>
          <p style="margin:0; font-size: 14px;">위 상품을 정확하게 포장 및 검수하였음을 확인합니다. (서명: ______________ )</p>
        </div>

        <div class="footer">
          Jeisys Medical Inc.<br/>
          감사합니다.
        </div>
      </div>
    `;
  }

  html += `</body></html>`;

  const w = window.open('', '_blank', 'width=800,height=950');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  } else {
    alert('팝업 차단이 설정되어 있어 패킹리스트를 출력할 수 없습니다. 브라우저 설정에서 팝업을 허용해주세요.');
  }
};

