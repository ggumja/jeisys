export const printInvoice = (order: any, shipment: any) => {
  const trackingNumbers = shipment.trackingNumber?.split(',').map((t: string) => t.trim()) || [];
  
  let html = `
    <html>
      <head>
        <title>송장 출력</title>
        <style>
          body { font-family: 'Malgun Gothic', sans-serif; margin: 0; padding: 20px; background: #fff; }
          .page { page-break-after: always; max-width: 500px; margin: 0 auto 20px; border: 3px solid #000; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
          .barcode { text-align: center; margin: 20px 0; font-family: monospace; font-size: 24px; font-weight: bold; background: #f0f0f0; padding: 10px; }
          .info-table { w-full; border-collapse: collapse; margin-bottom: 10px; width: 100%; }
          .info-table th { text-align: left; padding: 8px; border: 1px solid #000; width: 100px; background: #f9f9f9; }
          .info-table td { padding: 8px; border: 1px solid #000; }
          .footer { margin-top: 20px; font-size: 12px; text-align: center; color: #666; }
          @media print { body { padding: 0; } .page { border: none; margin: 0; } }
        </style>
      </head>
      <body>
  `;

  trackingNumbers.forEach((tn: string, index: number) => {
    html += `
        <div class="page">
          <div class="header">
            <h1>로젠택배</h1>
            <p style="margin: 5px 0 0;">신용 (선불)</p>
          </div>
          
          <table class="info-table">
            <tr>
              <th>받는 분</th>
              <td style="font-size: 18px; font-weight: bold;">${order.customerName || '고객명'} 귀하</td>
            </tr>
            <tr>
              <th>연락처</th>
              <td>${order.shippingInfo?.phone || order.user?.phone || ''}</td>
            </tr>
            <tr>
              <th>도착지</th>
              <td>${order.shippingInfo?.address || order.user?.address || ''} ${order.shippingInfo?.addressDetail || order.user?.address_detail || ''}</td>
            </tr>
            <tr>
              <th>주문번호</th>
              <td>${order.orderNumber} ${trackingNumbers.length > 1 ? `(박스 ${index + 1}/${trackingNumbers.length})` : ''}</td>
            </tr>
            <tr>
              <th>내품명</th>
              <td>${shipment.items[0]?.productName} ${shipment.items.length > 1 ? `외 ${shipment.items.length - 1}건` : ''}</td>
            </tr>
          </table>

          <div class="barcode">
            *${tn}*<br/>
            ${tn}
          </div>

          <table class="info-table">
            <tr>
              <th>보내는 분</th>
              <td>제이시스메디칼</td>
            </tr>
            <tr>
              <th>연락처</th>
              <td>02-1234-5678</td>
            </tr>
          </table>
          <div class="footer">본 송장은 시스템 테스트 출력용입니다.</div>
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
