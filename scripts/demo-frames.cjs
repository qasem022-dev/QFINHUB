#!/usr/bin/env node
// Generate Pinterest demo video frames as SVG → PNG using sharp
const { writeFileSync, mkdirSync, existsSync, readFileSync } = require('fs');
const { resolve } = require('path');
const { execSync } = require('child_process');
const { randomBytes } = require('crypto');

const OUT_DIR = '/tmp/pinterest-demo/frames';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

function esc(t) { return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function makeSlide(itemsHTML, w, h) {
  w = w || 1280; h = h || 720;
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">' +
    itemsHTML + '</svg>';
}

// ─── SLIDE 0: Title ───
function slide0() {
  return makeSlide(
    '<defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e40af"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs>' +
    '<rect width="1280" height="720" fill="url(#bg)"/>' +
    '<text x="640" y="260" text-anchor="middle" font-size="72" font-weight="800" fill="white" font-family="Arial">QFIN<span fill="#60a5fa">HUB</span></text>' +
    '<text x="640" y="310" text-anchor="middle" font-size="22" fill="rgba(255,255,255,0.85)" font-family="Arial">Auto-Pinner for Pinterest</text>' +
    '<rect x="490" y="340" width="300" height="36" rx="18" fill="rgba(255,255,255,0.2)"/>' +
    '<text x="640" y="365" text-anchor="middle" font-size="14" fill="white" font-family="Arial" font-weight="600">🚀 Standard Access Request</text>' +
    '<text x="640" y="440" text-anchor="middle" font-size="16" fill="rgba(255,255,255,0.7)" font-family="Arial">Automatically pins financial calculator infographics to Pinterest</text>' +
    '<text x="640" y="470" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.5)" font-family="Arial">124+ free calculators · 1,200+ SEO pages · 33 languages</text>' +
    '<text x="640" y="690" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.3)" font-family="Arial">QFINHUB · www.qfinhub.com</text>'
  );
}

// ─── SLIDE 1: What is QFINHUB ───
function slide1() {
  var cards = [
    {icon:'🏠',title:'Mortgages',desc:'Payment calc, affordability, refinance, FHA, VA'},
    {icon:'💰',title:'Investing',desc:'Compound interest, ROI, 401k, stocks, dividends'},
    {icon:'📊',title:'Retirement',desc:'Planning, Roth IRA, Social Security, pensions'},
    {icon:'📝',title:'Loans & Debt',desc:'Auto, student, personal loans, snowball method'},
    {icon:'🏛️',title:'Taxes',desc:'Brackets, capital gains, sales & property tax'},
    {icon:'📐',title:'Everyday',desc:'BMI, currency, salary, tips, discounts & more'},
  ];
  var cardsHTML = cards.map(function(c, i) {
    var x = 40 + (i % 3) * 410;
    var y = 320 + Math.floor(i / 3) * 170;
    return '<rect x="'+x+'" y="'+y+'" width="380" height="140" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>' +
      '<text x="'+(x+190)+'" y="'+(y+38)+'" text-anchor="middle" font-size="36">'+esc(c.icon)+'</text>' +
      '<text x="'+(x+190)+'" y="'+(y+72)+'" text-anchor="middle" font-size="18" font-weight="600" fill="white" font-family="Arial">'+esc(c.title)+'</text>' +
      '<text x="'+(x+190)+'" y="'+(y+100)+'" text-anchor="middle" font-size="13" fill="#94a3b8" font-family="Arial">'+esc(c.desc)+'</text>';
  }).join('');
  
  return makeSlide(
    '<rect width="1280" height="720" fill="#0f172a"/>' +
    '<text x="640" y="80" text-anchor="middle" font-size="36" font-weight="700" fill="white" font-family="Arial">What is QFINHUB?</text>' +
    '<text x="640" y="115" text-anchor="middle" font-size="18" fill="#94a3b8" font-family="Arial">Free online financial calculators platform with 124+ tools</text>' +
    cardsHTML +
    '<text x="640" y="700" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.2)" font-family="Arial">www.qfinhub.com · 124+ free calculators · 0 signup needed</text>'
  );
}

// ─── SLIDE 2: Authentication Flow ───
function slide2() {
  var steps = [
    {num:'1',title:'Authorize',desc:'User clicks "Connect\nwith Pinterest"'},
    {num:'2',title:'Pinterest Login',desc:'Redirect to Pinterest\nfor authorization'},
    {num:'3',title:'Callback',desc:'Pinterest sends\nauth code to us'},
    {num:'4',title:'Token',desc:'Code exchanged for\naccess + refresh tokens'},
  ];
  var stepsHTML = steps.map(function(s, i) {
    var x = 60 + i * 300;
    return '' +
      '<circle cx="'+(x+80)+'" cy="260" r="25" fill="url(#grad)"/>' +
      '<text x="'+(x+80)+'" y="268" text-anchor="middle" font-size="20" font-weight="700" fill="white" font-family="Arial">'+s.num+'</text>' +
      '<text x="'+(x+80)+'" y="310" text-anchor="middle" font-size="18" font-weight="600" fill="white" font-family="Arial">'+esc(s.title)+'</text>' +
      '<text x="'+(x+80)+'" y="340" text-anchor="middle" font-size="13" fill="#94a3b8" font-family="Arial">'+esc(s.desc)+'</text>' +
      (i < 3 ? '<text x="'+(x+175)+'" y="268" text-anchor="middle" font-size="32" fill="#6366f1">→</text>' : '');
  }).join('');
  
  return makeSlide(
    '<defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e40af"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs>' +
    '<rect width="1280" height="720" fill="#0f172a"/>' +
    '<text x="640" y="80" text-anchor="middle" font-size="32" font-weight="700" fill="white" font-family="Arial">🧩 How the App Authenticates Users</text>' +
    '<text x="640" y="115" text-anchor="middle" font-size="16" fill="#94a3b8" font-family="Arial">Standard OAuth 2.0 flow with Pinterest API</text>' +
    stepsHTML +
    '<rect x="190" y="420" width="900" height="40" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>' +
    '<text x="640" y="447" text-anchor="middle" font-size="14" fill="#94a3b8" font-family="monospace">🔗 Callback URL: https://www.qfinhub.com/api/pinterest/callback</text>' +
    '<rect x="240" y="490" width="800" height="80" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1"/>' +
    '<text x="260" y="520" font-size="15" fill="#4ade80" font-family="monospace">GET</text><text x="310" y="520" font-size="15" fill="#a5f3fc" font-family="monospace"> /api/pinterest/callback?code=AQA...&amp;state=xyz</text>' +
    '<text x="260" y="550" font-size="13" fill="#94a3b8" font-family="monospace">→ Exchanges code for tokens → stores securely</text>' +
    '<text x="640" y="700" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.2)" font-family="Arial">OAuth 2.0 · PKCE · Refresh tokens for long-lived access</text>'
  );
}

// ─── SLIDE 3: Features ───
function slide3() {
  var features = [
    {icon:'🖼️',title:'Infographic Generation',desc:'Creates beautiful financial infographic\nimages (SVG→PNG) for each calculator topic'},
    {icon:'📌',title:'Scheduled Pinning',desc:'Posts 3-5 new pins daily at optimal times\nfor maximum Pinterest engagement'},
    {icon:'📋',title:'Board Management',desc:'Creates & organizes boards by category:\nMortgages, Investing, Retirement, and more'},
    {icon:'📊',title:'Analytics Tracking',desc:'Tracks impressions, saves, and clicks\nto optimize content strategy over time'},
  ];
  var fHTML = features.map(function(f, i) {
    var x = 60 + (i % 2) * 600;
    var y = 240 + Math.floor(i / 2) * 200;
    return '<rect x="'+x+'" y="'+y+'" width="540" height="160" rx="14" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>' +
      '<text x="'+(x+30)+'" y="'+(y+55)+'" font-size="40">'+esc(f.icon)+'</text>' +
      '<text x="'+(x+110)+'" y="'+(y+50)+'" font-size="20" font-weight="600" fill="white" font-family="Arial">'+esc(f.title)+'</text>' +
      '<text x="'+(x+110)+'" y="'+(y+85)+'" font-size="14" fill="#94a3b8" font-family="Arial">'+esc(f.desc)+'</text>';
  }).join('');
  
  return makeSlide(
    '<rect width="1280" height="720" fill="#0f172a"/>' +
    '<text x="640" y="80" text-anchor="middle" font-size="36" font-weight="700" fill="white" font-family="Arial">🤖 Auto-Pinner Features</text>' +
    '<text x="640" y="115" text-anchor="middle" font-size="16" fill="#94a3b8" font-family="Arial">What the app does automatically</text>' +
    fHTML +
    '<text x="640" y="700" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.2)" font-family="Arial">100% automated · 1,000 req/day trial · scales with standard access</text>'
  );
}

// ─── SLIDE 4: Sample Pins ───
function slide4() {
  var pins = [
    {color1:'#1e40af',color2:'#3b82f6',value:'$1,969',label:'Average Monthly\nMortgage Payment'},
    {color1:'#059669',color2:'#10b981',value:'$76,122',label:'$10K invested at 7%\nfor 30 years'},
    {color1:'#dc2626',color2:'#f43f5e',value:'36 mo',label:'Debt Free with\nSnowball Method'},
  ];
  var pinsHTML = pins.map(function(p, i) {
    var x = 60 + i * 410;
    var defs = '<linearGradient id="pg'+i+'" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="'+p.color1+'"/><stop offset="100%" stop-color="'+p.color2+'"/></linearGradient>';
    var lines = p.label.split('\n');
    var labelsHTML = lines.map(function(l, li) {
      return '<text x="'+(x+170)+'" y="'+(340+li*22)+'" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.75)" font-family="Arial">'+esc(l)+'</text>';
    }).join('');
    return defs +
      '<rect x="'+x+'" y="200" width="340" height="400" rx="20" fill="url(#pg'+i+')"/>' +
      '<text x="'+(x+170)+'" y="310" text-anchor="middle" font-size="48" font-weight="800" fill="white" font-family="Arial">'+p.value+'</text>' +
      labelsHTML +
      '<rect x="'+(x+80)+'" y="410" width="180" height="30" rx="15" fill="rgba(255,255,255,0.15)"/>' +
      '<text x="'+(x+170)+'" y="430" text-anchor="middle" font-size="12" fill="white" font-family="Arial" font-weight="600">QFINHUB</text>';
  }).join('');
  
  return makeSlide(
    '<rect width="1280" height="720" fill="#0f172a"/>' +
    pinsHTML +
    '<text x="640" y="80" text-anchor="middle" font-size="36" font-weight="700" fill="white" font-family="Arial">📸 Sample Pins</text>' +
    '<text x="640" y="115" text-anchor="middle" font-size="16" fill="#94a3b8" font-family="Arial">Engaging financial infographics optimized for Pinterest</text>' +
    '<text x="640" y="700" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.2)" font-family="Arial">85 pin templates ready · Rotating across 8 categories</text>'
  );
}

// ─── SLIDE 5: Architecture ───
function slide5() {
  var stats = [
    {val:'5',label:'Pins/Day'},
    {val:'8',label:'Boards'},
    {val:'85',label:'Pin Templates'},
    {val:'24/7',label:'Automation'},
  ];
  var statsHTML = stats.map(function(s, i) {
    var x = 160 + i * 260;
    return '<text x="'+x+'" y="200" text-anchor="middle" font-size="48" font-weight="800" fill="#60a5fa" font-family="Arial">'+s.val+'</text>' +
      '<text x="'+x+'" y="225" text-anchor="middle" font-size="14" fill="#94a3b8" font-family="Arial">'+s.label+'</text>';
  }).join('');
  
  return makeSlide(
    '<rect width="1280" height="720" fill="#0f172a"/>' +
    '<text x="640" y="80" text-anchor="middle" font-size="36" font-weight="700" fill="white" font-family="Arial">⚙️ Technical Architecture</text>' +
    '<text x="640" y="115" text-anchor="middle" font-size="16" fill="#94a3b8" font-family="Arial">Built on Node.js with Pinterest API v5</text>' +
    statsHTML +
    '<rect x="190" y="280" width="900" height="100" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>' +
    '<text x="210" y="315" font-size="14" fill="#fbbf24" font-family="monospace">scripts/post-pinterest.cjs</text><text x="490" y="315" font-size="14" fill="#a5f3fc" font-family="monospace"> — Auto-pinner engine</text>' +
    '<text x="210" y="340" font-size="14" fill="#fbbf24" font-family="monospace">scripts/pinterest-content.cjs</text><text x="510" y="340" font-size="14" fill="#a5f3fc" font-family="monospace"> — Content & image generator</text>' +
    '<text x="210" y="365" font-size="14" fill="#fbbf24" font-family="monospace">src/lib/pinterest/client.ts</text><text x="470" y="365" font-size="14" fill="#a5f3fc" font-family="monospace"> — API client library</text>' +
    // Tags
    '<rect x="160" y="420" width="auto" height="28" rx="12" fill="rgba(99,102,241,0.25)"/>' +
    '<text x="170" y="440" font-size="12" fill="#a5b4fc" font-family="Arial" font-weight="600">Node.js</text>' +
    '<text x="260" y="440" font-size="12" fill="#a5b4fc" font-family="Arial" font-weight="600">   Pinterest API v5</text>' +
    '<text x="430" y="440" font-size="12" fill="#a5b4fc" font-family="Arial" font-weight="600">   OAuth 2.0</text>' +
    '<text x="550" y="440" font-size="12" fill="#a5b4fc" font-family="Arial" font-weight="600">   Sharp (SVG→PNG)</text>' +
    '<text x="720" y="440" font-size="12" fill="#a5b4fc" font-family="Arial" font-weight="600">   Vercel</text>' +
    '<text x="640" y="700" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.2)" font-family="Arial">Open source · Privacy-first · No user data stored</text>'
  );
}

// ─── SLIDE 6: Thank You ───
function slide6() {
  return makeSlide(
    '<defs><linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e40af"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient></defs>' +
    '<rect width="1280" height="720" fill="url(#bg2)"/>' +
    '<text x="640" y="200" text-anchor="middle" font-size="56" font-weight="800" fill="white" font-family="Arial">QFIN<span fill="#60a5fa">HUB</span></text>' +
    '<text x="640" y="260" text-anchor="middle" font-size="32" font-weight="700" fill="white" font-family="Arial">Requesting Standard Access</text>' +
    '<text x="640" y="300" text-anchor="middle" font-size="16" fill="rgba(255,255,255,0.8)" font-family="Arial">To automatically share financial calculator infographics with Pinterest</text>' +
    // Stats
    '<text x="200" y="420" text-anchor="middle" font-size="48" font-weight="800" fill="white" font-family="Arial">124+</text>' +
    '<text x="200" y="450" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.6)" font-family="Arial">Calculators</text>' +
    '<text x="460" y="420" text-anchor="middle" font-size="48" font-weight="800" fill="white" font-family="Arial">1,200+</text>' +
    '<text x="460" y="450" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.6)" font-family="Arial">SEO Pages</text>' +
    '<text x="720" y="420" text-anchor="middle" font-size="48" font-weight="800" fill="white" font-family="Arial">33</text>' +
    '<text x="720" y="450" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.6)" font-family="Arial">Languages</text>' +
    '<text x="980" y="420" text-anchor="middle" font-size="48" font-weight="800" fill="white" font-family="Arial">100%</text>' +
    '<text x="980" y="450" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.6)" font-family="Arial">Free</text>' +
    '<text x="640" y="550" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.5)" font-family="Arial">Contact: q.finhub@gmail.com</text>' +
    '<text x="640" y="690" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.3)" font-family="Arial">Thank you for reviewing our application 🙏</text>'
  );
}

// ─── Render all slides ───
async function main() {
  var sharp = require('sharp');
  var slides = [slide0, slide1, slide2, slide3, slide4, slide5, slide6];
  
  for (var i = 0; i < slides.length; i++) {
    var svg = slides[i]();
    var outPath = resolve(OUT_DIR, 'slide-' + String(i).padStart(2, '0') + '.png');
    console.log('Rendering slide ' + (i + 1) + '/' + slides.length + '...');
    await sharp(Buffer.from(svg))
      .resize(1280, 720)
      .png()
      .toFile(outPath);
    console.log('  Saved: ' + outPath);
  }
  
  console.log('\n✅ All ' + slides.length + ' slides rendered!');
}

main().catch(function(err) {
  console.error('Error:', err);
  process.exit(1);
});
