// Database Setup Script
// Run with: node deploy-database.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local');
  console.log('Get it from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filePath, name) {
  console.log(`\n📝 Executing ${name}...`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Note: Supabase JS client doesn't support multi-statement SQL execution
    // You'll need to run these in the Supabase SQL Editor or use psql
    console.log(`⚠️  Please run ${filePath} manually in Supabase SQL Editor`);
    console.log(`   Dashboard: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase.co', '')}/sql`);
    
    return false;
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Levelup-Labs Database Deployment\n');
  console.log('=' .repeat(60));
  
  console.log('\n⚠️  MANUAL SETUP REQUIRED\n');
  console.log('The Supabase JS client cannot execute multi-statement SQL.');
  console.log('Please run these SQL files in order in the Supabase SQL Editor:\n');
  
  console.log('1️⃣  supabase/database_setup.sql');
  console.log('    → Creates tables, indexes, and RLS policies');
  
  console.log('\n2️⃣  supabase/database_functions.sql');
  console.log('    → Creates stored procedures and triggers');
  
  console.log('\n3️⃣  supabase/seed_data.sql');
  console.log('    → Inserts realistic sample data');
  
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (projectRef) {
    console.log(`\n🔗 SQL Editor: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Once completed, your database will have:');
  console.log('   • 4 realistic courses (DSA, System Design, Full Stack, Python)');
  console.log('   • 18 modules with 25+ topics');
  console.log('   • 6 sample coding problems');
  console.log('   • 10 sample users with leaderboard data');
  console.log('   • Admin user: admin@levelup-labs.com');
}

main().catch(console.error);
