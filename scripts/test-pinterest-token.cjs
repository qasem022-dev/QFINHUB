#!/usr/bin/env node
// Test Pinterest token scopes
const { readFileSync } = require('fs');
const { resolve } = require('path');

// Load env
const env = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8');
env.split('\n').forEach(l => {
  const m = l.match(/^([^#=]+)=(.+)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
});

async function test() {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  console.log('Token prefix:', token ? token.substring(0, 25) + '...' : 'NOT SET');
  
  // Test 1: List boards (boards:read)
  console.log('\n1. List boards (boards:read)...');
  let r = await fetch('https://api.pinterest.com/v5/boards?page_size=3', {
    headers: { Authorization: 'Bearer ' + token }
  });
  let body = await r.text();
  console.log('   Status:', r.status);
  if (r.ok) {
    let data = JSON.parse(body);
    console.log('   Boards found:', (data.items || []).length);
    if (data.items && data.items.length > 0) {
      console.log('   First board:', data.items[0].name, '-', data.items[0].id);
    }
  } else {
    console.log('   Error:', body.substring(0, 300));
  }
  
  // Test 2: Check user account info
  console.log('\n2. User account info...');
  r = await fetch('https://api.pinterest.com/v5/user_account', {
    headers: { Authorization: 'Bearer ' + token }
  });
  body = await r.text();
  console.log('   Status:', r.status);
  if (r.ok) {
    let data = JSON.parse(body);
    console.log('   Username:', data.username);
    console.log('   Account type:', data.account_type || 'N/A');
  } else {
    console.log('   Error:', body.substring(0, 200));
  }
  
  // Test 3: See what scopes our token actually has (by checking the full 401 error)
  console.log('\n3. Try to create board (boards:write)...');
  r = await fetch('https://api.pinterest.com/v5/boards', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Test Board ' + Date.now(),
      description: 'Temporary test board',
      privacy: 'PUBLIC'
    })
  });
  body = await r.text();
  console.log('   Status:', r.status);
  console.log('   Full error:', body);
}

test().catch(e => console.error('Fatal:', e.message));
