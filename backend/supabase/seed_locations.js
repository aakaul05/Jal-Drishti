/**
 * Jal-Drishti — Seed Maharashtra Location Data to Supabase
 * 
 * Usage:
 *   1. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env
 *   2. Run: node backend/supabase/seed_locations.js
 * 
 * This reads maharashtra.json and inserts:
 *   - 35 districts
 *   - 358 sub-districts
 *   - 44,801 villages
 */

const fs = require('fs');
const path = require('path');

// ─── Load environment variables ───
function loadEnv() {
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex === -1) continue;
            const key = trimmed.substring(0, eqIndex).trim();
            const value = trimmed.substring(eqIndex + 1).trim();
            if (!process.env[key]) process.env[key] = value;
        }
    }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

// ─── Supabase REST API helpers ───
async function supabaseRPC(sql) {
    // Use the rpc endpoint to run raw SQL via a Postgres function
    // This won't work with anon key. Use REST API instead.
    const url = `${SUPABASE_URL}/rest/v1/rpc/`;
    // We'll use the REST API directly
}

async function supabaseInsert(table, rows) {
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(rows),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`${table} insert failed (${response.status}): ${text}`);
    }
    return response;
}

async function supabaseCount(table) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=count`;
    const response = await fetch(url, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'count=exact',
            'Range-Unit': 'items',
            'Range': '0-0',
        },
    });
    const contentRange = response.headers.get('content-range');
    if (contentRange) {
        const total = contentRange.split('/')[1];
        return parseInt(total) || 0;
    }
    return 0;
}

// ─── Generate SQL file approach (fallback if RLS blocks) ───
function generateSQLFile(districts, subdistricts, villages) {
    const sqlPath = path.resolve(__dirname, 'seed_data.sql');
    let sql = '-- Auto-generated seed data for Jal-Drishti\n';
    sql += '-- Run this in Supabase SQL Editor\n\n';

    // Districts
    sql += '-- ===== DISTRICTS (35) =====\n';
    sql += 'INSERT INTO mh_districts (district_code, district_name) VALUES\n';
    sql += districts.map(d =>
        `  (${d.district_code}, '${d.district_name.replace(/'/g, "''")}')`
    ).join(',\n');
    sql += '\nON CONFLICT (district_code) DO NOTHING;\n\n';

    // Sub-districts
    sql += '-- ===== SUB-DISTRICTS (358) =====\n';
    sql += 'INSERT INTO mh_subdistricts (subdistrict_code, subdistrict_name, district_code, district_name) VALUES\n';
    sql += subdistricts.map(s =>
        `  (${s.subdistrict_code}, '${s.subdistrict_name.replace(/'/g, "''")}', ${s.district_code}, '${s.district_name.replace(/'/g, "''")}')`
    ).join(',\n');
    sql += '\nON CONFLICT (subdistrict_code) DO NOTHING;\n\n';

    // Villages - split into chunks of 5000 for SQL Editor limits
    sql += '-- ===== VILLAGES (44,801) =====\n';
    const CHUNK = 5000;
    for (let i = 0; i < villages.length; i += CHUNK) {
        const chunk = villages.slice(i, i + CHUNK);
        sql += `-- Batch ${Math.floor(i / CHUNK) + 1}/${Math.ceil(villages.length / CHUNK)}\n`;
        sql += 'INSERT INTO mh_villages (village_code, village_name, subdistrict_code, district_code) VALUES\n';
        sql += chunk.map(v =>
            `  (${v.village_code}, '${v.village_name.replace(/'/g, "''")}', ${v.subdistrict_code}, ${v.district_code})`
        ).join(',\n');
        sql += '\nON CONFLICT (village_code) DO NOTHING;\n\n';
    }

    fs.writeFileSync(sqlPath, sql, 'utf-8');
    return sqlPath;
}

// ─── Main seed function ───
async function seed() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  Jal-Drishti — Seed Locations to Supabase  ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log('📡 Supabase URL:', SUPABASE_URL);

    // Load maharashtra.json
    const jsonPath = path.resolve(__dirname, '../../frontend/public/location/maharashtra.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ maharashtra.json not found at:', jsonPath);
        process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const rawDistricts = data.districts || [];

    console.log('📂 Loaded maharashtra.json:', rawDistricts.length, 'districts');
    console.log('');

    // Prepare data
    const districts = [];
    const subdistricts = [];
    const villages = [];

    for (const d of rawDistricts) {
        const districtCode = parseInt(d.code);
        const districtName = d.name;

        districts.push({ district_code: districtCode, district_name: districtName });

        for (const sd of (d.subDistricts || [])) {
            const subCode = parseInt(sd.code);
            subdistricts.push({
                subdistrict_code: subCode,
                subdistrict_name: sd.name,
                district_code: districtCode,
                district_name: districtName,
            });

            for (const v of (sd.villages || [])) {
                villages.push({
                    village_code: parseInt(v.id),
                    village_name: v.name,
                    subdistrict_code: subCode,
                    district_code: districtCode,
                });
            }
        }
    }

    console.log('📊 Prepared:');
    console.log('   Districts:     ', districts.length);
    console.log('   Sub-districts: ', subdistricts.length);
    console.log('   Villages:      ', villages.length);
    console.log('');

    // Try REST API first
    console.log('🔄 [1/3] Inserting districts...');
    try {
        await supabaseInsert('mh_districts', districts);
        const count = await supabaseCount('mh_districts');
        console.log('   ✅ mh_districts:', count, 'rows');
    } catch (e) {
        if (e.message.includes('row-level security') || e.message.includes('42501')) {
            console.log('   ⚠️  RLS is blocking inserts. Generating SQL file instead...');
            console.log('');
            const sqlPath = generateSQLFile(districts, subdistricts, villages);
            console.log('═══════════════════════════════════════════════');
            console.log('📄 SQL file generated:', sqlPath);
            console.log('═══════════════════════════════════════════════');
            console.log('');
            console.log('Next steps:');
            console.log('  1. Open Supabase Dashboard → SQL Editor');
            console.log('  2. Copy-paste the content of seed_data.sql');
            console.log('  3. Click "Run"');
            console.log('');
            console.log('OR add your service_role key to .env:');
            console.log('  Supabase Dashboard → Settings → API → service_role key');
            console.log('  Then set SUPABASE_SERVICE_KEY=eyJ... in .env');
            console.log('  And run this script again.');
            return;
        }
        console.error('   ❌ Districts failed:', e.message);
        return;
    }

    // Sub-districts
    console.log('🔄 [2/3] Inserting sub-districts...');
    try {
        const BATCH = 500;
        for (let i = 0; i < subdistricts.length; i += BATCH) {
            const chunk = subdistricts.slice(i, i + BATCH);
            await supabaseInsert('mh_subdistricts', chunk);
            process.stdout.write('   📦 ' + Math.min(i + BATCH, subdistricts.length) + '/' + subdistricts.length + '\r');
        }
        const count = await supabaseCount('mh_subdistricts');
        console.log('   ✅ mh_subdistricts:', count, 'rows');
    } catch (e) {
        console.error('   ❌ Sub-districts failed:', e.message);
        return;
    }

    // Villages
    console.log('🔄 [3/3] Inserting villages (44,801 rows)...');
    try {
        const BATCH = 1000;
        let inserted = 0;
        for (let i = 0; i < villages.length; i += BATCH) {
            const chunk = villages.slice(i, i + BATCH);
            await supabaseInsert('mh_villages', chunk);
            inserted += chunk.length;
            const pct = Math.round((inserted / villages.length) * 100);
            process.stdout.write('   📦 ' + inserted + '/' + villages.length + ' (' + pct + '%)\r');
        }
        console.log('');
        const count = await supabaseCount('mh_villages');
        console.log('   ✅ mh_villages:', count, 'rows');
    } catch (e) {
        console.error('   ❌ Villages failed:', e.message);
        return;
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('🎉 All location data seeded to Supabase!');
    console.log('═══════════════════════════════════════');
}

seed().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
