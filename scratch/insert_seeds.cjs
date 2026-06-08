const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env 파싱
const envPath = path.join(__dirname, '../.env');
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

async function run() {
    // 1. 더미 유저 생성
    const dummyUsers = [
        {
            user_id: 'hospital_a',
            password_hash: '1234',
            name: '김원장',
            hospital_name: '서울피부과의원',
            phone: '010-1234-5678',
            role: 'user'
        },
        {
            user_id: 'hospital_b',
            password_hash: '1234',
            name: '이원장',
            hospital_name: '강남뷰티클리닉',
            phone: '010-8765-4321',
            role: 'user'
        },
        {
            user_id: 'hospital_c',
            password_hash: '1234',
            name: '박원장',
            hospital_name: '예쁜얼굴성형외과',
            phone: '010-1111-2222',
            role: 'user'
        }
    ];

    console.log("Inserting users...");
    const { data: insertedUsers, error: userErr } = await supabase
        .from('users')
        .insert(dummyUsers)
        .select();

    if (userErr) {
        console.error("User insert error:", userErr);
        return;
    }
    console.log("Users inserted:", insertedUsers.length);

    const userA = insertedUsers.find(u => u.user_id === 'hospital_a');
    const userB = insertedUsers.find(u => u.user_id === 'hospital_b');
    const userC = insertedUsers.find(u => u.user_id === 'hospital_c');

    // 2. 더미 크레딧 생성 (user_credits)
    const now = new Date();
    const expiry30 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(); // 15일 후
    const expiry60 = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(); // 45일 후
    const expiry90 = new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000).toISOString(); // 75일 후
    const expiredDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10일 전 만료

    const dummyCredits = [
        {
            user_id: userA.id,
            equipment_type: 'POTENZA',
            amount: 10000000,
            used_amount: 3000000,
            status: 'active',
            expiry_date: expiry30,
            memo: '포텐자 프로모션 크레딧'
        },
        {
            user_id: userA.id,
            equipment_type: 'Density',
            amount: 15000000,
            used_amount: 5000000,
            status: 'active',
            expiry_date: expiry90,
            memo: '덴시티 신규 충전'
        },
        {
            user_id: userB.id,
            equipment_type: 'LINEARZ',
            amount: 5000000,
            used_amount: 4000000,
            status: 'active',
            expiry_date: expiry60,
            memo: '리니어지 보너스'
        },
        {
            user_id: userB.id,
            equipment_type: 'POTENZA',
            amount: 20000000,
            used_amount: 20000000,
            status: 'active',
            expiry_date: expiry30,
            memo: '전액 소진 테스트 건'
        },
        {
            user_id: userC.id,
            equipment_type: 'Density',
            amount: 8000000,
            used_amount: 2000000,
            status: 'active',
            expiry_date: expiry30,
            memo: '만료임박 건'
        },
        {
            user_id: userC.id,
            equipment_type: 'LINEARZ',
            amount: 3000000,
            used_amount: 1000000,
            status: 'expired',
            expiry_date: expiredDate,
            memo: '이미 만료된 크레딧'
        }
    ];

    console.log("Inserting user_credits...");
    const { data: insertedCredits, error: credErr } = await supabase
        .from('user_credits')
        .insert(dummyCredits)
        .select();

    if (credErr) {
        console.error("Credit insert error:", credErr);
        return;
    }
    console.log("Credits inserted:", insertedCredits.length);

    // 3. 더미 거래내역 생성 (credit_transactions)
    const dummyTransactions = [
        // User A
        {
            user_id: userA.id,
            amount: 10000000,
            type: 'issue',
            created_at: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            user_id: userA.id,
            amount: 3000000,
            type: 'use',
            created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            user_id: userA.id,
            amount: 15000000,
            type: 'issue',
            created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            user_id: userA.id,
            amount: 5000000,
            type: 'use',
            created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        // User B
        {
            user_id: userB.id,
            amount: 5000000,
            type: 'issue',
            created_at: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            user_id: userB.id,
            amount: 4000000,
            type: 'use',
            created_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            user_id: userB.id,
            amount: 20000000,
            type: 'issue',
            created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            user_id: userB.id,
            amount: 20000000,
            type: 'use',
            created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        // User C
        {
            user_id: userC.id,
            amount: 8000000,
            type: 'issue',
            created_at: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            user_id: userC.id,
            amount: 2000000,
            type: 'use',
            created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            user_id: userC.id,
            amount: 3000000,
            type: 'issue',
            created_at: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            user_id: userC.id,
            amount: 1000000,
            type: 'use',
            created_at: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            user_id: userC.id,
            amount: 2000000,
            type: 'expire',
            created_at: expiredDate
        }
    ];

    console.log("Inserting credit_transactions...");
    const { data: insertedTxs, error: txErr } = await supabase
        .from('credit_transactions')
        .insert(dummyTransactions)
        .select();

    if (txErr) {
        console.error("Tx insert error:", txErr);
        return;
    }
    console.log("Transactions inserted:", insertedTxs.length);
    console.log("Seeding complete successfully!");
}

run();
