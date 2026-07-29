const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertFailedSubscription() {
  try {
    // 1. 기존 구독에서 유저/상품 ID 받아오기 (또는 users 조회)
    let userId;
    let productId;

    const { data: existingSubs, error: subErr } = await supabase.from('subscriptions').select('id, user_id, product_id').limit(1);
    console.log('existingSubs:', existingSubs, 'subErr:', subErr);
    if (existingSubs && existingSubs.length > 0) {
      userId = existingSubs[0].user_id;
      productId = existingSubs[0].product_id;
    } else {
      const { data: orders } = await supabase.from('orders').select('user_id').limit(1);
      const { data: orderItems } = await supabase.from('order_items').select('product_id').limit(1);
      if (orders && orders.length > 0) userId = orders[0].user_id;
      if (orderItems && orderItems.length > 0) productId = orderItems[0].product_id;
      console.log('from orders - userId:', userId, 'productId:', productId);
    }

    if (!userId || !productId) {
      console.error('유저 또는 상품 ID를 찾을 수 없습니다.');
      return;
    }

    const subNo = 'SUB' + Date.now().toString().slice(-8);
    const unitPrice = 450000;
    const totalQty = 100;
    const cycleMonths = 1;
    const totalRounds = 10;
    const qtyPerRound = 10;

    const today = new Date();
    const twoMonthsAgo = new Date(); twoMonthsAgo.setMonth(today.getMonth() - 2);
    const oneMonthAgo = new Date(); oneMonthAgo.setMonth(today.getMonth() - 1);

    // 3. 구독 메인 데이터 생성
    const { data: sub, error: insertSubErr } = await supabase
      .from('subscriptions')
      .insert({
        subscription_no: subNo,
        user_id: userId,
        product_id: productId,
        status: 'active',
        cycle_days: 30,
        cycle_months: cycleMonths,
        total_quantity: totalQty,
        total_rounds: totalRounds,
        qty_per_round: qtyPerRound,
        last_round_qty: qtyPerRound,
        current_round: 3, // 3회차 결제 실패
        unit_price: unitPrice,
        regular_unit_price: 500000,
        discount_rate: 10,
        next_billing_date: today.toISOString().split('T')[0],
        last_billing_date: oneMonthAgo.toISOString().split('T')[0],
        created_at: twoMonthsAgo.toISOString(),
      })
      .select()
      .single();

    if (insertSubErr) {
      console.error('구독 생성 실패:', insertSubErr);
      return;
    }

    console.log('생성된 구독 ID:', sub.id, subNo);

    // 4. 회차 생성 (1, 2회차 paid / 3회차 failed / 4~10회차 pending)
    const shipments = [
      {
        subscription_id: sub.id,
        round_no: 1,
        scheduled_date: twoMonthsAgo.toISOString().split('T')[0],
        quantity: 10,
        amount: unitPrice,
        status: 'paid',
        executed_at: twoMonthsAgo.toISOString(),
      },
      {
        subscription_id: sub.id,
        round_no: 2,
        scheduled_date: oneMonthAgo.toISOString().split('T')[0],
        quantity: 10,
        amount: unitPrice,
        status: 'paid',
        executed_at: oneMonthAgo.toISOString(),
      },
      {
        subscription_id: sub.id,
        round_no: 3,
        scheduled_date: today.toISOString().split('T')[0],
        quantity: 10,
        amount: unitPrice,
        status: 'failed',
        executed_at: today.toISOString(),
      },
    ];

    for (let r = 4; r <= 10; r++) {
      const futureDate = new Date();
      futureDate.setMonth(today.getMonth() + (r - 3));
      shipments.push({
        subscription_id: sub.id,
        round_no: r,
        scheduled_date: futureDate.toISOString().split('T')[0],
        quantity: 10,
        amount: unitPrice,
        status: 'pending',
        executed_at: null,
      });
    }

    const { error: shipErr } = await supabase.from('subscription_shipments').insert(shipments);
    if (shipErr) {
      console.error('스케줄 생성 실패:', shipErr);
    } else {
      console.log('✅ 2회차 결제완료 및 3회차 결제실패(카드문제) 가상 데이터 삽입 완료!');
    }
  } catch (err) {
    console.error('오류 발생:', err);
  }
}

insertFailedSubscription();
