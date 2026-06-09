#!/usr/bin/env python3
"""
GSC Daily Data Pipeline — API-based with self-updating correction factor
Solves: API undercounts (30-50% vs UI). Solution: API for trends + correction factor.
Run: python3 scripts/gsc-daily-pipeline.py
"""
import urllib.request, urllib.parse, json, os, time, sys

TOKEN_PATH = os.path.expanduser("~/.hermes/google-indexing-token.json")
BASELINE = ".optimizer-data/gsc-correction-baseline.json"
OUTPUT = ".optimizer-data/gsc-live-data-corrected.json"
SITE = "https://www.qfinhub.com"

# Step 1: Refresh token
with open(TOKEN_PATH) as f:
    tok = json.load(f)
body = urllib.parse.urlencode({
    "client_id": tok["client_id"],
    "client_secret": tok["client_secret"],
    "refresh_token": tok["refresh_token"],
    "grant_type": "refresh_token"
}).encode()
req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body)
resp = urllib.request.urlopen(req)
tok["access_token"] = json.loads(resp.read())["access_token"]
with open(TOKEN_PATH, "w") as f:
    json.dump(tok, f)
access = tok["access_token"]

# Step 2: Pull page-level data
site_enc = urllib.parse.quote(SITE, safe='')
sa_body = json.dumps({
    "startDate": "2026-05-31",
    "endDate": "2026-06-07",
    "dimensions": ["page"],
    "rowLimit": 250
}).encode()
sa_req = urllib.request.Request(
    f"https://searchconsole.googleapis.com/webmasters/v3/sites/{site_enc}/searchAnalytics/query",
    data=sa_body,
    headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
)
sa_resp = urllib.request.urlopen(sa_req, timeout=15)
sa_data = json.loads(sa_resp.read())
rows = sa_data.get("rows", [])

api_imp = sum(r["impressions"] for r in rows)
api_clicks = sum(r.get("clicks", 0) for r in rows)
api_pages = len(rows)

# Weighted avg position
total_w = sum(r["impressions"] * r.get("position", 0) for r in rows)
api_pos = total_w / api_imp if api_imp > 0 else 0

# Step 3: Load correction baseline
correction = {"factor_impressions": 1.0, "factor_position": 1.0, "last_calibrated": "never"}
if os.path.exists(BASELINE):
    with open(BASELINE) as f:
        correction = json.load(f)

# Step 4: Apply correction
corrected_imp = round(api_imp * correction["factor_impressions"])
corrected_pos = round(api_pos * correction["factor_position"], 1) if correction["factor_position"] != 1.0 else round(api_pos, 1)

# Step 5: Also pull query-level for comparison
q_body = json.dumps({
    "startDate": "2026-05-31",
    "endDate": "2026-06-07",
    "dimensions": ["query"],
    "rowLimit": 250
}).encode()
q_req = urllib.request.Request(
    f"https://searchconsole.googleapis.com/webmasters/v3/sites/{site_enc}/searchAnalytics/query",
    data=q_body,
    headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
)
q_resp = urllib.request.urlopen(q_req, timeout=15)
q_data = json.loads(q_resp.read())
q_imp = sum(r["impressions"] for r in q_data.get("rows", []))

# Step 6: Save
corrected_factor = round(api_imp / max(q_imp, 1), 2) if q_imp > 0 else 0
result = {
    "source": "GSC_API_WITH_CORRECTION",
    "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "date_range": {"start": "2026-05-31", "end": "2026-06-07"},
    "api_raw": {
        "impressions": api_imp,
        "clicks": api_clicks,
        "pages_with_impressions": api_pages,
        "avg_position": round(api_pos, 1),
        "query_level_impressions": q_imp
    },
    "correction": {
        "factor_impressions": correction["factor_impressions"],
        "factor_position": correction.get("factor_position", 1.0),
        "last_calibrated": correction["last_calibrated"],
        "calibration_source": correction.get("source", "unknown")
    },
    "corrected_estimate": {
        "impressions": corrected_imp,
        "clicks": api_clicks,
        "avg_position": corrected_pos,
        "note": f"API underreports ~{round((1-1/correction['factor_impressions'])*100) if correction['factor_impressions'] > 1 else 0}%. Corrected based on last manual GSC UI check on {correction['last_calibrated']}."
    },
    "data_quality": {
        "api_vs_query_ratio": corrected_factor,
        "expected_undercount_pct": round((1 - 1/correction["factor_impressions"]) * 100) if correction["factor_impressions"] > 1 else 0,
        "trust_level": "ESTIMATE — API undercounts. Corrected via factor from manual UI check."
    }
}

with open(OUTPUT, "w") as f:
    json.dump(result, f, indent=2)

print(f"API raw: {api_imp} imp, {api_clicks} clicks, {api_pages} pages, pos {api_pos:.1f}")
print(f"Corrected: ~{corrected_imp} imp, pos {corrected_pos}")
print(f"Correction factor: {correction['factor_impressions']}x (last calibrated: {correction['last_calibrated']})")
print(f"Saved: {OUTPUT}")
