#!/usr/bin/env python3
"""
Scenario Uniqueness Upgrader — Makes scenario pages distinct enough for Google indexing.
Adds: "What This Means For You", unique insight, comparison highlight, "Try Next" link.

Usage: python3 scripts/upgrade-scenarios.py [--count 50]
"""
import json, os, sys, random
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path("/home/admin1/qfinhub")
SCENARIO_DIR = PROJECT_ROOT / "public" / "data" / "scenarios"
INDEX_FILE = SCENARIO_DIR / "index.json"

# Unique insight templates — rotated to keep variety
INSIGHTS = {
    "mortgage": [
        "That's like paying for your house twice — once for the bank, once for yourself.",
        "Every extra $100/month toward principal saves you ~$25,000 over the life of the loan.",
        "The first 5 years of payments are 80%+ interest. Refinancing before year 5 saves the most.",
        "At this rate, your total interest exceeds the home's original price — consider a 15-year term.",
        "A 1% rate drop would save you $X/month. It's worth shopping lenders every 2 years.",
    ],
    "investing": [
        "Time in the market beats timing the market — every year delayed costs you compound growth.",
        "The S&P 500 has never lost money over any 20-year period. Patience is the strategy.",
        "Fees matter: a 1% fee on this portfolio costs $X in lost growth over the term.",
        "Starting 5 years earlier would add $X to your final balance. Start today.",
    ],
    "retirement": [
        "The 4% rule says you need 25x annual expenses saved. Run that math with YOUR numbers.",
        "Social Security replaces only ~40% of pre-retirement income. The rest is on you.",
        "Healthcare in retirement costs $315,000 on average. Budget it separately.",
        "Delaying retirement by just 2 years can add $X to your nest egg through extra contributions + growth.",
    ],
    "debt": [
        "The snowball method feels better. The avalanche method saves more money. This tool shows both.",
        "Every $100 extra toward your highest-interest debt saves $X in total interest.",
        "The average American carries $6,500 in credit card debt at 22% APR — that's $1,430/year in interest alone.",
    ],
    "taxes": [
        "Your marginal rate isn't your effective rate. Most people overestimate what they actually pay.",
        "Tax-loss harvesting could save you $X/year. It's legal and underused.",
    ],
    "savings": [
        "The median American has $5,300 in savings. Building to 3 months of expenses is the first milestone.",
        "A $1,000 emergency fund prevents 80% of unexpected-expense debt. Start there.",
    ],
    "loans": [
        "Every extra $50/month toward your loan principal cuts months off your term and hundreds in interest.",
        "Refinancing from X% to Y% would save you $Z/month. Check current rates quarterly.",
    ],
}

# Default for unknown categories
DEFAULT_INSIGHTS = [
    "Small changes in your inputs create big differences over time. Test different scenarios.",
    "Run this calculation annually — life changes affect your numbers more than you think.",
]

# "Try Next" link suggestions
NEXT_LINKS = {
    "mortgage": "/calculators/refinance-calculator",
    "investing": "/calculators/compound-interest",
    "retirement": "/calculators/401k-calculator",
    "debt": "/calculators/debt-payoff",
    "taxes": "/calculators/tax-calculator",
    "savings": "/calculators/budget-planner",
    "loans": "/calculators/loan-calculator",
}


def get_unique_insight(scenario):
    """Generate a unique human-sounding insight for this scenario."""
    category = scenario.get("category", "general")
    computed = scenario.get("computed", {})
    params = scenario.get("params", {})

    insights_pool = INSIGHTS.get(category, DEFAULT_INSIGHTS)
    insight = random.choice(insights_pool)

    # Insert real numbers where placeholders exist
    if "$X" in insight and computed:
        if "monthlyPI" in computed:
            insight = insight.replace("$X/month", f"${computed['monthlyPI']:,.0f}/month")
        if "totalInterest" in computed:
            insight = insight.replace("$X", f"${computed['totalInterest']:,.0f}")
    if "$Z" in insight and "monthlyPI" in computed:
        insight = insight.replace("$Z", f"${computed['monthlyPI']:,.0f}")
    if "X%" in insight and "interestRate" in params:
        insight = insight.replace("X%", f"{params['interestRate']}%")
    if "Y%" in insight and "interestRate" in params:
        refi_rate = max(1, params.get('interestRate', 7) - 1)
        insight = insight.replace("Y%", f"{refi_rate}%")

    return insight


def build_what_this_means(scenario):
    """Build the 'What This Means For You' section."""
    category = scenario.get("category", "general")
    title = scenario.get("title", "")
    computed = scenario.get("computed", {})

    if category == "mortgage" and "monthlyPI" in computed and "totalInterest" in computed:
        return (
            f"For a {title.split(' at ')[0] if ' at ' in title else 'this scenario'}, "
            f"your monthly payment of ${computed['monthlyPI']:,.2f} adds up to "
            f"${computed.get('totalPaid', 0):,.0f} over the full term — with "
            f"${computed['totalInterest']:,.0f} going to interest alone. "
            f"That means only {(computed.get('loanAmount', 0) / computed.get('totalPaid', 1) * 100):.0f}% "
            f"of your payments actually build equity. The rest is the cost of borrowing."
        )
    elif category == "investing" and "finalBalance" in computed:
        return (
            f"If you invest consistently, your ${computed.get('totalContributions', 0):,.0f} "
            f"in contributions grows to ${computed['finalBalance']:,.0f} — that's "
            f"${computed.get('totalGrowth', 0):,.0f} in pure compound growth. "
            f"The key insight: starting early matters more than the amount."
        )
    elif category == "retirement":
        return (
            f"Retirement planning isn't about hitting a magic number — it's about understanding "
            f"your monthly income in retirement. Use this scenario as a baseline, then test "
            f"different contribution levels and retirement ages to find your sweet spot."
        )
    elif category == "debt":
        return (
            f"Debt payoff is a math problem AND a psychology problem. The avalanche method "
            f"(highest interest first) saves the most money, but the snowball method "
            f"(smallest balance first) keeps you motivated. Try both strategies."
        )
    else:
        return (
            f"This calculation gives you a data point — but the real value comes from "
            f"comparing multiple scenarios. Change one variable at a time to see what "
            f"moves the needle most."
        )


def upgrade_scenario(scenario):
    """Add unique content to a single scenario."""
    # Add "What This Means For You"
    scenario["whatThisMeans"] = build_what_this_means(scenario)

    # Add unique insight
    scenario["uniqueInsight"] = get_unique_insight(scenario)

    # Add "Try Next" suggestion
    category = scenario.get("category", "general")
    scenario["tryNext"] = {
        "text": "Try this next calculation",
        "link": NEXT_LINKS.get(category, "/calculators"),
        "reason": "Compare a different scenario to see how the numbers change",
    }

    # Mark as upgraded
    scenario["upgradedAt"] = datetime.utcnow().isoformat()
    scenario["upgraded"] = True

    return scenario


def main():
    # Parse args
    count = 50
    for i, arg in enumerate(sys.argv):
        if arg == '--count' and i + 1 < len(sys.argv):
            count = int(sys.argv[i + 1])
            break
    print(f"═" * 55)
    print(f"  Scenario Uniqueness Upgrader")
    print(f"  Target: {count} scenarios")
    print(f"═" * 55)

    # Load all scenarios from batches
    batch_files = sorted(SCENARIO_DIR.glob("batch-*.json"))
    all_scenarios = []

    for bf in batch_files:
        with open(bf) as f:
            batch = json.load(f)
        if isinstance(batch, list):
            for s in batch:
                s["_batch_file"] = str(bf.name)
                all_scenarios.append(s)

    print(f"\n  Total scenarios found: {len(all_scenarios)}")

    # Prioritize: mortgage, investing, retirement, debt scenarios first
    priority_categories = ["mortgage", "investing", "retirement", "debt", "taxes", "loans", "savings"]
    priority_first = [s for s in all_scenarios if s.get("category") in priority_categories[:4]]
    others = [s for s in all_scenarios if s not in priority_first]

    # Shuffle within priority to keep variety
    random.shuffle(priority_first)
    random.shuffle(others)
    targets = (priority_first + others)[:count]

    # Skip already upgraded
    already = [s for s in targets if s.get("upgraded")]
    targets = [s for s in targets if not s.get("upgraded")]
    print(f"  Already upgraded: {len(already)}")
    print(f"  Upgrading now: {len(targets)}")

    # Upgrade each
    upgraded = []
    for i, scenario in enumerate(targets):
        try:
            upgraded_scenario = upgrade_scenario(scenario)
            upgraded.append(upgraded_scenario)
            if (i + 1) % 10 == 0:
                print(f"  ... {i+1}/{len(targets)}")
        except Exception as e:
            print(f"  ❌ Error on {scenario.get('slug', '?')}: {e}")

    # Write back to batch files (group by original batch file)
    from collections import defaultdict
    batches = defaultdict(list)
    for s in all_scenarios:
        batch_name = s.pop("_batch_file", "unknown.json")
        batches[batch_name].append(s)

    for batch_name, scenarios in batches.items():
        filepath = SCENARIO_DIR / batch_name
        with open(filepath, "w") as f:
            json.dump(scenarios, f, indent=2)

    # Update index if needed
    if INDEX_FILE.exists():
        with open(INDEX_FILE) as f:
            index = json.load(f)
        # Mark upgraded slugs
        upgraded_slugs = {s["slug"] for s in upgraded}
        if isinstance(index, list):
            for entry in index:
                if isinstance(entry, dict) and entry.get("slug") in upgraded_slugs:
                    entry["upgraded"] = True
        elif isinstance(index, dict):
            for slug, entry in index.items():
                if slug in upgraded_slugs:
                    if isinstance(entry, dict):
                        entry["upgraded"] = True
        with open(INDEX_FILE, "w") as f:
            json.dump(index, f, indent=2)

    print(f"\n  ✅ Upgraded {len(upgraded)} scenarios")
    print(f"  Saved to batch files in {SCENARIO_DIR}")

    # Return list of upgraded slugs for indexing
    slugs = [s["slug"] for s in upgraded]
    return slugs


if __name__ == "__main__":
    slugs = main()
    print(f"\n  Upgraded slugs: {len(slugs)}")
    # Print first 10 for reference
    for s in slugs[:10]:
        print(f"    /scenario/{s}")
