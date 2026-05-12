const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// .env 파일에서 Supabase 접속 정보 로드
const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.error('.env 파일에서 Supabase URL 또는 KEY를 찾을 수 없습니다.');
  process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function migratePaymentHistory() {
  console.log('결제 내역 카드 이름 마이그레이션을 시작합니다...\n');

  // 1. 신용카드로 결제된 payment_history 데이터 모두 조회
  const { data: histories, error: historyError } = await supabase
    .from('payment_history')
    .select('*')
    .eq('method', 'credit');

  if (historyError) {
    console.error('결제 내역 조회 실패:', historyError);
    return;
  }

  if (!histories || histories.length === 0) {
    console.log('마이그레이션 할 신용카드 결제 내역이 없습니다.');
    return;
  }

  console.log(`총 ${histories.length}건의 신용카드 결제 내역을 검토합니다...`);

  // 2. user_payment_methods 데이터 조회 (모든 카드 정보)
  const { data: cards, error: cardsError } = await supabase
    .from('user_payment_methods')
    .select('*');

  if (cardsError) {
    console.error('카드 정보 조회 실패:', cardsError);
    return;
  }

  let updatedCount = 0;

  for (const history of histories) {
    // 이미 업데이트 된 건지 확인
    if (history.reason && history.reason.includes(' - ') && !history.reason.endsWith(' - credit')) {
      continue;
    }

    // pg_tid가 카드 ID(uuid)일 경우를 대비하여 매칭
    const matchedCard = cards.find(c => c.id === history.pg_tid || c.billing_key === history.pg_tid);

    if (matchedCard) {
      let newReason = history.reason || '';
      
      const cardDisplayName = matchedCard.alias || `${matchedCard.card_name} (***${(matchedCard.card_number_masked || '').slice(-3)})`;

      if (history.reason === '카드분할결제 - credit') {
        newReason = `카드분할결제 - ${cardDisplayName}`;
      } else if (history.reason === '카드일부결제 (선결제)') {
        newReason = `카드일부결제 (선결제) - ${cardDisplayName}`;
      } else if (history.reason === '카드일부결제 (잔여금액 결제)') {
        newReason = `카드일부결제 (잔여금액 결제) - ${cardDisplayName}`;
      } else {
        newReason = `${history.reason} - ${cardDisplayName}`;
      }

      console.log(`[업데이트 대상] ID: ${history.id} | 기존: ${history.reason} -> 변경: ${newReason}`);

      const { error: updateError } = await supabase
        .from('payment_history')
        .update({ reason: newReason })
        .eq('id', history.id);

      if (updateError) {
        console.error(`ID ${history.id} 업데이트 실패:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`\n마이그레이션 완료: 총 ${updatedCount}건 업데이트 됨.`);
}

migratePaymentHistory();
