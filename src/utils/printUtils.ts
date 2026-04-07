export const printInvoice = (order: any, shipment: any) => {
  const trackingNumbers = shipment.trackingNumber?.split(',').map((t: string) => t.trim()) || [];
  
  let html = `
    <html>
      <head>
        <title>로젠택배 송장 출력</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
          
          body { 
            font-family: 'Noto Sans KR', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: #f4f4f4; 
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
          }

          /* Header / Logo */
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

          /* Receiver Section */
          .section-receiver {
            border: 1px solid #000;
            padding: 2mm;
            margin-bottom: 3mm;
          }
          .label { font-size: 10px; color: #666; margin-bottom: 1mm; }
          .receiver-name { font-size: 20px; font-weight: bold; margin-bottom: 1mm; }
          .receiver-phone { font-size: 14px; margin-bottom: 2mm; }
          .receiver-addr { font-size: 14px; line-height: 1.4; font-weight: 500; }

          /* Sender / Info */
          .section-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2mm;
            margin-bottom: 3mm;
          }
          .info-box { border: 1px solid #ccc; padding: 2mm; font-size: 12px; }

          /* Tracking / Barcode Area */
          .tracking-area {
            text-align: center;
            border: 2px dashed #000;
            padding: 4mm 0;
            margin: 3mm 0;
            background: #fafafa;
          }
          .tracking-number { font-size: 22px; font-weight: bold; letter-spacing: 1px; }
          .barcode-line { height: 12mm; background: #000; margin: 2mm 5mm; }

          /* Footer / Notes */
          .notes { font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 2mm; margin-top: 3mm; }
          
          @media print {
            body { background: none; }
            .page { margin: 0; border: none; }
          }
        </style>
      </head>
      <body>
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
            <div class="receiver-phone">${order.shippingInfo?.phone || order.user?.phone || '010-0000-0000'}</div>
            <div class="receiver-addr">
              ${order.shippingInfo?.address || order.user?.address || '주소 정보 없음'}<br/>
              <strong>${order.shippingInfo?.addressDetail || order.user?.address_detail || ''}</strong>
            </div>
          </div>

          <div class="section-grid">
            <div class="info-box">
              <div class="label">보내는 분 (FROM)</div>
              <strong>제이시스메디칼</strong><br/>
              02-1234-5678<br/>
              서울 특별시 강남구 테헤란로 123
            </div>
            <div class="info-box" style="text-align: right;">
              <div class="label">주문 정보</div>
              ${order.orderNumber}<br/>
              박스: ${index + 1} / ${trackingNumbers.length}<br/>
              ${new Date(shipment.shippedAt).toLocaleDateString()}
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
              ${shipment.items[0]?.productName} ${shipment.items.length > 1 ? `외 ${shipment.items.length - 1}건` : ''}
            </div>
            <div style="font-size: 11px; margin-top: 1mm;">${order.shippingInfo?.memo || ''}</div>
          </div>

          <div class="notes">
            * 본 송장은 시스템 연동 테스트용으로 출력되었습니다.<br/>
            * 배송 문의: 로젠택배 고객센터 1588-9988
          </div>
        </div>
    `;
  });

  html += `</body></html>`;
  
  const w = window.open('', '_blank', 'width=600,height=800');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  }
};

export const printPackingList = (order: any, shipment: any) => {
  let html = `
    <html>
      <head>
        <title>패킹 리스트 (Packing List)</title>
        <style>
          body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; padding: 40px; margin: 0; color: #333; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { margin: 0; font-size: 32px; letter-spacing: 2px; }
          .header p { margin: 10px 0 0; color: #666; }
          .info-pane { display: flex; justify-content: space-between; margin-bottom: 30px; border-top: 2px solid #000; border-bottom: 1px solid #ccc; padding: 20px 0; }
          .info-group { flex: 1; }
          .info-group strong { display: inline-block; width: 80px; }
          .item-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .item-table th, .item-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .item-table th { background-color: #f4f4f5; font-weight: bold; border-top: 2px solid #000; }
          .item-table td { font-size: 14px; }
          .item-table .qty { text-align: center; font-weight: bold; }
          .footer { text-align: center; border-top: 1px dashed #ccc; padding-top: 20px; font-size: 12px; color: #888; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PACKING LIST</h1>
            <p>Date: ${new Date(shipment.shippedAt).toLocaleString()}</p>
          </div>
          
          <div class="info-pane">
            <div class="info-group">
              <div style="margin-bottom: 10px;"><strong>Order No:</strong> ${order.orderNumber}</div>
              <div><strong>Tracking:</strong> ${shipment.trackingNumber || 'N/A'}</div>
            </div>
            <div class="info-group">
              <div style="margin-bottom: 10px;"><strong>Customer:</strong> ${order.customerName} (${order.hospitalName || ''})</div>
              <div><strong>Address:</strong> ${order.shippingInfo?.address || order.user?.address || ''}</div>
            </div>
          </div>

          <table class="item-table">
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">No.</th>
                <th>상품명 (Product Name)</th>
                <th style="width: 80px; text-align: center;">수량 (Qty)</th>
              </tr>
            </thead>
            <tbody>
  `;

  shipment.items.forEach((item: any, index: number) => {
    html += `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.productName}</td>
                <td class="qty">${item.quantity}</td>
              </tr>
    `;
  });

  html += `
            </tbody>
          </table>

          <div style="margin-bottom: 40px; border: 1px solid #000; padding: 20px;">
            <p style="margin:0 0 10px 0; font-weight:bold;">발송 담당자 확인란</p>
            <p style="margin:0; font-size: 14px;">위 상품을 정확하게 포장 및 검수하였음을 확인합니다. (서명: ______________ )</p>
          </div>

          <div class="footer">
            Jeisys Medical Inc.<br/>
            감사합니다.
          </div>
        </div>
      </body>
    </html>
  `;

  const w = window.open('', '_blank', 'width=800,height=900');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  }
};
