const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://xbtnhnkwlioufpyeuyyg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidG5obmt3bGlvdWZweWV1eXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTMxMjQsImV4cCI6MjA4NTc2OTEyNH0.S-QtJpDDv096gs6u4rjGaMQvFD7LhAyZHAo8RL0L9fk'
);

async function diagnose() {
    console.log('=== DB 상태 진단 시작 ===\n');

    // 1. TEST-ORDER-02 주문 찾기
    const { data: orders, error: findErr } = await supabase
        .from('orders')
        .select('id, order_number, status')
        .eq('order_number', 'TEST-ORDER-02');

    if (findErr) {
        console.error('❌ 주문 조회 실패:', findErr.message);
        return;
    }
    if (!orders || orders.length === 0) {
        console.log('❌ TEST-ORDER-02 주문을 찾을 수 없습니다.');
        return;
    }

    const order = orders[0];
    console.log('✅ 주문 발견:', order);

    // 2. 상태 업데이트 시도
    console.log('\n--- shipped 상태로 업데이트 시도 ---');
    const { error: updateErr } = await supabase
        .from('orders')
        .update({ status: 'shipped' })
        .eq('id', order.id);

    if (updateErr) {
        console.error('❌ 업데이트 실패 (RLS 또는 기타 오류):', updateErr.message, updateErr.code);
        console.log('\n⚠️  RLS 정책 때문에 anon key로는 업데이트가 안 되고 있습니다.');
        console.log('Supabase 대시보드에서 직접 쿼리를 실행해보세요.');
    } else {
        console.log('✅ 업데이트 성공!');
        // 확인
        const { data: check } = await supabase
            .from('orders')
            .select('status')
            .eq('id', order.id)
            .single();
        console.log('최종 상태:', check?.status);
    }

    // 3. order_items 확인
    const { data: items } = await supabase
        .from('order_items')
        .select('id, quantity, shipped_quantity')
        .eq('order_id', order.id);
    console.log('\norder_items:', items);
}

diagnose();
