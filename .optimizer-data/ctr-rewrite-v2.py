#!/usr/bin/env python3
"""CTR meta rewrites for variant templates."""
with open('/home/admin1/qfinhub/src/lib/programmatic-seo/variant-templates.ts', 'r') as f:
    content = f.read()

changes = [
    ("title: \"$100,000 Mortgage at 6% for 30 Years\"", "title: \"$100K Mortgage at 6% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate monthly payment for a $100,000 mortgage at 6% interest over 30 years\"", "description: \"Free $100K mortgage calculator at 6%. See your monthly payment, total interest & 30-year amortization. Instant results, no signup.\""),
    ("title: \"$100,000 Mortgage at 6.5% for 30 Years\"", "title: \"$100K Mortgage at 6.5% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate monthly payment for a $100,000 mortgage at 6.5% interest over 30 years\"", "description: \"Free $100K mortgage calculator at 6.5%. Get monthly payment, PMI, & full 30-year amortization. Calculate now, no email required.\""),
    ("title: \"$100,000 Mortgage at 7% for 30 Years\"", "title: \"$100K Mortgage at 7% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate monthly payment for a $100,000 mortgage at 7% interest over 30 years\"", "description: \"See your $100K mortgage payment at 7%. Free calculator shows monthly payment, total interest & amortization. Instant results.\""),
    ("title: \"$150,000 Mortgage at 6.5% for 30 Years\"", "title: \"$150K Mortgage at 6.5% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate monthly payment for a $150,000 mortgage at 6.5% interest over 30 years\"", "description: \"Free $150K mortgage calculator at 6.5%. See monthly payment, PMI, taxes & full amortization. Calculate instantly, no signup.\""),
    ("title: \"$150,000 Mortgage at 7% for 30 Years\"", "title: \"$150K Mortgage at 7% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate monthly payment for a $150,000 mortgage at 7% interest\"", "description: \"Free $150K mortgage calculator at 7%. Get instant monthly payment, total interest & 30-year amortization. No signup required.\""),
    ("title: \"$200,000 Mortgage at 6% for 30 Years\"", "title: \"$200K Mortgage at 6% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate monthly payment for a $200,000 mortgage at 6% interest over 30 years\"", "description: \"Free $200K mortgage calculator at 6%. See monthly payment, total interest & amortization schedule. 100% free, instant results.\""),
    ("title: \"$200,000 Mortgage at 6.5% for 30 Years\"", "title: \"$200K Mortgage at 6.5% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate monthly payment for a $200,000 mortgage at 6.5% interest over 30 years\"", "description: \"Free $200K mortgage calculator at 6.5%. Get monthly payment, total interest & 30-year amortization. Calculate now, no signup.\""),
    ("title: \"$250,000 Mortgage at 6.5% for 30 Years\"", "title: \"$250K Mortgage at 6.5% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate monthly payment for a $250,000 mortgage at 6.5% interest\"", "description: \"Free $250K mortgage calculator at 6.5%. See monthly payment, total interest & 30-year amortization. Instant, no email required.\""),
    ("title: \"$300,000 Mortgage at 6% for 30 Years\"", "title: \"$300K Mortgage at 6% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate monthly payment for a $300,000 mortgage at 6% interest\"", "description: \"Free $300K mortgage calculator at 6%. See monthly payment, total interest & amortization. Instant results, free, no signup.\""),
    ("title: \"$300,000 Mortgage at 6.5% for 30 Years\"", "title: \"$300K Mortgage at 6.5% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate your $300,000 mortgage payment at 6.5% over 30 years\"", "description: \"Free $300K mortgage calculator at 6.5%. Get monthly payment, total interest & 30-year amortization instantly. No signup, 100% free.\""),
    ("title: \"$300,000 Mortgage at 7% for 30 Years\"", "title: \"$300K Mortgage at 7% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate monthly payment for a $300,000 mortgage at 7% interest\"", "description: \"Free $300K mortgage calculator at 7%. See monthly payment, PMI & 30-year amortization. Calculate instantly, no email required.\""),
    ("title: \"$350,000 Mortgage at 6.5% for 30 Years\"", "title: \"$350K Mortgage at 6.5% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate monthly payment for a $350,000 mortgage at 6.5% over 30 years\"", "description: \"Free $350K mortgage calculator at 6.5%. Get monthly payment, total interest & amortization. 100% free, no signup, instant.\""),
    ("title: \"$400,000 Mortgage at 6% for 30 Years\"", "title: \"$400K Mortgage at 6% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate monthly payment for a $400,000 mortgage at 6% over 30 years\"", "description: \"Free $400K mortgage calculator at 6%. See monthly payment, total interest & amortization. Calculate now, instant results, free.\""),
    ("title: \"$400,000 Mortgage at 6.5% for 30 Years\"", "title: \"$400K Mortgage at 6.5% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate your monthly payment for a $400,000 mortgage at 6.5% over 30 years\"", "description: \"Free $400K mortgage calculator at 6.5%. Get monthly payment, total interest & 30-year amortization. Instant, no signup required.\""),
    ("title: \"$400,000 Mortgage at 7% for 30 Years\"", "title: \"$400K Mortgage at 7% (2026) \u2014 Free Calculator\""),
    ("description: \"Calculate monthly payment for a $400,000 mortgage at 7% over 30 years\"", "description: \"Free $400K mortgage calculator at 7%. See monthly payment, PMI, taxes & amortization. Calculate now, no email needed.\""),
    # Fix placeholder
    ("monthly payment (\$XXX), and DTI", "monthly payment, and DTI"),
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
