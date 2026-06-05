#!/usr/bin/env python3
"""Pull GSC Search Analytics — queries and pages with impressions"""
import json, urllib.request, os
from datetime import datetime, timedelta

token_path = os.path.expanduser("~/.hermes/google-indexing-token.json")
with open(token_path) as f:
    tok = json.load(f)
access = tok["access_token"]

end_date = datetime.utcnow().strftime("%Y-%m-%d")
start_date = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")

print(f"=== GSC Search Analytics: {start_date} to {end_date} ===")

# Query query data
body = json.dumps({
    "startDate": start_date,
    "endDate": end_date,
    "dimensions": ["query"],
    "rowLimit": 25,
    "aggregationType": "byPage"
}).encode()

req = urllib.request.Request(
    "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.qfinhub.com%2F/searchAnalytics/query",
    data=body,
    headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
)

try:
    resp = urllib.request.urlopen(req, timeout=15)
    data = json.loads(resp.read())
    rows = data.get("rows", [])
    print(f"\nTop {len(rows)} Queries (7 days):")
    for i, row in enumerate(rows[:15]):
        keys = row["keys"]
        clicks = row.get("clicks", 0)
        impr = row.get("impressions", 0)
        ctr = row.get("ctr", 0)
        pos = row.get("position", 0)
        print(f"  {i+1}. \"{keys[0]}\" — {impr} imp, {clicks} clicks, CTR {ctr:.1%}, pos {pos:.1f}")
except Exception as e:
    print(f"Query error: {e}")

# Page query data
body2 = json.dumps({
    "startDate": start_date,
    "endDate": end_date,
    "dimensions": ["page"],
    "rowLimit": 50,
    "aggregationType": "byPage"
}).encode()

req2 = urllib.request.Request(
    "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.qfinhub.com%2F/searchAnalytics/query",
    data=body2,
    headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
)

try:
    resp2 = urllib.request.urlopen(req2, timeout=15)
    data2 = json.loads(resp2.read())
    rows2 = data2.get("rows", [])
    print(f"\nTop {len(rows2)} Pages by Impressions (7 days):")
    for i, row in enumerate(rows2[:20]):
        keys = row["keys"]
        clicks = row.get("clicks", 0)
        impr = row.get("impressions", 0)
        ctr = row.get("ctr", 0)
        pos = row.get("position", 0)
        slug = keys[0].replace("https://www.qfinhub.com", "")
        print(f"  {i+1}. {slug} — {impr} imp, {clicks} clicks, CTR {ctr:.1%}, pos {pos:.1f}")
    
    # Save for later use
    report = {
        "generated": datetime.utcnow().isoformat(),
        "startDate": start_date,
        "endDate": end_date,
        "queries": [{"query": r["keys"][0], "impressions": r.get("impressions",0), 
                      "clicks": r.get("clicks",0), "ctr": r.get("ctr",0), 
                      "position": r.get("position",0)} for r in rows],
        "pages": [{"page": r["keys"][0].replace("https://www.qfinhub.com",""), 
                    "impressions": r.get("impressions",0), "clicks": r.get("clicks",0), 
                    "ctr": r.get("ctr",0), "position": r.get("position",0)} for r in rows2]
    }
    with open("/home/admin1/qfinhub/.optimizer-data/fresh-gsc-query-discovery-day5.json", "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n✅ Saved: .optimizer-data/fresh-gsc-query-discovery-day5.json")
    
except Exception as e:
    print(f"Page error: {e}")
