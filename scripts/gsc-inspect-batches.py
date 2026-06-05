#!/usr/bin/env python3
"""GSC URL Inspection for Tier 3 Batch 1-3 recheck"""
import urllib.request, json, os, time

token_path = os.path.expanduser("~/.hermes/google-indexing-token.json")
with open(token_path) as f:
    tok = json.load(f)
access = tok["access_token"]

slugs = [
    # Batch 3 (Day 1 — Jun 4 ~22:35)
    "home-equity", "closing-costs", "mortgage-payoff", "biweekly-mortgage",
    "extra-payment", "loan-term", "reverse-mortgage", "heloc-calculator",
    "balloon-payment", "mortgage-points",
    # Batch 1-2 samples
    "basic-calculator", "debt-consolidation", "loan-comparison",
    "lease-vs-buy", "refinance-calculator", "rent-vs-buy",
]

results = []
for slug in slugs:
    url = f"https://www.qfinhub.com/calculators/{slug}"
    body = json.dumps({"inspectionUrl": url, "siteUrl": "https://www.qfinhub.com/"}).encode()
    req = urllib.request.Request(
        "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        data=body,
        headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        insp = data.get("inspectionResult", {})
        idx = insp.get("indexStatusResult", {})
        cov = idx.get("coverageState", "unknown")
        last_crawl = idx.get("lastCrawlTime", "none")
        verdict = idx.get("verdict", "unknown")
        status = "INDEXED" if cov == "Submitted and indexed" else cov
        results.append({"slug": slug, "coverage": status, "lastCrawl": last_crawl[:19] if last_crawl else "none", "verdict": verdict})
        print(f"{slug}: coverage={status} | lastCrawl={last_crawl[:19] if last_crawl else 'none'} | verdict={verdict}")
    except Exception as e:
        results.append({"slug": slug, "error": str(e)})
        print(f"{slug}: ERROR — {e}")
    time.sleep(1)

# Summary
indexed = sum(1 for r in results if r.get("coverage") == "INDEXED")
print(f"\nSummary: {indexed}/{len(results)} indexed")
print(f"Awaiting crawl: {len(results) - indexed}")
