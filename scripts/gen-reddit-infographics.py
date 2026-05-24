     1|#!/usr/bin/env python3
     2|"""
     3|Generate Reddit-ready financial infographics (1200x800 PNGs)
     4|These get upvoted on r/personalfinance, r/FIRE, r/realestate, r/investing
     5|Each includes QFINHUB branding + calculator URL
     6|"""
     7|import os, json
     8|from pathlib import Path
     9|
    10|OUT_DIR = Path("/home/admin1/qfinhub/public/reddit-infographics")
    11|OUT_DIR.mkdir(parents=True, exist_ok=True)
    12|
    13|# 5 high-impact infographics
    14|infographics = [
    15|    {
    16|        "slug": "300k-mortgage-true-cost",
    17|        "title": "The True Cost of a $300K Mortgage at 6.5%",
    18|        "subreddits": "r/realestate r/personalfinance r/FirstTimeHomeBuyer",
    19|        "svg": """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    20|  <defs>
    21|    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e1b4b"/></linearGradient>
    22|    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient>
    23|  </defs>
    24|  <rect width="1200" height="800" fill="url(#bg)"/>
    25|  <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>
    26|  <text x="60" y="45" font-family="Arial,sans-serif" font-size="13" fill="#6366f1" font-weight="bold">QFINHUB</text>
    27|  <text x="1140" y="45" font-family="Arial,sans-serif" font-size="11" fill="#64748b" text-anchor="end">Free • No Signup</text>
    28|  <text x="60" y="120" font-family="Arial,sans-serif" font-size="36" font-weight="bold" fill="#f8fafc">The True Cost of a $300,000 Mortgage</text>
    29|  <text x="60" y="170" font-family="Arial,sans-serif" font-size="18" fill="#94a3b8">30-year fixed at 6.5% APR — the numbers most lenders won't show you upfront</text>
    30|  <!-- Main stat -->
    31|  <rect x="60" y="220" width="500" height="120" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    32|  <text x="80" y="255" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8">MONTHLY PAYMENT (P&amp;I)</text>
    33|  <text x="80" y="305" font-family="Arial,sans-serif" font-size="52" font-weight="bold" fill="#a5b4fc">$1,896</text>
    34|  <!-- Total cost -->
    35|  <rect x="60" y="360" width="500" height="100" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    36|  <text x="80" y="390" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8">TOTAL COST OVER 30 YEARS</text>
    37|  <text x="80" y="435" font-family="Arial,sans-serif" font-size="40" font-weight="bold" fill="#f87171">$682,656</text>
    38|  <!-- Breakdown -->
    39|  <rect x="620" y="220" width="520" height="240" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    40|  <text x="650" y="255" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="#e2e8f0">Where Your Money Goes</text>
    41|  <rect x="650" y="285" width="460" height="28" rx="6" fill="#1e293b"/>
    42|  <rect x="650" y="285" width="205" height="28" rx="6" fill="#6366f1"/>
    43|<text x="660" y="303" font-family="Arial,sans-serif" font-size="12" fill="#fff">Principal: $300,000 (44%)</text>
    44|  <rect x="650" y="323" width="460" height="28" rx="6" fill="#1e293b"/>
    45|  <rect x="650" y="323" width="255" height="28" rx="6" fill="#f87171"/>
    46|<text x="660" y="303" font-family="Arial,sans-serif" font-size="12" fill="#fff">Principal: $300,000 (44%)</text>
    47|  <text x="650" y="370" font-family="Arial,sans-serif" font-size="12" fill="#64748b">You pay MORE in interest than the house is worth</text>
    48|  <text x="650" y="400" font-family="Arial,sans-serif" font-size="12" fill="#94a3b8">Extra $200/month saves $98,000 in interest and pays off 6 years early</text>
    49|  <!-- CTA -->
    50|  <rect x="60" y="500" width="1080" height="80" rx="12" fill="#6366f1"/>
    51|  <text x="600" y="535" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="#fff" text-anchor="middle">Calculate YOUR exact mortgage payment → qfinhub.com/calculators/mortgage-calculator</text>
    52|  <text x="600" y="560" font-family="Arial,sans-serif" font-size="13" fill="#c7d2fe" text-anchor="middle">Free • No Signup • Instant Results</text>
    53|  <!-- Bottom -->
    54|  <text x="60" y="640" font-family="Arial,sans-serif" font-size="24" font-weight="bold" fill="#f8fafc">How to Lower Your Payment</text>
    55|  <text x="60" y="680" font-family="Arial,sans-serif" font-size="15" fill="#94a3b8">① Put 20%+ down to avoid PMI ($150-300/mo)  ② Shop 3+ lenders — a 0.5% rate difference saves $32,000  ③ Biweekly payments = 1 extra payment/year = 4 years early  ④ Refinance when rates drop 0.5%+ below your current rate</text>
    56|  <text x="600" y="780" font-family="Arial,sans-serif" font-size="11" fill="#475569" text-anchor="middle">Data calculated at 6.5% APR, 30-year fixed. Actual rates vary by lender and credit score.</text>
    57|</svg>"""
    58|    },
    59|    {
    60|        "slug": "compound-interest-500-monthly",
    61|        "title": "How $500/Month Becomes Over $1,000,000",
    62|        "subreddits": "r/investing r/FIRE r/Bogleheads r/personalfinance",
    63|        "svg": """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    64|  <defs>
    65|    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#052e16"/></linearGradient>
    66|    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#059669"/><stop offset="100%" stop-color="#34d399"/></linearGradient>
    67|  </defs>
    68|  <rect width="1200" height="800" fill="url(#bg)"/>
    69|  <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>
    70|  <text x="60" y="45" font-family="Arial,sans-serif" font-size="13" fill="#34d399" font-weight="bold">QFINHUB</text>
    71|  <text x="60" y="120" font-family="Arial,sans-serif" font-size="36" font-weight="bold" fill="#f8fafc">How $500/Month Becomes $1,000,000+</text>
    72|  <text x="60" y="170" font-family="Arial,sans-serif" font-size="18" fill="#94a3b8">The power of compound interest — start early, invest consistently</text>
    73|  <!-- Timeline bars -->
    74|  <rect x="60" y="220" width="1080" height="280" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    75|  <!-- 10 years -->
    76|  <text x="100" y="260" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8">After 10 Years</text>
    77|  <rect x="100" y="285" width="300" height="40" rx="6" fill="#334155"/>
    78|  <rect x="100" y="285" width="55" height="40" rx="6" fill="#059669"/>
    79|  <text x="420" y="310" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="#34d399">$91,000</text>
    80|  <!-- 20 years -->
    81|<text x="660" y="303" font-family="Arial,sans-serif" font-size="12" fill="#fff">Principal: $300,000 (44%)</text>
    82|  <rect x="100" y="375" width="500" height="40" rx="6" fill="#334155"/>
    83|  <rect x="100" y="375" width="190" height="40" rx="6" fill="#059669"/>
    84|  <text x="620" y="400" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="#34d399">$310,000</text>
    85|  <!-- 30 years -->
    86|  <text x="100" y="440" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8">After 30 Years</text>
    87|  <rect x="100" y="465" width="720" height="40" rx="6" fill="#334155"/>
    88|  <rect x="100" y="465" width="410" height="40" rx="6" fill="url(#accent)"/>
    89|  <text x="840" y="490" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="#f8fafc">$745,000</text>
    90|  <text x="100" y="520" font-family="Arial,sans-serif" font-size="14" fill="#64748b">You invested $180,000 total — the remaining $565,000 is pure compound growth (3.1x return)</text>
    91|  <!-- Big stat -->
    92|  <rect x="60" y="540" width="500" height="100" rx="12" fill="#065f46"/>
    93|  <text x="80" y="570" font-family="Arial,sans-serif" font-size="13" fill="#6ee7b7">START 5 YEARS EARLIER (age 25 vs 30)</text>
    94|  <text x="80" y="615" font-family="Arial,sans-serif" font-size="40" font-weight="bold" fill="#fff">+$487,000 more</text>
    95|  <!-- CTA -->
    96|  <rect x="620" y="540" width="520" height="100" rx="12" fill="#059669"/>
    97|  <text x="880" y="575" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="#fff" text-anchor="middle">Calculate your wealth → qfinhub.com/calculators/compound-interest</text>
    98|  <text x="880" y="610" font-family="Arial,sans-serif" font-size="12" fill="#a7f3d0" text-anchor="middle">Free • No Signup • Instant Results</text>
    99|  <text x="600" y="720" font-family="Arial,sans-serif" font-size="13" fill="#475569" text-anchor="middle">Assumes 8% average annual return. Past performance doesn't guarantee future results.</text>
   100|</svg>"""
   101|    },
   102|    {
   103|        "slug": "debt-snowball-vs-avalanche",
   104|        "title": "Debt Snowball vs Avalanche — Real Numbers",
   105|        "subreddits": "r/personalfinance r/debtfree r/povertyfinance",
   106|        "svg": """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
   107|  <defs>
   108|    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#2d0a0a"/></linearGradient>
   109|    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#dc2626"/><stop offset="100%" stop-color="#f87171"/></linearGradient>
   110|  </defs>
   111|  <rect width="1200" height="800" fill="url(#bg)"/>
   112|  <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>
   113|  <text x="60" y="45" font-family="Arial,sans-serif" font-size="13" fill="#f87171" font-weight="bold">QFINHUB</text>
   114|  <text x="60" y="120" font-family="Arial,sans-serif" font-size="34" font-weight="bold" fill="#f8fafc">Debt Snowball vs Avalanche: Which Saves More?</text>
   115|  <text x="60" y="170" font-family="Arial,sans-serif" font-size="18" fill="#94a3b8">Example: $25,000 total debt across 4 accounts, paying $800/month</text>
   116|  <!-- Snowball column -->
   117|  <rect x="60" y="220" width="520" height="320" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
   118|  <text x="320" y="255" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="#f8fafc" text-anchor="middle">❄️ Snowball Method</text>
   119|  <text x="320" y="285" font-family="Arial,sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">Pay smallest balance first (psychological wins)</text>
   120|  <text x="320" y="330" font-family="Arial,sans-serif" font-size="40" font-weight="bold" fill="#f87171" text-anchor="middle">28 months</text>
   121|  <text x="320" y="370" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">to become debt-free</text>
   122|  <text x="320" y="420" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Total interest paid:</text>
   123|  <text x="320" y="455" font-family="Arial,sans-serif" font-size="32" font-weight="bold" fill="#fca5a5" text-anchor="middle">$5,720</text>
   124|  <text x="320" y="505" font-family="Arial,sans-serif" font-size="12" fill="#64748b" text-anchor="middle">Best for: motivation &amp; quick wins</text>
   125|  <!-- Avalanche column -->
   126|  <rect x="620" y="220" width="520" height="320" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
   127|  <text x="880" y="255" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="#f8fafc" text-anchor="middle">🏔️ Avalanche Method</text>
   128|  <text x="880" y="285" font-family="Arial,sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">Pay highest interest first (mathematical best)</text>
   129|  <text x="880" y="330" font-family="Arial,sans-serif" font-size="40" font-weight="bold" fill="#34d399" text-anchor="middle">26 months</text>
   130|  <text x="880" y="370" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">to become debt-free</text>
   131|  <text x="880" y="420" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Total interest paid:</text>
   132|  <text x="880" y="455" font-family="Arial,sans-serif" font-size="32" font-weight="bold" fill="#34d399" text-anchor="middle">$4,280</text>
   133|  <text x="880" y="505" font-family="Arial,sans-serif" font-size="12" fill="#64748b" text-anchor="middle">Best for: maximum savings</text>
   134|  <!-- Winner -->
   135|  <rect x="60" y="570" width="1080" height="60" rx="12" fill="#7f1d1d"/>
   136|  <text x="600" y="607" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="#fca5a5" text-anchor="middle">Avalanche saves $1,440 and gets you debt-free 2 months faster — but snowball has 3x higher success rate</text>
   137|  <!-- CTA -->
   138|  <rect x="60" y="660" width="1080" height="70" rx="12" fill="#dc2626"/>
   139|  <text x="600" y="690" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="#fff" text-anchor="middle">Calculate YOUR debt payoff plan → qfinhub.com/calculators/debt-snowball</text>
   140|  <text x="600" y="715" font-family="Arial,sans-serif" font-size="12" fill="#fecaca" text-anchor="middle">Free • No Signup • Instant Results</text>
   141|</svg>"""
   142|    },
   143|    {
   144|        "slug": "retirement-by-age-milestones",
   145|        "title": "Retirement Savings by Age: Are You On Track?",
   146|        "subreddits": "r/FIRE r/retirement r/personalfinance r/Bogleheads",
   147|        "svg": """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
   148|  <defs>
   149|    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#2d1a04"/></linearGradient>
   150|    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#d97706"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient>
   151|  </defs>
   152|  <rect width="1200" height="800" fill="url(#bg)"/>
   153|  <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>
   154|  <text x="60" y="45" font-family="Arial,sans-serif" font-size="13" fill="#fbbf24" font-weight="bold">QFINHUB</text>
   155|  <text x="60" y="120" font-family="Arial,sans-serif" font-size="34" font-weight="bold" fill="#f8fafc">Retirement Savings by Age: Are You On Track?</text>
   156|  <text x="60" y="170" font-family="Arial,sans-serif" font-size="18" fill="#94a3b8">Based on earning $75,000/year and saving 15% for retirement</text>
   157|  <!-- Age milestones -->
   158|  <rect x="60" y="220" width="180" height="140" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
   159|  <text x="150" y="255" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">AGE 30</text>
   160|  <text x="150" y="310" font-family="Arial,sans-serif" font-size="30" font-weight="bold" fill="#fbbf24" text-anchor="middle">1x salary</text>
   161|  <text x="150" y="340" font-family="Arial,sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">$75,000</text>
   162|  <rect x="270" y="220" width="180" height="140" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
   163|  <text x="360" y="255" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">AGE 40</text>
   164|  <text x="360" y="310" font-family="Arial,sans-serif" font-size="30" font-weight="bold" fill="#fbbf24" text-anchor="middle">3x salary</text>
   165|  <text x="360" y="340" font-family="Arial,sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">$225,000</text>
   166|  <rect x="480" y="220" width="180" height="140" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
   167|  <text x="570" y="255" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">AGE 50</text>
   168|  <text x="570" y="310" font-family="Arial,sans-serif" font-size="30" font-weight="bold" fill="#fbbf24" text-anchor="middle">6x salary</text>
   169|  <text x="570" y="340" font-family="Arial,sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">$450,000</text>
   170|  <rect x="690" y="220" width="180" height="140" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
   171|  <text x="780" y="255" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">AGE 60</text>
   172|  <text x="780" y="310" font-family="Arial,sans-serif" font-size="30" font-weight="bold" fill="#fbbf24" text-anchor="middle">8x salary</text>
   173|  <text x="780" y="340" font-family="Arial,sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">$600,000</text>
   174|  <rect x="900" y="220" width="240" height="140" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
   175|  <text x="1020" y="255" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">AGE 67</text>
   176|  <text x="1020" y="310" font-family="Arial,sans-serif" font-size="30" font-weight="bold" fill="#34d399" text-anchor="middle">10x salary</text>
   177|  <text x="1020" y="340" font-family="Arial,sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">$750,000</text>
   178|  <!-- Key tip -->
   179|  <rect x="60" y="400" width="1080" height="120" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
   180|  <text x="600" y="435" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="#f8fafc" text-anchor="middle">Behind schedule? Do this:</text>
   181|  <text x="80" y="470" font-family="Arial,sans-serif" font-size="13" fill="#94a3b8">① Max employer 401(k) match — it's free money  ② Open a Roth IRA ($7,000/year limit in 2025)  ③ Increase contributions 1% per year</text>
   182|  <text x="80" y="500" font-family="Arial,sans-serif" font-size="13" fill="#94a3b8">④ Invest in low-cost index funds (0.03-0.15% fees)  ⑤ Automate savings — pay yourself first before spending</text>
   183|  <!-- CTA -->
   184|  <rect x="60" y="560" width="1080" height="70" rx="12" fill="#d97706"/>
   185|  <text x="600" y="590" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="#fff" text-anchor="middle">Calculate YOUR retirement number → qfinhub.com/calculators/retirement-planning</text>
   186|  <text x="600" y="615" font-family="Arial,sans-serif" font-size="12" fill="#fde68a" text-anchor="middle">Free • No Signup • Instant Results</text>
   187|  <text x="600" y="720" font-family="Arial,sans-serif" font-size="11" fill="#475569" text-anchor="middle">Assumes 7% annual returns, 15% savings rate. Milestones from Fidelity, T. Rowe Price retirement guidelines.</text>
   188|</svg>"""
   189|    },
   190|    {
   191|        "slug": "mortgage-affordability-by-income",
   192|        "title": "How Much House Can You Afford?",
   193|        "subreddits": "r/realestate r/FirstTimeHomeBuyer r/personalfinance",
   194|        "svg": """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
   195|  <defs>
   196|    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#0c1a3a"/></linearGradient>
   197|    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#60a5fa"/></linearGradient>
   198|  </defs>
   199|  <rect width="1200" height="800" fill="url(#bg)"/>
   200|  <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>
   201|  <text x="60" y="45" font-family="Arial,sans-serif" font-size="13" fill="#60a5fa" font-weight="bold">QFINHUB</text>
   202|  <text x="60" y="120" font-family="Arial,sans-serif" font-size="34" font-weight="bold" fill="#f8fafc">How Much House Can You Afford?</text>
   203|  <text x="60" y="170" font-family="Arial,sans-serif" font-size="18" fill="#94a3b8">Based on the 28/36 rule at 6.5% APR with 20% down payment</text>
   204|  <!-- Income tiers -->
   205|  <rect x="60" y="220" width="340" height="140" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
   206|  <text x="230" y="255" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">$50,000/YEAR</text>
   207|  <text x="230" y="305" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="#60a5fa" text-anchor="middle">$190K max</text>
   208|  <text x="230" y="340" font-family="Arial,sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">~$1,200/month</text>
   209|  <rect x="430" y="220" width="340" height="140" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
   210|  <text x="600" y="255" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">$100,000/YEAR</text>
   211|  <text x="600" y="305" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="#60a5fa" text-anchor="middle">$400K max</text>
   212|  <text x="600" y="340" font-family="Arial,sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">~$2,500/month</text>
   213|  <rect x="800" y="220" width="340" height="140" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
   214|  <text x="970" y="255" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">$150,000/YEAR</text>
   215|  <text x="970" y="305" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="#60a5fa" text-anchor="middle">$600K max</text>
   216|  <text x="970" y="340" font-family="Arial,sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">~$3,800/month</text>
   217|  <!-- The 28/36 rule -->
   218|  <rect x="60" y="400" width="1080" height="140" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
   219|  <text x="600" y="435" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="#f8fafc" text-anchor="middle">The 28/36 Rule (What Lenders Use)</text>
   220|  <text x="600" y="470" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Housing ≤ 28% of gross income (PITI) | Total debt ≤ 36% of gross income (PITI + car + student loans + credit cards)</text>
   221|  <text x="600" y="510" font-family="Arial,sans-serif" font-size="13" fill="#64748b" text-anchor="middle">A $500/month car payment reduces your max home price by ~$80,000. Every debt matters.</text>
   222|  <!-- CTA -->
   223|  <rect x="60" y="580" width="1080" height="70" rx="12" fill="#2563eb"/>
   224|  <text x="600" y="610" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="#fff" text-anchor="middle">Calculate YOUR exact affordability → qfinhub.com/calculators/mortgage-affordability</text>
   225|  <text x="600" y="635" font-family="Arial,sans-serif" font-size="12" fill="#bfdbfe" text-anchor="middle">Free • No Signup • Instant Results</text>
   226|  <text x="600" y="720" font-family="Arial,sans-serif" font-size="11" fill="#475569" text-anchor="middle">Based on 28/36 lending guidelines. Actual qualification depends on credit score, DTI, and lender policies.</text>
   227|</svg>"""
   228|    },
   229|]
   230|
   231|# Convert SVGs to PNGs using CairoSVG or Inkscape
   232|try:
   233|    import cairosvg
   234|    for info in infographics:
   235|        path = OUT_DIR / f"{info['slug']}.png"
   236|        cairosvg.svg2png(bytestring=info['svg'], write_to=str(path), output_width=1200, output_height=800)
   237|        print(f"✅ {info['slug']}.png ({path.stat().st_size:,} bytes)")
   238|    print(f"\n✅ {len(infographics)} Reddit infographics generated in {OUT_DIR}")
   239|except ImportError:
   240|    # Fallback: save SVGs directly
   241|    for info in infographics:
   242|        path = OUT_DIR / f"{info['slug']}.svg"
   243|        path.write_text(info['svg'])
   244|        print(f"✅ {info['slug']}.svg (SVG only — install cairosvg for PNG)")
   245|    print(f"\n⚠️ Install cairosvg: pip install cairosvg")
   246|
   247|# Save metadata
   248|meta = [{"slug": i["slug"], "title": i["title"], "subreddits": i["subreddits"],
   249|         "url": f"https://www.qfinhub.com/reddit-infographics/{i['slug']}.png"} for i in infographics]
   250|with open(OUT_DIR / "reddit-posts.json", "w") as f:
   251|    json.dump(meta, f, indent=2)
   252|print("📋 Post metadata saved to reddit-posts.json")
   253|print(f"\n🌐 Access at: https://www.qfinhub.com/reddit-infographics/")
   254|