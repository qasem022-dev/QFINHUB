#!/usr/bin/env python3
"""
QFINHUB Growth Optimizer v3 — Data Engine
===========================================
Fetches all analytics, compares day-over-day, identifies
improvement targets, and outputs actionable JSON for the LLM agent.

Output: .optimizer-data/growth-briefing.json
"""
import json, os, sys, time, urllib.request, urllib.parse, urllib.error
from pathlib import Path
from datetime import datetime, timedelta

ROOT = Path("/home/admin1/qfinhub")
DATA_DIR = ROOT / ".optimizer-data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE = DATA_DIR / "growth-briefing.json"

TOKEN_FILE = Path.home() / ".hermes" / "google-indexing-token.json"
OAUTH_FILE = Path.home() / ".hermes" / "google-oauth.json"
SITE_URL = "https://www.qfinhub.com"

# ═══════════════════════════════════════
# AUTH
# ═══════════════════════════════════════
def get_access_token():
    with open(TOKEN_FILE) as f:
        token = json.load(f)
    with open(OAUTH_FILE) as f:
        oauth = json.load(f)
    config = oauth.get("installed", oauth.get("web", oauth))

    data = urllib.parse.urlencode({
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
        "refresh_token": token["refresh_token"],
        "grant_type": "refresh_token",
    }).encode()

    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
    with urllib.request.urlopen(req, timeout=15) as resp:
        new_token = json.loads(resp.read())

    token["access_token"] = new_token["access_token"]
    token["expires_in"] = new_token.get("expires_in", 3600)
    with open(TOKEN_FILE, "w") as f:
        json.dump(token, f)
    return new_token["access_token"]


# ═══════════════════════════════════════
# 1. GSC DATA
# ═══════════════════════════════════════
def fetch_gsc_data(token, days=7):
    """Pull GSC search analytics with page+query dimensions."""
    end_date = datetime.utcnow().strftime("%Y-%m-%d")
    start_date = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")

    encoded_site = urllib.parse.quote(SITE_URL, safe="")
    url = f"https://www.googleapis.com/webmasters/v3/sites/{encoded_site}/searchAnalytics/query"

    payload = json.dumps({
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": ["page", "query", "date"],
        "rowLimit": 250,
        "aggregationType": "auto",
    }).encode()

    req = urllib.request.Request(url, data=payload, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            rows = json.loads(resp.read()).get("rows", [])
    except Exception as e:
        print(f"  ⚠️ GSC API error: {e}")
        return {"summary": {}, "daily_trend": [], "low_ctr_targets": [], "top_queries": []}

    # Aggregate data
    pages = {}
    daily = {}
    queries = {}

    for row in rows:
        page = row["keys"][0]
        query = row["keys"][1] if len(row["keys"]) > 1 else ""
        date = row["keys"][2] if len(row["keys"]) > 2 else ""
        clicks = row.get("clicks", 0)
        impr = row.get("impressions", 0)
        pos = row.get("position", 99)

        # Per page
        if page not in pages:
            pages[page] = {"page": page, "clicks": 0, "impressions": 0, "positions": [], "queries": []}
        pages[page]["clicks"] += clicks
        pages[page]["impressions"] += impr
        pages[page]["positions"].append(pos)
        pages[page]["queries"].append({"q": query, "clicks": clicks, "impr": impr, "pos": pos})

        # Daily
        if date:
            if date not in daily:
                daily[date] = {"date": date, "clicks": 0, "impressions": 0, "positions": []}
            daily[date]["clicks"] += clicks
            daily[date]["impressions"] += impr
            daily[date]["positions"].append(pos)

        # Queries
        if query:
            if query not in queries:
                queries[query] = {"query": query, "clicks": 0, "impressions": 0, "position": 99}
            queries[query]["clicks"] += clicks
            queries[query]["impressions"] += impr
            queries[query]["position"] = min(queries[query]["position"], pos)

    # Summary
    total_clicks = sum(p["clicks"] for p in pages.values())
    total_impr = sum(p["impressions"] for p in pages.values())
    all_positions = [p for pg in pages.values() for p in pg["positions"]]
    avg_pos = sum(all_positions) / len(all_positions) if all_positions else 99
    ctr = (total_clicks / total_impr * 100) if total_impr > 0 else 0

    summary = {
        "clicks": total_clicks,
        "impressions": total_impr,
        "ctr": round(ctr, 2),
        "position": round(avg_pos, 1),
        "pages_indexed": len(pages),
        "period_days": days,
    }

    # Daily trend (sorted)
    daily_trend = sorted(daily.values(), key=lambda d: d["date"])
    for d in daily_trend:
        d["position"] = round(sum(d["positions"]) / len(d["positions"]), 1) if d["positions"] else 99
        d["ctr"] = round(d["clicks"] / d["impressions"] * 100, 2) if d["impressions"] > 0 else 0
        del d["positions"]

    # Low CTR targets: >=5 impressions, CTR < 2%, position 11-30 prioritized
    low_ctr = []
    for p in pages.values():
        p_ctr = (p["clicks"] / p["impressions"] * 100) if p["impressions"] > 0 else 0
        p_avg_pos = sum(p["positions"]) / len(p["positions"]) if p["positions"] else 99
        if p["impressions"] >= 5 and p_ctr < 2.0:
            p["ctr"] = round(p_ctr, 2)
            p["avg_position"] = round(p_avg_pos, 1)
            p["priority"] = "HIGH" if 11 <= p_avg_pos <= 30 else "MEDIUM"
            del p["positions"]
            low_ctr.append(p)

    low_ctr.sort(key=lambda p: (-p["impressions"], p["avg_position"]))

    # Top queries (>= 3 impressions, sorted by impressions)
    top_queries = sorted(
        [q for q in queries.values() if q["impressions"] >= 3],
        key=lambda q: -q["impressions"]
    )[:20]

    return {
        "summary": summary,
        "daily_trend": daily_trend,
        "low_ctr_targets": low_ctr[:15],
        "top_queries": top_queries,
    }


# ═══════════════════════════════════════
# 2. GOOGLE TRENDS (via pytrends or RSS)
# ═══════════════════════════════════════
def fetch_google_trends():
    """Fetch trending finance keywords via Google Trends RSS."""
    trends = []
    try:
        # Google Trends RSS for US finance
        url = "https://trends.google.com/trending/rss?geo=US"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            import xml.etree.ElementTree as ET
            tree = ET.parse(resp)
            root = tree.getroot()
            for item in root.findall(".//item")[:30]:
                title = item.find("title").text if item.find("title") is not None else ""
                desc = item.find("description").text if item.find("description") is not None else ""
                # Filter for finance-related
                finance_keywords = [
                    "stock", "market", "fed", "rate", "mortgage", "inflation", "tax",
                    "retire", "401k", "ira", "debt", "loan", "credit", "bank", "money",
                    "invest", "crypto", "bitcoin", "real estate", "housing", "economy",
                    "gdp", "jobs", "unemploy", "interest", "finance", "budget", "save",
                    "insurance", "dollar", "trade", "tariff", "treasury", "bond",
                ]
                if any(kw in title.lower() for kw in finance_keywords):
                    trends.append({"title": title, "description": desc[:200] if desc else ""})
    except Exception as e:
        # Fallback: predefined finance keywords
        trends = [
            {"title": "mortgage rates today 2026", "description": "Trending: mortgage rates"},
            {"title": "retirement planning 2026", "description": "Trending: retirement planning"},
            {"title": "stock market today", "description": "Trending: stock market"},
            {"title": "401k contribution limits 2026", "description": "Trending: 401k"},
            {"title": "tax brackets 2026", "description": "Trending: tax brackets"},
        ]

    # Map trends to our calculator categories
    calculator_map = {
        "mortgage": ["mortgage", "home loan", "housing", "real estate", "refinance", "home", "house", "property"],
        "investing": ["stock", "market", "invest", "crypto", "bitcoin", "bond", "dividend", "trading", "nasdaq", "dow", "sp500", "s&p"],
        "retirement": ["retire", "401k", "ira", "pension", "social security", "ssi"],
        "debt": ["debt", "credit card", "payoff", "snowball", "avalanche", "credit score"],
        "taxes": ["tax", "irs", "deduction", "bracket", "refund", "write-off"],
        "savings": ["save", "budget", "emergency fund", "saving", "frugal", "frugality"],
        "loans": ["loan", "auto loan", "student loan", "personal loan", "car loan", "borrow", "lending"],
        "insurance": ["insurance", "pmi", "life insurance", "health insurance"],
    }

    mapped = []
    for t in trends[:20]:
        title_lower = t["title"].lower()
        matched = []
        for category, keywords in calculator_map.items():
            if any(kw in title_lower for kw in keywords):
                matched.append(category)
        if matched:
            t["calculator_categories"] = matched
            mapped.append(t)

    # ALWAYS add curated high-value finance keywords (ensures we never have zero trends)
    curated = [
        {"title": "mortgage rates june 2026", "calculator_categories": ["mortgage"]},
        {"title": "best retirement accounts 2026", "calculator_categories": ["retirement"]},
        {"title": "how to pay off credit card debt", "calculator_categories": ["debt"]},
        {"title": "compound interest calculator", "calculator_categories": ["investing"]},
        {"title": "tax bracket calculator 2026", "calculator_categories": ["taxes"]},
        {"title": "401k contribution limits", "calculator_categories": ["retirement"]},
        {"title": "home affordability calculator", "calculator_categories": ["mortgage"]},
        {"title": "debt snowball vs avalanche", "calculator_categories": ["debt"]},
        {"title": "emergency fund how much", "calculator_categories": ["savings"]},
        {"title": "auto loan interest rates 2026", "calculator_categories": ["loans"]},
        {"title": "refinance calculator break even", "calculator_categories": ["mortgage"]},
        {"title": "Roth IRA vs traditional 401k", "calculator_categories": ["retirement", "investing"]},
        {"title": "student loan repayment calculator", "calculator_categories": ["loans"]},
        {"title": "budget planner 50 30 20", "calculator_categories": ["savings"]},
        {"title": "investment return calculator", "calculator_categories": ["investing"]},
    ]
    # Blend curated + real trends, deduplicate by title
    seen = {m["title"].lower() for m in mapped}
    for c in curated:
        if c["title"].lower() not in seen:
            mapped.append(c)

    return mapped[:20]


# ═══════════════════════════════════════
# 3. DAY-OVER-DAY COMPARISON
# ═══════════════════════════════════════
def compare_with_yesterday(current_trend):
    """Compare today's metrics with yesterday's. Returns alerts if declining."""
    if len(current_trend) < 2:
        return {"yesterday": None, "delta": {}, "alerts": [], "status": "baseline"}

    yesterday = current_trend[-2]
    today = current_trend[-1] if len(current_trend) > 1 else yesterday

    delta = {
        "impressions": today["impressions"] - yesterday["impressions"],
        "clicks": today["clicks"] - yesterday["clicks"],
        "ctr": round(today.get("ctr", 0) - yesterday.get("ctr", 0), 2),
        "position": round(today.get("position", 99) - yesterday.get("position", 99), 1),
    }

    alerts = []
    if delta["impressions"] < 0:
        alerts.append(f"⚠️ Impressions dropped by {abs(delta['impressions'])} ({yesterday['impressions']} → {today['impressions']})")
    elif delta["impressions"] == 0 and yesterday["impressions"] > 0:
        alerts.append(f"⚠️ Impressions flat at {today['impressions']} — no growth")
    if delta["clicks"] < 0 and yesterday["clicks"] > 0:
        alerts.append(f"⚠️ Clicks dropped")
    elif delta["clicks"] == 0 and yesterday["clicks"] > 0:
        alerts.append(f"⚠️ Clicks flat at {today['clicks']} — no growth")
    if delta["position"] > 0:
        alerts.append(f"⚠️ Avg position worsened by {delta['position']:.1f} (higher = worse)")
    elif delta["position"] == 0 and yesterday.get("position", 99) < 99:
        alerts.append(f"⚠️ Position flat at {today.get('position', 99)} — no improvement")
    if delta["ctr"] <= 0 and today.get("ctr", 0) < 2.0 and today["impressions"] > 0:
        alerts.append(f"⚠️ CTR stagnant at {today.get('ctr', 0)}% — below 2% target")

    status = "ok"
    if len(alerts) >= 3:
        status = "critical"
    elif len(alerts) >= 1:
        status = "warning"

    return {
        "yesterday": yesterday,
        "today": today,
        "delta": delta,
        "alerts": alerts,
        "status": status,
    }


# ═══════════════════════════════════════
# MAIN
# ═══════════════════════════════════════
def main():
    print("═" * 55)
    print("  QFINHUB Growth Optimizer v3 — Data Engine")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("═" * 55)

    # 1. Auth
    print("\n🔑 Authenticating...")
    try:
        token = get_access_token()
        print("  ✅ Token refreshed")
    except Exception as e:
        print(f"  ❌ Auth failed: {e}")
        token = None

    # 2. GSC Data
    print("\n📊 Fetching GSC data (14 days)...")
    gsc_data = fetch_gsc_data(token, days=14) if token else {"summary": {}, "daily_trend": [], "low_ctr_targets": [], "top_queries": []}
    summary = gsc_data.get("summary", {})
    print(f"  Impressions: {summary.get('impressions', 0)} | Clicks: {summary.get('clicks', 0)} | CTR: {summary.get('ctr', 0)}% | Pos: {summary.get('position', 0)}")
    print(f"  Pages indexed: {summary.get('pages_indexed', 0)}")

    # 3. Low CTR targets
    low_ctr = gsc_data.get("low_ctr_targets", [])
    high_priority = [p for p in low_ctr if p.get("priority") == "HIGH"]
    print(f"\n🎯 Low-CTR targets: {len(low_ctr)} total, {len(high_priority)} HIGH priority (pos 11-30)")

    # 4. Google Trends
    print("\n📈 Fetching Google Trends...")
    trends = fetch_google_trends()
    print(f"  Trending finance topics: {len(trends)}")

    # 5. Day-over-day comparison
    print("\n📉 Day-over-day comparison...")
    comparison = compare_with_yesterday(gsc_data.get("daily_trend", []))
    if comparison["alerts"]:
        for alert in comparison["alerts"]:
            print(f"  {alert}")
    print(f"  Status: {comparison['status'].upper()}")

    # 6. Load previous tracking
    tracking_file = DATA_DIR / "daily-tracking.json"
    prev_metrics = {}
    if tracking_file.exists():
        with open(tracking_file) as f:
            tracking = json.load(f)
        history = tracking.get("history", [])
        yesterday_str = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        for h in history:
            if h["date"] == yesterday_str:
                prev_metrics = h.get("gsc", {})
                break

    # 7. Assemble briefing
    briefing = {
        "generated_at": datetime.now().isoformat(),
        "gsc": gsc_data,
        "trends": trends,
        "comparison": comparison,
        "previous_day_gsc": prev_metrics,
        "action_required": comparison["status"] in ("warning", "critical"),
        "action_items": [],
    }

    # Auto-generate action items
    recovery_mode = comparison["status"] in ("warning", "critical")
    
    if recovery_mode:
        briefing["action_items"].append({
            "action": "RECOVERY_MODE",
            "reason": f"Metrics not improving (status={comparison['status']}) — DOUBLING ALL EFFORTS",
            "alerts": comparison["alerts"],
        })
        briefing["action_items"].append({
            "action": "ctr_boost",
            "reason": "Aggressive CTR optimization — rewrite ALL low-CTR page metas (12+ pages)",
            "targets": [p["page"] for p in high_priority[:12]],
            "note": "Also rewrite ALL medium-priority pages. Target 12+ rewrites today.",
        })
        briefing["action_items"].append({
            "action": "scenario_push",
            "reason": "Generate 35-40 scenario pages from trends and top queries",
            "count": 40,
        })
        briefing["action_items"].append({
            "action": "scenario_uniqueness_upgrade",
            "reason": "Upgrade 15+ existing scenario pages with real-life examples, comparison tables, and personalized insights",
            "count": 15,
            "note": "For each: add 'What this means for you', comparison data, and unique takeaway",
        })
        briefing["action_items"].append({
            "action": "outreach_accelerate",
            "reason": "Send 25-30 widget outreach emails for backlink acquisition",
            "count": 30,
        })
        briefing["action_items"].append({
            "action": "haro_double_check",
            "reason": "Check HARO for relevant journalist queries — respond to ALL finance-related queries",
        })

    if high_priority:
        briefing["action_items"].append({
            "action": "ctr_rewrite",
            "reason": f"{len(high_priority)} pages at positions 11-30 with high impressions but zero clicks",
            "pages": [
                {"url": p["page"], "impressions": p["impressions"], "position": p["avg_position"]}
                for p in high_priority[:8]
            ],
        })

    if trends:
        briefing["action_items"].append({
            "action": "trends_content",
            "reason": "Create targeted scenario pages and blog posts from trending finance topics",
            "trends": [{"title": t["title"], "categories": t.get("calculator_categories", [])} for t in trends[:10]],
        })

    # Always include some baseline actions
    briefing["action_items"].append({
        "action": "indexing_push",
        "reason": "Submit new/updated URLs to Google Indexing API",
        "note": "Run scripts/seo-indexing-engine.py",
    })

    # Save
    with open(OUTPUT_FILE, "w") as f:
        json.dump(briefing, f, indent=2)

    print(f"\n✅ Briefing saved: {OUTPUT_FILE}")
    print(f"   Action items: {len(briefing['action_items'])}")
    print(f"   Status: {comparison['status'].upper()}")
    return briefing


if __name__ == "__main__":
    main()
