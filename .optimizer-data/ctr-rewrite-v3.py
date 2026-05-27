#!/usr/bin/env python3
"""Second batch of CTR rewrites for remaining tool templates."""
with open('/home/admin1/qfinhub/src/lib/programmatic-seo/variant-templates.ts', 'r') as f:
    content = f.read()

# More rewrites for tool pages that still have generic descriptions
changes = [
    # AUTO LOAN pages (high search volume)
    ("title: \"$20,000 Auto Loan at 6% for 60 Months\"", "title: \"$20K Auto Loan at 6% (2026) \u2014 Free Car Payment Calculator\""),
    ("description: \"Calculate monthly payment for a $20,000 auto loan at 6% for 60 months\"", "description: \"Free $20K auto loan calculator at 6%. See your monthly car payment, total interest & 60-month amortization. Instant results, no signup.\""),
    ("title: \"$25,000 Auto Loan at 5% for 72 Months\"", "title: \"$25K Auto Loan at 5% (2026) \u2014 Free Car Payment Calculator\""),
    ("description: \"Calculate monthly payment for a $25,000 auto loan at 5% for 72 months\"", "description: \"Free $25K car loan calculator at 5%. Get your monthly payment, total interest & 72-month amortization. Calculate now, no email required.\""),
    ("title: \"$30,000 Auto Loan at 7% for 60 Months\"", "title: \"$30K Auto Loan at 7% (2026) \u2014 Free Car Payment Calculator\""),
    ("description: \"Calculate monthly payment for a $30,000 auto loan at 7% for 60 months\"", "description: \"Free $30K auto loan calculator at 7%. See monthly payment, total interest & 60-month payment schedule. Instant, no signup required.\""),
    ("title: \"$35,000 Auto Loan at 6% for 72 Months\"", "title: \"$35K Auto Loan at 6% (2026) \u2014 Free Car Payment Calculator\""),
    ("description: \"Calculate monthly payment for a $35,000 auto loan at 6% for 72 months\"", "description: \"Free $35K car loan calculator at 6%. Get monthly payment, total interest & 72-month amortization. 100% free, instant results.\""),
    ("title: \"$40,000 Auto Loan at 8% for 60 Months\"", "title: \"$40K Auto Loan at 8% (2026) \u2014 Free Car Payment Calculator\""),
    ("description: \"Calculate monthly payment for a $40,000 auto loan at 8% for 60 months\"", "description: \"Free $40K auto loan calculator at 8%. See monthly car payment, total interest & 60-month breakdown. Calculate now, no signup.\""),
    
    # DEBT SNOWBALL pages
    ("title: \"Debt Snowball \u2014 $10,000 at 18%\"", "title: \"Debt Snowball Calculator \u2014 Pay Off $10K at 18% (2026) Free\""),
    ("description: \"Calculate snowball payment plan for $10,000 debt at 18% APR\"", "description: \"Free debt snowball calculator for $10K at 18%. See payoff date, total interest saved & monthly payment plan. Start your debt-free journey now.\""),
    ("title: \"Debt Snowball \u2014 $15,000 at 22%\"", "title: \"Debt Snowball Calculator \u2014 Pay Off $15K at 22% (2026) Free\""),
    ("description: \"Calculate snowball payment plan for $15,000 debt at 22% APR\"", "description: \"Free debt snowball calculator for $15K at 22%. See payoff timeline, interest saved & personalized payment plan. Get debt-free faster.\""),
    ("title: \"Debt Snowball \u2014 $25,000 at 20%\"", "title: \"Debt Snowball Calculator \u2014 Pay Off $25K at 20% (2026) Free\""),
    ("description: \"Calculate snowball payment plan for $25,000 debt at 20% APR\"", "description: \"Free debt snowball calculator for $25K at 20%. Your payoff plan, interest savings & monthly schedule. Start now, no signup.\""),
    ("title: \"Debt Snowball \u2014 $50,000 at 15%\"", "title: \"Debt Snowball Calculator \u2014 Pay Off $50K at 15% (2026) Free\""),
    ("description: \"Calculate snowball payment plan for $50,000 debt at 15% APR\"", "description: \"Free debt snowball calculator for $50K at 15%. See exact payoff date, total interest & monthly payment. Calculate now, 100% free.\""),
    
    # STUDENT LOAN pages
    ("title: \"$30,000 Student Loan at 5% for 10 Years\"", "title: \"$30K Student Loan at 5% (2026) \u2014 Free Monthly Payment Calculator\""),
    ("description: \"Calculate monthly payment for a $30,000 student loan at 5% over 10 years\"", "description: \"Free $30K student loan calculator at 5%. See monthly payment, total interest & 10-year amortization. Calculate your student loan payments now.\""),
    ("title: \"$50,000 Student Loan at 4.5% for 10 Years\"", "title: \"$50K Student Loan at 4.5% (2026) \u2014 Free Payment Calculator\""),
    ("description: \"Calculate monthly payment for a $50,000 student loan at 4.5% over 10 years\"", "description: \"Free $50K student loan calculator at 4.5%. Get monthly payment, total interest & 10-year repayment plan. Instant results, no signup.\""),
    ("title: \"$80,000 Student Loan at 6% for 10 Years\"", "title: \"$80K Student Loan at 6% (2026) \u2014 Free Monthly Payment Calculator\""),
    ("description: \"Calculate monthly payment for an $80,000 student loan at 6% over 10 years\"", "description: \"Free $80K student loan calculator at 6%. See monthly payment, total interest & 10-year amortization. Calculate your student debt now.\""),
    
    # BUDGET 50/30/20 pages
    ("title: \"50/30/20 Budget for $40,000 Income\"", "title: \"50/30/20 Budget for $40K Income (2026) \u2014 Free Budget Planner\""),
    ("description: \"Apply 50/30/20 budgeting to a $40,000 annual income\"", "description: \"Free 50/30/20 budget calculator for $40K income. See your needs (50%), wants (30%), savings (20%) breakdown. Get your personalized budget now.\""),
    ("title: \"50/30/20 Budget for $60,000 Income\"", "title: \"50/30/20 Budget for $60K Income (2026) \u2014 Free Budget Planner\""),
    ("description: \"Apply 50/30/20 budgeting to a $60,000 annual income\"", "description: \"Free 50/30/20 budget plan for $60K income. See exact dollar amounts for needs, wants & savings. Calculate your budget in seconds.\""),
    ("title: \"50/30/20 Budget for $80,000 Income\"", "title: \"50/30/20 Budget for $80K Income (2026) \u2014 Free Budget Planner\""),
    ("description: \"Apply 50/30/20 budgeting to an $80,000 annual income\"", "description: \"Free 50/30/20 budget calculator for $80K. See needs ($40K), wants ($24K), savings ($16K). Instant budget breakdown, no signup.\""),
    ("title: \"50/30/20 Budget for $100,000 Income\"", "title: \"50/30/20 Budget for $100K Income (2026) \u2014 Free Budget Planner\""),
    ("description: \"Apply 50/30/20 budgeting to a $100,000 annual income\"", "description: \"Free 50/30/20 budget plan for $100K income. Get your needs/wants/savings split in dollars. Calculate your 50/30/20 budget now.\""),
    ("title: \"50/30/20 Budget for $150,000 Income\"", "title: \"50/30/20 Budget for $150K Income (2026) \u2014 Free Budget Planner\""),
    ("description: \"Apply 50/30/20 budgeting to a $150,000 annual income\"", "description: \"Free 50/30/20 budget calculator for $150K. See your spending buckets: $75K needs, $45K wants, $30K savings. Instant, free.\""),
    
    # CREDIT CARD PAYOFF pages
    ("title: \"Credit Card Payoff \u2014 $5,000 at 20%\"", "title: \"Credit Card Payoff Calculator \u2014 $5K at 20% APR (2026) Free\""),
    ("description: \"Calculate payoff plan for $5,000 credit card debt at 20% APR\"", "description: \"Free credit card payoff calculator for $5K at 20% APR. See payoff date, total interest & payment plan. Get debt-free faster, calculate now.\""),
    ("title: \"Credit Card Payoff \u2014 $10,000 at 22%\"", "title: \"Credit Card Payoff Calculator \u2014 $10K at 22% APR (2026) Free\""),
    ("description: \"Calculate payoff plan for $10,000 credit card debt at 22% APR\"", "description: \"Free credit card payoff calculator for $10K at 22%. See how long to pay off & interest saved. Calculate your payoff plan now.\""),
    
    # 401K pages
    ("title: \"401(k) \u2014 $50,000 at 7% Growth\"", "title: \"401(k) Calculator \u2014 $50K at 7% Growth (2026) Free\""),
    ("description: \"Project 401(k) growth starting at $50,000 with 7% annual return\"", "description: \"Free 401(k) calculator for $50K at 7% growth. See projected balance, employer match & total contributions. Plan your retirement now.\""),
    ("title: \"401(k) \u2014 $100,000 at 7% Growth\"", "title: \"401(k) Calculator \u2014 $100K at 7% Growth (2026) Free\""),
    ("description: \"Project 401(k) growth starting at $100,000 with 7% annual return\"", "description: \"Free 401(k) calculator for $100K at 7%. See retirement projections, employer match & growth. Calculate your 401(k) future now.\""),
    
    # MORTGAGE REFINANCE pages
    ("title: \"Refinance \u2014 From 7% to 6% on $300,000\"", "title: "Refinance Calculator \u2014 7% to 6% on $300K (2026) Free""),
    ("description: \"Calculate savings from refinancing a $300,000 mortgage from 7% to 6%\"", "description: \"Free refinance calculator for $300K from 7% to 6%. See monthly savings, break-even point & total interest saved. Calculate now.\""),
]

# The issue is the em-dash escaping. Let me use simpler approach - just ascii dashes.
changes_flat = []
for old_title, new_title, old_desc, new_desc in changes:
    changes_flat.append((old_title, new_title))
    changes_flat.append((old_desc, new_desc))

count = 0
for old, new in changes_flat:
    if old in content:
        content = content.replace(old, new)
        count += 1
    else:
        print(f"MISS: {old[:60]}")

with open('/home/admin1/qfinhub/src/lib/programmatic-seo/variant-templates.ts', 'w') as f:
    f.write(content)

print(f"Applied {count}/{len(changes_flat)} changes")
