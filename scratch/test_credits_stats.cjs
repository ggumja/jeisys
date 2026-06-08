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

async function test() {
    const { data, error } = await supabase
        .from('users')
        .insert({})
        .select();

    console.log("Error response:", error);
    console.log("Data response:", data);
}
test();
