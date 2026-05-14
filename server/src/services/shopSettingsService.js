const dotenv = require('dotenv');
const path = require('path');
// root 폴더의 .env 도 읽어오기 위해 시도
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config(); // 현재 폴더(server/.env)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

let cache = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5분 캐시

/**
 * 프론트엔드와 공유하는 Supabase shop_settings 테이블에서 설정을 읽어옵니다.
 */
async function getShopSettings() {
    const now = Date.now();
    if (cache && (now - lastFetchTime < CACHE_TTL)) {
        return cache;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Returning empty settings.');
        return {};
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/shop_settings?select=key,value`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch shop settings from Supabase:', response.status, response.statusText);
            return cache || {};
        }

        const data = await response.json();
        const settings = {};
        for (const row of data) {
            settings[row.key] = row.value;
        }

        cache = settings;
        lastFetchTime = now;
        return settings;
    } catch (error) {
        console.error('Error fetching shop settings:', error);
        return cache || {};
    }
}

module.exports = {
    getShopSettings
};
