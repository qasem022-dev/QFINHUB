#!/usr/bin/env node
/**
 * QFINHUB Premium Pinterest Pin Creator
 * 
 * Creates 6 high-quality pins based on Gemini's design concepts:
 * 1. Mortgage Payoff — Bar chart comparison (dark/cream split)
 * 2. Compound Interest — Green wealth curve graph on charcoal
 * 3. Retirement Nest Egg — Circular progress ring on sage
 * 4. Debt Snowball — Descending bars waterfall (blue/gold)
 * 5. Tax Savings — Receipt/invoice style (white)
 * 6. 50/30/20 Budget — Pie chart (terracotta/slate/sand)
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { resolve } = require("path");
const { randomBytes } = require("crypto");

const PROJECT_ROOT = resolve(__dirname, "..");
const PUBLIC_DIR = resolve(PROJECT_ROOT, "public", "pinterest-images");
if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });

// ─── Core function: generate a unique SVG for each pin ───

function pin1_MortgagePayoff() {
  const W = 1000, H = 1500;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgDark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1a1d23"/>
      <stop offset="60%" stop-color="#1a1d23"/>
      <stop offset="100%" stop-color="#2d2f36"/>
    </linearGradient>
    <linearGradient id="barGreen" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <linearGradient id="barRed" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#f87171"/>
    </linearGradient>
    <linearGradient id="barGold" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- Dark top section (60%) -->
  <rect x="0" y="0" width="${W}" height="900" fill="url(#bgDark)"/>
  <!-- QFINHUB logo -->
  <text x="50" y="60" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="700" fill="#6366f1" letter-spacing="2">QFINHUB</text>
  <!-- Headline -->
  <text x="60" y="160" font-family="Playfair Display, Georgia, serif" font-size="42" font-weight="700" fill="#ffffff">Save $50,000 on Your</text>
  <text x="60" y="215" font-family="Playfair Display, Georgia, serif" font-size="42" font-weight="700" fill="#ffffff" letter-spacing="-0.5">Mortgage Interest</text>
  <text x="60" y="260" font-family="Inter, system-ui, sans-serif" font-size="18" fill="#9ca3af">Extra payments can slash your interest costs</text>
  <!-- Bar Chart: Interest Paid vs Principal -->
  <text x="130" y="320" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#6b7280">WITHOUT EXTRA PAYMENTS</text>
  <rect x="130" y="330" width="340" height="260" rx="8" fill="#2d2f36"/>
  <rect x="150" y="380" width="70" height="190" rx="4" fill="url(#barRed)" opacity="0.9"/>
  <rect x="240" y="430" width="70" height="140" rx="4" fill="url(#barGreen)" opacity="0.9"/>
  <rect x="330" y="480" width="70" height="90" rx="4" fill="url(#barGold)" opacity="0.9"/>
  <text x="185" y="590" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#f87171" text-anchor="middle">Interest</text>
  <text x="275" y="590" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#34d399" text-anchor="middle">Principal</text>
  <text x="365" y="590" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#fbbf24" text-anchor="middle">Fees</text>
  <!-- WITH EXTRA -->
  <text x="530" y="320" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#6b7280">WITH \$200/MO EXTRA</text>
  <rect x="530" y="330" width="340" height="260" rx="8" fill="#2d2f36"/>
  <rect x="550" y="460" width="70" height="110" rx="4" fill="url(#barGreen)" opacity="0.9"/>
  <rect x="640" y="510" width="70" height="60" rx="4" fill="url(#barGold)" opacity="0.9"/>
  <rect x="730" y="470" width="70" height="100" rx="4" fill="url(#barGreen)" opacity="0.9"/>
  <text x="585" y="590" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#34d399" text-anchor="middle">Equity</text>
  <text x="675" y="590" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#fbbf24" text-anchor="middle">Saved</text>
  <text x="765" y="590" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#34d399" text-anchor="middle">Growth</text>
  <!-- Savings highlight -->
  <rect x="130" y="620" width="740" height="50" rx="25" fill="#065f46" opacity="0.6"/>
  <text x="500" y="651" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="700" fill="#34d399" text-anchor="middle">⚡ You could save \$50,000+ and pay off 5 years early</text>
  <!-- Bottom cream section -->
  <rect x="0" y="900" width="${W}" height="600" fill="#f9f7f2"/>
  <text x="500" y="980" font-family="Inter, system-ui, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">How much could YOU save?</text>
  <!-- Mock calculator input -->
  <rect x="250" y="1020" width="500" height="60" rx="12" fill="#ffffff" stroke="#d1d5db" stroke-width="1"/>
  <text x="500" y="1057" font-family="Inter, system-ui, sans-serif" font-size="16" fill="#374151" text-anchor="middle">Enter your loan balance...</text>
  <!-- CTA Button -->
  <rect x="300" y="1110" width="400" height="56" rx="28" fill="#0f766e"/>
  <text x="500" y="1144" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">Calculate Your Savings →</text>
  <!-- Features -->
  <rect x="180" y="1200" width="200" height="40" rx="8" fill="#e5e7eb" opacity="0.6"/>
  <text x="280" y="1225" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#374151" text-anchor="middle">✓ No Signup</text>
  <rect x="400" y="1200" width="200" height="40" rx="8" fill="#e5e7eb" opacity="0.6"/>
  <text x="500" y="1225" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#374151" text-anchor="middle">✓ Free Forever</text>
  <rect x="620" y="1200" width="200" height="40" rx="8" fill="#e5e7eb" opacity="0.6"/>
  <text x="720" y="1225" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#374151" text-anchor="middle">✓ 30 Seconds</text>
  <!-- Hashtags -->
  <text x="500" y="1290" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">#MortgageTips #HomeOwnership #DebtFree</text>
  <!-- URL -->
  <text x="500" y="1330" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" fill="#0f766e" text-anchor="middle">qfinhub.com/calculators/mortgage-payoff</text>
  <!-- Bottom dots -->
  <g opacity="0.3">${Array.from({length:10}).map((_,i)=>`<circle cx="${100*i+50}" cy="1430" r="3" fill="#0f766e"/>`).join("")}</g>
</svg>`;
}

function pin2_CompoundInterest() {
  const W=1000,H=1500;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="spotlight" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="rgba(16,185,129,0.12)"/>
      <stop offset="100%" stop-color="rgba(16,185,129,0)"/>
    </radialGradient>
    <linearGradient id="curveGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="40%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#6ee7b7"/>
    </linearGradient>
    <filter id="glowGreen">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- Deep charcoal background -->
  <rect width="${W}" height="${H}" fill="#1a1a1a"/>
  <rect width="${W}" height="${H}" fill="url(#spotlight)"/>
  <!-- QFINHUB -->
  <text x="50" y="60" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="700" fill="#6366f1" letter-spacing="2">QFINHUB</text>
  <!-- Headline -->
  <text x="500" y="150" font-family="Inter, system-ui, sans-serif" font-size="16" fill="#6ee7b7" text-anchor="middle" font-weight="600">THE COMPOUND EFFECT</text>
  <text x="500" y="210" font-family="Playfair Display, Georgia, serif" font-size="44" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="-0.5">Turn \$500/mo into</text>
  <text x="500" y="270" font-family="Playfair Display, Georgia, serif" font-size="44" font-weight="700" fill="#6ee7b7" text-anchor="middle">\$1 Million+</text>
  <!-- Wealth curve graph -->
  <!-- Y-axis -->
  <line x1="100" y1="600" x2="900" y2="600" stroke="#374151" stroke-width="1"/>
  <!-- X-axis growth line (exponential curve) -->
  <path d="M 100 590 Q 200 580, 300 560 Q 400 520, 500 450 Q 600 350, 700 220 Q 750 150, 800 100" stroke="url(#curveGrad)" stroke-width="5" fill="none" filter="url(#glowGreen)"/>
  <!-- Grid lines -->
  <line x1="100" y1="400" x2="880" y2="400" stroke="#374151" stroke-width="0.5" stroke-dasharray="4,4"/>
  <line x1="100" y1="200" x2="880" y2="200" stroke="#374151" stroke-width="0.5" stroke-dasharray="4,4"/>
  <!-- Y-axis labels -->
  <text x="85" y="604" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#6b7280" text-anchor="end">\$0</text>
  <text x="85" y="404" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#6b7280" text-anchor="end">\$500k</text>
  <text x="85" y="204" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#6b7280" text-anchor="end">\$1M</text>
  <!-- Year markers -->
  <text x="100" y="625" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#6b7280" text-anchor="middle">0y</text>
  <text x="300" y="625" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#6b7280" text-anchor="middle">10y</text>
  <text x="500" y="625" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#6b7280" text-anchor="middle">20y</text>
  <text x="700" y="625" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#6b7280" text-anchor="middle">30y</text>
  <!-- Highlight fade fill under curve -->
  <path d="M 100 590 Q 200 580, 300 560 Q 400 520, 500 450 Q 600 350, 700 220 Q 750 150, 800 100 L 800 600 Z" fill="url(#curveGrad)" opacity="0.08"/>
  <!-- Callout box -->
  <rect x="180" y="660" width="640" height="70" rx="12" fill="#2d2f36" stroke="#374151" stroke-width="1"/>
  <text x="500" y="693" font-family="Inter, system-ui, sans-serif" font-size="15" fill="#d1d5db" text-anchor="middle">The earlier you start, the steeper the curve grows.</text>
  <text x="500" y="715" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#6ee7b7" text-anchor="middle">Time is your biggest advantage.</text>
  <!-- Bottom section -->
  <rect x="0" y="780" width="${W}" height="720" fill="#f9f7f2"/>
  <!-- CTA Button -->
  <rect x="250" y="850" width="500" height="60" rx="30" fill="#059669"/>
  <text x="500" y="887" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">See Your Wealth Curve →</text>
  <!-- How it works steps -->
  <rect x="80" y="950" width="260" height="160" rx="12" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
  <text x="210" y="1000" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="800" fill="#059669" text-anchor="middle">1</text>
  <text x="210" y="1030" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#1f2937" text-anchor="middle">Enter Your Amount</text>
  <text x="210" y="1055" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#6b7280" text-anchor="middle">How much can you invest</text>
  <text x="210" y="1072" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#6b7280" text-anchor="middle">each month?</text>
  <rect x="370" y="950" width="260" height="160" rx="12" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
  <text x="500" y="1000" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="800" fill="#059669" text-anchor="middle">2</text>
  <text x="500" y="1030" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#1f2937" text-anchor="middle">Set Time Horizon</text>
  <text x="500" y="1055" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#6b7280" text-anchor="middle">Choose your investment</text>
  <text x="500" y="1072" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#6b7280" text-anchor="middle">timeline</text>
  <rect x="660" y="950" width="260" height="160" rx="12" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
  <text x="790" y="1000" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="800" fill="#059669" text-anchor="middle">3</text>
  <text x="790" y="1030" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#1f2937" text-anchor="middle">See Your Future</text>
  <text x="790" y="1055" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#6b7280" text-anchor="middle">Watch your money grow</text>
  <text x="790" y="1072" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#6b7280" text-anchor="middle">in real-time</text>
  <!-- Features -->
  <rect x="180" y="1150" width="200" height="36" rx="8" fill="#e5e7eb" opacity="0.6"/>
  <text x="280" y="1173" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ No Account Needed</text>
  <rect x="400" y="1150" width="200" height="36" rx="8" fill="#e5e7eb" opacity="0.6"/>
  <text x="500" y="1173" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ 100% Free</text>
  <rect x="620" y="1150" width="200" height="36" rx="8" fill="#e5e7eb" opacity="0.6"/>
  <text x="720" y="1173" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ Interactive Charts</text>
  <!-- Hashtags -->
  <text x="500" y="1230" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">#Investing #WealthBuilding #FinanceTips</text>
  <text x="500" y="1270" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" fill="#059669" text-anchor="middle">qfinhub.com/calculators/compound-interest</text>
  ${Array.from({length:10}).map((_,i)=>`<circle cx="${100*i+50}" cy="1430" r="3" fill="#059669" opacity="0.3"/>`).join("")}
</svg>`;
}

function pin3_RetirementProgress() {
  const W=1000,H=1500;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
  </defs>
  <!-- Sage green background -->
  <rect width="${W}" height="${H}" fill="#e8f5e9"/>
  <!-- QFINHUB watermark -->
  <text x="500" y="1400" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#a7d8a8" text-anchor="middle" opacity="0.5">QFINHUB</text>
  <!-- Brand -->
  <text x="50" y="60" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="700" fill="#065f46" letter-spacing="2">QFINHUB</text>
  <!-- Headline -->
  <text x="500" y="140" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="600" fill="#065f46" text-anchor="middle" letter-spacing="1">YOUR RETIREMENT CHECKUP</text>
  <text x="500" y="200" font-family="Playfair Display, Georgia, serif" font-size="40" font-weight="700" fill="#1f2937" text-anchor="middle">Is Your Retirement</text>
  <text x="500" y="250" font-family="Playfair Display, Georgia, serif" font-size="40" font-weight="700" fill="#065f46" text-anchor="middle">Fund Enough?</text>
  <!-- Progress Ring visualization -->
  <circle cx="500" cy="480" r="180" fill="none" stroke="#c6e6c7" stroke-width="20"/>
  <!-- Progress arc: 65% (234 degrees of 360) -->
  <path d="M 500 300 A 180 180 0 0 1 774.8 417.3" fill="none" stroke="url(#ringGrad)" stroke-width="20" stroke-linecap="round"/>
  <!-- Center text -->
  <text x="500" y="460" font-family="Inter, system-ui, sans-serif" font-size="52" font-weight="800" fill="#065f46" text-anchor="middle">65%</text>
  <text x="500" y="490" font-family="Inter, system-ui, sans-serif" font-size="15" fill="#6b7280" text-anchor="middle">of your goal funded</text>
  <!-- Target callout -->
  <rect x="250" y="580" width="500" height="50" rx="25" fill="#ffffff" opacity="0.7"/>
  <text x="500" y="610" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="600" fill="#374151" text-anchor="middle">You need an additional \$350/month to reach 100%</text>
  <!-- Bottom white card -->
  <rect x="60" y="680" width="880" height="320" rx="20" fill="#ffffff" opacity="0.85"/>
  <text x="500" y="730" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" fill="#1f2937" text-anchor="middle">Your Retirement Snapshot</text>
  <!-- Mini stats -->
  <rect x="100" y="770" width="370" height="90" rx="12" fill="#f0fdf4"/>
  <text x="285" y="810" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#374151" text-anchor="middle">Current Savings</text>
  <text x="285" y="840" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="800" fill="#065f46" text-anchor="middle">\$280,000</text>
  <rect x="530" y="770" width="370" height="90" rx="12" fill="#f0fdf4"/>
  <text x="715" y="810" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#374151" text-anchor="middle">Goal at 65</text>
  <text x="715" y="840" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="800" fill="#065f46" text-anchor="middle">\$1,200,000</text>
  <!-- CTA -->
  <rect x="200" y="920" width="600" height="60" rx="30" fill="#065f46"/>
  <text x="500" y="957" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">Find Your Retirement Number →</text>
  <!-- Footer features -->
  <rect x="180" y="1030" width="200" height="36" rx="8" fill="#ffffff" opacity="0.7"/>
  <text x="280" y="1053" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ 401k &amp; IRA</text>
  <rect x="400" y="1030" width="200" height="36" rx="8" fill="#ffffff" opacity="0.7"/>
  <text x="500" y="1053" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ Social Security</text>
  <rect x="620" y="1030" width="200" height="36" rx="8" fill="#ffffff" opacity="0.7"/>
  <text x="720" y="1053" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ Pension Plans</text>
  <!-- Hashtags -->
  <text x="500" y="1110" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#6b7280" text-anchor="middle">#RetirementPlanning #FinancialFreedom #MoneyGoals</text>
  <text x="500" y="1150" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" fill="#065f46" text-anchor="middle">qfinhub.com/calculators/retirement-planning</text>
  ${Array.from({length:10}).map((_,i)=>`<circle cx="${100*i+50}" cy="1420" r="3" fill="#065f46" opacity="0.2"/>`).join("")}
</svg>`;
}

function pin4_DebtSnowball() {
  const W=1000,H=1500;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="debtWaterfall" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e3a5f"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <filter id="shadowSoft"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.15)"/></filter>
  </defs>
  <!-- Dark blue background -->
  <rect width="${W}" height="${H}" fill="url(#debtWaterfall)"/>
  <!-- QFINHUB -->
  <text x="50" y="60" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="700" fill="#60a5fa" letter-spacing="2">QFINHUB</text>
  <!-- Headline -->
  <text x="500" y="150" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="600" fill="#60a5fa" text-anchor="middle" letter-spacing="1">THE SNOWBALL METHOD</text>
  <text x="500" y="215" font-family="Playfair Display, Georgia, serif" font-size="42" font-weight="700" fill="#ffffff" text-anchor="middle">Debt-Free in</text>
  <text x="500" y="270" font-family="Playfair Display, Georgia, serif" font-size="42" font-weight="700" fill="#fbbf24" text-anchor="middle">24 Months?</text>
  <text x="500" y="310" font-family="Inter, system-ui, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">Here's the exact plan to make it happen.</text>
  <!-- Waterfall bars -->
  <rect x="200" y="370" width="120" height="280" rx="6" fill="#3b82f6" opacity="0.5" filter="url(#shadowSoft)"/>
  <rect x="340" y="420" width="120" height="230" rx="6" fill="#2563eb" opacity="0.55" filter="url(#shadowSoft)"/>
  <rect x="480" y="480" width="120" height="170" rx="6" fill="#1d4ed8" opacity="0.6" filter="url(#shadowSoft)"/>
  <rect x="620" y="530" width="120" height="120" rx="6" fill="#1e40af" opacity="0.65" filter="url(#shadowSoft)"/>
  <rect x="760" y="580" width="60" height="70" rx="6" fill="#fbbf24" opacity="0.9" filter="url(#shadowSoft)"/>
  <!-- Labels -->
  <text x="260" y="680" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#93c5fd" text-anchor="middle">Card 1</text>
  <text x="400" y="680" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#93c5fd" text-anchor="middle">Card 2</text>
  <text x="540" y="680" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#93c5fd" text-anchor="middle">Car Loan</text>
  <text x="680" y="680" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#93c5fd" text-anchor="middle">Student</text>
  <text x="790" y="680" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#fbbf24" text-anchor="middle">★ Last</text>
  <!-- Callout -->
  <rect x="150" y="720" width="700" height="50" rx="25" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1" opacity="0.5"/>
  <text x="500" y="750" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#93c5fd" text-anchor="middle">Smallest balance first → builds momentum → kills debt faster</text>
  <!-- Bottom info -->
  <rect x="0" y="820" width="${W}" height="680" fill="#f8fafc"/>
  <!-- Steps -->
  <text x="500" y="880" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="700" fill="#1f2937" text-anchor="middle">How the Debt Snowball Works</text>
  <rect x="80" y="920" width="380" height="130" rx="14" fill="#ffffff" stroke="#e5e7eb" stroke-width="1" filter="url(#shadowSoft)"/>
  <text x="100" y="960" font-family="Inter, system-ui, sans-serif" font-size="32" font-weight="800" fill="#2563eb">1</text>
  <text x="270" y="960" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="600" fill="#1f2937">List Your Debts</text>
  <text x="270" y="985" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#6b7280">Sort from smallest to</text>
  <text x="270" y="1005" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#6b7280">largest balance</text>
  <rect x="540" y="920" width="380" height="130" rx="14" fill="#ffffff" stroke="#e5e7eb" stroke-width="1" filter="url(#shadowSoft)"/>
  <text x="560" y="960" font-family="Inter, system-ui, sans-serif" font-size="32" font-weight="800" fill="#2563eb">2</text>
  <text x="730" y="960" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="600" fill="#1f2937">Attack the First</text>
  <text x="730" y="985" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#6b7280">Pay minimum on all but</text>
  <text x="730" y="1005" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#6b7280">the smallest debt</text>
  <!-- CTA -->
  <rect x="200" y="1100" width="600" height="60" rx="30" fill="#2563eb"/>
  <text x="500" y="1137" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">Get Your Custom Plan →</text>
  <rect x="180" y="1190" width="200" height="36" rx="8" fill="#e5e7eb" opacity="0.6"/>
  <text x="280" y="1213" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ Compare Methods</text>
  <rect x="400" y="1190" width="200" height="36" rx="8" fill="#e5e7eb" opacity="0.6"/>
  <text x="500" y="1213" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ Track Progress</text>
  <rect x="620" y="1190" width="200" height="36" rx="8" fill="#e5e7eb" opacity="0.6"/>
  <text x="720" y="1213" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ Free Forever</text>
  <text x="500" y="1270" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">#DebtFreeCommunity #Budgeting #MoneySaving</text>
  <text x="500" y="1310" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" fill="#2563eb" text-anchor="middle">qfinhub.com/calculators/debt-snowball</text>
  ${Array.from({length:10}).map((_,i)=>`<circle cx="${100*i+50}" cy="1420" r="3" fill="#2563eb" opacity="0.2"/>`).join("")}
</svg>`;
}

function pin5_TaxSavings() {
  const W=1000,H=1500;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <!-- Clean white background -->
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <!-- Thin black border around edges (receipt style) -->
  <rect x="20" y="20" width="960" height="1460" rx="8" fill="none" stroke="#1f2937" stroke-width="2"/>
  <!-- QFINHUB at top -->
  <text x="500" y="70" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="700" fill="#6366f1" text-anchor="middle" letter-spacing="2">QFINHUB</text>
  <!-- Headline -->
  <text x="500" y="130" font-family="Playfair Display, Georgia, serif" font-size="38" font-weight="700" fill="#1f2937" text-anchor="middle">How to Legally Lower</text>
  <text x="500" y="180" font-family="Playfair Display, Georgia, serif" font-size="38" font-weight="700" fill="#1f2937" text-anchor="middle">Your Tax Bill</text>
  <!-- Receipt invoice style -->
  <rect x="100" y="220" width="800" height="500" rx="4" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
  <!-- Receipt header -->
  <text x="120" y="260" font-family="Courier New, monospace" font-size="18" font-weight="700" fill="#1f2937">TAX ESTIMATE 2025</text>
  <line x1="120" y1="275" x2="880" y2="275" stroke="#d1d5db" stroke-width="1" stroke-dasharray="4,2"/>
  <!-- Receipt items -->
  <text x="120" y="310" font-family="Courier New, monospace" font-size="14" fill="#6b7280">Your Income</text>
  <text x="860" y="310" font-family="Courier New, monospace" font-size="14" fill="#1f2937" text-anchor="end">\$85,000.00</text>
  <text x="120" y="345" font-family="Courier New, monospace" font-size="14" fill="#6b7280">Standard Deduction</text>
  <text x="860" y="345" font-family="Courier New, monospace" font-size="14" fill="#059669" text-anchor="end">-\$14,600.00</text>
  <text x="120" y="380" font-family="Courier New, monospace" font-size="14" fill="#6b7280">Additional Deductions</text>
  <text x="860" y="380" font-family="Courier New, monospace" font-size="14" fill="#059669" text-anchor="end">-\$5,200.00</text>
  <line x1="120" y1="400" x2="880" y2="400" stroke="#d1d5db" stroke-width="1" stroke-dasharray="4,2"/>
  <text x="120" y="435" font-family="Courier New, monospace" font-size="14" font-weight="700" fill="#1f2937">Taxable Income</text>
  <text x="860" y="435" font-family="Courier New, monospace" font-size="14" font-weight="700" fill="#1f2937" text-anchor="end">\$65,200.00</text>
  <text x="120" y="470" font-family="Courier New, monospace" font-size="14" fill="#6b7280">Est. Tax Owed</text>
  <text x="860" y="470" font-family="Courier New, monospace" font-size="14" fill="#1f2937" text-anchor="end">\$10,432.00</text>
  <line x1="120" y1="490" x2="880" y2="490" stroke="#d1d5db" stroke-width="1" stroke-dasharray="4,2"/>
  <!-- Big red savings highlight -->
  <rect x="120" y="510" width="760" height="70" rx="4" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>
  <text x="150" y="555" font-family="Courier New, monospace" font-size="22" font-weight="700" fill="#dc2626">TOTAL SAVINGS: \$2,340.00</text>
  <!-- Receipt footer -->
  <line x1="120" y1="600" x2="880" y2="600" stroke="#d1d5db" stroke-width="1" stroke-dasharray="4,2"/>
  <text x="500" y="640" font-family="Courier New, monospace" font-size="11" fill="#9ca3af" text-anchor="middle">* Estimate based on standard deductions. Yours may vary.</text>
  <!-- Divider -->
  <line x1="100" y1="760" x2="900" y2="760" stroke="#e5e7eb" stroke-width="1"/>
  <!-- How to save section -->
  <text x="500" y="810" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="700" fill="#1f2937" text-anchor="middle">3 Ways to Save More</text>
  <rect x="80" y="850" width="260" height="100" rx="12" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
  <text x="100" y="885" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="800" fill="#059669">✓</text>
  <text x="210" y="885" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#1f2937">Retirement Contributions</text>
  <text x="210" y="910" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#6b7280">Max your 401k/IRA</text>
  <rect x="370" y="850" width="260" height="100" rx="12" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
  <text x="390" y="885" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="800" fill="#059669">✓</text>
  <text x="500" y="885" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#1f2937">Health Savings</text>
  <text x="500" y="910" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#6b7280">Use an HSA if eligible</text>
  <rect x="660" y="850" width="260" height="100" rx="12" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
  <text x="680" y="885" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="800" fill="#059669">✓</text>
  <text x="790" y="885" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#1f2937">Self-Employment</text>
  <text x="790" y="910" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#6b7280">Deduct business expenses</text>
  <!-- CTA -->
  <rect x="200" y="1000" width="600" height="60" rx="30" fill="#dc2626"/>
  <text x="500" y="1037" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">Estimate Your Tax Savings →</text>
  <rect x="180" y="1090" width="200" height="36" rx="8" fill="#f3f4f6"/>
  <text x="280" y="1113" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ Federal &amp; State</text>
  <rect x="400" y="1090" width="200" height="36" rx="8" fill="#f3f4f6"/>
  <text x="500" y="1113" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ Self-Employment</text>
  <rect x="620" y="1090" width="200" height="36" rx="8" fill="#f3f4f6"/>
  <text x="720" y="1113" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ Capital Gains</text>
  <text x="500" y="1170" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">#TaxTips #MoneySaving #FinancialLiteracy</text>
  <text x="500" y="1210" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" fill="#dc2626" text-anchor="middle">qfinhub.com/calculators/tax-calculator</text>
  ${Array.from({length:10}).map((_,i)=>`<circle cx="${100*i+50}" cy="1400" r="3" fill="#dc2626" opacity="0.2"/>`).join("")}
</svg>`;
}

function pin6_Budget5050() {
  const W=1000,H=1500;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="terracotta" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <linearGradient id="slate" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <linearGradient id="sand" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4a373"/>
      <stop offset="100%" stop-color="#e6ccb2"/>
    </linearGradient>
    <filter id="shadowSoft"><feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="rgba(0,0,0,0.08)"/></filter>
  </defs>
  <!-- Clean white -->
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <!-- QFINHUB -->
  <text x="50" y="60" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="700" fill="#6366f1" letter-spacing="2">QFINHUB</text>
  <!-- Headline -->
  <text x="500" y="150" font-family="Playfair Display, Georgia, serif" font-size="40" font-weight="700" fill="#1f2937" text-anchor="middle">Master Your Money</text>
  <text x="500" y="205" font-family="Playfair Display, Georgia, serif" font-size="40" font-weight="700" fill="#d97706" text-anchor="middle">With the 50/30/20 Rule</text>
  <!-- Simple pie chart (SVG circle segments) -->
  <g transform="translate(500,430)">
    <!-- 50% Needs segment (terracotta) - top half -->
    <path d="M 0 -180 A 180 180 0 0 1 0 180" fill="url(#terracotta)"/>
    <!-- 30% Wants segment (slate) - bottom left quarter+ -->
    <path d="M 0 180 A 180 180 0 0 1 -180 0" fill="url(#slate)"/>
    <!-- 20% Savings segment (sand) - remaining -->
    <path d="M -180 0 A 180 180 0 0 1 0 -180" fill="url(#sand)"/>
    <!-- Center hole for donut effect -->
    <circle cx="0" cy="0" r="70" fill="#ffffff"/>
    <text x="0" y="-10" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="800" fill="#1f2937" text-anchor="middle">100%</text>
    <text x="0" y="15" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#6b7280" text-anchor="middle">of your income</text>
  </g>
  <!-- Legend -->
  <rect x="180" y="640" width="24" height="24" rx="4" fill="url(#terracotta)"/>
  <text x="215" y="657" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#1f2937">50% Needs</text>
  <text x="215" y="673" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#6b7280">Rent, bills, groceries</text>
  <rect x="480" y="640" width="24" height="24" rx="4" fill="url(#slate)"/>
  <text x="515" y="657" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#1f2937">30% Wants</text>
  <text x="515" y="673" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#6b7280">Dining, travel, hobbies</text>
  <rect x="780" y="640" width="24" height="24" rx="4" fill="url(#sand)"/>
  <text x="815" y="657" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#1f2937">20% Savings</text>
  <text x="815" y="673" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#6b7280">Investments, debt, goals</text>
  <!-- Example calculation -->
  <rect x="100" y="720" width="800" height="100" rx="14" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1" filter="url(#shadowSoft)"/>
  <text x="500" y="758" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#6b7280" text-anchor="middle">If you earn \$5,000/month after tax:</text>
  <text x="230" y="795" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" fill="#d97706" text-anchor="middle">\$2,500 Needs</text>
  <text x="500" y="795" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" fill="#475569" text-anchor="middle">\$1,500 Wants</text>
  <text x="770" y="795" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" fill="#d4a373" text-anchor="middle">\$1,000 Savings</text>
  <!-- Bottom section -->
  <rect x="0" y="870" width="${W}" height="630" fill="#f9f7f2"/>
  <text x="500" y="920" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="700" fill="#1f2937" text-anchor="middle">See Your Personal Budget Breakdown</text>
  <!-- CTA -->
  <rect x="200" y="960" width="600" height="60" rx="30" fill="#d97706"/>
  <text x="500" y="997" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">Try the 50/30/20 Tool →</text>
  <!-- Features -->
  <rect x="180" y="1060" width="200" height="36" rx="8" fill="#ffffff" opacity="0.8"/>
  <text x="280" y="1083" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ Customizable</text>
  <rect x="400" y="1060" width="200" height="36" rx="8" fill="#ffffff" opacity="0.8"/>
  <text x="500" y="1083" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ Track Expenses</text>
  <rect x="620" y="1060" width="200" height="36" rx="8" fill="#ffffff" opacity="0.8"/>
  <text x="720" y="1083" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#374151" text-anchor="middle">✓ Set Goals</text>
  <!-- Hashtags -->
  <text x="500" y="1140" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">#BudgetingTips #SavingMoney #FinancialPlanning</text>
  <text x="500" y="1180" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" fill="#d97706" text-anchor="middle">qfinhub.com/calculators/budget-planner</text>
  ${Array.from({length:10}).map((_,i)=>`<circle cx="${100*i+50}" cy="1400" r="3" fill="#d97706" opacity="0.2"/>`).join("")}
</svg>`;
}

// ─── Conversion + CSV ────────────────────────────────────────────────────────

async function svgToPng(svgContent, path) {
  try {
    const sharp = require("sharp");
    await sharp(Buffer.from(svgContent)).resize(1000, 1500).png({ quality: 92 }).toFile(path);
    return true;
  } catch (e) {
    console.error("  PNG fail:", e.message);
    return false;
  }
}

function csvEscape(v) {
  const s = String(v).replace(/"/g, '""');
  return (s.includes(",") || s.includes("\n") || s.includes('"')) ? `"${s}"` : s;
}

// ─── Pin definitions from Gemini concepts ────────────────────────────────────

const PINS = [
  {
    slug: "mortgage-payoff",
    title: "How to Save $50k on Your Mortgage Interest",
    desc: "Stop overpaying the bank. See exactly how much interest you can save by adding just a small amount to your monthly mortgage payment. Use our free calculator to find your new payoff date. #MortgageTips #HomeOwnership #DebtFree",
    tags: "Home Buying, Mortgage Tips, Real Estate",
    board: "Mortgage & Home Buying Tools",
    section: "Mortgage Calculators",
    boardId: "mortgage-home",
    color: "#0f766e",
    hex: "#0f766e",
    svg: pin1_MortgagePayoff,
  },
  {
    slug: "compound-interest",
    title: "The Compound Interest Secret to Wealth",
    desc: "Your money should be working as hard as you do. See how small, consistent investments turn into a fortune over time. It's not magic, it's math. Try our free calculator to see your future net worth. #Investing #WealthBuilding #FinanceTips",
    tags: "Investing, Wealth Growth, Passive Income",
    board: "Investment & Wealth Growth",
    section: "Investment Calculators",
    boardId: "investing",
    color: "#059669",
    hex: "#059669",
    svg: pin2_CompoundInterest,
  },
  {
    slug: "retirement-planning",
    title: "Are You On Track for Retirement?",
    desc: "The biggest risk to your retirement is not knowing your number. Stop guessing and start planning. Use our free retirement calculator to see if you're on track for the life you want. #RetirementPlanning #FinancialFreedom #MoneyGoals",
    tags: "Retirement Planning, Financial Freedom, Money Management",
    board: "Retirement Planning Calculators",
    section: "Retirement Tools",
    boardId: "retirement",
    color: "#065f46",
    hex: "#065f46",
    svg: pin3_RetirementProgress,
  },
  {
    slug: "debt-snowball",
    title: "Pay Off All Your Debt Faster (The Snowball Method)",
    desc: "Overwhelmed by multiple debts? The snowball method is the fastest way to get debt-free. Enter your balances into our free tool to get your custom payoff plan today. #DebtFreeCommunity #Budgeting #MoneySaving",
    tags: "Debt Payoff, Budgeting, Personal Finance",
    board: "Debt Payoff Strategies",
    section: "Debt Reduction Tools",
    boardId: "debt",
    color: "#2563eb",
    hex: "#2563eb",
    svg: pin4_DebtSnowball,
  },
  {
    slug: "tax-calculator",
    title: "How to Legally Lower Your Tax Bill",
    desc: "Tax season doesn't have to be painful. Discover how much you could save by adjusting your deductions. Use our free tax estimator to keep more of your hard-earned money. #TaxTips #MoneySaving #FinancialLiteracy",
    tags: "Tax Planning, Money Hacks, Financial Literacy",
    board: "Tax Planning & Estimators",
    section: "Tax Calculators",
    boardId: "taxes",
    color: "#dc2626",
    hex: "#dc2626",
    svg: pin5_TaxSavings,
  },
  {
    slug: "budget-planner",
    title: "The 50/30/20 Budget Rule Explained",
    desc: "Struggling to save money? The 50/30/20 rule is the gold standard for personal budgeting. Use our free calculator to see exactly how much you should be spending vs. saving. #BudgetingTips #SavingMoney #FinancialPlanning",
    tags: "Budgeting, Personal Budget, Money Management",
    board: "Personal Budgeting Hacks",
    section: "Budget & Savings",
    boardId: "budget",
    color: "#d97706",
    hex: "#d97706",
    svg: pin6_Budget5050,
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🎨 QFINHUB Premium Pinterest Pins (Gemini Designs)\n");

  const results = [];

  for (let i = 0; i < PINS.length; i++) {
    const pin = PINS[i];
    const svg = pin.svg();
    const filename = `pin-${pin.slug}.png`;
    const path = resolve(PUBLIC_DIR, filename);

    // Save SVG source for reference
    const svgPath = resolve(PUBLIC_DIR, filename.replace(".png", ".svg"));
    writeFileSync(svgPath, svg);

    // Convert to PNG
    const ok = await svgToPng(svg, path);
    const sizeKB = ok ? (readFileSync(path).length / 1024).toFixed(1) : "N/A";

    console.log(`  ${i + 1}. ${pin.slug.padEnd(20)} ${ok ? "✅" : "⚠️"}  ${sizeKB} KB`);
    results.push({ ...pin, filename, sizeKB });
  }

  // Generate CSV
  const header = "Pin title,Description,Link (URL),Dominant Color,Board name,Board section,Tags,Image URL,Video URL,Video title,Alt text";
  const rows = results.map((p) => {
    const link = `https://www.qfinhub.com/calculators/${p.slug}`;
    const imgUrl = `https://www.qfinhub.com/pinterest-images/${p.filename}`;
    const altText = `${p.title} — Free online calculator at QFINHUB`;
    return `${csvEscape(p.title)},${csvEscape(p.desc)},${link},${p.hex},${csvEscape(p.board)},${csvEscape(p.section)},${csvEscape(p.tags)},${imgUrl},,${csvEscape(p.title)},${csvEscape(altText)}`;
  });
  const csv = [header, ...rows].join("\n");
  const csvPath = resolve(PUBLIC_DIR, "..", "pinterest-import-premium.csv");
  writeFileSync(csvPath, csv);

  console.log(`\n📄 CSV: ${csvPath}`);
  console.log(`🖼️  Images: ${PUBLIC_DIR}/\n`);

  // Print details
  results.forEach((p, i) => {
    console.log(`─── Pin ${i + 1}: ${p.slug} ───`);
    console.log(`  Title: ${p.title}`);
    console.log(`  Board: ${p.board} > ${p.section}`);
    console.log(`  File: ${p.filename} (${p.sizeKB} KB)`);
    console.log(`  Link: https://www.qfinhub.com/calculators/${p.slug}\n`);
  });
}

main().catch(console.error);
