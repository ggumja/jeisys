const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://xbtnhnkwlioufpyeuyyg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidG5obmt3bGlvdWZweWV1eXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTMxMjQsImV4cCI6MjA4NTc2OTEyNH0.S-QtJpDDv096gs6u4rjGaMQvFD7LhAyZHAo8RL0L9fk'
);

async function findAndFix() {
    console.log('--- DB 검색 및 업데이트 시작 ---');
    
    // 1. 주문 번호로 주문 ID 찾기 (id가 uuid일 수 있으므로 다시 확인)
    const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('id, order_number, status')
        .eq('order_number', 'DUM-578128')
        .limit(1);
    
    if (orderErr || !order || order.length === 0) {
        console.error('주문을 찾을 수 없습니다. 다시 한 번 주문번호 확인이 필요합니다:', orderErr);
        // 혹시 모르니 모든 주문 번호 일부 출력
        const { data: all } = await supabase.from('orders').select('order_number').limit(5);
        console.log('현재 DB에 있는 샘플 주문번호들:', all.map(a => a.order_number));
        return;
    }

    const targetOrder = order[0];
    console.log('주문 정보 발견:', targetOrder);

    // 2. 주문 상태를 'shipped'로 확실히 변경
    const { error: updateOrderErr } = await supabase
        .from('orders')
        .update({ status: 'shipped' })
        .eq('id', targetOrder.id);
    
    if (updateOrderErr) console.error('주문 상태 업데이트 실패:', updateOrderErr);
    else console.log('✅ 주문 상태 업데이트 완료 (shipped)');

    // 3. 해당 주문의 모든 배송 이력(shipments)에 대해 is_partial을 false로 변경
    const { error: updateShipmentErr } = await supabase
        .from('shipments')
        .update({ is_partial: false })
        .eq('order_id', targetOrder.id);
    
    if (updateShipmentErr) console.error('배송 이력 업데이트 실패:', updateShipmentErr);
    else console.log('✅ 배송 이력 업데이트 완료 (is_partial=false)');

    // 4. 최종 확인
    const { data: check } = await supabase.from('orders').select('status').eq('id', targetOrder.id).single();
    console.log('최종 확인 주문 상태:', check.status);
}

findAndFix();
