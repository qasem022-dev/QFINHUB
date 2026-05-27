#!/usr/bin/env python3
"""Third batch: more CTR rewrites for remaining 15-year mortgages and other pages"""
with open('/home/admin1/qfinhub/src/lib/programmatic-seo/variant-templates.ts', 'r') as f:
    content = f.read()

changes = [
    # 15-year mortgage pages
    ("title: \"$100,000 Mortgage at 5.5% for 15 Years\"", "title: \"$100K Mortgage at 5.5% 15-Yr (2026) \u2014 Free Payment Calculator\""),
    ("description: \"Calculate monthly payment for a $100,000 mortgage at 5.5% interest over 15 years\"", "description: \"Free $100K 15-year mortgage calculator at 5.5%. See monthly payment, total interest & 15-year amortization. Pay off faster, calculate now.\""),
    
    ("title: \"$150,000 Mortgage at 6% for 15 Years\"", "title: \"$150K Mortgage at 6% 15-Yr (2026) \u2014 Free Payment Calculator\""),
    ("description: \"Calculate monthly payment for a $150,000 mortgage at 6% over 15 years\"", "description: \"Free $150K 15-year mortgage calculator at 6%. See monthly payment, total interest saved vs 30-year. Instant results, no signup.\""),
    
    ("title: \"$200,000 Mortgage at 7% for 30 Years\"", "title: \"$200K Mortgage at 7% 30-Yr (2026) \u2014 Free Payment Calculator\""),
    ("description: \"Calculate monthly payment for a $200,000 mortgage at 7% over 30 years\"", "description: \"Free $200K mortgage calculator at 7%. See monthly payment, total interest & 30-year amortization. Calculate your mortgage payment now.\""),
    
    ("title: \"$200,000 Mortgage at 5.5% for 15 Years\"", "title: \"$200K Mortgage at 5.5% 15-Yr (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate a $200,000 mortgage payment at 5.5% over 15 years\"", "description: \"Free $200K 15-year mortgage calculator at 5.5%. See payment, total interest & accelerated payoff. Calculate now, 100% free.\""),
    
    ("title: \"$200,000 Mortgage at 6% for 15 Years\"", "title: \"$200K Mortgage at 6% 15-Yr (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate your monthly payment for a $200,000 mortgage at 6% over 15 years\"", "description: \"Free $200K 15-year mortgage at 6%. Get monthly payment, total interest & amortization. Save thousands vs 30-year loan.\""),
    
    ("title: \"$250,000 Mortgage at 7% for 30 Years\"", "title: \"$250K Mortgage at 7% 30-Yr (2026) \u2014 Free Payment Calculator\""),
    ("description: \"Calculate monthly payment for a $250,000 mortgage at 7% over 30 years\"", "description: \"Free $250K mortgage calculator at 7%. See monthly payment, total interest & 30-year amortization. Instant, no signup required.\""),
    
    ("title: \"$250,000 Mortgage at 6% for 15 Years\"", "title: \"$250K Mortgage at 6% 15-Yr (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate a $250,000 mortgage payment at 6% for 15 years\"", "description: \"Free $250K 15-year mortgage calculator at 6%. See payment, interest savings & faster payoff. Calculate now, no email needed.\""),
    
    ("title: \"$300,000 Mortgage at 5.5% for 15 Years\"", "title: \"$300K Mortgage at 5.5% 15-Yr (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate a $300,000 mortgage at 5.5% over 15 years\"", "description: \"Free $300K 15-year mortgage calculator at 5.5%. See monthly payment & massive interest savings. Calculate your mortgage now.\""),
    
    ("title: \"$300,000 Mortgage at 6% for 15 Years\"", "title: \"$300K Mortgage at 6% 15-Yr (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate your $300,000 mortgage payment at 6% for 15 years\"", "description: \"Free $300K 15-year mortgage at 6%. Get payment, total interest & amortization. Save $100K+ vs 30-year loan. Calculate now.\""),
    
    ("title: \"$350,000 Mortgage at 7% for 30 Years\"", "title: \"$350K Mortgage at 7% 30-Yr (2026) \u2014 Free Payment Calculator\""),
    ("description: \"Calculate a $350,000 mortgage payment at 7% over 30 years\"", "description: \"Free $350K mortgage calculator at 7%. See monthly payment, total interest & full amortization. Instant, 100% free.\""),
    
    # Additional 15-year entries
    ("title: \"$150,000 Mortgage at 6% for 15 Years\"", "title: \"$150K Mortgage at 6% 15-Yr (2026) \u2014 Free Payment Calculator\""),
    ("description: \"Calculate monthly payment for a $150,000 mortgage at 6% over 15 years\"", "description: \"Free $150K 15-year mortgage calculator at 6%. See monthly payment, total interest saved vs 30-year. Instant results, no signup.\""),
    
    # More refinance pages
    ("title: \"Refinance \u2014 From 7% to 6% on $300,000\"", "title: \"Refinance Calculator \u2014 7% to 6% on $300K (2026) Free\""),
    ("description: \"Calculate savings from refinancing a $300,000 mortgage from 7% to 6%\"", "description: \"Free refinance calculator for $300K from 7% to 6%. See monthly savings, break-even point & total interest saved. Calculate now.\""),
    
    # 5% down mortgage pages
    ("title: \"$250,000 Mortgage with 5% Down at 7%\"", "title: \"$250K Mortgage 5% Down at 7% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate a $250,000 mortgage with 5% down payment at 7% with PMI\"", "description: \"Free $250K mortgage with 5% down at 7%. See payment, PMI cost & total loan cost. Low down payment calculator, instant results.\""),
]

count = 0
for old, new in changes:
    if old in content:
        content = content.replace(old, new)
        count += 1
    else:
        print(f"MISS: {old[:60]}")

with open('/home/admin1/qfinhub/src/lib/programmatic-seo/variant-templates.ts', 'w') as f:
    f.write(content)

print(f"Applied {count}/{len(changes)} changes")
